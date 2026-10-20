import { useState } from 'react'
import { CalcShell, Formula, Out, Slider, tr } from '../../components/Calc'
import { PARAMS } from '../../data/facts'

/*
  Tarama hesaplayıcı. Varsayılanlar rapordaki Tablo 4'ü aynen verir:
  20 m → ≈28 m iz, ≈3,5 mm/piksel, 3 geçiş, 3 cm nesne ≈8–9 piksel, ≈12 dk.
  Süre modeli 3D simülasyonla aynıdır (kalkış, transit, dönüşler, iniş ve kapaklar dahil).
*/

const D = { alt: 20, hfov: 70, px: 8000, overlap: 20, speed: 6, target: 3 }
const WIDTH = PARAMS.scan.width // 60 m
const HALF = PARAMS.scan.halfLength // 1.175 m
const TRANSIT = 1300 // iki uçtaki transit toplamı (m), 12 m/s
const OVERHEAD_FIXED = 16 // kapak açma + kapama (s)

export function computeScan(v: typeof D) {
  const rad = (v.hfov * Math.PI) / 180
  const across = 2 * v.alt * Math.tan(rad / 2)
  const gsd = (across * 1000) / v.px // mm/piksel
  const objPx = (v.target * 10) / gsd
  const lane = across * (1 - v.overlap / 100)
  const passes = across >= WIDTH ? 1 : Math.ceil((WIDTH - across) / lane - 1e-9) + 1
  const turns = (passes - 1) * Math.PI * (lane / 2)
  const path = passes * HALF + turns
  const time = (passes * HALF) / v.speed + turns / 4 + TRANSIT / 12 + OVERHEAD_FIXED + v.alt / 3 + v.alt / 1.6
  return { across, gsd, objPx, lane, passes, path, time }
}

function StripFigure({ across, lane, passes }: { across: number; lane: number; passes: number }) {
  // 60 m tarama genişliğinin kesiti: omuz 7,5 + pist 45 + omuz 7,5; her geçişin izi ayrı satırda
  const scale = 7 // px / m
  const pad = 60
  const total = Math.max(WIDTH, across + (passes - 1) * lane)
  const W = pad * 2 + total * scale
  const start = WIDTH / 2 - (across + (passes - 1) * lane) / 2 // merkezlenmiş geçişler
  const x = (m: number) => pad + (m + (total - WIDTH) / 2) * scale
  return (
    <svg className="scan-strip" viewBox={`0 0 ${W} ${70 + passes * 26}`} role="img" aria-label={`${passes} geçiş, her biri ${tr(across, 1)} m iz`}>
      <rect className="scan-strip__shoulder" x={x(0)} y={10} width={WIDTH * scale} height={30} />
      <rect className="scan-strip__runway" x={x(7.5)} y={10} width={45 * scale} height={30} />
      <text className="scan-strip__t" x={x(30)} y={30} textAnchor="middle">
        pist 45 m
      </text>
      <text className="scan-strip__t scan-strip__t--muted" x={x(3.75)} y={56} textAnchor="middle">
        omuz
      </text>
      <text className="scan-strip__t scan-strip__t--muted" x={x(56.25)} y={56} textAnchor="middle">
        omuz
      </text>
      {Array.from({ length: passes }, (_, i) => {
        const s = start + i * lane
        return (
          <g key={i}>
            <rect className="scan-strip__fp" x={x(s)} y={66 + i * 26} width={across * scale} height={18} rx={4} />
            <text className="scan-strip__t scan-strip__t--in" x={x(s) + 8} y={79 + i * 26}>
              {i + 1}. geçiş
            </text>
          </g>
        )
      })}
    </svg>
  )
}

function PixelFigure({ gsd, target }: { gsd: number; target: number }) {
  // 3 cm'lik cıvatanın kamera pikselleri üzerindeki izi (gerçek ölçekte: 1 hücre = 1 piksel)
  const box = 60 // mm
  const n = Math.min(40, Math.max(4, Math.round(box / gsd)))
  const cell = 240 / n
  const L = target * 10 // mm
  const Wd = L / 3
  const cx = box / 2
  const cy = box / 2
  const cells: { i: number; j: number }[] = []
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++) {
      const x0 = i * gsd
      const y0 = j * gsd
      const ox = Math.max(0, Math.min(x0 + gsd, cx + L / 2) - Math.max(x0, cx - L / 2))
      const oy = Math.max(0, Math.min(y0 + gsd, cy + Wd / 2) - Math.max(y0, cy - Wd / 2))
      if (ox * oy > 0.25 * gsd * gsd) cells.push({ i, j })
    }
  const k = 240 / (n * gsd) // mm → px
  return (
    <svg className="scan-px" viewBox="0 0 240 240" role="img" aria-label={`${target} cm nesne yaklaşık ${cells.length} pikseli kaplıyor`}>
      <rect className="scan-px__bg" x={0} y={0} width={240} height={240} />
      {cells.map(({ i, j }) => (
        <rect key={`${i}-${j}`} className="scan-px__on" x={i * cell} y={j * cell} width={cell} height={cell} />
      ))}
      {Array.from({ length: n + 1 }, (_, i) => (
        <g key={i}>
          <line className="scan-px__grid" x1={i * cell} x2={i * cell} y1={0} y2={240} />
          <line className="scan-px__grid" y1={i * cell} y2={i * cell} x1={0} x2={240} />
        </g>
      ))}
      <rect className="scan-px__obj" x={(cx - L / 2) * k} y={(cy - Wd / 2) * k} width={L * k} height={Wd * k} rx={2} />
    </svg>
  )
}

export function ScanCalc() {
  const [v, setV] = useState(D)
  const set = (k: keyof typeof D) => (x: number) => setV((s) => ({ ...s, [k]: x }))
  const r = computeScan(v)
  const changed = (Object.keys(D) as (keyof typeof D)[]).some((k) => v[k] !== D[k])
  const minutes = r.time / 60
  const pxOk = r.objPx >= 8

  return (
    <CalcShell
      changed={changed}
      onReset={() => setV(D)}
      inputs={
        <>
          <Slider label="Uçuş irtifası" unit="m" min={10} max={30} step={1} value={v.alt} reportValue={D.alt} onChange={set('alt')} hint="Sanal sınır tavanı 30 m" />
          <Slider label="Kameranın yatay görüş açısı" unit="°" min={50} max={90} step={1} value={v.hfov} reportValue={D.hfov} onChange={set('hfov')} />
          <Slider label="Kameranın yatay çözünürlüğü" unit="piksel" min={4000} max={8000} step={500} value={v.px} reportValue={D.px} onChange={set('px')} hint="48 MP sensör ≈ 8.000 piksel" />
          <Slider label="Yan bindirme" unit="%" min={0} max={40} step={5} value={v.overlap} reportValue={D.overlap} onChange={set('overlap')} />
          <Slider label="Tarama hızı" unit="m/s" min={3} max={10} step={0.5} digits={1} value={v.speed} reportValue={D.speed} onChange={set('speed')} hint="Hareket bulanıklığını sınırlamak için yavaş" />
          <Slider label="Hedef nesne boyutu" unit="cm" min={1} max={10} step={0.5} digits={1} value={v.target} reportValue={D.target} onChange={set('target')} />
        </>
      }
      outputs={
        <>
          <Out
            strong
            label="İki drone ile tam pist taraması"
            value={`≈${tr(minutes, 1)} dk`}
            note={
              <>
                Raporda ≈12 dk. Pilot hedefi ≤ 15 dk:{' '}
                <span className={minutes <= 15 ? 'is-good' : 'is-bad'}>{minutes <= 15 ? 'sağlanıyor' : 'aşılıyor'}</span>
              </>
            }
          />
          <Out
            strong
            label={`${tr(v.target, 1)} cm’lik nesnenin görüntüdeki boyu`}
            value={`≈${tr(r.objPx, 1)} piksel`}
            note={
              <>
                Raporda 8–9 piksel:{' '}
                <span className={pxOk ? 'is-good' : 'is-bad'}>{pxOk ? 'aralıkta veya üzerinde' : 'altında, tespit zorlaşır'}</span>
              </>
            }
          />
          <Out label="Kamera iz genişliği" value={`≈${tr(r.across, 1)} m`} />
          <Out label="Piksel başına yer çözünürlüğü" value={`≈${tr(r.gsd, 1)} mm`} />
          <Out label="Drone başına geçiş" value={`${r.passes} geçiş`} note={`60 m genişlik, şerit aralığı ${tr(r.lane, 1)} m`} />
          <Out
            label="Drone başına tarama yolu"
            value={`≈${tr(r.path / 1000, 1)} km`}
            note="Raporda ≈3,8 km; fark dönüş yarıçapı varsayımından (burada şerit aralığının yarısı)"
          />
        </>
      }
      figure={
        <div className="scan-figs">
          <figure>
            <StripFigure across={r.across} lane={r.lane} passes={r.passes} />
            <figcaption>Tarama genişliğinin kesiti: her drone pistin yarısını bu geçişlerle tarar.</figcaption>
          </figure>
          <figure>
            <PixelFigure gsd={r.gsd} target={v.target} />
            <figcaption>Kamera ne görür: her kare bir piksel ({tr(r.gsd, 1)} mm). Çerçeve, {tr(v.target, 1)} cm’lik cıvatanın gerçek boyutu.</figcaption>
          </figure>
          <Formula>
            <p>
              <code>iz = 2 × irtifa × tan(görüş açısı ÷ 2)</code> = 2 × {v.alt} × tan({v.hfov / 2}°) = {tr(r.across, 1)} m
            </p>
            <p>
              <code>çözünürlük = iz ÷ piksel</code> = {tr(r.across * 1000, 0)} mm ÷ {tr(v.px)} = {tr(r.gsd, 2)} mm/piksel
            </p>
            <p>
              <code>geçiş = ⌈(60 − iz) ÷ (iz × (1 − bindirme))⌉ + 1</code> = {r.passes}
            </p>
            <p>
              <code>süre = geçiş × 1.175 m ÷ hız + dönüşler + ≈1.300 m transit (12 m/s) + kalkış, iniş ve kapaklar</code>
            </p>
            <p>Süre modeli sitedeki 3D simülasyonla aynıdır; varsayılan değerlerde simülasyon 12 dk 24 sn ölçer.</p>
          </Formula>
        </div>
      }
    />
  )
}
