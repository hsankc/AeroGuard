import { getEngine } from '../sim/engine'
import { useSim, type PickId } from '../sim/store'

/** Keşif modunu aç; isteğe bağlı olarak Ek 14 katmanını aç ve bir nesneye uç. */
export function openExplore(opts: { annex?: boolean; focus?: PickId } = {}) {
  useSim.getState().set({ exploreOpen: true, opsOpen: false })
  // motor modu SimHost efektinde değişir; bir sonraki görev döngüsünde uygula
  window.setTimeout(() => {
    const e = getEngine()
    if (!e) return
    if (opts.annex) e.setAnnex(true)
    if (opts.focus) {
      e.select(opts.focus)
      e.focusPick(opts.focus)
    }
  }, 60)
}

export function closeExplore() {
  useSim.getState().set({ exploreOpen: false })
}
