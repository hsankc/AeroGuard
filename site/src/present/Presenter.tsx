import { useEffect } from 'react'
import { create } from 'zustand'
import { useLang } from '../i18n'
import { navigate } from '../app/router'
import { useSim } from '../sim/store'
import { openExplore } from '../explore/actions'
import { openScene } from '../emergency/actions'
import { STEPS } from './steps'
import './present.css'

/** Sunum modu durumu: null kapalı, sayı adım */
export const usePresent = create<{ step: number | null; go: (n: number | null) => void }>((set) => ({
  step: null,
  go: (n) => set({ step: n === null ? null : Math.max(0, Math.min(STEPS.length - 1, n)) }),
}))

export function startPresenting() {
  usePresent.getState().go(0)
}

/** Adımın sayfasına, keşfine ya da sahnesine geç */
function apply(n: number) {
  const s = STEPS[n]
  const sim = useSim.getState()
  if (s.scene) {
    openScene(s.scene)
    return
  }
  sim.set({ scene: null, opsOpen: false })
  if (s.explore) {
    openExplore(s.explore)
    return
  }
  sim.set({ exploreOpen: false })
  if (s.route) navigate(s.route, s.block)
}

export function Presenter() {
  const step = usePresent((s) => s.step)
  const go = usePresent((s) => s.go)
  const { t } = useLang()

  useEffect(() => {
    if (step === null) return
    apply(step)
  }, [step])

  useEffect(() => {
    if (step === null) return
    document.body.classList.add('presenting')
    const onKey = (e: KeyboardEvent) => {
      const s = usePresent.getState().step
      if (s === null) return
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        e.preventDefault()
        go(s + 1)
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault()
        go(s - 1)
      } else if (e.key === 'Escape' && !useSim.getState().scene && !useSim.getState().exploreOpen) go(null)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.classList.remove('presenting')
    }
  }, [step === null, go])

  if (step === null) return null
  const s = STEPS[step]
  const stop = () => {
    useSim.getState().set({ scene: null, exploreOpen: false })
    go(null)
  }
  return (
    <div className="pres glass glass--strong" role="region" aria-label="Sunum modu">
      <span className="pres__n num">
        {step + 1}/{STEPS.length}
      </span>
      <div className="pres__text">
        <b>{t(s.title)}</b>
        <p>{t(s.note)}</p>
      </div>
      <div className="pres__nav">
        <button type="button" onClick={() => go(step - 1)} disabled={step === 0} aria-label="Önceki adım">
          ‹
        </button>
        <button type="button" className="is-next" onClick={() => go(step + 1)} disabled={step === STEPS.length - 1} aria-label="Sonraki adım">
          ›
        </button>
        <button type="button" onClick={stop} aria-label="Sunumu bitir">
          ×
        </button>
      </div>
      <div className="pres__dots" aria-hidden="true">
        {STEPS.map((_, i) => (
          <span key={i} className={i === step ? 'is-on' : i < step ? 'is-past' : ''} />
        ))}
      </div>
    </div>
  )
}
