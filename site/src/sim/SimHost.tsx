import { useEffect, useRef } from 'react'
import { createEngine, getEngine } from './engine'
import { useSim } from './store'
import type { Station } from '../app/pages'
import './sim.css'

/*
  Sabit, tam ekran 3D tuval. Her sayfanın arkasında canlı durur:
  sayfalarda sinematik modda (kamera sayfanın istasyonuna uçar), keşif modunda serbest uçuşla (WASD),
  operasyon merkezi açıkken etkileşimli modda.
  Sekme gizliyken tarayıcı çizimi kendiliğinden durdurur.
*/
export function SimHost({ station }: { station: Station }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const opsOpen = useSim((s) => s.opsOpen)
  const exploreOpen = useSim((s) => s.exploreOpen)
  const scene = useSim((s) => s.scene)
  const mode = opsOpen ? 'ops' : scene ? 'scene' : exploreOpen ? 'explore' : 'hero'
  const quality = useSim((s) => s.quality)
  const stationRef = useRef(station)
  stationRef.current = station

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    let cancelled = false
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
      engine.setStation(stationRef.current)
      const s = useSim.getState()
      engine.setMode(s.opsOpen ? 'ops' : s.scene ? 'scene' : s.exploreOpen ? 'explore' : 'hero')
      engine.setActive(true)
    }
    start()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    getEngine()?.setMode(mode)
  }, [mode])

  useEffect(() => {
    getEngine()?.syncScene()
  }, [scene])

  useEffect(() => {
    getEngine()?.setStation(station)
  }, [station])

  useEffect(() => {
    getEngine()?.applyQuality(quality)
  }, [quality])

  return (
    <div
      className={`sim-host ${opsOpen ? 'sim-host--ops' : ''} ${exploreOpen || scene ? 'sim-host--explore' : ''} ${station === 'hero' || exploreOpen || scene ? '' : 'sim-host--page'}`}
      aria-hidden={mode === 'hero'}
    >
      <canvas ref={ref} className="sim-canvas" />
    </div>
  )
}
