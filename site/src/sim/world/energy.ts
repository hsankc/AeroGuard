import * as THREE from 'three'
import { RWY } from './layout'
import { solarCellTexture } from './textures'

/*
  Enerji adası: 4 kWp güneş paneli (10 × 400 W), 3 kW helisel dikey eksenli türbin,
  20 kWh LFP batarya kabini ve kenar YZ sunucusu.
*/
export class EnergyIsland {
  group = new THREE.Group()
  private rotor = new THREE.Group()
  private serverLeds: THREE.MeshStandardMaterial[] = []
  private t = 0

  constructor(x: number, z: number) {
    const frame = new THREE.MeshStandardMaterial({ color: '#b8bec5', metalness: 0.6, roughness: 0.4 })
    const white = new THREE.MeshStandardMaterial({ color: '#eceff1', roughness: 0.6 })
    const dark = new THREE.MeshStandardMaterial({ color: '#2f353c', roughness: 0.5 })

    const pad = new THREE.Mesh(new THREE.BoxGeometry(30, 0.2, 20), new THREE.MeshStandardMaterial({ color: '#9fa29d', roughness: 1 }))
    pad.position.y = 0.1
    pad.receiveShadow = true
    this.group.add(pad)

    // Güneş panelleri: güneye bakar (azimut 180° → sahnede pist yönüne göre döndürülür), 30° eğim
    const cell = new THREE.MeshStandardMaterial({ map: solarCellTexture(), roughness: 0.25, metalness: 0.3 })
    const array = new THREE.Group()
    for (let row = 0; row < 2; row++)
      for (let i = 0; i < 5; i++) {
        const panel = new THREE.Mesh(new THREE.BoxGeometry(1.13, 0.04, 1.72), [frame, frame, cell, frame, frame, frame])
        panel.position.set(-2.4 + i * 1.2, 1.1, row * 2.6)
        panel.rotation.x = (-30 * Math.PI) / 180
        panel.castShadow = true
        array.add(panel)
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.3, 0.06), frame)
        leg.position.set(-2.4 + i * 1.2, 0.65, row * 2.6 + 0.6)
        array.add(leg)
      }
    // Panel yüzü yerel −z'ye bakar; bunu güneye (azimut 180°) çeviriyoruz.
    // Sahne açısı d (+x'ten saat yönünde) = azimut − pist yönü; yön vektörü (cos d, sin d).
    const dSouth = ((180 - RWY.heading) * Math.PI) / 180
    array.rotation.y = Math.atan2(-Math.cos(dSouth), -Math.sin(dSouth))
    array.position.set(-7, 0.2, -1)
    this.group.add(array)

    // Dikey eksenli türbin: 6 m direk + 3 m helisel rotor (3 kanat)
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.2, 6, 12), white)
    mast.position.set(8, 3.2, 0)
    mast.castShadow = true
    this.group.add(mast)
    const bladeMat = new THREE.MeshStandardMaterial({ color: '#f4f6f7', roughness: 0.35, metalness: 0.1 })
    for (let b = 0; b < 3; b++) {
      const pts: THREE.Vector3[] = []
      for (let i = 0; i <= 24; i++) {
        const tt = i / 24
        const a = (b * Math.PI * 2) / 3 + tt * ((Math.PI * 2) / 3)
        pts.push(new THREE.Vector3(Math.cos(a) * 1.0, tt * 3, Math.sin(a) * 1.0))
      }
      const blade = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.07, 6), bladeMat)
      blade.scale.set(1, 1, 1)
      blade.castShadow = true
      this.rotor.add(blade)
      for (const hy of [0.05, 2.95]) {
        const a = (b * Math.PI * 2) / 3 + (hy > 1 ? (Math.PI * 2) / 3 : 0)
        const strut = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.05, 0.08), frame)
        strut.position.set(Math.cos(a) * 0.5, hy, Math.sin(a) * 0.5)
        strut.rotation.y = -a
        this.rotor.add(strut)
      }
    }
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 3.1), frame)
    shaft.position.y = 1.5
    this.rotor.add(shaft)
    this.rotor.position.set(8, 6.2, 0)
    this.group.add(this.rotor)

    // Batarya kabini (20 kWh LFP + hibrit invertör) ve kenar sunucu kabini
    const battery = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.1, 1.3), white)
    battery.position.set(2, 1.25, -6.5)
    battery.castShadow = true
    this.group.add(battery)
    const vents = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.8, 0.02), dark)
    vents.position.set(2, 1.4, -5.84)
    this.group.add(vents)
    const server = new THREE.Mesh(new THREE.BoxGeometry(0.9, 2.1, 0.9), dark)
    server.position.set(5, 1.25, -6.5)
    server.castShadow = true
    this.group.add(server)
    for (let i = 0; i < 6; i++) {
      const m = new THREE.MeshStandardMaterial({ color: '#111', emissive: new THREE.Color(i % 3 === 0 ? '#38d26b' : '#5aaaf0'), emissiveIntensity: 1.5 })
      const led = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.03, 0.01), m)
      led.position.set(4.75 + (i % 3) * 0.12, 1.8 - Math.floor(i / 3) * 0.2, -6.04)
      this.group.add(led)
      this.serverLeds.push(m)
    }

    // küçük çit
    const fenceMat = new THREE.MeshStandardMaterial({ color: '#9aa1a8', metalness: 0.4, roughness: 0.6 })
    for (const [w, d, px, pz] of [
      [30, 0.05, 0, -10],
      [30, 0.05, 0, 10],
      [0.05, 20, -15, 0],
      [0.05, 20, 15, 0],
    ]) {
      const f = new THREE.Mesh(new THREE.BoxGeometry(w, 0.06, d), fenceMat)
      f.position.set(px, 1.6, pz)
      this.group.add(f)
    }

    this.group.position.set(x, 0, z)
  }

  /** Türbin hızı: rüzgâra bağlı, görsel olarak sınırlandırılmış (gerçek uç hız oranı daha yüksektir). */
  update(dt: number, wind: number) {
    this.t += dt
    const omega = wind < 2.5 ? 0.15 : Math.min(5.5, 0.35 * wind + 0.4)
    this.rotor.rotation.y += omega * Math.min(dt, 0.25)
    this.serverLeds.forEach((m, i) => (m.emissiveIntensity = Math.sin(this.t * (3 + i)) > 0.2 ? 1.6 : 0.2))
  }

  /** Temsili anlık üretim (kW): güneş yükseklik açısına, rüzgâr güç eğrisine bağlı. */
  static output(sunElev: number, wind: number) {
    const pv = 4 * Math.max(0, Math.sin(sunElev)) * 0.78
    const v = Math.max(0, Math.min(1, (wind - 3) / (12 - 3)))
    const turbine = wind > 25 ? 0 : 3 * v * v * v
    return { pv, turbine }
  }
}
