import * as THREE from 'three'
import type { Frame } from './scenario'

/*
  Senaryo kamerası: yönetmenin verdiği kareye (bakılan nokta + kameranın yeri) kritik sönümlü yaylarla gider.
  Konu değişince daha yumuşak geçer, hızlı konuyu sıkı takip eder. Kullanıcı sürükleyerek döndürür,
  tekerlekle yakınlaştırır; bir bina kadrajı kapatırsa kamera açıyı kendisi kaydırır.
*/

/** Unity SmoothDamp'in vektör hâli: aşmadan, sıçramadan hedefe yaklaşır */
function smoothDamp(cur: THREE.Vector3, target: THREE.Vector3, vel: THREE.Vector3, smoothTime: number, dt: number) {
  if (dt <= 0) return
  const st = Math.max(0.05, smoothTime)
  const omega = 2 / st
  const x = omega * dt
  const exp = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x)
  const change = cur.clone().sub(target)
  const temp = vel.clone().addScaledVector(change, omega).multiplyScalar(dt)
  vel.addScaledVector(temp, -omega).multiplyScalar(exp)
  const out = target.clone().add(change.add(temp).multiplyScalar(exp))
  // hedefi geçtiyse hedefte dur
  if (target.clone().sub(cur).dot(out.clone().sub(target)) > 0) {
    out.copy(target)
    vel.set(0, 0, 0)
  }
  cur.copy(out)
}

const rotY = (v: THREE.Vector3, a: number) => {
  const c = Math.cos(a)
  const s = Math.sin(a)
  return new THREE.Vector3(v.x * c - v.z * s, v.y, v.x * s + v.z * c)
}

export class SceneCamera {
  private pos = new THREE.Vector3()
  private posVel = new THREE.Vector3()
  readonly lookAt = new THREE.Vector3()
  private lookVel = new THREE.Vector3()
  /** kullanıcının sürükleme ve tekerlek ayarı */
  private yaw = 0
  private pitch = 0
  private zoom = 1
  /** engelden kaçma açısı */
  private dodge = 0
  private dodgeWant = 0
  private checkT = 0
  private phase = 0
  private idle = 99
  /** şu anki çekimin anahtarı (ör. d2: Kâşif-2 takipte) */
  key = ''
  private trans = 0
  label = ''

  /** Kameranın şu anki yerinden başla: ilk çekime oradan uçar */
  reset(camera: THREE.PerspectiveCamera) {
    const d = new THREE.Vector3()
    camera.getWorldDirection(d)
    this.pos.copy(camera.position)
    this.lookAt.copy(camera.position).addScaledVector(d, 150)
    this.posVel.set(0, 0, 0)
    this.lookVel.set(0, 0, 0)
    this.key = ''
    this.trans = 2
    this.resetView()
  }

  resetView() {
    this.yaw = 0
    this.pitch = 0
    this.zoom = 1
    this.dodge = this.dodgeWant = 0
    this.idle = 99
  }

  get adjusted() {
    return Math.abs(this.yaw) > 1e-3 || Math.abs(this.pitch) > 1e-3 || Math.abs(this.zoom - 1) > 1e-3
  }

  drag(dx: number, dy: number) {
    this.yaw -= dx * 0.006
    this.pitch = THREE.MathUtils.clamp(this.pitch + dy * 0.004, -0.7, 0.9)
    this.idle = 0
  }

  wheel(dy: number) {
    this.zoom = THREE.MathUtils.clamp(this.zoom * Math.exp(dy * 0.0012), 0.3, 3.5)
    this.idle = 0
  }

  /** Kareye göre istenen kamera yeri: kullanıcı açısı, süzülme, engelden kaçma ve yakınlaştırma uygulanmış */
  private wanted(f: Frame, dodge: number, swing: number) {
    const off = rotY(f.offset, this.yaw + swing + dodge)
    const r = off.length() * this.zoom
    const el = THREE.MathUtils.clamp(Math.atan2(off.y, Math.hypot(off.x, off.z)) + this.pitch, 0.05, 1.45)
    const az = Math.atan2(off.z, off.x)
    const p = new THREE.Vector3(Math.cos(az) * Math.cos(el) * r, Math.sin(el) * r, Math.sin(az) * Math.cos(el) * r).add(f.look)
    p.y = Math.max(p.y, 3)
    return p
  }

  update(dt: number, f: Frame, camera: THREE.PerspectiveCamera, clear?: (from: THREE.Vector3, to: THREE.Vector3) => boolean) {
    this.idle += dt
    if (f.key !== this.key) {
      // yeni konu: yumuşak geçiş, engelden kaçma sıfırdan
      this.key = f.key
      this.trans = 1.6
      this.dodgeWant = 0
      this.checkT = 0
    }
    this.trans = Math.max(0, this.trans - dt)
    // olay çekimlerinde yavaş git-gel; kullanıcı elle çevirdiyse bir süre durur
    if (f.orbit && this.idle > 6) this.phase += dt * 0.07
    const swing = f.orbit ? Math.sin(this.phase) * 0.45 : 0

    this.checkT -= dt
    // engel denetimi konunun kendisine (takipte drone), yoksa bakılan noktaya
    const aim = f.subject ?? f.look
    if (clear && this.checkT <= 0) {
      this.checkT = 0.3
      if (this.dodgeWant !== 0 && clear(this.wanted(f, 0, swing), aim)) this.dodgeWant = 0
      else if (!clear(this.wanted(f, this.dodgeWant, swing), aim)) {
        for (const k of [0.45, -0.45, 0.9, -0.9, 1.4, -1.4, 2.1, -2.1, Math.PI]) {
          if (clear(this.wanted(f, this.dodgeWant + k, swing), aim)) {
            this.dodgeWant += k
            break
          }
        }
      }
    }
    this.dodge += (this.dodgeWant - this.dodge) * (1 - Math.exp(-dt / 0.7))

    const want = this.wanted(f, this.dodge, swing)
    // uzak bir konuya geçerken yay çizerek yüksel: alçaktan binaların içinden geçmesin, drone gibi süzülsün
    const gap = this.pos.distanceTo(want)
    if (gap > 120) want.y += Math.min(160, (gap - 120) * 0.25)
    const st = f.smooth + (this.trans / 1.6) * 0.9
    smoothDamp(this.pos, want, this.posVel, st, dt)
    smoothDamp(this.lookAt, f.look, this.lookVel, st * 0.6, dt)
    camera.position.copy(this.pos)
    camera.lookAt(this.lookAt)
    this.label = f.label
  }
}
