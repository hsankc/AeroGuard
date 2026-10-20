import { useEffect } from 'react'
import { getEngine } from '../sim/engine'
import { useSim } from '../sim/store'
import { SCENES, type SceneId } from '../sim/scenario'
import { closeScene } from './actions'
import './scene.css'

/*
  Senaryo oynatıcısının arayüzü: başlık, ilk tespit, zaman çizelgesi (simülasyon saati), oynat/durdur.
  Süreler temsilidir; hedefler pilotta ölçülecek.
*/

const mmss = (t: number) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`

export function SceneHud() {
  const id = useSim((s) => s.scene) as SceneId | null
  const t = useSim((s) => s.sceneT)
  const paused = useSim((s) => s.paused)

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

  return (
    <div className="shud" role="region" aria-label={`Senaryo: ${def.title}`}>
      <header className="shud__top glass glass--strong">
        <div>
          <span className={`shud__kicker ${id === 'ice' ? 'is-ice' : ''}`}>{id === 'ice' ? 'Kış sahnesi · temsili' : 'Acil durum senaryosu · temsili'}</span>
          <h2>{def.title}</h2>
          <p>
            İlk tespit: <b>{def.first}</b> · {def.rate}× hızlı
          </p>
        </div>
        <button type="button" className="btn btn--primary" onClick={closeScene}>
          Kapat <kbd>Esc</kbd>
        </button>
      </header>

      <section className="shud__bar glass glass--strong">
        <div className="shud__now" aria-live="polite">
          <span className={`shud__clock num ${def.beats[current]?.kind === 'alert' ? 'is-alert' : ''}`}>T+{mmss(t)}</span>
          <p>{def.beats[current]?.text}</p>
        </div>
        <div className="shud__track" aria-hidden="true">
          <span className="shud__fill" style={{ width: `${Math.min(100, (t / def.duration) * 100)}%` }} />
          {def.beats.map((b, i) => (
            <span key={i} className={`shud__dot ${i <= current ? 'is-on' : ''} ${b.kind === 'alert' ? 'is-alert' : b.kind === 'ok' ? 'is-ok' : ''}`} style={{ left: `${(b.t / def.duration) * 100}%` }} />
          ))}
        </div>
        <ol className="shud__beats">
          {def.beats.map((b, i) => (
            <li key={i} className={i === current ? 'is-now' : i < current ? 'is-past' : ''}>
              <span className="num">T+{mmss(b.t)}</span> {b.text}
            </li>
          ))}
        </ol>
        <div className="shud__actions">
          <button type="button" className="pbtn" onClick={() => useSim.getState().set({ paused: !paused })} disabled={done}>
            {paused ? 'Sürdür' : 'Duraklat'} <kbd>Boşluk</kbd>
          </button>
          <button type="button" className="pbtn" onClick={() => getEngine()?.restartScene()}>
            Baştan oynat
          </button>
          <span className="shud__note">Süreler temsilidir: uyarı hedefi ≤ 10 sn, itfaiye için ICAO hedefi 3 dk. Kovan itfaiyenin yerini almaz; ilk gören olur.</span>
        </div>
      </section>
    </div>
  )
}
