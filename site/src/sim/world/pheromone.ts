import * as THREE from 'three'

/*
  Feromon katmanı (stigmerji): kovanın ortak haritası dijital ikizde parlayan altıgen işaretler olarak görünür.
  - Nesne: kâşifin bulduğu cisim; kaldırılana kadar nabız gibi atar, kaldırılınca yeşile döner ve söner.
  - İz: bekçinin devriye boyunca bıraktığı soluk işaretler; zamanla buharlaşır ("burası yakın zamanda tarandı").
  - Sallanma dansı: kâşiften işçinin peteğine uzanan, üzerinde ışık akan bağlantı (konum paylaşımı).
*/

type Kind = 'fod' | 'cleared' | 'trail'
type Mark = { mesh: THREE.Mesh; kind: Kind; id?: number; age: number; ttl: number; base: number }
type Waggle = { line: THREE.Line; dot: THREE.Sprite; from: THREE.Vector3; to: THREE.Vector3; age: number; ttl: number }

const COLOR: Record<Kind, string> = { fod: '#f6b93b', cleared: '#72c766', trail: '#f08a4b' }

export class PheromoneLayer {
  group = new THREE.Group()
  private marks: Mark[] = []
  private waggles: Waggle[] = []
  private ring = new THREE.RingGeometry(3.1, 4.3, 6, 1).rotateX(-Math.PI / 2)
  private small = new THREE.RingGeometry(1.4, 2.0, 6, 1).rotateX(-Math.PI / 2)
  private dotTex: THREE.Texture

  constructor(dotTexture: THREE.Texture) {
    this.dotTex = dotTexture
    this.group.renderOrder = 2
  }

  private material(kind: Kind, opacity: number) {
    return new THREE.MeshBasicMaterial({
      color: COLOR[kind],
      transparent: true,
      opacity,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      polygonOffset: true,
      polygonOffsetFactor: -6,
    })
  }

  /** Kâşifin bulduğu nesne (aynı kimlik ikinci kez eklenmez) */
  addFod(id: number, x: number, z: number) {
    if (this.marks.some((m) => m.kind === 'fod' && m.id === id)) return
    const mesh = new THREE.Mesh(this.ring, this.material('fod', 0.9))
    mesh.position.set(x, 0.3, z)
    this.group.add(mesh)
    this.marks.push({ mesh, kind: 'fod', id, age: 0, ttl: Infinity, base: 0.9 })
  }

  /** Kimliksiz kalıcı işaret (kuş kalıntısı, çatlak): sahne bitene kadar atar */
  mark(x: number, z: number) {
    const mesh = new THREE.Mesh(this.ring, this.material('fod', 0.9))
    mesh.position.set(x, 0.3, z)
    this.group.add(mesh)
    this.marks.push({ mesh, kind: 'fod', age: 0, ttl: Infinity, base: 0.9 })
  }

  /** Bekçinin devriye izi */
  trail(x: number, z: number) {
    const mesh = new THREE.Mesh(this.small, this.material('trail', 0.5))
    mesh.position.set(x, 0.3, z)
    mesh.rotation.y = Math.random() * Math.PI
    this.group.add(mesh)
    this.marks.push({ mesh, kind: 'trail', age: 0, ttl: 120, base: 0.5 })
  }

  /** Sallanma dansı: kâşiften işçiye konum paylaşımı */
  waggle(from: THREE.Vector3, to: THREE.Vector3) {
    const mid = from.clone().add(to).multiplyScalar(0.5)
    mid.y = Math.max(from.y, to.y) + from.distanceTo(to) * 0.12
    const curve = new THREE.QuadraticBezierCurve3(from.clone(), mid, to.clone())
    const geo = new THREE.BufferGeometry().setFromPoints(curve.getPoints(48))
    const line = new THREE.Line(geo, new THREE.LineDashedMaterial({ color: '#f6b93b', dashSize: 6, gapSize: 4, transparent: true, opacity: 0.9, depthWrite: false }))
    line.computeLineDistances()
    line.userData.curve = curve
    const dot = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.dotTex, color: '#ffd27a', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }))
    dot.scale.setScalar(9)
    this.group.add(line, dot)
    this.waggles.push({ line, dot, from: from.clone(), to: to.clone(), age: 0, ttl: 7 })
  }

  /** alive: nesne hâlâ pistte mi (kaldırılınca işaret yeşile döner) */
  update(dt: number, t: number, alive: (id: number) => boolean) {
    for (const m of this.marks) {
      const mat = m.mesh.material as THREE.MeshBasicMaterial
      if (m.kind === 'fod') {
        if (m.id !== undefined && !alive(m.id)) {
          m.kind = 'cleared'
          m.age = 0
          m.ttl = 14
          m.base = 0.9
          mat.color.set(COLOR.cleared)
          continue
        }
        const s = 1 + Math.sin(t * 4) * 0.12
        m.mesh.scale.set(s, 1, s)
        mat.opacity = 0.65 + Math.sin(t * 4) * 0.25
        continue
      }
      m.age += dt
      mat.opacity = m.base * Math.max(0, 1 - m.age / m.ttl)
      if (m.kind === 'cleared') {
        const s = 1 + (m.age / m.ttl) * 0.8
        m.mesh.scale.set(s, 1, s)
      }
    }
    for (const m of this.marks.filter((x) => x.age > x.ttl)) {
      this.group.remove(m.mesh)
      ;(m.mesh.material as THREE.Material).dispose()
    }
    this.marks = this.marks.filter((x) => x.age <= x.ttl)

    for (const w of this.waggles) {
      w.age += dt
      const curve = w.line.userData.curve as THREE.QuadraticBezierCurve3
      w.dot.position.copy(curve.getPoint((w.age % 1.4) / 1.4))
      const fade = Math.max(0, 1 - Math.max(0, w.age - w.ttl + 1.5) / 1.5)
      ;(w.line.material as THREE.LineDashedMaterial).opacity = 0.9 * fade
      ;(w.dot.material as THREE.SpriteMaterial).opacity = fade
    }
    for (const w of this.waggles.filter((x) => x.age > x.ttl)) {
      this.group.remove(w.line, w.dot)
      w.line.geometry.dispose()
      ;(w.line.material as THREE.Material).dispose()
      ;(w.dot.material as THREE.Material).dispose()
    }
    this.waggles = this.waggles.filter((x) => x.age <= x.ttl)
  }

  clear() {
    for (const m of this.marks) {
      this.group.remove(m.mesh)
      ;(m.mesh.material as THREE.Material).dispose()
    }
    for (const w of this.waggles) {
      this.group.remove(w.line, w.dot)
      w.line.geometry.dispose()
    }
    this.marks = []
    this.waggles = []
  }
}
