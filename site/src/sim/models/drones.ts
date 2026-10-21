import * as THREE from 'three'
import { blurDisc, lens, MAT, mesh, motorGeometry, propeller, rbox, tube } from './kit'

/*
  Gerçekçi drone modelleri (gerçek ölçek, metre; burun +x).
  Kâşif ve bekçi: M3TD sınıfı katlanır gövde (≈0,36 m motor aralığı, ≈0,24 m pervane).
  İşçi: M350 sınıfı X gövde (≈0,9 m motor aralığı, ≈0,53 m pervane), karbon kollar, çift batarya,
  çift GNSS anteni, yüksek iniş takımı ve değiştirilebilir başlık (toplama ya da kamera).
  Marka ve logo kullanılmaz; gövdedeki yazı kast adıdır.
*/

export type DronePart = { id: string; name: string; info: string; obj: THREE.Group; explode: THREE.Vector3 }

export type DroneModel = {
  group: THREE.Group
  parts: DronePart[]
  props: THREE.Object3D[]
  discs: THREE.Mesh[]
  /** motorların dünya konumları için yarıçap (seyir ışıkları) */
  span: number
  setHead?: (h: 'pickup' | 'camera') => void
  updateHead?: (dt: number) => string
}

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

/** Kol: gövdedeki menteşeden motora uzanan yuvarlatılmış kesitli kol */
function arm(a: THREE.Vector3, b: THREE.Vector3, w: number, h: number, m: THREE.Material) {
  const len = a.distanceTo(b)
  const o = mesh(rbox(len, h, w, Math.min(h, w) * 0.45, 2), m)
  o.position.copy(a).add(b).multiplyScalar(0.5)
  const dir = b.clone().sub(a).normalize()
  o.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), dir)
  return o
}

export function buildScout(kind: 'scout' | 'guard', label: string): DroneModel {
  const P = new Parts()
  const accent = kind === 'scout' ? '#5aaaf0' : '#f08a4b'
  const shell = MAT.shell('#3b4148')
  const shellTop = MAT.shell('#4b525a')

  // gövde, burun ve üst kabuk
  const body = mesh(rbox(0.24, 0.072, 0.112, 0.028, 4), shell)
  const nose = mesh(new THREE.SphereGeometry(0.056, 28, 16), shell, 0.1, -0.004, 0)
  nose.scale.set(0.9, 0.62, 1)
  const top = mesh(rbox(0.19, 0.03, 0.096, 0.014, 3), shellTop, 0.0, 0.043, 0)
  const vent: THREE.Object3D[] = []
  for (let i = 0; i < 4; i++) vent.push(mesh(new THREE.BoxGeometry(0.004, 0.004, 0.05), MAT.matte('#121417'), -0.02 + i * 0.012, 0.059, 0))
  const decal = label ? mesh(new THREE.PlaneGeometry(0.11, 0.0275).rotateX(-Math.PI / 2), MAT.label(label, accent), 0.035, 0.0585, 0) : new THREE.Group()
  const stripe = mesh(rbox(0.2, 0.008, 0.114, 0.003, 1), MAT.accent(accent), 0, -0.012, 0)
  P.add('body', 'Gövde', 'Uçuş denetleyicisi, şifreli iletişim ve kenar yapay zekâ ön işlemcisi. IP54 koruma (doğrulanacak), −20…45 °C.', [0, 0, 0], body, nose, stripe)
  P.add('shell', 'Üst kabuk', 'Isı yönetimi ve su sıçramasına karşı kapak; üstünde kast adı.', [0, 0.1, 0], top, decal, ...vent)

  // arka batarya
  const bat = mesh(rbox(0.1, 0.042, 0.088, 0.012, 3), MAT.shell('#cfd4d9'), -0.12, 0.012, 0)
  const grips: THREE.Object3D[] = []
  for (let i = 0; i < 3; i++) grips.push(mesh(new THREE.BoxGeometry(0.006, 0.03, 0.09), MAT.matte('#9aa1a8'), -0.165, 0.012 + (i - 1) * 0.004, 0))
  const batLed = mesh(new THREE.BoxGeometry(0.002, 0.004, 0.03), MAT.led('#38d26b'), -0.171, 0.025, 0)
  P.add('battery', 'Akıllı batarya', 'Uçuş ≈50 dk (laboratuvar). Petek hücresinde %20 → %90, 32 dakikada şarj; soğukta ön ısıtma.', [-0.2, 0.06, 0], bat, ...grips, batLed)

  // gimbal: geniş açı + termal (+ lazer mesafe ölçer)
  const cradle = mesh(rbox(0.02, 0.03, 0.07, 0.006, 2), MAT.matte('#2a2e33'), 0.125, -0.04, 0)
  const cam = mesh(rbox(0.05, 0.045, 0.058, 0.012, 3), MAT.shell('#2f3439'), 0.145, -0.058, 0)
  const lw = lens(0.011, 0.01)
  lw.position.set(0.172, -0.054, -0.013)
  const lt = lens(0.009, 0.01)
  lt.position.set(0.172, -0.054, 0.014)
  const laser = lens(0.004, 0.006)
  laser.position.set(0.171, -0.072, 0)
  P.add('gimbal', 'Gimbal: 48 MP geniş + 640 × 512 termal', '20 m’den 28 m genişlikte iz, ≈3,5 mm/piksel: 3 cm’lik cıvata ≈8 piksel. Termal kamera gece de görür; lazer mesafe ölçer konumu doğrular.', [0.16, -0.06, 0], cradle, cam, lw, lt, laser)

  // RTK modülü ve görüş sensörleri
  const rtkBase = mesh(rbox(0.05, 0.012, 0.05, 0.005, 2), MAT.matte('#2a2e33'), 0.05, 0.064, 0)
  const rtkDome = mesh(new THREE.SphereGeometry(0.022, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), MAT.shellWhite(), 0.05, 0.07, 0)
  P.add('rtk', 'RTK ve çok bantlı GNSS', 'Santimetre düzeyinde konum. Karıştırmada UWB, görsel konum ve IMU devralır; tutarsız kaynak dışlanır.', [0, 0.16, 0], rtkBase, rtkDome)
  const sens: THREE.Object3D[] = []
  for (const z of [-0.02, 0.02]) {
    const f = lens(0.006, 0.006)
    f.position.set(0.148, 0.008, z)
    sens.push(f)
    const r = lens(0.006, 0.006)
    r.rotation.z = Math.PI / 2
    r.position.set(-0.122, 0.035, z)
    sens.push(r)
  }
  const up = lens(0.007, 0.006, 'z')
  up.rotation.set(0, 0, 0)
  up.position.set(-0.04, 0.06, 0)
  sens.push(up)
  P.add('sensors', 'Görüş sensörleri', 'Önde, arkada ve üstte görsel sensörler: engelden kaçınma ve görsel konumlama (pist işaretleri hazır bir harita).', [0.04, 0.04, 0], ...sens)

  // kollar, motorlar, pervaneler
  const arms: THREE.Object3D[] = []
  const motors: THREE.Object3D[] = []
  const props: THREE.Object3D[] = []
  const discs: THREE.Mesh[] = []
  const legs: THREE.Object3D[] = []
  const R = 0.12
  const motorAt = (x: number, y: number, z: number, ccw: boolean) => {
    const m = mesh(motorGeometry(0.018, 0.02), MAT.alu('#5d656e'), x, y, z)
    motors.push(m)
    const p = propeller(R, 0.026, ccw)
    p.position.set(x, y + 0.03, z)
    props.push(p)
    const d = blurDisc(R)
    d.position.set(x, y + 0.03, z)
    discs.push(d)
  }
  for (const s of [-1, 1]) {
    // ön kollar yatay, arka kollar aşağıdan çıkıp yukarı açılır
    const fA = new THREE.Vector3(0.06, 0.0, s * 0.05)
    const fB = new THREE.Vector3(0.15, 0.012, s * 0.18)
    arms.push(arm(fA, fB, 0.024, 0.016, shell))
    motorAt(fB.x, fB.y, fB.z, s > 0)
    const rA = new THREE.Vector3(-0.06, -0.028, s * 0.05)
    const rB = new THREE.Vector3(-0.15, 0.0, s * 0.18)
    arms.push(arm(rA, rB, 0.024, 0.016, shell))
    motorAt(rB.x, rB.y, rB.z, s < 0)
    legs.push(tube(new THREE.Vector3(0.14, 0.004, s * 0.17), new THREE.Vector3(0.14, -0.05, s * 0.17), 0.004, MAT.matte('#2a2e33')))
    legs.push(tube(new THREE.Vector3(-0.14, -0.01, s * 0.17), new THREE.Vector3(-0.14, -0.05, s * 0.17), 0.004, MAT.matte('#2a2e33')))
    // seyir ışıkları: sol kırmızı, sağ yeşil (motor altlarında)
    motors.push(mesh(new THREE.SphereGeometry(0.006, 10, 8), MAT.led(s < 0 ? '#ff3b30' : '#3dff7a'), 0.15, 0.0, s * 0.18))
  }
  P.add('arms', 'Katlanır kollar ve motorlar', 'Kollar katlanır ve hücreye sığar; fırçasız motorlar. Rüzgâr: 12 m/s’de çalışma, 8 m/s’de iniş-kalkış sınırı.', [0, 0, 0], ...arms, ...motors)
  P.add('props', 'Pervaneler', 'Hızlı takılan, uçları işaretli pervaneler. Her kalkıştan önce hücre kamerası pervaneleri ve gövdeyi kontrol eder: drone’un kendisi FOD olmamalı.', [0, 0.12, 0], ...props, ...discs)
  P.add('legs', 'İniş ayakları', 'Petek hücresindeki pede hizalanan kısa ayaklar.', [0, -0.07, 0], ...legs)

  if (kind === 'guard') {
    const horn = mesh(new THREE.CylinderGeometry(0.016, 0.04, 0.06, 24, 1, true).rotateZ(Math.PI / 2), MAT.accent(accent), -0.02, -0.06, 0)
    const hornBack = mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.03, 16).rotateZ(Math.PI / 2), MAT.matte('#2a2e33'), -0.06, -0.06, 0)
    const bar = mesh(rbox(0.11, 0.01, 0.02, 0.004, 1), MAT.led('#ffd27a'), 0.03, -0.045, 0.045)
    P.add('deter', 'Hoparlör ve ışık', 'Kuş ve hayvanı pistten ve yaklaşma koridorundan uzaklaştıran hafif hoparlör ve ışık. Etkinlik pilotta kuş gözlem kayıtlarıyla ölçülecek.', [0, -0.12, 0], horn, hornBack, bar)
  }

  // patlatmada kollar ve motorlar dışarı açılsın
  const ap = P.list.find((p) => p.id === 'arms')!
  ap.explode.set(0, 0, 0)
  ap.obj.userData.radial = 0.08
  P.list.find((p) => p.id === 'legs')!.obj.userData.radial = 0.06
  P.list.find((p) => p.id === 'props')!.obj.userData.radial = 0.1
  return { group: P.group, parts: P.list, props, discs, span: 0.235 }
}

export function buildWorker(label: string): DroneModel {
  const P = new Parts()
  const accent = '#72c766'
  const shell = MAT.shell('#2e3338')
  const body = mesh(rbox(0.34, 0.11, 0.28, 0.035, 4), shell)
  const cover = mesh(rbox(0.28, 0.035, 0.22, 0.015, 3), MAT.shell('#3d444b'), 0.01, 0.06, 0)
  const decal = mesh(new THREE.PlaneGeometry(0.16, 0.04).rotateX(-Math.PI / 2), MAT.label(label, accent), 0.07, 0.0785, 0)
  const belly = mesh(rbox(0.3, 0.02, 0.24, 0.008, 2), MAT.accent(accent), 0, -0.058, 0)
  const fpv = lens(0.012, 0.01)
  fpv.position.set(0.172, 0.01, 0)
  const navF = mesh(new THREE.BoxGeometry(0.004, 0.008, 0.06), MAT.led('#e8eef6'), 0.171, -0.02, 0)
  P.add('body', 'Gövde (M350 sınıfı)', 'Ağır sınıf gövde: azami faydalı yük ≈2,7 kg, IP55, 12 m/s rüzgâr, −20…50 °C. Uçuş ≈55 dk boş, yükle daha kısa. Önde FPV kamera.', [0, 0, 0], body, cover, decal, belly, fpv, navF)
  const bats: THREE.Object3D[] = []
  for (const z of [-0.06, 0.06]) {
    bats.push(mesh(rbox(0.075, 0.15, 0.105, 0.012, 3), MAT.shell('#d7dbe0'), -0.1, 0.11, z))
    bats.push(mesh(new THREE.BoxGeometry(0.05, 0.012, 0.03), MAT.matte('#30353a'), -0.1, 0.19, z))
    bats.push(mesh(new THREE.BoxGeometry(0.002, 0.04, 0.004), MAT.led('#38d26b'), -0.062, 0.12, z))
  }
  P.add('battery', 'Çift batarya', 'Sıcak değiştirilebilir iki batarya; biri arızalansa da güvenli iniş için yedek kalır.', [0, 0.2, 0], ...bats)
  const ants: THREE.Object3D[] = []
  for (const [x, z] of [
    [0.12, -0.1],
    [-0.02, 0.11],
  ]) {
    ants.push(tube(new THREE.Vector3(x, 0.07, z), new THREE.Vector3(x, 0.2, z), 0.006, MAT.alu('#6b737c')))
    ants.push(mesh(new THREE.CylinderGeometry(0.03, 0.033, 0.016, 20), MAT.shellWhite(), x, 0.208, z))
  }
  P.add('rtk', 'Çift RTK anteni', 'İki anten: konumun yanında yönü de santimetre düzeyinde verir. Karıştırmada UWB, görsel konum ve IMU devralır.', [0, 0.25, 0], ...ants)

  // karbon kollar, katlanma eklemleri, motorlar, pervaneler
  const arms: THREE.Object3D[] = []
  const motors: THREE.Object3D[] = []
  const props: THREE.Object3D[] = []
  const discs: THREE.Mesh[] = []
  const R = 0.265
  for (const [sx, sz] of [
    [1, 1],
    [1, -1],
    [-1, 1],
    [-1, -1],
  ]) {
    const a = new THREE.Vector3(sx * 0.13, 0.005, sz * 0.1)
    const b = new THREE.Vector3(sx * 0.32, 0.03, sz * 0.32)
    arms.push(tube(a, b, 0.016, MAT.carbon(), 16))
    const j = mesh(rbox(0.06, 0.042, 0.042, 0.01, 2), MAT.alu('#3f464d'), 0, 0, 0)
    j.position.copy(a).lerp(b, 0.22)
    j.lookAt(b)
    arms.push(j)
    const pod = mesh(rbox(0.05, 0.03, 0.05, 0.01, 2), MAT.matte('#2a2e33'), b.x, b.y - 0.012, b.z)
    motors.push(pod)
    motors.push(mesh(motorGeometry(0.036, 0.04), MAT.alu('#59616a'), b.x, b.y + 0.004, b.z))
    const ccw = sx * sz > 0
    const p = propeller(R, 0.05, ccw)
    p.position.set(b.x, b.y + 0.06, b.z)
    props.push(p)
    const d = blurDisc(R)
    d.position.set(b.x, b.y + 0.06, b.z)
    discs.push(d)
    motors.push(mesh(new THREE.SphereGeometry(0.009, 10, 8), MAT.led(sz < 0 ? '#ff3b30' : '#3dff7a'), b.x, b.y - 0.03, b.z))
  }
  P.add('arms', 'Karbon kollar ve motorlar', 'Karbon fiber kollar katlanma eklemleriyle aşağı katlanır; motorlar ve sürücüler su sıçramasına karşı korumalı.', [0, 0, 0], ...arms, ...motors)
  P.add('props', 'Pervaneler (≈53 cm)', 'Büyük, düşük devirli pervaneler: yükü taşırken daha sessiz ve verimli.', [0, 0.2, 0], ...props, ...discs)

  // yüksek iniş takımı: iki ters T, kızaklar
  const gear: THREE.Object3D[] = []
  for (const s of [-1, 1]) {
    const top1 = new THREE.Vector3(0.08, -0.05, s * 0.09)
    const top2 = new THREE.Vector3(-0.08, -0.05, s * 0.09)
    const foot = new THREE.Vector3(0, -0.36, s * 0.2)
    gear.push(tube(top1, foot.clone().setX(0.06), 0.011, MAT.carbon()), tube(top2, foot.clone().setX(-0.06), 0.011, MAT.carbon()))
    gear.push(tube(new THREE.Vector3(0.22, -0.365, s * 0.2), new THREE.Vector3(-0.22, -0.365, s * 0.2), 0.013, MAT.carbon()))
    for (const x of [-0.22, 0.22]) gear.push(mesh(new THREE.SphereGeometry(0.016, 12, 10), MAT.rubber(), x, -0.365, s * 0.2))
  }
  P.add('gear', 'İniş takımı', 'Yüksek iniş takımı: alttaki başlığa yerden açıklık bırakır.', [0, -0.22, 0], ...gear)
  const mount = mesh(rbox(0.09, 0.03, 0.09, 0.01, 2), MAT.alu('#3f464d'), 0.04, -0.08, 0)
  P.add('mount', 'Başlık yuvası', 'Hızlı başlık değişimi: aynı gövde toplama başlığıyla işçi, kamera başlığıyla bakıcı olur.', [0, -0.14, 0], mount)

  // toplama başlığı: vinç, kablo, elektro-kalıcı mıknatıs, yumuşak kıskaç
  const pickup = new THREE.Group()
  pickup.add(mesh(rbox(0.12, 0.06, 0.09, 0.012, 2), MAT.shell('#3a4047'), 0.04, -0.125, 0))
  pickup.add(mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.08, 20).rotateX(Math.PI / 2), MAT.alu('#8a929b'), 0.04, -0.125, 0))
  pickup.add(tube(new THREE.Vector3(0.04, -0.155, 0), new THREE.Vector3(0.04, -0.45, 0), 0.003, MAT.matte('#1d1d1b'), 6))
  pickup.add(mesh(new THREE.CylinderGeometry(0.055, 0.06, 0.035, 28), new THREE.MeshPhysicalMaterial({ color: '#b3261e', roughness: 0.3, metalness: 0.6, clearcoat: 0.6 }), 0.04, -0.47, 0))
  pickup.add(mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.008, 24), MAT.alu('#c9cfd5'), 0.04, -0.49, 0))
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2
    const f = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.008, 8, 16, Math.PI * 0.55), MAT.accent(accent))
    f.position.set(0.04 + Math.cos(a) * 0.045, -0.5, Math.sin(a) * 0.045)
    f.rotation.set(0, -a, Math.PI * 1.1)
    f.castShadow = true
    pickup.add(f)
  }
  // kamera başlığı (bakıcı): geniş + yakınlaştırma + termal + lazer
  const camera = new THREE.Group()
  camera.add(mesh(rbox(0.03, 0.07, 0.14, 0.008, 2), MAT.matte('#2a2e33'), 0.04, -0.13, 0))
  camera.add(mesh(rbox(0.12, 0.1, 0.11, 0.018, 3), MAT.shellWhite(), 0.06, -0.2, 0))
  for (const [z, r] of [
    [-0.03, 0.016],
    [0.0, 0.02],
    [0.032, 0.013],
  ]) {
    const l = lens(r, 0.012)
    l.position.set(0.121, -0.195, z)
    camera.add(l)
  }
  const lz = lens(0.006, 0.008)
  lz.position.set(0.121, -0.235, 0)
  camera.add(lz)
  camera.visible = false
  const head = P.add('head', 'Toplama başlığı', '', [0, -0.3, 0], pickup, camera)
  const INFO = {
    pickup: [
      'Toplama başlığı',
      'Vinç başlığı kabloyla indirir; drone nesnenin 4 m üstünde asılı kalır. Metalde elektro-kalıcı mıknatıs (güç kesilse de tutar), metal olmayanda yumuşak kıskaç. Vinç + başlık ≈1,2 kg; toplama sınırı ≤ 1 kg ve ≤ 30 cm.',
    ],
    camera: [
      'Kamera başlığı (bakıcı)',
      'Geniş, yakınlaştırma ve termal kamera: kış sabahı park eden uçağın kırağı haritası. Sıvı sıkmaz; uçağın üzerinden geçmez, gövdeye ≥ 6 m. Olgunluk TRL 3–4; hiperspektral kamera ileride eklenecek bir başlık.',
    ],
  } as const
  head.name = INFO.pickup[0]
  head.info = INFO.pickup[1]
  let current: 'pickup' | 'camera' = 'pickup'
  let target: 'pickup' | 'camera' = 'pickup'
  let swap = 1
  return {
    group: P.group,
    parts: P.list,
    props,
    discs,
    span: 0.45,
    setHead: (h) => {
      if (h === target) return
      target = h
      swap = 0
    },
    // başlık değişimi: eski başlık iner ve küçülür, yenisi aşağıdan gelip yuvasına oturur
    updateHead: (dt) => {
      if (swap < 1) {
        swap = Math.min(1, swap + dt / 1.4)
        const oldG = current === 'pickup' ? pickup : camera
        const newG = target === 'pickup' ? pickup : camera
        if (swap < 0.5) {
          const k = swap / 0.5
          oldG.visible = true
          oldG.position.y = -k * 0.4
          oldG.scale.setScalar(1 - k * 0.6)
        } else {
          const k = (swap - 0.5) / 0.5
          oldG.visible = false
          oldG.position.y = 0
          oldG.scale.setScalar(1)
          newG.visible = true
          newG.position.y = -(1 - k) * 0.4
          newG.scale.setScalar(0.4 + k * 0.6)
          if (swap >= 1) current = target
        }
        head.name = INFO[target][0]
        head.info = INFO[target][1]
      }
      return head.name
    },
  }
}
