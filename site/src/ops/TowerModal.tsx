import { useEffect, useRef } from 'react'
import { getEngine, MISSION_SECONDS, nextMovement, nextWindow } from '../sim/engine'
import { fmtClock, useSim } from '../sim/store'

/*
  Kule onay ekranı. Kırmızı "04-22" tabelası gerçek hayattaki pist bekleme tabelasıdır:
  kule izin vermeden pist hattı geçilmez. Drone için de kural aynı.
*/
export function TowerModal() {
  const phase = useSim((s) => s.phase)
  const checks = useSim((s) => s.checks)
  const clock = useSim((s) => s.clock)
  const missionId = useSim((s) => s.missionId)
  const okRef = useRef<HTMLButtonElement>(null)
  const open = phase === 'awaiting' || phase === 'preflight'

  useEffect(() => {
    if (phase === 'awaiting') okRef.current?.focus()
  }, [phase])

  if (!open) return null
  const next = nextMovement(clock)
  const end = clock + MISSION_SECONDS
  const allOk = checks.every((c) => c.ok !== false)
  const windowOk = checks.find((c) => c.id === 'window')?.ok !== false
  const win = nextWindow(clock + 60)
  const pre = phase === 'preflight'

  return (
    <div className="tower-backdrop">
      <div className="tower" role="alertdialog" aria-modal="true" aria-labelledby="tower-h" aria-describedby="tower-rule">
        <header className="tower__head">
          <span className="sign-hold tower__sign">04-22</span>
          <div>
            <h2 id="tower-h">Kule onay ekranı</h2>
            <p>Görev {missionId}: uçuş öncesi FOD taraması</p>
          </div>
        </header>

        <dl className="tower__facts num">
          <div>
            <dt>Görev</dt>
            <dd>2 drone, 20 m irtifa, 3 geçiş</dd>
          </div>
          <div>
            <dt>Pencere</dt>
            <dd>
              {fmtClock(clock)}–{fmtClock(end)} (≈12 dk)
            </dd>
          </div>
          <div>
            <dt>Sonraki hareket</dt>
            <dd>{next ? `${fmtClock(next.t)} ${next.label}` : 'Bugün yok'}</dd>
          </div>
        </dl>

        <h3 className="tower__sub">{pre ? 'Ön kontroller yapılıyor' : 'Otomatik ön kontroller'}</h3>
        <ul className={`tower__checks ${pre ? 'is-running' : ''}`}>
          {checks.map((c, i) => (
            <li key={c.id} data-ok={c.ok === false ? 'no' : 'yes'} style={{ animationDelay: `${i * 0.2}s` }}>
              <span className="tower__mark" aria-hidden="true">
                {c.ok === false ? '✕' : '✓'}
              </span>
              <span className="tower__label">{c.label}</span>
              <span className="tower__value num">{c.value}</span>
            </li>
          ))}
        </ul>

        <p id="tower-rule" className="tower__rule">
          Kule onaylamadan kalkış yok. Kule görevi her an iptal edip drone’ları geri çağırabilir. Bir koşul sağlanmazsa onay verilse bile görev başlamaz.
        </p>

        <div className="tower__actions">
          <button ref={okRef} type="button" className="btn tower__ok" disabled={pre} onClick={() => getEngine()?.approve()}>
            {pre ? 'Kontrol ediliyor' : 'Onayla'}
          </button>
          <button type="button" className="btn tower__no" disabled={pre} onClick={() => getEngine()?.reject()}>
            Reddet
          </button>
          {!allOk && !pre && <p className="tower__warn">Bir koşul sağlanmıyor. Onay verirseniz ön kontrolde durdurulur.</p>}
          {!windowOk && !pre && win && (
            <button type="button" className="btn tower__jump" onClick={() => getEngine()?.jumpToWindow()}>
              Sonraki pencereye geç: {fmtClock(win.start)}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
