import * as THREE from 'three'
import { CELL_R } from './station'

/*
  Petek: altıgen hücrelerden oluşan yalıtımlı istasyon. Her dolu hücrede bir otomatik drone istasyonu (Station) durur;
  hücreler güç hattını, iklimlendirmeyi ve ağı paylaşır. Boş yuvalar kovanın büyüyebileceği yeri gösterir (6 hücreye kadar).
  Petek A (04 ucu): Kâşif-1 ve Bekçi. Petek B (22 ucu): Kâşif-2, İşçi/Bakıcı ve FOD kutusu.
  Nöbetçi direk (termal + görünür PTZ kamera) her peteğin pistten uzak kenarında.
  Görünürlük için hücreler gerçek boyutun ≈2,5 katı modellenmiştir (istasyonla aynı ölçek).
*/

const PITCH = Math.sqrt(3) * CELL_R // aynı sıradaki iki hücrenin merkez aralığı
const ROW = 1.5 * CELL_R

/** Petek merkezine göre hücre yerleri (A için; B'de x aynalanır). 0 ve 1 dolu hücreler, pist tarafında. */
const SLOTS: [number, number][] = [
  [-PITCH / 2, 0],
  [PITCH / 2, 0],
  [1.5 * PITCH, 0],
  [-PITCH, ROW],
  [0, ROW],
  [PITCH, ROW],
]
export const MAST_HEIGHT = 5.2

export class Petek {
  group = new THREE.Group()
  private ptz: THREE.Group
  private t = 0

  constructor(
    readonly id: 'A' | 'B',
    readonly x: number,
    readonly z: number,
  ) {
    const wall = new THREE.MeshStandardMaterial({ color: '#d9dde2', roughness: 0.7 })
    const honey = new THREE.MeshStandardMaterial({ color: '#f6b93b', roughness: 0.5, emissive: new THREE.Color('#f6b93b'), emissiveIntensity: 0.25 })
    const dark = new THREE.MeshStandardMaterial({ color: '#3a4048', roughness: 0.6 })

    // dolu hücrelerin altıgen yalıtım duvarı (üstü açık: drone dikey iner)
    for (let i = 0; i < 2; i++) {
      const [cx, cz] = this.local(i)
      for (let k = 0; k < 6; k++) {
        const a0 = (Math.PI / 3) * k
        const a1 = a0 + Math.PI / 3
        const p0 = new THREE.Vector2(Math.sin(a0) * CELL_R, Math.cos(a0) * CELL_R)
        const p1 = new THREE.Vector2(Math.sin(a1) * CELL_R, Math.cos(a1) * CELL_R)
        const len = p0.distanceTo(p1)
        const mid = p0.clone().add(p1).multiplyScalar(0.5)
        const ang = Math.atan2(p1.y - p0.y, p1.x - p0.x)
        const panel = new THREE.Mesh(new THREE.BoxGeometry(len, 0.95, 0.14), wall)
        panel.position.set(cx + mid.x, 0.25 + 0.475, cz + mid.y)
        panel.rotation.y = -ang
        panel.castShadow = true
        panel.receiveShadow = true
        this.group.add(panel)
        const cap = new THREE.Mesh(new THREE.BoxGeometry(len, 0.08, 0.18), honey)
        cap.position.set(cx + mid.x, 1.24, cz + mid.y)
        cap.rotation.y = -ang
        this.group.add(cap)
      }
    }

    // boş yuvalar: zeminde kesik çizgili altıgen
    const ghostMat = new THREE.MeshBasicMaterial({ color: '#f6b93b', transparent: true, opacity: 0.1, depthWrite: false })
    const ghostLine = new THREE.LineDashedMaterial({ color: '#f6b93b', dashSize: 0.6, gapSize: 0.45, transparent: true, opacity: 0.7 })
    for (let i = 2; i < SLOTS.length; i++) {
      const [cx, cz] = this.local(i)
      const fill = new THREE.Mesh(new THREE.CircleGeometry(CELL_R * 0.96, 6).rotateX(-Math.PI / 2).rotateY(Math.PI / 6), ghostMat)
      fill.position.set(cx, 0.06, cz)
      this.group.add(fill)
      const pts = Array.from({ length: 7 }, (_, k) => {
        const a = (Math.PI / 3) * k
        return new THREE.Vector3(cx + Math.sin(a) * CELL_R * 0.96, 0.08, cz + Math.cos(a) * CELL_R * 0.96)
      })
      const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), ghostLine)
      line.computeLineDistances()
      this.group.add(line)
    }

    // ortak beton taban şeridi (hücreleri bağlayan servis yolu)
    const pad = new THREE.Mesh(new THREE.BoxGeometry(PITCH * 3.4, 0.12, CELL_R * 1.2), new THREE.MeshStandardMaterial({ color: '#a9aca8', roughness: 1 }))
    pad.position.set(this.mirror(PITCH * 0.5), 0.06, -CELL_R * 1.65)
    pad.receiveShadow = true
    this.group.add(pad)

    // nöbetçi direk: pistten uzak kenarda, termal + görünür PTZ kamera
    const mz = ROW + CELL_R + 2
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.14, MAST_HEIGHT - 0.4, 10), wall)
    mast.position.set(0, (MAST_HEIGHT - 0.4) / 2, mz)
    mast.castShadow = true
    this.group.add(mast)
    this.ptz = new THREE.Group()
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.32, 0.36), wall)
    const lensA = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.06, 12).rotateZ(Math.PI / 2), dark)
    lensA.position.set(0.27, 0.05, -0.08)
    const lensB = lensA.clone()
    lensB.position.set(0.27, 0.05, 0.09)
    const led = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), new THREE.MeshStandardMaterial({ color: '#111', emissive: new THREE.Color('#e8eef6'), emissiveIntensity: 2 }))
    led.position.set(0.18, 0.2, 0)
    this.ptz.add(head, lensA, lensB, led)
    this.ptz.position.set(0, MAST_HEIGHT - 0.2, mz)
    this.ptz.scale.setScalar(1.6)
    this.group.add(this.ptz)

    // FOD kutusu (Petek B): işçinin topladığı nesneler burada kayda geçer
    if (id === 'B') {
      const bin = new THREE.Group()
      const body = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.9, 1.1), new THREE.MeshStandardMaterial({ color: '#f2c230', roughness: 0.6 }))
      body.position.y = 0.45
      body.castShadow = true
      const band = new THREE.Mesh(new THREE.BoxGeometry(1.62, 0.16, 1.12), new THREE.MeshStandardMaterial({ color: '#1d1d1b', roughness: 0.6 }))
      band.position.y = 0.62
      bin.add(body, band)
      bin.position.set(this.mirror(-PITCH * 1.25), 0, -CELL_R * 0.4)
      this.group.add(bin)
    }

    this.group.position.set(x, 0, z)
  }

  private mirror(x: number) {
    return this.id === 'A' ? x : -x
  }

  private local(i: number): [number, number] {
    const [sx, sz] = SLOTS[i]
    return [this.mirror(sx), sz]
  }

  /** Hücrenin dünya konumu (istasyon buraya kurulur) */
  cell(i: number) {
    const [lx, lz] = this.local(i)
    return { x: this.x + lx, z: this.z + lz }
  }

  /** Nöbetçi direğin tepesi (Ek 14 katmanı ve etiketler için) */
  mastTop() {
    return new THREE.Vector3(this.x, MAST_HEIGHT, this.z + ROW + CELL_R + 2)
  }

  /** PTZ kamera pisti yavaşça tarar */
  update(dt: number) {
    this.t += dt
    // mercek yerel +x'te; +π/2 ile piste (−z) bakar
    this.ptz.rotation.y = Math.PI / 2 + Math.sin(this.t * 0.25) * 0.9
  }
}
