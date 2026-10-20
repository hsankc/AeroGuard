import { useEffect, useRef, useState } from 'react'
import { getEngine } from '../sim/engine'
import { useSim } from '../sim/store'
import { MODE_LABEL } from '../ops/labels'
import { navigate } from '../app/router'
import { PICKS, type PickInfo } from './info'
import { closeExplore } from './actions'
import './explore.css'

/*
  Keşif modu arayüzü: kontrol rehberi, Ek 14 anahtarı, üzerine gelinen nesnenin adı,
  seçilen nesnenin cam bilgi kartı ve telefonda sanal joystick ile yükseklik düğmeleri.
*/

const fmt1 = (n: number) => n.toLocaleString('tr-TR', { maximumFractionDigits: 1, minimumFractionDigits: 1 })

function liveRows(kind: PickInfo['live']): [string, string][] {
  const e = getEngine()
  if (!e || !kind) return []
  if (kind === 'drone1' || kind === 'drone2') {
    const d = e.mission.drones[kind === 'drone1' ? 0 : 1]
    return [
      ['Durum', MODE_LABEL[d.mode]],
      ['Batarya', `%${Math.round(d.battery)}`],
      ['İrtifa', `${Math.round(d.airborne ? d.pos.y : 0)} m`],
      ['Hız', `${fmt1(d.speed)} m/s`],
    ]
  }
  if (kind === 'petekA' || kind === 'petekB') {
    const st = e.stations[kind === 'petekA' ? 0 : 1]
    const d = e.mission.drones[kind === 'petekA' ? 0 : 1]
    return [
      ['Kapak', st.isOpen ? 'açık' : st.isClosed ? 'kapalı' : 'hareket ediyor'],
      ['Kâşif', MODE_LABEL[d.mode]],
    ]
  }
  const wind = useSim.getState().wind
  if (kind === 'energy') {
    const o = e.energyOutput()
    return [
      ['Güneş, şu an', `${fmt1(o.pv)} kW`],
      ['Türbin, şu an', `${fmt1(o.turbine)} kW`],
      ['Rüzgâr', `${fmt1(wind)} m/s`],
    ]
  }
  return [
    ['Rüzgâr, şu an', `${fmt1(wind)} m/s`],
    ['Kalkış sınırı', '8 m/s'],
  ]
}

function Card() {
  const selected = useSim((s) => s.selected)
  const [, tick] = useState(0)
  useEffect(() => {
    if (!selected || !PICKS[selected].live) return
    const id = window.setInterval(() => tick((n) => n + 1), 300)
    return () => window.clearInterval(id)
  }, [selected])
  if (!selected) return null
  const p = PICKS[selected]
  const rows = [...(p.rows ?? []), ...liveRows(p.live)]
  const go = (to: Parameters<typeof navigate>[0], block?: string) => {
    closeExplore()
    navigate(to, block)
  }
  const ops = () => useSim.getState().set({ exploreOpen: false, opsOpen: true })
  return (
    <section className="xhud__card glass glass--strong" aria-live="polite" aria-label={`${p.title} bilgi kartı`}>
      <button type="button" className="xhud__x" onClick={() => getEngine()?.select(null)} aria-label="Kartı kapat">
        ×
      </button>
      <span className="xhud__kicker">{p.kicker}</span>
      <h2>{p.title}</h2>
      <p>{p.text}</p>
      {rows.length > 0 && (
        <dl>
          {rows.map(([k, v]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd className="num">{v}</dd>
            </div>
          ))}
        </dl>
      )}
      <div className="xhud__actions">
        <button type="button" className="pbtn" onClick={() => getEngine()?.focusPick(selected)}>
          Odaklan <kbd>F</kbd>
        </button>
        {p.ops && (
          <button type="button" className="pbtn" onClick={ops}>
            {p.ops}
          </button>
        )}
        {p.links?.map((l) => (
          <button key={l.label} type="button" className="pbtn pbtn--quiet" onClick={() => go(l.to, l.block)}>
            {l.label}
          </button>
        ))}
      </div>
    </section>
  )
}

/** Telefonda hareket: sürüklenen düğme (−1…1) */
function Stick() {
  const base = useRef<HTMLDivElement>(null)
  const [knob, setKnob] = useState({ x: 0, y: 0 })
  const R = 44
  const move = (e: React.PointerEvent) => {
    const r = base.current!.getBoundingClientRect()
    let x = e.clientX - (r.left + r.width / 2)
    let y = e.clientY - (r.top + r.height / 2)
    const l = Math.hypot(x, y)
    if (l > R) {
      x = (x / l) * R
      y = (y / l) * R
    }
    setKnob({ x, y })
    getEngine()?.fly.setStick(x / R, y / R)
  }
  const end = () => {
    setKnob({ x: 0, y: 0 })
    getEngine()?.fly.setStick(0, 0)
  }
  return (
    <div
      ref={base}
      className="xhud__stick"
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId)
        move(e)
      }}
      onPointerMove={(e) => e.buttons && move(e)}
      onPointerUp={end}
      onPointerCancel={end}
      aria-hidden="true"
    >
      <span style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }} />
    </div>
  )
}

function Lift() {
  const set = (v: number) => getEngine()?.fly.setLift(v)
  const bind = (v: number) => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.currentTarget.setPointerCapture(e.pointerId)
      set(v)
    },
    onPointerUp: () => set(0),
    onPointerCancel: () => set(0),
  })
  return (
    <div className="xhud__lift">
      <button type="button" aria-label="Yüksel" {...bind(1)}>
        ▲
      </button>
      <button type="button" aria-label="Alçal" {...bind(-1)}>
        ▼
      </button>
    </div>
  )
}

export function ExploreHud() {
  const hovered = useSim((s) => s.hovered)
  const selected = useSim((s) => s.selected)
  const annex = useSim((s) => s.annex14)
  const [tip, setTip] = useState<{ x: number; y: number } | null>(null)
  const [help, setHelp] = useState(() => window.matchMedia?.('(min-width: 760px)').matches ?? true)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (t && (t.tagName === 'INPUT' || t.tagName === 'SELECT')) return
      if (e.key === 'Escape') {
        if (useSim.getState().selected) getEngine()?.select(null)
        else closeExplore()
      } else if (e.code === 'KeyF') getEngine()?.focusPick()
    }
    const onMove = (e: PointerEvent) => (e.pointerType === 'mouse' ? setTip({ x: e.clientX, y: e.clientY }) : setTip(null))
    window.addEventListener('keydown', onKey)
    window.addEventListener('pointermove', onMove)
    document.body.classList.add('explore-open')
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('pointermove', onMove)
      document.body.classList.remove('explore-open')
    }
  }, [])

  return (
    <div className="xhud" role="region" aria-label="Keşif modu">
      <div className="xhud__panel glass glass--strong">
        <div className="xhud__head">
          <div>
            <span className="xhud__kicker">Keşif modu</span>
            <h2>Çanakkale Havalimanı</h2>
          </div>
          <button type="button" className="btn btn--primary xhud__exit" onClick={closeExplore}>
            Çık <kbd>Esc</kbd>
          </button>
        </div>
        <label className="xhud__switch">
          <input type="checkbox" checked={annex} onChange={(e) => getEngine()?.setAnnex(e.target.checked)} />
          <span>Ek 14 yüzeyleri (şerit ve geçiş yüzeyi)</span>
        </label>
        <button type="button" className="xhud__help-toggle" aria-expanded={help} onClick={() => setHelp((v) => !v)}>
          {help ? 'Kontrolleri gizle' : 'Kontroller'}
        </button>
        {help && (
          <dl className="xhud__keys">
            <div>
              <dt>
                <kbd>W</kbd>
                <kbd>A</kbd>
                <kbd>S</kbd>
                <kbd>D</kbd>
              </dt>
              <dd>hareket</dd>
            </div>
            <div>
              <dt>
                <kbd>Q</kbd>
                <kbd>E</kbd>
              </dt>
              <dd>alçal / yüksel</dd>
            </div>
            <div>
              <dt>
                <kbd>Shift</kbd>
              </dt>
              <dd>hızlı</dd>
            </div>
            <div>
              <dt>sürükle</dt>
              <dd>bakış</dd>
            </div>
            <div>
              <dt>tekerlek</dt>
              <dd>ileri / geri</dd>
            </div>
            <div>
              <dt>tıkla</dt>
              <dd>nesneyi seç</dd>
            </div>
            <div>
              <dt>
                <kbd>F</kbd>
              </dt>
              <dd>seçilene uç</dd>
            </div>
          </dl>
        )}
        <p className="xhud__note">Temsili 3D sahne; pist ölçüleri ve tarama geometrisi rapordaki değerlerle aynı.</p>
      </div>

      {hovered && tip && hovered !== selected && (
        <div className="xhud__tip" style={{ transform: `translate(${tip.x + 14}px, ${tip.y + 16}px)` }}>
          {PICKS[hovered].title}
          <small>tıkla</small>
        </div>
      )}

      <Card />
      <Stick />
      <Lift />
    </div>
  )
}
