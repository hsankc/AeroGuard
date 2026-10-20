import { useState } from 'react'
import { Fact } from '../../components/Fact'
import { href } from '../../app/router'
import { useSim } from '../../sim/store'

/*
  Türbin ve enerji adası (Sistem sayfası).
  Güç eğrisi temsilidir (kesin değerler üretici seçimine göre). Ek 14 değerleri (140 m şerit, 1:7 geçiş yüzeyi)
  güncel baskıdan doğrulanacak; kesin yer DHMİ mânia görüşüyle belirlenir.
*/

const CUT_IN = 3
const RATED = 12
const CUT_OUT = 25
const RATED_KW = 3
const TURBINE_H = 9
const STRIP = 140
const SLOPE = 7

/** Temsili güç eğrisi (kW): devreye girişten nominale kübik artış, korumada durur. */
export function turbinePower(v: number) {
  if (v < CUT_IN || v >= CUT_OUT) return 0
  if (v >= RATED) return RATED_KW
  return (RATED_KW * (v ** 3 - CUT_IN ** 3)) / (RATED ** 3 - CUT_IN ** 3)
}

const allowedHeight = (d: number) => Math.max(0, (d - STRIP) / SLOPE)
const fmt1 = (n: number) => n.toLocaleString('tr-TR', { maximumFractionDigits: 1, minimumFractionDigits: 1 })

function PowerCurve({ v }: { v: number }) {
  const W = 420
  const H = 190
  const pad = { l: 34, r: 12, t: 14, b: 28 }
  const x = (s: number) => pad.l + (s / 30) * (W - pad.l - pad.r)
  const y = (p: number) => H - pad.b - (p / RATED_KW) * (H - pad.t - pad.b)
  const pts: string[] = []
  for (let s = 0; s <= 30; s += 0.25) pts.push(`${x(s).toFixed(1)},${y(turbinePower(s)).toFixed(1)}`)
  const p = turbinePower(v)
  return (
    <svg className="es-curve" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Temsili güç eğrisi. ${fmt1(v)} m/s rüzgârda ${fmt1(p)} kW`}>
      {[0, 1, 2, 3].map((k) => (
        <g key={k}>
          <line className="es-curve__grid" x1={pad.l} x2={W - pad.r} y1={y(k)} y2={y(k)} />
          <text className="es-curve__tick" x={pad.l - 8} y={y(k) + 4} textAnchor="end">
            {k}
          </text>
        </g>
      ))}
      {[0, 3, 12, 25, 30].map((s) => (
        <text key={s} className="es-curve__tick" x={x(s)} y={H - 8} textAnchor="middle">
          {s}
        </text>
      ))}
      <rect className="es-curve__band" x={x(CUT_OUT)} y={pad.t} width={x(30) - x(CUT_OUT)} height={H - pad.t - pad.b} />
      <polyline className="es-curve__line" points={pts.join(' ')} />
      <line className="es-curve__cursor" x1={x(v)} x2={x(v)} y1={pad.t} y2={H - pad.b} />
      <circle className="es-curve__dot" cx={x(v)} cy={y(p)} r={5} />
      <text className="es-curve__axis" x={x(CUT_OUT) - 8} y={H - pad.b - 8} textAnchor="end">
        rüzgâr, m/s
      </text>
      <text className="es-curve__axis" x={pad.l + 4} y={pad.t + 10}>
        kW
      </text>
      <text className="es-curve__axis" x={(x(CUT_OUT) + x(30)) / 2} y={pad.t + 28} textAnchor="middle">
        koruma
      </text>
    </svg>
  )
}

function Placement({ d }: { d: number }) {
  const W = 420
  const H = 170
  const x0 = 28
  const scale = (W - x0 - 16) / 420 // 0–420 m
  const ground = H - 30
  const hScale = 3.2 // dikey abartma
  const X = (m: number) => x0 + m * scale
  const Y = (h: number) => ground - h * hScale
  const ok = allowedHeight(d) >= TURBINE_H
  return (
    <svg className="es-place" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Kesit: pist merkezinden ${d} m uzaklıkta izin verilen yükseklik ${fmt1(allowedHeight(d))} m`}>
      <rect className="es-place__strip" x={X(0)} y={Y(0) - 4} width={X(STRIP) - X(0)} height={8} />
      <rect className="es-place__rwy" x={X(0)} y={Y(0) - 4} width={X(22.5) - X(0)} height={8} />
      <line className="es-place__ground" x1={x0 - 10} x2={W - 8} y1={ground} y2={ground} />
      <polyline className="es-place__surface" points={`${X(STRIP)},${Y(0)} ${X(420)},${Y((420 - STRIP) / SLOPE)}`} />
      <text className="es-place__label" x={X(4)} y={Y(0) + 20}>
        pist ekseni
      </text>
      <text className="es-place__label" x={X(STRIP)} y={Y(0) + 20} textAnchor="middle">
        şerit 140 m
      </text>
      <text className="es-place__label" x={X(330)} y={Y((330 - STRIP) / SLOPE) - 10} textAnchor="middle">
        geçiş yüzeyi 1:7
      </text>
      <g className={ok ? 'es-place__turbine' : 'es-place__turbine is-bad'}>
        <line x1={X(d)} x2={X(d)} y1={Y(0)} y2={Y(TURBINE_H)} />
        <rect x={X(d) - 5} y={Y(TURBINE_H)} width={10} height={TURBINE_H * hScale * 0.42} rx={3} />
      </g>
      <line className="es-place__limit" x1={X(d) - 14} x2={X(d) + 14} y1={Y(allowedHeight(d))} y2={Y(allowedHeight(d))} />
    </svg>
  )
}

export function EnergyStory() {
  const simWind = useSim((s) => s.wind)
  const [v, setV] = useState(8)
  const [d, setD] = useState(250)
  const p = turbinePower(v)
  const h = allowedHeight(d)
  const ok = h >= TURBINE_H
  return (
    <div className="es">
      <div className="bento">
        <div className="tile tile--w4 glass glass--soft">
          <span className="tile__label">Neden dikey eksen</span>
          <ul className="es__list">
            <li>Rüzgâr yönü değişince dönmesi gerekmez; Çanakkale’de rüzgâr sık yön değiştirir.</li>
            <li>Düşük devirli, sessiz ve kompakt.</li>
            <li>Bakım noktaları yere yakın; bakım için yüksekte çalışma gerekmez.</li>
          </ul>
        </div>
        <div className="tile tile--w8 glass glass--soft es__curve">
          <span className="tile__label">Güç eğrisi (temsili)</span>
          <PowerCurve v={v} />
          <div className="es__ctrl">
            <label>
              Rüzgâr <b className="num">{fmt1(v)} m/s</b>
              <input type="range" min={0} max={30} step={0.5} value={v} onChange={(e) => setV(Number(e.target.value))} />
            </label>
            <span className="es__out num">{fmt1(p)} kW</span>
            <button type="button" className="pbtn pbtn--quiet" onClick={() => setV(Math.round(simWind * 2) / 2)}>
              3D sahnedeki rüzgâr ({fmt1(simWind)} m/s)
            </button>
          </div>
          <p className="es__note">
            Devreye girme ≈3 m/s, nominal güç ≈12 m/s’de <Fact id="turbine" />, korumaya geçiş ≈25 m/s. Yıllık hesapta kapasite faktörü temkinli olarak %12 alınır.
          </p>
        </div>
        <div className="tile tile--w7 glass glass--soft">
          <span className="tile__label">Nereye kurulur</span>
          <Placement d={d} />
          <div className="es__ctrl">
            <label>
              Pist merkezine uzaklık <b className="num">{d} m</b>
              <input type="range" min={150} max={420} step={5} value={d} onChange={(e) => setD(Number(e.target.value))} />
            </label>
            <span className={`es__verdict ${ok ? 'is-ok' : 'is-bad'}`}>
              İzin verilen ≈{fmt1(h)} m · türbin ≈{TURBINE_H} m · {ok ? 'uygun' : 'uygun değil'}
            </span>
          </div>
          <p className="es__note">
            Türbin pist şeridinin dışında ve geçiş yüzeyinin altında kalmalı: 250 m’de ≈(250 − 140) ÷ 7 ≈ 15,7 m. Ek 14 değerleri güncel baskıdan doğrulanacak; kesin yer DHMİ mânia görüşü ve radar
            etki analiziyle belirlenir.
          </p>
        </div>
        <div className="tile tile--w5 glass glass--soft">
          <span className="tile__label">Kovanın balı</span>
          <span className="tile__value">
            <Fact id="energyRatio" />
          </span>
          <span className="tile__text">
            <Fact id="pv" /> güneş ve <Fact id="turbine" /> türbin, <Fact id="battery" /> LFP bataryayı doldurur; batarya bütün hücreleri besler, şebeke yedekte. Bir sorti ≈0,04–0,05 kWh; en büyük
            tüketim hücre iklimlendirmesi. Bekçi ve işçi hücreleri yükü artırır, bu yüzden enerji hesabı kovan boyuna göre yeniden yapılacak.
          </span>
          <a className="tile__foot" href={href('etki', 'enerji')}>
            Enerji hesaplayıcısını aç
          </a>
        </div>
      </div>
    </div>
  )
}
