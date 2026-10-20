import { useMemo, useState } from 'react'

/*
  Kovanını kur: hücre ekleyip çıkararak kurulum, yıllık maliyet, tarama süresi, enerji yükü ve
  yeteneklerin nasıl değiştiğini gösterir.
  Maliyet kalemleri V3 planındaki ön tahminlerdir (±%30): mini kovan 124 bin $; bekçi hücresi 20, işçi hücresi 35,
  bakıcı rolü 5, nöbetçi kameralar 14, güvenli konum 12, çok kastlı kovan yazılımı 10, ek kâşif 20 bin $.
  Yıllık işletme: mini 14 bin $, Çanakkale 19 bin $; aradaki fark ek kurulumla orantılı dağıtılır.
  Enerji: hücre iklimlendirmesi ≈100 W, kenar sunucu ≈150 W, iletişim ≈25 W, nöbetçi direk ≈20 W (varsayım),
  sorti ≈0,05 kWh; üretim 4 kWp güneş + 3 kW türbin ≈8.550 kWh/yıl; tasarım yükü = tüketim × 1,3.
  Ek güneş paneli rapordaki birim fiyatla: 4 kWp = 5 bin $.
*/

type Config = { scouts: number; guard: boolean; worker: boolean; nurse: boolean; sentinel: boolean; safeNav: boolean; pv: number }

const PRESETS: { id: string; name: string; c: Config }[] = [
  { id: 'mini', name: 'Mini kovan (v2)', c: { scouts: 2, guard: false, worker: false, nurse: false, sentinel: false, safeNav: false, pv: 4 } },
  // 4 hücreli kovanda 4 kWp ile oran ≈1,1× kalır: güneş paneli 6 kWp'ye büyütülür (≈1,5×)
  { id: 'ckz', name: 'Çanakkale kovanı', c: { scouts: 2, guard: true, worker: true, nurse: false, sentinel: true, safeNav: true, pv: 6 } },
  { id: 'winter', name: 'Kış kovanı', c: { scouts: 2, guard: true, worker: true, nurse: true, sentinel: true, safeNav: true, pv: 6 } },
  { id: 'wide', name: 'Geniş kovan', c: { scouts: 4, guard: true, worker: true, nurse: false, sentinel: true, safeNav: true, pv: 8 } },
]

const SCAN_MIN: Record<number, string> = { 2: '≈12', 3: '≈9', 4: '≈8' }
const PV_KWH_PER_KWP = 1350
const TURBINE_KWH = 3150
const BATTERY_KWH = 20

export function computeHive(c: Config) {
  const pvKwp = c.pv
  const items: [string, number][] = [['Mini kovan: 2 kâşif, 2 hücre, enerji adası', 124]]
  if (c.scouts > 2) items.push([`Ek kâşif × ${c.scouts - 2}`, 20 * (c.scouts - 2)])
  if (c.guard) items.push(['Bekçi hücresi', 20])
  if (c.worker) items.push(['İşçi hücresi', 35])
  if (c.worker && c.nurse) items.push(['Bakıcı rolü (yazılım, kalibrasyon)', 5])
  if (c.sentinel) items.push(['Nöbetçi kameralar (2 direk)', 14])
  if (c.safeNav) items.push(['Güvenli konum (RF izleme, UWB, RTK)', 12])
  if (c.guard || c.worker) items.push(['Kovan yazılımı (çok kastlı görev dağıtımı)', 10])
  if (pvKwp > 4) items.push([`Ek güneş paneli (+${pvKwp - 4} kWp)`, 1.25 * (pvKwp - 4)])
  const capex = items.reduce((s, [, v]) => s + v, 0)
  const opex = 14 + 0.055 * (capex - 124)
  const yearly = (capex + 5 * opex) / 5

  const cells = c.scouts + (c.guard ? 1 : 0) + (c.worker ? 1 : 0)
  // kâşif sayısı artınca her kâşif pistin daha küçük bir payını tarar: toplam mesafe, dolayısıyla enerji aynı kalır
  const scoutKwh = 20 * 0.05
  const otherSorties = (c.guard ? 4 : 0) + (c.worker ? 2 : 0) + (c.worker && c.nurse ? 1 : 0)
  const parts: [string, number][] = [
    [`Hücre iklimlendirmesi (${cells} × 100 W)`, cells * 2.4],
    ['Kenar sunucu (150 W)', 3.6],
    ['İletişim (25 W)', 0.6],
  ]
  if (c.sentinel) parts.push(['Nöbetçi direkler (2 × 20 W)', 0.96])
  parts.push(['Kâşif sortileri (toplam tarama mesafesi sabit)', scoutKwh])
  if (otherSorties) parts.push([`Bekçi ve işçi sortileri (${otherSorties} × 0,05 kWh)`, otherSorties * 0.05])
  const daily = parts.reduce((s, [, v]) => s + v, 0)
  const production = pvKwp * PV_KWH_PER_KWP + TURBINE_KWH
  const ratio = production / (daily * 365 * 1.3)
  const autonomy = BATTERY_KWH / (daily * 1.3)

  const caps = [
    { name: 'Uçuş öncesi FOD taraması', on: true },
    { name: 'Pist sağlığı ve GRF desteği', on: true },
    { name: 'Yaban hayatı caydırma ve çit devriyesi', on: c.guard, else: 'kâşifler sırayla yapar, taramayla aynı anda değil' },
    { name: 'Nesne toplama (≤ 1 kg)', on: c.worker, else: 'saha ekibi toplar' },
    { name: 'Buz haritası (TRL 3–4)', on: c.worker && c.nurse, else: c.worker ? 'bakıcı rolü eklenmeli' : 'işçi gövdesi gerekir' },
    { name: 'Acil durumu ilk fark etme', on: c.sentinel, else: 'drone’lar uçak hareketinde yerde' },
    { name: 'Karıştırma ve aldatmaya dayanıklı konum', on: c.safeNav, else: 'yalnızca GNSS + RTK' },
  ]
  return { items, capex, opex, yearly, cells, parts, daily, production, ratio, autonomy, caps }
}

const k = (n: number) => `≈${Math.round(n)} bin $`
const f1 = (n: number) => n.toLocaleString('tr-TR', { maximumFractionDigits: 1, minimumFractionDigits: 1 })

/** İki petek, her biri 6 hücre yuvası: dolu hücreler kast renginde */
function PetekMap({ c }: { c: Config }) {
  const A: (string | null)[] = ['scout', c.guard ? 'guard' : null, c.scouts >= 3 ? 'scout' : null, null, null, null]
  const B: (string | null)[] = ['scout', c.worker ? (c.nurse ? 'nurse' : 'worker') : null, c.scouts >= 4 ? 'scout' : null, null, null, null]
  const R = 20
  const w = Math.sqrt(3) * R
  const slots = [
    [0, 0],
    [w, 0],
    [w / 2, R * 1.5],
    [-w / 2, R * 1.5],
    [w * 1.5, R * 1.5],
    [w * 2, 0],
  ]
  const hex = (cx: number, cy: number) =>
    Array.from({ length: 6 }, (_, i) => {
      const a = (Math.PI / 3) * i - Math.PI / 2
      return `${(cx + R * 0.94 * Math.cos(a)).toFixed(1)},${(cy + R * 0.94 * Math.sin(a)).toFixed(1)}`
    }).join(' ')
  const color: Record<string, string> = { scout: 'var(--caste-scout)', guard: 'var(--caste-guard)', worker: 'var(--caste-worker)', nurse: 'var(--caste-nurse)' }
  const petek = (cells: (string | null)[], ox: number, label: string) => (
    <g transform={`translate(${ox} 34)`}>
      <text className="hb-map__label" x={w} y={-14} textAnchor="middle">
        {label}
      </text>
      {slots.map(([x, y], i) => {
        const cl = cells[i]
        return <polygon key={i} points={hex(x, y)} className={cl ? 'hb-map__cell is-on' : 'hb-map__cell'} style={cl ? { ['--c' as string]: color[cl] } : undefined} />
      })}
      {c.sentinel && <circle className="hb-map__mast" cx={-w / 2} cy={-2} r={5} />}
    </g>
  )
  return (
    <svg className="hb-map" viewBox="0 0 300 110" role="img" aria-label={`Petek A ve Petek B: toplam ${c.scouts + (c.guard ? 1 : 0) + (c.worker ? 1 : 0)} dolu hücre`}>
      {petek(A, 30, 'Petek A · 04')}
      {petek(B, 175, 'Petek B · 22')}
    </svg>
  )
}

export function HiveBuilder() {
  const [c, setC] = useState<Config>(PRESETS[1].c)
  const r = useMemo(() => computeHive(c), [c])
  const preset = PRESETS.find((p) => JSON.stringify(p.c) === JSON.stringify(c))
  const set = (p: Partial<Config>) => setC((x) => ({ ...x, ...p, nurse: (p.worker ?? x.worker) ? (p.nurse ?? x.nurse) : false }))
  const toggle = (key: keyof Omit<Config, 'scouts' | 'pv'>, label: string, disabled = false) => (
    <label className={`hb__toggle ${disabled ? 'is-disabled' : ''}`}>
      <input type="checkbox" checked={c[key]} disabled={disabled} onChange={(e) => set({ [key]: e.target.checked })} />
      <span>{label}</span>
    </label>
  )

  return (
    <div className="hb">
      <div className="hb__presets pseg" role="group" aria-label="Hazır kovanlar">
        {PRESETS.map((p) => (
          <button key={p.id} type="button" aria-pressed={preset?.id === p.id} onClick={() => setC(p.c)}>
            {p.name}
          </button>
        ))}
      </div>

      <div className="hb__grid">
        <div className="hb__controls glass glass--soft">
          <PetekMap c={c} />
          <div className="hb__scouts">
            <span>Kâşif</span>
            <div className="hb__stepper">
              <button type="button" onClick={() => set({ scouts: Math.max(2, c.scouts - 1) })} disabled={c.scouts <= 2} aria-label="Kâşif azalt">
                −
              </button>
              <b className="num">{c.scouts}</b>
              <button type="button" onClick={() => set({ scouts: Math.min(4, c.scouts + 1) })} disabled={c.scouts >= 4} aria-label="Kâşif ekle">
                +
              </button>
            </div>
          </div>
          {toggle('guard', 'Bekçi hücresi')}
          {toggle('worker', 'İşçi hücresi')}
          {toggle('nurse', 'Bakıcı rolü (işçinin kamera başlığı)', !c.worker)}
          {toggle('sentinel', 'Nöbetçi kameralar')}
          {toggle('safeNav', 'Güvenli konum')}
          <label className="hb__pv">
            <span>
              Güneş paneli <b className="num">{c.pv} kWp</b>
            </span>
            <input type="range" min={4} max={10} step={1} value={c.pv} onChange={(e) => set({ pv: Number(e.target.value) })} />
          </label>
        </div>

        <div className="hb__out">
          <div className="bento">
            <div className="tile tile--w4 glass glass--soft">
              <span className="tile__label">Kurulum</span>
              <span className="tile__value num">{k(r.capex)}</span>
              <span className="tile__text">ön tahmin, ±%30</span>
            </div>
            <div className="tile tile--w4 glass glass--soft">
              <span className="tile__label">Beş yıla yayılmış yıllık</span>
              <span className="tile__value num">{k(r.yearly)}</span>
              <span className="tile__text">işletme {k(r.opex)}/yıl dahil</span>
            </div>
            <div className="tile tile--w4 glass glass--soft">
              <span className="tile__label">Tam pist taraması</span>
              <span className="tile__value num">{SCAN_MIN[c.scouts]} dk</span>
              <span className="tile__text">{c.scouts} kâşif, her biri pistin 1/{c.scouts}’ini üç geçişle</span>
            </div>
            <div className="tile tile--w6 glass glass--soft">
              <span className="tile__label">Enerji: üretim / tasarım yükü</span>
              <span className={`tile__value num ${r.ratio < 1.3 ? 'hb__warn' : ''}`}>{f1(r.ratio)}×</span>
              <span className="tile__text">
                Günlük tüketim ≈{f1(r.daily)} kWh, yıllık üretim ≈{Math.round(r.production).toLocaleString('tr-TR')} kWh. 20 kWh bataryayla özerklik ≈{f1(r.autonomy)} gün.
                {r.ratio < 1.3 ? ' Pay az: güneş panelini artırın.' : ''}
              </span>
            </div>
            <div className="tile tile--w6 glass glass--soft">
              <span className="tile__label">Tüketim kalemleri, günde</span>
              <dl className="hb__parts">
                {r.parts.map(([n, v]) => (
                  <div key={n}>
                    <dt>{n}</dt>
                    <dd className="num">{f1(v)} kWh</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          <div className="hb__caps glass glass--soft">
            <span className="tile__label">Bu kovan ne yapabilir</span>
            <ul>
              {r.caps.map((x) => (
                <li key={x.name} className={x.on ? 'is-on' : ''}>
                  <span aria-hidden="true">{x.on ? '✓' : '–'}</span>
                  <span>
                    {x.name}
                    {!x.on && x.else && <small>{x.else}</small>}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <details className="hb__items">
            <summary>Maliyet kalemleri</summary>
            <dl>
              {r.items.map(([n, v]) => (
                <div key={n}>
                  <dt>{n}</dt>
                  <dd className="num">{v.toLocaleString('tr-TR')} bin $</dd>
                </div>
              ))}
            </dl>
          </details>
        </div>
      </div>
      <p className="hangar__note">
        Hepsi V3 ön tahmini. Enerji hesabındaki nöbetçi direk tüketimi (≈20 W) ve kast başına sorti sayıları (bekçi 4, işçi 2) varsayımdır; mini kovan bu hesapla raporun 10 kWh/gün ve 1,8×
        değerlerini verir. Çanakkale kovanı 4 kWp ile ≈1,1×’te kaldığı için 6 kWp güneşle kurulur (≈1,5×). Ek güneş paneli rapordaki birim fiyatla (4 kWp = 5 bin $) kWp başına ≈1,25 bin $
        alınmıştır.
      </p>
    </div>
  )
}
