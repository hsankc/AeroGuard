import { useEffect } from 'react'
import { getEngine } from '../sim/engine'
import { useSim } from '../sim/store'
import { SCENES, type CamPick, type SceneId } from '../sim/scenario'
import { useLang, useTx } from '../i18n'
import { closeScene } from './actions'
import './scene.css'

/*
  Senaryo oynatıcısının arayüzü: üstte başlık ve ilk tespit, altta tek satır (saat, şu anki adım, oynat/baştan)
  ve adımları gösteren zaman çizelgesi. Kadrajın çoğu 3D sahneye kalır. Süreler temsilidir.
*/

/** Kamera seçenekleri: rakam tuşları 1–8 de aynı sırayla seçer */
const CAMS: { id: CamPick; tr: string; en: string }[] = [
  { id: 'auto', tr: 'Otomatik', en: 'Auto' },
  { id: 'event', tr: 'Olay yeri', en: 'Scene' },
  { id: 'scout1', tr: 'Kâşif-1', en: 'Scout-1' },
  { id: 'scout2', tr: 'Kâşif-2', en: 'Scout-2' },
  { id: 'guard', tr: 'Bekçi', en: 'Guard' },
  { id: 'worker', tr: 'İşçi', en: 'Worker' },
  { id: 'wide', tr: 'Genel', en: 'Overview' },
  { id: 'free', tr: 'Serbest (WASD)', en: 'Free (WASD)' },
]

/** Etiket katmanı motora bir kez verilir (her saniye yeniden kurulmasın diye bileşen dışında sabit) */
const labelLayer = (el: HTMLDivElement | null) => getEngine()?.setLabelLayer(el)

/** Drone kamerası penceresi: motor takip edilen drone'un kamerasını bu kutunun yerine çizer */
const pipSlot = (el: HTMLDivElement | null) => getEngine()?.setPipSlot(el)

const mmss = (t: number) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`

export function SceneHud() {
  const id = useSim((s) => s.scene) as SceneId | null
  const t = useSim((s) => s.sceneT)
  const paused = useSim((s) => s.paused)
  const cam = useSim((s) => s.sceneCam)
  const { t: tr } = useLang()
  const tx = useTx()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeScene()
      if (e.code === 'Space') {
        e.preventDefault()
        useSim.getState().set({ paused: !useSim.getState().paused })
      }
      const n = Number(e.key)
      if (n >= 1 && n <= CAMS.length && !e.ctrlKey && !e.metaKey && !e.altKey) useSim.getState().set({ sceneCam: CAMS[n - 1].id })
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
  const eng = getEngine()
  const showing = eng?.sceneCam.label ?? ''
  const pip = cam !== 'free' && eng?.scenePipDrone() != null

  return (
    <div className="shud" role="region" aria-label={`${tr({ tr: 'Senaryo', en: 'Scenario' })}: ${def.title}`}>
      <div className="sim-labels" ref={labelLayer} aria-hidden="true" />
      {pip && (
        <div className="shud__pip" ref={pipSlot} aria-hidden="true">
          <span>
            {tr({ tr: 'Drone kamerası', en: 'Drone camera' })} · {tx(showing)}
          </span>
        </div>
      )}
      <header className="shud__top glass glass--strong">
        <div>
          <span className={`shud__kicker ${id === 'ice' ? 'is-ice' : ''}`}>
            {id === 'ice' ? tr({ tr: 'Kış sahnesi', en: 'Winter scene' }) : tr({ tr: 'Acil durum senaryosu', en: 'Emergency scenario' })}
          </span>
          <h2>{tx(def.title)}</h2>
          <p>
            {tr({ tr: 'İlk tespit', en: 'First detection' })}: <b>{tx(def.first)}</b> · {Math.round(eng?.director.rateNow() ?? def.rate)}× · {tr({ tr: 'süreler temsilidir', en: 'timings are representative' })}
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
        <div className="shud__cams" role="group" aria-label={tr({ tr: 'Kamera', en: 'Camera' })}>
          <span className="shud__cams-label">
            {tr({ tr: 'Kamera', en: 'Camera' })}
            {cam !== 'free' && showing ? <b> · {tx(showing)}</b> : null}
          </span>
          {CAMS.map((c, i) => (
            <button
              key={c.id}
              type="button"
              className="shud__cam"
              aria-pressed={cam === c.id}
              title={`${tr({ tr: c.tr, en: c.en })} (${i + 1})`}
              onClick={() => useSim.getState().set({ sceneCam: c.id })}
            >
              {c.id === 'worker' && id === 'ice' ? tr({ tr: 'Bakıcı', en: 'Nurse' }) : tr({ tr: c.tr, en: c.en })}
            </button>
          ))}
          {cam !== 'free' && eng?.sceneCam.adjusted && (
            <button type="button" className="shud__cam shud__cam--reset" onClick={() => eng.sceneCam.resetView()}>
              {tr({ tr: 'Açıyı sıfırla', en: 'Reset view' })}
            </button>
          )}
          <span className="shud__hint">
            {cam === 'free'
              ? tr({ tr: 'WASD uç · Q/E alçal/yüksel · sürükle bak', en: 'WASD fly · Q/E down/up · drag to look' })
              : tr({ tr: 'Sürükle: döndür · tekerlek: yakınlaştır', en: 'Drag: rotate · wheel: zoom' })}
          </span>
        </div>
      </section>
    </div>
  )
}
