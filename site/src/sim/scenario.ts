import * as THREE from 'three'
import type { Mission, DroneSim } from './mission/mission'
import type { FodField } from './world/fod'
import type { PheromoneLayer } from './world/pheromone'
import type { Petek } from './world/petek'
import { buildAirliner } from './world/aircraft'
import { DroneVisual } from './world/drone'
import { AlertLink, cracks, Fire, Flock, IceZones, Person, Puddle, Responder, RfWaves, type Effect } from './world/effects'
import { LAYOUT, RWY } from './world/layout'

/*
  Senaryo yönetmeni: 12 acil durum senaryosu ve kış sabahı buz haritası, saniye saniye.
  Zaman çizelgesi simülasyon saniyesidir; sahne `rate` kat hızlı oynar. Süreler temsilidir:
  nöbetçi uyarısı ≤ 10 sn hedefi, kule onayından sonra en yakın drone ≈60 sn, ICAO'nun itfaiye için 3 dk hedefi.
  Kovan itfaiyenin yerini almaz; "ilk gören"dir.
*/

export type SceneId = 'fire' | 'excursion' | 'tire' | 'bird' | 'leak' | 'intrusion' | 'rogue' | 'quake' | 'grid' | 'smoke' | 'search' | 'landing' | 'ice'

export type Beat = { t: number; text: string; kind?: 'alert' | 'ok' | 'info' }

export type SceneCtx = {
  root: THREE.Group
  mission: Mission
  fod: FodField
  pheromone: PheromoneLayer
  peteks: Petek[]
  parked: THREE.Group
  setClock: (sec: number) => void
}

type SceneDef = {
  title: string
  first: string
  rate: number
  duration: number
  clock: number
  focus: [number, number, number]
  radius: number
  height: number
  beats: (Beat & { run?: (r: SceneRun) => void })[]
  setup?: (r: SceneRun) => void
  tick?: (r: SceneRun, t: number, dt: number) => void
}

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z)
const ARFF = [V(-126, 0, -190), V(-126, 0, -70)]
const TOWER_TOP = V(LAYOUT.tower.x, 33, LAYOUT.tower.z)

/** Bir sahnenin çalışan hali: efektler, araçlar ve yardımcılar */
export class SceneRun {
  effects: Effect[] = []
  responders: Responder[] = []
  vars: Record<string, unknown> = {}
  t = 0
  constructor(readonly c: SceneCtx) {}

  add<T extends Effect>(e: T) {
    this.effects.push(e)
    this.c.root.add(e.group)
    return e
  }

  /** En yakın peteğin nöbetçi direği */
  mast(p: THREE.Vector3) {
    return [...this.c.peteks].sort((a, b) => Math.hypot(a.x - p.x, a.z - p.z) - Math.hypot(b.x - p.x, b.z - p.z))[0].mastTop()
  }

  /** Olaya en yakın kâşif */
  nearestScout(p: THREE.Vector3): DroneSim {
    const [a, b] = this.c.mission.drones
    const da = Math.hypot(a.station.padTop.x - p.x, a.station.padTop.z - p.z)
    const db = Math.hypot(b.station.padTop.x - p.x, b.station.padTop.z - p.z)
    return da <= db ? a : b
  }

  alert(from: THREE.Vector3, to: THREE.Vector3, life = 40, color?: string) {
    this.add(new AlertLink(from, to, color, life))
  }

  /** Kurtarma ya da güvenlik aracı: start → arrive saniyelerinde yolu tamamlar */
  vehicle(path: THREE.Vector3[], start: number, arrive: number, kind: 'arff' | 'security') {
    const v = new Responder(path, start, arrive, kind)
    this.responders.push(v)
    this.c.root.add(v.group)
    return v
  }

  airliner(pos: THREE.Vector3, yaw: number) {
    const a = buildAirliner()
    a.group.position.copy(pos)
    a.group.rotation.y = yaw
    a.group.traverse((o) => ((o as THREE.Mesh).isMesh ? (o.castShadow = true) : null))
    this.c.root.add(a.group)
    return a.group
  }

  /** Şebeke direği ve kırmızı "kesik" işareti (enerji adasının yanında) */
  gridOutage() {
    const g = new THREE.Group()
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.35, 12, 8), new THREE.MeshStandardMaterial({ color: '#8d969f' }))
    pole.position.y = 6
    const arm = new THREE.Mesh(new THREE.BoxGeometry(5, 0.3, 0.3), new THREE.MeshStandardMaterial({ color: '#8d969f' }))
    arm.position.y = 11.5
    const x1 = new THREE.Mesh(new THREE.BoxGeometry(7, 0.7, 0.7), new THREE.MeshBasicMaterial({ color: '#e0384f' }))
    x1.position.y = 6
    x1.rotation.z = Math.PI / 4
    const x2 = x1.clone()
    x2.rotation.z = -Math.PI / 4
    g.add(pole, arm, x1, x2)
    g.position.set(LAYOUT.energy.x + 34, 0, LAYOUT.energy.z + 18)
    this.c.root.add(g)
  }
}

/** İtfaiye binasından taksi yolu hizasına, oradan olayın pist dışı tarafına */
const runwayArff = (target: THREE.Vector3) => [...ARFF, V(target.x - 40, 0, -40), target.clone().add(V(-22, 0, -14))]

export const SCENES: Record<SceneId, SceneDef> = {
  fire: {
    title: 'İnişte fren veya motor yangını',
    first: 'Nöbetçi termal kamera',
    rate: 5,
    duration: 210,
    clock: 10 * 3600 + 40 * 60,
    focus: [230, 4, 0],
    radius: 150,
    height: 70,
    setup: (r) => {
      r.airliner(V(250, 0, 6), 0)
      r.vars.fire = r.add(new Fire(V(249.5, 0.4, 2.2), 1.2))
    },
    beats: [
      { t: 0, text: 'Uçak indi; sol ana iniş takımında fren yangını başladı.', kind: 'alert' },
      { t: 3, text: 'Petek B nöbetçi direği termal kamerada sıcak noktayı fark etti.', kind: 'alert', run: (r) => r.alert(r.mast(V(250, 0, 0)), V(249, 2, 2)) },
      { t: 8, text: 'Kule ve itfaiye uyarıldı: konum ve termal görüntü (hedef ≤ 10 sn).', run: (r) => r.alert(TOWER_TOP, V(249, 2, 2), 30, '#f6b93b') },
      { t: 14, text: 'Kule onayladı: en yakın kâşif kalkıyor.', run: (r) => r.c.mission.respond(r.nearestScout(V(250, 0, 0)), V(215, 0, -40), 30, 400) },
      { t: 20, text: 'İtfaiye yola çıktı.', run: (r) => r.vehicle(runwayArff(V(250, 0, 6)), 20, 180, 'arff') },
      { t: 110, text: 'Kâşif olay yerinde: 30 m’den, uçağın üzerine girmeden termal görüntü itfaiyeye akıyor.', kind: 'ok' },
      { t: 180, text: 'İtfaiye olay yerinde (ICAO hedefi 3 dk). Kovan ekibe ilk dakikalarda göz oldu.', kind: 'ok' },
    ],
  },
  excursion: {
    title: 'Pist dışına çıkma',
    first: 'Nöbetçi, iz takibi',
    rate: 5,
    duration: 210,
    clock: 15 * 3600,
    focus: [820, 4, 70],
    radius: 160,
    height: 75,
    setup: (r) => {
      const a = r.airliner(V(820, 0, 78), -0.38)
      a.rotation.z = 0.03
    },
    beats: [
      { t: 0, text: 'İnişte uçak pistin sağına çıktı, çimde durdu.', kind: 'alert' },
      { t: 4, text: 'Nöbetçi direk iz takibiyle uçağın pistten çıktığını gördü.', kind: 'alert', run: (r) => r.alert(r.mast(V(820, 0, 78)), V(820, 3, 78)) },
      { t: 8, text: 'Kule, itfaiye ve sağlık ekibi uyarıldı: uçağın konumu.', run: (r) => r.alert(TOWER_TOP, V(820, 3, 78), 30, '#f6b93b') },
      { t: 14, text: 'Kule onayladı: en yakın kâşif kalkıyor.', run: (r) => r.c.mission.respond(r.nearestScout(V(820, 0, 78)), V(790, 0, 40), 32, 400) },
      { t: 20, text: 'İtfaiye ve ambulans yola çıktı.', run: (r) => r.vehicle([...ARFF, V(700, 0, -40), V(790, 0, 55)], 20, 175, 'arff') },
      {
        t: 75,
        text: 'Kâşif termal kamerayla uçağın dışındaki 3 kişiyi saydı; konumları ekibe gönderildi.',
        kind: 'ok',
        run: (r) => {
          for (const [x, z] of [
            [800, 98],
            [806, 104],
            [842, 96],
          ])
            r.add(new Person([V(x, 0, z)], 0, { thermal: true, color: '#f2c230' }))
        },
      },
      { t: 175, text: 'Ekipler olay yerinde. Pist kapalı; kalkan parçalar için sonra tarama yapılacak.', kind: 'ok' },
    ],
  },
  tire: {
    title: 'Lastik patlaması ve parçalanma',
    first: 'Nöbetçi',
    rate: 12,
    duration: 770,
    clock: 9 * 3600,
    focus: [-300, 4, 0],
    radius: 420,
    height: 170,
    setup: (r) => {
      const f = r.c.fod
      f.add('tire', -320, 6)
      f.add('tire', -265, -9)
      f.add('bolt', -300, 14)
      f.add('plastic', -240, 4)
    },
    beats: [
      { t: 0, text: 'Kalkışta lastik patladı; parçalar pistte.', kind: 'alert' },
      { t: 4, text: 'Petek A nöbetçi direği parçalanmayı gördü.', kind: 'alert', run: (r) => r.alert(r.mast(V(-300, 0, 0)), V(-290, 1, 0)) },
      { t: 9, text: 'Kule uyarıldı; sonraki harekete kadar pist kapatıldı.', run: (r) => r.alert(TOWER_TOP, V(-290, 1, 0), 30, '#f6b93b') },
      { t: 15, text: 'Kâşifler hareket sonrası taramaya kalktı.', run: (r) => r.c.mission.launch('fod') },
      { t: 380, text: 'Kâşif konumu işçiye bildirdi (sallanma dansı): işçi küçük parçaları topluyor; büyük lastik parçaları saha ekibine.', kind: 'ok' },
      { t: 760, text: 'Tarama bitti: rapor kuleye. Pist, saha ekibi büyük parçaları kaldırınca açılır.', kind: 'ok' },
    ],
  },
  bird: {
    title: 'Kuş çarpması bildirimi',
    first: 'Pilot bildirimi',
    rate: 3,
    duration: 170,
    clock: 7 * 3600 + 40 * 60,
    focus: [-640, 6, 30],
    radius: 190,
    height: 80,
    setup: (r) => {
      r.vars.flock = r.add(new Flock(V(-600, 12, 60), 18))
    },
    tick: (r) => {
      const fl = r.vars.flock as Flock
      const g = r.c.mission.guard
      fl.threat = g.airborne && g.pos.distanceTo(V(-600, 12, 60)) < 260 ? g.pos.clone() : null
    },
    beats: [
      { t: 0, text: 'Pilot kalkıştan sonra kuş çarpması bildirdi.', kind: 'alert' },
      { t: 6, text: 'Kule kovanı çağırdı: kalıntı araması ve sürüyü uzaklaştırma.', run: (r) => r.alert(TOWER_TOP, V(-650, 1, 5), 30, '#f6b93b') },
      {
        t: 12,
        text: 'Kâşif-1 kalıntıyı aramaya, Bekçi sürüye kalkıyor (iki kast aynı anda).',
        run: (r) => {
          r.c.mission.respond(r.c.mission.drones[0], V(-650, 0, 5), 15, 400)
          r.c.mission.respond(r.c.mission.guard, V(-600, 0, 60), 25, 400)
        },
      },
      { t: 75, text: 'Bekçi hoparlör ve ışıkla sürüyü pistten ve yaklaşma koridorundan uzaklaştırdı.', kind: 'ok' },
      { t: 95, text: 'Kâşif kalıntıyı buldu ve ortak haritaya işaretledi; saha ekibi kaldıracak.', kind: 'ok', run: (r) => r.c.pheromone.mark(-650, 5) },
    ],
  },
  leak: {
    title: 'Yakıt veya hidrolik sızıntısı',
    first: 'Termal ve RGB kamera',
    rate: 4,
    duration: 170,
    clock: 11 * 3600,
    focus: [272, 4, -228],
    radius: 110,
    height: 55,
    setup: (r) => {
      r.vars.puddle = r.add(new Puddle(V(275.7, 0, -231), 0.06, 7))
    },
    beats: [
      { t: 0, text: 'Park eden uçağın sağ motorunun altında sızıntı başladı.', kind: 'alert' },
      { t: 5, text: 'Nöbetçi PTZ kamera termal ve görünür görüntüde lekeyi fark etti.', kind: 'alert', run: (r) => r.alert(r.mast(V(275, 0, -231)), V(275.7, 0.5, -231)) },
      { t: 10, text: 'Apron ve itfaiye uyarıldı.', run: (r) => r.alert(TOWER_TOP, V(275.7, 0.5, -231), 30, '#f6b93b') },
      { t: 16, text: 'En yakın kâşif lekeyi izlemeye kalkıyor.', run: (r) => r.c.mission.respond(r.nearestScout(V(275, 0, -231)), V(300, 0, -255), 20, 400) },
      { t: 24, text: 'İtfaiye köpükle yola çıktı.', run: (r) => r.vehicle([V(-126, 0, -190), V(150, 0, -195), V(258, 0, -240)], 24, 150, 'arff') },
      { t: 115, text: 'Kâşif alanı ortak haritaya işaretledi ve büyümesini izliyor.', kind: 'ok', run: (r) => r.c.pheromone.mark(275.7, -231) },
      { t: 150, text: 'İtfaiye olay yerinde. Kovan alanı izlemeyi sürdürüyor.', kind: 'ok' },
    ],
  },
  intrusion: {
    title: 'Çitten izinsiz giriş',
    first: 'Bekçi devriyesi',
    rate: 3,
    duration: 170,
    clock: 13 * 3600,
    focus: [-1450, 6, -140],
    radius: 160,
    height: 70,
    setup: (r) => {
      r.add(new Person([V(-1505, 0, -185), V(-1460, 0, -160), V(-1420, 0, -120)], 0.8))
    },
    beats: [
      { t: 0, text: 'Bekçi çit devriyesinde: batı çitinde bir kişi içeri girdi.', kind: 'alert', run: (r) => r.c.mission.respond(r.c.mission.guard, V(-1440, 0, -140), 25, 400, V(-1440, 25, 120)) },
      { t: 6, text: 'Bekçi termal kamerada kişiyi gördü; konum ve görüntü güvenliğe.', kind: 'alert', run: (r) => r.alert(TOWER_TOP, V(-1460, 1, -160), 30, '#f6b93b') },
      { t: 12, text: 'Güvenlik aracı yönlendirildi.', run: (r) => r.vehicle([V(330, 0, -300), V(-200, 0, -260), V(-1380, 0, -150)], 12, 150, 'security') },
      { t: 60, text: 'Bekçi kişinin üstünde değil, yanında: izliyor ve yönünü güvenliğe aktarıyor.', kind: 'ok' },
      { t: 150, text: 'Güvenlik ekibi olay yerinde.', kind: 'ok' },
    ],
  },
  rogue: {
    title: 'İzinsiz drone',
    first: 'RF izleyici, Remote ID',
    rate: 1,
    duration: 60,
    clock: 12 * 3600,
    focus: [-300, 30, 0],
    radius: 520,
    height: 200,
    setup: (r) => {
      const dv = new DroneVisual(9, '#e0384f', 'guard')
      r.c.root.add(dv.root)
      r.vars.rogue = dv
      r.add(new RfWaves(V(LAYOUT.stationA.x, 0, LAYOUT.stationA.z)))
      const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([V(0, 0, 0), V(0, 0, 0)]), new THREE.LineDashedMaterial({ color: '#e0384f', dashSize: 8, gapSize: 5 }))
      line.frustumCulled = false
      r.c.root.add(line)
      r.vars.line = line
    },
    tick: (r, t, dt) => {
      const dv = r.vars.rogue as DroneVisual
      const a = t * 0.12
      const p = V(-250 + Math.cos(a) * 220, 60, -120 + Math.sin(a) * 140)
      dv.update(p, a + Math.PI / 2, 9, true, false, dt, 0)
      const line = r.vars.line as THREE.Line
      const pos = line.geometry.attributes.position as THREE.BufferAttribute
      const m = r.mast(V(-1000, 0, 0))
      pos.setXYZ(0, m.x, m.y, m.z)
      pos.setXYZ(1, p.x, p.y, p.z)
      pos.needsUpdate = true
      line.computeLineDistances()
    },
    beats: [
      { t: 0, text: 'Tarifede olmayan küçük bir drone havalimanına yaklaşıyor.', kind: 'alert' },
      { t: 3, text: 'Petek RF izleyicisi ve Remote ID: konumu, yönü ve operatörün yeri belirlendi.', kind: 'alert' },
      { t: 8, text: 'Kule ve güvenlik uyarıldı. Kovan drone’ları yerde kalıyor; biz müdahale etmeyiz.' },
      { t: 30, text: 'Kule hareketleri bekletiyor; karşı-İHA yetkisi askerî birimde. Kovan izlemeyi sürdürüyor.', kind: 'ok' },
    ],
  },
  quake: {
    title: 'Deprem sonrası pist hasarı',
    first: 'Kule çağrısı',
    rate: 12,
    duration: 770,
    clock: 14 * 3600,
    focus: [0, 4, 0],
    radius: 900,
    height: 330,
    setup: (r) => {
      r.c.root.add(cracks([V(-500, 0, 2), V(100, 0, -4), V(650, 0, 6)]))
      r.gridOutage()
    },
    beats: [
      { t: 0, text: 'Deprem: şebeke kesildi, havalimanı yardım uçuşları için pistin durumunu soruyor.', kind: 'alert' },
      { t: 5, text: 'Kovan şebekeden bağımsız: petekler enerji adasının bataryasıyla çalışıyor.', kind: 'ok' },
      { t: 10, text: 'Kule çağrısı: pist hasar taraması.', run: (r) => r.alert(TOWER_TOP, V(0, 1, 0), 30, '#f6b93b') },
      { t: 15, text: 'Kâşifler pisti 20 m’den üç geçişle taramaya kalktı.', run: (r) => r.c.mission.launch('fod') },
      {
        t: 240,
        text: 'Çatlaklar ortak haritaya işaretlendi (konum ve fotoğrafla).',
        kind: 'ok',
        run: (r) => [-500, 100, 650].forEach((x) => r.c.pheromone.mark(x, 0)),
      },
      { t: 760, text: 'Tarama ≈12 dk’da bitti: hasar haritası kuleye ve AFAD’a. Pistin kullanılabilirliğine yetkililer karar verir.', kind: 'ok' },
    ],
  },
  grid: {
    title: 'Şebeke kesintisi',
    first: 'Enerji yönetimi',
    rate: 2,
    duration: 90,
    clock: 10 * 3600,
    focus: [LAYOUT.energy.x, 4, LAYOUT.energy.z],
    radius: 70,
    height: 30,
    setup: (r) => r.gridOutage(),
    beats: [
      { t: 0, text: 'Şebeke kesildi.', kind: 'alert' },
      { t: 2, text: 'Hibrit invertör kesintisiz olarak ada moduna geçti: hücreler bataryadan besleniyor.', kind: 'ok' },
      { t: 6, text: 'Teknik birim bilgilendirildi.' },
      { t: 12, text: 'Güneş ve türbin bataryayı doldurmaya devam ediyor; Çanakkale kovanında özerklik ≈1 gün.', kind: 'ok' },
      { t: 20, text: 'Planlı tarama şebekesiz de kalkıyor.', run: (r) => r.c.mission.launch('fod') },
    ],
  },
  smoke: {
    title: 'Çevrede yangın ve duman',
    first: 'Bekçi',
    rate: 2,
    duration: 120,
    clock: 16 * 3600,
    focus: [-1560, 20, 420],
    radius: 360,
    height: 140,
    setup: (r) => {
      r.add(new Fire(V(-1780, 0, 720), 3.2, false))
      r.add(new Fire(V(-1830, 0, 690), 2.6, true))
    },
    beats: [
      { t: 0, text: 'Çitin dışında anız yangını; duman yükseliyor.', kind: 'alert', run: (r) => r.c.mission.respond(r.c.mission.guard, V(-1480, 0, 280), 30, 400, V(-1250, 25, 285)) },
      { t: 5, text: 'Bekçi devriyede dumanı gördü.', kind: 'alert', run: (r) => r.alert(r.c.mission.guard.pos.clone(), V(-1780, 4, 720), 30) },
      { t: 10, text: 'Kule uyarıldı: görüş ve dumanın yönü.', run: (r) => r.alert(TOWER_TOP, V(-1780, 4, 720), 30, '#f6b93b') },
      { t: 60, text: 'Bekçi çit hattından izliyor; duman pist yönüne değil. Kule görüşü izlemeyi sürdürüyor.', kind: 'ok' },
    ],
  },
  search: {
    title: 'Gece kayıp kişi araması',
    first: 'Kule çağrısı',
    rate: 5,
    duration: 300,
    clock: 23 * 3600 + 20 * 60,
    focus: [480, 6, 200],
    radius: 220,
    height: 110,
    setup: (r) => {
      r.add(new Person([V(520, 0, 232)], 0, { lying: true, thermal: true }))
    },
    beats: [
      { t: 0, text: 'Gece: kule bir personelin kaybolduğunu bildirdi.', kind: 'alert', run: (r) => r.alert(TOWER_TOP, V(480, 1, 200), 30, '#f6b93b') },
      {
        t: 6,
        text: 'Bekçi termal aramaya kalktı (şerit şerit, 30 m).',
        run: (r) =>
          r.c.mission.route(
            r.c.mission.guard,
            [
              [300, 260],
              [700, 260],
              [700, 225],
              [300, 225],
              [300, 190],
              [700, 190],
            ],
            30,
            6,
          ),
      },
      { t: 210, text: 'Bekçi termalde kişiyi buldu; konum güvenliğe gönderildi.', kind: 'ok', run: (r) => r.c.pheromone.mark(520, 232) },
      { t: 215, text: 'Güvenlik ve sağlık ekibi yönlendirildi.', run: (r) => r.vehicle([V(330, 0, -300), V(330, 0, -60), V(500, 0, 215)], 215, 290, 'security') },
      { t: 290, text: 'Ekip kişinin yanında.', kind: 'ok' },
    ],
  },
  landing: {
    title: 'Acil iniş beklentisi',
    first: 'Kule çağrısı',
    rate: 15,
    duration: 900,
    clock: 17 * 3600,
    focus: [-300, 6, 0],
    radius: 1100,
    height: 360,
    setup: (r) => {
      const a = r.airliner(V(-7000, 330, 0), 0)
      a.visible = false
      r.vars.plane = a
    },
    tick: (r, t) => {
      const a = r.vars.plane as THREE.Group
      const T0 = 700
      const TD = 775
      const STOP = 815
      if (t < T0) return
      a.visible = t < 860
      const touch = V(-RWY.half + 400, 0, 0)
      if (t < TD) {
        const k = (t - T0) / (TD - T0)
        a.position.lerpVectors(V(-6000, 280, 0), touch, k)
        a.rotation.z = 0.05
      } else if (t < STOP) {
        const k = (t - TD) / (STOP - TD)
        a.position.set(touch.x + (1 - (1 - k) ** 2) * 1200, 0, 0)
        a.rotation.z = 0
      } else {
        const k = Math.min(1, (t - STOP) / 40)
        a.position.set(touch.x + 1200, 0, -k * 70)
        a.rotation.y = -k * (Math.PI / 2)
      }
    },
    beats: [
      { t: 0, text: 'Kule: bir uçak teknik arızayla acil iniş yapacak, ≈13 dk sonra.', kind: 'alert', run: (r) => r.alert(TOWER_TOP, V(0, 1, 0), 30, '#f6b93b') },
      { t: 5, text: 'Kâşifler inişten önce pisti taramaya kalktı.', run: (r) => r.c.mission.launch('fod') },
      { t: 760, text: 'Temiz pist raporu kuleye; kâşifler peteklerinde.', kind: 'ok' },
      { t: 775, text: 'Uçak indi; itfaiye pist kenarında hazırdı.', kind: 'alert' },
      { t: 860, text: 'Uçak pisti boşalttı: kâşifler inişten hemen sonra yeniden taramaya kalkıyor.', kind: 'ok', run: (r) => r.c.mission.launch('fod') },
    ],
  },
  ice: {
    title: 'Kış sabahı buz haritası',
    first: 'Bakıcı (işçinin kamera başlığı)',
    rate: 3,
    duration: 210,
    clock: 8 * 3600,
    focus: [270, 6, -227],
    radius: 75,
    height: 32,
    setup: (r) => {
      // buz bölgeleri park eden uçağın yerel koordinatlarında: grubu uçağa bağla (sahne köküne değil)
      const z = new IceZones()
      r.c.parked.add(z.group)
      r.effects.push(z)
      r.vars.ice = z
      r.vars.iceRoot = z.group
    },
    tick: (r, t) => {
      const w = r.c.mission.worker
      if (w.mode === 'patrol' && r.vars.t0 === undefined) r.vars.t0 = t
      const t0 = r.vars.t0 as number | undefined
      if (t0 !== undefined) (r.vars.ice as IceZones).setProgress((t - t0) / 72)
    },
    beats: [
      { t: 0, text: 'Kış sabahı, −3 °C, açık ve sakin: kırağı koşulu. METAR’da dondurucu sis, çisenti, yağmur, kar yok: uçabilir.', kind: 'ok' },
      {
        t: 6,
        text: 'Bakıcı (işçinin kamera başlığıyla) Petek B’den kalkıyor.',
        run: (r) =>
          r.c.mission.route(
            r.c.mission.worker,
            [
              [244, -254],
              [296, -254],
              [296, -200],
              [244, -200],
              [244, -254],
            ],
            13,
            3,
          ),
      },
      { t: 100, text: 'Uçağın çevresinde: gövdeye ≥ 6 m, irtifa ≤ kuyruk + 3 m, hız ≤ 3 m/s. Uçağın üzerinden asla geçmez.' },
      { t: 175, text: 'Kanat, stabilizör ve gövde üstündeki kırağı haritalandı: püskürtme bölgeleri de-icing ekibinin tabletinde.', kind: 'ok' },
      { t: 190, text: 'Sıvıyı ekip sıkar; “uçak temiz” kararı kaptan ve ekibindir. İşlemden sonra kontrol uçuşu yapılır.' },
    ],
  },
}

/** Motorun sahibi olduğu yönetmen: sahneyi kurar, zaman çizelgesini yürütür, kamerayı söyler. */
export class ScenarioDirector {
  id: SceneId | null = null
  run: SceneRun | null = null
  private fired = new Set<number>()

  constructor(private ctx: () => SceneCtx) {}

  get def() {
    return this.id ? SCENES[this.id] : null
  }

  start(id: SceneId) {
    this.stop()
    this.id = id
    const c = this.ctx()
    const def = SCENES[id]
    c.setClock(def.clock)
    this.run = new SceneRun(c)
    this.fired.clear()
    def.setup?.(this.run)
  }

  stop() {
    const r = this.run
    if (r) {
      const ice = r.vars.iceRoot as THREE.Object3D | undefined
      ice?.parent?.remove(ice)
      r.c.root.clear()
    }
    this.run = null
    this.id = null
  }

  /** dt: simülasyon saniyesi */
  update(dt: number, realT: number) {
    const def = this.def
    const r = this.run
    if (!def || !r) return
    r.t = Math.min(def.duration, r.t + dt)
    def.beats.forEach((b, i) => {
      if (!this.fired.has(i) && r.t >= b.t) {
        this.fired.add(i)
        b.run?.(r)
      }
    })
    def.tick?.(r, r.t, dt)
    for (const e of r.effects) e.update(dt, realT)
    for (const v of r.responders) v.at(r.t, realT)
  }

  get done() {
    return !!this.def && !!this.run && this.run.t >= this.def.duration
  }

  /** yörünge kamerası: olayın çevresinde yavaşça döner */
  pose(realT: number) {
    const d = this.def
    if (!d) return null
    const look = V(...d.focus)
    const a = 2.2 + realT * 0.035
    return { look, pos: V(look.x + Math.cos(a) * d.radius, d.height, look.z + Math.sin(a) * d.radius) }
  }
}
