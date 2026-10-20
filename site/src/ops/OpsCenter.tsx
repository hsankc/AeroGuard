import { useEffect, useRef, type ReactNode } from 'react'
import { getEngine } from '../sim/engine'
import { fmtClock, useSim, type CameraMode, type FodClass } from '../sim/store'
import { describePosition, footprint } from '../sim/world/layout'
import { FOD_LABEL } from '../sim/world/fod'
import { LOG_LABEL, MODE_LABEL, PHASE_LABEL, STEPS, stepIndex } from './labels'
import { DAY_END, DAY_START } from '../planner/plan'
import { TowerModal } from './TowerModal'
import { ReportModal } from './ReportModal'
import { navigate } from '../app/router'
import './ops.css'

const e = () => getEngine()

function TopBar() {
  const clock = useSim((s) => s.clock)
  const speed = useSim((s) => s.speed)
  const paused = useSim((s) => s.paused)
  const quality = useSim((s) => s.quality)
  const dayMode = useSim((s) => s.dayMode)
  const set = useSim((s) => s.set)
  const speeds = dayMode ? [60, 120, 300, 600] : [1, 4, 16, 32]
  return (
    <header className="ops-top">
      <div className="ops-top__id">
        <span className="sign-loc">LTBH</span>
        <span className="ops-top__name">Çanakkale Havalimanı, pist 04/22</span>
      </div>
      <div className="ops-top__clock num" aria-label="Simülasyon saati">
        {fmtClock(clock, true)}
        <span>yerel saat</span>
      </div>
      <div className="ops-top__tools">
        <div className="seg" role="group" aria-label="Simülasyon hızı">
          {speeds.map((v) => (
            <button key={v} type="button" aria-pressed={speed === v && !paused} onClick={() => set({ speed: v, paused: false })}>
              {v}×
            </button>
          ))}
          <button type="button" aria-pressed={paused} onClick={() => set({ paused: !paused })}>
            {paused ? 'Devam' : 'Duraklat'}
          </button>
        </div>
        <label className="ops-select">
          <span className="visually-hidden">Grafik kalitesi</span>
          <select value={quality} onChange={(ev) => set({ quality: ev.target.value as 'low' | 'medium' | 'high' })}>
            <option value="high">Yüksek kalite</option>
            <option value="medium">Orta kalite</option>
            <option value="low">Düşük kalite</option>
          </select>
        </label>
        <button type="button" className="ops-close" onClick={() => set({ opsOpen: false, placing: false })}>
          Kapat
        </button>
      </div>
    </header>
  )
}

function DayCard() {
  const clock = useSim((s) => s.clock)
  const task = useSim((s) => s.dayTask)
  const done = useSim((s) => s.dayDone)
  const paused = useSim((s) => s.paused)
  const set = useSim((s) => s.set)
  const progress = Math.min(1, Math.max(0, (clock - DAY_START) / (DAY_END - DAY_START)))
  const upcoming = getEngine()?.dayUpcoming(5) ?? []
  const backToPlanner = () => {
    getEngine()?.stopDay(false)
    set({ opsOpen: false, placing: false })
    window.setTimeout(() => navigate('planlayici'), 80)
  }
  return (
    <section className="ops-card" aria-labelledby="day-h">
      <div className="ops-card__head">
        <h2 id="day-h">Bir günün oynatılışı</h2>
        <span className="ops-muted">Planlayıcıdaki tarifeyle</span>
      </div>
      <p className="ops-phase" aria-live="polite">
        {done ? 'Gün tamamlandı' : task ?? 'Drone’lar istasyonda, şarj oluyor'}
      </p>
      <div className="ops-coverage">
        <div className="ops-coverage__bar">
          <span style={{ width: `${progress * 100}%` }} />
        </div>
        <span className="num">{fmtClock(clock)}</span>
      </div>
      {upcoming.length > 0 && (
        <>
          <h3 className="ops-sub">Sıradaki</h3>
          <ul className="ops-next">
            {upcoming.map((u, i) => (
              <li key={i} data-kind={u.kind}>
                <time className="num">{fmtClock(u.t)}</time>
                <span>{u.text}</span>
              </li>
            ))}
          </ul>
        </>
      )}
      <div className="ops-main-row">
        {done ? (
          <button type="button" className="btn btn--primary ops-main" onClick={() => getEngine()?.playDay(useSim.getState().speed)}>
            Tekrar oynat
          </button>
        ) : (
          <button type="button" className="btn ops-main" onClick={() => set({ paused: !paused })}>
            {paused ? 'Devam et' : 'Duraklat'}
          </button>
        )}
        <button type="button" className="btn ops-main" onClick={backToPlanner}>
          Planlayıcıya dön
        </button>
      </div>
      <button type="button" className="btn ops-btn ops-exit" onClick={() => getEngine()?.stopDay(true)}>
        Tek göreve geç (kule onayıyla)
      </button>
    </section>
  )
}

function MissionCard() {
  const phase = useSim((s) => s.phase)
  const missionId = useSim((s) => s.missionId)
  const reason = useSim((s) => s.abortReason)
  const drones = useSim((s) => s.drones)
  const report = useSim((s) => s.report)
  const set = useSim((s) => s.set)
  const idx = stepIndex(phase)
  const coverage = (drones[0].coverage + drones[1].coverage) / 2
  const failed = phase === 'blocked' || phase === 'aborted' || phase === 'return'

  let action: ReactNode
  switch (phase) {
    case 'idle':
      action = (
        <button type="button" className="btn btn--primary ops-main" onClick={() => e()?.requestApproval()}>
          Kule onayı iste
        </button>
      )
      break
    case 'awaiting':
    case 'preflight':
      action = (
        <button type="button" className="btn ops-main" disabled>
          {phase === 'awaiting' ? 'Kule ekranında bekliyor' : 'Ön kontroller yapılıyor'}
        </button>
      )
      break
    case 'flight':
      action = (
        <button type="button" className="btn ops-main ops-main--hold" onClick={() => e()?.recall()}>
          Kule: geri çağır
        </button>
      )
      break
    case 'done':
      action = (
        <div className="ops-main-row">
          <button type="button" className="btn btn--primary ops-main" onClick={() => set({ reportOpen: true })} disabled={!report}>
            Raporu aç
          </button>
          <button type="button" className="btn ops-main" onClick={() => e()?.newMission(false)}>
            Yeni görev
          </button>
        </div>
      )
      break
    case 'blocked':
    case 'aborted':
      action = (
        <button type="button" className="btn btn--primary ops-main" onClick={() => e()?.newMission(true)}>
          Yeni görev
        </button>
      )
      break
    default:
      action = (
        <button type="button" className="btn ops-main" disabled>
          {PHASE_LABEL[phase]}
        </button>
      )
  }

  return (
    <section className="ops-card" aria-labelledby="mission-h">
      <div className="ops-card__head">
        <h2 id="mission-h">Görev {missionId}</h2>
        <span className="ops-muted">Uçuş öncesi FOD taraması</span>
      </div>
      <p className={`ops-phase ${failed ? 'ops-phase--bad' : ''}`} aria-live="polite">
        {PHASE_LABEL[phase]}
        {reason && failed ? `: ${reason}` : ''}
      </p>
      <ol className="ops-steps">
        {STEPS.map((s, i) => (
          <li key={s} data-state={i < idx ? 'done' : i === idx ? (failed ? 'bad' : 'now') : 'todo'}>
            <span className="num">{i + 1}</span>
            {s}
          </li>
        ))}
      </ol>
      <div className="ops-coverage">
        <div className="ops-coverage__bar">
          <span style={{ width: `${coverage}%` }} />
        </div>
        <span className="num">Kapsama %{Math.round(coverage)}</span>
      </div>
      {action}
    </section>
  )
}

const FOD_TYPES: FodClass[] = ['bolt', 'stone', 'plastic', 'tire']

function RunwayCard() {
  const placing = useSim((s) => s.placing)
  const placeType = useSim((s) => s.placeType)
  const fodCount = useSim((s) => s.fodCount)
  const set = useSim((s) => s.set)
  return (
    <section className="ops-card" aria-labelledby="rwy-h">
      <div className="ops-card__head">
        <h2 id="rwy-h">Pist senaryosu</h2>
        <span className="ops-muted num">Pistte {fodCount} nesne</span>
      </div>
      <div className="seg seg--wide" role="group" aria-label="Nesne türü">
        {FOD_TYPES.map((t) => (
          <button key={t} type="button" aria-pressed={placeType === t} onClick={() => set({ placeType: t })}>
            {FOD_LABEL[t]}
          </button>
        ))}
      </div>
      <div className="ops-row">
        <button type="button" className={`btn ops-btn ${placing ? 'is-on' : ''}`} aria-pressed={placing} onClick={() => e()?.setPlacing(!placing)}>
          {placing ? 'Bırakmayı bitir' : 'Piste nesne bırak'}
        </button>
        <button type="button" className="btn ops-btn" onClick={() => e()?.clearFod()}>
          Pisti temizle
        </button>
      </div>
      {placing && <p className="ops-hint">Pist veya omuz üzerinde bir noktaya tıklayın. Görüntülerde nesneler görünürlük için ≈4 kat büyütülmüştür.</p>}
    </section>
  )
}

function EnvCard() {
  const clock = useSim((s) => s.clock)
  const wind = useSim((s) => s.wind)
  const phase = useSim((s) => s.phase)
  const set = useSim((s) => s.set)
  const dayMode = useSim((s) => s.dayMode)
  const canTime = !dayMode && ['idle', 'awaiting', 'blocked', 'done', 'aborted'].includes(phase)
  return (
    <section className="ops-card" aria-labelledby="env-h">
      <div className="ops-card__head">
        <h2 id="env-h">Ortam</h2>
      </div>
      <label className="ops-range">
        <span>
          Saat <b className="num">{fmtClock(clock)}</b>
        </span>
        <input
          type="range"
          min={5 * 3600}
          max={22 * 3600}
          step={60}
          value={Math.round(clock)}
          disabled={!canTime}
          onChange={(ev) => set({ clock: Number(ev.target.value) })}
        />
      </label>
      <label className="ops-range">
        <span>
          Rüzgâr <b className={`num ${wind > 8 ? 'is-bad' : ''}`}>{wind.toFixed(1).replace('.', ',')} m/s</b>
          <em>iniş-kalkış sınırı 8 m/s</em>
        </span>
        <input type="range" min={0} max={14} step={0.1} value={wind} disabled={dayMode} onChange={(ev) => set({ wind: Number(ev.target.value) })} />
        {dayMode && <span className="ops-hint">Gün oynatılırken rüzgâr planlayıcıdaki saatlik tahminden gelir.</span>}
      </label>
    </section>
  )
}

const CAMS: { id: CameraMode; label: string }[] = [
  { id: 'overview', label: 'Genel' },
  { id: 'follow1', label: 'D1 takip' },
  { id: 'follow2', label: 'D2 takip' },
  { id: 'tower', label: 'Kuleden' },
]

function CameraCard() {
  const mode = useSim((s) => s.cameraMode)
  return (
    <section className="ops-card" aria-labelledby="cam-h">
      <div className="ops-card__head">
        <h2 id="cam-h">Kamera</h2>
      </div>
      <div className="seg seg--wide" role="group" aria-label="Kamera">
        {CAMS.map((c) => (
          <button key={c.id} type="button" aria-pressed={mode === c.id} onClick={() => e()?.setCamera(c.id)}>
            {c.label}
          </button>
        ))}
      </div>
    </section>
  )
}

function FaultCard() {
  const phase = useSim((s) => s.phase)
  const flying = phase === 'flight'
  const faults = [
    { id: 'adsb' as const, label: 'ADS-B: yaklaşan hava aracı', desc: 'Tarifede olmayan bir helikopter yaklaşır; görev durur, drone’lar eve döner.', any: true },
    { id: 'link' as const, label: 'İletişim kaybı (D2)', desc: 'Drone pist dışındaki en yakın acil iniş noktasına iner; konumu FOD olarak bildirilir.' },
    { id: 'geofence' as const, label: 'Ani yan rüzgâr (D1)', desc: 'Drone sanal sınırı aşar; otomatik eve dönüş tetiklenir.' },
    { id: 'gnss' as const, label: 'GNSS karıştırma', desc: 'Çit dışından karıştırma: uçuştan önceyse hiçbir drone kalkmaz; havadaysa konum UWB + görsel + IMU ile sürer.', any: true },
    { id: 'spoof' as const, label: 'GNSS aldatma (D1)', desc: 'Sahte uydu sinyali: konum kaynakları uyuşmaz, sahte GNSS dışlanır.', any: true },
  ]
  return (
    <section className="ops-card" aria-labelledby="fault-h">
      <div className="ops-card__head">
        <h2 id="fault-h">Arıza laboratuvarı</h2>
      </div>
      <ul className="ops-faults">
        {faults.map((f) => (
          <li key={f.id}>
            <button type="button" className="btn ops-btn ops-btn--fault" disabled={!f.any && !flying} onClick={() => e()?.fault(f.id)}>
              {f.label}
            </button>
            <p>{f.desc}</p>
          </li>
        ))}
      </ul>
      {!flying && <p className="ops-hint">İletişim kaybı ve yan rüzgâr, drone’lar havadayken verilebilir. Karıştırma ve aldatmayı uçuştan önce verirseniz ön kontrolde görürsünüz.</p>}
    </section>
  )
}

function CameraFeed() {
  const slot = useRef<HTMLDivElement>(null)
  const pip = useSim((s) => s.pipDrone)
  const d = useSim((s) => s.drones[s.pipDrone - 1])
  const set = useSim((s) => s.set)
  useEffect(() => {
    e()?.setPipSlot(slot.current)
    return () => e()?.setPipSlot(null)
  }, [])
  const gsd = d.alt > 3 ? (footprint(d.alt).across / 8000) * 1000 : null
  return (
    <section className="ops-card ops-card--feed" aria-labelledby="feed-h">
      <div className="ops-card__head">
        <h2 id="feed-h">Drone kamerası</h2>
        <div className="seg" role="group" aria-label="Kamera akışı">
          {[1, 2].map((n) => (
            <button key={n} type="button" aria-pressed={pip === n} onClick={() => set({ pipDrone: n as 1 | 2 })}>
              D{n}
            </button>
          ))}
        </div>
      </div>
      <div className="pip" ref={slot}>
        <div className="pip__hud num">
          <span>D{pip}</span>
          <span>{d.alt.toFixed(0)} m</span>
          <span>{gsd ? `${gsd.toFixed(1).replace('.', ',')} mm/piksel` : 'yerde'}</span>
          <span>{d.speed.toFixed(1).replace('.', ',')} m/s</span>
          {d.mode === 'scan' && <span>geçiş {Math.min(3, Math.max(1, d.pass))}/3</span>}
        </div>
        {d.alt < 1 && <p className="pip__idle">Drone {pip} istasyonda. Kamera akışı kalkıştan sonra başlar.</p>}
        <span className="pip__tag">Simülasyon görüntüsü</span>
      </div>
    </section>
  )
}

function Telemetry() {
  const drones = useSim((s) => s.drones)
  return (
    <section className="ops-card" aria-labelledby="tel-h">
      <div className="ops-card__head">
        <h2 id="tel-h">Telemetri</h2>
      </div>
      <table className="ops-tel num">
        <thead>
          <tr>
            <th scope="col">Drone</th>
            <th scope="col">Durum</th>
            <th scope="col">Batarya</th>
            <th scope="col">İrtifa</th>
            <th scope="col">Kapsama</th>
          </tr>
        </thead>
        <tbody>
          {drones.map((d) => (
            <tr key={d.id} data-drone={d.id}>
              <th scope="row">D{d.id}</th>
              <td>{MODE_LABEL[d.mode]}</td>
              <td>
                <span className="ops-bat">
                  <span style={{ width: `${d.battery}%` }} />
                </span>
                %{Math.round(d.battery)}
              </td>
              <td>{d.alt.toFixed(0)} m</td>
              <td>%{Math.round(d.coverage)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

function Detections() {
  const dets = useSim((s) => s.detections)
  return (
    <section className="ops-card" aria-labelledby="det-h">
      <div className="ops-card__head">
        <h2 id="det-h">Tespitler</h2>
        <span className="ops-muted">Yapay zekâ önerir, insan karar verir</span>
      </div>
      {dets.length === 0 ? (
        <p className="ops-empty">Henüz tespit yok. Tarama başladığında drone kamerasında görülen nesneler burada listelenir.</p>
      ) : (
        <ul className="ops-dets">
          {dets.map((d) => (
            <li key={d.id} data-status={d.status}>
              {d.thumb && <img src={d.thumb} alt={`${d.label} tespit görüntüsü`} width={96} height={72} />}
              <div>
                <p className="ops-dets__title">
                  {d.label} <span className="num">%{Math.round(d.conf * 100)}</span>
                </p>
                <p className="ops-dets__pos">
                  D{d.drone}, {fmtClock(d.t, true)}. {describePosition(d.x, d.z)}
                </p>
                {d.status === 'pending' ? (
                  <div className="ops-row">
                    <button type="button" className="btn ops-btn ops-btn--sm" onClick={() => e()?.reviewDetection(d.id, 'confirmed')}>
                      Gerçek nesne
                    </button>
                    <button type="button" className="btn ops-btn ops-btn--sm" onClick={() => e()?.reviewDetection(d.id, 'rejected')}>
                      Yanlış alarm
                    </button>
                  </div>
                ) : d.status === 'confirmed' ? (
                  d.pickup === 'enroute' ? (
                    <p className="ops-dets__status">İşçi yolda: nesnenin 4 m üstünde asılı kalıp vinçle alacak</p>
                  ) : d.pickup === 'done' ? (
                    <p className="ops-dets__status">İşçi topladı; FOD kutusunda kayıtlı</p>
                  ) : d.pickup === 'denied' ? (
                    <p className="ops-dets__status">Saha ekibi kaldıracak: {d.pickupNote}</p>
                  ) : (
                    <div className="ops-row">
                      <button type="button" className="btn ops-btn ops-btn--sm" onClick={() => e()?.requestPickup(d.id)}>
                        İşçi ile topla
                      </button>
                      <span className="ops-muted">ya da saha ekibi kaldırır</span>
                    </div>
                  )
                ) : (
                  <p className="ops-dets__status">Yanlış alarm, eğitim etiketi oldu</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function EventLog() {
  const log = useSim((s) => s.log)
  const ref = useRef<HTMLOListElement>(null)
  useEffect(() => {
    const el = ref.current
    if (el) el.scrollTop = el.scrollHeight
  }, [log.length])
  return (
    <section className="ops-card ops-card--log" aria-labelledby="log-h">
      <div className="ops-card__head">
        <h2 id="log-h">Olay günlüğü</h2>
      </div>
      <ol className="ops-log" ref={ref} aria-live="polite">
        {log.map((l) => (
          <li key={l.id} data-kind={l.kind}>
            <time className="num">{fmtClock(l.t, true)}</time>
            <span className="ops-log__kind">{LOG_LABEL[l.kind]}</span>
            <span>{l.text}</span>
          </li>
        ))}
      </ol>
    </section>
  )
}

export default function OpsCenter() {
  const labels = useRef<HTMLDivElement>(null)
  const set = useSim((s) => s.set)
  const dayMode = useSim((s) => s.dayMode)

  useEffect(() => {
    e()?.setLabelLayer(labels.current)
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape' && !useSim.getState().reportOpen && useSim.getState().phase !== 'awaiting') set({ opsOpen: false, placing: false })
    }
    window.addEventListener('keydown', onKey)
    return () => {
      e()?.setLabelLayer(null)
      window.removeEventListener('keydown', onKey)
    }
  }, [set])

  return (
    <div className="ops" role="dialog" aria-modal="true" aria-label="Operasyon merkezi">
      <div className="sim-labels" ref={labels} />
      <TopBar />
      <aside className="ops-left" aria-label="Görev ve senaryo">
        {dayMode ? (
          <>
            <DayCard />
            <EnvCard />
            <CameraCard />
          </>
        ) : (
          <>
            <MissionCard />
            <RunwayCard />
            <EnvCard />
            <CameraCard />
            <FaultCard />
          </>
        )}
      </aside>
      <aside className="ops-right" aria-label="Canlı veri">
        <CameraFeed />
        <Telemetry />
        <Detections />
        <EventLog />
      </aside>
      <TowerModal />
      <ReportModal />
    </div>
  )
}
