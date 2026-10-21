import * as THREE from 'three'
import { Sky } from 'three/examples/jsm/objects/Sky.js'
import { DEFAULT_DAY_OF_YEAR, sunPosition } from '../solar'
import { RWY } from './layout'

/** Güneş yönü: azimut (kuzeyden saat yönünde) → sahne açısı d = azimut − pist yönü. */
export function sunDirection(elev: number, az: number) {
  const d = az - (RWY.heading * Math.PI) / 180
  return new THREE.Vector3(Math.cos(elev) * Math.cos(d), Math.sin(elev), Math.cos(elev) * Math.sin(d))
}

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

export class SkySystem {
  sky = new Sky()
  sun = new THREE.DirectionalLight('#ffffff', 3)
  hemi = new THREE.HemisphereLight('#bcd3ee', '#5b6340', 0.6)
  stars: THREE.Points
  fog = new THREE.Fog('#c9d6e2', 700, 8500)
  night = 0
  elev = 0
  dir = new THREE.Vector3()
  private lastEnvClock = -1e9
  private envRT: THREE.WebGLRenderTarget | null = null

  constructor(private scene: THREE.Scene) {
    this.sky.scale.setScalar(60000)
    const u = this.sky.material.uniforms
    u.turbidity.value = 5.5
    u.rayleigh.value = 1.6
    u.mieCoefficient.value = 0.005
    u.mieDirectionalG.value = 0.82
    scene.add(this.sky)

    this.sun.castShadow = true
    this.sun.shadow.mapSize.set(2048, 2048)
    const cam = this.sun.shadow.camera
    cam.near = 1
    cam.far = 1200
    cam.left = cam.bottom = -90
    cam.right = cam.top = 90
    this.sun.shadow.bias = -0.0004
    this.sun.shadow.normalBias = 0.4
    scene.add(this.sun, this.sun.target, this.hemi)

    const pts: number[] = []
    let s = 42
    const r = () => {
      s = (s * 16807) % 2147483647
      return s / 2147483647
    }
    for (let i = 0; i < 2200; i++) {
      const th = r() * Math.PI * 2
      const ph = Math.acos(1 - r() * 0.95)
      const R = 40000
      pts.push(R * Math.sin(ph) * Math.cos(th), R * Math.cos(ph), R * Math.sin(ph) * Math.sin(th))
    }
    const sg = new THREE.BufferGeometry()
    sg.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3))
    this.stars = new THREE.Points(
      sg,
      new THREE.PointsMaterial({ color: '#ffffff', size: 1.6, sizeAttenuation: false, transparent: true, opacity: 0, depthWrite: false, fog: false }),
    )
    scene.add(this.stars)
    scene.fog = this.fog
  }

  /** clock: günün saniyesi; focus: gölge kamerasının merkezlendiği nokta */
  update(clock: number, focus: THREE.Vector3, renderer: THREE.WebGLRenderer, pmrem: THREE.PMREMGenerator) {
    const { elev, az } = sunPosition(DEFAULT_DAY_OF_YEAR, clock)
    this.elev = elev
    this.dir.copy(sunDirection(elev, az))
    const u = this.sky.material.uniforms
    u.sunPosition.value.copy(this.dir)

    const e = Math.sin(elev)
    this.night = 1 - smooth(-0.13, 0.02, e)
    const day = smooth(-0.07, 0.16, e)
    const golden = smooth(0.0, 0.08, e) * (1 - smooth(0.12, 0.35, e))

    // güneş ışığı: ufka yakın sıcak renk
    const sunCol = new THREE.Color('#fff4e3').lerp(new THREE.Color('#ffb36b'), golden)
    this.sun.color.copy(sunCol)
    this.sun.intensity = 3.2 * day
    this.sun.position.copy(focus).addScaledVector(this.dir, 600)
    this.sun.target.position.copy(focus)
    this.sun.target.updateMatrixWorld()

    // gece: mehtap benzeri soğuk ortam ışığı; pist, çim ve binalar seçilebilsin diye zifiri karanlık değil
    this.hemi.intensity = 0.9 + 0.12 * day
    this.hemi.color.set('#bcd3ee').lerp(new THREE.Color('#4a679c'), this.night)
    this.hemi.groundColor.set('#5b6340').lerp(new THREE.Color('#1c2536'), this.night)

    const fogDay = new THREE.Color('#c7d4df')
    const fogGold = new THREE.Color('#e2bf9c')
    const fogNight = new THREE.Color('#0d1626')
    this.fog.color.copy(fogDay).lerp(fogGold, golden * 0.8).lerp(fogNight, this.night)
    ;(this.stars.material as THREE.PointsMaterial).opacity = this.night * 0.9
    // öğle güneşinde beton ve çim fazla açık kalmasın: güneş yükseldikçe pozlama düşer (öğlen ≈0,46)
    renderer.toneMappingExposure = 0.56 + 0.06 * (1 - e) - 0.19 * Math.max(0, e) + 0.22 * (1 - day) * (1 - this.night) + this.night * 0.25

    // ortam haritası: saat 10 dakikadan fazla değişince yeniden üret
    if (Math.abs(clock - this.lastEnvClock) > 600) {
      this.lastEnvClock = clock
      const envScene = new THREE.Scene()
      const sky2 = new Sky()
      sky2.scale.setScalar(1000)
      for (const k of Object.keys(u)) (sky2.material.uniforms as Record<string, { value: unknown }>)[k].value = (u as Record<string, { value: unknown }>)[k].value
      // ortam ışığına güneş diski girmesin: öğlen bütün sahneyi süt beyazına boğuyordu (doğrudan güneşi zaten DirectionalLight veriyor)
      const disc = (sky2.material.uniforms as Record<string, { value: unknown }>).showSunDisc
      if (disc) disc.value = 0
      envScene.add(sky2)
      const rt = pmrem.fromScene(envScene, 0, 0.1, 2000)
      this.envRT?.dispose()
      this.envRT = rt
      this.scene.environment = rt.texture
      this.scene.environmentIntensity = 0.3 + 0.3 * day
      sky2.geometry.dispose()
      sky2.material.dispose()
    }
  }
}
