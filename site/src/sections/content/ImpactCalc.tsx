import { useState } from 'react'
import { CalcShell, Formula, Out, Slider, tr } from '../../components/Calc'

/*
  Doğrudan CO₂ azaltımı (rapordaki Tablo 7). Varsayılanlar:
  denetim aracı ≈2,0 + çit aracı ≈1,3 + elektrikli saha aracı ≈5,0 + şebeke yerine yenilenebilir ≈1,6 ≈ 10 t/yıl.
  20 bölgesel havalimanında ≈200 t/yıl. Asıl kazanç dolaylı etkilerde.
*/

const D = { inspections: 5, inspKm: 6, share: 75, fence: 2, fenceKm: 10, evKm: 21000, diesel: 0.24, grid: 0.45, airports: 20 }
const GRID_KWH = 3650

export function computeCo2(v: typeof D) {
  const inspKmYear = v.inspections * v.inspKm * 365 * (v.share / 100)
  const fenceKmYear = v.fence * v.fenceKm * 365 * (v.share / 100)
  const items = [
    { name: 'Pist denetim aracı', note: `${tr(Math.round(inspKmYear / 100) * 100)} km/yıl drone’a devredilir`, t: (inspKmYear * v.diesel) / 1000 },
    { name: 'Çit devriyesi aracı', note: `${tr(Math.round(fenceKmYear / 100) * 100)} km/yıl drone’a devredilir`, t: (fenceKmYear * v.diesel) / 1000 },
    { name: 'Fazla enerjiyle elektrikli saha aracı', note: `${tr(v.evKm)} km dizel araç yerine`, t: (v.evKm * v.diesel) / 1000 },
    { name: 'Şebeke yerine yenilenebilir enerji', note: `${tr(GRID_KWH)} kWh/yıl`, t: (GRID_KWH * v.grid) / 1000 },
  ]
  const total = items.reduce((s, i) => s + i.t, 0)
  return { items, total, fleet: total * v.airports }
}

function Co2Bars({ items }: { items: ReturnType<typeof computeCo2>['items'] }) {
  const max = Math.max(6, ...items.map((i) => i.t)) * 1.15
  return (
    <figure className="hb">
      <ul className="hb__list">
        {items.map((i) => (
          <li key={i.name}>
            <span className="hb__name">
              {i.name}
              <small>{i.note}</small>
            </span>
            <span className="hb__track">
              <span className="hb__bar hb__bar--green" style={{ width: `${(i.t / max) * 100}%` }} />
              <span className="hb__val num">{tr(i.t, 1)} t</span>
            </span>
          </li>
        ))}
      </ul>
      <figcaption>Havalimanı başına yıllık doğrudan CO₂ azaltımı, ton</figcaption>
    </figure>
  )
}

const THEMES = ['Yeşil Havalimanları ve Altyapı', 'Verimli Operasyonlar', 'Geleceğin Mobilitesi ve İnovasyon', 'Havacılıkta Döngüsel Ekonomi']

export function ImpactCalc() {
  const [v, setV] = useState(D)
  const set = (k: keyof typeof D) => (x: number) => setV((s) => ({ ...s, [k]: x }))
  const r = computeCo2(v)
  const changed = (Object.keys(D) as (keyof typeof D)[]).some((k) => v[k] !== D[k])

  return (
    <div className="impact">
      <CalcShell
        changed={changed}
        onReset={() => setV(D)}
        inputs={
          <>
            <Slider label="Pist denetimi, günde" unit="" min={1} max={10} step={1} value={v.inspections} reportValue={D.inspections} onChange={set('inspections')} />
            <Slider label="Denetim başına araç yolu" unit="km" min={2} max={12} step={1} value={v.inspKm} reportValue={D.inspKm} onChange={set('inspKm')} />
            <Slider label="Drone’a devredilen pay" unit="%" min={25} max={100} step={5} value={v.share} reportValue={D.share} onChange={set('share')} hint="Rüzgârlı günlerde denetim araçla sürer" />
            <Slider label="Çit devriyesi, günde" unit="" min={0} max={4} step={1} value={v.fence} reportValue={D.fence} onChange={set('fence')} />
            <Slider label="Devriye başına araç yolu" unit="km" min={4} max={16} step={1} value={v.fenceKm} reportValue={D.fenceKm} onChange={set('fenceKm')} />
            <Slider label="Fazla enerjiyle elektrikli saha aracı" unit="km/yıl" min={0} max={40000} step={1000} value={v.evKm} reportValue={D.evKm} onChange={set('evKm')} hint="Enerji adası bölümündeki fazladan" />
            <Slider label="Dizel araç emisyonu" unit="kg CO₂/km" min={0.15} max={0.35} step={0.01} digits={2} value={v.diesel} reportValue={D.diesel} onChange={set('diesel')} />
            <Slider label="Şebeke emisyon faktörü" unit="kg CO₂/kWh" min={0.2} max={0.7} step={0.01} digits={2} value={v.grid} reportValue={D.grid} onChange={set('grid')} hint="Varsayım" />
            <Slider label="Bölgesel havalimanı sayısı" unit="" min={1} max={40} step={1} value={v.airports} reportValue={D.airports} onChange={set('airports')} />
          </>
        }
        outputs={
          <>
            <Out strong label="Havalimanı başına yıllık doğrudan azaltım" value={`≈${tr(r.total, 1)} t CO₂`} note="Raporda ≈10 t. Tek havalimanı için küçük; bunu açıkça söylüyoruz." />
            <Out strong label={`${v.airports} bölgesel havalimanında, yılda`} value={`≈${tr(Math.round(r.fleet / 10) * 10)} t CO₂`} note="Raporda 20 havalimanı için ≈200 t" />
          </>
        }
        figure={
          <div className="scan-figs">
            <Co2Bars items={r.items} />
            <Formula>
              <p>
                <code>denetim aracı = günlük denetim × km × 365 × devredilen pay × dizel faktörü</code>
              </p>
              <p>
                <code>çit aracı = günlük devriye × km × 365 × devredilen pay × dizel faktörü</code>
              </p>
              <p>
                <code>elektrikli saha aracı = km × dizel faktörü</code> (aynı yolu dizel araç yapsaydı)
              </p>
              <p>
                <code>şebeke = 3.650 kWh × şebeke faktörü</code> (sistemin tüketimini şebeke yerine sahada üretmek)
              </p>
            </Formula>
          </div>
        }
      />

      <div className="impact__indirect">
        <h3 className="content-h3">Asıl kazanç dolaylı etkilerde</h3>
        <ul>
          <li>
            <b>FOD kaynaklı hasarın önlenmesi.</b> Önlenen her motor hasarı yeni parça üretimini, lojistiği ve uçağın yerde kalmasından doğan emisyonu ortadan kaldırır.
          </li>
          <li>
            <b>Pist ömrünün uzaması.</b> Çatlakların erken tespiti, karbon yoğun kapsamlı yenileme işlerini erteleyebilir.
          </li>
          <li>
            <b>Daha az bekleme ve pas geçme.</b> Pistteki bir nesne yüzünden yaşanan bekleme veya pas geçme ek yakıt demektir.
          </li>
          <li>
            <b>Karbon raporlamasına veri.</b> Kayıt altına alınan denetim ve enerji verisi, havalimanının Airport Carbon Accreditation raporlamasına girdi olur.
          </li>
        </ul>
        <p className="impact__note">Dolaylı etkilerin sayısallaştırılması pilot uygulamanın temel çıktılarından biri olacak.</p>
        <div className="impact__themes">
          <span className="impact__themes-label">Hackathon temaları</span>
          <ul>
            {THEMES.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
