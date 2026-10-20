import { useEffect, useMemo, useRef, useState, type PointerEvent as RPointerEvent, type KeyboardEvent as RKeyboardEvent } from 'react'
import { actual, DAY_END, DAY_START, fmt, MIN, RESERVE, SAW_DAILY, TASK_SPEC, WIND_LIMIT, WIND_PRESETS, type Task, type TaskType } from './plan'
import { usePlanner } from './store'
import { useSim } from '../sim/store'
import { getEngine } from '../sim/engine'
import './planner.css'

/*
  Tarifeye duyarlı planlayıcı: 05:00–24:00 zaman çizelgesi.
  Satır sırası sunumdaki Şekil 3 ile aynı. Her satırın etiketi kimliği taşır; renk ikincil.
*/

const LANES: { id: 'moves' | 'wind' | TaskType | 'battery'; label: string; h: number }[] = [
  { id: 'moves', label: 'Ticari hareketler', h: 64 },
  { id: 'wind', label: 'Rüzgâr', h: 64 },
  { id: 'fod', label: 'FOD taraması', h: 38 },
  { id: 'fence', label: 'Çit devriyesi', h: 38 },
  { id: 'health', label: 'Pist sağlığı', h: 38 },
  { id: 'wildlife', label: 'Yaban hayatı', h: 38 },
  { id: 'battery', label: 'Drone bataryası', h: 72 },
]
const LABEL_W = 132
const AXIS_H = 26
const PAD_R = 14
const WIND_MAX = 14

const TYPE_LANE: Record<TaskType, TaskType> = { opening: 'fod', fod: 'fod', fence: 'fence', health: 'health', wildlife: 'wildlife' }
const STATUS_TEXT: Record<Task['status'], string> = {
  ok: 'Planlandı',
  wind: 'Rüzgâr: araçla',
  nowindow: 'Pencere yok: araçla',
  battery: 'Şarj yetersiz',
}

type Tip = { x: number; y: number; title: string; lines: string[] }

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [w, setW] = useState(1000)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setW(Math.max(860, Math.floor(e.contentRect.width))))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, w] as const
}

export function Planner() {
  const p = usePlanner()
  const { plan, movements, wind, airport } = p
  const busy = airport === 'saw'
  const [wrapRef, W] = useWidth<HTMLDivElement>()
  const [tip, setTip] = useState<Tip | null>(null)
  const [showTable, setShowTable] = useState(false)
  const [dayRate, setDayRate] = useState(300)
  const svgRef = useRef<SVGSVGElement>(null)
  const drag = useRef<{ kind: 'move'; id: string; delay: number } | { kind: 'wind'; hour: number } | null>(null)

  const plotW = W - LABEL_W - PAD_R
  const x = (t: number) => LABEL_W + ((t - DAY_START) / (DAY_END - DAY_START)) * plotW
  const tAt = (px: number) => DAY_START + ((px - LABEL_W) / plotW) * (DAY_END - DAY_START)

  const laneY = useMemo(() => {
    const out: Record<string, { y: number; h: number }> = {}
    let y = AXIS_H
    for (const l of LANES) {
      out[l.id] = { y, h: l.h }
      y += l.h
    }
    out.total = { y, h: 0 }
    return out
  }, [])
  const H = laneY.total.y + AXIS_H
  const plotTop = laneY.moves.y
  const plotBottom = laneY.total.y

  const svgPoint = (e: { clientX: number; clientY: number }) => {
    const r = svgRef.current!.getBoundingClientRect()
    return { px: e.clientX - r.left, py: e.clientY - r.top }
  }

  const onPointerMove = (e: RPointerEvent<SVGSVGElement>) => {
    const d = drag.current
    if (!d) return
    const { px, py } = svgPoint(e)
    if (d.kind === 'move') p.moveTo(d.id, tAt(px) - d.delay)
    else {
      const lane = laneY.wind
      const v = ((lane.y + lane.h - 8 - py) / (lane.h - 14)) * WIND_MAX
      p.setWind(d.hour, v)
    }
  }
  const endDrag = () => (drag.current = null)

  const showTip = (e: { clientX: number; clientY: number }, title: string, lines: string[]) => {
    const r = wrapRef.current!.getBoundingClientRect()
    setTip({ x: e.clientX - r.left + wrapRef.current!.scrollLeft, y: e.clientY - r.top, title, lines })
  }
  const showTipAt = (el: Element, title: string, lines: string[]) => {
    const b = el.getBoundingClientRect()
    showTip({ clientX: b.left + b.width / 2, clientY: b.top }, title, lines)
  }

  const taskTip = (t: Task) => {
    const m = movements.find((mm) => mm.id === t.movementId)
    return {
      title: `${TASK_SPEC[t.type].name}: ${fmt(t.start)}–${fmt(t.end)}`,
      lines: [
        STATUS_TEXT[t.status] + (t.reason ? `. ${t.reason}` : ''),
        t.label,
        ...(m ? [`Drone’lar ${fmt(t.end)} itibarıyla istasyonda, hareket ${fmt(actual(m))}`] : []),
        `İki drone, batarya kullanımı ≈%${TASK_SPEC[t.type].battery}`,
      ],
    }
  }

  // hareket etiketleri çakışmasın: yakın komşularda dikey konumu değiştir
  const sortedMoves = useMemo(() => [...movements].sort((a, b) => actual(a) - actual(b)), [movements])
  const labelRow = useMemo(() => {
    const rows: Record<string, number> = {}
    let lastX = -1e9
    let row = 0
    for (const m of sortedMoves) {
      const xx = x(actual(m))
      row = xx - lastX < 46 ? 1 - row : 0
      rows[m.id] = row
      lastX = xx
    }
    return rows
  }, [sortedMoves, W])

  const sel = movements.find((m) => m.id === p.selectedId) ?? null
  const s = plan.stats
  const meets = s.completion >= 0.85

  const playDay = () => {
    const e = getEngine()
    useSim.getState().set({ opsOpen: true })
    // operasyon merkezi açıldıktan sonra günü başlat
    window.setTimeout(() => (e ?? getEngine())?.playDay(dayRate), 60)
  }

  const hours = Array.from({ length: (DAY_END - DAY_START) / 3600 + 1 }, (_, i) => DAY_START / 3600 + i)

  return (
    <div className="planner">
      <div className="planner__filters" role="group" aria-label="Senaryo">
        <div className="pseg" role="group" aria-label="Havalimanı">
          <button type="button" aria-pressed={!busy} onClick={() => p.setAirport('ckz')}>
            Çanakkale
          </button>
          <button type="button" aria-pressed={busy} onClick={() => p.setAirport('saw')}>
            Sabiha Gökçen modu
          </button>
        </div>
        <label className="planner__select">
          <span>Rüzgâr</span>
          <select
            value={p.windPreset}
            onChange={(e) => {
              const pr = WIND_PRESETS.find((w) => w.id === e.target.value)
              if (pr) p.setWindAll(pr.wind(), pr.id)
            }}
          >
            {WIND_PRESETS.map((w) => (
              <option key={w.id} value={w.id}>
                {w.label}
              </option>
            ))}
            {p.windPreset === 'custom' && <option value="custom">Elle ayarlandı</option>}
          </select>
        </label>
        <label className="planner__check">
          <input type="checkbox" checked={p.healthDay} onChange={(e) => p.setHealthDay(e.target.checked)} />
          Bugün pist sağlığı günü (haftada 1)
        </label>
        <div className="planner__filters-end">
          {!busy && (
            <button type="button" className="pbtn" onClick={p.add}>
              Sefer ekle
            </button>
          )}
          <button type="button" className="pbtn" onClick={p.reset}>
            Sıfırla
          </button>
        </div>
      </div>

      {busy && (
        <div className="planner__callout" role="status">
          <p>
            <b>Sabiha Gökçen: günde ≈{SAW_DAILY} hareket</b>, iki hareket arası ortalama {Math.round((19 * 3600) / SAW_DAILY)} saniye. Uçuş öncesi tarama için gereken 18
            dakikalık boşluk gün boyunca bir kez bile oluşmuyor. Yoğun havalimanlarında bu iş için sabit sistemler (FODRAD gibi) zaten kurulu; AERO-GUARD’ın yeri bölgesel
            havalimanları.
          </p>
          <p className="planner__callout-src">28 milyon yolcu (Ocak–Temmuz 2026) ÷ 212 gün ÷ ≈150 yolcu/hareket. Çanakkale için kullanılan yöntemin aynısı.</p>
          <button type="button" className="pbtn" onClick={() => p.setAirport('ckz')}>
            Çanakkale’ye dön
          </button>
        </div>
      )}

      <dl className="planner__kpis">
        <div>
          <dt>Planlanan görevlerin gerçekleşmesi</dt>
          <dd>%{Math.round(s.completion * 100)}</dd>
          <p className={meets ? 'is-good' : 'is-bad'}>
            <span aria-hidden="true">{meets ? '✓' : '!'}</span> hedef ≥ %85{meets ? ', sağlanıyor' : ', sağlanmıyor'}
          </p>
        </div>
        <div>
          <dt>Drone başına sorti</dt>
          <dd>{s.sorties}</dd>
          <p>raporda günde 9–10</p>
        </div>
        <div>
          <dt>Drone şarj enerjisi</dt>
          <dd>{s.energyKwh.toFixed(1).replace('.', ',')} kWh</dd>
          <p>günlük, iki drone</p>
        </div>
        <div>
          <dt>Araçla denetlenen hareket</dt>
          <dd>{s.vehicle}</dd>
          <p>
            {s.fodPlanned} uçuş öncesi taramadan {s.fodDone} drone ile
          </p>
        </div>
      </dl>

      <div className="planner__chart" ref={wrapRef} onPointerLeave={() => setTip(null)}>
        <svg
          ref={svgRef}
          width={W}
          height={H}
          role="img"
          aria-label="Bir günlük görev planı zaman çizelgesi. Ayrıntılar için tablo görünümünü kullanın."
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          {/* gece */}
          <rect className="pc-night" x={x(DAY_START)} y={plotTop} width={x(plan.sunrise) - x(DAY_START)} height={plotBottom - plotTop} />
          <rect className="pc-night" x={x(plan.sunset)} y={plotTop} width={x(DAY_END) - x(plan.sunset)} height={plotBottom - plotTop} />
          <text className="pc-sun" x={x(plan.sunrise)} y={AXIS_H - 9} textAnchor="middle">
            gün doğumu {fmt(plan.sunrise)}
          </text>
          <text className="pc-sun" x={x(plan.sunset)} y={AXIS_H - 9} textAnchor="middle">
            gün batımı {fmt(plan.sunset)}
          </text>

          {/* saat çizgileri ve şerit ayraçları */}
          {hours.map((h) => (
            <line key={h} className="pc-grid" x1={x(h * 3600)} x2={x(h * 3600)} y1={plotTop} y2={plotBottom} />
          ))}
          {LANES.map((l) => (
            <g key={l.id}>
              <line className="pc-lane" x1={0} x2={W - PAD_R} y1={laneY[l.id].y} y2={laneY[l.id].y} />
              <text className="pc-label" x={0} y={laneY[l.id].y + laneY[l.id].h / 2 + 5}>
                {l.label}
              </text>
            </g>
          ))}
          <line className="pc-lane" x1={0} x2={W - PAD_R} y1={plotBottom} y2={plotBottom} />

          {/* pist kullanımda: hareketin −5/+5 dk çevresi */}
          {plan.blocks
            .filter((b) => b.end > DAY_START)
            .map((b) => (
              <rect
                key={`blk-${b.movementId}`}
                className="pc-block"
                x={x(Math.max(DAY_START, b.start))}
                y={plotTop}
                width={Math.max(busy ? 0.6 : 1.5, x(b.end) - x(Math.max(DAY_START, b.start)))}
                height={laneY.battery.y - plotTop}
              />
            ))}

          {/* rüzgâr */}
          {(() => {
            const lane = laneY.wind
            const base = lane.y + lane.h - 8
            const scale = (lane.h - 14) / WIND_MAX
            const ly = base - WIND_LIMIT * scale
            return (
              <g>
                <line className="pc-limit" x1={LABEL_W} x2={W - PAD_R} y1={ly} y2={ly} />
                <text className="pc-small" x={LABEL_W - 6} y={ly + 4} textAnchor="end">
                  8 m/s
                </text>
                {hours.slice(0, -1).map((h) => {
                  const v = wind[h] ?? 0
                  const cx = x(h * 3600 + 1800)
                  const bw = Math.min(22, x(3600) - x(0) - 4)
                  const bh = Math.max(2, v * scale)
                  const over = v > WIND_LIMIT
                  return (
                    <g key={h}>
                      <path
                        className={over ? 'pc-wind is-over' : 'pc-wind'}
                        d={`M${cx - bw / 2},${base} v${-(bh - 4)} q0,-4 4,-4 h${bw - 8} q4,0 4,4 v${bh - 4} z`}
                      />
                      <rect
                        className="pc-hit"
                        x={cx - (x(3600) - x(0)) / 2}
                        y={lane.y}
                        width={x(3600) - x(0)}
                        height={lane.h}
                        role="slider"
                        tabIndex={0}
                        aria-label={`Rüzgâr ${String(h).padStart(2, '0')}:00`}
                        aria-valuemin={0}
                        aria-valuemax={WIND_MAX}
                        aria-valuenow={v}
                        aria-valuetext={`${v.toFixed(1).replace('.', ',')} m/s`}
                        onPointerDown={(e) => {
                          drag.current = { kind: 'wind', hour: h }
                          ;(e.target as Element).setPointerCapture?.(e.pointerId)
                          svgRef.current?.setPointerCapture(e.pointerId)
                          onPointerMove(e as unknown as RPointerEvent<SVGSVGElement>)
                        }}
                        onPointerMove={(e) =>
                          !drag.current &&
                          showTip(e, `${String(h).padStart(2, '0')}:00–${String(h + 1).padStart(2, '0')}:00 rüzgâr`, [
                            `${v.toFixed(1).replace('.', ',')} m/s${over ? ', iniş-kalkış sınırının üzerinde: drone görevi yok' : ''}`,
                            'Sürükleyerek veya ok tuşlarıyla değiştirin',
                          ])
                        }
                        onFocus={(e) =>
                          showTipAt(e.target as Element, `${String(h).padStart(2, '0')}:00 rüzgâr`, [`${v.toFixed(1).replace('.', ',')} m/s`])
                        }
                        onKeyDown={(e: RKeyboardEvent) => {
                          if (e.key === 'ArrowUp' || e.key === 'ArrowRight') p.setWind(h, v + 0.5)
                          else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') p.setWind(h, v - 0.5)
                          else return
                          e.preventDefault()
                        }}
                      />
                    </g>
                  )
                })}
              </g>
            )
          })()}

          {/* görevler */}
          {busy
            ? (['fod', 'fence', 'health', 'wildlife'] as const).map((lane) => {
                const L = laneY[lane]
                return (
                  <g key={lane}>
                    <rect className="pc-void" x={LABEL_W + 2} y={L.y + L.h / 2 - 8} width={plotW - 4} height={16} rx={4} />
                    <text className="pc-void-text" x={LABEL_W + plotW / 2} y={L.y + L.h / 2 + 4} textAnchor="middle">
                      {lane === 'fod' ? `Yapılabilen tarama: ${s.fodDone} / ${s.fodPlanned}. Pist hiç boş kalmıyor.` : 'Uygun boşluk yok'}
                    </text>
                  </g>
                )
              })
            : plan.tasks.map((t) => {
                const L = laneY[TYPE_LANE[t.type]]
                const x0 = x(t.start)
                const w = Math.max(6, x(t.end) - x0)
                const cy = L.y + L.h / 2
                const ok = t.status === 'ok'
                const tt = taskTip(t)
                const under = t.type === 'opening' ? 'açılış' : t.type === 'wildlife' ? t.label.toLowerCase() : t.type === 'health' ? 'haftalık' : !ok ? 'araçla' : null
                return (
                  <g key={t.id}>
                    <rect className={`pc-task pc-task--${TYPE_LANE[t.type]} ${ok ? '' : 'is-off'}`} x={x0} y={cy - 8} width={w} height={16} rx={4} />
                    {!ok && (
                      <text className="pc-x" x={x0 + w / 2} y={cy + 4} textAnchor="middle" aria-hidden="true">
                        ✕
                      </text>
                    )}
                    {under && (
                      <text className="pc-small" x={x0 + w / 2} y={cy + 20} textAnchor="middle">
                        {under}
                      </text>
                    )}
                    <rect
                      className="pc-hit"
                      x={x0 + w / 2 - Math.max(24, w) / 2}
                      y={L.y + 2}
                      width={Math.max(24, w)}
                      height={L.h - 4}
                      tabIndex={0}
                      role="img"
                      aria-label={`${tt.title}. ${tt.lines[0]}`}
                      onPointerMove={(e) => showTip(e, tt.title, tt.lines)}
                      onFocus={(e) => showTipAt(e.target as Element, tt.title, tt.lines)}
                      onBlur={() => setTip(null)}
                    />
                  </g>
                )
              })}

          {/* ticari hareketler */}
          {(() => {
            const L = laneY.moves
            const cy = L.y + L.h - 18
            if (busy)
              return (
                <g>
                  {movements
                    .filter((m) => actual(m) >= DAY_START)
                    .map((m) => (
                      <line key={m.id} className="pc-tick" x1={x(actual(m))} x2={x(actual(m))} y1={cy - 9} y2={cy + 9} />
                    ))}
                  <text className="pc-small" x={LABEL_W + 4} y={L.y + 14}>
                    her çizgi bir hareket
                  </text>
                </g>
              )
            return sortedMoves.map((m) => {
              const ax = x(actual(m))
              const px = x(m.planned)
              const selected = m.id === p.selectedId
              const tri = (cx: number) => (m.kind === 'arr' ? `M${cx - 7},${cy - 6} h14 l-7,12 z` : `M${cx - 7},${cy + 6} h14 l-7,-12 z`)
              const ly = L.y + 13 + labelRow[m.id] * 13
              return (
                <g key={m.id} className={selected ? 'pc-move is-selected' : 'pc-move'}>
                  {m.delay > 0 && (
                    <>
                      <path className="pc-ghost" d={tri(px)} />
                      <line className="pc-delay" x1={px + 7} x2={ax - 8} y1={cy} y2={cy} />
                    </>
                  )}
                  <path className="pc-tri" d={tri(ax)} />
                  <text className="pc-mtime" x={ax} y={ly} textAnchor="middle">
                    {fmt(actual(m))}
                  </text>
                  <rect
                    className="pc-hit pc-drag"
                    x={ax - 14}
                    y={L.y + 2}
                    width={28}
                    height={L.h - 4}
                    role="button"
                    tabIndex={0}
                    aria-pressed={selected}
                    aria-label={`${m.label} ${fmt(actual(m))}${m.delay ? `, planlanan ${fmt(m.planned)}` : ''}. Sürükleyin veya ok tuşlarıyla 5 dakika kaydırın.`}
                    onPointerDown={(e) => {
                      p.select(m.id)
                      drag.current = { kind: 'move', id: m.id, delay: m.delay }
                      svgRef.current?.setPointerCapture(e.pointerId)
                      setTip(null)
                    }}
                    onPointerMove={(e) =>
                      !drag.current &&
                      showTip(e, `${m.label} ${fmt(actual(m))}`, [
                        m.delay ? `Planlanan ${fmt(m.planned)}, ${m.delay / MIN} dk gecikme` : 'Zamanında',
                        'Sürükleyerek saatini değiştirin',
                      ])
                    }
                    onFocus={() => p.select(m.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'ArrowRight') p.moveTo(m.id, m.planned + 5 * MIN)
                      else if (e.key === 'ArrowLeft') p.moveTo(m.id, m.planned - 5 * MIN)
                      else if (e.key === 'Delete') p.remove(m.id)
                      else return
                      e.preventDefault()
                    }}
                  />
                </g>
              )
            })
          })()}

          {/* batarya (iki drone aynı görevleri uçtuğu için tek çizgi) */}
          {(() => {
            const L = laneY.battery
            const yv = (v: number) => L.y + 8 + (1 - v / 100) * (L.h - 16)
            const pts = plan.battery[1]
            const d = pts.length ? pts.map(([t, v], i) => `${i ? 'L' : 'M'}${x(Math.max(DAY_START, t)).toFixed(1)},${yv(v).toFixed(1)}`).join(' ') : ''
            return (
              <g>
                <line className="pc-limit pc-limit--soft" x1={LABEL_W} x2={W - PAD_R} y1={yv(RESERVE)} y2={yv(RESERVE)} />
                <text className="pc-small" x={LABEL_W - 6} y={yv(RESERVE) + 4} textAnchor="end">
                  %20 yedek
                </text>
                <text className="pc-small" x={LABEL_W - 6} y={yv(100) + 4} textAnchor="end">
                  %100
                </text>
                <path className="pc-battery" d={d} />
              </g>
            )
          })()}

          {/* saat ekseni */}
          {hours.map((h) =>
            h % 2 === 0 || W > 1100 ? (
              <text key={h} className="pc-axis" x={x(h * 3600)} y={plotBottom + 17} textAnchor="middle">
                {String(h % 24).padStart(2, '0')}:00
              </text>
            ) : null,
          )}
        </svg>

        {tip && (
          <div className="planner__tip" style={{ left: tip.x, top: tip.y }} role="tooltip">
            <strong>{tip.title}</strong>
            {tip.lines.map((l, i) => (
              <span key={i}>{l}</span>
            ))}
          </div>
        )}
      </div>

      <div className="planner__legend" aria-hidden="true">
        <span>
          <i className="lg-tri lg-tri--arr" /> geliş
        </span>
        <span>
          <i className="lg-tri lg-tri--dep" /> kalkış
        </span>
        <span>
          <i className="lg-block" /> pist kullanımda: hareketin 5 dk öncesi ve sonrası, drone uçmaz
        </span>
        <span>
          <i className="lg-off" /> yapılamayan görev, pist araçla denetlenir
        </span>
        <span>
          <i className="lg-night" /> gece
        </span>
      </div>

      {!busy && (
        <div className="planner__editor" aria-live="polite">
          {sel ? (
            <>
              <p className="planner__sel">
                <b>{sel.label}</b> planlanan <span className="num">{fmt(sel.planned)}</span>
                {sel.delay > 0 && (
                  <>
                    , gerçekleşen <span className="num">{fmt(actual(sel))}</span> ({sel.delay / MIN} dk gecikme)
                  </>
                )}
              </p>
              <div className="planner__actions">
                <button type="button" className="pbtn" onClick={() => p.addDelay(sel.id, 10)}>
                  10 dk gecikme ekle
                </button>
                <button type="button" className="pbtn" onClick={() => p.addDelay(sel.id, 25)}>
                  25 dk gecikme ekle
                </button>
                {sel.delay > 0 && (
                  <button type="button" className="pbtn" onClick={() => p.clearDelay(sel.id)}>
                    Gecikmeyi kaldır
                  </button>
                )}
                <button type="button" className="pbtn" onClick={() => p.toggleKind(sel.id)}>
                  {sel.kind === 'arr' ? 'Kalkışa çevir' : 'Gelişe çevir'}
                </button>
                <button type="button" className="pbtn pbtn--quiet" onClick={() => p.remove(sel.id)}>
                  Seferi kaldır
                </button>
              </div>
            </>
          ) : (
            <p className="planner__sel">Bir seferi seçmek için çizelgedeki üçgene tıklayın; sürükleyerek saatini değiştirebilirsiniz.</p>
          )}
        </div>
      )}

      <div className="planner__foot">
        <div className="planner__play">
          <button type="button" className="btn btn--primary" onClick={playDay} disabled={busy}>
            Bu günü 3D’de oynat
          </button>
          <label className="planner__select">
            <span>Hız</span>
            <select value={dayRate} onChange={(e) => setDayRate(Number(e.target.value))}>
              <option value={120}>120× (≈2,5 dk/saat)</option>
              <option value={300}>300× (≈1 dk/saat)</option>
              <option value={600}>600× (≈30 sn/saat)</option>
            </select>
          </label>
          {busy && <span className="planner__note">Sabiha Gökçen modunda oynatma yok: drone’un uçabileceği bir an yok.</span>}
        </div>
        <button type="button" className="pbtn" aria-expanded={showTable} onClick={() => setShowTable((v) => !v)}>
          {showTable ? 'Tabloyu gizle' : 'Tablo olarak göster'}
        </button>
      </div>

      {showTable && (
        <table className="planner__table">
          <caption className="visually-hidden">Görev planı</caption>
          <thead>
            <tr>
              <th scope="col">Saat</th>
              <th scope="col">Görev</th>
              <th scope="col">Durum</th>
              <th scope="col">Not</th>
            </tr>
          </thead>
          <tbody>
            {(busy ? plan.tasks.filter((t) => t.type !== 'fod').concat(plan.tasks.filter((t) => t.type === 'fod').slice(0, 12)) : plan.tasks).map((t) => (
              <tr key={t.id} data-status={t.status}>
                <td className="num">
                  {fmt(t.start)}–{fmt(t.end)}
                </td>
                <td>
                  {TASK_SPEC[t.type].name}, {t.label}
                </td>
                <td>{STATUS_TEXT[t.status]}</td>
                <td>{t.reason ?? ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <ul className="planner__rules">
        <li>Uçuş öncesi tarama hareketten 18 dk önce başlar (≈12,4 dk); drone’lar hareketten en az 5 dk önce istasyondadır.</li>
        <li>Gecikme bildirildiğinde tarama gerçekleşen saate göre kendiliğinden kayar.</li>
        <li>Rüzgâr 8 m/s’yi aşan saatte drone kalkmaz; o hareketin denetimi bugünkü gibi araçla yapılır.</li>
        <li>Çit devriyesi, pist sağlığı ve yaban hayatı görevleri en yakın uygun boşluğa yerleşir; her görevden sonra en az %20 batarya kalır.</li>
      </ul>
    </div>
  )
}
