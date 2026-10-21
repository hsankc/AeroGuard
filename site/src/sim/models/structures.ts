import * as THREE from 'three'
import { padTexture } from '../world/textures'
import { lens, MAT, mesh, rbox, tube } from './kit'
import type { DronePart } from './drones'

/*
  Petek hücresi (otomatik drone istasyonu, Dock 2 sınıfı) ve dikey eksenli helisel türbin. Gerçek ölçek, metre.
*/

class Parts {
  group = new THREE.Group()
  list: DronePart[] = []
  add(id: string, name: string, info: string, explode: [number, number, number], ...objs: THREE.Object3D[]) {
    const g = new THREE.Group()
    g.userData.partId = id
    objs.forEach((o) => g.add(o))
    this.group.add(g)
    const p = { id, name, info, obj: g, explode: new THREE.Vector3(...explode) }
    this.list.push(p)
    return p
  }
}

export type CellModel = { group: THREE.Group; parts: DronePart[]; lidL: THREE.Group; lidR: THREE.Group; cups: THREE.Group; vane: THREE.Group; led: THREE.MeshStandardMaterial; walls: THREE.Group[] }

export function buildCell(): CellModel {
  const P = new Parts()
  const R = 1.25
  const base = mesh(new THREE.CylinderGeometry(R, R * 1.02, 0.14, 6), new THREE.MeshStandardMaterial({ color: '#a7aaa6', roughness: 0.95 }), 0, 0.07, 0)
  const curb = mesh(new THREE.CylinderGeometry(R * 1.02, R * 1.02, 0.02, 6, 1, true), MAT.matte('#8d908c'), 0, 0.13, 0)
  P.add('base', 'Altıgen taban', 'Hücreler petek gibi yan yana dizilir; güç hattını, iklimlendirmeyi ve ağı paylaşır. Petek altı hücreye kadar büyür.', [0, -0.35, 0], base, curb)

  const W = 1.0
  const D = 0.82
  const H = 0.5
  const y0 = 0.14
  const body = mesh(rbox(W, H, D, 0.06, 4), MAT.shellWhite(), 0, y0 + H / 2, 0)
  const band = mesh(rbox(W + 0.004, 0.035, D + 0.004, 0.015, 2), MAT.accent('#f6b93b'), 0, y0 + H * 0.78, 0)
  const feet: THREE.Object3D[] = []
  for (const [x, z] of [
    [0.42, 0.33],
    [0.42, -0.33],
    [-0.42, 0.33],
    [-0.42, -0.33],
  ])
    feet.push(mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.03, 14), MAT.rubber(), x, y0 + 0.015, z))
  const louvers: THREE.Object3D[] = []
  for (let i = 0; i < 6; i++) louvers.push(mesh(rbox(0.012, 0.025, 0.42, 0.005, 1), MAT.matte('#c4c9ce'), -W / 2 - 0.004, y0 + 0.12 + i * 0.04, 0))
  const ledMat = new THREE.MeshStandardMaterial({ color: '#111', emissive: new THREE.Color('#38d26b'), emissiveIntensity: 2.2 })
  const led = mesh(rbox(0.28, 0.02, 0.01, 0.004, 1), ledMat, 0, y0 + H * 0.45, D / 2 + 0.004)
  const plate = mesh(new THREE.PlaneGeometry(0.22, 0.055), MAT.label('PETEK', '#f6b93b'), 0, y0 + H * 0.28, D / 2 + 0.003)
  P.add('dock', 'İstasyon gövdesi (Dock 2 sınıfı)', 'IP55, −25…45 °C. Drone’u korur, otomatik iniş ve şarj sağlar; %20 → %90, 32 dakika. Önde durum ışığı: yeşil hazır, sarı görevde, kırmızı arıza.', [0, 0, 0], body, band, led, plate, ...feet, ...louvers)

  const pad = mesh(new THREE.PlaneGeometry(W * 0.86, D * 0.86).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: padTexture('#f6b93b'), roughness: 0.8 }), 0, y0 + H + 0.004, 0)
  const bars: THREE.Object3D[] = []
  for (const z of [-1, 1]) bars.push(mesh(rbox(W * 0.8, 0.02, 0.02, 0.008, 1), MAT.alu('#c9cfd5'), 0, y0 + H + 0.014, z * D * 0.38))
  for (const x of [-1, 1]) bars.push(mesh(rbox(0.02, 0.02, D * 0.7, 0.008, 1), MAT.alu('#c9cfd5'), x * W * 0.4, y0 + H + 0.014, 0))
  const contacts: THREE.Object3D[] = []
  for (const z of [-0.12, 0.12]) contacts.push(mesh(new THREE.BoxGeometry(0.3, 0.006, 0.03), MAT.alu('#d8b56a'), 0, y0 + H + 0.008, z))
  P.add('pad', 'İniş pedi, ortalama çubukları, şarj kontakları', 'Görsel işaretle hassas iniş; çubuklar drone’u ortalar, kontaklar pede oturunca bataryayı şarj eder.', [0, 0.25, 0], pad, ...bars, ...contacts)

  const lidL = new THREE.Group()
  const lidR = new THREE.Group()
  const lidGeo = rbox(W / 2, 0.06, D + 0.02, 0.025, 3)
  const lm = mesh(lidGeo, MAT.shellWhite(), W / 4, 0, 0)
  const rm = mesh(lidGeo, MAT.shellWhite(), -W / 4, 0, 0)
  const seamL = mesh(new THREE.BoxGeometry(0.008, 0.065, D * 0.9), MAT.matte('#9aa1a8'), W / 2 - 0.004, 0, 0)
  lidL.add(lm, seamL)
  lidR.add(rm)
  lidL.position.set(-W / 2, y0 + H + 0.03, 0)
  lidR.position.set(W / 2, y0 + H + 0.03, 0)
  P.add('lids', 'Açılır kapak', 'İkiye açılan, ısıtmalı kapak (kar ve buza karşı, doğrulanacak). Kapak 500 açma-kapama çevrim testinden geçer.', [0, 0.45, 0], lidL, lidR)

  const ac = mesh(rbox(0.08, 0.34, 0.5, 0.02, 2), MAT.shell('#c9ced3'), W / 2 + 0.04, y0 + H / 2, 0)
  const fan = mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.012, 28).rotateZ(Math.PI / 2), MAT.matte('#1d2024'), W / 2 + 0.083, y0 + H / 2, 0)
  const grill: THREE.Object3D[] = []
  for (let i = -2; i <= 2; i++) grill.push(mesh(new THREE.BoxGeometry(0.004, 0.22, 0.008), MAT.alu('#aab1b8'), W / 2 + 0.09, y0 + H / 2, i * 0.045))
  P.add('climate', 'İklimlendirme', 'Hücrenin en büyük enerji kalemi: ortalama ≈100 W. Batarya ve elektronik soğukta ısıtılır, sıcakta soğutulur.', [0.45, 0, 0], ac, fan, ...grill)

  // hava istasyonu direği: anemometre, rüzgâr gülü, yağmur ölçer, RTK baz ve güvenlik kamerası
  const mx = -W / 2 + 0.07
  const mz = -D / 2 + 0.07
  const mast = tube(new THREE.Vector3(mx, y0 + H, mz), new THREE.Vector3(mx, y0 + H + 1.05, mz), 0.018, MAT.alu('#8b939c'))
  const cross = tube(new THREE.Vector3(mx - 0.22, y0 + H + 0.9, mz), new THREE.Vector3(mx + 0.22, y0 + H + 0.9, mz), 0.01, MAT.alu('#8b939c'))
  const cups = new THREE.Group()
  for (let i = 0; i < 3; i++) {
    const h = new THREE.Group()
    h.rotation.y = (i * Math.PI * 2) / 3
    h.add(mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.09).rotateZ(Math.PI / 2), MAT.matte('#30353a'), 0.045, 0, 0))
    const cup = mesh(new THREE.SphereGeometry(0.022, 14, 8, 0, Math.PI), MAT.matte('#30353a'), 0.09, 0, 0)
    cup.rotation.y = Math.PI / 2
    h.add(cup)
    cups.add(h)
  }
  cups.add(mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.03), MAT.matte('#30353a')))
  cups.position.set(mx - 0.22, y0 + H + 0.95, mz)
  const vane = new THREE.Group()
  vane.add(mesh(new THREE.BoxGeometry(0.14, 0.006, 0.006), MAT.matte('#30353a'), 0.04, 0, 0), mesh(new THREE.BoxGeometry(0.004, 0.05, 0.05), MAT.matte('#30353a'), 0.11, 0, 0))
  vane.position.set(mx + 0.22, y0 + H + 0.95, mz)
  const rtk = mesh(new THREE.SphereGeometry(0.05, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), MAT.shellWhite(), mx, y0 + H + 1.06, mz)
  const rain = mesh(new THREE.CylinderGeometry(0.035, 0.03, 0.08, 16), MAT.shellWhite(), mx + 0.06, y0 + H + 0.62, mz)
  const camHouse = mesh(rbox(0.12, 0.06, 0.06, 0.02, 2), MAT.shellWhite(), mx + 0.06, y0 + H + 0.45, mz + 0.03)
  const camLens = lens(0.014, 0.01)
  camLens.position.set(mx + 0.125, y0 + H + 0.45, mz + 0.03)
  P.add(
    'weather',
    'Hava istasyonu, RTK baz, hücre kamerası',
    'Anemometre ve rüzgâr gülü iniş-kalkış sınırını (8 m/s) ölçer; RTK baz santimetre düzeltmesi yayar. Kamera her kalkıştan önce pervaneleri ve gövdeyi kontrol eder.',
    [-0.25, 0.6, -0.25],
    mast,
    cross,
    cups,
    vane,
    rtk,
    rain,
    camHouse,
    camLens,
  )

  // altıgen yalıtım duvarı
  const walls: THREE.Group[] = []
  for (let k = 0; k < 6; k++) {
    const a0 = (Math.PI / 3) * k
    const a1 = a0 + Math.PI / 3
    const p0 = new THREE.Vector2(Math.sin(a0) * R * 0.97, Math.cos(a0) * R * 0.97)
    const p1 = new THREE.Vector2(Math.sin(a1) * R * 0.97, Math.cos(a1) * R * 0.97)
    const mid = p0.clone().add(p1).multiplyScalar(0.5)
    const ang = Math.atan2(p1.y - p0.y, p1.x - p0.x)
    const len = p0.distanceTo(p1)
    const panel = new THREE.Group()
    // duvar istasyondan alçak ve gri: istasyon içeriden görünür, beyaz yüzeyler parlamaz
    panel.add(
      mesh(rbox(len, 0.3, 0.06, 0.02, 2), MAT.matte('#aeb5bd'), 0, y0 + 0.15, 0),
      mesh(rbox(len + 0.01, 0.03, 0.08, 0.012, 1), MAT.accent('#f6b93b'), 0, y0 + 0.31, 0),
      mesh(new THREE.BoxGeometry(len * 0.8, 0.008, 0.062), MAT.matte('#8e959d'), 0, y0 + 0.1, 0),
    )
    panel.position.set(mid.x, 0, mid.y)
    panel.rotation.y = -ang
    panel.userData.out = new THREE.Vector3(mid.x, 0, mid.y).normalize().multiplyScalar(0.6)
    walls.push(panel)
  }
  P.add('walls', 'Yalıtım duvarı', 'Altıgen hücre duvarı: rüzgâr ve sıçramaya karşı koruma, komşu hücrelerle ortak yalıtım. Üstü açık: drone dikey iner.', [0, 0, 0], ...walls)
  return { group: P.group, parts: P.list, lidL, lidR, cups, vane, led: ledMat, walls }
}

/** Helisel kanat: kanat profili, sarmal yol boyunca süpürülür (kiriş teğet, kalınlık radyal). */
function helicalBlade(R: number, height: number, turn: number, chord: number, thick: number) {
  const N = 60
  const sec: [number, number][] = [
    [-0.5, 0],
    [-0.4, 0.6],
    [-0.15, 1],
    [0.15, 0.8],
    [0.5, 0.05],
    [0.15, -0.5],
    [-0.15, -0.65],
    [-0.4, -0.45],
  ]
  const pos: number[] = []
  const idx: number[] = []
  for (let i = 0; i <= N; i++) {
    const u = i / N
    const a = u * turn
    const y = u * height
    const radial = new THREE.Vector3(Math.cos(a), 0, Math.sin(a))
    const tangent = new THREE.Vector3(-Math.sin(a) * R * turn, height, Math.cos(a) * R * turn).normalize()
    const c = new THREE.Vector3(Math.cos(a) * R, y, Math.sin(a) * R)
    for (const [cx, cy] of sec) {
      const p = c.clone().addScaledVector(tangent, cx * chord).addScaledVector(radial, cy * thick)
      pos.push(p.x, p.y, p.z)
    }
  }
  const S = sec.length
  for (let i = 0; i < N; i++)
    for (let j = 0; j < S; j++) {
      const a = i * S + j
      const b = i * S + ((j + 1) % S)
      const c = (i + 1) * S + j
      const d = (i + 1) * S + ((j + 1) % S)
      idx.push(a, b, c, b, d, c)
    }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setIndex(idx)
  g.computeVertexNormals()
  return g
}

export type TurbineModel = { group: THREE.Group; parts: DronePart[]; rotor: THREE.Group }

export function buildTurbine(): TurbineModel {
  const P = new Parts()
  const concrete = new THREE.MeshStandardMaterial({ color: '#9fa29d', roughness: 1 })
  const pad = mesh(rbox(1.8, 0.4, 1.8, 0.05, 2), concrete, 0, 0.2, 0)
  const bolts: THREE.Object3D[] = []
  for (const [x, z] of [
    [0.32, 0.32],
    [0.32, -0.32],
    [-0.32, 0.32],
    [-0.32, -0.32],
  ])
    bolts.push(mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.08, 10), MAT.alu('#7d858d'), x, 0.44, z))
  P.add('foundation', 'Temel', 'Beton temel; türbin pist şeridinin dışında ve geçiş yüzeyinin altında: 255 m’de izin verilen ≈16 m, türbin ≈9,2 m.', [0, -1.2, 0], pad, ...bolts)
  const flange = mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.05, 24), MAT.alu('#8b939c'), 0, 0.43, 0)
  const mast = mesh(new THREE.CylinderGeometry(0.11, 0.2, 5.6, 24), MAT.shellWhite(), 0, 0.45 + 2.8, 0)
  const rings: THREE.Object3D[] = []
  for (const y of [1.8, 3.6]) rings.push(mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.05, 24), MAT.alu('#8b939c'), 0, y, 0))
  const door = mesh(rbox(0.14, 0.4, 0.02, 0.01, 1), MAT.matte('#c4c9ce'), 0, 0.9, 0.19)
  P.add('mast', 'Direk', '≈6 m direk; bakım kapağı ve kablolar içeride. Bakım noktaları yere yakın: yüksekte çalışma gerekmez.', [0, 0, 0], flange, mast, door, ...rings)
  const gen = mesh(new THREE.CylinderGeometry(0.3, 0.26, 0.5, 32), MAT.alu('#a5adb5'), 0, 6.3, 0)
  const fins: THREE.Object3D[] = []
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2
    const f = mesh(new THREE.BoxGeometry(0.03, 0.4, 0.008), MAT.alu('#8b939c'), Math.cos(a) * 0.3, 6.3, Math.sin(a) * 0.3)
    f.rotation.y = -a
    fins.push(f)
  }
  P.add('generator', 'Jeneratör ve fren', 'Kalıcı mıknatıslı jeneratör ve fren; ≈25 m/s’de korumaya geçer ve durur.', [0, 1.1, 0], gen, ...fins)
  const rotor = new THREE.Group()
  const bladeMat = new THREE.MeshPhysicalMaterial({ color: '#f4f6f7', roughness: 0.3, metalness: 0.05, clearcoat: 0.8 })
  const bladeGeo = helicalBlade(1.0, 3, (Math.PI * 2) / 3, 0.36, 0.06)
  for (let k = 0; k < 3; k++) {
    const b = mesh(bladeGeo, bladeMat)
    b.rotation.y = -(k * Math.PI * 2) / 3
    rotor.add(b)
    for (const hy of [0.12, 2.88]) {
      const a = (k * Math.PI * 2) / 3 + (hy > 1 ? (Math.PI * 2) / 3 : 0) * (hy / 3)
      const s = mesh(rbox(0.98, 0.04, 0.12, 0.018, 1), MAT.alu('#c3c9cf'), Math.cos(a) * 0.49, hy, Math.sin(a) * 0.49)
      s.rotation.y = -a
      rotor.add(s)
    }
  }
  rotor.add(mesh(new THREE.CylinderGeometry(0.07, 0.07, 3.1, 16), MAT.alu('#8b939c'), 0, 1.5, 0))
  rotor.position.y = 6.55
  P.add('rotor', 'Helisel rotor', '3 kanatlı helisel rotor: rüzgâr yön değiştirince dönmesi gerekmez; düşük devirli ve sessiz. ≈3 m/s’de devreye girer, ≈12 m/s’de 3 kW.', [0, 2.2, 0], rotor)
  const cab = mesh(rbox(0.6, 1.1, 0.42, 0.04, 2), MAT.shell('#5c646d'), 1.0, 0.95, 0)
  const cabDoor = mesh(new THREE.BoxGeometry(0.006, 0.9, 0.34), MAT.matte('#4a525b'), 1.303, 0.95, 0)
  const cabLed = mesh(new THREE.SphereGeometry(0.018, 10, 8), MAT.led('#38d26b'), 1.31, 1.35, 0.12)
  P.add('controller', 'Denetleyici', 'Şarj denetleyicisi ve hibrit invertöre bağlantı: türbin ve güneş LFP bataryayı doldurur.', [1.2, 0, 0], cab, cabDoor, cabLed)
  return { group: P.group, parts: P.list, rotor }
}
