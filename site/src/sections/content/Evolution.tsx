import { useMemo, useState } from 'react'
import { Fact } from '../../components/Fact'
import { actual, CKZ_SCHEDULE, DAY_END, DAY_START, sawSchedule } from '../../planner/plan'

/*
  Başvurudan finale: mentörlerin iki geri bildirimi ve kapsamın nasıl daraltıldığı.
  Trafik şeridi: 05:00–24:00 arasında her çizgi bir ticari hareket.
*/

const CHANGES = [
  {
    topic: 'Hedef saha',
    before: 'Büyük, yoğun havalimanları (İstanbul)',
    after: 'Düşük trafikli bölgesel havalimanları, pilot Çanakkale',
    why: 'Yoğun pistte drone taraması mümkün değil; büyük havalimanlarında kurulu sistemler var.',
  },
  {
    topic: 'Filo',
    before: '50+ drone’luk merkeziyetsiz sürü',
    after: '2 drone, 2 istasyon, merkezi görev planlayıcı',
    why: 'Küçük havalimanı için yeterli; izin, bakım ve sertifikasyon çok daha kolay.',
  },
  {
    topic: 'Enerji',
    before: 'Radar emici kaplamalı türbinler, şebekeden tam bağımsızlık',
    after: 'Güneş + küçük dikey türbin + batarya, şebeke yedekte',
    why: 'Radar emici kaplama pahalı ve araştırma aşamasında; tek kaynağa dayanmak riskli.',
  },
  {
    topic: 'Şarj',
    before: 'Türbin tepesinde kablosuz şarj pedi',
    after: 'Yerde ticari drone istasyonu',
    why: 'Dönen bir yapının üzerine iniş mekanik olarak sorunlu.',
  },
  {
    topic: 'De-icing / glikol',
    before: 'Termal buz haritalama, glikol geri dönüşümü',
    after: 'Kapsam dışı (V3’te yalnızca buz haritası olarak döndü)',
    why: 'Buzlanma koşullarında küçük drone uçamaz; buz kontrolü yasal olarak ekip ve kaptanın sorumluluğunda. V3’te drone sıvı sıkmaz, yalnızca kırağı koşulunda haritalar.',
  },
  {
    topic: 'ATC entegrasyonu',
    before: '“Handshake” ile 10 sn’de pisti boşaltma',
    after: 'Kule onaylı zaman pencereleri, ADS-B ile hava aracı farkındalığı',
    why: 'Uçak yaklaşırken drone zaten yerde olmalı.',
  },
  {
    topic: 'Sayısal iddialar',
    before: 'İST pilot modellemesi, %73 süre, %99 hata, %80 kuş çarpması',
    after: 'Varsayımları açık ön hesaplar',
    why: 'Dayanaksız rakamlar savunulamaz.',
  },
]

export function Evolution() {
  const [airport, setAirport] = useState<'saw' | 'ckz'>('saw')
  const saw = useMemo(() => sawSchedule().map(actual).filter((t) => t >= DAY_START), [])
  const ckz = CKZ_SCHEDULE.map(actual)
  const ticks = airport === 'saw' ? saw : ckz
  const W = 1000
  const x = (t: number) => ((t - DAY_START) / (DAY_END - DAY_START)) * W
  const hours = [6, 9, 12, 15, 18, 21, 24]

  return (
    <div className="evo">
      <div className="evo__switch">
        <div className="pseg" role="group" aria-label="Havalimanı">
          <button type="button" aria-pressed={airport === 'saw'} onClick={() => setAirport('saw')}>
            Başvuruda: Sabiha Gökçen
          </button>
          <button type="button" aria-pressed={airport === 'ckz'} onClick={() => setAirport('ckz')}>
            Finalde: Çanakkale
          </button>
        </div>
        <p className="evo__ratio">
          Trafik farkı <Fact id="scaleRatio" />
        </p>
      </div>

      <div className="evo__panel" aria-live="polite">
        <dl className="evo__figs">
          <div>
            <dt>yolcu, Ocak–Temmuz 2026</dt>
            <dd>{airport === 'saw' ? <Fact id="passengersSaw2026" /> : <Fact id="passengersCkz2026" />}</dd>
          </div>
          <div>
            <dt>ticari hareket, günde</dt>
            <dd className="num">{airport === 'saw' ? '≈880' : <Fact id="dailyMovements" />}</dd>
          </div>
          <div>
            <dt>pistin durumu</dt>
            <dd className="evo__state">{airport === 'saw' ? 'Dakikada yaklaşık bir hareket: drone’a pistte zaman yok' : 'Hareketler arasında saatlerce boş pist'}</dd>
          </div>
        </dl>

        <figure className="evo__ribbon">
          <svg viewBox={`0 0 ${W} 74`} preserveAspectRatio="none" role="img" aria-label={`Bir günde ${ticks.length} ticari hareket, her çizgi bir hareket`}>
            <rect className="evo__track" x={0} y={12} width={W} height={34} />
            {ticks.map((t, i) => (
              <line key={i} className={airport === 'saw' ? 'evo__tick evo__tick--dense' : 'evo__tick'} x1={x(t)} x2={x(t)} y1={12} y2={46} />
            ))}
          </svg>
          <div className="evo__axis num" aria-hidden="true">
            <span style={{ left: 0 }}>05:00</span>
            {hours.map((h) => (
              <span key={h} style={{ left: `${(((h - 5) * 3600) / (DAY_END - DAY_START)) * 100}%` }}>
                {String(h % 24).padStart(2, '0')}:00
              </span>
            ))}
          </div>
          <figcaption>
            Her çizgi bir ticari hareket. {airport === 'saw' ? 'Sabiha Gökçen için ≈880 hareket: 28 milyon yolcu ÷ 212 gün ÷ ≈150 yolcu/hareket.' : 'Çanakkale’nin temsili tarifesi: 08:10, 08:55, 19:40, 20:25.'}
          </figcaption>
        </figure>
      </div>

      <div className="evo__changes">
        <h3>Başvurudan final raporuna (v2) değişenler</h3>
        <div className="evo__table" role="table" aria-label="Başvuru ve final raporu arasındaki farklar">
          <div className="evo__row evo__row--head" role="row">
            <span role="columnheader">Konu</span>
            <span role="columnheader">Başvuruda</span>
            <span role="columnheader">Finalde</span>
            <span role="columnheader">Neden</span>
          </div>
          {CHANGES.map((c) => (
            <div key={c.topic} className="evo__row" role="row">
              <span role="cell" className="evo__topic">
                {c.topic}
              </span>
              <span role="cell" className="evo__before">
                <s>{c.before}</s>
              </span>
              <span role="cell" className="evo__after">
                {c.after}
              </span>
              <span role="cell" className="evo__why">
                {c.why}
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
