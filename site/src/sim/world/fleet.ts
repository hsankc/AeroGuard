import * as THREE from 'three'
import { buildAirliner } from './aircraft'
import { LAYOUT, RWY } from './layout'

/*
  Günü oynatırken ticari hareketlerin animasyonu (pist 04 kullanımda, rüzgâr güneybatıdan).
  Geliş:  3° süzülüş → 04 eşiğinden 400 m sonra teker koyma → yavaşlama → taksi yolu → apron.
  Kalkış: geri itme → taksi → piste giriş → 04 ucuna geri taksi → 180° dönüş → kalkış koşusu.
  Kalkışta uçak piste hareket saatinden ≈3,5 dk önce girer; drone taraması hareketten en az 5 dk önce bitmiştir.
*/

type Key = { t: number; x: number; y: number; z: number; yaw: number; pitch?: number }
type Stand = { x: number; z: number }

const STANDS: Stand[] = [
  { x: LAYOUT.apron.x - 100, z: LAYOUT.apron.z - 12 },
  { x: LAYOUT.apron.x + 100, z: LAYOUT.apron.z - 12 },
  { x: LAYOUT.apron.x, z: LAYOUT.apron.z - 12 },
]

const deg = (d: number) => (d * Math.PI) / 180
const TX = LAYOUT.taxiway.x
const TD = -RWY.half + 400 // teker koyma noktası
const GLIDE = Math.tan(deg(3))

function arrivalKeys(T: number, s: Stand): Key[] {
  return [
    { t: T - 150, x: TD - 150 * 72, y: 150 * 72 * GLIDE, z: 0, yaw: 0, pitch: deg(3) },
    { t: T, x: TD, y: 0, z: 0, yaw: 0, pitch: deg(4) },
    { t: T + 8, x: TD + 520, y: 0, z: 0, yaw: 0, pitch: 0 },
    { t: T + 30, x: TX - 30, y: 0, z: 0, yaw: 0 },
    { t: T + 38, x: TX, y: 0, z: -12, yaw: deg(-90) },
    { t: T + 62, x: TX, y: 0, z: LAYOUT.apron.z + LAYOUT.apron.d / 2 + 5, yaw: deg(-90) },
    { t: T + 76, x: s.x, y: 0, z: s.z + 30, yaw: deg(-90) },
    { t: T + 90, x: s.x, y: 0, z: s.z, yaw: deg(-90) },
  ]
}

function departureKeys(T: number, s: Stand): Key[] {
  return [
    { t: T - 340, x: s.x, y: 0, z: s.z, yaw: deg(-90) },
    { t: T - 320, x: s.x, y: 0, z: s.z + 26, yaw: deg(-90) }, // geri itme
    { t: T - 305, x: s.x, y: 0, z: s.z + 30, yaw: deg(90) },
    { t: T - 285, x: TX, y: 0, z: LAYOUT.apron.z + LAYOUT.apron.d / 2 + 5, yaw: deg(90) },
    { t: T - 250, x: TX, y: 0, z: LAYOUT.holdLine - 6, yaw: deg(90) }, // bekleme noktası
    { t: T - 215, x: TX, y: 0, z: LAYOUT.holdLine - 6, yaw: deg(90) },
    { t: T - 200, x: TX - 15, y: 0, z: 0, yaw: deg(180) }, // piste giriş
    { t: T - 80, x: -RWY.half + 40, y: 0, z: 0, yaw: deg(180) }, // geri taksi
    { t: T - 45, x: -RWY.half + 20, y: 0, z: 0, yaw: deg(360) }, // dönüş
    { t: T, x: -RWY.half + 25, y: 0, z: 0, yaw: deg(360) },
    { t: T + 34, x: 380, y: 0, z: 0, yaw: deg(360), pitch: 0 },
    { t: T + 42, x: 1000, y: 30, z: 0, yaw: deg(360), pitch: deg(9) },
    { t: T + 120, x: 7400, y: 950, z: 0, yaw: deg(360), pitch: deg(8) },
  ]
}

function sample(keys: Key[], t: number) {
  if (t <= keys[0].t) return keys[0]
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i]
    const b = keys[i + 1]
    if (t <= b.t) {
      const k = (t - a.t) / Math.max(1e-6, b.t - a.t)
      // yumuşak geçiş
      const s = k * k * (3 - 2 * k)
      return {
        t,
        x: a.x + (b.x - a.x) * s,
        y: a.y + (b.y - a.y) * s,
        z: a.z + (b.z - a.z) * s,
        yaw: a.yaw + (b.yaw - a.yaw) * s,
        pitch: (a.pitch ?? 0) + ((b.pitch ?? 0) - (a.pitch ?? 0)) * s,
      }
    }
  }
  return keys[keys.length - 1]
}

type Plane = { obj: THREE.Group; stand: Stand; arr: Key[] | null; dep: Key[] | null; arrT: number | null; depT: number | null }

export type FleetMove = { t: number; kind: 'arr' | 'dep'; label: string }

export class AircraftFleet {
  group = new THREE.Group()
  private planes: Plane[] = []

  /** Hareketleri uçaklarla eşleştirir: her geliş bir uçağı park eder, her kalkış en eski park edeni kullanır. */
  build(moves: FleetMove[]) {
    this.clear()
    const parked: Plane[] = []
    const free = [...STANDS]
    const sorted = [...moves].sort((a, b) => a.t - b.t)
    const make = (stand: Stand): Plane => {
      const a = buildAirliner()
      a.group.traverse((o) => {
        if ((o as THREE.Mesh).isMesh) o.castShadow = true
      })
      this.group.add(a.group)
      const p: Plane = { obj: a.group, stand, arr: null, dep: null, arrT: null, depT: null }
      this.planes.push(p)
      return p
    }
    for (const m of sorted) {
      if (m.kind === 'arr') {
        const stand = free.shift() ?? STANDS[this.planes.length % STANDS.length]
        const p = make(stand)
        p.arrT = m.t
        p.arr = arrivalKeys(m.t, stand)
        parked.push(p)
      } else {
        let p = parked.shift()
        if (!p) p = make(free.shift() ?? STANDS[0]) // günün başından beri apronda bekleyen uçak
        p.depT = m.t
        p.dep = departureKeys(m.t, p.stand)
        free.push(p.stand)
      }
    }
  }

  clear() {
    for (const p of this.planes) this.group.remove(p.obj)
    this.planes = []
  }

  /** Pistte veya yaklaşmada olan uçak var mı (etiket ve kamera için) */
  active(clock: number) {
    return this.planes.find(
      (p) => (p.arrT !== null && clock > p.arrT - 150 && clock < p.arrT + 40) || (p.depT !== null && clock > p.depT - 200 && clock < p.depT + 120),
    )?.obj
  }

  update(clock: number) {
    for (const p of this.planes) {
      let k: Key | null = null
      if (p.arr && p.arrT !== null && clock < p.arrT - 150) k = null
      else if (p.dep && p.depT !== null && clock > p.depT + 120) k = null
      else if (p.arr && p.arrT !== null && clock <= p.arrT + 90) k = sample(p.arr, clock)
      else if (p.dep && p.depT !== null && clock >= p.depT - 340) k = sample(p.dep, clock)
      else k = { t: clock, x: p.stand.x, y: 0, z: p.stand.z, yaw: deg(-90) }
      p.obj.visible = !!k
      if (!k) continue
      p.obj.position.set(k.x, k.y, k.z)
      p.obj.rotation.set(0, -k.yaw, 0)
      p.obj.rotateZ(k.pitch ?? 0)
      const beacon = p.obj.userData.beacon as THREE.Sprite | undefined
      if (beacon) (beacon.material as THREE.SpriteMaterial).opacity = (clock * 1.2) % 1 < 0.15 ? 1 : 0.1
    }
  }
}
