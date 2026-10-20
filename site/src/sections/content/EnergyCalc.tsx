import { useState } from 'react'
import { CalcShell, Formula, Out, Slider, tr } from '../../components/Calc'

/*
  Enerji adası hesaplayıcı. Mini kovan varsayılanları rapordaki Tablo 6'yı aynen verir:
  tüketim 10 kWh/gün (3.650 kWh/yıl), tasarım yükü 4.745 kWh/yıl (%30 pay),
  üretim 5.400 + 3.150 ≈ 8.550 kWh/yıl → 1,8×, 20 kWh ile ≈1,5 gün, fazla ≈3.800 kWh → ≈21.000 km.
  Çanakkale kovanı (V3): 4 hücre, 2 nöbetçi direk (≈20 W, varsayım), bekçi ve işçi sortileri ve 6 kWp güneş:
  ≈16 kWh/gün, üretim ≈11.250 kWh/yıl → ≈1,5×, ≈1 gün. Kovanını kur hesaplayıcısıyla aynı hesap.
*/

const D = { pvKwp: 4, pvYield: 1350, turbineKw: 3, cf: 12, battery: 20, margin: 30, stationW: 100, serverW: 150, sorties: 20, cells: 2, mastW: 0, otherSorties: 0 }
const CKZ: typeof D = { ...D, pvKwp: 6, cells: 4, mastW: 40, otherSorties: 6 }
const COMMS_W = 25
const SORTIE_KWH = 0.05
const EV_KWH_PER_100 = 18

export function computeEnergy(v: typeof D) {
  const perDay = ((v.cells * v.stationW + v.serverW + COMMS_W + v.mastW) * 24) / 1000 + (v.sorties + v.otherSorties) * SORTIE_KWH
  const consumption = perDay * 365
  const design = consumption * (1 + v.margin / 100)
  const pv = v.pvKwp * v.pvYield
  const turbine = v.turbineKw * 8760 * (v.cf / 100)
  const production = pv + turbine
  const ratio = production / design
  const autonomy = v.battery / (design / 365)
  const surplus = Math.max(0, production - design)
  const evKm = (surplus / EV_KWH_PER_100) * 100
  return { perDay, consumption, design, pv, turbine, production, ratio, autonomy, surplus, evKm }
}

function EnergyBars({ r, margin }: { r: ReturnType<typeof computeEnergy>; margin: number }) {
  const max = Math.max(r.production, r.design) * 1.08
  const W = 620
  const L = 128
  const plot = W - L - 16
  const x = (v: number) => L + (v / max) * plot
  // rapordaki gibi: üretim kalemleri 50 kWh'e yuvarlanır, tüketim ve tasarım yükü tam gösterilir
  const shown = (v: number, cls: string) => (cls === 'eb__pv' || cls === 'eb__wind' ? Math.round(v / 50) * 50 : Math.round(v))
  const row = (y: number, label: string, segs: { v: number; cls: string; name: string }[], total: number) => {
    let acc = 0
    return (
      <g>
        <text className="eb__label" x={0} y={y + 17}>
          {label}
        </text>
        {segs.map((s, i) => {
          const x0 = x(acc)
          acc += s.v
          const w = Math.max(0, x(acc) - x0 - (i < segs.length - 1 ? 2 : 0))
          const fits = w > 86
          return (
            <g key={s.name}>
              <rect className={`eb__seg ${s.cls}`} x={x0} y={y} width={w} height={26} rx={i === segs.length - 1 ? 4 : 0} />
              {fits && (
                <text className="eb__in" x={x0 + 8} y={y + 18}>
                  {s.name} {tr(shown(s.v, s.cls))}
                </text>
              )}
            </g>
          )
        })}
        <text className="eb__total num" x={x(total) + 6} y={y + 18}>
          {segs[0].cls === 'eb__pv' ? `≈${tr(Math.round(total / 50) * 50)}` : tr(Math.round(total))}
        </text>
      </g>
    )
  }
  const ticks = [0, 2000, 4000, 6000, 8000, 10000, 12000, 14000].filter((t) => t <= max)
  return (
    <figure className="eb">
      <svg viewBox={`0 0 ${W} 132`} role="img" aria-label={`Yıllık üretim ${tr(r.production)} kWh, tasarım yükü ${tr(r.design)} kWh`}>
        {ticks.map((t) => (
          <g key={t}>
            <line className="eb__grid" x1={x(t)} x2={x(t)} y1={6} y2={102} />
            <text className="eb__tick num" x={x(t)} y={120} textAnchor="middle">
              {t === 0 ? '0' : `${t / 1000} bin`}
            </text>
          </g>
        ))}
        {row(
          14,
          'Üretim',
          [
            { v: r.pv, cls: 'eb__pv', name: 'güneş' },
            { v: r.turbine, cls: 'eb__wind', name: 'rüzgâr' },
          ],
          r.production,
        )}
        {row(
          60,
          'Tasarım yükü',
          [
            { v: r.consumption, cls: 'eb__use', name: 'tüketim' },
            { v: r.design - r.consumption, cls: 'eb__margin', name: `pay %${margin}` },
          ],
          r.design,
        )}
      </svg>
      <figcaption className="eb__legend">
        <span>
          <i className="eb__pv" /> güneş
        </span>
        <span>
          <i className="eb__wind" /> rüzgâr
        </span>
        <span>
          <i className="eb__use" /> tüketim
        </span>
        <span>
          <i className="eb__margin" /> güvenlik payı
        </span>
        <span className="eb__unit">kWh/yıl</span>
      </figcaption>
    </figure>
  )
}

export function EnergyCalc() {
  const [hive, setHive] = useState<'mini' | 'ckz'>('mini')
  const B = hive === 'ckz' ? CKZ : D
  const [v, setV] = useState(D)
  const set = (k: keyof typeof D) => (x: number) => setV((s) => ({ ...s, [k]: x }))
  const r = computeEnergy(v)
  const changed = (Object.keys(D) as (keyof typeof D)[]).some((k) => v[k] !== B[k])
  const pick = (h: 'mini' | 'ckz') => {
    setHive(h)
    setV(h === 'ckz' ? CKZ : D)
  }
  const ref = hive === 'ckz' ? { ratio: '≈1,5×', aut: '≈1 gün', day: '≈16 kWh/gün', prod: '≈11.250 kWh' } : { ratio: '1,8×', aut: '≈1,5 gün', day: '10 kWh/gün', prod: '≈8.550 kWh' }

  return (
    <CalcShell
      changed={changed}
      onReset={() => setV(B)}
      inputs={
        <>
          <div className="pseg" role="group" aria-label="Kovan boyu">
            <button type="button" aria-pressed={hive === 'mini'} onClick={() => pick('mini')}>
              Mini kovan (rapor v2)
            </button>
            <button type="button" aria-pressed={hive === 'ckz'} onClick={() => pick('ckz')}>
              Çanakkale kovanı
            </button>
          </div>
          <Slider label="Güneş paneli" unit="kWp" min={0} max={10} step={0.5} digits={1} value={v.pvKwp} reportValue={B.pvKwp} onChange={set('pvKwp')} />
          <Slider label="Güneş verimi" unit="kWh/kWp·yıl" min={1000} max={1600} step={25} value={v.pvYield} reportValue={D.pvYield} onChange={set('pvYield')} hint="Temkinli varsayım" />
          <Slider label="Dikey eksenli türbin" unit="kW" min={0} max={6} step={0.5} digits={1} value={v.turbineKw} reportValue={D.turbineKw} onChange={set('turbineKw')} />
          <Slider label="Türbin kapasite faktörü" unit="%" min={5} max={25} step={1} value={v.cf} reportValue={D.cf} onChange={set('cf')} hint="Türbülans nedeniyle bilerek düşük" />
          <Slider label="Batarya" unit="kWh" min={5} max={40} step={1} value={v.battery} reportValue={D.battery} onChange={set('battery')} />
          <Slider label="Petek hücresi" unit="" min={2} max={6} step={1} value={v.cells} reportValue={B.cells} onChange={set('cells')} hint="Her drone bir hücre" />
          <Slider label="Hücre iklimlendirme (her biri)" unit="W" min={50} max={250} step={10} value={v.stationW} reportValue={D.stationW} onChange={set('stationW')} hint="En büyük tüketim kalemi" />
          <Slider label="Kenar sunucu ve ağ" unit="W" min={50} max={300} step={10} value={v.serverW} reportValue={D.serverW} onChange={set('serverW')} />
          <Slider label="Günlük sorti (iki kâşif)" unit="" min={6} max={40} step={1} value={v.sorties} reportValue={D.sorties} onChange={set('sorties')} hint="Sorti başına ≈0,05 kWh, uzun görevler dahil" />
          {hive === 'ckz' && (
            <Slider label="Bekçi ve işçi sortisi" unit="" min={0} max={20} step={1} value={v.otherSorties} reportValue={CKZ.otherSorties} onChange={set('otherSorties')} hint="Varsayım: bekçi 4, işçi 2" />
          )}
          <Slider label="Güvenlik payı" unit="%" min={0} max={60} step={5} value={v.margin} reportValue={D.margin} onChange={set('margin')} />
        </>
      }
      outputs={
        <>
          <Out
            strong
            label="Yenilenebilir üretim / tasarım yükü"
            value={`${tr(r.ratio, 1)}×`}
            note={
              <>
                {hive === 'ckz' ? 'Çanakkale kovanı ' : 'Raporda '}
                {ref.ratio}.{' '}
                <span className={r.ratio >= 1 ? 'is-good' : 'is-bad'}>{r.ratio >= 1 ? 'Sistem tükettiğinden fazlasını üretiyor' : 'Üretim yükü karşılamıyor, şebeke gerekir'}</span>
              </>
            }
          />
          <Out strong label="Bataryayla özerklik" value={`${tr(r.autonomy, 1)} gün`} note={`${hive === 'ckz' ? 'Çanakkale kovanı' : 'Raporda'} ${ref.aut}. Sonrasında şebeke devreye girer.`} />
          <Out label="Günlük tüketim" value={`${tr(r.perDay, 1)} kWh`} note={`${hive === 'ckz' ? 'Çanakkale kovanı' : 'Raporda'} ${ref.day}`} />
          <Out label="Yıllık üretim" value={`≈${tr(Math.round(r.production / 50) * 50)} kWh`} note={`${hive === 'ckz' ? 'Çanakkale kovanı' : 'Raporda'} ${ref.prod}`} />
          <Out label="Fazla enerji" value={`≈${tr(Math.round(r.surplus / 100) * 100)} kWh/yıl`} note="Raporda ≈3.800 kWh" />
          <Out label="Fazlayla elektrikli saha aracı" value={`≈${tr(Math.round(r.evKm / 1000) * 1000)} km/yıl`} note="18 kWh/100 km; raporda ≈21.000 km" />
        </>
      }
      figure={
        <div className="scan-figs">
          <EnergyBars r={r} margin={v.margin} />
          <Formula>
            <p>
              <code>günlük tüketim = (hücre × iklimlendirme + sunucu + 25 W haberleşme + nöbetçi direkler) × 24 sa + sorti × 0,05 kWh</code> = {tr(r.perDay, 2)} kWh
            </p>
            <p>
              <code>tasarım yükü = tüketim × 365 × (1 + pay)</code> = {tr(r.design)} kWh/yıl
            </p>
            <p>
              <code>güneş = kWp × verim</code> = {tr(r.pv)} kWh, <code>rüzgâr = kW × 8.760 sa × kapasite faktörü</code> = {tr(r.turbine)} kWh
            </p>
            <p>
              <code>özerklik = batarya ÷ (tasarım yükü ÷ 365)</code> = {tr(r.autonomy, 2)} gün
            </p>
            <p>Aylık üretim–tüketim dengesi pilot öncesinde yerel ölçüm verileriyle ayrıntılandırılacak; yıllık oran kış aylarındaki açığı göstermez.</p>
          </Formula>
        </div>
      }
    />
  )
}
