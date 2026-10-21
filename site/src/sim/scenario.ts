import * as THREE from 'three'
import type { Mission, DroneSim } from './mission/mission'
import type { FodField } from './world/fod'
import type { PheromoneLayer } from './world/pheromone'
import type { Petek } from './world/petek'
import { buildAirliner } from './world/aircraft'
import { DroneVisual } from './world/drone'
import { AlertLink, cracks, Fire, Flock, IceZones, Person, Puddle, Responder, RfWaves, type Effect } from './world/effects'
import { LAYOUT, RWY } from './world/layout'
import { sunDirection } from './world/sky'
import { glowTexture } from './world/textures'
import { DEFAULT_DAY_OF_YEAR, sunPosition } from './solar'

/*
  Senaryo yönetmeni: 12 acil durum senaryosu ve kış sabahı buz haritası, saniye saniye.
  Zaman çizelgesi simülasyon saniyesidir; sahne `rate` kat hızlı oynar. Süreler temsilidir:
  nöbetçi uyarısı ≤ 10 sn hedefi, kule onayından sonra en yakın drone ≈60 sn, ICAO'nun itfaiye için 3 dk hedefi.
  Kovan itfaiyenin yerini almaz; "ilk gören"dir.
*/

export type SceneId = 'fire' | 'excursion' | 'tire' | 'bird' | 'leak' | 'intrusion' | 'rogue' | 'quake' | 'grid' | 'smoke' | 'search' | 'landing' | 'ice'

export type Beat = { t: number; text: string; kind?: 'alert' | 'ok' | 'info' }

/**
  Kamera çekimi: sahnenin her adımı neyi göstereceğini söyler.
  event: olay yeri yakın plan · wide: genel bakış · drone: drone'u arkasından takip (vardığında yandan) ·
  point: kule ya da nöbetçi direğinin omzundan olaya bakış, ya da bir noktanın çevresi · vehicle: müdahale aracı ·
  track: sahnenin kendi nesnesi (izinsiz drone, acil inişteki uçak)
*/
export type Who = 'scout1' | 'scout2' | 'guard' | 'worker' | 'active'
export type Shot =
  | { on: 'event'; dist?: number }
  | { on: 'wide' }
  | { on: 'drone'; who: Who; toward?: [number, number, number] }
  | { on: 'point'; at: [number, number, number] | 'tower' | 'mast' | 'energy'; dist?: number; label?: string }
  | { on: 'vehicle' }
  | { on: 'track'; key: string; dist?: number; label?: string }

/** Kullanıcının kamera seçimi: otomatik yönetmen, sabit bir konu ya da serbest uçuş */
export type CamPick = 'auto' | 'event' | 'scout1' | 'scout2' | 'guard' | 'worker' | 'wide' | 'free'

/** Çözülmüş kare: bakılan nokta, kameranın ona göre yeri, takip sıkılığı (sn), süzülme izni */
export type Frame = { look: THREE.Vector3; offset: THREE.Vector3; smooth: number; key: string; label: string; orbit: boolean; subject?: THREE.Vector3 }

export type SceneCtx = {
  root: THREE.Group
  mission: Mission
  fod: FodField
  pheromone: PheromoneLayer
  peteks: Petek[]
  parked: THREE.Group
  setClock: (sec: number) => void
  /** from'dan to'ya görüş açık mı: hedefin margin metre yakınındaki ve hedefi içeren yapılar sayılmaz */
  clearView?: (from: THREE.Vector3, to: THREE.Vector3, margin: number) => boolean
}

/** Kameranın yörünge dilimi: tam tur ya da engelsiz bir yay üzerinde git-gel */
export type SceneArc = { mid: number; half: number; full: boolean; radius: number; height: number }

type SceneDef = {
  title: string
  first: string
  rate: number
  duration: number
  clock: number
  focus: [number, number, number]
  radius: number
  height: number
  beats: (Beat & { run?: (r: SceneRun) => void; cam?: Shot })[]
  /** ilk çekim (verilmezse olay yeri) */
  cam?: Shot
  /** ilk bu kadar simülasyon saniyesi 2× oynar (uyarı, kule, kalkış art arda gelir; kamera yetişsin); varsayılan 22 */
  slow?: number
  /** metni olmayan kamera geçişleri: ör. aracı birkaç saniye gösterip drone'a dönmek */
  cues?: { t: number; cam: Shot }[]
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
    cam: { on: 'point', at: [250, 3, 4], dist: 60, label: 'Yangın' },
    cues: [{ t: 34, cam: { on: 'drone', who: 'active' } }, { t: 150, cam: { on: 'vehicle' } }],
    setup: (r) => {
      r.airliner(V(250, 0, 6), 0)
      r.vars.fire = r.add(new Fire(V(249.5, 0.4, 2.2), 1.2))
    },
    beats: [
      { t: 0, text: 'Uçak indi; sol ana iniş takımında fren yangını başladı.', kind: 'alert' },
      { t: 3, cam: { on: 'point', at: 'mast' }, text: 'Petek B nöbetçi direği termal kamerada sıcak noktayı fark etti.', kind: 'alert', run: (r) => r.alert(r.mast(V(250, 0, 0)), V(249, 2, 2)) },
      { t: 8, cam: { on: 'point', at: 'tower' }, text: 'Kule ve itfaiye uyarıldı: konum ve termal görüntü (hedef ≤ 10 sn).', run: (r) => r.alert(TOWER_TOP, V(249, 2, 2), 30, '#f6b93b') },
      { t: 14, cam: { on: 'drone', who: 'active' }, text: 'Kule onayladı: en yakın kâşif kalkıyor.', run: (r) => r.c.mission.respond(r.nearestScout(V(250, 0, 0)), V(215, 0, -40), 30, 400) },
      { t: 20, cam: { on: 'vehicle' }, text: 'İtfaiye yola çıktı.', run: (r) => r.vehicle(runwayArff(V(250, 0, 6)), 20, 180, 'arff') },
      { t: 110, text: 'Kâşif olay yerinde: 30 m’den, uçağın üzerine girmeden termal görüntü itfaiyeye akıyor.', kind: 'ok' },
      { t: 180, cam: { on: 'point', at: [250, 3, 4], dist: 85, label: 'Yangın' }, text: 'İtfaiye olay yerinde (ICAO hedefi 3 dk). Kovan ekibe ilk dakikalarda göz oldu.', kind: 'ok' },
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
    cam: { on: 'event', dist: 70 },
    cues: [{ t: 34, cam: { on: 'drone', who: 'active' } }, { t: 140, cam: { on: 'vehicle' } }],
    setup: (r) => {
      const a = r.airliner(V(820, 0, 78), -0.38)
      a.rotation.z = 0.03
    },
    beats: [
      { t: 0, text: 'İnişte uçak pistin sağına çıktı, çimde durdu.', kind: 'alert' },
      { t: 4, cam: { on: 'point', at: 'mast' }, text: 'Nöbetçi direk iz takibiyle uçağın pistten çıktığını gördü.', kind: 'alert', run: (r) => r.alert(r.mast(V(820, 0, 78)), V(820, 3, 78)) },
      { t: 8, cam: { on: 'point', at: 'tower' }, text: 'Kule, itfaiye ve sağlık ekibi uyarıldı: uçağın konumu.', run: (r) => r.alert(TOWER_TOP, V(820, 3, 78), 30, '#f6b93b') },
      { t: 14, cam: { on: 'drone', who: 'active' }, text: 'Kule onayladı: en yakın kâşif kalkıyor.', run: (r) => r.c.mission.respond(r.nearestScout(V(820, 0, 78)), V(790, 0, 40), 32, 400) },
      { t: 20, cam: { on: 'vehicle' }, text: 'İtfaiye ve ambulans yola çıktı.', run: (r) => r.vehicle([...ARFF, V(700, 0, -40), V(790, 0, 55)], 20, 175, 'arff') },
      {
        t: 75, cam: { on: 'event', dist: 55 },
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
      { t: 175, cam: { on: 'event', dist: 90 }, text: 'Ekipler olay yerinde. Pist kapalı; kalkan parçalar için sonra tarama yapılacak.', kind: 'ok' },
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
    cam: { on: 'event', dist: 70 },
    cues: [{ t: 260, cam: { on: 'event', dist: 80 } }],
    setup: (r) => {
      const f = r.c.fod
      f.add('tire', -320, 6)
      f.add('tire', -265, -9)
      f.add('bolt', -300, 14)
      f.add('plastic', -240, 4)
    },
    beats: [
      { t: 0, text: 'Kalkışta lastik patladı; parçalar pistte.', kind: 'alert' },
      { t: 4, cam: { on: 'point', at: 'mast' }, text: 'Petek A nöbetçi direği parçalanmayı gördü.', kind: 'alert', run: (r) => r.alert(r.mast(V(-300, 0, 0)), V(-290, 1, 0)) },
      { t: 9, cam: { on: 'point', at: 'tower' }, text: 'Kule uyarıldı; sonraki harekete kadar pist kapatıldı.', run: (r) => r.alert(TOWER_TOP, V(-290, 1, 0), 30, '#f6b93b') },
      { t: 15, cam: { on: 'drone', who: 'scout1' }, text: 'Kâşifler hareket sonrası taramaya kalktı.', run: (r) => r.c.mission.launch('fod') },
      {
        t: 380, cam: { on: 'drone', who: 'worker' },
        text: 'Kâşif konumu işçiye bildirdi (sallanma dansı): işçi küçük parçaları topluyor; büyük lastik parçaları saha ekibine.',
        kind: 'ok',
        run: (r) => r.c.fod.items.filter((i) => i.cls === 'bolt' || i.cls === 'plastic').forEach((i) => r.c.mission.pickup(i)),
      },
      { t: 760, cam: { on: 'event', dist: 90 }, text: 'Tarama bitti: rapor kuleye. Pist, saha ekibi büyük parçaları kaldırınca açılır.', kind: 'ok' },
    ],
  },
  bird: {
    title: 'Kuş çarpması bildirimi',
    first: 'Pilot bildirimi',
    rate: 3,
    duration: 170,
    clock: 8 * 3600 + 40 * 60,
    focus: [-640, 6, 30],
    radius: 190,
    height: 80,
    cam: { on: 'event', dist: 80 },
    cues: [{ t: 80, cam: { on: 'drone', who: 'scout1' } }],
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
      { t: 6, cam: { on: 'point', at: 'tower' }, text: 'Kule kovanı çağırdı: kalıntı araması ve sürüyü uzaklaştırma.', run: (r) => r.alert(TOWER_TOP, V(-650, 1, 5), 30, '#f6b93b') },
      {
        t: 12, cam: { on: 'drone', who: 'guard' },
        text: 'Kâşif-1 kalıntıyı aramaya, Bekçi sürüye kalkıyor (iki kast aynı anda).',
        run: (r) => {
          r.c.mission.respond(r.c.mission.drones[0], V(-650, 0, 5), 15, 400)
          r.c.mission.respond(r.c.mission.guard, V(-600, 0, 60), 25, 400)
        },
      },
      { t: 75, text: 'Bekçi hoparlör ve ışıkla sürüyü pistten ve yaklaşma koridorundan uzaklaştırdı.', kind: 'ok' },
      { t: 95, cam: { on: 'point', at: [-650, 2, 5], dist: 45, label: 'Olay yeri' }, text: 'Kâşif kalıntıyı buldu ve ortak haritaya işaretledi; saha ekibi kaldıracak.', kind: 'ok', run: (r) => r.c.pheromone.mark(-650, 5) },
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
    cam: { on: 'point', at: [275, 2, -231], dist: 40, label: 'Olay yeri' },
    cues: [{ t: 40, cam: { on: 'drone', who: 'active' } }, { t: 130, cam: { on: 'vehicle' } }],
    setup: (r) => {
      r.vars.puddle = r.add(new Puddle(V(275.7, 0, -231), 0.06, 7))
    },
    beats: [
      { t: 0, text: 'Park eden uçağın sağ motorunun altında sızıntı başladı.', kind: 'alert' },
      { t: 5, cam: { on: 'point', at: 'mast' }, text: 'Nöbetçi PTZ kamera termal ve görünür görüntüde lekeyi fark etti.', kind: 'alert', run: (r) => r.alert(r.mast(V(275, 0, -231)), V(275.7, 0.5, -231)) },
      { t: 10, cam: { on: 'point', at: 'tower' }, text: 'Apron ve itfaiye uyarıldı.', run: (r) => r.alert(TOWER_TOP, V(275.7, 0.5, -231), 30, '#f6b93b') },
      { t: 16, cam: { on: 'drone', who: 'active' }, text: 'En yakın kâşif lekeyi izlemeye kalkıyor.', run: (r) => r.c.mission.respond(r.nearestScout(V(275, 0, -231)), V(300, 0, -255), 20, 400) },
      { t: 24, cam: { on: 'vehicle' }, text: 'İtfaiye köpükle yola çıktı.', run: (r) => r.vehicle([V(-126, 0, -190), V(150, 0, -195), V(258, 0, -240)], 24, 150, 'arff') },
      { t: 115, cam: { on: 'point', at: [275, 2, -231], dist: 45, label: 'Olay yeri' }, text: 'Kâşif alanı ortak haritaya işaretledi ve büyümesini izliyor.', kind: 'ok', run: (r) => r.c.pheromone.mark(275.7, -231) },
      { t: 150, cam: { on: 'point', at: [275, 2, -231], dist: 60, label: 'Olay yeri' }, text: 'İtfaiye olay yerinde. Kovan alanı izlemeyi sürdürüyor.', kind: 'ok' },
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
    cam: { on: 'point', at: [-1500, 2, -180], dist: 45, label: 'Olay yeri' },
    cues: [{ t: 3, cam: { on: 'drone', who: 'guard' } }, { t: 24, cam: { on: 'drone', who: 'guard' } }, { t: 130, cam: { on: 'vehicle' } }],
    setup: (r) => {
      r.add(new Person([V(-1505, 0, -185), V(-1460, 0, -160), V(-1420, 0, -120)], 0.8))
    },
    beats: [
      { t: 0, text: 'Bekçi çit devriyesinde: batı çitinde bir kişi içeri girdi.', kind: 'alert', run: (r) => r.c.mission.respond(r.c.mission.guard, V(-1440, 0, -140), 25, 400, V(-1440, 25, 120)) },
      { t: 6, text: 'Bekçi termal kamerada kişiyi gördü; konum ve görüntü güvenliğe.', kind: 'alert', run: (r) => r.alert(TOWER_TOP, V(-1460, 1, -160), 30, '#f6b93b') },
      { t: 12, cam: { on: 'vehicle' }, text: 'Güvenlik aracı yönlendirildi.', run: (r) => r.vehicle([V(330, 0, -300), V(-200, 0, -260), V(-1380, 0, -150)], 12, 150, 'security') },
      { t: 60, cam: { on: 'drone', who: 'guard' }, text: 'Bekçi kişinin üstünde değil, yanında: izliyor ve yönünü güvenliğe aktarıyor.', kind: 'ok' },
      { t: 150, cam: { on: 'event', dist: 60 }, text: 'Güvenlik ekibi olay yerinde.', kind: 'ok' },
    ],
  },
  rogue: {
    title: 'İzinsiz drone',
    first: 'RF izleyici, Remote ID',
    rate: 1,
    duration: 60,
    clock: 12 * 3600,
    focus: [-250, 30, -120],
    radius: 380,
    height: 150,
    cam: { on: 'track', key: 'rogueRoot', dist: 50, label: 'İzinsiz drone' },
    cues: [{ t: 16, cam: { on: 'track', key: 'rogueRoot', dist: 50, label: 'İzinsiz drone' } }],
    setup: (r) => {
      const dv = new DroneVisual(9, '#e0384f', 'guard')
      r.c.root.add(dv.root)
      r.vars.rogue = dv
      r.vars.track = [dv.root]
      r.vars.rogueRoot = dv.root
      // izinsiz drone küçük: uzaktan da seçilsin diye kırmızı, nabız gibi atan bir işaret
      const mark = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: '#ff3b4f', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }))
      mark.scale.setScalar(20)
      dv.root.add(mark)
      r.vars.mark = mark
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
      ;(r.vars.mark as THREE.Sprite).scale.setScalar(18 + Math.sin(t * 5) * 5)
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
      { t: 3, cam: { on: 'point', at: 'mast' }, text: 'Petek RF izleyicisi ve Remote ID: konumu, yönü ve operatörün yeri belirlendi.', kind: 'alert' },
      { t: 8, cam: { on: 'point', at: 'tower' }, text: 'Kule ve güvenlik uyarıldı. Kovan drone’ları yerde kalıyor; biz müdahale etmeyiz.' },
      { t: 30, cam: { on: 'track', key: 'rogueRoot', dist: 50, label: 'İzinsiz drone' }, text: 'Kule hareketleri bekletiyor; karşı-İHA yetkisi askerî birimde. Kovan izlemeyi sürdürüyor.', kind: 'ok' },
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
    cam: { on: 'point', at: [100, 1, -4], dist: 50, label: 'Çatlak' },
    cues: [{ t: 150, cam: { on: 'drone', who: 'scout2' } }, { t: 300, cam: { on: 'drone', who: 'scout1' } }],
    setup: (r) => {
      r.c.root.add(cracks([V(-500, 0, 2), V(100, 0, -4), V(650, 0, 6)]))
      r.gridOutage()
    },
    beats: [
      { t: 0, text: 'Deprem: şebeke kesildi, havalimanı yardım uçuşları için pistin durumunu soruyor.', kind: 'alert' },
      { t: 5, cam: { on: 'point', at: 'energy', dist: 70 }, text: 'Kovan şebekeden bağımsız: petekler enerji adasının bataryasıyla çalışıyor.', kind: 'ok' },
      { t: 10, cam: { on: 'point', at: 'tower' }, text: 'Kule çağrısı: pist hasar taraması.', run: (r) => r.alert(TOWER_TOP, V(0, 1, 0), 30, '#f6b93b') },
      { t: 15, cam: { on: 'drone', who: 'scout1' }, text: 'Kâşifler pisti 20 m’den üç geçişle taramaya kalktı.', run: (r) => r.c.mission.launch('fod') },
      {
        t: 240, cam: { on: 'point', at: [-500, 1, 2], dist: 50, label: 'Çatlak' },
        text: 'Çatlaklar ortak haritaya işaretlendi (konum ve fotoğrafla).',
        kind: 'ok',
        run: (r) => [-500, 100, 650].forEach((x) => r.c.pheromone.mark(x, 0)),
      },
      { t: 760, cam: { on: 'event', dist: 220 }, text: 'Tarama ≈12 dk’da bitti: hasar haritası kuleye ve AFAD’a. Pistin kullanılabilirliğine yetkililer karar verir.', kind: 'ok' },
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
    cam: { on: 'point', at: 'energy', dist: 55 },
    cues: [{ t: 70, cam: { on: 'drone', who: 'scout2' } }],
    setup: (r) => r.gridOutage(),
    beats: [
      { t: 0, text: 'Şebeke kesildi.', kind: 'alert' },
      { t: 2, text: 'Hibrit invertör kesintisiz olarak ada moduna geçti: hücreler bataryadan besleniyor.', kind: 'ok' },
      { t: 6, text: 'Teknik birim bilgilendirildi.' },
      { t: 12, text: 'Güneş ve türbin bataryayı doldurmaya devam ediyor; Çanakkale kovanında özerklik ≈1 gün.', kind: 'ok' },
      {
        t: 20, cam: { on: 'drone', who: 'scout1' },
        text: 'Planlı tarama şebekesiz de kalkıyor: kâşifler peteklerinden havalandı.',
        run: (r) => r.c.mission.launch('fod'),
      },
    ],
  },
  smoke: {
    title: 'Çevrede yangın ve duman',
    first: 'Bekçi',
    rate: 2,
    duration: 120,
    clock: 16 * 3600,
    focus: [-1740, 10, 640],
    radius: 320,
    height: 130,
    cam: { on: 'point', at: [-1800, 8, 705], dist: 110, label: 'Duman' },
    setup: (r) => {
      r.add(new Fire(V(-1780, 0, 720), 3.2, false))
      r.add(new Fire(V(-1830, 0, 690), 2.6, true))
    },
    beats: [
      { t: 0, text: 'Çitin dışında anız yangını; duman yükseliyor.', kind: 'alert', run: (r) => r.c.mission.respond(r.c.mission.guard, V(-1480, 0, 280), 30, 400, V(-1250, 25, 285)) },
      { t: 5, cam: { on: 'drone', who: 'guard', toward: [-1800, 10, 705] }, text: 'Bekçi devriyede dumanı gördü.', kind: 'alert', run: (r) => r.alert(r.c.mission.guard.pos.clone(), V(-1780, 4, 720), 30) },
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
    cam: { on: 'point', at: 'tower' },
    cues: [{ t: 240, cam: { on: 'vehicle' } }],
    setup: (r) => {
      r.add(new Person([V(520, 0, 232)], 0, { lying: true, thermal: true }))
    },
    beats: [
      { t: 0, text: 'Gece: kule bir personelin kaybolduğunu bildirdi.', kind: 'alert', run: (r) => r.alert(TOWER_TOP, V(480, 1, 200), 30, '#f6b93b') },
      {
        t: 6, cam: { on: 'drone', who: 'guard' },
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
      { t: 210, cam: { on: 'point', at: [520, 1, 232], dist: 40, label: 'Olay yeri' }, text: 'Bekçi termalde kişiyi buldu; konum güvenliğe gönderildi.', kind: 'ok', run: (r) => r.c.pheromone.mark(520, 232) },
      { t: 215, text: 'Güvenlik ve sağlık ekibi yönlendirildi.', run: (r) => r.vehicle([V(330, 0, -300), V(330, 0, -60), V(500, 0, 215)], 215, 290, 'security') },
      { t: 290, cam: { on: 'point', at: [520, 1, 232], dist: 45, label: 'Olay yeri' }, text: 'Ekip kişinin yanında.', kind: 'ok' },
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
    cam: { on: 'point', at: 'tower' },
    cues: [{ t: 260, cam: { on: 'drone', who: 'scout2' } }, { t: 500, cam: { on: 'drone', who: 'scout1' } }, { t: 700, cam: { on: 'track', key: 'plane', dist: 160, label: 'Acil inişteki uçak' } }],
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
      { t: 5, cam: { on: 'drone', who: 'scout1' }, text: 'Kâşifler inişten önce pisti taramaya kalktı.', run: (r) => r.c.mission.launch('fod') },
      { t: 760, text: 'Temiz pist raporu kuleye; kâşifler peteklerinde.', kind: 'ok' },
      { t: 775, text: 'Uçak indi; itfaiye pist kenarında hazırdı.', kind: 'alert' },
      { t: 860, cam: { on: 'drone', who: 'scout1' }, text: 'Uçak pisti boşalttı: kâşifler inişten hemen sonra yeniden taramaya kalkıyor.', kind: 'ok', run: (r) => r.c.mission.launch('fod') },
    ],
  },
  ice: {
    title: 'Kış sabahı buz haritası',
    first: 'Bakıcı (işçinin kamera başlığı)',
    rate: 3,
    duration: 210,
    clock: 8 * 3600 + 30 * 60,
    focus: [270, 6, -227],
    radius: 75,
    height: 32,
    cam: { on: 'event', dist: 55 },
    cues: [{ t: 140, cam: { on: 'event', dist: 50 } }],
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
        t: 6, cam: { on: 'drone', who: 'worker' },
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
  arc: SceneArc | null = null
  private fired = new Set<number>()
  private t0: number | null = null
  private lastT = 0
  private fit: { x: number; z: number; k: number } | null = null
  private box = new THREE.Box3()

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
    this.arc = this.arcFor(id)
    this.t0 = null
    this.fit = null
    this.vel.clear()
    this.shotCur = null
  }

  /**
   * Yörüngenin engelsiz dilimi: 72 açıdan olay noktasına ve çevresindeki dört noktaya görüş ışını atılır.
   * Hiçbir bina, hangar ya da kule kadrajı kapatmıyorsa tam tur; kapatıyorsa en geniş açık yayda git-gel.
   * Açık yay 60°'den darsa kamera biraz yükselip uzaklaşarak yeniden dener. Alçak güneşe karşı bakılan açılar da dışarıda kalır.
   */
  arcFor(id: SceneId): SceneArc {
    const d = SCENES[id]
    const full: SceneArc = { mid: 2.2, half: Math.PI, full: true, radius: d.radius, height: d.height }
    const view = this.ctx().clearView
    if (!view) return full
    const N = 72
    const look = V(...d.focus)
    const o = d.radius * 0.22
    const targets = [look, V(look.x + o, look.y, look.z), V(look.x - o, look.y, look.z), V(look.x, look.y, look.z + o), V(look.x, look.y, look.z - o)]
    const { elev, az } = sunPosition(DEFAULT_DAY_OF_YEAR, d.clock)
    const sun = sunDirection(elev, az).setY(0).normalize()
    const lowSun = elev > -0.05 && elev < 0.45
    // güneşe karşı bakış: kameradan olaya yön, güneşin yatay yönüyle 50°'den dar açı yapıyor
    const glare = (a: number) => lowSun && -Math.cos(a) * sun.x - Math.sin(a) * sun.z > Math.cos((50 * Math.PI) / 180)
    let best: SceneArc | null = null
    let bestRun = 0
    for (let k = 0; k < 4; k++) {
      const radius = d.radius * (1 + 0.1 * k)
      const height = d.height * (1 + 0.35 * k)
      const ok: boolean[] = []
      for (let i = 0; i < N; i++) {
        const a = (i / N) * Math.PI * 2
        const pos = V(look.x + Math.cos(a) * radius, height, look.z + Math.sin(a) * radius)
        ok.push(!glare(a) && targets.every((t) => view(pos, t, 6)))
      }
      const firstBad = ok.indexOf(false)
      if (firstBad < 0) return { ...full, radius, height }
      let run = 0
      let runStart = 0
      for (let j = 1; j <= N; j++) {
        const i = (firstBad + j) % N
        if (!ok[i]) {
          run = 0
          continue
        }
        if (run === 0) runStart = i
        run++
        if (run > bestRun) {
          bestRun = run
          const step = (Math.PI * 2) / N
          best = { mid: (runStart + (run - 1) / 2) * step, half: ((run - 1) / 2) * step, full: false, radius, height }
        }
      }
      if (bestRun >= N / 6) break
    }
    return best ?? full
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

  private vel = new Map<string, { p: THREE.Vector3; v: THREE.Vector3 }>()
  private shotCur: Shot | null = null
  private shotSince = -99

  /** Sahnenin o anki hızı: açılıştaki art arda adımlar 2× oynar, sonra sahnenin hızına çıkar */
  rateNow() {
    const d = this.def
    if (!d || !this.run) return 1
    if (d.rate <= 2) return d.rate
    const slow = d.slow ?? 22
    const k = THREE.MathUtils.clamp((this.run.t - slow) / 6, 0, 1)
    return 2 + (d.rate - 2) * k
  }

  /** Otomatik modda şu anki çekim: zamanı gelmiş son adımın ya da geçişin kamerası */
  autoShot(): Shot {
    const d = this.def!
    const t = this.run!.t
    let shot: Shot = d.cam ?? { on: 'event' }
    let at = -1
    for (const b of d.beats) if (b.cam && b.t <= t && b.t >= at) [shot, at] = [b.cam, b.t]
    for (const c of d.cues ?? []) if (c.t <= t && c.t >= at) [shot, at] = [c.cam, c.t]
    return shot
  }

  private droneFor(who: Who, focus: THREE.Vector3): DroneSim {
    const m = this.run!.c.mission
    if (who === 'scout1') return m.drones[0]
    if (who === 'scout2') return m.drones[1]
    if (who === 'guard') return m.guard
    if (who === 'worker') return m.worker
    // görevdeki (havadaki) drone'lardan olaya en yakını; hiçbiri yoksa olaya en yakın kâşif
    const busy = [...m.drones, m.guard, m.worker].filter((x) => x.airborne || x.active)
    if (!busy.length) return this.run!.nearestScout(focus)
    return busy.sort((a, b) => a.pos.distanceTo(focus) - b.pos.distanceTo(focus))[0]
  }

  private droneName(x: DroneSim) {
    const m = this.run!.c.mission
    if (x === m.drones[0]) return 'Kâşif-1'
    if (x === m.drones[1]) return 'Kâşif-2'
    if (x === m.guard) return 'Bekçi'
    return this.id === 'ice' ? 'Bakıcı' : 'İşçi'
  }

  /** nesnenin hızı (m/sn, yatay), kareler arası konumdan yumuşatılmış */
  private velocity(key: string, p: THREE.Vector3, dt: number) {
    const s = this.vel.get(key)
    if (!s || dt <= 0) {
      this.vel.set(key, { p: p.clone(), v: V(0, 0, 0) })
      return V(0, 0, 0)
    }
    const v = p.clone().sub(s.p).divideScalar(dt).setY(0)
    s.v.lerp(v, 1 - Math.exp(-dt / 0.4))
    s.p.copy(p)
    return s.v.clone()
  }

  /** Hareket eden bir konunun karesi: yoldaysa arkasından, durduysa olayla birlikte yandan */
  private follow(key: string, label: string, p: THREE.Vector3, goal: THREE.Vector3, focus: THREE.Vector3, dt: number, size = 1): Frame {
    const v = this.velocity(key, p, dt)
    const toGoal = goal.clone().sub(p).setY(0)
    const moving = v.length() > 2.5
    let dir = moving ? v.clone().normalize() : toGoal.length() > 30 ? toGoal.clone().normalize() : focus.clone().sub(p).setY(0)
    if (dir.lengthSq() < 1e-6) dir = V(1, 0, 0)
    dir.normalize()
    if (moving) {
      // arkasından takip: konu ön planda ve seçilir büyüklükte, gittiği yer ileride; hızlandıkça (sahne hızı) biraz geri çekil
      const back = (16 + v.length() * 0.22) * size
      const look = p.clone().addScaledVector(dir, 8 * size)
      return { look, offset: dir.clone().multiplyScalar(-back).add(V(0, back * 0.32 + 2, 0)), smooth: 0.3, key, label, orbit: false, subject: p }
    }
    // durdu (vardı ya da yuvada): konu ile olay aynı karede, yavaş süzülme
    const toEvent = focus.clone().sub(p).setY(0)
    const look = p.clone().lerp(V(focus.x, p.y, focus.z), toEvent.length() < 160 ? 0.3 : 0)
    look.y = Math.max(0.5, p.y - 4 * size)
    // bakış noktası konunun biraz altında, kamera biraz üstünde ve gerisinde: konu kadrajın ortasının hemen üstünde kalır
    return { look, offset: dir.clone().multiplyScalar(-30 * size).add(V(0, 10 * size, 0)), smooth: 0.8, key, label, orbit: true, subject: p }
  }

  /** Seçime göre kare: otomatikte adımın çekimi, elle seçimde o konu */
  frame(pick: CamPick, realT: number, dt: number): Frame | null {
    const d = this.def
    const r = this.run
    if (!d || !r) return null
    // otomatikte her çekim en az 2,2 sn ekranda kalır; o arada birden çok adım geldiyse en sonuncusuna geçilir
    if (pick === 'auto' || pick === 'free') {
      const due = this.autoShot()
      if (due !== this.shotCur && (this.shotCur === null || realT - this.shotSince >= 2.2)) {
        this.shotCur = due
        this.shotSince = realT
      }
    }
    const shot: Shot =
      pick === 'auto' || pick === 'free' ? (this.shotCur ?? this.autoShot()) : pick === 'event' ? { on: 'event' } : pick === 'wide' ? { on: 'wide' } : { on: 'drone', who: pick }
    const focus = (r.vars.focus as THREE.Vector3 | undefined)?.clone() ?? V(...d.focus)
    const base = this.arc?.mid ?? 2.2
    const around = (look: THREE.Vector3, dist: number, h: number, key: string, label: string): Frame => ({
      look,
      offset: V(Math.cos(base) * dist, h, Math.sin(base) * dist),
      smooth: 1,
      key,
      label,
      orbit: true,
    })
    switch (shot.on) {
      case 'event': {
        const dist = shot.dist ?? THREE.MathUtils.clamp(d.radius * 0.5, 45, 260)
        return around(focus, dist, dist * 0.5, 'event', 'Olay yeri')
      }
      case 'wide': {
        const p = this.pose(realT)!
        return { look: p.look, offset: p.pos.clone().sub(p.look), smooth: 1.2, key: 'wide', label: 'Genel bakış', orbit: false }
      }
      case 'drone': {
        const x = this.droneFor(shot.who, focus)
        const goal = shot.toward ? V(...shot.toward) : (x.plan[x.idx]?.p?.clone() ?? focus.clone())
        return this.follow('d' + x.id, this.droneName(x), x.pos.clone(), goal, focus, dt)
      }
      case 'point': {
        if (shot.at === 'tower' || shot.at === 'mast') {
          // omuz üstü: kule ya da nöbetçi direği önde, uyarının gittiği olay ileride
          const at = shot.at === 'tower' ? TOWER_TOP.clone() : r.mast(focus)
          const dir = focus.clone().sub(at).setY(0)
          const len = dir.length()
          dir.normalize()
          const dist = shot.dist ?? (shot.at === 'tower' ? 70 : 34)
          // bakılan nokta kulenin/direğin ilerisinde; kamera kulenin/direğin dist kadar gerisinde ve tepesinin biraz üstünde
          const ahead = Math.min(140, len * 0.45)
          const look = at.clone().addScaledVector(dir, ahead).setY(Math.max(4, at.y * 0.4))
          const up = at.y + dist * 0.3 - look.y
          return {
            look,
            offset: dir.clone().multiplyScalar(-(dist + ahead)).add(V(0, up, 0)),
            smooth: 1,
            key: 'p-' + shot.at,
            label: shot.at === 'tower' ? 'Kule' : 'Nöbetçi direği',
            orbit: false,
            subject: at,
          }
        }
        const at = shot.at === 'energy' ? V(LAYOUT.energy.x, 6, LAYOUT.energy.z) : V(...shot.at)
        const dist = shot.dist ?? 60
        return around(at, dist, dist * 0.45, 'p-' + at.toArray().join(','), shot.label ?? (shot.at === 'energy' ? 'Enerji adası' : 'Olay yeri'))
      }
      case 'vehicle': {
        const v = r.responders.find((x) => !x.arrived) ?? r.responders[r.responders.length - 1]
        if (!v) return around(focus, 80, 40, 'event', 'Olay yeri')
        // araç modeli sade: yakın plan yerine yolu ve gittiği olayı da gösteren uzaklık
        return this.follow('veh', 'Müdahale aracı', v.group.position.clone(), focus, focus, dt, 1.8)
      }
      case 'track': {
        const o = r.vars[shot.key] as THREE.Object3D | undefined
        if (!o) return around(focus, 80, 40, 'event', 'Olay yeri')
        const p = o.getWorldPosition(V(0, 0, 0))
        const k = (shot.dist ?? 40) / 40
        return this.follow('t-' + shot.key, shot.label ?? 'Olay yeri', p, focus, focus, dt, k)
      }
    }
  }

  /**
   * Yörünge kamerası: olayın çevresinde yavaşça döner; engelli sahnede açık yayda git-gel yapar.
   * Olaya yakın uçan drone'lar ve müdahale araçları kadrajı kendine çeker; hepsi sığsın diye kamera
   * en çok 2,2 kat uzaklaşır. Pistin öbür ucunu tarayan kâşif kovalanmaz, olay kadrajda kalır.
   */
  pose(realT: number) {
    const d = this.def
    const r = this.run
    if (!d || !r) return null
    if (this.t0 === null) this.t0 = realT
    const t = realT - this.t0
    const dt = Math.min(0.2, Math.max(0, realT - this.lastT))
    this.lastT = realT
    const arc = this.arc ?? { mid: 2.2, half: Math.PI, full: true, radius: d.radius, height: d.height }
    // bir adım kamerayı başka bir yere çevirebilir (ör. şebeke kesintisinde kalkan kâşifler)
    const focus = (r.vars.focus as THREE.Vector3 | undefined)?.clone() ?? V(...d.focus)
    const m = r.c.mission
    const actors = [...m.drones, m.guard, m.worker].filter((x) => x.airborne).map((x) => x.pos.clone())
    for (const v of r.responders) actors.push(v.group.position.clone())
    for (const o of (r.vars.track as THREE.Object3D[] | undefined) ?? []) actors.push(o.position.clone())
    const near = actors.filter((p) => Math.hypot(p.x - focus.x, p.z - focus.z) < arc.radius * 3)
    // sahnenin kendi nesneleri (yangın, sürü, kişi, buz bölgeleri) da kadraja sığmalı; uyarı bağları ve RF halkaları sayılmaz
    const subjects = r.effects.filter((fx) => !(fx instanceof AlertLink) && !(fx instanceof RfWaves) && fx.group.visible).map((fx) => this.box.setFromObject(fx.group).getCenter(V(0, 0, 0)))
    let want = { x: focus.x, z: focus.z, k: 1 }
    if (near.length || subjects.length) {
      const mx = near.length ? near.reduce((s, p) => s + p.x, 0) / near.length : focus.x
      const mz = near.length ? near.reduce((s, p) => s + p.z, 0) / near.length : focus.z
      const x = focus.x + (mx - focus.x) * 0.3
      const z = focus.z + (mz - focus.z) * 0.3
      const spread = Math.max(...[focus, ...near, ...subjects].map((p) => Math.hypot(p.x - x, p.z - z)))
      want = { x, z, k: Math.min(2.2, Math.max(1, (spread * 1.9) / arc.radius)) }
    }
    if (!this.fit) this.fit = { ...want }
    const s = 1 - Math.exp(-dt / 1.5)
    this.fit.x += (want.x - this.fit.x) * s
    this.fit.z += (want.z - this.fit.z) * s
    this.fit.k += (want.k - this.fit.k) * s
    const swing = arc.half * 0.85
    const a = arc.full ? arc.mid + t * 0.035 : arc.mid + swing * Math.sin(t * Math.min(0.2, 0.035 / Math.max(0.05, swing)))
    const f = this.fit
    const zoom = f.k * ((r.vars.zoom as number | undefined) ?? 1)
    const look = V(f.x, focus.y, f.z)
    return { look, pos: V(look.x + Math.cos(a) * arc.radius * zoom, arc.height * zoom, look.z + Math.sin(a) * arc.radius * zoom) }
  }
}
