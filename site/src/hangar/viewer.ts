import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { buildHangarModel, type HangarModel, type HangarModelId, type HeadId } from './models'

/*
  Hangar görüntüleyicisi: stüdyo ışığında tek model. Sürükle döndür, tekerlekle yakınlaştır, parçaya tıkla.
  Arka plan saydam (cam panel görünür); zeminde yumuşak gölge ve altıgen ızgara.
  Yalnızca ekranda görünürken çizer.
*/

export type ViewerEvents = { hover: (id: string | null) => void; select: (id: string | null) => void }

export class HangarViewerEngine {
  private renderer: THREE.WebGLRenderer
  private scene = new THREE.Scene()
  private camera = new THREE.PerspectiveCamera(32, 1, 0.02, 200)
  private controls: OrbitControls
  private key = new THREE.DirectionalLight('#ffffff', 3.2)
  private model: HangarModel | null = null
  private modelRoot = new THREE.Group()
  private raycaster = new THREE.Raycaster()
  private pointer = new THREE.Vector2()
  private pointerIn = false
  private down: { x: number; y: number } | null = null
  private box = new THREE.Box3Helper(new THREE.Box3(), new THREE.Color('#f6b93b'))
  private radius = 1
  private raf = 0
  private visible = false
  private last = 0
  private t = 0
  private io: IntersectionObserver
  private ro: ResizeObserver
  private _explodeTarget = 0
  private explode = 0
  private dolly = 1

  get explodeTarget() {
    return this._explodeTarget
  }

  /** Parçalarına ayırırken kamera da geri çekilir (parçalar kadraja sığsın) */
  set explodeTarget(v: number) {
    if (v === this._explodeTarget) return
    this.dolly = v > this._explodeTarget ? 1.4 : 1 / 1.4
    this._explodeTarget = v
  }
  hovered: string | null = null
  selected: string | null = null

  constructor(
    private canvas: HTMLCanvasElement,
    private wrap: HTMLElement,
    private ev: ViewerEvents,
  ) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.12
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap

    const pmrem = new THREE.PMREMGenerator(this.renderer)
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    this.scene.environmentIntensity = 1.15
    pmrem.dispose()

    this.key.position.set(3, 5, 2.5)
    this.key.castShadow = true
    this.key.shadow.mapSize.set(2048, 2048)
    this.key.shadow.bias = -0.0003
    this.key.shadow.normalBias = 0.02
    const rim = new THREE.DirectionalLight('#9cc6ff', 1.1)
    rim.position.set(-4, 2.5, -3)
    this.scene.add(this.key, this.key.target, rim, new THREE.HemisphereLight('#dfe9f5', '#2a3140', 0.5))

    // zemin: yumuşak gölge + altıgen ızgara
    const shadow = new THREE.Mesh(new THREE.CircleGeometry(1, 64).rotateX(-Math.PI / 2), new THREE.ShadowMaterial({ opacity: 0.38 }))
    shadow.receiveShadow = true
    shadow.name = 'ground'
    this.scene.add(shadow)
    const hex = new THREE.Group()
    hex.name = 'hex'
    const mat = new THREE.LineBasicMaterial({ color: '#f6b93b', transparent: true, opacity: 0.18 })
    const ring = (cx: number, cz: number) => {
      const pts = Array.from({ length: 7 }, (_, k) => {
        const a = (Math.PI / 3) * k
        return new THREE.Vector3(cx + Math.sin(a), 0.001, cz + Math.cos(a))
      })
      hex.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), mat))
    }
    const w = Math.sqrt(3)
    for (let r = -3; r <= 3; r++) for (let c = -3; c <= 3; c++) if (Math.hypot(c * w + (r % 2 ? w / 2 : 0), r * 1.5) < 4.6) ring(c * w + (r % 2 ? w / 2 : 0), r * 1.5)
    this.scene.add(hex)
    this.scene.add(this.modelRoot, this.box)
    this.box.visible = false

    this.controls = new OrbitControls(this.camera, canvas)
    this.controls.enableDamping = true
    this.controls.enablePan = false
    this.controls.autoRotate = !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    this.controls.autoRotateSpeed = 1.1
    this.controls.maxPolarAngle = Math.PI * 0.53
    this.controls.addEventListener('start', () => (this.controls.autoRotate = false))

    canvas.addEventListener('pointermove', (e) => {
      const r = canvas.getBoundingClientRect()
      this.pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
      this.pointerIn = true
    })
    canvas.addEventListener('pointerleave', () => {
      this.pointerIn = false
      this.setHover(null)
    })
    canvas.addEventListener('pointerdown', (e) => (this.down = { x: e.clientX, y: e.clientY }))
    canvas.addEventListener('pointerup', (e) => {
      if (!this.down || Math.hypot(e.clientX - this.down.x, e.clientY - this.down.y) > 5) return
      const r = canvas.getBoundingClientRect()
      this.pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
      this.select(this.pick())
    })

    this.ro = new ResizeObserver(() => this.resize())
    this.ro.observe(wrap)
    this.io = new IntersectionObserver(([e]) => {
      this.visible = e.isIntersecting
      if (this.visible) this.start()
    })
    this.io.observe(wrap)
    this.resize()
  }

  private resize() {
    const w = this.wrap.clientWidth
    const h = this.wrap.clientHeight
    if (!w || !h) return
    this.renderer.setSize(w, h, false)
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
  }

  load(id: HangarModelId) {
    if (this.model) {
      this.modelRoot.remove(this.model.group)
      this.model.group.traverse((o) => (o as THREE.Mesh).geometry?.dispose())
    }
    const m = buildHangarModel(id)
    this.model = m
    m.update(0, 0, 0)
    // modeli zemine oturt ve ortala
    const b = new THREE.Box3().setFromObject(m.group)
    const c = b.getCenter(new THREE.Vector3())
    m.group.position.set(-c.x, -b.min.y, -c.z)
    this.modelRoot.add(m.group)
    m.group.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) {
        o.castShadow = true
        o.receiveShadow = true
      }
    })
    const size = b.getSize(new THREE.Vector3())
    this.radius = Math.max(size.x, size.y, size.z) * 0.62
    const r = this.radius
    const ground = this.scene.getObjectByName('ground')!
    ground.scale.setScalar(r * 2.6)
    this.scene.getObjectByName('hex')!.scale.setScalar(r * 0.55)
    const cam = this.key.shadow.camera
    cam.left = cam.bottom = -r * 2
    cam.right = cam.top = r * 2
    cam.near = 0.01
    cam.far = r * 20
    cam.updateProjectionMatrix()
    this.key.position.set(r * 3, r * 5, r * 2.5)
    // ürün fotoğrafı açısı: önden çapraz, hafif yukarıdan; uzaklık modeli hem dikeyde hem yatayda kadraja sığdırır
    this.controls.target.set(0, size.y * 0.5, 0)
    const vfov = THREE.MathUtils.degToRad(this.camera.fov)
    const hfov = 2 * Math.atan(Math.tan(vfov / 2) * this.camera.aspect)
    const half = size.clone().multiplyScalar(0.5)
    // dikeyde payı geniş tut (uzun türbin), yatayda dar (geniş drone kadrajı doldursun).
    // Yukarıdan bakınca yatay iz de dikeyde yer kaplar: geniş ve kısa sahnede yakın kol alttan taşmasın
    const dir = new THREE.Vector3(0.62, 0.4, 0.68).normalize()
    const el = Math.asin(dir.y)
    const foot = Math.hypot(half.x, half.z)
    const tall = half.y * Math.cos(el) + foot * Math.sin(el)
    const dist = Math.max((tall / Math.tan(vfov / 2)) * 1.3, (half.y / Math.tan(vfov / 2)) * 1.35, (foot / Math.tan(hfov / 2)) * 0.92)
    this.camera.position.copy(this.controls.target).addScaledVector(dir, dist)
    this.controls.minDistance = r * 1.1
    this.controls.maxDistance = r * 8
    this.controls.update()
    this.explode = this._explodeTarget = 0
    this.dolly = 1
    this.hovered = this.selected = null
    this.box.visible = false
  }

  setHead(h: HeadId) {
    this.model?.setHead?.(h)
  }

  partName(id: string | null) {
    const p = this.model?.parts.find((x) => x.id === id)
    return p ? { name: p.name, info: p.info } : null
  }

  private pick() {
    if (!this.model) return null
    this.raycaster.setFromCamera(this.pointer, this.camera)
    for (const h of this.raycaster.intersectObject(this.model.group, true)) {
      if (!h.object.visible) continue
      for (let o: THREE.Object3D | null = h.object; o; o = o.parent) if (o.userData.partId) return o.userData.partId as string
    }
    return null
  }

  private setHover(id: string | null) {
    if (id === this.hovered) return
    this.hovered = id
    this.canvas.style.cursor = id ? 'pointer' : ''
    this.ev.hover(id)
  }

  select(id: string | null) {
    this.selected = id
    this.ev.select(id)
  }

  private start() {
    if (this.raf) return
    this.last = performance.now()
    const loop = (now: number) => {
      if (!this.visible || document.hidden) {
        this.raf = 0
        return
      }
      this.raf = requestAnimationFrame(loop)
      this.frame(now)
    }
    this.raf = requestAnimationFrame(loop)
  }

  /** bir kare (gizli sekmede elle çağrılabilir) */
  frame(now = performance.now()) {
    const dt = Math.min(0.05, Math.max(0, (now - this.last) / 1000))
    this.last = now
    this.t += dt
    this.explode += (this._explodeTarget - this.explode) * Math.min(1, dt * 4)
    if (Math.abs(this.dolly - 1) > 0.002) {
      // kalan dolly oranının bir kısmını bu karede uygula
      const step = Math.pow(this.dolly, Math.min(1, dt * 4))
      const off = this.camera.position.clone().sub(this.controls.target).multiplyScalar(step)
      this.camera.position.copy(this.controls.target).add(off)
      this.dolly /= step
    }
    this.model?.update(this.t, dt, this.explode)
    if (this.pointerIn) this.setHover(this.pick())
    const focus = this.selected ?? this.hovered
    const part = this.model?.parts.find((p) => p.id === focus)
    if (part) {
      this.box.box.setFromObject(part.obj)
      this.box.visible = true
    } else this.box.visible = false
    this.controls.update()
    this.renderer.render(this.scene, this.camera)
    // parça etiketleri (patlatılmış görünümde), doğrudan DOM'da güncellenir
    const layer = this.labelLayer
    if (layer && this.model) {
      const w = this.wrap.clientWidth
      const h = this.wrap.clientHeight
      const on = this.explode > 0.55
      const v = new THREE.Vector3()
      const parts = this.model.parts
      while (layer.children.length < parts.length) {
        const d = document.createElement('button')
        d.type = 'button'
        d.className = 'hv__label'
        d.addEventListener('click', () => this.select(d.dataset.id ?? null))
        layer.appendChild(d)
      }
      parts.forEach((p, i) => {
        const el = layer.children[i] as HTMLButtonElement
        new THREE.Box3().setFromObject(p.obj).getCenter(v)
        v.project(this.camera)
        const show = on && v.z < 1
        el.style.display = show ? '' : 'none'
        if (!show) return
        el.dataset.id = p.id
        // etikette kısa ad: "Gimbal: 48 MP …" → "Gimbal", "Gövde (M350 sınıfı)" → "Gövde"
        const short = p.name.split(':')[0].split(' (')[0]
        if (el.textContent !== short) el.textContent = short
        el.classList.toggle('is-on', p.id === this.selected)
        el.style.transform = `translate(${((v.x + 1) / 2) * w}px, ${((1 - v.y) / 2) * h}px) translate(-50%, -50%)`
      })
      for (let i = parts.length; i < layer.children.length; i++) (layer.children[i] as HTMLElement).style.display = 'none'
    }
  }

  labelLayer: HTMLElement | null = null

  dispose() {
    cancelAnimationFrame(this.raf)
    this.io.disconnect()
    this.ro.disconnect()
    this.controls.dispose()
    this.model?.group.traverse((o) => (o as THREE.Mesh).geometry?.dispose())
    this.renderer.dispose()
  }
}
