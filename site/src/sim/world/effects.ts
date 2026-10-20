import * as THREE from 'three'
import { glowTexture } from './textures'

/*
  Acil durum ve kış sahneleri için temsili efektler: yangın, duman, kişi, kurtarma aracı, kuş sürüsü,
  pist çatlağı, sızıntı, uyarı çizgisi ve uçak üstündeki buz bölgeleri. Hepsi kodla üretilir, dış dosya yok.
*/

const glow = glowTexture()

function sprite(color: string, size: number, additive = true) {
  const s = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: glow, color, transparent: true, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending }),
  )
  s.scale.setScalar(size)
  return s
}

export interface Effect {
  group: THREE.Object3D
  update(dt: number, t: number): void
}

/** Alev ve yukarı yükselen duman; ışık titrer. */
export class Fire implements Effect {
  group = new THREE.Group()
  private flames: THREE.Mesh[] = []
  private puffs: { s: THREE.Sprite; age: number; life: number; v: THREE.Vector3 }[] = []
  private light = new THREE.PointLight('#ff7a1a', 60, 60, 1.6)
  private emit = 0

  constructor(
    pos: THREE.Vector3,
    private scale = 1,
    private smokeOnly = false,
  ) {
    this.group.position.copy(pos)
    if (!smokeOnly) {
      for (let i = 0; i < 4; i++) {
        const m = new THREE.Mesh(
          new THREE.ConeGeometry(0.9 * scale, 3.2 * scale, 10, 1, true),
          new THREE.MeshBasicMaterial({ color: i % 2 ? '#ffb347' : '#ff5a1f', transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }),
        )
        m.position.set((Math.random() - 0.5) * 1.4 * scale, 1.5 * scale, (Math.random() - 0.5) * 1.4 * scale)
        this.flames.push(m)
        this.group.add(m)
      }
      this.light.position.y = 2 * scale
      this.group.add(this.light, sprite('#ff8a30', 9 * scale))
    }
  }

  update(dt: number, t: number) {
    this.flames.forEach((f, i) => {
      const k = 0.75 + Math.abs(Math.sin(t * (9 + i * 2.3) + i)) * 0.5
      f.scale.set(1 / Math.sqrt(k), k, 1 / Math.sqrt(k))
      f.rotation.y += dt * (1 + i)
    })
    this.light.intensity = this.smokeOnly ? 0 : 45 + Math.sin(t * 17) * 15
    this.emit += dt
    const every = this.smokeOnly ? 0.18 : 0.3
    while (this.emit > every) {
      this.emit -= every
      const s = sprite('#33363b', 4 * this.scale, false)
      ;(s.material as THREE.SpriteMaterial).opacity = 0.5
      s.position.set((Math.random() - 0.5) * 2 * this.scale, 3 * this.scale, (Math.random() - 0.5) * 2 * this.scale)
      this.group.add(s)
      // duman dikey yükselir, hafifçe sürüklenir (kameranın önüne yayılıp sahneyi pusa boğmasın)
      this.puffs.push({ s, age: 0, life: this.smokeOnly ? 9 : 6, v: new THREE.Vector3(0.6 + Math.random() * 0.5, 3 + Math.random(), 0.3) })
    }
    for (const p of this.puffs) {
      p.age += dt
      p.s.position.addScaledVector(p.v, dt * this.scale)
      const k = p.age / p.life
      p.s.scale.setScalar(this.scale * (4 + k * 10))
      ;(p.s.material as THREE.SpriteMaterial).opacity = 0.5 * (1 - k)
    }
    for (const p of this.puffs.filter((x) => x.age > x.life)) {
      this.group.remove(p.s)
      p.s.material.dispose()
    }
    this.puffs = this.puffs.filter((x) => x.age <= x.life)
  }
}

/** Basit insan figürü; isteğe bağlı termal parıltı (gece araması). */
export class Person implements Effect {
  group = new THREE.Group()
  private glowS: THREE.Sprite | null = null
  private path: THREE.Vector3[]
  private speed: number
  private seg = 0

  constructor(path: THREE.Vector3[], speed = 1.3, opts: { lying?: boolean; thermal?: boolean; color?: string } = {}) {
    const mat = new THREE.MeshStandardMaterial({ color: opts.color ?? '#2f3b52', roughness: 0.8 })
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.32, 1.2, 10), mat)
    body.position.y = 0.9
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 10), new THREE.MeshStandardMaterial({ color: '#d9b08c', roughness: 0.7 }))
    head.position.y = 1.72
    const legs = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.5, 0.25), mat)
    legs.position.y = 0.25
    const fig = new THREE.Group()
    fig.add(body, head, legs)
    fig.scale.setScalar(2.2) // görünürlük için büyütülmüş
    if (opts.lying) fig.rotation.z = Math.PI / 2
    fig.traverse((o) => ((o as THREE.Mesh).castShadow = true))
    this.group.add(fig)
    if (opts.thermal) {
      this.glowS = sprite('#ffd27a', 9)
      this.glowS.position.y = 1.5
      this.group.add(this.glowS)
    }
    this.path = path
    this.speed = speed
    this.group.position.copy(path[0])
  }

  update(dt: number, t: number) {
    if (this.glowS) (this.glowS.material as THREE.SpriteMaterial).opacity = 0.6 + Math.sin(t * 3) * 0.25
    const to = this.path[this.seg + 1]
    if (!to) return
    const d = to.clone().sub(this.group.position)
    const step = this.speed * dt
    if (d.length() <= step) {
      this.group.position.copy(to)
      this.seg++
    } else {
      this.group.position.addScaledVector(d.normalize(), step)
      this.group.rotation.y = -Math.atan2(d.z, d.x)
    }
  }
}

/** Kurtarma ve yangınla mücadele aracı ya da güvenlik aracı: yol üzerinde, belirli sürede varır. */
export class Responder implements Effect {
  group = new THREE.Group()
  private beacon: THREE.Sprite
  private pts: THREE.Vector3[]
  private lens: number[] = []
  private total = 0
  private startT: number
  private arriveT: number
  arrived = false

  constructor(path: THREE.Vector3[], startT: number, arriveT: number, kind: 'arff' | 'security') {
    const red = kind === 'arff'
    const body = new THREE.Mesh(new THREE.BoxGeometry(red ? 9 : 4.8, red ? 3 : 1.5, red ? 2.8 : 2), new THREE.MeshStandardMaterial({ color: red ? '#c62828' : '#eef1f4', roughness: 0.5 }))
    body.position.y = red ? 1.9 : 1
    body.castShadow = true
    const cab = new THREE.Mesh(new THREE.BoxGeometry(red ? 2.2 : 2.2, red ? 1.2 : 0.8, red ? 2.7 : 1.9), new THREE.MeshStandardMaterial({ color: '#1d1d1b', roughness: 0.3 }))
    cab.position.set(red ? 3.2 : 0, red ? 3.2 : 1.9, 0)
    this.beacon = sprite(red ? '#ff3b30' : '#3a8cd2', 5)
    this.beacon.position.set(red ? 3.2 : 0, red ? 4 : 2.6, 0)
    this.group.add(body, cab, this.beacon)
    if (red) {
      const monitor = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 1.4), new THREE.MeshStandardMaterial({ color: '#d0d4d8' }))
      monitor.position.set(-2, 3.8, 0)
      monitor.rotation.z = 1.1
      this.group.add(monitor)
    }
    this.pts = path
    for (let i = 1; i < path.length; i++) {
      const l = path[i].distanceTo(path[i - 1])
      this.lens.push(l)
      this.total += l
    }
    this.startT = startT
    this.arriveT = arriveT
    this.group.position.copy(path[0])
    this.group.visible = false
  }

  /** t: sahne saati (simülasyon saniyesi) */
  at(t: number, realT: number) {
    ;(this.beacon.material as THREE.SpriteMaterial).opacity = Math.sin(realT * 12) > 0 ? 1 : 0.15
    if (t < this.startT) return
    this.group.visible = true
    const k = Math.min(1, (t - this.startT) / (this.arriveT - this.startT))
    let d = k * this.total
    for (let i = 0; i < this.lens.length; i++) {
      if (d <= this.lens[i] || i === this.lens.length - 1) {
        const a = this.pts[i]
        const b = this.pts[i + 1]
        const f = Math.min(1, d / this.lens[i])
        this.group.position.lerpVectors(a, b, f)
        this.group.rotation.y = -Math.atan2(b.z - a.z, b.x - a.x)
        break
      }
      d -= this.lens[i]
    }
    this.arrived = k >= 1
  }

  update() {}
}

/** Kuş sürüsü: kanat çırpar; yaklaşan bekçiden kaçar. */
export class Flock implements Effect {
  group = new THREE.Group()
  private birds: { m: THREE.Mesh; v: THREE.Vector3; ph: number }[] = []
  threat: THREE.Vector3 | null = null

  constructor(center: THREE.Vector3, n = 16) {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, -0.6, 0, -1.2, 0.3, 0, 0, 0, 0, 0, 0.3, 0, 0, -0.6, 0, 1.2], 3))
    const mat = new THREE.MeshBasicMaterial({ color: '#1d1d1b', side: THREE.DoubleSide })
    for (let i = 0; i < n; i++) {
      const m = new THREE.Mesh(geo, mat)
      m.scale.setScalar(1.8)
      m.position.set(center.x + (Math.random() - 0.5) * 50, 8 + Math.random() * 10, center.z + (Math.random() - 0.5) * 40)
      this.group.add(m)
      this.birds.push({ m, v: new THREE.Vector3((Math.random() - 0.5) * 3, 0, (Math.random() - 0.5) * 3), ph: Math.random() * 6 })
    }
  }

  update(dt: number, t: number) {
    const c = new THREE.Vector3()
    this.birds.forEach((b) => c.add(b.m.position))
    c.multiplyScalar(1 / this.birds.length)
    for (const b of this.birds) {
      const toC = c.clone().sub(b.m.position).multiplyScalar(0.15)
      b.v.addScaledVector(toC, dt)
      if (this.threat && b.m.position.distanceTo(this.threat) < 140) {
        // bekçiden uzaklaş, pistten dışarı (+z değil, çitin dışına doğru −z)
        const away = b.m.position.clone().sub(this.threat).setY(0).normalize()
        b.v.addScaledVector(away.add(new THREE.Vector3(0, 0, -0.6)), dt * 14)
        b.v.y += dt * 2
      } else b.v.y += (12 - b.m.position.y) * dt * 0.3
      b.v.clampLength(0, this.threat ? 16 : 5)
      b.m.position.addScaledVector(b.v, dt)
      b.m.rotation.y = -Math.atan2(b.v.z, b.v.x)
      b.m.scale.y = 1.8 * (0.4 + Math.abs(Math.sin(t * 11 + b.ph)))
    }
  }
}

/** Pistte deprem çatlakları */
export function cracks(points: THREE.Vector3[]) {
  const g = new THREE.Group()
  const mat = new THREE.MeshBasicMaterial({ color: '#141414', polygonOffset: true, polygonOffsetFactor: -4 })
  for (const p of points) {
    let x = p.x
    let z = p.z - 14
    for (let i = 0; i < 9; i++) {
      const nx = x + (Math.random() - 0.5) * 6
      const nz = z + 3.4
      const len = Math.hypot(nx - x, nz - z)
      const m = new THREE.Mesh(new THREE.PlaneGeometry(len, 0.35 + Math.random() * 0.3).rotateX(-Math.PI / 2), mat)
      m.position.set((x + nx) / 2, 0.1, (z + nz) / 2)
      m.rotation.y = -Math.atan2(nz - z, nx - x)
      g.add(m)
      x = nx
      z = nz
    }
  }
  return g
}

/** Büyüyen sızıntı lekesi */
export class Puddle implements Effect {
  group: THREE.Mesh
  private r = 0.5
  constructor(pos: THREE.Vector3, private grow = 0.08, private max = 9) {
    this.group = new THREE.Mesh(
      new THREE.CircleGeometry(1, 28).rotateX(-Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: '#15171a', roughness: 0.15, metalness: 0.6, transparent: true, opacity: 0.85, polygonOffset: true, polygonOffsetFactor: -4 }),
    )
    this.group.position.copy(pos).setY(0.12)
  }
  update(dt: number) {
    this.r = Math.min(this.max, this.r + this.grow * dt)
    this.group.scale.set(this.r * 1.3, 1, this.r)
  }
}

/** Nöbetçiden (ya da RF izleyiciden) olaya uzanan, nabız gibi atan uyarı çizgisi ve halkası. */
export class AlertLink implements Effect {
  group = new THREE.Group()
  private line: THREE.Line
  private ring: THREE.Mesh
  private age = 0

  constructor(from: THREE.Vector3, to: THREE.Vector3, color = '#e0384f', private life = 30) {
    this.line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([from, to.clone().setY(Math.max(1, to.y))]),
      new THREE.LineDashedMaterial({ color, dashSize: 6, gapSize: 4, transparent: true, opacity: 0.95 }),
    )
    this.line.computeLineDistances()
    this.ring = new THREE.Mesh(new THREE.RingGeometry(1.2, 1.6, 32), new THREE.MeshBasicMaterial({ color, transparent: true, side: THREE.DoubleSide, depthWrite: false }))
    this.ring.position.copy(from)
    this.ring.lookAt(to)
    const dot = sprite(color, 6)
    dot.position.copy(from)
    this.group.add(this.line, this.ring, dot)
  }

  update(dt: number, t: number) {
    this.age += dt
    const fade = Math.max(0, 1 - Math.max(0, this.age - this.life + 3) / 3)
    ;(this.line.material as THREE.LineDashedMaterial).opacity = 0.95 * fade
    const k = (t * 1.5) % 1
    this.ring.scale.setScalar(1 + k * 3)
    ;(this.ring.material as THREE.MeshBasicMaterial).opacity = (1 - k) * fade
    this.group.visible = fade > 0
  }
}

/**
  Park eden uçağın buz/kırağı haritası: kanat üstü, yatay stabilizör ve gövde üstünde mor bölgeler.
  Uçak grubunun yerel koordinatlarında (burun +x); bakıcı geçtikçe bölgeler belirginleşir.
*/
export class IceZones implements Effect {
  group = new THREE.Group()
  private zones: { m: THREE.Mesh; x: number; reveal: number }[] = []

  constructor() {
    const mat = () => new THREE.MeshBasicMaterial({ color: '#a987e0', transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -6 })
    // dört köşeli bölge (yerel x, y, z); y kanadın dihedral açısını izler
    const quad = (pts: [number, number, number][], x: number) => {
      const g = new THREE.BufferGeometry()
      g.setAttribute('position', new THREE.Float32BufferAttribute(pts.flat(), 3))
      g.setIndex([0, 1, 2, 0, 2, 3])
      const m = new THREE.Mesh(g, mat())
      this.group.add(m)
      this.zones.push({ m, x, reveal: 0 })
    }
    const wingY = (z: number) => 3.5 + 0.05 * Math.abs(z) // kanat üst yüzeyi + küçük pay
    for (const s of [-1, 1]) {
      // kanat üstü: hücum kenarı ile firar kenarı arasında, ok açısını izleyen dörtgen
      quad(
        [
          [1.0, wingY(3.6), s * 3.6],
          [-2.3, wingY(14.5), s * 14.5],
          [-4.3, wingY(14.5), s * 14.5],
          [-3.7, wingY(3.6), s * 3.6],
        ],
        0,
      )
      // yatay stabilizör
      quad(
        [
          [-14.9, 5.3, s * 1.4],
          [-17.4, 5.3, s * 5.6],
          [-18.2, 5.3, s * 5.6],
          [-17.8, 5.3, s * 1.4],
        ],
        -16,
      )
    }
    // gövde üstü
    quad(
      [
        [6, 6.28, -0.7],
        [-9, 6.28, -0.7],
        [-9, 6.28, 0.7],
        [6, 6.28, 0.7],
      ],
      -2,
    )
  }

  /** k: 0..1 haritalama ilerlemesi (önce kanatlar, sonra gövde ve stabilizör) */
  setProgress(k: number) {
    this.zones.forEach((z, i) => (z.reveal = Math.max(z.reveal, Math.min(1, k * 3 - i * 0.35))))
  }

  update(_dt: number, t: number) {
    for (const z of this.zones) (z.m.material as THREE.MeshBasicMaterial).opacity = z.reveal * (0.55 + Math.sin(t * 2 + z.x) * 0.1)
  }
}

/** RF izleyiciden yayılan halkalar (izinsiz drone) */
export class RfWaves implements Effect {
  group = new THREE.Group()
  private rings: THREE.Mesh[] = []
  constructor(pos: THREE.Vector3, color = '#5aaaf0') {
    for (let i = 0; i < 3; i++) {
      const r = new THREE.Mesh(new THREE.RingGeometry(0.94, 1, 48).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color, transparent: true, depthWrite: false, side: THREE.DoubleSide }))
      r.position.copy(pos).setY(6)
      this.rings.push(r)
      this.group.add(r)
    }
  }
  update(_dt: number, t: number) {
    this.rings.forEach((r, i) => {
      const k = (t * 0.5 + i / 3) % 1
      r.scale.setScalar(5 + k * 260)
      ;(r.material as THREE.MeshBasicMaterial).opacity = 0.5 * (1 - k)
    })
  }
}
