import { create } from 'zustand'
import type { HangarModelId } from './models'

/** Hangarda gösterilen model (keşif modundaki "Hangar'da aç" buradan seçer) */
export const useHangar = create<{ model: HangarModelId; setModel: (m: HangarModelId) => void }>((set) => ({
  model: 'scout',
  setModel: (model) => set({ model }),
}))
