import { create } from 'zustand'
import { DEFAULT_DAY_OF_YEAR } from '../sim/solar'
import { CKZ_SCHEDULE, defaultWind, MIN, planDay, sawSchedule, type Movement, type PlanResult } from './plan'

/*
  Planlayıcının paylaşılan durumu. Sayfadaki planlayıcı bölümü yazar;
  operasyon merkezi (kule ön kontrolü, "günü oynat") aynı tarifeyi okur.
*/
type Airport = 'ckz' | 'saw'

type State = {
  airport: Airport
  movements: Movement[]
  wind: number[]
  healthDay: boolean
  selectedId: string | null
  windPreset: string
  plan: PlanResult
}

type Actions = {
  setAirport: (a: Airport) => void
  moveTo: (id: string, planned: number) => void
  addDelay: (id: string, minutes: number) => void
  clearDelay: (id: string) => void
  toggleKind: (id: string) => void
  remove: (id: string) => void
  add: () => void
  select: (id: string | null) => void
  setWind: (hour: number, value: number) => void
  setWindAll: (wind: number[], preset: string) => void
  setHealthDay: (v: boolean) => void
  reset: () => void
}

const SNAP = 5 * MIN
const clampT = (t: number) => Math.min(23 * 3600 + 55 * MIN, Math.max(5 * 3600 + 20 * MIN, Math.round(t / SNAP) * SNAP))

function recompute(s: Pick<State, 'movements' | 'wind' | 'healthDay'>) {
  return planDay({ movements: s.movements, wind: s.wind, dayOfYear: DEFAULT_DAY_OF_YEAR, healthDay: s.healthDay })
}

const initial = { movements: CKZ_SCHEDULE, wind: defaultWind(), healthDay: true }

let seq = 10

export const usePlanner = create<State & Actions>((set, get) => {
  const update = (patch: Partial<State>) => {
    const next = { ...get(), ...patch }
    set({ ...patch, plan: recompute(next) })
  }
  return {
    airport: 'ckz',
    ...initial,
    selectedId: 'm2',
    windPreset: 'calm',
    plan: recompute(initial),

    setAirport: (a) => update({ airport: a, movements: a === 'saw' ? sawSchedule() : CKZ_SCHEDULE, selectedId: a === 'saw' ? null : 'm2' }),
    moveTo: (id, planned) =>
      update({ movements: get().movements.map((m) => (m.id === id ? { ...m, planned: clampT(planned) } : m)) }),
    addDelay: (id, minutes) =>
      update({
        movements: get().movements.map((m) =>
          m.id === id ? { ...m, delay: Math.min(m.delay + minutes * MIN, 23 * 3600 + 55 * MIN - m.planned) } : m,
        ),
      }),
    clearDelay: (id) => update({ movements: get().movements.map((m) => (m.id === id ? { ...m, delay: 0 } : m)) }),
    toggleKind: (id) =>
      update({
        movements: get().movements.map((m) =>
          m.id === id ? { ...m, kind: m.kind === 'arr' ? 'dep' : 'arr', label: m.kind === 'arr' ? 'Ankara kalkışı' : 'Ankara gelişi' } : m,
        ),
      }),
    remove: (id) => update({ movements: get().movements.filter((m) => m.id !== id), selectedId: null }),
    add: () => {
      const ms = [...get().movements].sort((a, b) => a.planned - b.planned)
      // en uzun boşluğun ortasına yeni bir hareket ekle
      const marks = [6 * 3600, ...ms.map((m) => m.planned + m.delay), 23 * 3600]
      let at = 14 * 3600
      let best = 0
      for (let i = 0; i < marks.length - 1; i++)
        if (marks[i + 1] - marks[i] > best) {
          best = marks[i + 1] - marks[i]
          at = (marks[i] + marks[i + 1]) / 2
        }
      const id = `m${++seq}`
      update({ movements: [...ms, { id, kind: 'arr', planned: clampT(at), delay: 0, label: 'Ek sefer gelişi' }], selectedId: id })
    },
    select: (id) => set({ selectedId: id }),
    setWind: (hour, value) => {
      const wind = [...get().wind]
      wind[hour] = Math.round(Math.min(14, Math.max(0, value)) * 10) / 10
      update({ wind, windPreset: 'custom' })
    },
    setWindAll: (wind, preset) => update({ wind, windPreset: preset }),
    setHealthDay: (v) => update({ healthDay: v }),
    reset: () => update({ airport: 'ckz', ...initial, wind: defaultWind(), windPreset: 'calm', selectedId: 'm2' }),
  }
})
