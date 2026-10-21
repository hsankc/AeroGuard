import { useEffect } from 'react'
import { getEngine } from '../sim/engine'
import { useSim } from '../sim/store'
import { SCENES, type SceneId } from '../sim/scenario'
import { useLang, useTx } from '../i18n'
import { closeScene } from './actions'
import './scene.css'

/*
  Senaryo oynatıcısının arayüzü: üstte başlık ve ilk tespit, altta tek satır (saat, şu anki adım, oynat/baştan)
  ve adımları gösteren zaman çizelgesi. Kadrajın çoğu 3D sahneye kalır. Süreler temsilidir.
*/

/** Etiket katmanı motora bir kez verilir (her saniye yeniden kurulmasın diye bileşen dışında sabit) */
const labelLayer = (el: HTMLDivElement | null) => getEngine()?.setLabelLayer(el)

const mmss = (t: number) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`

export function SceneHud() {
  const id = useSim((s) => s.scene) as SceneId | null
  const t = useSim((s) => s.sceneT)
  const paused = useSim((s) => s.paused)
  const { t: tr } = useLang()
  const tx = useTx()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeScene()
      if (e.code === 'Space') {
        e.preventDefault()
        useSim.getState().set({ paused: !useSim.getState().paused })
      }
    }
    window.addEventListener('keydown', onKey)
    document.body.classList.add('explore-open')
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.classList.remove('explore-open')
    }
  }, [])

  if (!id) return null
  const def = SCENES[id]
  const current = def.beats.reduce((k, b, i) => (t >= b.t ? i : k), 0)
  const done = t >= def.duration - 0.01
  const kind = def.beats[current]?.kind

  return (
    <div className="shud" role="region" aria-label={`${tr({ tr: 'Senaryo', en: 'Scenario' })}: ${def.title}`}>
      <div className="sim-labels" ref={labelLayer} aria-hidden="true" />
      <header className="shud__top glass glass--strong">
        <div>
          <span className={`shud__kicker ${id === 'ice' ? 'is-ice' : ''}`}>
            {id === 'ice' ? tr({ tr: 'Kış sahnesi', en: 'Winter scene' }) : tr({ tr: 'Acil durum senaryosu', en: 'Emergency scenario' })}
          </span>
          <h2>{tx(def.title)}</h2>
          <p>
            {tr({ tr: 'İlk tespit', en: 'First detection' })}: <b>{tx(def.first)}</b> · {def.rate}× · {tr({ tr: 'süreler temsilidir', en: 'timings are representative' })}
          </p>
        </div>
        <button type="button" className="btn btn--primary" onClick={closeScene}>
          {tr({ tr: 'Kapat', en: 'Close' })} <kbd>Esc</kbd>
        </button>
      </header>

      <section className="shud__bar glass glass--strong">
        <div className="shud__now" aria-live="polite">
          <span className={`shud__clock num ${kind === 'alert' ? 'is-alert' : kind === 'ok' ? 'is-ok' : ''}`}>T+{mmss(t)}</span>
          <p>{def.beats[current]?.text}</p>
          <div className="shud__ctl">
            <button
              type="button"
              className="pbtn"
              onClick={() => useSim.getState().set({ paused: !paused })}
              disabled={done}
              aria-label={paused ? tr({ tr: 'Sürdür', en: 'Resume' }) : tr({ tr: 'Duraklat', en: 'Pause' })}
              title={`${paused ? tr({ tr: 'Sürdür', en: 'Resume' }) : tr({ tr: 'Duraklat', en: 'Pause' })} (${tr({ tr: 'Boşluk', en: 'Space' })})`}
            >
              {paused ? '▶' : '❚❚'}
            </button>
            <button type="button" className="pbtn" onClick={() => getEngine()?.restartScene()} aria-label={tr({ tr: 'Baştan oynat', en: 'Replay' })} title={tr({ tr: 'Baştan oynat', en: 'Replay' })}>
              ↺
            </button>
          </div>
        </div>
        <div className="shud__track">
          <span className="shud__fill" style={{ width: `${Math.min(100, (t / def.duration) * 100)}%` }} />
          {def.beats.map((b, i) => (
            <span
              key={i}
              className={`shud__dot ${i <= current ? 'is-on' : ''} ${b.kind === 'alert' ? 'is-alert' : b.kind === 'ok' ? 'is-ok' : ''}`}
              style={{ left: `${(b.t / def.duration) * 100}%` }}
              title={`T+${mmss(b.t)} ${b.text}`}
            />
          ))}
        </div>
      </section>
    </div>
  )
}
