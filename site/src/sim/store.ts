import { create } from 'zustand'

/*
  Simülasyonun paylaşılan durumu. 3D motor (sim/engine.ts) yazar, React arayüzü okur.
  Telemetri motor tarafından saniyede birkaç kez topluca güncellenir; olaylar anında eklenir.
*/

export type Phase =
  | 'idle' // planlandı, kule onayı istenmedi
  | 'awaiting' // kule onayı bekleniyor
  | 'preflight' // ön kontroller
  | 'blocked' // ön kontrol başarısız, görev başlamadı
  | 'flight' // drone'lar havada (kalkış, transit, tarama)
  | 'return' // görev kesildi, eve dönüş
  | 'verify' // iki drone'un istasyonda olduğu doğrulanıyor
  | 'report' // rapor hazırlanıyor
  | 'done' // rapor kuleye iletildi
  | 'aborted' // görev kesildi, rapor üretilmedi

export type DroneMode =
  | 'docked'
  | 'lid'
  | 'takeoff'
  | 'transit'
  | 'scan'
  | 'rth'
  | 'landing'
  | 'emergency'
  | 'down'
  | 'patrol'

export type DroneTelemetry = {
  id: 1 | 2
  mode: DroneMode
  battery: number
  alt: number
  speed: number
  x: number
  z: number
  pass: number
  coverage: number
}

export type FodClass = 'bolt' | 'stone' | 'plastic' | 'tire'

export type Detection = {
  id: number
  cls: FodClass | 'artifact'
  label: string
  conf: number
  x: number
  z: number
  drone: 1 | 2
  t: number
  status: 'pending' | 'confirmed' | 'rejected'
  thumb?: string
}

export type LogKind = 'info' | 'ok' | 'warn' | 'alert' | 'tower'
export type LogEntry = { id: number; t: number; kind: LogKind; text: string }

export type Report = {
  id: string
  createdAt: number
  startedAt: number
  dockedAt: number
  generatedIn: number
  coverage: number
  detections: Detection[]
}

export type Fault = 'adsb' | 'link' | 'geofence' | 'recall'
export type CameraMode = 'overview' | 'follow1' | 'follow2' | 'tower'
export type Quality = 'low' | 'medium' | 'high'

export type Check = { id: string; label: string; value: string; ok: boolean | null }

type State = {
  opsOpen: boolean
  cameraMode: CameraMode
  pipDrone: 1 | 2
  placing: boolean
  placeType: FodClass
  speed: number
  quality: Quality
  paused: boolean

  clock: number // günün saniyesi (simülasyon saati)
  wind: number
  windDir: number

  phase: Phase
  missionId: string
  startedAt: number | null
  checks: Check[]
  drones: DroneTelemetry[]
  detections: Detection[]
  log: LogEntry[]
  report: Report | null
  reportOpen: boolean
  abortReason: string | null
  fodCount: number
  geofenceAlert: boolean
  dayMode: boolean
  dayDone: boolean
  dayTask: string | null
}

type Actions = {
  set: (p: Partial<State>) => void
  pushLog: (kind: LogKind, text: string, t?: number) => void
  setDetection: (id: number, patch: Partial<Detection>) => void
}

let logSeq = 0

const initialDrones: DroneTelemetry[] = [
  { id: 1, mode: 'docked', battery: 96, alt: 0, speed: 0, x: 0, z: 0, pass: 0, coverage: 0 },
  { id: 2, mode: 'docked', battery: 94, alt: 0, speed: 0, x: 0, z: 0, pass: 0, coverage: 0 },
]

export const useSim = create<State & Actions>((set, get) => ({
  opsOpen: false,
  cameraMode: 'overview',
  pipDrone: 1,
  placing: false,
  placeType: 'bolt',
  speed: 16,
  quality: 'high',
  paused: false,

  clock: 8 * 3600 + 37 * 60,
  wind: 5.2,
  windDir: 220,

  phase: 'idle',
  missionId: 'FOD-0837',
  startedAt: null,
  checks: [],
  drones: initialDrones,
  detections: [],
  log: [],
  report: null,
  reportOpen: false,
  abortReason: null,
  fodCount: 0,
  geofenceAlert: false,
  dayMode: false,
  dayDone: false,
  dayTask: null,

  set: (p) => set(p),
  pushLog: (kind, text, t) =>
    set((s) => ({ log: [...s.log.slice(-120), { id: ++logSeq, t: t ?? get().clock, kind, text }] })),
  setDetection: (id, patch) =>
    set((s) => ({ detections: s.detections.map((d) => (d.id === id ? { ...d, ...patch } : d)) })),
}))

export const initialDroneTelemetry = initialDrones

/** Simülasyon saatini SS:DD:ss biçiminde yazar. */
export function fmtClock(sec: number, withSeconds = false) {
  const s = Math.max(0, Math.floor(sec)) % 86400
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const ss = s % 60
  const base = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  return withSeconds ? `${base}:${String(ss).padStart(2, '0')}` : base
}

/** Süreyi "12 dk 24 sn" biçiminde yazar. */
export function fmtDuration(sec: number) {
  const s = Math.max(0, Math.round(sec))
  const m = Math.floor(s / 60)
  const r = s % 60
  if (m === 0) return `${r} sn`
  return r === 0 ? `${m} dk` : `${m} dk ${r} sn`
}
