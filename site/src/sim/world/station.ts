import * as THREE from 'three'
import { padTexture } from './textures'

/*
  Kovan istasyonu: otomatik drone kutusu (DJI Dock 2 sınıfı referans alınmıştır, marka/logo kullanılmaz).
  Görünürlük için gerçek boyutun ≈2,5 katı modellenmiştir.
*/
export const STATION_SCALE = 2.5
const W = 1.2 // gövde genişliği (x)
const D = 0.95 // derinlik (z)
const H = 0.55 // gövde yüksekliği

export class Station {
  group = new THREE.Group()
  private lidL = new THREE.Group()
  private lidR = new THREE.Group()
  private led: THREE.MeshStandardMaterial
  private cups = new THREE.Group()
  private lid = 0 // 0 kapalı, 1 açık
  private lidTarget = 0
  readonly padTop: THREE.Vector3

  constructor(
    readonly id: 'A' | 'B',
    accent: string,
    x: number,
    z: number,
  ) {
    const s = STATION_SCALE
    const body = new THREE.MeshStandardMaterial({ color: '#e4e7ea', roughness: 0.55, metalness: 0.1 })
    const dark = new THREE.MeshStandardMaterial({ color: '#3a4048', roughness: 0.6 })
    const acc = new THREE.MeshStandardMaterial({ color: accent, roughness: 0.5 })

    // beton taban
    const slab = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.25, 4.5), new THREE.MeshStandardMaterial({ color: '#a9aca8', roughness: 1 }))
    slab.position.y = 0.125
    slab.receiveShadow = true
    this.group.add(slab)

    const unit = new THREE.Group()
    unit.scale.setScalar(s)
    unit.position.y = 0.25
    this.group.add(unit)

    const base = new THREE.Mesh(new THREE.BoxGeometry(W, H, D), body)
    base.position.y = H / 2
    base.castShadow = true
    base.receiveShadow = true
    unit.add(base)
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(W + 0.01, 0.06, D + 0.01), acc)
    stripe.position.y = H * 0.72
    unit.add(stripe)

    // iç iniş pedi
    const pad = new THREE.Mesh(new THREE.PlaneGeometry(W * 0.86, D * 0.86), new THREE.MeshStandardMaterial({ map: padTexture(accent), roughness: 0.8 }))
    pad.rotation.x = -Math.PI / 2
    pad.position.y = H + 0.002
    unit.add(pad)

    // ikiye açılan kapak (dış kenarlardan menteşeli)
    const lidGeo = new THREE.BoxGeometry(W / 2, 0.07, D)
    const lidMeshL = new THREE.Mesh(lidGeo, body)
    lidMeshL.position.x = W / 4
    lidMeshL.castShadow = true
    this.lidL.add(lidMeshL)
    this.lidL.position.set(-W / 2, H + 0.035, 0)
    const lidMeshR = new THREE.Mesh(lidGeo, body)
    lidMeshR.position.x = -W / 4
    lidMeshR.castShadow = true
    this.lidR.add(lidMeshR)
    this.lidR.position.set(W / 2, H + 0.035, 0)
    unit.add(this.lidL, this.lidR)

    // direk: hava istasyonu (anemometre) ve RTK anteni
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.025, 0.9), dark)
    mast.position.set(W / 2 + 0.05, H + 0.45, -D / 2 + 0.05)
    unit.add(mast)
    const rtk = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.03, 16), body)
    rtk.position.set(W / 2 + 0.05, H + 0.92, -D / 2 + 0.05)
    unit.add(rtk)
    for (let i = 0; i < 3; i++) {
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.008, 0.008), dark)
      arm.position.x = 0.06
      arm.rotation.y = 0
      const cup = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 6, 0, Math.PI), dark)
      cup.position.x = 0.12
      const holder = new THREE.Group()
      holder.rotation.y = (i * Math.PI * 2) / 3
      holder.add(arm, cup)
      this.cups.add(holder)
    }
    this.cups.position.set(W / 2 + 0.05, H + 0.8, -D / 2 + 0.05)
    unit.add(this.cups)

    this.led = new THREE.MeshStandardMaterial({ color: '#2b2b2b', emissive: new THREE.Color('#38d26b'), emissiveIntensity: 1.6 })
    const led = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.03, 0.01), this.led)
    led.position.set(0, H * 0.4, D / 2 + 0.006)
    unit.add(led)

    this.group.position.set(x, 0, z)
    this.padTop = new THREE.Vector3(x, 0.25 + (H + 0.02) * s, z)
  }

  open() {
    this.lidTarget = 1
  }
  close() {
    this.lidTarget = 0
  }
  get isOpen() {
    return this.lid > 0.98
  }
  get isClosed() {
    return this.lid < 0.02
  }

  setStatus(kind: 'ready' | 'busy' | 'alert') {
    const c = kind === 'ready' ? '#38d26b' : kind === 'busy' ? '#ffb020' : '#ff3b30'
    this.led.emissive.set(c)
  }

  /** dt: simülasyon saniyesi; kapak 8 sn'de açılır */
  update(dt: number, wind: number) {
    const step = dt / 8
    this.lid += Math.sign(this.lidTarget - this.lid) * Math.min(step, Math.abs(this.lidTarget - this.lid))
    const a = this.lid * 1.75
    this.lidL.rotation.z = a
    this.lidR.rotation.z = -a
    this.cups.rotation.y += dt * (1 + wind * 1.4)
  }
}
