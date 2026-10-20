import { useRef, useState } from 'react'
import { Fact } from '../../components/Fact'

/*
  30 aylık yol haritası (rapordaki Şekil 5 ve Tablo 9): 4 faz, 7 iş paketi, 4 kilometre taşı.
  Çubuklar tek renk; kimliği satır etiketi taşır. Üzerine gelince veya odaklanınca faaliyetler ve çıktı görünür.
*/

const PHASES = [
  { name: 'Faz 0', sub: 'Prototip', from: 0, to: 3 },
  { name: 'Faz 1', sub: 'İzin ve sınırlı pilot', from: 3, to: 9 },
  { name: 'Faz 2', sub: 'Çanakkale tam pilot', from: 9, to: 18 },
  { name: 'Faz 3', sub: 'Ölçekleme', from: 18, to: 30 },
]

const WPS = [
  { id: 'İP1', name: 'YZ modeli ve veri seti', from: 0, to: 6, act: 'FOD-A ile eğitim, yerel test verisi, kenar cihazda optimizasyon', out: 'Doğrulanmış tespit modeli, demo' },
  { id: 'İP2', name: 'Görev planlayıcı ve dijital ikiz', from: 1, to: 9, act: 'Tarife entegrasyonu, rota planlama, panel ve kule ekranı', out: 'Çalışan yazılım, simülasyon raporu' },
  { id: 'İP3', name: 'İzin ve regülasyon', from: 0, to: 9, act: 'DHMİ ve SHGM görüşmeleri, SORA risk değerlendirmesi, mânia görüşü', out: 'Uçuş izni' },
  { id: 'İP4', name: 'Enerji adası', from: 4, to: 12, act: 'Yerel rüzgâr ve güneş ölçümü, tasarım, kurulum', out: 'Kurulu enerji adası' },
  { id: 'İP5', name: 'Sınırlı pilot', from: 6, to: 9, act: 'Tek istasyon; uçuşsuz saatlerde apron ve taksi yolu taramaları', out: 'İlk pilot raporu' },
  { id: 'İP6', name: 'Tam pilot ve ölçüm', from: 9, to: 18, act: 'İki istasyon, tüm modüller, KPI ölçümü', out: 'KPI doğrulama raporu' },
  { id: 'İP7', name: 'Ticarileşme', from: 18, to: 30, act: 'İş modelinin doğrulanması, 3–5 havalimanına yaygınlaştırma', out: 'Ticari sözleşmeler' },
]

const MILESTONES = [
  { m: 3, name: 'Demo' },
  { m: 9, name: 'İlk pilot raporu' },
  { m: 18, name: 'KPI doğrulama' },
  { m: 30, name: '3–5 havalimanı' },
]

export function Roadmap() {
  const [tip, setTip] = useState<{ x: number; y: number; wp: (typeof WPS)[number] } | null>(null)
  const wrap = useRef<HTMLDivElement>(null)
  const W = 1000
  const L = 250
  const plot = W - L - 20
  const x = (m: number) => L + (m / 30) * plot
  const rowH = 38
  const top = 64
  const H = top + WPS.length * rowH + 70

  const show = (el: Element, wp: (typeof WPS)[number]) => {
    const b = el.getBoundingClientRect()
    const r = wrap.current!.getBoundingClientRect()
    setTip({ x: b.left - r.left + b.width / 2, y: b.top - r.top, wp })
  }

  return (
    <div className="road">
      <div className="road__chart" ref={wrap} onPointerLeave={() => setTip(null)}>
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="30 aylık yol haritası, ayrıntılar aşağıdaki tabloda">
          {PHASES.map((p, i) => (
            <g key={p.name}>
              <rect className={`road__phase road__phase--${i}`} x={x(p.from) + 1} y={6} width={x(p.to) - x(p.from) - 2} height={44} rx={3} />
              <text className="road__phase-t" x={(x(p.from) + x(p.to)) / 2} y={25} textAnchor="middle">
                {p.name}
              </text>
              <text className="road__phase-s" x={(x(p.from) + x(p.to)) / 2} y={42} textAnchor="middle">
                {p.sub}
              </text>
            </g>
          ))}
          {[0, 3, 6, 9, 12, 15, 18, 21, 24, 27, 30].map((m) => (
            <g key={m}>
              <line className="road__grid" x1={x(m)} x2={x(m)} y1={top - 6} y2={top + WPS.length * rowH} />
              <text className="road__tick" x={x(m)} y={H - 8} textAnchor="middle">
                {m === 0 ? '0' : `${m}. ay`}
              </text>
            </g>
          ))}
          {WPS.map((wp, i) => {
            const y = top + i * rowH
            return (
              <g key={wp.id}>
                <text className="road__label" x={L - 12} y={y + 23} textAnchor="end">
                  {wp.id}, {wp.name}
                </text>
                <rect className="road__bar" x={x(wp.from)} y={y + 8} width={x(wp.to) - x(wp.from)} height={22} rx={4} />
                <rect
                  className="road__hit"
                  x={x(wp.from)}
                  y={y + 2}
                  width={Math.max(24, x(wp.to) - x(wp.from))}
                  height={rowH - 4}
                  tabIndex={0}
                  role="img"
                  aria-label={`${wp.id} ${wp.name}, ${wp.from + 1}–${wp.to}. aylar. ${wp.act}. Çıktı: ${wp.out}`}
                  onPointerMove={(e) => show(e.currentTarget, wp)}
                  onFocus={(e) => show(e.currentTarget, wp)}
                  onBlur={() => setTip(null)}
                />
              </g>
            )
          })}
          {MILESTONES.map((ms) => {
            const y = top + WPS.length * rowH + 16
            return (
              <g key={ms.name}>
                <rect className="road__ms" x={x(ms.m) - 8} y={y - 8} width={16} height={16} transform={`rotate(45 ${x(ms.m)} ${y})`} />
                <text className="road__ms-t" x={x(ms.m)} y={y + 28} textAnchor={ms.m === 30 ? 'end' : 'middle'}>
                  {ms.name}
                </text>
              </g>
            )
          })}
        </svg>
        {tip && (
          <div className="planner__tip" style={{ left: tip.x, top: tip.y }} role="tooltip">
            <strong>
              {tip.wp.id}, {tip.wp.name}: {tip.wp.from + 1}–{tip.wp.to}. aylar
            </strong>
            <span>{tip.wp.act}</span>
            <span>Çıktı: {tip.wp.out}</span>
          </div>
        )}
      </div>

      <p className="road__first">
        <b>İlk adım (0–3. ay):</b> FOD-A ile eğitilmiş YOLO demosu ve görev planlayıcı simülasyonu. Bu sitedeki planlayıcı ve dijital ikiz o simülasyonun ilk hali. İzin süreci en uzun
        iş olduğu için ilk ayda başlıyor; ilk uçuşlar uçuşsuz saatlerde apron ve taksi yolunda.
      </p>

      <details className="mkt__details">
        <summary>İş paketleri tablosu</summary>
        <table className="road__table">
          <thead>
            <tr>
              <th scope="col">İş paketi</th>
              <th scope="col">Ay</th>
              <th scope="col">Ana faaliyetler</th>
              <th scope="col">Çıktı</th>
            </tr>
          </thead>
          <tbody>
            {WPS.map((wp) => (
              <tr key={wp.id}>
                <th scope="row">
                  {wp.id}, {wp.name}
                </th>
                <td className="num">
                  {wp.from + 1}–{wp.to}
                </td>
                <td>{wp.act}</td>
                <td>{wp.out}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>

      <p className="road__team">
        Ekip dört bilgisayar mühendisliği öğrencisinden oluşuyor: yazılım, yapay zekâ ve sistem entegrasyonu ekip içinde; enerji adası tasarımı, saha kurulumu ve regülasyon süreçleri
        üniversitemizin ilgili bölümleri, DHMİ Çanakkale Havalimanı Müdürlüğü ve donanım tedarikçileriyle iş birliği içinde. Toplam süre <Fact id="roadmap" />.
      </p>
    </div>
  )
}
