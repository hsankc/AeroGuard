import { useEffect, useRef } from 'react'
import { FACTS, SOURCES, type FactId } from '../data/facts'
import { useUi } from './uiStore'
import './assumptions.css'

/*
  Varsayımlar paneli: sitedeki her rakam, varsayımı ve kaynağıyla.
  Mentör geri bildirimi: "dayanaksız rakamlar savunulamaz". Jüri her rakamın nereden geldiğini buradan görür.
*/

const GROUPS: { title: string; ids: FactId[] }[] = [
  { title: 'Problem', ids: ['fodCostTotal', 'fodCostDirect', 'fodCostPer10k'] },
  {
    title: 'Pilot saha',
    ids: ['runway', 'passengers2025', 'passengersCkz2026', 'passengersSaw2026', 'scaleRatio', 'dailyMovements', 'terminalCapacity', 'windRank'],
  },
  {
    title: 'Tarama',
    ids: ['scanTime', 'altitude', 'footprint', 'gsd', 'objectPx', 'targetSize', 'passes', 'pathPerDrone', 'scanSpeed', 'sortieEnergy', 'leadTime', 'sortiesPerDay'],
  },
  { title: 'Donanım ve emniyet', ids: ['dockCharge', 'droneSpec', 'windLimit', 'geofence'] },
  { title: 'Enerji', ids: ['pv', 'turbine', 'battery', 'consumption', 'energyRatio', 'autonomy', 'evKm'] },
  { title: 'Sürdürülebilirlik', ids: ['co2', 'co2Fleet'] },
  { title: 'Maliyet', ids: ['capex', 'opex', 'nextAirport', 'daas'] },
  { title: 'Yapay zekâ ve pilot hedefleri', ids: ['fodA', 'kpiSensitivity', 'kpiFalseAlarm', 'kpiScanTime', 'kpiReport', 'kpiCompletion', 'kpiEnergy'] },
  { title: 'Kovan (V3, ön tahmin)', ids: ['hiveMini', 'hiveCkz', 'hiveWinter', 'hiveYear', 'workerPayload', 'pickupLimit', 'sentinelKpi', 'gnssRisk', 'iceTrl'] },
  { title: 'Yol haritası', ids: ['roadmap'] },
]

export function Assumptions() {
  const open = useUi((s) => s.assumptionsOpen)
  const focus = useUi((s) => s.focusFact)
  const close = useUi((s) => s.closeAssumptions)
  const panel = useRef<HTMLDivElement>(null)
  const closeBtn = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    const el = focus ? panel.current?.querySelector<HTMLElement>(`[data-fact="${focus}"]`) : null
    if (el) {
      el.scrollIntoView({ block: 'center' })
      el.focus()
    } else closeBtn.current?.focus()
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, focus, close])

  if (!open) return null
  return (
    <div className="asm-backdrop" onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <div className="asm" role="dialog" aria-modal="true" aria-labelledby="asm-h" ref={panel}>
        <header className="asm__head">
          <div>
            <h2 id="asm-h">Varsayımlar ve kaynaklar</h2>
            <p>v2 rakamları Genişletilmiş Proje Raporu’ndan (Ekim 2026), kovan (V3) rakamları V3 planından alınmıştır. Hepsi ön tasarım tahminidir; doğrulama pilot uygulamaya bırakılmıştır.</p>
          </div>
          <button ref={closeBtn} type="button" className="asm__close" onClick={close}>
            Kapat
          </button>
        </header>
        {GROUPS.map((g) => (
          <section key={g.title} className="asm__group" aria-label={g.title}>
            <h3>{g.title}</h3>
            <dl>
              {g.ids.map((id) => {
                const f = FACTS[id]
                const src = 'src' in f ? (f.src as number[]) : undefined
                return (
                  <div key={id} data-fact={id} tabIndex={-1} className={focus === id ? 'is-focus' : undefined}>
                    <dt>{f.label}</dt>
                    <dd>
                      <b className="num">{f.value}</b>
                      <span>{f.note}</span>
                      {src && <span className="asm__src">Kaynak {src.map((n) => `[${n}]`).join(' ')}</span>}
                    </dd>
                  </div>
                )
              })}
            </dl>
          </section>
        ))}
        <section className="asm__group" aria-label="Kaynakça">
          <h3>Kaynakça</h3>
          <ol className="asm__refs">
            {Object.entries(SOURCES).map(([n, s]) => (
              <li key={n} value={Number(n)}>
                {s}
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  )
}
