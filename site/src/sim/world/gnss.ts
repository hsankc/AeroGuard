import * as THREE from 'three'
import { RWY } from './layout'

/*
  Güvenli konum katmanı (V3): sinyal karıştırma ve aldatma gösterimi.
  - UWB işaretçileri: pist kenarı hizasında ≈40 küçük direk (her iki yanda ≈120 m arayla). Karıştırma sırasında
    drone'dan en yakın üç işaretçiye uzanan ölçüm çizgileri görünür: konum UWB + görsel + IMU ile sürer.
  - Karıştırıcı: çitin dışında, yerden yayılan kırmızı halkalar (biz karıştırıcı kullanmayız; bu dışarıdaki bir kaynak).
  - Aldatma: sahte GNSS konumu (kırmızı halka) ve gerçek konuma uzanan kesik çizgi; bütünlük denetleyicisi onu dışlar.
  Hepsi temsilidir.
*/

export const JAMMER = new THREE.Vector3(950, 0, -760)
const BEACON_Z = RWY.halfWidth + RWY.shoulder + 9

export class GnssLayer {
  group = new THREE.Group()
  beacons: THREE.Vector3[] = []
  private beaconLeds: THREE.MeshStandardMaterial
  private waves: THREE.Mesh[] = []
  private waveGroup = new THREE.Group()
  private ranging: THREE.LineSegments
  private ghost: THREE.Group
  private ghostLine: THREE.Line
  private t = 0
  mode: 'jam' | 'spoof' | null = null

  constructor() {
    // UWB işaretçileri
    const post = new THREE.MeshStandardMaterial({ color: '#e4e7ea', roughness: 0.6 })
    this.beaconLeds = new THREE.MeshStandardMaterial({ color: '#111', emissive: new THREE.Color('#5aaaf0'), emissiveIntensity: 0.6 })
    const postGeo = new THREE.CylinderGeometry(0.08, 0.1, 1.2, 8)
    const ledGeo = new THREE.SphereGeometry(0.16, 10, 8)
    for (let x = -RWY.half; x <= RWY.half + 0.1; x += 120)
      for (const s of [-1, 1]) {
        const p = new THREE.Vector3(x, 0, s * BEACON_Z)
        this.beacons.push(p)
        const m = new THREE.Mesh(postGeo, post)
        m.position.set(p.x, 0.6, p.z)
        const led = new THREE.Mesh(ledGeo, this.beaconLeds)
        led.position.set(p.x, 1.3, p.z)
        this.group.add(m, led)
      }

    // karıştırıcı dalgaları: yerde genişleyen halkalar
    for (let i = 0; i < 4; i++) {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.92, 1, 64).rotateX(-Math.PI / 2),
        new THREE.MeshBasicMaterial({ color: '#e0384f', transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }),
      )
      ring.position.copy(JAMMER).setY(1)
      this.waves.push(ring)
      this.waveGroup.add(ring)
    }
    const src = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.6, 1.6), new THREE.MeshStandardMaterial({ color: '#3a4048', roughness: 0.6 }))
    src.position.copy(JAMMER).setY(0.8)
    const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 3), new THREE.MeshStandardMaterial({ color: '#e0384f', emissive: new THREE.Color('#e0384f'), emissiveIntensity: 1 }))
    ant.position.copy(JAMMER).setY(3)
    this.waveGroup.add(src, ant)
    this.waveGroup.visible = false
    this.group.add(this.waveGroup)

    // UWB ölçüm çizgileri (drone → 3 işaretçi)
    this.ranging = new THREE.LineSegments(
      new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(6 * 3 * 2), 3)),
      new THREE.LineBasicMaterial({ color: '#5aaaf0', transparent: true, opacity: 0.85 }),
    )
    this.ranging.frustumCulled = false
    this.ranging.visible = false
    this.group.add(this.ranging)

    // sahte GNSS konumu
    this.ghost = new THREE.Group()
    const ring = new THREE.Mesh(new THREE.RingGeometry(2.2, 3, 6).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#e0384f', transparent: true, opacity: 0.85, side: THREE.DoubleSide, depthWrite: false }))
    const cross = new THREE.Mesh(new THREE.BoxGeometry(5, 0.1, 0.25), new THREE.MeshBasicMaterial({ color: '#e0384f' }))
    const cross2 = cross.clone()
    cross.rotation.y = Math.PI / 4
    cross2.rotation.y = -Math.PI / 4
    this.ghost.add(ring, cross, cross2)
    this.ghost.visible = false
    this.group.add(this.ghost)
    this.ghostLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]), new THREE.LineDashedMaterial({ color: '#e0384f', dashSize: 2, gapSize: 1.5 }))
    this.ghostLine.frustumCulled = false
    this.ghostLine.visible = false
    this.group.add(this.ghostLine)
  }

  setMode(m: 'jam' | 'spoof' | null) {
    this.mode = m
    this.waveGroup.visible = m === 'jam'
    if (m !== 'jam') this.ranging.visible = false
    if (m !== 'spoof') {
      this.ghost.visible = false
      this.ghostLine.visible = false
    }
  }

  /** drones: havadaki drone konumları; spoofTarget: aldatılan drone */
  update(dt: number, drones: THREE.Vector3[], spoofTarget: THREE.Vector3 | null) {
    this.t += dt
    this.beaconLeds.emissiveIntensity = this.mode === 'jam' ? 1.2 + Math.sin(this.t * 6) * 0.6 : 0.6
    if (this.mode === 'jam') {
      this.waves.forEach((w, i) => {
        const k = ((this.t * 0.35 + i / this.waves.length) % 1 + 1) % 1
        const r = 20 + k * 900
        w.scale.set(r, 1, r)
        ;(w.material as THREE.MeshBasicMaterial).opacity = 0.55 * (1 - k)
      })
      // ölçüm çizgileri: ilk iki havadaki drone için en yakın üç işaretçi
      const a = this.ranging.geometry.attributes.position as THREE.BufferAttribute
      let n = 0
      for (const p of drones.slice(0, 2)) {
        const near = [...this.beacons].sort((u, v) => u.distanceToSquared(p) - v.distanceToSquared(p)).slice(0, 3)
        for (const b of near) {
          a.setXYZ(n++, p.x, p.y, p.z)
          a.setXYZ(n++, b.x, 1.3, b.z)
        }
      }
      for (; n < a.count; n++) a.setXYZ(n, 0, -50, 0)
      a.needsUpdate = true
      this.ranging.visible = drones.length > 0
    }
    if (this.mode === 'spoof' && spoofTarget) {
      // sahte konum gerçek konumdan ≈38 m yana kaymış, yavaşça sürükleniyor
      const off = new THREE.Vector3(Math.cos(this.t * 0.2) * 8, 0, 38 + Math.sin(this.t * 0.3) * 4)
      const g = spoofTarget.clone().add(off)
      this.ghost.position.set(g.x, Math.max(0.4, spoofTarget.y), g.z)
      this.ghost.visible = true
      const pos = this.ghostLine.geometry.attributes.position as THREE.BufferAttribute
      pos.setXYZ(0, spoofTarget.x, spoofTarget.y, spoofTarget.z)
      pos.setXYZ(1, this.ghost.position.x, this.ghost.position.y, this.ghost.position.z)
      pos.needsUpdate = true
      this.ghostLine.computeLineDistances()
      this.ghostLine.visible = true
    }
  }
}
