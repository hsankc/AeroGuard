import { useSim } from '../sim/store'
import type { SceneId } from '../sim/scenario'

/** Senaryoyu 3D'de oynat: operasyon merkezi ve keşif modu kapanır */
export function openScene(id: SceneId) {
  useSim.getState().set({ scene: id, opsOpen: false, exploreOpen: false, paused: false, sceneCam: 'auto' })
}

export function closeScene() {
  useSim.getState().set({ scene: null, paused: false, sceneCam: 'auto' })
}
