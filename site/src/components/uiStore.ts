import { create } from 'zustand'
import type { FactId } from '../data/facts'

/** Sayfa geneli arayüz durumu: Varsayımlar paneli */
type Ui = {
  assumptionsOpen: boolean
  focusFact: FactId | null
  openAssumptions: (focus?: FactId) => void
  closeAssumptions: () => void
}

export const useUi = create<Ui>((set) => ({
  assumptionsOpen: false,
  focusFact: null,
  openAssumptions: (focus) => set({ assumptionsOpen: true, focusFact: focus ?? null }),
  closeAssumptions: () => set({ assumptionsOpen: false, focusFact: null }),
}))
