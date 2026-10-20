import * as THREE from 'three'
import { PARAMS } from '../../data/facts'
import type { TaskType } from '../../planner/plan'
import type { DroneMode, FodClass, LogKind, Phase } from '../store'
import type { FodField, FodItem } from '../world/fod'
import { footprint, laneSpacing, LAYOUT, RWY } from '../world/layout'
import type { Station } from '../world/station'

/*
  Görev mantığı (render'dan bağımsız). Tüm süreler simülasyon saniyesidir.

  Tarama düzeni: iki drone aynı yönde ve aralarında hep yarım pist (1.175 m) mesafeyle uçar.
    Drone 1 (İstasyon A, 04 ucu):  -1175 → 0 (z = −L),  0 → −1175 (z = 0),  −1175 → 0 (z = +L)
    Drone 2 (İstasyon B, 22 ucu):      0 → +1175 (z = −L), +1175 → 0 (z = 0),  0 → +1175 (z = +L)
  L = şerit aralığı = 28 m × (1 − %20) = 22,4 m. Böylece drone'lar hiçbir anda pist ortasında karşılaşmaz.

  Pist sağlığı taraması aynı düzeni 10 m irtifada ve 6 şeritle uçar (14 m iz, 11,2 m aralık, 4 m/s).
  Çit devriyesinde her drone çitin yarısını, yaban hayatı devriyesinde pistin bir yarısının çevresini dolaşır.
*/

const ALT = PARAMS.scan.altitude
const SCAN_SPEED = PARAMS.scan.speed
const TRANSIT_SPEED = 12
const TURN_SPEED = 4
const CLIMB_SPEED = 3
const LAND_SPEED = 1.6
const LID_TIME = 8
const PATROL_ALT = 25

type Wp = { p: THREE.Vector3; speed: number; mode: DroneMode; pass?: number; hold?: number; lid?: 'open' | 'close' }
export type Lane = { x0: number; x1: number; z: number }

/** Bir drone'un şeritleri: yarım pist, x0 → x1 yönlerinde sırayla */
function lanesFor(id: 1 | 2, zs: number[]): Lane[] {
  const H = RWY.half
  return zs.map((z, i) =>
    id === 1 ? (i % 2 === 0 ? { x0: -H, x1: 0, z } : { x0: 0, x1: -H, z }) : i % 2 === 0 ? { x0: 0, x1: H, z } : { x0: H, x1: 0, z },
  )
}

export class DroneSim {
  pos: THREE.Vector3
  yaw = 0
  speed = 0
  mode: DroneMode = 'docked'
  battery: number
  plan: Wp[] = []
  idx = 0
  hold = 0
  lanes: Lane[]
  passProgress: number[]
  pass = 0
  active = false
  drift: THREE.Vector3 | null = null

  constructor(
    readonly id: 1 | 2,
    readonly station: Station,
    readonly fodLanes: Lane[],
    battery: number,
  ) {
    this.pos = station.padTop.clone()
    this.battery = battery
    this.yaw = id === 1 ? 0 : Math.PI
    this.lanes = fodLanes
    this.passProgress = fodLanes.map(() => 0)
  }

  get airborne() {
    return this.pos.y > this.station.padTop.y + 0.3
  }
}

export type MissionEvents = {
  log: (kind: LogKind, text: string) => void
  phase: (p: Phase, reason?: string) => void
  detect: (target: DetectTarget, drone: 1 | 2) => void
  hazard: (x: number, z: number, drone: 1 | 2) => void
  breach: (on: boolean) => void
}

export type DetectTarget = { kind: 'fod'; item: FodItem } | { kind: 'artifact'; x: number; z: number }

const CONF: Record<FodClass, [number, number]> = {
  bolt: [0.88, 0.96],
  stone: [0.83, 0.93],
  plastic: [0.9, 0.98],
  tire: [0.86, 0.95],
}
export function confidenceFor(cls: FodClass | 'artifact') {
  if (cls === 'artifact') return 0.4 + Math.random() * 0.14
  const [a, b] = CONF[cls]
  return a + Math.random() * (b - a)
}

export class Mission {
  drones: DroneSim[]
  phase: Phase = 'idle'
  task: TaskType = 'fod'
  abortReason: string | null = null
  artifact: { x: number; z: number; detected: boolean } | null = null
  private pending: { at: number; target: DetectTarget; drone: 1 | 2 }[] = []
  private t = 0
  private phaseTimer = 0
  scanStart: number | null = null
  dockedAt: number | null = null

  constructor(
    stations: Station[],
    private fod: FodField,
    private ev: MissionEvents,
  ) {
    const L = laneSpacing()
    this.drones = [
      new DroneSim(1, stations[0], lanesFor(1, [-L, 0, L]), 96),
      new DroneSim(2, stations[1], lanesFor(2, [-L, 0, L]), 94),
    ]
  }

  /** Taramalı görev mi (kamera izi ve tespit açık)? */
  get scanning() {
    return this.task === 'fod' || this.task === 'opening' || this.task === 'health'
  }

  /** Görevi baştan kur: drone'lar istasyonda, şarjlı. */
  reset(fullCharge = false) {
    this.phase = 'idle'
    this.task = 'fod'
    this.abortReason = null
    this.pending = []
    this.scanStart = null
    this.dockedAt = null
    for (const d of this.drones) {
      d.pos.copy(d.station.padTop)
      d.mode = 'docked'
      d.speed = 0
      d.plan = []
      d.idx = 0
      d.hold = 0
      d.lanes = d.fodLanes
      d.passProgress = d.lanes.map(() => 0)
      d.pass = 0
      d.active = false
      d.drift = null
      d.yaw = d.id === 1 ? 0 : Math.PI
      d.battery = fullCharge ? 100 : d.id === 1 ? 96 : 94
      d.station.close()
      d.station.setStatus('ready')
    }
    this.newArtifact()
    this.ev.breach(false)
  }

  /** Yanlış alarm adayı: pistteki koyu bir lastik izi (her taramada en fazla bir tane) */
  private newArtifact() {
    this.artifact =
      Math.random() < 0.6 ? { x: (Math.random() * 2 - 1) * (RWY.half - 300), z: (Math.random() * 2 - 1) * 12, detected: false } : null
  }

  private bracket(d: DroneSim, body: Wp[]): Wp[] {
    const dock = d.station.padTop.clone()
    const above = dock.clone().setY(body[0]?.p.y ?? ALT)
    return [
      { p: dock.clone(), speed: 0, mode: 'lid', hold: LID_TIME, lid: 'open' },
      { p: above, speed: CLIMB_SPEED, mode: 'takeoff' },
      ...body,
      { p: above.clone(), speed: TRANSIT_SPEED, mode: 'transit' },
      { p: dock.clone(), speed: LAND_SPEED, mode: 'landing' },
      { p: dock.clone(), speed: 0, mode: 'lid', hold: LID_TIME, lid: 'close' },
    ]
  }

  private scanPlan(d: DroneSim, alt: number, speed: number): Wp[] {
    const body: Wp[] = []
    d.lanes.forEach((lane, i) => {
      const start = new THREE.Vector3(lane.x0, alt, lane.z)
      const end = new THREE.Vector3(lane.x1, alt, lane.z)
      if (i === 0) body.push({ p: start, speed: TRANSIT_SPEED, mode: 'transit' })
      body.push({ p: end, speed, mode: 'scan', pass: i })
      const next = d.lanes[i + 1]
      if (next) {
        // yarım daire dönüş: şeridin ucundan dışarı doğru
        const dir = Math.sign(lane.x1 - lane.x0)
        const r = Math.abs(next.z - lane.z) / 2
        const cz = (next.z + lane.z) / 2
        const zs = Math.sign(next.z - lane.z)
        for (let k = 1; k <= 8; k++) {
          const a = (k / 8) * Math.PI
          body.push({ p: new THREE.Vector3(lane.x1 + dir * Math.sin(a) * r, alt, cz - zs * Math.cos(a) * r), speed: TURN_SPEED, mode: 'scan' })
        }
      }
    })
    return this.bracket(d, body)
  }

  private patrolPlan(d: DroneSim, route: [number, number][], speed: number): Wp[] {
    const body: Wp[] = route.map(([x, z], i) => ({
      p: new THREE.Vector3(x, PATROL_ALT, z),
      speed: i === 0 ? TRANSIT_SPEED : speed,
      mode: i === 0 ? 'transit' : 'patrol',
    }))
    return this.bracket(d, body)
  }

  /** Görev türüne göre iki drone'un planını kurar ve başlatır. */
  launch(task: TaskType = 'fod') {
    this.task = task
    this.phase = 'flight'
    this.scanStart = this.t
    this.pending = []
    const F = LAYOUT.fence
    const X0 = F.x0 + 15
    const X1 = F.x1 - 15
    const Z0 = F.z0 + 15
    const Z1 = F.z1 - 15
    for (const d of this.drones) {
      let plan: Wp[]
      if (task === 'health') {
        const L = 11.2 // 10 m irtifada 14 m iz × (1 − %20)
        d.lanes = lanesFor(d.id, [-2.5, -1.5, -0.5, 0.5, 1.5, 2.5].map((k) => k * L))
        d.passProgress = d.lanes.map(() => 0)
        plan = this.scanPlan(d, PARAMS.health.altitude, 4)
      } else if (task === 'fence') {
        d.lanes = []
        d.passProgress = []
        const route: [number, number][] =
          d.id === 1
            ? [
                [0, Z1],
                [X0, Z1],
                [X0, Z0],
                [0, Z0],
              ]
            : [
                [0, Z0],
                [X1, Z0],
                [X1, Z1],
                [0, Z1],
              ]
        plan = this.patrolPlan(d, route, 10)
      } else if (task === 'wildlife') {
        d.lanes = []
        d.passProgress = []
        const H = RWY.half
        const route: [number, number][] =
          d.id === 1
            ? [
                [-H, -70],
                [-80, -70],
                [-80, 70],
                [-H, 70],
              ]
            : [
                [H, 70],
                [80, 70],
                [80, -70],
                [H, -70],
              ]
        plan = this.patrolPlan(d, route, 8)
      } else {
        d.lanes = d.fodLanes
        d.passProgress = d.lanes.map(() => 0)
        plan = this.scanPlan(d, ALT, SCAN_SPEED)
      }
      d.plan = plan
      d.idx = 0
      d.hold = 0
      d.pass = 0
      d.active = true
      d.station.setStatus('busy')
    }
    if (this.scanning) this.newArtifact()
    else this.artifact = null
    this.ev.phase('flight')
    this.ev.log('ok', 'Kalkış: İstasyon A ve B kapakları açılıyor')
  }

  private rthPlan(d: DroneSim): Wp[] {
    const dock = d.station.padTop.clone()
    if (!d.airborne) return [{ p: dock, speed: 0, mode: 'lid', hold: LID_TIME, lid: 'close' }]
    const above = dock.clone().setY(ALT)
    return [
      { p: d.pos.clone().setY(Math.max(d.pos.y, ALT)), speed: CLIMB_SPEED, mode: 'rth' },
      { p: above, speed: TRANSIT_SPEED, mode: 'rth' },
      { p: dock, speed: LAND_SPEED, mode: 'landing' },
      { p: dock.clone(), speed: 0, mode: 'lid', hold: LID_TIME, lid: 'close' },
    ]
  }

  abort(reason: string) {
    if (this.phase !== 'flight' && this.phase !== 'return') return
    this.abortReason = reason
    this.phase = 'return'
    this.pending = []
    for (const d of this.drones) {
      if (d.mode === 'emergency' || d.mode === 'down') continue
      if (!d.active && d.mode === 'docked') continue
      d.plan = this.rthPlan(d)
      d.idx = 0
      d.hold = 0
      d.active = true
      d.drift = null
    }
    this.ev.phase('return', reason)
  }

  /** İletişim/güç kaybı: drone en yakın pist dışı acil iniş noktasına iner. */
  linkLoss(id: 1 | 2) {
    const d = this.drones[id - 1]
    if (!d.airborne || d.mode === 'emergency' || d.mode === 'down') return false
    let best = LAYOUT.emergency[0]
    let bd = Infinity
    for (const p of LAYOUT.emergency) {
      const dist = Math.hypot(p.x - d.pos.x, p.z - d.pos.z)
      if (dist < bd) {
        bd = dist
        best = p
      }
    }
    d.plan = [
      { p: new THREE.Vector3(best.x, Math.max(10, d.pos.y), best.z), speed: 8, mode: 'emergency' },
      { p: new THREE.Vector3(best.x, 0.35, best.z), speed: 2.2, mode: 'emergency' },
    ]
    d.idx = 0
    d.hold = 0
    d.drift = null
    d.mode = 'emergency' // iptal komutu bu drone'un acil iniş rotasını ezmesin
    this.ev.log('alert', `Drone ${id}: komuta bağlantısı kesildi, en yakın acil iniş noktasına iniyor (${Math.round(bd)} m)`)
    this.abort(`Drone ${id} iletişim kaybı`)
    return true
  }

  /** Ani rüzgâr: drone'u yanal olarak sanal sınırın dışına doğru iter. */
  gust(id: 1 | 2) {
    const d = this.drones[id - 1]
    if (!d.airborne || this.phase !== 'flight') return false
    d.drift = new THREE.Vector3(0, 0, d.pos.z >= 0 ? 9 : -9)
    this.ev.log('warn', `Drone ${id}: ani yan rüzgâr, rotadan sapıyor`)
    return true
  }

  /** İstasyonda şarj: %20 → %90, 32 dakikada */
  charge(dt: number) {
    for (const d of this.drones) if (!d.active && d.mode === 'docked') d.battery = Math.min(100, d.battery + (dt / 60) * (70 / 32))
  }

  coverage() {
    let sum = 0
    let n = 0
    for (const d of this.drones) {
      sum += d.passProgress.reduce((a, b) => a + b, 0)
      n += d.passProgress.length
    }
    return n ? sum / n : 0
  }

  private stepDrone(d: DroneSim, dt: number) {
    if (!d.active) return
    // batarya: motorlar çalışırken
    if (d.mode !== 'docked' && d.mode !== 'lid' && d.mode !== 'down') d.battery = Math.max(0, d.battery - dt * (0.034 + 0.0012 * d.speed))

    if (d.drift) {
      d.pos.addScaledVector(d.drift, dt)
      const G = LAYOUT.geofence
      if (d.pos.z > G.z1 || d.pos.z < G.z0 || d.pos.x < G.x0 || d.pos.x > G.x1) {
        d.drift = null
        this.ev.breach(true)
        this.ev.log('alert', `Drone ${d.id}: sanal sınır aşıldı, otomatik eve dönüş`)
        this.abort(`Drone ${d.id} sanal sınırı aştı`)
      }
      return
    }

    const wp = d.plan[d.idx]
    if (!wp) {
      if (d.mode === 'emergency') {
        d.mode = 'down'
        d.speed = 0
        d.active = false
        this.ev.hazard(d.pos.x, d.pos.z, d.id)
        this.ev.log('alert', `Drone ${d.id} pist dışına indi; konumu kuleye FOD olarak bildirildi`)
      } else {
        d.mode = 'docked'
        d.speed = 0
        d.active = false
        d.station.setStatus('ready')
      }
      return
    }

    d.mode = wp.mode
    if (wp.hold !== undefined) {
      if (d.hold === 0) {
        if (wp.lid === 'open') d.station.open()
        else d.station.close()
      }
      d.hold += dt
      d.speed = 0
      if (d.hold >= wp.hold) {
        d.hold = 0
        d.idx++
      }
      return
    }

    const to = wp.p.clone().sub(d.pos)
    const dist = to.length()
    // hız: hedef hıza yumuşak geçiş
    d.speed += Math.sign(wp.speed - d.speed) * Math.min(Math.abs(wp.speed - d.speed), dt * 2.5)
    const step = Math.max(0.2, d.speed) * dt
    const horiz = Math.hypot(to.x, to.z)
    if (horiz > 0.5) {
      const targetYaw = Math.atan2(to.z, to.x)
      let dy = targetYaw - d.yaw
      while (dy > Math.PI) dy -= Math.PI * 2
      while (dy < -Math.PI) dy += Math.PI * 2
      d.yaw += Math.sign(dy) * Math.min(Math.abs(dy), dt * 2.2)
    }
    if (dist <= step) {
      d.pos.copy(wp.p)
      if (wp.pass !== undefined) d.passProgress[wp.pass] = 1
      d.idx++
    } else {
      d.pos.addScaledVector(to, step / dist)
      if (wp.pass !== undefined) {
        const lane = d.lanes[wp.pass]
        d.pass = wp.pass + 1
        d.passProgress[wp.pass] = Math.min(1, Math.abs(d.pos.x - lane.x0) / Math.abs(lane.x1 - lane.x0))
      }
    }
  }

  private detect(d: DroneSim) {
    if (this.phase !== 'flight' || !this.scanning || d.mode !== 'scan') return
    const fp = footprint(d.pos.y)
    if (d.pos.y < 8) return
    const fx = Math.cos(d.yaw)
    const fz = Math.sin(d.yaw)
    const inView = (x: number, z: number) => {
      const rx = x - d.pos.x
      const rz = z - d.pos.z
      const along = rx * fx + rz * fz
      const across = -rx * fz + rz * fx
      return Math.abs(along) <= fp.along / 2 && Math.abs(across) <= fp.across / 2
    }
    for (const it of this.fod.items) {
      if (it.detected) continue
      if (inView(it.x, it.z)) {
        it.detected = true
        this.pending.push({ at: this.t + 0.5, target: { kind: 'fod', item: it }, drone: d.id })
      }
    }
    const a = this.artifact
    if (a && !a.detected && inView(a.x, a.z)) {
      a.detected = true
      this.pending.push({ at: this.t + 0.6, target: { kind: 'artifact', x: a.x, z: a.z }, drone: d.id })
    }
  }

  update(dt: number) {
    this.t += dt
    this.charge(dt)
    for (const d of this.drones) {
      this.stepDrone(d, dt)
      this.detect(d)
    }
    if (this.pending.length) {
      const due = this.pending.filter((p) => p.at <= this.t)
      this.pending = this.pending.filter((p) => p.at > this.t)
      for (const p of due) this.ev.detect(p.target, p.drone)
    }

    const allHome = this.drones.every((d) => !d.active && (d.mode === 'docked' || d.mode === 'down'))
    if (this.phase === 'flight' && allHome) {
      this.phase = 'verify'
      this.phaseTimer = 0
      this.dockedAt = this.t
      this.ev.phase('verify')
      this.ev.log('ok', 'İki drone da istasyonda, kapaklar kapalı: dönüş doğrulandı')
    } else if (this.phase === 'return' && allHome) {
      this.phase = 'aborted'
      this.ev.phase('aborted', this.abortReason ?? undefined)
    } else if (this.phase === 'verify') {
      this.phaseTimer += dt
      if (this.phaseTimer > 3) {
        this.phase = 'report'
        this.phaseTimer = 0
        this.ev.phase('report')
      }
    }
  }

  get time() {
    return this.t
  }
}
