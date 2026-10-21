import { useState } from 'react'
import { CalcShell, Formula, Out, Slider, tr } from '../../components/Calc'
import { PARAMS } from '../../data/facts'

/*
  Hizmet olarak drone (Tablo 8 ve Bölüm 11). Varsayılanlar:
  ilk kurulum ≈124 bin $ (±%20), yıllık işletme ≈14 bin $, sonraki havalimanlarında kurulum ≈90 bin $,
  beş yıla yayılmış yıllık maliyet ≈39 bin $. Abonelik fiyatı pilot sonrası netleşir.
*/

const MINI = PARAMS.cost.items.reduce((s, i) => s + i.usd, 0) // 124.000
/** Çanakkale kovanı (V3 ön tahmini): mini kovana eklenen hücre ve yetenekler */
const HIVE_ITEMS = [
  { label: 'Bekçi hücresi (drone + istasyon + hoparlör ve ışık)', usd: 20000 },
  { label: 'İşçi hücresi (M350 sınıfı + istasyon + vinç ve başlık)', usd: 35000 },
  { label: 'Nöbetçi kameralar (2 direk)', usd: 14000 },
  { label: 'Güvenli konum (RF izleme, UWB, RTK baz)', usd: 12000 },
  { label: 'Kovan yazılımı (çok kastlı görev dağıtımı)', usd: 10000 },
  { label: 'Ek güneş paneli (4 → 6 kWp)', usd: 2500 },
]
const CKZ = MINI + HIVE_ITEMS.reduce((s, i) => s + i.usd, 0) // ≈217.500
type Hive = 'mini' | 'ckz'
const BASE: Record<Hive, { capex: number; next: number; opex: number; report: string }> = {
  mini: { capex: MINI, next: PARAMS.cost.nextAirport, opex: PARAMS.cost.opexPerYear, report: 'Raporda ≈39 bin $/yıl' },
  // sonraki havalimanında yazılım geliştirme (35 bin $) ve kovan yazılımı (10 bin $) tekrarlanmaz
  ckz: { capex: CKZ, next: CKZ - 45000, opex: 19000, report: 'V3 ön tahmini ≈63 bin $/yıl' },
}
const D: { opex: number; years: number; airports: number } = { opex: PARAMS.cost.opexPerYear, years: PARAMS.cost.contractYears, airports: 1 }
const k = (usd: number) => `${tr(Math.round(usd / 1000))} bin $`

export function computeBusiness(v: typeof D, hive: Hive = 'mini') {
  const B = BASE[hive]
  const CAPEX = B.capex
  const first = (CAPEX + v.opex * v.years) / v.years
  const next = (B.next + v.opex * v.years) / v.years
  const low = (CAPEX * 0.8 + v.opex * v.years) / v.years
  const high = (CAPEX * 1.2 + v.opex * v.years) / v.years
  const programCapex = CAPEX + B.next * (v.airports - 1)
  const programTotal = programCapex + v.opex * v.years * v.airports
  const avg = programTotal / (v.airports * v.years)
  return { first, next, low, high, programCapex, programTotal, avg }
}

function CostBars({ hive }: { hive: Hive }) {
  const items = [...PARAMS.cost.items, ...(hive === 'ckz' ? HIVE_ITEMS : [])].sort((a, b) => b.usd - a.usd)
  const CAPEX = BASE[hive].capex
  const max = items[0].usd * 1.15
  return (
    <figure className="hb">
      <ul className="hb__list">
        {items.map((i) => (
          <li key={i.label}>
            <span className="hb__name">{i.label}</span>
            <span className="hb__track">
              <span className="hb__bar" style={{ width: `${(i.usd / max) * 100}%` }} />
              <span className="hb__val num">{k(i.usd)}</span>
            </span>
          </li>
        ))}
      </ul>
      <figcaption>
        Havalimanı başına ilk kurulum: toplam <b className="num">≈{k(CAPEX)}</b>, 2026 piyasa koşullarında tahmin, {hive === 'ckz' ? '±%30' : '±%20'} belirsizlik
      </figcaption>
    </figure>
  )
}

export function BusinessCalc() {
  const [hive, setHive] = useState<Hive>('mini')
  const base = { ...D, opex: BASE[hive].opex }
  const [v, setV] = useState(D)
  const set = (key: keyof typeof D) => (x: number) => setV((s) => ({ ...s, [key]: x }))
  const r = computeBusiness(v, hive)
  const changed = (Object.keys(D) as (keyof typeof D)[]).some((key) => v[key] !== base[key])
  const pick = (h: Hive) => {
    setHive(h)
    setV({ ...D, opex: BASE[h].opex })
  }
  const CAPEX = BASE[hive].capex

  return (
    <div className="biz">
      <div className="biz__model">
        <div>
          <h3>Havalimanı</h3>
          <p>Kurulum parası ödemez. Beş yıllık sözleşmeyle yıllık abonelik öder.</p>
        </div>
        <div>
          <h3>AERO-GUARD</h3>
          <p>Donanım, kurulum, bakım ve yazılım güncellemeleri bizde. Yazılım bir kez geliştirildiği için ikinci havalimanında kurulum düşer (mini kovanda ≈90 bin $).</p>
        </div>
        <div>
          <h3>Hedef pazar</h3>
          <p>DHMİ’nin işlettiği düşük trafikli bölgesel havalimanları ve benzer ölçekteki yurt dışı havalimanları.</p>
        </div>
      </div>

      <CalcShell
        changed={changed}
        onReset={() => setV(base)}
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
            <Slider label="Yıllık işletme gideri" unit="bin $" min={8} max={30} step={1} value={v.opex / 1000} reportValue={base.opex / 1000} onChange={(x) => set('opex')(x * 1000)} hint="Bakım, yedek parça, yazılım, sigorta, haberleşme" />
            <Slider label="Sözleşme süresi" unit="yıl" min={3} max={10} step={1} value={v.years} reportValue={D.years} onChange={set('years')} />
            <Slider label="Havalimanı sayısı" unit="" min={1} max={20} step={1} value={v.airports} reportValue={D.airports} onChange={set('airports')} hint={`İlk kurulum ${k(CAPEX)}, sonrakiler ${k(BASE[hive].next)}`} />
          </>
        }
        outputs={
          <>
            <Out
              strong
              label={`İlk havalimanı, ${v.years} yıla yayılmış yıllık maliyet`}
              value={`≈${k(r.first)}`}
              note={`${BASE[hive].report}. ±%20 kurulum belirsizliğiyle ${k(r.low)}–${k(r.high)}`}
            />
            <Out strong label="Sonraki her havalimanı, yıllık" value={`≈${k(r.next)}`} note="Yazılım geliştirme tekrarlanmaz" />
            <Out label={`${v.airports} havalimanı, toplam kurulum`} value={`≈${k(r.programCapex)}`} />
            <Out label="Havalimanı başına ortalama yıllık maliyet" value={`≈${k(r.avg)}`} />
          </>
        }
        figure={
          <div className="scan-figs">
            <CostBars hive={hive} />
            <Formula>
              <p>
                <code>yıllık maliyet = (kurulum + yıllık işletme × yıl) ÷ yıl</code> = ({k(CAPEX)} + {k(v.opex)} × {v.years}) ÷ {v.years} = {k(r.first)}
              </p>
              <p>Abonelik fiyatı bu maliyetin üzerine kurulacak; kesin fiyat pilot sonrası netleşir. Burada yalnızca maliyet gösteriliyor.</p>
            </Formula>
          </div>
        }
      />
    </div>
  )
}
