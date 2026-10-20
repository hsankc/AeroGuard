import { sunTimes } from '../sim/solar'

/*
  Tarifeye duyarlı görev planlayıcı (arayüzden bağımsız, saf hesap).

  Kurallar (Genişletilmiş Proje Raporu, Bölüm 6 ve 10):
  - Her ticari hareketten önce FOD taraması: hareketten 18 dk önce başlar, ≈12,4 dk sürer,
    drone'lar hareketten en az 5 dk önce istasyonda olur.
  - Hareketin çevresi [−5 dk, +5 dk] pist kullanımda sayılır; bu aralıkta hiçbir drone uçmaz.
  - Açılış taraması 06:00, yaban hayatı devriyesi şafakta ve gün batımında,
    çit devriyesi günde 2 kez, pist sağlığı taraması (haftada 1) gün ışığındaki en uygun boşlukta.
  - Rüzgâr 8 m/s'yi aşan saatte görev yapılmaz; denetim bugünkü gibi araçla yapılır.
  - Şarj: istasyonda %20 → %90, 32 dakikada. Her görev sonunda en az %20 batarya kalmalı.

  Kovan (V3): görevler kastlara atanır. Tarama, açılış ve pist sağlığı kâşiflerin (2 drone), çit ve yaban hayatı
  bekçinin (1 drone). Farklı kastlar aynı anda uçabilir; pist kullanım bandı her kast için geçerlidir.
  Mini kovanda (v2) bekçi yoktur: bütün görevleri iki kâşif sırayla uçar.
*/

export const MIN = 60
export const DAY_START = 5 * 3600
export const DAY_END = 24 * 3600
export const LEAD = 18 * MIN
export const BUFFER = 5 * MIN
export const RUNWAY_AFTER = 5 * MIN
export const WIND_LIMIT = 8
export const CHARGE_PER_MIN = 70 / 32 // % / dk
export const RESERVE = 20

export type MoveKind = 'arr' | 'dep'
export type Movement = { id: string; kind: MoveKind; planned: number; delay: number; label: string }
export type TaskType = 'opening' | 'fod' | 'wildlife' | 'health' | 'fence'
export type HiveMode = 'mini' | 'ckz'
export type Caste = 'scout' | 'guard'
export type TaskStatus = 'ok' | 'wind' | 'nowindow' | 'battery'
export type Task = {
  id: string
  type: TaskType
  start: number
  end: number
  status: TaskStatus
  reason?: string
  movementId?: string
  label: string
  /** görevi uçan kast */
  caste: Caste
}
export type Block = { start: number; end: number; movementId: string }
export type BatteryPoint = [number, number]

export const TASK_SPEC: Record<TaskType, { duration: number; battery: number; energyKwh: number; name: string }> = {
  // süre: kalkış, transit, görev ve iniş dahil
  opening: { duration: 745, battery: 28, energyKwh: 0.04, name: 'Açılış taraması' },
  fod: { duration: 745, battery: 28, energyKwh: 0.04, name: 'FOD taraması' },
  wildlife: { duration: 10 * MIN, battery: 22, energyKwh: 0.03, name: 'Yaban hayatı devriyesi' },
  // 10 m irtifa: 14 m iz, 11,2 m şerit aralığı → drone başına 6 geçiş, 4 m/s (≈1,7 mm/piksel)
  health: { duration: 32 * MIN, battery: 72, energyKwh: 0.09, name: 'Pist sağlığı taraması' },
  // çevre çiti boyunca, her drone çitin yarısı (≈3,8 km), 10 m/s
  fence: { duration: 12 * MIN, battery: 30, energyKwh: 0.05, name: 'Çit devriyesi' },
}

/** Kovanda görevin kastı */
export const TASK_CASTE: Record<TaskType, Caste> = { opening: 'scout', fod: 'scout', health: 'scout', fence: 'guard', wildlife: 'guard' }
export const CASTE_NAME: Record<Caste, string> = { scout: 'kâşif', guard: 'bekçi' }
export const CASTE_DRONES: Record<Caste, number> = { scout: 2, guard: 1 }

/*
  Bekçi görevleri tek drone'la: çitin tamamı (≈7,4 km, 10 m/s) ve pistin iki yanı birlikte (≈5 km, 8 m/s).
  Süre kalkış, transit, iniş ve kapak dahil (tasarım tahmini).
*/
const GUARD_SPEC: Partial<Record<TaskType, { duration: number; battery: number; energyKwh: number }>> = {
  fence: { duration: 15 * MIN, battery: 36, energyKwh: 0.05 },
  wildlife: { duration: 13 * MIN, battery: 30, energyKwh: 0.04 },
}

export function casteOf(type: TaskType, hive: HiveMode): Caste {
  return hive === 'ckz' ? TASK_CASTE[type] : 'scout'
}

/** Görevin süre, batarya ve enerji değerleri (kovan boyuna göre) */
export function specFor(type: TaskType, hive: HiveMode) {
  const g = hive === 'ckz' ? GUARD_SPEC[type] : undefined
  return g ? { ...TASK_SPEC[type], ...g } : TASK_SPEC[type]
}

export const CKZ_SCHEDULE: Movement[] = [
  { id: 'm1', kind: 'arr', planned: 8 * 3600 + 10 * MIN, delay: 0, label: 'Ankara gelişi' },
  { id: 'm2', kind: 'dep', planned: 8 * 3600 + 55 * MIN, delay: 0, label: 'Ankara kalkışı' },
  { id: 'm3', kind: 'arr', planned: 19 * 3600 + 40 * MIN, delay: 0, label: 'Ankara gelişi' },
  { id: 'm4', kind: 'dep', planned: 20 * 3600 + 25 * MIN, delay: 0, label: 'Ankara kalkışı' },
]

/**
  Sabiha Gökçen, Ocak–Temmuz 2026: 28 milyon yolcu ÷ 212 gün ÷ ≈150 yolcu/hareket ≈ 880 hareket/gün.
  (Çanakkale için kullanılan yöntemin aynısı.) Havalimanı 24 saat açık; çizelgenin gösterdiği
  05:00–24:00 aralığına düşen pay eşit aralıklarla yayılır.
*/
export const SAW_DAILY = 880
export function sawSchedule(): Movement[] {
  const out: Movement[] = []
  const span = DAY_END - DAY_START
  let seed = 7
  const rnd = () => {
    seed = (seed * 16807) % 2147483647
    return seed / 2147483647
  }
  // i = −1: gece yarısından beri süren trafiğin çizelgeden hemen önceki hareketi
  for (let i = -1; i < SAW_DAILY; i++) {
    const t = DAY_START + (i + 0.5) * (span / SAW_DAILY) + (rnd() - 0.5) * 30
    out.push({ id: `s${i + 1}`, kind: i % 2 ? 'dep' : 'arr', planned: Math.round(t), delay: 0, label: i % 2 ? 'Kalkış' : 'Geliş' })
  }
  return out
}

export const actual = (m: Movement) => m.planned + m.delay

export type PlanInput = { movements: Movement[]; wind: number[]; dayOfYear: number; healthDay: boolean; hive?: HiveMode }

export type PlanResult = {
  tasks: Task[]
  blocks: Block[]
  /** kast başına batarya eğrisi (aynı kasttaki drone'lar aynı görevleri uçar) */
  battery: Partial<Record<Caste, BatteryPoint[]>>
  hive: HiveMode
  sunrise: number
  sunset: number
  stats: {
    planned: number
    done: number
    completion: number
    sorties: number
    energyKwh: number
    vehicle: number
    fodPlanned: number
    fodDone: number
    /** drone başına sorti, kast kast */
    byCaste: Partial<Record<Caste, number>>
  }
}

const overlaps = (a0: number, a1: number, b0: number, b1: number) => a0 < b1 && b0 < a1
function maxWind(wind: number[], s: number, e: number) {
  let m = 0
  for (let h = Math.floor(s / 3600); h <= Math.floor((e - 1) / 3600); h++) m = Math.max(m, wind[Math.min(23, h)] ?? 0)
  return m
}

/** Batarya benzetimi (kast başına): başarısız görev varsa null, yoksa her kast için (zaman, %) noktaları. */
export function simulateBattery(tasks: Task[], hive: HiveMode = 'ckz'): Partial<Record<Caste, BatteryPoint[]>> | null {
  const castes: Caste[] = hive === 'ckz' ? ['scout', 'guard'] : ['scout']
  const series: Partial<Record<Caste, BatteryPoint[]>> = {}
  for (const c of castes) {
    const flown = tasks.filter((t) => t.status === 'ok' && t.caste === c).sort((a, b) => a.start - b.start)
    const pts: BatteryPoint[] = [[DAY_START, 100]]
    let level = 100
    let t = DAY_START
    for (const task of flown) {
      level = Math.min(100, level + (CHARGE_PER_MIN * (task.start - t)) / MIN)
      pts.push([task.start, level])
      const cons = specFor(task.type, hive).battery
      if (level - cons < RESERVE - 1e-6) return null
      level -= cons
      t = task.end
      pts.push([task.end, level])
    }
    pts.push([DAY_END, Math.min(100, level + (CHARGE_PER_MIN * (DAY_END - t)) / MIN)])
    series[c] = pts
  }
  return series
}

export function planDay(input: PlanInput): PlanResult {
  const { sunrise, sunset } = sunTimes(input.dayOfYear)
  const moves = [...input.movements].sort((a, b) => actual(a) - actual(b))
  const blocks: Block[] = moves.map((m) => ({ start: actual(m) - BUFFER, end: actual(m) + RUNWAY_AFTER, movementId: m.id }))
  const tasks: Task[] = []
  const busy = moves.length > 60
  const hive = input.hive ?? 'ckz'

  // pist bandı her kast için; görev çakışması yalnızca aynı kastın drone'ları arasında
  const free = (s: number, e: number, caste: Caste, margin = 2 * MIN) => {
    if (s < DAY_START || e > DAY_END) return false
    for (const b of blocks) if (overlaps(s - margin, e + margin, b.start, b.end)) return false
    for (const t of tasks) if (t.caste === caste && overlaps(s - margin, e + margin, t.start, t.end)) return false
    return true
  }

  // 1) Her hareketten önce FOD taraması (sabit zamanlı)
  const fodDur = TASK_SPEC.fod.duration
  moves.forEach((m, i) => {
    const T = actual(m)
    if (T < DAY_START) return // çizelgeden önceki hareket: yalnızca pist bloğu olarak sayılır
    let start = T - LEAD
    const prev = moves[i - 1]
    if (prev && start < actual(prev) + RUNWAY_AFTER + MIN) start = actual(prev) + RUNWAY_AFTER + MIN
    const end = start + fodDur
    const kind = m.kind === 'arr' ? 'gelişi' : 'kalkışı'
    const label = `${fmt(T)} ${kind} öncesi`
    if (end > T - BUFFER + 1) {
      const gap = prev ? Math.max(0, Math.round((T - actual(prev)) / MIN)) : 0
      tasks.push({
        id: `fod-${m.id}`,
        type: 'fod',
        start: T - LEAD,
        end: T - LEAD + fodDur,
        status: 'nowindow',
        movementId: m.id,
        label,
        caste: 'scout',
        reason: `Önceki hareketten yalnızca ${gap} dk sonra; tarama için ≈18 dk gerekir. Pist araçla denetlenir.`,
      })
      return
    }
    const w = maxWind(input.wind, start, end)
    tasks.push({
      id: `fod-${m.id}`,
      type: 'fod',
      start,
      end,
      status: w > WIND_LIMIT ? 'wind' : 'ok',
      movementId: m.id,
      label,
      caste: 'scout',
      reason: w > WIND_LIMIT ? `Rüzgâr ${w.toFixed(1).replace('.', ',')} m/s, sınır 8 m/s. Pist araçla denetlenir.` : undefined,
    })
  })

  // 2) Esnek görevler: tercih edilen saate en yakın uygun boşluk
  const place = (
    type: TaskType,
    id: string,
    preferred: number,
    label: string,
    range: number,
    window?: [number, number],
  ) => {
    const dur = specFor(type, hive).duration
    const caste = casteOf(type, hive)
    const step = 5 * MIN
    let windyFallback: number | null = null
    for (let k = 0; k <= range / step; k++) {
      for (const sign of k === 0 ? [1] : [1, -1]) {
        const s = Math.round((preferred + sign * k * step) / MIN) * MIN
        const e = s + dur
        if (window && (s < window[0] || e > window[1])) continue
        if (!free(s, e, caste)) continue
        if (maxWind(input.wind, s, e) > WIND_LIMIT) {
          windyFallback ??= s
          continue
        }
        const candidate: Task = { id, type, start: s, end: e, status: 'ok', label, caste }
        if (!simulateBattery([...tasks, candidate], hive)) continue
        tasks.push(candidate)
        return
      }
    }
    if (windyFallback !== null) {
      const w = maxWind(input.wind, windyFallback, windyFallback + dur)
      tasks.push({
        id,
        type,
        start: windyFallback,
        end: windyFallback + dur,
        status: 'wind',
        label,
        caste,
        reason: `Uygun her boşlukta rüzgâr 8 m/s üzerinde (${w.toFixed(1).replace('.', ',')} m/s).`,
      })
      return
    }
    tasks.push({
      id,
      type,
      start: preferred,
      end: preferred + dur,
      status: busy ? 'nowindow' : 'battery',
      label,
      caste,
      reason: busy ? 'Hareketler arasında yeterli boşluk yok.' : 'Uygun boşluk veya yeterli şarj bulunamadı.',
    })
  }

  place('opening', 'opening', 6 * 3600, 'Pist açılışı', 60 * MIN)
  place('wildlife', 'wild-dawn', sunrise - 15 * MIN, 'Şafak', 60 * MIN)
  place('wildlife', 'wild-dusk', sunset - 5 * MIN, 'Gün batımı', 60 * MIN)
  if (input.healthDay) {
    // gün ışığındaki en uzun uçuşsuz boşluğun ortası
    const day0 = sunrise + 30 * MIN
    const day1 = sunset - 30 * MIN
    const marks = [day0, ...blocks.flatMap((b) => [b.start, b.end]).filter((t) => t > day0 && t < day1), day1].sort((a, b) => a - b)
    let best = (day0 + day1) / 2
    let bestLen = 0
    for (let i = 0; i < marks.length - 1; i++) {
      const len = marks[i + 1] - marks[i]
      if (len > bestLen) {
        bestLen = len
        best = (marks[i] + marks[i + 1]) / 2
      }
    }
    place('health', 'health', best - TASK_SPEC.health.duration / 2, 'Haftalık, 10 m irtifa', 4 * 3600, [day0, day1])
  }
  place('fence', 'fence-am', 10 * 3600 + 30 * MIN, 'Sabah', 3 * 3600)
  place('fence', 'fence-pm', 22 * 3600 + 30 * MIN, 'Gece', 3 * 3600)

  // Şarj yetmeyen sabit görevler (nadiren)
  let battery = simulateBattery(tasks, hive)
  if (!battery) {
    for (const t of tasks.filter((x) => x.status === 'ok').sort((a, b) => a.start - b.start)) {
      const flown = tasks.filter((x) => x.status === 'ok' && x.start <= t.start)
      if (!simulateBattery(flown, hive)) {
        t.status = 'battery'
        t.reason = 'Önceki görevden sonra yeterli şarj yok.'
      }
    }
    battery = simulateBattery(tasks, hive) ?? {}
  }

  tasks.sort((a, b) => a.start - b.start)
  const done = tasks.filter((t) => t.status === 'ok')
  const fods = tasks.filter((t) => t.type === 'fod' || t.type === 'opening')
  const byCaste: Partial<Record<Caste, number>> = { scout: done.filter((t) => t.caste === 'scout').length }
  if (hive === 'ckz') byCaste.guard = done.filter((t) => t.caste === 'guard').length
  return {
    tasks,
    blocks,
    battery,
    hive,
    sunrise,
    sunset,
    stats: {
      planned: tasks.length,
      done: done.length,
      completion: tasks.length ? done.length / tasks.length : 0,
      sorties: done.length,
      energyKwh: done.reduce((s, t) => s + specFor(t.type, hive).energyKwh * CASTE_DRONES[t.caste], 0),
      vehicle: fods.filter((t) => t.status !== 'ok').length,
      fodPlanned: fods.length,
      fodDone: fods.filter((t) => t.status === 'ok').length,
      byCaste,
    },
  }
}

export function fmt(sec: number) {
  const s = Math.round(sec) % 86400
  return `${String(Math.floor(s / 3600)).padStart(2, '0')}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}`
}

export function defaultWind() {
  // Sakin bir Ekim günü: sabah hafif, öğleden sonra artan rüzgâr
  return Array.from({ length: 24 }, (_, h) => Math.round((3.2 + 2.6 * Math.exp(-((h - 15) ** 2) / 18)) * 10) / 10)
}

export const WIND_PRESETS: { id: string; label: string; wind: () => number[] }[] = [
  { id: 'calm', label: 'Sakin gün', wind: defaultWind },
  {
    id: 'poyraz',
    label: 'Öğleden sonra kuvvetli poyraz',
    wind: () => defaultWind().map((v, h) => (h >= 11 && h <= 17 ? 10.5 - Math.abs(h - 14) * 0.6 : v)),
  },
  {
    id: 'morning',
    label: 'Sabah fırtınası',
    wind: () => defaultWind().map((v, h) => (h >= 5 && h <= 9 ? 11 - (h - 5) * 0.5 : v)),
  },
]
