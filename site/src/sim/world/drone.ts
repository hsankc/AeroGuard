import * as THREE from 'three'
import { footprint } from './layout'
import { glowTexture } from './textures'

/*
  Görünürlük için drone gerçek boyutun ≈2,5 katı modellenmiştir (≈1 m).
  Kastlar: kâşif (M3TD sınıfı, kamera izi), bekçi (aynı gövde + hoparlör ve ışık), işçi (M350 sınıfı, daha büyük
  gövde, vinç ve toplama başlığı).
*/
export const DRONE_SCALE = 2.5
export type DroneCaste = 'scout' | 'guard' | 'worker'

const glow = glowTexture()

function sprite(color: string, size: number) {
  const s = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: glow, color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }),
  )
  s.scale.setScalar(size)
  return s
}

export class DroneVisual {
  root = new THREE.Group()
  private body = new THREE.Group()
  private props: THREE.Object3D[] = []
  private discs: THREE.Mesh[] = []
  private strobe: THREE.Sprite
  private navSprites: THREE.Sprite[] = []
  readonly camera: THREE.PerspectiveCamera
  readonly ground = new THREE.Group()
  private fpFill: THREE.Mesh
  private fpLine: THREE.LineLoop
  private frustum: THREE.LineSegments
  private rotorSpin = 0
  private t = 0
  private showFootprint: boolean
  private cable: THREE.Mesh | null = null
  private hook: THREE.Group | null = null
  private cargo: THREE.Mesh | null = null
  private winch = 0

  constructor(
    readonly id: number,
    readonly color: string,
    readonly caste: DroneCaste = 'scout',
  ) {
    this.showFootprint = caste === 'scout'
    const shell = new THREE.MeshStandardMaterial({ color: '#30363d', roughness: 0.45, metalness: 0.25 })
    const shellLight = new THREE.MeshStandardMaterial({ color: '#4a525b', roughness: 0.5, metalness: 0.2 })
    const accent = new THREE.MeshStandardMaterial({ color, roughness: 0.4, emissive: new THREE.Color(color), emissiveIntensity: 0.35 })
    const propMat = new THREE.MeshStandardMaterial({ color: '#15181b', roughness: 0.6 })

    const model = new THREE.Group()
    model.scale.setScalar(DRONE_SCALE * (caste === 'worker' ? 1.45 : 1))
    this.body.add(model)
    this.root.add(this.body)

    const hull = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.075, 0.11), shell)
    hull.castShadow = true
    model.add(hull)
    const top = new THREE.Mesh(new THREE.SphereGeometry(0.075, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), shellLight)
    top.scale.set(1.55, 0.55, 0.72)
    top.position.y = 0.035
    model.add(top)
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.012, 0.113), accent)
    stripe.position.y = -0.01
    model.add(stripe)

    // kollar, motorlar, pervaneler
    const motorPos: [number, number][] = [
      [0.12, -0.15],
      [0.12, 0.15],
      [-0.12, -0.15],
      [-0.12, 0.15],
    ]
    for (const [mx, mz] of motorPos) {
      const len = Math.hypot(mx, mz)
      const arm = new THREE.Mesh(new THREE.BoxGeometry(len, 0.016, 0.022), shell)
      arm.position.set(mx / 2, 0.01, mz / 2)
      arm.rotation.y = -Math.atan2(mz, mx)
      arm.castShadow = true
      model.add(arm)
      const motor = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.022, 0.035, 12), shellLight)
      motor.position.set(mx, 0.025, mz)
      model.add(motor)
      const prop = new THREE.Group()
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.004, 0.022), propMat)
      prop.add(blade)
      prop.position.set(mx, 0.047, mz)
      model.add(prop)
      this.props.push(prop)
      const disc = new THREE.Mesh(
        new THREE.CircleGeometry(0.12, 24),
        new THREE.MeshBasicMaterial({ color: '#1b1f24', transparent: true, opacity: 0.18, depthWrite: false, side: THREE.DoubleSide }),
      )
      disc.rotation.x = -Math.PI / 2
      disc.position.set(mx, 0.048, mz)
      disc.visible = false
      model.add(disc)
      this.discs.push(disc)
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.06, 0.008), shell)
      leg.position.set(mx * 0.8, -0.03, mz * 0.8)
      model.add(leg)
    }

    // gimbal ve kamera
    const gimbal = new THREE.Mesh(new THREE.SphereGeometry(0.028, 14, 10), shellLight)
    gimbal.position.set(0.1, -0.05, 0)
    model.add(gimbal)
    const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.02, 12), new THREE.MeshStandardMaterial({ color: '#0b0d10', metalness: 0.8, roughness: 0.2 }))
    lens.position.set(0.1, -0.075, 0)
    model.add(lens)
    // RTK anteni
    const rtk = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.012, 14), shellLight)
    rtk.position.set(-0.05, 0.08, 0)
    model.add(rtk)

    if (caste === 'guard') {
      // hafif hoparlör ve ışık çubuğu (kuş caydırma)
      const horn = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.04, 0.06, 14, 1, true).rotateZ(-Math.PI / 2), accent)
      horn.position.set(-0.02, -0.055, 0)
      model.add(horn)
      const bar = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.012, 0.02),
        new THREE.MeshStandardMaterial({ color: '#fff', emissive: new THREE.Color('#ffd27a'), emissiveIntensity: 1.4 }),
      )
      bar.position.set(0, -0.045, 0.05)
      model.add(bar)
    }
    if (caste === 'worker') {
      // vinç gövdesi; kablo ve başlık dünya ölçeğinde (kök gruba bağlı, eğilmez)
      const pod = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.04, 0.07), shellLight)
      pod.position.set(0, -0.06, 0)
      model.add(pod)
      this.cable = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1, 6).translate(0, -0.5, 0), new THREE.MeshStandardMaterial({ color: '#222', roughness: 0.6 }))
      this.cable.position.y = -0.3
      this.cable.visible = false
      this.root.add(this.cable)
      this.hook = new THREE.Group()
      const magnet = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.1, 14), new THREE.MeshStandardMaterial({ color: '#c0392b', roughness: 0.4, metalness: 0.4 }))
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.025, 6, 16).rotateX(Math.PI / 2), accent)
      this.hook.add(magnet, ring)
      this.hook.visible = false
      this.root.add(this.hook)
      this.cargo = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.12, 0.18), new THREE.MeshStandardMaterial({ color: '#5a5f66', roughness: 0.5, metalness: 0.5 }))
      this.cargo.visible = false
      this.root.add(this.cargo)
    }

    // seyir ışıkları: sol kırmızı, sağ yeşil, üstte beyaz çakar
    const red = sprite('#ff3b30', 0.9)
    red.position.set(0.3, 0.05, -0.38)
    const grn = sprite('#3dff7a', 0.9)
    grn.position.set(0.3, 0.05, 0.38)
    this.strobe = sprite('#ffffff', 0.9)
    this.strobe.position.set(-0.1, 0.25, 0)
    this.navSprites.push(red, grn)
    this.body.add(red, grn, this.strobe)

    // kamera (gimbal aşağı bakar; görüntünün üst kenarı uçuş yönünde)
    const fp = footprint(20)
    this.camera = new THREE.PerspectiveCamera(fp.vfovDeg, 4 / 3, 0.3, 4000)

    // yerdeki görüş alanı ve görüş konisi çizgileri
    this.fpFill = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.16, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4 }),
    )
    this.fpFill.rotation.x = -Math.PI / 2
    const loop = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-0.5, 0, -0.5),
      new THREE.Vector3(0.5, 0, -0.5),
      new THREE.Vector3(0.5, 0, 0.5),
      new THREE.Vector3(-0.5, 0, 0.5),
    ])
    this.fpLine = new THREE.LineLoop(loop, new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.85 }))
    this.ground.add(this.fpFill, this.fpLine)
    this.ground.position.y = 0.14
    this.frustum = new THREE.LineSegments(
      new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(24), 3)),
      new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.35 }),
    )
    this.frustum.frustumCulled = false
  }

  addTo(scene: THREE.Scene) {
    scene.add(this.root, this.ground, this.frustum)
  }

  /**
   * pos: dünya konumu, yaw: sahne açısı (+x'ten saat yönünde), speed: m/s
   * scanning: kamera izini vurgula, rotors: pervaneler dönüyor mu
   */
  update(pos: THREE.Vector3, yaw: number, speed: number, rotors: boolean, scanning: boolean, dt: number, night: number) {
    this.t += dt
    this.root.position.copy(pos)
    this.root.rotation.set(0, -yaw, 0)
    // ileri harekette burun hafifçe aşağı
    this.body.rotation.z = THREE.MathUtils.lerp(this.body.rotation.z, -Math.min(0.22, speed * 0.018), Math.min(1, dt * 3))

    const target = rotors ? 1 : 0
    this.rotorSpin += (target - this.rotorSpin) * Math.min(1, dt * 2.5)
    for (const p of this.props) p.rotation.y += this.rotorSpin * 0.9
    const blurred = this.rotorSpin > 0.6
    this.discs.forEach((d) => (d.visible = blurred))
    this.props.forEach((p) => (p.visible = !blurred))

    // ışıklar: gündüz zayıf, gece parlak; beyaz çakar 1 Hz
    const vis = 0.35 + night * 0.65
    this.navSprites.forEach((s) => ((s.material as THREE.SpriteMaterial).opacity = rotors ? vis : 0.15))
    ;(this.strobe.material as THREE.SpriteMaterial).opacity = rotors && this.t % 1 < 0.06 ? 0.9 : 0

    // kamera ve yerdeki iz
    const alt = Math.max(0.5, pos.y)
    const fp = footprint(alt)
    const fx = Math.cos(yaw)
    const fz = Math.sin(yaw)
    this.camera.position.set(pos.x + fx * 0.25, pos.y - 0.2, pos.z + fz * 0.25)
    this.camera.up.set(fx, 0, fz)
    this.camera.lookAt(pos.x + fx * 0.25, 0, pos.z + fz * 0.25)

    const show = pos.y > 3 && this.showFootprint
    this.ground.visible = show
    this.frustum.visible = show
    if (show) {
      this.ground.position.set(pos.x, 0.14, pos.z)
      this.ground.rotation.y = -yaw
      this.ground.scale.set(fp.along, 1, fp.across)
      ;(this.fpFill.material as THREE.MeshBasicMaterial).opacity = scanning ? 0.2 : 0.07
      ;(this.fpLine.material as THREE.LineBasicMaterial).opacity = scanning ? 0.9 : 0.35
      const a = this.frustum.geometry.attributes.position as THREE.BufferAttribute
      const corners = [
        [0.5, 0.5],
        [0.5, -0.5],
        [-0.5, -0.5],
        [-0.5, 0.5],
      ]
      corners.forEach(([u, v], i) => {
        // yerel (along u, across v) → dünya
        const lx = u * fp.along
        const lz = v * fp.across
        const wx = pos.x + lx * fx - lz * fz
        const wz = pos.z + lx * fz + lz * fx
        a.setXYZ(i * 2, pos.x, pos.y - 0.2, pos.z)
        a.setXYZ(i * 2 + 1, wx, 0.15, wz)
      })
      a.needsUpdate = true
      ;(this.frustum.material as THREE.LineBasicMaterial).opacity = scanning ? 0.4 : 0.15
    }
  }

  /** İşçi: vinç kablosunun hedef uzunluğu (m) ve taşınan nesne. Kablo yumuşakça iner ve sarılır. */
  setWinch(target: number, carrying: boolean, dt: number) {
    if (!this.cable || !this.hook || !this.cargo) return
    const want = Math.max(carrying ? 0.9 : 0, target)
    this.winch += Math.sign(want - this.winch) * Math.min(Math.abs(want - this.winch), dt * 0.9)
    const on = this.winch > 0.05
    this.cable.visible = on
    this.hook.visible = true
    this.cable.scale.y = Math.max(0.01, this.winch)
    this.hook.position.y = -0.3 - this.winch - 0.06
    this.cargo.visible = carrying
    this.cargo.position.y = this.hook.position.y - 0.12
  }

  setVisible(v: boolean) {
    this.root.visible = v
    if (!v) {
      this.ground.visible = false
      this.frustum.visible = false
    }
  }
}

/** Taranan şeritler: her geçiş için drone ilerledikçe uzayan yarı saydam bant. */
export class CoverageStrips {
  group = new THREE.Group()
  private strips: { mesh: THREE.Mesh; x0: number; x1: number; z: number }[] = []

  constructor(color: string, lanes: { x0: number; x1: number; z: number }[], width: number) {
    const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.13, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3 })
    for (const l of lanes) {
      const g = new THREE.PlaneGeometry(1, width)
      g.rotateX(-Math.PI / 2)
      const mesh = new THREE.Mesh(g, mat)
      mesh.position.set(l.x0, 0.12, l.z)
      mesh.visible = false
      this.group.add(mesh)
      this.strips.push({ mesh, ...l })
    }
  }

  /** i: geçiş, p: 0..1 ilerleme */
  set(i: number, p: number) {
    const s = this.strips[i]
    if (!s) return
    s.mesh.visible = p > 0.001
    const len = Math.abs(s.x1 - s.x0) * p
    s.mesh.scale.x = Math.max(0.001, len)
    s.mesh.position.x = s.x0 + Math.sign(s.x1 - s.x0) * (len / 2)
  }

  reset() {
    this.strips.forEach((_, i) => this.set(i, 0))
  }
}
