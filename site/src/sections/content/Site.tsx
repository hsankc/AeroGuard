import { Fact } from '../../components/Fact'

/*
  Şematik saha haritası (kuzey yukarıda, ölçeksiz): boğaz, şehir ve pist 04/22 yönü.
  3D sahnedeki yerleşimle aynı mantık: kıyı havalimanının ≈2,4 km batı-kuzeybatısında, boğaz ≈20° doğrultusunda.
*/

const AP = { x: 410, y: 250 } // havalimanı merkezi
const KM = 58 // 1 km ≈ 58 px
const deg = (d: number) => (d * Math.PI) / 180
const dir = (bearing: number) => ({ x: Math.sin(deg(bearing)), y: -Math.cos(deg(bearing)) })

function SiteMap() {
  const rw = dir(40)
  const half = (2.35 / 2) * KM
  const r04 = { x: AP.x - rw.x * half, y: AP.y - rw.y * half }
  const r22 = { x: AP.x + rw.x * half, y: AP.y + rw.y * half }
  // boğaz ekseni: havalimanından 290° yönünde 3,1 km, 20° doğrultusunda; yarı genişlik 0,7 km
  const toAxis = dir(290)
  const ax = { x: AP.x + toAxis.x * 3.1 * KM, y: AP.y + toAxis.y * 3.1 * KM }
  const along = dir(20)
  const perp = { x: -toAxis.x, y: -toAxis.y } // eksenden havalimanına doğru
  const w = 0.7 * KM
  const L = 600
  const pt = (s: number, o: number) => `${(ax.x + along.x * s + perp.x * o).toFixed(1)},${(ax.y + along.y * s + perp.y * o).toFixed(1)}`
  const water = `${pt(-L, -w)} ${pt(L, -w)} ${pt(L, w)} ${pt(-L, w)}`
  const city = Array.from({ length: 46 }, (_, i) => {
    const a = (i * 137.5 * Math.PI) / 180
    const r = Math.sqrt(i / 46) * 0.9 * KM
    const c = { x: ax.x + perp.x * (w + 0.75 * KM) + along.x * 0.9 * KM, y: ax.y + perp.y * (w + 0.75 * KM) + along.y * 0.9 * KM }
    return { x: c.x + Math.cos(a) * r * 1.25, y: c.y + Math.sin(a) * r }
  })

  return (
    <svg className="site-map" viewBox="0 0 600 440" role="img" aria-label="Şematik harita: Çanakkale Boğazı, Çanakkale şehri ve havalimanının pist 04/22 yönü">
      <rect className="site-map__land" x={0} y={0} width={600} height={440} />
      <polygon className="site-map__water" points={water} />
      <text className="site-map__water-label" transform={`translate(${ax.x - 18},${ax.y + 40}) rotate(${20 - 90})`} textAnchor="middle">
        Çanakkale Boğazı
      </text>
      <text className="site-map__label site-map__label--muted" x={40} y={410}>
        Gelibolu Yarımadası
      </text>
      {city.map((p, i) => (
        <rect key={i} className="site-map__city" x={p.x - 3} y={p.y - 3} width={6} height={6} rx={1} />
      ))}
      <text className="site-map__label" x={city[0].x - 10} y={city[0].y - 62}>
        Çanakkale
      </text>
      {/* havalimanı */}
      <ellipse className="site-map__airport" cx={AP.x} cy={AP.y} rx={1.55 * KM} ry={0.65 * KM} transform={`rotate(${40 - 90} ${AP.x} ${AP.y})`} />
      <line className="site-map__rwy" x1={r04.x} y1={r04.y} x2={r22.x} y2={r22.y} />
      <circle className="site-map__st site-map__st--a" cx={r04.x - rw.x * 6} cy={r04.y - rw.y * 6} r={6} />
      <circle className="site-map__st site-map__st--b" cx={r22.x + rw.x * 6} cy={r22.y + rw.y * 6} r={6} />
      <text className="site-map__rwyno" x={r04.x - 26} y={r04.y + 22}>
        04
      </text>
      <text className="site-map__rwyno" x={r22.x + 10} y={r22.y - 8}>
        22
      </text>
      <text className="site-map__label" x={AP.x + 34} y={AP.y + 40}>
        LTBH
      </text>
      {/* kuzey oku */}
      <g transform="translate(556 52)">
        <path className="site-map__north" d="M0,-22 L8,6 L0,0 L-8,6 Z" />
        <text className="site-map__label" x={0} y={24} textAnchor="middle">
          K
        </text>
      </g>
      <text className="site-map__note" x={590} y={430} textAnchor="end">
        şematik, ölçeksiz
      </text>
    </svg>
  )
}

export function Site() {
  return (
    <div className="site">
      <figure className="site__map">
        <SiteMap />
        <figcaption>
          <span className="site__dot site__dot--a" /> İstasyon A, pist 04 ucu <span className="site__dot site__dot--b" /> İstasyon B, pist 22 ucu
        </figcaption>
      </figure>

      <div className="site__data">
        <h3 className="site__data-title">
          <span className="sign-loc">LTBH</span> Çanakkale Havalimanı
        </h3>
        <dl className="aip">
          <div>
            <dt>Pist</dt>
            <dd>
              <Fact id="runway" />, beton
            </dd>
          </div>
          <div>
            <dt>Yolcu (2025)</dt>
            <dd>
              <Fact id="passengers2025" />
            </dd>
          </div>
          <div>
            <dt>Yolcu (Ocak–Temmuz 2026)</dt>
            <dd>
              <Fact id="passengersCkz2026" />
            </dd>
          </div>
          <div>
            <dt>Düzenli hat</dt>
            <dd>AJet, Ankara</dd>
          </div>
          <div>
            <dt>Ticari hareket</dt>
            <dd>
              günde <Fact id="dailyMovements" />
            </dd>
          </div>
          <div>
            <dt>Statü</dt>
            <dd>Sivil–askeri ortak kullanım</dd>
          </div>
          <div>
            <dt>Terminal kapasitesi</dt>
            <dd>
              <Fact id="terminalCapacity" />
            </dd>
          </div>
          <div>
            <dt>İl rüzgâr kurulu gücü</dt>
            <dd>
              <Fact id="windRank" />, Türkiye’de 3.
            </dd>
          </div>
        </dl>

        <ul className="site__why">
          <li>
            <b>Trafik çok düşük.</b> Sabiha Gökçen’in yaklaşık 1/400’ü ölçeğinde; uçuşlar arasında drone’lar kule onaylı güvenli pencerelerde çalışabilir.
          </li>
          <li>
            <b>Rüzgâr var.</b> Çanakkale rüzgâr kurulu gücünde Türkiye’nin önde gelen illerinden; sahada rüzgâr üretimi anlamlı.
          </li>
          <li>
            <b>Üniversitemize yakın.</b> Saha ziyareti, veri toplama ve paydaşlarla düzenli iletişim kolay.
          </li>
          <li>
            <b>Sivil–askeri kullanım.</b> Görüntüler buluta gönderilmez; işleme ve depolama havalimanı içindeki kenar sunucuda yapılır.
          </li>
        </ul>
      </div>
    </div>
  )
}
