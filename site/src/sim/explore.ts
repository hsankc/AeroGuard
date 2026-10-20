import * as THREE from 'three'

/*
  Keşif modu kamerası (oyun tarzı serbest uçuş):
  W A S D / oklar hareket, Q / E alçal / yüksel, Shift hızlı, fare sürükleme bakış, tekerlek ileri-geri.
  Telefonda sanal joystick setStick ile, yükseklik setLift ile verilir; tek parmak sürükleme bakıştır.
  Hız yüksekliğe göre ölçeklenir: yerde yürüme temposu, yüksekte hızlı geçiş.
*/

const KEYS: Record<string, 'f' | 'b' | 'l' | 'r' | 'u' | 'd'> = {
  KeyW: 'f',
  ArrowUp: 'f',
  KeyS: 'b',
  ArrowDown: 'b',
  KeyA: 'l',
  ArrowLeft: 'l',
  KeyD: 'r',
  ArrowRight: 'r',
  KeyE: 'u',
  KeyQ: 'd',
}

const MIN_Y = 1.7
const MAX_Y = 2400
const LIMIT = 6500

export class FlyControls {
  enabled = false
  yaw = 0
  pitch = -0.25
  private held = new Set<string>()
  private fast = false
  private vel = new THREE.Vector3()
  private stick = new THREE.Vector2()
  private lift = 0
  private drag: { x: number; y: number; id: number; moved: number } | null = null
  private wheel = 0
  /** Uçuş hedefi (odaklan): verilirse kamera oraya yumuşakça gider */
  private flight: { from: THREE.Vector3; to: THREE.Vector3; yaw0: number; yaw1: number; pitch0: number; pitch1: number; t: number } | null = null
  /** sürükleme hareketi tıklama sayılmasın diye */
  lastDragDistance = 0

  constructor(
    private camera: THREE.PerspectiveCamera,
    dom: HTMLElement,
  ) {
    window.addEventListener('keydown', this.onKey)
    window.addEventListener('keyup', this.onKey)
    window.addEventListener('blur', () => this.held.clear())
    dom.addEventListener('pointerdown', this.onDown)
    window.addEventListener('pointermove', this.onMove)
    window.addEventListener('pointerup', this.onUp)
    dom.addEventListener('wheel', this.onWheel, { passive: false })
  }

  /** Kameranın şu anki bakışından başla (mod geçişinde sıçrama olmasın) */
  syncFromCamera() {
    const dir = new THREE.Vector3()
    this.camera.getWorldDirection(dir)
    this.yaw = Math.atan2(dir.z, dir.x)
    this.pitch = Math.asin(THREE.MathUtils.clamp(dir.y, -1, 1))
    this.vel.set(0, 0, 0)
    this.held.clear()
    this.flight = null
  }

  setStick(x: number, y: number) {
    this.stick.set(x, y)
  }

  setLift(v: number) {
    this.lift = v
  }

  /** Bir noktaya bakacak şekilde verilen konuma uç */
  flyTo(pos: THREE.Vector3, look: THREE.Vector3) {
    const d = look.clone().sub(pos)
    const yaw1 = Math.atan2(d.z, d.x)
    const pitch1 = Math.atan2(d.y, Math.hypot(d.x, d.z))
    let yaw0 = this.yaw
    // en kısa yönden dön
    while (yaw1 - yaw0 > Math.PI) yaw0 += Math.PI * 2
    while (yaw1 - yaw0 < -Math.PI) yaw0 -= Math.PI * 2
    this.flight = { from: this.camera.position.clone(), to: pos.clone(), yaw0, yaw1, pitch0: this.pitch, pitch1, t: 0 }
    this.vel.set(0, 0, 0)
  }

  private onKey = (e: KeyboardEvent) => {
    if (!this.enabled) return
    const t = e.target as HTMLElement | null
    if (t && (t.tagName === 'INPUT' || t.tagName === 'SELECT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return
    this.fast = e.shiftKey
    const k = KEYS[e.code]
    if (!k) return
    e.preventDefault()
    if (e.type === 'keydown') {
      this.held.add(k)
      this.flight = null
    } else this.held.delete(k)
  }

  private onDown = (e: PointerEvent) => {
    if (!this.enabled || (e.pointerType === 'mouse' && e.button !== 0)) return
    this.drag = { x: e.clientX, y: e.clientY, id: e.pointerId, moved: 0 }
    this.lastDragDistance = 0
  }

  private onMove = (e: PointerEvent) => {
    if (!this.enabled || !this.drag || e.pointerId !== this.drag.id) return
    const dx = e.clientX - this.drag.x
    const dy = e.clientY - this.drag.y
    this.drag.x = e.clientX
    this.drag.y = e.clientY
    this.drag.moved += Math.abs(dx) + Math.abs(dy)
    const k = e.pointerType === 'touch' ? 0.006 : 0.0042
    this.yaw += dx * k
    this.pitch = THREE.MathUtils.clamp(this.pitch - dy * k, -1.5, 0.9)
    if (this.drag.moved > 4) this.flight = null
  }

  private onUp = (e: PointerEvent) => {
    if (!this.drag || e.pointerId !== this.drag.id) return
    this.lastDragDistance = this.drag.moved
    this.drag = null
  }

  private onWheel = (e: WheelEvent) => {
    if (!this.enabled) return
    e.preventDefault()
    this.wheel += Math.sign(e.deltaY) * Math.min(3, Math.abs(e.deltaY) / 60)
    this.flight = null
  }

  update(dt: number) {
    if (!this.enabled) return
    const cam = this.camera
    if (this.flight) {
      const f = this.flight
      f.t = Math.min(1, f.t + dt / 1.4)
      const k = f.t < 0.5 ? 4 * f.t ** 3 : 1 - Math.pow(-2 * f.t + 2, 3) / 2
      cam.position.lerpVectors(f.from, f.to, k)
      cam.position.y += Math.sin(k * Math.PI) * Math.min(200, f.from.distanceTo(f.to) * 0.15)
      this.yaw = THREE.MathUtils.lerp(f.yaw0, f.yaw1, k)
      this.pitch = THREE.MathUtils.lerp(f.pitch0, f.pitch1, k)
      if (f.t >= 1) this.flight = null
    } else {
      const alt = Math.max(0, cam.position.y)
      const speed = THREE.MathUtils.clamp(6 + alt * 0.9, 6, 420) * (this.fast ? 3 : 1)
      const fwd = new THREE.Vector3(Math.cos(this.yaw), 0, Math.sin(this.yaw))
      const right = new THREE.Vector3(-fwd.z, 0, fwd.x)
      const h = this.held
      const want = new THREE.Vector3()
      want.addScaledVector(fwd, (h.has('f') ? 1 : 0) - (h.has('b') ? 1 : 0) - this.stick.y)
      want.addScaledVector(right, (h.has('r') ? 1 : 0) - (h.has('l') ? 1 : 0) + this.stick.x)
      if (want.lengthSq() > 1) want.normalize()
      want.multiplyScalar(speed)
      want.y = ((h.has('u') ? 1 : 0) - (h.has('d') ? 1 : 0) + this.lift) * speed * 0.6
      this.vel.lerp(want, Math.min(1, dt * 6))
      cam.position.addScaledVector(this.vel, dt)
      // tekerlek: bakış yönünde ileri / geri (yüksekliğe göre ölçekli adım)
      if (this.wheel !== 0) {
        const step = -this.wheel * THREE.MathUtils.clamp(4 + alt * 0.25, 4, 260)
        const look = new THREE.Vector3(Math.cos(this.pitch) * Math.cos(this.yaw), Math.sin(this.pitch), Math.cos(this.pitch) * Math.sin(this.yaw))
        cam.position.addScaledVector(look, step * Math.min(1, dt * 10))
        this.wheel *= Math.max(0, 1 - dt * 10)
        if (Math.abs(this.wheel) < 0.02) this.wheel = 0
      }
    }
    cam.position.y = THREE.MathUtils.clamp(cam.position.y, MIN_Y, MAX_Y)
    cam.position.x = THREE.MathUtils.clamp(cam.position.x, -LIMIT, LIMIT)
    cam.position.z = THREE.MathUtils.clamp(cam.position.z, -LIMIT, LIMIT)
    const look = new THREE.Vector3(Math.cos(this.pitch) * Math.cos(this.yaw), Math.sin(this.pitch), Math.cos(this.pitch) * Math.sin(this.yaw))
    cam.lookAt(cam.position.clone().add(look))
  }
}
