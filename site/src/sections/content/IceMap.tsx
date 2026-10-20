import { useState } from 'react'
import { Fact } from '../../components/Fact'

/*
  Buz haritası (Bakıcı). Drone sıvı sıkmaz; yalnızca nereye sıkılacağını gösterir.
  Git/gitme kuralı V3 planı 4.3'ten: dondurucu yağış veya sis varsa uçmaz (drone'da buzlanma riski).
  Uçak çizimi ve buz bölgeleri temsilidir.
*/

type Wx = 'clear' | 'mist' | 'FZFG' | 'FZDZ' | 'FZRA' | 'SN' | 'PL'

const WX: { id: Wx; label: string; bad: boolean }[] = [
  { id: 'clear', label: 'Açık, sakin (kırağı)', bad: false },
  { id: 'mist', label: 'Pus (BR)', bad: false },
  { id: 'FZFG', label: 'Dondurucu sis (FZFG)', bad: true },
  { id: 'FZDZ', label: 'Dondurucu çisenti (FZDZ)', bad: true },
  { id: 'FZRA', label: 'Dondurucu yağmur (FZRA)', bad: true },
  { id: 'SN', label: 'Kar (SN)', bad: true },
  { id: 'PL', label: 'Buz taneleri (PL)', bad: true },
]

function verdict(wx: Wx, temp: number, wind: number) {
  const reasons: string[] = []
  const w = WX.find((x) => x.id === wx)!
  if (w.bad) reasons.push(`METAR’da ${wx}: havada aşırı soğumuş su veya kar var, drone’da buzlanma riski`)
  if (temp < -20) reasons.push('–20 °C altı: üretici çalışma sınırı dışında')
  if (wind > 8) reasons.push('Rüzgâr 8 m/s üstünde: iniş-kalkış sınırı')
  return { go: reasons.length === 0, reasons }
}

function AircraftMap() {
  // üstten görünüm, burun sağda; ölçüler temsili (dar gövde)
  return (
    <svg className="ice-map" viewBox="0 0 520 300" role="img" aria-label="Temsili buz haritası: kanat üstü, yatay stabilizör ve gövde üstünde püskürtme bölgeleri; drone uçağın çevresinde, üzerinden geçmeden uçar">
      <defs>
        <pattern id="ice-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="6" height="6" className="ice-map__hatch-bg" />
          <line x1="0" y1="0" x2="0" y2="6" className="ice-map__hatch" />
        </pattern>
      </defs>
      {/* drone yolu: gövdeye en az 6 m, uçağın üzerinden geçmez */}
      <rect className="ice-map__path" x={30} y={20} width={460} height={260} rx={44} />
      {/* gövde */}
      <path className="ice-map__body" d="M80,150 C80,138 100,134 130,134 L400,134 C440,134 470,142 478,150 C470,158 440,166 400,166 L130,166 C100,166 80,162 80,150 Z" />
      {/* kanatlar */}
      <path className="ice-map__body" d="M235,134 L300,134 L245,40 L222,40 Z" />
      <path className="ice-map__body" d="M235,166 L300,166 L245,260 L222,260 Z" />
      {/* yatay stabilizör */}
      <path className="ice-map__body" d="M92,138 L122,138 L104,92 L92,92 Z" />
      <path className="ice-map__body" d="M92,162 L122,162 L104,208 L92,208 Z" />
      {/* buz bölgeleri */}
      <path className="ice-map__zone" d="M240,126 L284,126 L248,64 L232,64 Z" fill="url(#ice-hatch)" />
      <path className="ice-map__zone" d="M240,174 L284,174 L250,232 L234,232 Z" fill="url(#ice-hatch)" />
      <path className="ice-map__zone" d="M96,132 L114,132 L104,104 L96,104 Z" fill="url(#ice-hatch)" />
      <rect className="ice-map__zone" x={160} y={142} width={60} height={16} rx={6} fill="url(#ice-hatch)" />
      {/* drone */}
      <g className="ice-map__drone" transform="translate(490 150)">
        <circle r={7} />
      </g>
      <text className="ice-map__label" x={262} y={28} textAnchor="middle">
        kanat üstü
      </text>
      <text className="ice-map__label" x={100} y={84} textAnchor="middle">
        yatay stabilizör
      </text>
      <text className="ice-map__label" x={190} y={186} textAnchor="middle">
        gövde üstü
      </text>
      <text className="ice-map__label ice-map__label--path" x={490} y={128} textAnchor="end">
        drone yolu, ≥ 6 m
      </text>
      <text className="ice-map__note" x={510} y={294} textAnchor="end">
        temsili
      </text>
    </svg>
  )
}

export function IceMap() {
  const [wx, setWx] = useState<Wx>('clear')
  const [temp, setTemp] = useState(-4)
  const [wind, setWind] = useState(2)
  const v = verdict(wx, temp, wind)

  return (
    <div className="ice">
      <div className="ice__intro">
        <div>
          <h3>Ne yapar</h3>
          <p>
            Kış sabahı park eden uçağın kanat üstünde, yatay stabilizöründe ve gövde üstünde kırağı ya da buz olan bölgeleri RGB ve termal kamerayla haritalar. Bölgeler de-icing ekibinin tabletine
            “püskürtme bölgeleri” olarak düşer; işlemden sonra kontrol uçuşu yapılır.
          </p>
        </div>
        <div>
          <h3>Ne yapmaz</h3>
          <p>
            <b>Sıvı sıkmaz.</b> “Uçak temiz” kararı vermez: temiz uçak ilkesi gereği karar kaptan ve ekibindedir. Glikol tasarrufu için rakam vermiyoruz; pilotta ölçülecek. Olgunluk{' '}
            <Fact id="iceTrl" />.
          </p>
        </div>
      </div>

      <div className="ice__grid">
        <figure className="ice__fig glass glass--soft">
          <AircraftMap />
          <figcaption>
            Uçağın üzerinden asla geçmez; arıza olursa uçağa değil apron zeminine düşer. Gövdeye en az 6 m, irtifa en fazla kuyruk yüksekliği + 3 m, hız ≤ 3 m/s. Motorlar kapalıyken uçar.
          </figcaption>
        </figure>

        <div className="ice__check glass glass--soft">
          <h3>Bu sabah uçabilir mi?</h3>
          <label className="ice__field">
            <span>Hava (METAR)</span>
            <select value={wx} onChange={(e) => setWx(e.target.value as Wx)}>
              {WX.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.label}
                </option>
              ))}
            </select>
          </label>
          <label className="ice__field">
            <span>
              Sıcaklık <b className="num">{temp} °C</b>
            </span>
            <input type="range" min={-30} max={5} step={1} value={temp} onChange={(e) => setTemp(Number(e.target.value))} />
          </label>
          <label className="ice__field">
            <span>
              Rüzgâr <b className="num">{wind} m/s</b>
            </span>
            <input type="range" min={0} max={14} step={1} value={wind} onChange={(e) => setWind(Number(e.target.value))} />
          </label>
          <div className={`ice__verdict ${v.go ? 'is-go' : 'is-nogo'}`} role="status">
            <b>{v.go ? 'Uçar' : 'Uçmaz'}</b>
            {v.go ? (
              <span>Kırağı senaryosu: havada aşırı soğumuş damlacık yok, drone’da buzlanma beklenmez. Batarya ön ısıtılır, uçuş ≤ 15 dk.</span>
            ) : (
              <ul>
                {v.reasons.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            )}
          </div>
          {!v.go && <p className="ice__fallback">Bugünkü gibi ekip gözle ve elle kontrol eder.</p>}
        </div>
      </div>
      <p className="hangar__note">
        Neden kırağı: açık ve sakin bir kış sabahında ışınımsal soğumayla park eden uçakta kırağı oluşur, ama havada uçuşu tehlikeye atan aşırı soğumuş su yoktur. Kış pilotu soğuk iklimli bir
        bölgesel havalimanıyla iş birliğiyle yapılacak. Hiperspektral kamera ileride eklenecek bir başlık.
      </p>
    </div>
  )
}
