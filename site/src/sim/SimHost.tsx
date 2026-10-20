import { useEffect, useRef } from 'react'
import { createEngine, getEngine } from './engine'
import { useSim } from './store'
import './sim.css'

/*
  Sabit, tam ekran 3D tuval. Sayfanın arkasında durur:
  hero görünürken sinematik modda, operasyon merkezi açıkken etkileşimli modda çalışır,
  aksi halde durur (pil ve işlemci tasarrufu).
*/
export function SimHost() {
  const ref = useRef<HTMLCanvasElement>(null)
  const opsOpen = useSim((s) => s.opsOpen)
  const quality = useSim((s) => s.quality)
  const heroVisible = useRef(true)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    let cancelled = false
    let io: IntersectionObserver | null = null
    const start = async () => {
      // Dokulardaki yazılar (pist numaraları, tabelalar) için yazı tipinin yüklenmesini bekle
      try {
        await Promise.all([document.fonts.load('700 64px "Barlow Condensed"'), document.fonts.ready])
      } catch {
        /* yazı tipi yüklenemezse yedek yazı tipiyle devam */
      }
      if (cancelled) return
      let engine
      try {
        engine = createEngine(canvas)
      } catch (err) {
        console.error('WebGL başlatılamadı', err)
        document.documentElement.classList.add('no-webgl')
        return
      }
      const hero = document.getElementById('top')
      io = new IntersectionObserver(([e]) => {
        heroVisible.current = e.isIntersecting
        engine.setActive(useSim.getState().opsOpen || heroVisible.current)
      })
      if (hero) io.observe(hero)
      engine.setActive(true)
    }
    start()
    return () => {
      cancelled = true
      io?.disconnect()
    }
  }, [])

  useEffect(() => {
    const e = getEngine()
    if (!e) return
    e.setMode(opsOpen ? 'ops' : 'hero')
    e.setActive(opsOpen || heroVisible.current)
  }, [opsOpen])

  useEffect(() => {
    getEngine()?.applyQuality(quality)
  }, [quality])

  return (
    <div className={`sim-host ${opsOpen ? 'sim-host--ops' : ''}`} aria-hidden={!opsOpen}>
      <canvas ref={ref} className="sim-canvas" />
    </div>
  )
}
