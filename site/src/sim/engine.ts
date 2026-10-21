import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { PARAMS } from '../data/facts'
import { confidenceFor, Mission, type DetectTarget, type DroneId } from './mission/mission'
import { useSim, fmtClock, type CameraMode, type Check, type Detection, type Fault, type FodClass, type LogKind, type PickId, type Quality } from './store'
import { buildAirliner, buildHelicopter } from './world/aircraft'
import { buildAirfield, type Airfield } from './world/airfield'
import { CoverageStrips, DroneVisual } from './world/drone'
import { EnergyIsland } from './world/energy'
import { FOD_LABEL, FodField } from './world/fod'
import { describePosition, footprint, LAYOUT, RWY, SCAN_HALF_WIDTH } from './world/layout'
import { buildEmergencyMarks, Geofence } from './world/markers'
import { SkySystem } from './world/sky'
import { Station } from './world/station'
import { Petek } from './world/petek'
import { PheromoneLayer } from './world/pheromone'
import { glowTexture } from './world/textures'
import { GnssLayer } from './world/gnss'
import { ScenarioDirector, type SceneId } from './scenario'
import { usePlanner } from '../planner/store'
import { actual, CKZ_SCHEDULE, DAY_START, type Task } from '../planner/plan'
import { DayRunner } from './day'
import type { Station as CamStation } from '../app/pages'
import { PostFx } from './post'
import { FlyControls } from './explore'
import { Annex14Layer } from './world/annex14'

/*
  Tarife: kule ön kontrolü ve pencere seçimi planlayıcıdaki seferleri kullanır, böylece planlayıcıda
  bir sefer geciktirilirse operasyon merkezi de yeni saate göre açılır.
  (Planlayıcı Sabiha Gökçen modundaysa operasyon merkezi temsili Çanakkale tarifesini kullanır.)
*/
function schedule() {
  const p = usePlanner.getState()
  const ms = p.airport === 'ckz' ? p.movements : CKZ_SCHEDULE
  return ms.map((m) => ({ t: actual(m), kind: m.kind, label: m.label })).sort((a, b) => a.t - b.t)
}
/** Tarama süresi (≈12,4 dk) + istasyonda olma tamponu (5 dk) */
export const MISSION_SECONDS = 745
export const BUFFER_SECONDS = PARAMS.scan.returnBufferMinutes * 60

export function nextMovement(clock: number) {
  return schedule().find((m) => m.t > clock) ?? null
}

/** Hareketten ≈18 dk önce başlayan tarama: ≈12,4 dk görev + 5 dk istasyonda bekleme tamponu. */
export const LEAD_SECONDS = 18 * 60

/** Saatten sonraki ilk uygun tarama penceresinin başlangıcı (yoksa null). */
export function nextWindow(clock: number) {
  const sch = schedule()
  for (let i = 0; i < sch.length; i++) {
    const m = sch[i]
    const start = m.t - LEAD_SECONDS
    const prev = sch[i - 1]
    if (prev && start < prev.t + 6 * 60) continue // önceki hareketle arada yeterli süre yok
    if (start >= clock - 1) return { start, movement: m }
  }
  return null
}

/** Drone renkleri kast rengindedir: iki kâşif mavinin iki tonu, bekçi turuncu, işçi yeşil */
const COLORS: Record<DroneId, string> = { 1: '#5aaaf0', 2: '#1478c8', 3: '#f08a4b', 4: '#72c766' }

type Mode = 'hero' | 'ops' | 'explore' | 'scene'

type Label = { el: HTMLDivElement; pos: () => THREE.Vector3 | null; minDist?: number }

/*
  Kamera istasyonları: sayfa açıkken kamera ilgili nesnenin çevresinde yavaşça döner.
  hero istasyonu sinematik drone takibidir (ana sayfa).
  r: yatay yarıçap, h: yükseklik, a: başlangıç açısı (rad), w: dönüş hızı (rad/s)
*/
type Orbit = { target: () => THREE.Vector3; r: number; h: number; a: number; w: number; fov?: number }
const v3 = (x: number, y: number, z: number) => () => new THREE.Vector3(x, y, z)
const ORBITS: Record<Exclude<CamStation, 'hero' | 'missions'>, Orbit> = {
  hive: { target: v3(LAYOUT.stationA.x + 4, 3, LAYOUT.stationA.z), r: 46, h: 17, a: 2.3, w: 0.045 },
  system: { target: v3(-150, 0, -30), r: 1750, h: 560, a: 2.55, w: 0.008 },
  hangar: { target: v3(LAYOUT.stationB.x, 2.5, LAYOUT.stationB.z), r: 24, h: 8, a: 0.9, w: 0.06 },
  emergency: { target: v3(-80, 0, 0), r: 620, h: 150, a: -1.35, w: 0.012 },
  planner: { target: v3(0, 0, 0), r: 1500, h: 420, a: 2.1, w: 0.008 },
  impact: { target: v3(LAYOUT.energy.x, 4, LAYOUT.energy.z), r: 48, h: 16, a: 1.9, w: 0.04 },
  safety: { target: v3(-700, 0, 0), r: 420, h: 150, a: 2.5, w: 0.015 },
  overview: { target: v3(0, 0, -60), r: 2100, h: 760, a: 1.9, w: 0.006 },
}

export class Engine {
  renderer: THREE.WebGLRenderer
  scene = new THREE.Scene()
  camera = new THREE.PerspectiveCamera(45, 1, 0.3, 90000)
  controls: OrbitControls
  private pmrem: THREE.PMREMGenerator
  private sky: SkySystem
  private airfield: Airfield
  stations: Station[]
  peteks: Petek[]
  pheromone = new PheromoneLayer(glowTexture())
  gnssLayer = new GnssLayer()
  private gnssTimer = 0
  private sceneRoot = new THREE.Group()
  director: ScenarioDirector
  private lastSceneSync = 0
  private trailFrom = new THREE.Vector3()
  private energy: EnergyIsland
  private droneVis: DroneVisual[]
  private strips: CoverageStrips[]
  fod = new FodField()
  private geofence = new Geofence()
  mission: Mission
  private heli = buildHelicopter()
  private heliState: { active: boolean; t: number; pos: THREE.Vector3; vel: THREE.Vector3 } = {
    active: false,
    t: 0,
    pos: new THREE.Vector3(),
    vel: new THREE.Vector3(),
  }
  private hazards = new THREE.Group()
  private parked: THREE.Group
  private day: DayRunner | null = null
  /** Alt adım sırasında geçerli simülasyon saati (olay kayıtları doğru saati taşısın) */
  private simClock: number | null = null
  private artifactDecal: THREE.Mesh
  private zoomCam = new THREE.PerspectiveCamera(20, 4 / 3, 0.3, 200)
  private thumbRT: THREE.WebGLRenderTarget

  mode: Mode = 'hero'
  /** Sinematik moddaki kamera istasyonu (sayfaya göre) */
  station: CamStation = 'hero'
  private stationStart = 0
  private look = new THREE.Vector3()
  private lastDraw = 0
  private reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
  private running = false
  private raf = 0
  private last = 0
  private realT = 0
  private lastSync = 0
  private heroWait = 0
  private reportTimer: { target: number; t: number } | null = null
  private camTarget = new THREE.Vector3()
  private heroOffset = new THREE.Vector3(-18, 2.5, 14)
  private camPos = new THREE.Vector3()
  private camBlend = 1
  private camFromPos = new THREE.Vector3()
  private camFromTarget = new THREE.Vector3()

  pipSlot: HTMLElement | null = null
  private pipBoxes: HTMLDivElement[] = []
  labelLayer: HTMLElement | null = null
  private labels: Label[] = []
  private detLabels = new Map<number, Label>()
  private pointerDown: { x: number; y: number } | null = null

  /* son işleme ve keşif modu */
  private post: PostFx | null = null
  private postQuality: Quality | null = null
  fly: FlyControls
  private annex = new Annex14Layer()
  private pickRoots: THREE.Object3D[] = []
  private raycaster = new THREE.Raycaster()
  private pointerNdc = new THREE.Vector2()
  private pointerIn = false
  private lastPick = 0
  hovered: PickId | null = null
  selected: PickId | null = null

  constructor(readonly canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, logarithmicDepthBuffer: true, powerPreference: 'high-performance' })
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.shadowMap.autoUpdate = false
    this.pmrem = new THREE.PMREMGenerator(this.renderer)

    this.sky = new SkySystem(this.scene)
    this.airfield = buildAirfield()
    this.scene.add(this.airfield.group)

    // iki petek, her birinde iki dolu hücre: [Kâşif-1, Kâşif-2, Bekçi, İşçi] sırasıyla istasyonlar
    this.peteks = [new Petek('A', LAYOUT.stationA.x, LAYOUT.stationA.z), new Petek('B', LAYOUT.stationB.x, LAYOUT.stationB.z)]
    this.peteks.forEach((p) => this.scene.add(p.group))
    const [pa, pb] = this.peteks
    this.stations = [
      new Station('A', COLORS[1], pa.cell(0).x, pa.cell(0).z),
      new Station('B', COLORS[2], pb.cell(0).x, pb.cell(0).z),
      new Station('A', COLORS[3], pa.cell(1).x, pa.cell(1).z),
      new Station('B', COLORS[4], pb.cell(1).x, pb.cell(1).z),
    ]
    this.stations.forEach((s) => this.scene.add(s.group))
    this.scene.add(this.pheromone.group, this.gnssLayer.group, this.sceneRoot)
    this.energy = new EnergyIsland(LAYOUT.energy.x, LAYOUT.energy.z)
    this.scene.add(this.energy.group)

    const marks = buildEmergencyMarks()
    marks.userData.pick = 'emergency'
    this.scene.add(this.fod.group, this.geofence.group, marks, this.hazards, this.annex.group)

    const airliner = buildAirliner()
    airliner.group.position.set(LAYOUT.apron.x - 60, 0, LAYOUT.apron.z - 12)
    airliner.group.rotation.y = Math.PI / 2
    airliner.group.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) o.castShadow = true
    })
    this.scene.add(airliner.group)
    this.parked = airliner.group

    this.heli.group.visible = false
    this.scene.add(this.heli.group)

    this.artifactDecal = new THREE.Mesh(
      new THREE.CircleGeometry(1, 20),
      new THREE.MeshBasicMaterial({ color: '#1e1e1e', transparent: true, opacity: 0.32, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3 }),
    )
    this.artifactDecal.rotation.x = -Math.PI / 2
    this.artifactDecal.scale.set(2.6, 0.7, 1)
    this.artifactDecal.visible = false
    this.scene.add(this.artifactDecal)

    this.mission = new Mission(this.stations, this.fod, {
      log: (k, t) => this.log(k, t),
      phase: (p, reason) => this.onPhase(p, reason),
      detect: (target, drone) => this.onDetect(target, drone),
      hazard: (x, z, drone) => this.onHazard(x, z, drone),
      breach: (on) => {
        this.geofence.setAlert(on)
        useSim.getState().set({ geofenceAlert: on })
      },
      sortieDone: (id) => this.day?.onSortieDone(id),
      picked: (item) => this.onPicked(item.id),
    })

    this.droneVis = this.mission.all.map((d) => new DroneVisual(d.id, COLORS[d.id], d.caste))
    this.droneVis.forEach((d) => d.addTo(this.scene))
    this.strips = this.mission.drones.map((d) => new CoverageStrips(COLORS[d.id], d.lanes, footprint(20).across))
    this.strips.forEach((s) => this.scene.add(s.group))

    this.thumbRT = new THREE.WebGLRenderTarget(320, 240)
    this.thumbRT.texture.colorSpace = THREE.SRGBColorSpace

    this.controls = new OrbitControls(this.camera, canvas)
    this.controls.enableDamping = true
    this.controls.maxPolarAngle = Math.PI / 2 - 0.04
    this.controls.minDistance = 6
    this.controls.maxDistance = 7000
    this.controls.enabled = false
    this.controls.addEventListener('start', () => {
      const s = useSim.getState()
      if (s.cameraMode !== 'overview') s.set({ cameraMode: 'overview' })
    })

    canvas.addEventListener('pointerdown', (e) => (this.pointerDown = { x: e.clientX, y: e.clientY }))
    canvas.addEventListener('pointerup', (e) => this.onPointerUp(e))

    // keşif modu: seçilebilen nesneler, serbest uçuş kamerası, üzerine gelme
    for (const st of this.stations) st.group.userData.pick = st.id === 'A' ? 'petekA' : 'petekB'
    pa.group.userData.pick = 'petekA'
    pb.group.userData.pick = 'petekB'
    this.droneVis[2].root.userData.pick = 'guard'
    this.droneVis[3].root.userData.pick = 'worker'
    this.energy.group.userData.pick = 'energy'
    this.droneVis[0].root.userData.pick = 'drone1'
    this.droneVis[1].root.userData.pick = 'drone2'
    this.parked.userData.pick = 'aircraft'
    this.scene.traverse((o) => {
      if (o.userData.pick) this.pickRoots.push(o)
    })
    this.raycaster.camera = this.camera
    this.fly = new FlyControls(this.camera, canvas)
    this.director = new ScenarioDirector(() => ({
      root: this.sceneRoot,
      mission: this.mission,
      fod: this.fod,
      pheromone: this.pheromone,
      peteks: this.peteks,
      parked: this.parked,
      setClock: (sec) => useSim.getState().set({ clock: sec, wind: 3.2 }),
    }))
    canvas.addEventListener('pointermove', (e) => {
      if (this.mode !== 'explore' || e.pointerType === 'touch') return
      this.pointerIn = true
      this.pointerNdc.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1)
    })
    canvas.addEventListener('pointerleave', () => {
      this.pointerIn = false
      this.setHovered(null)
    })

    this.applyQuality(useSim.getState().quality)
    this.resize()
    window.addEventListener('resize', () => this.resize())

    this.enterHero()
  }

  /* ---------- Yaşam döngüsü ---------- */

  resize() {
    const w = window.innerWidth
    const h = window.innerHeight
    this.renderer.setSize(w, h, false)
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
    this.post?.setSize(w, h)
  }

  applyQuality(q: Quality) {
    const dpr = window.devicePixelRatio || 1
    // son işleme açıkken ekran ve ara hedefler aynı çözünürlükte
    const ratio = q === 'low' ? Math.min(dpr, 1) : PostFx.pixelRatio(q)
    this.renderer.setPixelRatio(ratio)
    if (q === 'low') {
      this.post?.dispose()
      this.post = null
    } else if (!this.post || this.postQuality !== q) {
      this.post?.dispose()
      this.post = new PostFx(this.renderer, this.scene, this.camera, q)
    }
    this.postQuality = q
    this.refreshOutline()
    this.renderer.shadowMap.enabled = q !== 'low'
    this.sky.sun.castShadow = q !== 'low'
    const size = q === 'high' ? 2048 : 1024
    if (this.sky.sun.shadow.mapSize.x !== size) {
      this.sky.sun.shadow.mapSize.set(size, size)
      this.sky.sun.shadow.map?.dispose()
      this.sky.sun.shadow.map = null
    }
    this.resize()
  }

  setActive(on: boolean) {
    if (on === this.running) return
    this.running = on
    if (on) {
      this.last = performance.now()
      this.raf = requestAnimationFrame(this.loop)
    } else cancelAnimationFrame(this.raf)
  }

  setMode(mode: Mode) {
    if (mode === this.mode) return
    const prev = this.mode
    this.mode = mode
    this.fly.enabled = mode === 'explore'
    if (prev === 'explore') this.leaveExplore()
    if (prev === 'scene') this.director.stop()
    if (mode === 'scene') {
      if (prev === 'ops') this.look.copy(this.controls.target)
      this.startScene()
      return
    }
    if (mode === 'hero') {
      if (prev === 'ops' || prev === 'scene') {
        this.look.copy(this.controls.target)
        this.enterHero()
      } else {
        const d = new THREE.Vector3()
        this.camera.getWorldDirection(d)
        this.look.copy(this.camera.position).addScaledVector(d, 60)
      }
      this.startCamBlend()
    } else if (mode === 'explore') {
      if (prev === 'ops' || prev === 'scene') this.enterHero()
      this.controls.enabled = false
      this.geofence.setVisible(false)
      this.camera.clearViewOffset()
      this.fly.syncFromCamera()
      // başlangıç: 04 ucunun arkasından, petek A, enerji adası ve pist kadrajda
      this.fly.flyTo(new THREE.Vector3(-1480, 110, 520), new THREE.Vector3(-420, 0, 60))
    } else this.enterOps()
  }

  /* ---------- Senaryo oynatıcısı ---------- */

  /** Sahneyi baştan kur: kovan peteklerinde, pist boş, sahnenin saati */
  private startScene() {
    const id = useSim.getState().scene as SceneId | null
    if (!id) return
    this.stopDay(false)
    this.controls.enabled = false
    this.clearLabels()
    this.resetWorld(0)
    this.geofence.setVisible(false)
    this.heroWait = 0
    this.camera.clearViewOffset()
    this.director.start(id)
    this.startCamBlend()
    useSim.getState().set({ sceneT: 0 })
  }

  /** Arayüzden: aynı sahneyi yeniden oynat */
  restartScene() {
    if (this.mode === 'scene') this.startScene()
  }

  /** Sahne değiştiyse (bir senaryodan ötekine geçildi) yeni sahneyi kur */
  syncScene() {
    if (this.mode === 'scene' && this.director.id !== useSim.getState().scene) this.startScene()
  }

  /* ---------- Keşif modu: seçme, inceleme, Ek 14 ---------- */

  private leaveExplore() {
    this.pointerIn = false
    this.setHovered(null)
    this.select(null)
    this.setAnnex(false)
    this.canvas.style.cursor = ''
  }

  private objectsFor(id: PickId | null) {
    return id ? this.pickRoots.filter((o) => o.userData.pick === id) : []
  }

  private visibleChain(o: THREE.Object3D | null) {
    for (let p = o; p; p = p.parent) if (!p.visible) return false
    return true
  }

  /** Ekran noktasındaki en yakın seçilebilir nesne */
  pickAt(ndc: THREE.Vector2): PickId | null {
    this.raycaster.setFromCamera(ndc, this.camera)
    for (const h of this.raycaster.intersectObjects(this.pickRoots, true)) {
      if (!this.visibleChain(h.object)) continue
      for (let p: THREE.Object3D | null = h.object; p; p = p.parent) if (p.userData.pick) return p.userData.pick as PickId
    }
    return null
  }

  private setHovered(id: PickId | null) {
    if (id === this.hovered) return
    this.hovered = id
    if (this.mode === 'explore') this.canvas.style.cursor = id ? 'pointer' : ''
    useSim.getState().set({ hovered: id })
    this.refreshOutline()
  }

  select(id: PickId | null) {
    this.selected = id
    useSim.getState().set({ selected: id })
    this.refreshOutline()
  }

  private refreshOutline() {
    const objs = [...new Set([...this.objectsFor(this.hovered), ...this.objectsFor(this.selected)])]
    this.post?.setOutlined(objs)
  }

  /** Seçilen nesneye uç (F tuşu, karttaki Odaklan) */
  focusPick(id: PickId | null = this.selected) {
    const objs = this.objectsFor(id)
    if (!objs.length) return
    const box = new THREE.Box3()
    objs.forEach((o) => box.expandByObject(o))
    const center = box.getCenter(new THREE.Vector3())
    const r = Math.max(3, box.getSize(new THREE.Vector3()).length() / 2)
    const dir = this.camera.position.clone().sub(center).setY(0)
    if (dir.lengthSq() < 1) dir.set(-1, 0, 1)
    dir.normalize()
    const dist = r * 1.7 + 6
    const pos = center.clone().addScaledVector(dir, dist)
    pos.y = center.y + Math.max(4, dist * 0.42)
    this.fly.flyTo(pos, center)
  }

  /** Ek 14 yüzeylerini göster/gizle */
  setAnnex(on: boolean) {
    this.annex.setVisible(on)
    if (useSim.getState().annex14 !== on) useSim.getState().set({ annex14: on })
  }

  /** Anlık enerji üretimi (kW), inceleme kartı için */
  energyOutput() {
    return EnergyIsland.output(this.sky.elev, useSim.getState().wind)
  }

  private updatePick() {
    if (!this.pointerIn || this.realT - this.lastPick < 0.1) return
    this.lastPick = this.realT
    this.setHovered(this.pickAt(this.pointerNdc))
  }

  /** Sayfa değişti: kamera yeni istasyona uçar. */
  setStation(st: CamStation) {
    if (st === this.station) return
    this.station = st
    this.stationStart = this.realT
    if (this.mode === 'hero') {
      this.startCamBlend()
      this.geofence.setVisible(st === 'safety')
    }
  }

  private startCamBlend() {
    this.camFromPos.copy(this.camera.position)
    this.camFromTarget.copy(this.look)
    // ilk kare çizilmeden istasyon verilirse (sayfa doğrudan açıldı) kamera uçmadan yerine konur
    this.camBlend = this.reducedMotion || this.realT === 0 ? 1 : 0
  }

  private enterHero() {
    this.stopDay(false)
    this.controls.enabled = false
    this.clearLabels()
    this.resetWorld(3)
    useSim.getState().set({ clock: 8 * 3600 + 15 * 60, wind: 5.2 })
    this.mission.launch()
    // kovan: kâşifler pisti tararken bekçi aynı anda çit boyunca devriye gezer
    this.mission.sortie(this.mission.guard, 'fence')
    this.trailFrom.copy(this.mission.guard.pos)
    this.heroWait = 0
    this.geofence.setVisible(this.mode === 'hero' && this.station === 'safety')
  }

  private enterOps() {
    this.stopDay(false)
    this.controls.enabled = true
    this.geofence.setVisible(true)
    const s = useSim.getState()
    // planlayıcıdaki tarifeden: sabah 08:20'den sonraki ilk uygun pencere (varsayılan tarifede 08:37)
    const w = nextWindow(8 * 3600 + 20 * 60) ?? nextWindow(DAY_START)
    s.set({ clock: w?.start ?? 8 * 3600 + 37 * 60, cameraMode: 'overview', log: [], paused: false, speed: 16 })
    this.resetWorld(2)
    this.placeCamera('overview', true)
    this.log('info', 'Görev planlandı: uçuş öncesi FOD taraması (2 kâşif, pist 04/22)')
    if (w)
      this.log(
        'info',
        `Sonraki hareket ${fmtClock(w.movement.t)} ${w.movement.label}; tarama penceresi ${fmtClock(w.start)}–${fmtClock(w.movement.t - BUFFER_SECONDS)}`,
      )
    this.log('tower', 'Kule onayı bekleniyor. Onay olmadan kalkış yok.')
  }

  /* ---------- Günü oynat ---------- */

  playDay(rate: number) {
    if (this.mode !== 'ops') this.setMode('ops')
    this.stopDay(false)
    const p = usePlanner.getState()
    this.resetWorld(0)
    this.mission.reset(true)
    this.parked.visible = false
    this.geofence.setVisible(false)
    const day = new DayRunner(
      {
        mission: this.mission,
        fod: this.fod,
        log: (k, t) => this.log(k, t),
        launch: (task) => this.launchDayTask(task),
        review: (id, status) => this.reviewDetection(id, status),
        setTask: (label) => useSim.getState().set({ dayTask: label }),
        finish: (summary) => {
          this.log('ok', summary)
          useSim.getState().set({ dayDone: true, paused: true })
        },
      },
      p.plan,
      p.airport === 'ckz' ? p.movements : CKZ_SCHEDULE,
    )
    this.day = day
    this.scene.add(day.fleet.group, day.vehicle.group)
    useSim.getState().set({
      dayMode: true,
      dayDone: false,
      dayTask: null,
      clock: DAY_START,
      speed: rate,
      paused: false,
      log: [],
      cameraMode: 'overview',
      phase: 'idle',
      fodCount: 0,
    })
    this.placeCamera('overview', false)
    const flown = p.plan.tasks.filter((t) => t.status === 'ok').length
    this.log(
      'info',
      `Gün oynatılıyor (${rate}×): ${p.movements.length} ticari hareket, ${p.plan.tasks.length} görev (${flown} tanesi drone ile) planlayıcıdan alındı`,
    )
  }

  /** Günü durdur; restore: normal operasyon merkezine dön */
  stopDay(restore = true) {
    if (!this.day) return
    this.scene.remove(this.day.fleet.group, this.day.vehicle.group)
    this.day.dispose()
    this.day = null
    this.parked.visible = true
    useSim.getState().set({ dayMode: false, dayDone: false, dayTask: null, speed: 16, paused: false })
    if (restore) this.enterOps()
  }

  private launchDayTask(t: Task) {
    // bekçi görevleri ana görevden bağımsız sorti olarak uçar (kâşiflerle aynı anda olabilir)
    if (t.caste === 'guard' && (t.type === 'fence' || t.type === 'wildlife')) {
      this.mission.sortie(this.mission.guard, t.type)
      this.trailFrom.copy(this.mission.guard.pos)
      return
    }
    const task = t.type
    this.strips.forEach((s) => s.reset())
    this.geofence.setVisible(task === 'fod' || task === 'opening' || task === 'health')
    this.geofence.setAlert(false)
    this.mission.launch(task)
    const a = this.mission.artifact
    this.artifactDecal.visible = !!a
    if (a) this.artifactDecal.position.set(a.x, 0.11, a.z)
    useSim.getState().set({ phase: 'flight', startedAt: useSim.getState().clock })
  }

  /** Sıradaki olaylar (gün modu arayüzü için) */
  dayUpcoming(n = 5) {
    return this.day ? this.day.upcoming(useSim.getState().clock, n) : []
  }

  /** Dünyayı yeni görev için hazırla. */
  private resetWorld(randomObjects: number, keepObjects = false) {
    this.mission.reset()
    this.pheromone.clear()
    this.gnssLayer.setMode(null)
    useSim.getState().set({ gnss: null })
    if (!keepObjects) {
      this.fod.clear()
      this.fod.randomize(randomObjects)
    } else this.fod.resetDetections()
    this.strips.forEach((s) => s.reset())
    this.hazards.clear()
    this.reportTimer = null
    this.heliState.active = false
    this.heli.group.visible = false
    this.detLabels.forEach((l) => l.el.remove())
    this.detLabels.clear()
    const a = this.mission.artifact
    this.artifactDecal.visible = !!a
    if (a) this.artifactDecal.position.set(a.x, 0.11, a.z)
    const n = Math.floor(Math.random() * 900) + 100
    useSim.getState().set({
      phase: 'idle',
      missionId: `FOD-${n}`,
      startedAt: null,
      checks: [],
      detections: [],
      report: null,
      reportOpen: false,
      abortReason: null,
      fodCount: this.fod.items.length,
      geofenceAlert: false,
    })
    this.sync(true)
  }

  /* ---------- Komutlar (arayüzden) ---------- */

  newMission(keepObjects: boolean) {
    const s = useSim.getState()
    const w = nextWindow(s.clock)
    this.resetWorld(2, keepObjects)
    this.log('info', keepObjects ? 'Yeni görev: pistteki nesneler yerinde bırakıldı' : 'Yeni görev hazırlandı')
    if (w && w.start > s.clock + 60) {
      useSim.getState().set({ clock: w.start })
      this.log('info', `Planlayıcı sonraki pencereyi seçti: ${fmtClock(w.start)} (${fmtClock(w.movement.t)} ${w.movement.label} öncesi)`)
    }
    this.log('tower', 'Kule onayı bekleniyor.')
  }

  /** Kule ekranından: saati sonraki uygun pencereye al. */
  jumpToWindow() {
    const s = useSim.getState()
    const w = nextWindow(s.clock)
    if (!w) return
    s.set({ clock: w.start })
    this.log('info', `Saat sonraki pencereye alındı: ${fmtClock(w.start)} (${fmtClock(w.movement.t)} ${w.movement.label} öncesi)`)
    if (s.phase === 'awaiting') s.set({ checks: this.computeChecks() })
  }

  computeChecks(): Check[] {
    const s = useSim.getState()
    const next = nextMovement(s.clock)
    const left = next ? next.t - s.clock : Infinity
    const windowOk = left - BUFFER_SECONDS >= MISSION_SECONDS
    const heliKm = this.heliState.active ? this.heliState.pos.length() / 1000 : null
    const d = this.mission.drones
    return [
      {
        id: 'window',
        label: 'Tarifeye göre zaman penceresi',
        value: next
          ? `${next.label} ${fmtClock(next.t)}; ${Math.floor(left / 60)} dk var (gereken ≈${Math.ceil((MISSION_SECONDS + BUFFER_SECONDS) / 60)} dk)`
          : 'Bugün başka hareket yok',
        ok: windowOk,
      },
      { id: 'wind', label: 'Rüzgâr (iniş-kalkış sınırı 8 m/s)', value: `${s.wind.toFixed(1).replace('.', ',')} m/s`, ok: s.wind <= PARAMS.drone.windTakeoffLimit },
      { id: 'wx', label: 'Yağış ve görüş', value: 'Yağış yok, görüş 10 km üzeri', ok: true },
      {
        id: 'adsb',
        label: 'ADS-B hava trafiği',
        value: heliKm !== null ? `Hava aracı ${heliKm.toFixed(1).replace('.', ',')} km uzakta` : 'Yakında hava aracı yok',
        ok: heliKm === null,
      },
      { id: 'bat', label: 'Batarya (en az %50)', value: `D1 %${Math.round(d[0].battery)}, D2 %${Math.round(d[1].battery)}`, ok: d.every((x) => x.battery >= 50) },
      { id: 'geo', label: 'Sanal sınır', value: 'Pist şeridi, 30 m tavan, yüklendi', ok: true },
      {
        id: 'gnss',
        label: 'RF/GNSS bütünlüğü',
        value: s.gnss === 'jam' ? 'Karıştırma: L1/L5 sinyal gücü düştü' : s.gnss === 'spoof' ? 'Aldatma: GNSS konumu UWB ve görsel konumla uyuşmuyor' : 'Temiz; RTK düzeltmesi var',
        ok: s.gnss === null,
      },
      { id: 'rwy', label: 'Pist durumu', value: 'Kule: pist kullanımda değil', ok: true },
    ]
  }

  requestApproval() {
    const s = useSim.getState()
    if (!['idle', 'blocked', 'done', 'aborted'].includes(s.phase)) return
    if (s.phase !== 'idle') this.newMission(true)
    useSim.getState().set({ phase: 'awaiting', checks: this.computeChecks() })
    this.log('tower', 'Kuleye görev onayı isteği gönderildi')
  }

  reject() {
    if (useSim.getState().phase !== 'awaiting') return
    useSim.getState().set({ phase: 'idle' })
    this.log('tower', 'Kule görevi reddetti. Drone’lar peteklerinde kalıyor.')
  }

  approve() {
    const s = useSim.getState()
    if (s.phase !== 'awaiting') return
    const checks = this.computeChecks()
    s.set({ phase: 'preflight', checks })
    this.log('tower', `Kule onayı verildi (${fmtClock(s.clock)})`)
    window.setTimeout(() => {
      if (useSim.getState().phase !== 'preflight') return
      const failed = checks.filter((c) => c.ok === false)
      if (failed.length) {
        const reason = failed.map((f) => f.label.split(' (')[0]).join(', ')
        useSim.getState().set({ phase: 'blocked', abortReason: reason })
        this.log('alert', `Ön kontrol başarısız: ${reason}. Görev başlamadı; denetim bugünkü gibi araçla yapılır.`)
        return
      }
      this.log('ok', 'Ön kontroller tamam: rüzgâr, hava, ADS-B, batarya, sanal sınır, RF/GNSS bütünlüğü')
      useSim.getState().set({ startedAt: useSim.getState().clock })
      this.mission.launch()
    }, 1700)
  }

  recall() {
    const p = useSim.getState().phase
    if (p !== 'flight') return
    this.log('tower', 'Kule görevi iptal etti ve drone’ları geri çağırdı')
    this.mission.abort('Kule geri çağırdı')
  }

  fault(f: Fault) {
    const phase = useSim.getState().phase
    if (f === 'recall') return this.recall()
    if (f === 'adsb') {
      const st = this.heliState
      st.active = true
      st.t = 0
      st.pos.set(2900, 330, 2100)
      const target = new THREE.Vector3(-1600, 140, -1500)
      st.vel.copy(target.sub(st.pos).normalize().multiplyScalar(52))
      this.heli.group.visible = true
      const km = (st.pos.length() / 1000).toFixed(1).replace('.', ',')
      const ft = Math.round((st.pos.y * 3.281) / 10) * 10
      this.log('alert', `ADS-B: tarifede olmayan hava aracı, ${km} km, ${ft.toLocaleString('tr-TR')} ft, yaklaşıyor`)
      if (phase === 'flight') this.mission.abort('ADS-B: yaklaşan hava aracı')
      else if (phase === 'awaiting') useSim.getState().set({ checks: this.computeChecks() })
      return
    }
    if (f === 'gnss' || f === 'spoof') return this.gnssFault(f)
    if (phase !== 'flight') {
      this.log('info', 'Bu arıza yalnızca drone’lar havadayken verilebilir. Önce görevi başlatın.')
      return
    }
    if (f === 'link') {
      const target = this.mission.drones.find((d) => d.id === 2 && d.airborne) ?? this.mission.drones.find((d) => d.airborne)
      if (target) this.mission.linkLoss(target.id)
    }
    if (f === 'geofence') {
      const target = this.mission.drones.find((d) => d.id === 1 && d.airborne) ?? this.mission.drones.find((d) => d.airborne)
      if (target) this.mission.gust(target.id)
    }
  }

  /* ---------- Güvenli konum: karıştırma ve aldatma ---------- */

  private gnssFault(f: 'gnss' | 'spoof') {
    const s = useSim.getState()
    const mode = f === 'gnss' ? 'jam' : 'spoof'
    s.set({ gnss: mode })
    this.gnssLayer.setMode(mode)
    this.gnssTimer = mode === 'jam' ? 150 : 90
    const flying = s.phase === 'flight' || s.phase === 'return'
    if (mode === 'jam') {
      this.log('alert', 'RF izleyici: L1/L5 bandında güçlü karıştırma, kaynak çitin dışında. GNSS ve RTK düzeltmesi kayboldu.')
      if (flying) this.log('ok', 'Konum kaynağı değişti: UWB işaretçileri + görsel konum + IMU. Drone’lar şeritte kalıyor, görev sürüyor; kule bilgilendirildi.')
      else this.log('warn', 'Ön kontrolde RF/GNSS bütünlüğü kırmızı: karıştırma sürdükçe hiçbir drone kalkmaz.')
    } else {
      this.log('alert', 'Bütünlük denetleyicisi: D1’in GNSS konumu UWB ve görsel konumdan ≈38 m sapıyor. Aldatma tespit edildi.')
      if (flying) this.log('ok', 'Sahte GNSS kaynağı dışlandı; D1 UWB + görsel konum + IMU ile rotasında. Kule ve askerî birim bilgilendirildi.')
      else this.log('warn', 'Ön kontrolde RF/GNSS bütünlüğü kırmızı: aldatma sürdükçe hiçbir drone kalkmaz.')
    }
    if (s.phase === 'awaiting') s.set({ checks: this.computeChecks() })
  }

  private updateGnss(dtSim: number, dtReal: number) {
    const s = useSim.getState()
    if (!s.gnss) return
    this.gnssTimer -= dtSim
    const air = this.mission.all.filter((d) => d.airborne).map((d) => d.pos)
    this.gnssLayer.update(dtReal, air, this.mission.drones[0].airborne ? this.mission.drones[0].pos : null)
    if (this.gnssTimer <= 0) {
      const was = s.gnss
      s.set({ gnss: null })
      this.gnssLayer.setMode(null)
      this.log('ok', was === 'jam' ? 'Karıştırma sona erdi: GNSS ve RTK düzeltmesi geri geldi.' : 'Aldatma sinyali kesildi: GNSS konumu yeniden diğer kaynaklarla uyumlu.')
      if (s.phase === 'awaiting') s.set({ checks: this.computeChecks() })
    }
  }

  /* ---------- İşçi ile toplama (operasyon merkezi) ---------- */

  /** Operatör "İşçi ile topla" dedi: kule pencereyi ve koşulları kontrol eder, işçi kalkar. */
  requestPickup(id: number) {
    const s = useSim.getState()
    const det = s.detections.find((d) => d.id === id)
    const item = this.fod.items.find((it) => it.id === id)
    if (!det || det.status !== 'confirmed' || det.pickup) return
    const deny = (note: string) => {
      s.setDetection(id, { pickup: 'denied', pickupNote: note })
      this.log('warn', `İşçi ile toplama yapılmadı: ${note}`)
    }
    if (!item) return deny('nesne pistte bulunamadı.')
    if (item.cls === 'tire') return deny('lastik parçası 1 kg / 30 cm sınırını aşabilir; saha ekibi kaldırır.')
    if (s.wind > PARAMS.drone.windTakeoffLimit) return deny(`rüzgâr ${s.wind.toFixed(1).replace('.', ',')} m/s, sınır 8 m/s; saha ekibi kaldırır.`)
    const w = this.mission.worker
    const dist = Math.hypot(item.x - w.station.padTop.x, item.z - w.station.padTop.z)
    const need = (2 * dist) / 12 + 14 + 70 // gidiş-dönüş, vinç, kalkış ve iniş
    const next = nextMovement(s.clock)
    if (next && next.t - s.clock < need + BUFFER_SECONDS) return deny(`${next.label} ${fmtClock(next.t)}; pist penceresi yetmiyor. Saha ekibi kaldırır.`)
    s.setDetection(id, { pickup: 'enroute' })
    this.log('tower', `Operatör: ${det.label} için işçi ile toplama. Kule pencereyi onayladı (pist kullanımda değil).`)
    this.log('info', `İşçi Petek B’den kalkıyor: nesnenin 4 m üstünde asılı kalıp vinçle alacak (≈${Math.round(need / 60)} dk).`)
    this.pheromone.waggle(new THREE.Vector3(item.x, 3, item.z), w.station.padTop.clone().setY(3))
    this.mission.pickup(item)
  }

  private onPicked(id: number) {
    const s = useSim.getState()
    if (!s.detections.some((d) => d.id === id)) return
    s.setDetection(id, { pickup: 'done' })
    this.log('ok', 'İşçi nesneyi vinçle aldı; Petek B’deki FOD kutusuna götürüyor. Sınıf, konum ve saat kayda geçti.')
    useSim.getState().set({ fodCount: this.fod.items.length })
  }

  reviewDetection(id: number, status: 'confirmed' | 'rejected') {
    const s = useSim.getState()
    s.setDetection(id, { status })
    if (id > 0) this.fod.setStatus(id, status)
    const det = s.detections.find((d) => d.id === id)
    const l = this.detLabels.get(id)
    if (l) l.el.dataset.status = status
    if (det)
      this.log(
        status === 'confirmed' ? 'warn' : 'info',
        status === 'confirmed'
          ? `Saha ekibi onayladı: ${det.label}. Kaldırma ekibi yönlendirildi.`
          : `Yanlış alarm olarak işaretlendi: ${det.label}. Görüntü yeni etiket olarak eğitim kuyruğuna eklendi.`,
      )
  }

  setPlacing(on: boolean) {
    useSim.getState().set({ placing: on })
    this.canvas.style.cursor = on ? 'crosshair' : ''
  }

  clearFod() {
    this.fod.clear()
    useSim.getState().set({ fodCount: 0 })
    this.log('info', 'Pistteki tüm nesneler kaldırıldı (temiz pist senaryosu)')
  }

  /** Sayfadaki mimari şemasından: kamerayı bir nesneye yumuşakça götür */
  focusObject(name: 'stationA' | 'stationB' | 'energy' | 'tower') {
    const presets = {
      stationA: { pos: [LAYOUT.stationA.x - 22, 11, LAYOUT.stationA.z + 26], target: [LAYOUT.stationA.x, 2, LAYOUT.stationA.z] },
      stationB: { pos: [LAYOUT.stationB.x + 22, 11, LAYOUT.stationB.z + 26], target: [LAYOUT.stationB.x, 2, LAYOUT.stationB.z] },
      energy: { pos: [LAYOUT.energy.x - 34, 20, LAYOUT.energy.z + 38], target: [LAYOUT.energy.x + 2, 3, LAYOUT.energy.z] },
      tower: { pos: [LAYOUT.tower.x + 60, 40, LAYOUT.tower.z + 70], target: [LAYOUT.tower.x, 24, LAYOUT.tower.z] },
    }[name]
    useSim.getState().set({ cameraMode: 'overview' })
    this.camFromPos.copy(this.camera.position)
    this.camFromTarget.copy(this.controls.target)
    this.camPos.set(presets.pos[0], presets.pos[1], presets.pos[2])
    this.camTarget.set(presets.target[0], presets.target[1], presets.target[2])
    this.camBlend = 0
  }

  setCamera(mode: CameraMode) {
    useSim.getState().set({ cameraMode: mode })
    this.placeCamera(mode, false)
  }

  /* ---------- Olaylar ---------- */

  private log(kind: LogKind, text: string) {
    if (this.mode !== 'ops') return
    useSim.getState().pushLog(kind, text, this.simClock ?? undefined)
  }

  private onPhase(p: string, reason?: string) {
    const s = useSim.getState()
    if (this.mode !== 'ops') {
      if (p === 'verify') this.heroWait = 0.001
      return
    }
    if (this.day) {
      if (p === 'flight' || p === 'verify') s.set({ phase: p })
      if (p === 'report') {
        const found = s.detections.filter((d) => d.t >= (s.startedAt ?? 0) && d.cls !== 'artifact').length
        if (this.mission.scanning)
          this.log('ok', found ? `Pist tarama raporu kuleye iletildi: ${found} nesne` : 'Temiz pist raporu kuleye iletildi')
        this.mission.phase = 'idle'
        s.set({ phase: 'idle' })
        this.geofence.setVisible(false)
        this.day.onDocked()
      }
      return
    }
    if (p === 'flight') s.set({ phase: 'flight' })
    if (p === 'return') {
      s.set({ phase: 'return', abortReason: reason ?? null })
      this.log('alert', `Görev kesildi: ${reason}. Drone’lar peteklerine dönüyor.`)
    }
    if (p === 'aborted') {
      s.set({ phase: 'aborted' })
      this.log('warn', 'Görev sonlandı. İki drone istasyona dönmeden temiz pist raporu üretilmez; pist araçla denetlenmeli.')
    }
    if (p === 'verify') s.set({ phase: 'verify' })
    if (p === 'report') {
      s.set({ phase: 'report' })
      this.reportTimer = { target: 58 + Math.random() * 24, t: 0 }
      this.log('info', 'Rapor hazırlanıyor: görüntüler kenar sunucuda işleniyor')
    }
  }

  private onDetect(target: DetectTarget, drone: DroneId) {
    const s = useSim.getState()
    const cls = target.kind === 'fod' ? target.item.cls : 'artifact'
    const x = target.kind === 'fod' ? target.item.x : target.x
    const z = target.kind === 'fod' ? target.item.z : target.z
    const id = target.kind === 'fod' ? target.item.id : -Date.now()
    const conf = confidenceFor(cls)
    const label = cls === 'artifact' ? 'Olası nesne (koyu iz)' : FOD_LABEL[cls]
    const now = this.simClock ?? s.clock
    if (target.kind === 'fod') {
      // feromon: nesne ortak haritaya işlenir
      this.pheromone.addFod(target.item.id, x, z)
      if (this.mode !== 'ops') {
        // sinematik kovan: kâşif konumu işçiye bildirir (sallanma dansı), işçi toplamaya kalkar
        const scout = this.mission.drones[drone - 1]
        this.pheromone.waggle(scout.pos.clone(), this.mission.worker.station.padTop.clone().setY(3))
        if (target.item.cls !== 'tire') this.mission.pickup(target.item)
      }
    }
    const det: Detection = { id, cls, label, conf, x, z, drone: drone as 1 | 2, t: now, status: 'pending', thumb: this.mode === 'ops' ? this.captureThumb(x, z) : undefined }
    if (target.kind === 'fod') this.fod.setStatus(target.item.id, 'pending')
    if (this.mode !== 'ops') return
    s.set({ detections: [...s.detections, det] })
    this.day?.onDetect(id, cls === 'artifact', now)
    this.log(
      cls === 'artifact' ? 'warn' : 'alert',
      `Drone ${drone}: ${label}, güven %${Math.round(conf * 100)}. ${describePosition(x, z)}. Kule ve saha ekibine bildirildi.`,
    )
    this.addDetLabel(det)
  }

  private onHazard(x: number, z: number, drone: DroneId) {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(2.4, 3.2, 40),
      new THREE.MeshBasicMaterial({ color: '#ff3b30', transparent: true, opacity: 0.9, depthWrite: false, side: THREE.DoubleSide }),
    )
    ring.rotation.x = -Math.PI / 2
    ring.position.set(x, 0.2, z)
    this.hazards.add(ring)
    if (this.mode !== 'ops' || !this.labelLayer) return
    const el = document.createElement('div')
    el.className = 'sim-label sim-label--hazard'
    el.textContent = `D${drone} acil iniş: FOD bildirildi`
    this.labelLayer.appendChild(el)
    const p = new THREE.Vector3(x, 3, z)
    this.labels.push({ el, pos: () => p })
  }

  /* ---------- Etiketler, kamera akışı, küçük resim ---------- */

  setLabelLayer(el: HTMLElement | null) {
    this.clearLabels()
    this.labelLayer = el
    if (!el) return
    const mk = (text: string, cls: string, pos: () => THREE.Vector3 | null, minDist?: number) => {
      const d = document.createElement('div')
      d.className = `sim-label ${cls}`
      d.textContent = text
      el.appendChild(d)
      this.labels.push({ el: d, pos, minDist })
    }
    const dv = this.mission.drones
    mk('D1', 'sim-label--d1', () => dv[0].pos.clone().add(new THREE.Vector3(0, 3, 0)))
    mk('D2', 'sim-label--d2', () => dv[1].pos.clone().add(new THREE.Vector3(0, 3, 0)))
    mk('Bekçi', 'sim-label--guard', () => this.mission.guard.pos.clone().add(new THREE.Vector3(0, 3, 0)))
    mk('İşçi', 'sim-label--worker', () => this.mission.worker.pos.clone().add(new THREE.Vector3(0, 3.6, 0)))
    mk('Petek A', 'sim-label--place', () => new THREE.Vector3(LAYOUT.stationA.x, 8, LAYOUT.stationA.z))
    mk('Petek B', 'sim-label--place', () => new THREE.Vector3(LAYOUT.stationB.x, 8, LAYOUT.stationB.z))
    mk('Enerji adası', 'sim-label--place', () => new THREE.Vector3(LAYOUT.energy.x, 14, LAYOUT.energy.z))
    mk('Kule', 'sim-label--place', () => new THREE.Vector3(LAYOUT.tower.x, 38, LAYOUT.tower.z))
    mk('Pist 04', 'sim-label--rwy', () => new THREE.Vector3(-RWY.half + 60, 2, 0), 400)
    mk('Pist 22', 'sim-label--rwy', () => new THREE.Vector3(RWY.half - 60, 2, 0), 400)
    mk('ADS-B', 'sim-label--hazard', () => (this.heliState.active ? this.heli.group.position.clone().add(new THREE.Vector3(0, 8, 0)) : null))
    mk('Denetim aracı', 'sim-label--place', () => (this.day?.vehicle.busy ? this.day.vehicle.group.position.clone().setY(7) : null))
    mk('Yolcu uçağı', 'sim-label--place', () => {
      const a = this.day?.fleet.active(useSim.getState().clock)
      return a ? a.position.clone().add(new THREE.Vector3(0, 16, 0)) : null
    })
    for (const det of useSim.getState().detections) this.addDetLabel(det)
  }

  private addDetLabel(det: Detection) {
    if (!this.labelLayer || this.detLabels.has(det.id)) return
    const el = document.createElement('div')
    el.className = 'sim-label sim-label--det'
    el.dataset.status = det.status
    el.textContent = `${det.label} %${Math.round(det.conf * 100)}`
    this.labelLayer.appendChild(el)
    const p = new THREE.Vector3(det.x, 2.5, det.z)
    const l = { el, pos: () => p, minDist: 900 }
    this.detLabels.set(det.id, l)
  }

  private clearLabels() {
    this.labels.forEach((l) => l.el.remove())
    this.labels = []
    this.detLabels.forEach((l) => l.el.remove())
    this.detLabels.clear()
  }

  setPipSlot(el: HTMLElement | null) {
    this.pipBoxes.forEach((b) => b.remove())
    this.pipBoxes = []
    this.pipSlot = el
  }

  private v = new THREE.Vector3()
  private updateLabels() {
    if (!this.labelLayer) return
    const w = window.innerWidth
    const h = window.innerHeight
    const all = [...this.labels, ...this.detLabels.values()]
    for (const l of all) {
      const p = l.pos()
      if (!p) {
        l.el.style.display = 'none'
        continue
      }
      const dist = p.distanceTo(this.camera.position)
      this.v.copy(p).project(this.camera)
      const visible = this.v.z < 1 && Math.abs(this.v.x) < 1.05 && Math.abs(this.v.y) < 1.05 && (!l.minDist || dist < l.minDist * 3)
      l.el.style.display = visible ? '' : 'none'
      if (visible) l.el.style.transform = `translate(${((this.v.x + 1) / 2) * w}px, ${((1 - this.v.y) / 2) * h}px) translate(-50%, -100%)`
    }
  }

  private renderPip() {
    const slot = this.pipSlot
    if (!slot || this.mode !== 'ops') return
    const r = slot.getBoundingClientRect()
    if (r.width < 10 || r.height < 10) return
    const id = useSim.getState().pipDrone
    const dv = this.droneVis[id - 1]
    const cam = dv.camera
    cam.aspect = r.width / r.height
    cam.updateProjectionMatrix()
    const H = window.innerHeight
    this.renderer.setScissorTest(true)
    this.renderer.setViewport(r.left, H - r.bottom, r.width, r.height)
    this.renderer.setScissor(r.left, H - r.bottom, r.width, r.height)
    dv.setVisible(false)
    this.renderer.render(this.scene, cam)
    dv.setVisible(true)
    this.renderer.setScissorTest(false)
    this.renderer.setViewport(0, 0, window.innerWidth, H)

    // tespit kutuları
    const dets = useSim.getState().detections
    let n = 0
    for (const d of dets) {
      this.v.set(d.x, 0.1, d.z).project(cam)
      if (this.v.z > 1 || Math.abs(this.v.x) > 1 || Math.abs(this.v.y) > 1) continue
      let box = this.pipBoxes[n]
      if (!box) {
        box = document.createElement('div')
        box.className = 'pip-box'
        slot.appendChild(box)
        this.pipBoxes.push(box)
      }
      const alt = Math.max(1, this.mission.drones[id - 1].pos.y)
      const px = (r.height / (2 * alt * Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)))) * 1.4 // ≈1,4 m kutu
      const size = Math.max(16, px)
      box.style.display = ''
      box.style.width = `${size}px`
      box.style.height = `${size}px`
      box.style.transform = `translate(${((this.v.x + 1) / 2) * r.width - size / 2}px, ${((1 - this.v.y) / 2) * r.height - size / 2}px)`
      box.dataset.status = d.status
      box.dataset.label = `${d.label} ${d.conf.toFixed(2).replace('.', ',')}`
      n++
    }
    for (let i = n; i < this.pipBoxes.length; i++) this.pipBoxes[i].style.display = 'none'
  }

  private captureThumb(x: number, z: number) {
    const cam = this.zoomCam
    cam.position.set(x, 6.5, z)
    cam.up.set(1, 0, 0)
    cam.lookAt(x, 0, z)
    cam.updateProjectionMatrix()
    this.droneVis.forEach((d) => d.setVisible(false))
    this.renderer.setRenderTarget(this.thumbRT)
    this.renderer.render(this.scene, cam)
    this.renderer.setRenderTarget(null)
    this.droneVis.forEach((d) => d.setVisible(true))
    const W = 320
    const Hh = 240
    const px = new Uint8Array(W * Hh * 4)
    this.renderer.readRenderTargetPixels(this.thumbRT, 0, 0, W, Hh, px)
    const c = document.createElement('canvas')
    c.width = W
    c.height = Hh
    const g = c.getContext('2d')!
    const img = g.createImageData(W, Hh)
    for (let row = 0; row < Hh; row++) img.data.set(px.subarray((Hh - 1 - row) * W * 4, (Hh - row) * W * 4), row * W * 4)
    g.putImageData(img, 0, 0)
    g.strokeStyle = '#ffb020'
    g.lineWidth = 3
    g.strokeRect(W / 2 - 46, Hh / 2 - 46, 92, 92)
    return c.toDataURL('image/jpeg', 0.82)
  }

  /* ---------- Fare: piste nesne bırakma ---------- */

  private onPointerUp(e: PointerEvent) {
    const down = this.pointerDown
    this.pointerDown = null
    const s = useSim.getState()
    if (this.mode === 'explore') {
      if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6) return
      const ndc = new THREE.Vector2((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1)
      this.select(this.pickAt(ndc))
      return
    }
    if (this.mode !== 'ops' || !s.placing || !down) return
    if (Math.hypot(e.clientX - down.x, e.clientY - down.y) > 5) return
    const ndc = new THREE.Vector2((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1)
    const ray = new THREE.Raycaster()
    ray.setFromCamera(ndc, this.camera)
    const hit = new THREE.Vector3()
    if (!ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), hit)) return
    if (Math.abs(hit.x) > RWY.half - 20 || Math.abs(hit.z) > SCAN_HALF_WIDTH - 1) {
      this.log('info', 'Nesne yalnızca pist ve omuzların üzerine bırakılabilir (60 m tarama genişliği).')
      return
    }
    const cls: FodClass = s.placeType
    this.fod.add(cls, hit.x, hit.z)
    s.set({ fodCount: this.fod.items.length })
    this.log('info', `Piste ${FOD_LABEL[cls].toLowerCase()} bırakıldı: ${describePosition(hit.x, hit.z)}`)
  }

  /* ---------- Kamera ---------- */

  private placeCamera(mode: CameraMode, instant: boolean) {
    this.camFromPos.copy(this.camera.position)
    this.camFromTarget.copy(this.controls.target)
    this.camBlend = instant ? 1 : 0
    if (mode === 'overview') {
      // 04 ucunun arkasından çapraz bakış: pist uzunluğu perspektifle kısalır, iki istasyon da kadrajda
      this.camPos.set(-1780, 330, 640)
      this.camTarget.set(-330, 0, -40)
      if (instant) {
        this.camera.position.copy(this.camPos)
        this.controls.target.copy(this.camTarget)
      }
    }
  }

  /** Sinematik drone takibi: drone yakın planda; missions istasyonunda daha geniş kadraj. */
  private followCam(dt: number, pos: THREE.Vector3, look: THREE.Vector3) {
    const d = this.mission.drones[0]
    const t = this.realT
    const wide = this.station === 'missions'
    const th = 0.9 + Math.sin(t * 0.05) * 0.35
    const fx = Math.cos(d.yaw)
    const fz = Math.sin(d.yaw)
    const back = new THREE.Vector3(-fx, 0, -fz)
    const side = new THREE.Vector3(fz, 0, -fx) // pistin sol omzu tarafı: kamera pisti enlemesine görür
    const dist = wide ? 34 : 11
    const want = new THREE.Vector3()
      .addScaledVector(back, Math.cos(th) * dist)
      .addScaledVector(side, Math.sin(th) * dist)
      .add(new THREE.Vector3(0, wide ? 13 : 4.2, 0))
    // ofset drone'a göre yumuşatılır; konum doğrudan drone'a bağlı olduğu için kamera geride kalmaz
    this.heroOffset.lerp(want, Math.min(1, dt * 1.2))
    pos.copy(d.pos).add(this.heroOffset)
    pos.y = Math.max(6, pos.y)
    look.copy(d.pos).add(new THREE.Vector3(0, wide ? -4 : -2.2, 0))
  }

  private updateCamera(dt: number) {
    const s = useSim.getState()
    if (this.mode === 'explore') {
      this.fly.update(dt)
      return
    }
    if (this.mode === 'hero' || this.mode === 'scene') {
      const want = new THREE.Vector3()
      const look = new THREE.Vector3()
      const pose = this.mode === 'scene' ? this.director.pose(this.realT) : null
      if (pose) {
        want.copy(pose.pos)
        look.copy(pose.look)
      } else if (this.station === 'hero' || this.station === 'missions') this.followCam(dt, want, look)
      else {
        const o = ORBITS[this.station]
        const a = o.a + (this.reducedMotion ? 0 : (this.realT - this.stationStart) * o.w)
        look.copy(o.target())
        want.set(look.x + Math.cos(a) * o.r, o.h, look.z + Math.sin(a) * o.r)
      }
      if (this.camBlend < 1) {
        this.camBlend = Math.min(1, this.camBlend + dt / 1.6)
        const k = this.camBlend < 0.5 ? 4 * this.camBlend ** 3 : 1 - Math.pow(-2 * this.camBlend + 2, 3) / 2
        const span = this.camFromPos.distanceTo(want)
        want.lerpVectors(this.camFromPos, want, k)
        want.y += Math.sin(k * Math.PI) * Math.min(260, span * 0.2) // uzun geçişlerde yay çizerek uçar
        look.lerpVectors(this.camFromTarget, look, k)
      }
      this.camera.position.copy(want)
      this.look.copy(look)
      this.camera.lookAt(look)
      return
    }
    const mode = s.cameraMode
    if (mode === 'overview') {
      if (this.camBlend < 1) {
        this.camBlend = Math.min(1, this.camBlend + dt / 1.2)
        const k = 1 - Math.pow(1 - this.camBlend, 3)
        this.camera.position.lerpVectors(this.camFromPos, this.camPos, k)
        this.controls.target.lerpVectors(this.camFromTarget, this.camTarget, k)
      }
      this.controls.update()
      return
    }
    let pos: THREE.Vector3
    let look: THREE.Vector3
    if (mode === 'tower') {
      pos = new THREE.Vector3(LAYOUT.tower.x, 29, LAYOUT.tower.z + 6)
      const active = this.mission.drones.find((d) => d.airborne) ?? this.mission.drones[0]
      look = active.pos.clone()
      this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, 30, Math.min(1, dt * 2))
    } else {
      const d = this.mission.drones[mode === 'follow1' ? 0 : 1]
      const fx = Math.cos(d.yaw)
      const fz = Math.sin(d.yaw)
      pos = d.pos.clone().add(new THREE.Vector3(-fx * 22 - fz * 9, 9, -fz * 22 + fx * 9))
      pos.y = Math.max(4, pos.y)
      look = d.pos.clone().add(new THREE.Vector3(fx * 12, -3, fz * 12))
      this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, 45, Math.min(1, dt * 2))
    }
    this.camera.updateProjectionMatrix()
    this.camera.position.lerp(pos, Math.min(1, dt * 3))
    this.controls.target.lerp(look, Math.min(1, dt * 4))
    this.camera.lookAt(this.controls.target)
  }

  /* ---------- Döngü ---------- */

  private loop = (now: number) => {
    if (!this.running) return
    cancelAnimationFrame(this.raf)
    this.raf = requestAnimationFrame(this.loop)
    // içerik sayfalarında sahne cam panellerin arkasında: ≈30 fps yeterli (pil ve işlemci tasarrufu)
    if (this.mode === 'hero' && this.station !== 'hero' && now - this.lastDraw < 30) return
    this.lastDraw = now
    this.frame(now)
  }

  /** Bir kare: simülasyonu ilerletir ve çizer. Testlerde doğrudan çağrılabilir. */
  frame(now: number) {
    const dtReal = Math.max(0, Math.min(0.1, (now - this.last) / 1000))
    this.last = now
    this.realT += dtReal
    const s = useSim.getState()
    const cinematic = this.mode !== 'ops'
    const speed = this.mode === 'scene' ? (s.paused ? 0 : (this.director.def?.rate ?? 1)) : cinematic ? 6 : s.paused ? 0 : s.speed
    const dtSim = dtReal * speed

    // görev adımları: sabit alt adımlar
    const day = this.day
    const live = cinematic || !!day || ['flight', 'return', 'verify', 'report'].includes(s.phase)
    if (live && dtSim > 0 && !(day && day.finished)) {
      let left = dtSim
      let c = s.clock
      while (left > 0) {
        const step = Math.min(0.1, left)
        c += step
        this.simClock = c
        this.mission.update(step)
        if (day) day.update(c, this.realT)
        left -= step
      }
      this.simClock = null
      const patch: Partial<ReturnType<typeof useSim.getState>> = { clock: c }
      if (day) {
        // rüzgâr planlayıcıdaki saatlik tahminden (rüzgâr tulumu ve türbin buna göre döner)
        const w = usePlanner.getState().wind
        const h = Math.min(23, Math.floor(c / 3600))
        const f = c / 3600 - h
        patch.wind = Math.round(((w[h] ?? 0) * (1 - f) + (w[Math.min(23, h + 1)] ?? 0) * f) * 10) / 10
      }
      s.set(patch)
    }
    if (day) day.fleet.update(useSim.getState().clock)
    if (this.mode === 'ops' && s.phase === 'awaiting' && this.realT - this.lastSync > 0.05) s.set({ checks: this.computeChecks() })

    // rapor üretimi
    if (this.reportTimer && this.mode === 'ops' && !this.day) {
      this.reportTimer.t += dtSim
      if (this.reportTimer.t >= this.reportTimer.target) {
        const st = useSim.getState()
        const generatedIn = this.reportTimer.target
        this.reportTimer = null
        this.mission.phase = 'done'
        st.set({
          phase: 'done',
          reportOpen: true,
          report: {
            id: st.missionId,
            createdAt: st.clock,
            startedAt: st.startedAt ?? st.clock,
            dockedAt: (st.startedAt ?? 0) + ((this.mission.dockedAt ?? 0) - (this.mission.scanStart ?? 0)),
            generatedIn,
            coverage: this.mission.coverage(),
            detections: st.detections,
          },
        })
        const found = st.detections.filter((d) => d.status !== 'rejected').length
        this.log(
          'ok',
          found
            ? `Pist tarama raporu kuleye iletildi: ${found} nesne (${Math.round(generatedIn)} sn). Karar kule ve saha ekibinde.`
            : `Temiz pist raporu kuleye iletildi (${Math.round(generatedIn)} sn). Karar kule ve saha ekibinde.`,
        )
      }
    }

    // kahraman (hero) döngüsü: görev bitince yeniden başla
    if ((this.mode === 'hero' || this.mode === 'explore') && this.heroWait > 0) {
      this.heroWait += dtReal
      if (this.heroWait > 3) this.enterHero()
    }

    // helikopter (ADS-B senaryosu)
    const hs = this.heliState
    if (hs.active) {
      hs.t += dtSim
      hs.pos.addScaledVector(hs.vel, dtSim)
      this.heli.group.position.copy(hs.pos)
      this.heli.group.rotation.y = -Math.atan2(hs.vel.z, hs.vel.x)
      this.heli.rotor.rotation.y += dtReal * 25
      this.heli.tail.rotation.z += dtReal * 40
      if (hs.t > 140) {
        hs.active = false
        this.heli.group.visible = false
        this.log('info', 'ADS-B: hava aracı bölgeden ayrıldı')
      }
    }

    // görseller
    const focus =
      this.mode === 'ops' && s.cameraMode === 'overview'
        ? this.controls.target.clone()
        : this.mode === 'explore'
          ? this.exploreFocus()
          : this.mode === 'scene' && this.director.def
            ? new THREE.Vector3(...this.director.def.focus)
          : this.mode === 'hero' && this.station !== 'hero' && this.station !== 'missions'
            ? this.look.clone()
            : this.mission.drones[0].pos.clone()
    focus.y = 0
    this.sky.update(s.clock, focus, this.renderer, this.pmrem)
    const night = this.sky.night
    this.airfield.update(night, s.wind, s.windDir, this.realT)
    this.energy.update(dtReal, s.wind)
    this.stations.forEach((st) => st.update(live ? dtSim : dtReal, s.wind))
    this.peteks.forEach((p) => p.update(dtReal))
    this.fod.update(dtReal)
    this.geofence.update(this.realT)
    this.mission.all.forEach((d, i) => {
      const rotors = d.mode !== 'docked' && d.mode !== 'lid' && d.mode !== 'down'
      this.droneVis[i].update(d.pos, d.yaw, d.speed, rotors, d.mode === 'scan' && this.mission.phase === 'flight', dtReal, night)
      if (d.caste === 'scout' && (this.mission.task === 'fod' || this.mission.task === 'opening')) d.passProgress.forEach((p, k) => this.strips[i].set(k, p))
    })
    // işçi: asılı kalınca vinç iner, nesneyi alınca kısa kabloyla taşır
    const w = this.mission.worker
    const hovering = w.mode === 'pickup' && w.speed < 0.3 && w.pos.y < 6
    // kablo başlığın altından (≈1,2 m, gövde ölçeğiyle) yere kadar
    this.droneVis[3].setWinch(hovering && !w.carrying ? w.pos.y - 1.55 : 0, !!w.carrying, live ? dtSim : dtReal)
    // bekçi: devriye boyunca feromon izi
    const g = this.mission.guard
    if (g.mode === 'patrol' && g.pos.distanceTo(this.trailFrom) > 70) {
      this.pheromone.trail(g.pos.x, g.pos.z)
      this.trailFrom.copy(g.pos)
    }
    this.pheromone.update(dtReal, this.realT, (id) => this.fod.items.some((it) => it.id === id))
    this.updateGnss(live ? dtSim : dtReal, dtReal)
    if (this.mode === 'scene') {
      this.director.update(dtSim, this.realT)
      if (this.realT - this.lastSceneSync > 0.2) {
        this.lastSceneSync = this.realT
        const t = this.director.run?.t ?? 0
        if (Math.abs(t - (s.sceneT ?? 0)) > 0.05) s.set({ sceneT: t })
      }
    }
    this.hazards.children.forEach((r) => r.scale.setScalar(1 + Math.sin(this.realT * 5) * 0.15))

    this.updateCamera(dtReal)
    if (this.mode === 'hero') {
      const W = window.innerWidth
      const H = window.innerHeight
      // geniş ekranda nesne sağa (başlık solda), dar ekranda yukarı (başlık altta) kaydırılır
      const k = this.station === 'hero' ? 1 : 0.75
      if (W > 900) this.camera.setViewOffset(W, H, -W * 0.2 * k, H * 0.04, W, H)
      else this.camera.setViewOffset(W, H, 0, H * 0.3 * k, W, H)
    } else if (this.camera.view?.enabled) this.camera.clearViewOffset()

    if (this.mode === 'explore') {
      this.updatePick()
      this.annex.update(this.camera.position)
    }

    this.renderer.shadowMap.needsUpdate = true
    if (this.post) {
      this.post.setNight(night)
      this.post.render(dtReal)
    } else this.renderer.render(this.scene, this.camera)
    this.renderPip()
    this.updateLabels()

    if (this.realT - this.lastSync > 0.1) this.sync()
  }

  /** Keşif modunda gölge ve gökyüzü odağı: kameranın biraz önü */
  private exploreFocus() {
    const d = new THREE.Vector3()
    this.camera.getWorldDirection(d)
    d.y = 0
    if (d.lengthSq() < 1e-6) d.set(1, 0, 0)
    d.normalize()
    return this.camera.position.clone().addScaledVector(d, Math.min(160, 20 + this.camera.position.y * 1.5))
  }

  /** Geliştirme: n kare ilerlet (gizli sekmede requestAnimationFrame çalışmaz). */
  debugStep(n: number, ms = 33) {
    let now = this.last
    for (let i = 0; i < n; i++) {
      now += ms
      this.frame(now)
    }
    this.last = performance.now()
  }

  private sync(force = false) {
    if (this.mode !== 'ops' && !force) return
    this.lastSync = this.realT
    useSim.getState().set({
      drones: this.mission.drones.map((d) => ({
        id: d.id as 1 | 2,
        mode: d.mode,
        battery: d.battery,
        alt: d.airborne ? d.pos.y : 0,
        speed: d.speed,
        x: d.pos.x,
        z: d.pos.z,
        pass: d.pass,
        coverage: (d.passProgress.reduce((a, b) => a + b, 0) / 3) * 100,
      })),
      fodCount: this.fod.items.length,
    })
  }
}

let instance: Engine | null = null
export function getEngine() {
  return instance
}
export function createEngine(canvas: HTMLCanvasElement) {
  if (!instance) {
    instance = new Engine(canvas)
    if (import.meta.env.DEV) (window as unknown as { __engine: Engine }).__engine = instance
  }
  return instance
}
