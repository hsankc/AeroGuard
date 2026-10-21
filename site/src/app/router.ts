import { useEffect, useState } from 'react'

/*
  Hash tabanlı sayfa yönlendirme: tek dosyada ve internetsiz (file://) çalışır.
  Biçim: #/sayfa veya #/sayfa/blok  (blok verilirse sayfa açıldıktan sonra o bloğa kaydırılır)
*/

export type RouteId = 'home' | 'kovan' | 'sistem' | 'gorevler' | 'hangar' | 'acil-durum' | 'planlayici' | 'etki' | 'emniyet' | 'gelisim' | 'sorular'

const IDS: RouteId[] = ['home', 'kovan', 'sistem', 'gorevler', 'hangar', 'acil-durum', 'planlayici', 'etki', 'emniyet', 'gelisim', 'sorular']

export type Route = { id: RouteId; block: string | null }

export function parseHash(hash = window.location.hash): Route {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean)
  const id = (IDS as string[]).includes(parts[0] ?? '') ? (parts[0] as RouteId) : 'home'
  return { id, block: parts[1] ?? null }
}

export function href(id: RouteId, block?: string) {
  if (id === 'home') return '#/'
  return block ? `#/${id}/${block}` : `#/${id}`
}

export function navigate(id: RouteId, block?: string) {
  const next = href(id, block)
  if (window.location.hash === next) {
    // aynı adres: yalnızca bloğa kaydır
    scrollToBlock(block ?? null)
    return
  }
  window.location.hash = next
}

/** smooth: aynı sayfada yumuşak kaydır; yeni sayfada bloğa doğrudan atla (uzun kaydırma yerine) */
export function scrollToBlock(block: string | null, smooth = true) {
  if (!block) {
    window.scrollTo({ top: 0, behavior: 'instant' })
    return
  }
  const el = document.getElementById(block)
  if (!el) return
  if (smooth) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    return
  }
  el.scrollIntoView({ behavior: 'instant', block: 'start' })
  // üstteki içerik (3D kutular, hesaplayıcılar) yerleşirken blok kayabilir: bir kez düzelt
  window.setTimeout(() => el.scrollIntoView({ behavior: 'instant', block: 'start' }), 250)
}

export function useRoute() {
  const [route, setRoute] = useState<Route>(() => parseHash())
  useEffect(() => {
    const on = () => setRoute(parseHash())
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  return route
}
