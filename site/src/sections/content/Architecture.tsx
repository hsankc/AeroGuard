import { useState } from 'react'
import { getEngine } from '../../sim/engine'
import { useSim } from '../../sim/store'
import { href } from '../../app/router'

/*
  Sistem mimarisi (rapordaki Şekil 1): enerji adası → kovan istasyonları → yazılım ve karar → çıktılar.
  Güç akışı yeşil, görev/veri akışı mavi. Bir kutuya tıklayınca açıklaması açılır.
*/

type NodeId = 'pv' | 'turbine' | 'battery' | 'grid' | 'stationA' | 'stationB' | 'acc' | 'planner' | 'edge' | 'twin' | 'tower'
type Focus = 'stationA' | 'stationB' | 'energy' | 'tower'

type Node = { id: NodeId; x: number; y: number; title: string; sub: string; kind: 'energy' | 'station' | 'soft' | 'tower' | 'grid'; text: string; focus?: Focus; planner?: boolean }

const W = 270
const H = 84

const NODES: Node[] = [
  { id: 'pv', x: 20, y: 64, title: 'Güneş paneli', sub: '4 kWp, ≈5.400 kWh/yıl', kind: 'energy', focus: 'energy', text: '10 × 400 W panel, güneye 30° eğimli. Üretim temkinli bir verimle (≈1.350 kWh/kWp·yıl) hesaplandı. Güneşin zayıf olduğu kış aylarında rüzgâr devreye girer; iki kaynak birlikte mevsimsel riski azaltır.' },
  { id: 'turbine', x: 20, y: 166, title: 'Dikey eksenli türbin', sub: '3 kW, ≈3.150 kWh/yıl', kind: 'energy', focus: 'energy', text: 'Her yönden gelen rüzgârı yakalar, düşük gürültülüdür ve kompakttır. Küçük türbinlerin sahadaki performansı türbülansa duyarlı olduğu için kapasite faktörü bilerek düşük, %12 alındı. Türbinin yeri DHMİ mânia görüşü ve radar etki analiziyle belirlenecek.' },
  { id: 'battery', x: 20, y: 268, title: 'Batarya (LFP)', sub: '20 kWh, ≈1–1,5 gün özerklik', kind: 'energy', focus: 'energy', text: '20 kWh LFP batarya ve hibrit invertör. Tasarım yüküyle mini kovanda yaklaşık 1,5, Çanakkale kovanında yaklaşık 1 günlük özerklik sağlar; uzun süre güneşsiz ve rüzgârsız geçen dönemlerde şebeke devreye girer.' },
  { id: 'grid', x: 20, y: 380, title: 'Şebeke bağlantısı', sub: 'yalnızca yedek', kind: 'grid', text: 'Şebeke yalnızca yedek olarak bağlı. Başvurudaki “şebekeden tam bağımsızlık” iddiasını, tek kaynağa dayanmak riskli olduğu için kaldırdık.' },
  { id: 'stationA', x: 365, y: 84, title: 'İstasyon A, pist 04 ucu', sub: 'Drone 1, termal + 48 MP kamera', kind: 'station', focus: 'stationA', text: 'Pist şeridinin dışında ve ICAO Ek 14 engel sınırlama yüzeylerinin altında otomatik drone istasyonu. Referans donanım DJI Dock 2 sınıfı: IP55, –25 °C ile 45 °C arası çalışma, %20’den %90’a 32 dakikada şarj. Drone’da 48 MP geniş açı ve 640 × 512 termal kamera, RTK konumlama var. Mimari donanımdan bağımsız; yerli muadiller değerlendirmeye açık.' },
  { id: 'stationB', x: 365, y: 216, title: 'İstasyon B, pist 22 ucu', sub: 'Drone 2, termal + 48 MP kamera', kind: 'station', focus: 'stationB', text: 'İstasyon A’nın eşi; pistin diğer ucunda. İki drone pistin birer yarısını aynı anda tarar, böylece tam tarama yaklaşık 12 dakika sürer. Operasyonda 12 m/s, iniş-kalkışta 8 m/s rüzgâr sınırı var.' },
  { id: 'acc', x: 365, y: 348, title: 'Görev aksesuarları', sub: 'hoparlör ve ışık, elle hızlı değişim', kind: 'grid', text: 'Yaban hayatı caydırma için hafif hoparlör ve ışık aksesuarı. Tehlike sesleri ve ışık uyaranları yalnızca hava aracı hareketi olmayan pencerelerde ve kuşları yaklaşma koridorlarından uzağa yönlendiren rotalarla kullanılır.' },
  { id: 'planner', x: 710, y: 64, title: 'Görev planlayıcı', sub: 'uçuş tarifesine göre otomatik görev', kind: 'soft', planner: true, text: 'Havalimanının uçuş tarifesini ve gerçekleşen kalkış/varış zamanlarını okur, görevleri uçuşlar arasındaki boşluklara kendisi yerleştirir. Rüzgâr ve yağış verisine göre görevin yapılıp yapılamayacağına karar verir.' },
  { id: 'edge', x: 710, y: 166, title: 'Kenar YZ sunucusu', sub: 'YOLO tabanlı FOD, çatlak ve hayvan tespiti', kind: 'soft', text: 'Drone görüntülerini havalimanı içinde işler. FOD, çatlak ve hayvan tespiti için YOLO tabanlı modeller çalışır. Sivil–askeri ortak kullanım nedeniyle veri buluta çıkmaz.' },
  { id: 'twin', x: 710, y: 268, title: 'Pistin dijital ikizi ve panel', sub: 'harita, geçmiş kayıtlar, raporlar', kind: 'soft', text: 'Tespitleri pist haritası üzerinde konumlarıyla gösterir, geçmiş taramaları karşılaştırarak değişimi izler ve raporları üretir. Bu sitedeki 3D sahne, o dijital ikizin temsili bir gösterimi.' },
  { id: 'tower', x: 710, y: 380, title: 'Kule onay ekranı', sub: 'insan onayı şart', kind: 'tower', focus: 'tower', text: 'Kule onaylamadan drone kalkmaz; kule görevi her an iptal edip drone’ları istasyona geri çağırabilir. Ekrana yalnızca havalimanının iç ağından erişilir.' },
]

const OUTPUTS = ['Temiz pist raporu', 'Çatlak haritası', 'GRF pist durum verisi', 'Yaban hayatı uyarısı', 'Karbon raporu']

const right = (n: Node) => ({ x: n.x + W, y: n.y + H / 2 })
const left = (n: Node) => ({ x: n.x, y: n.y + H / 2 })
const by = (id: NodeId) => NODES.find((n) => n.id === id)!

function curve(a: { x: number; y: number }, b: { x: number; y: number }) {
  const mx = (a.x + b.x) / 2
  return `M${a.x},${a.y} C${mx},${a.y} ${mx},${b.y} ${b.x},${b.y}`
}

function openTwin(focus: Focus) {
  useSim.getState().set({ opsOpen: true })
  window.setTimeout(() => getEngine()?.focusObject(focus), 120)
}

export function Architecture() {
  const [sel, setSel] = useState<NodeId>('planner')
  const node = by(sel)
  const bat = by('battery')
  const pv = by('pv')
  const tur = by('turbine')
  const grid = by('grid')
  const tower = by('tower')

  return (
    <div className="arch">
      <div className="arch__diagram">
        <svg viewBox="0 0 1000 600" className="arch__svg" role="group" aria-label="AERO-GUARD sistem mimarisi">
          <g className="arch__heads">
            <text x={20} y={30}>Enerji adası</text>
            <line className="arch__rule arch__rule--energy" x1={20} x2={290} y1={42} y2={42} />
            <text x={365} y={30}>Kovan istasyonları</text>
            <line className="arch__rule arch__rule--station" x1={365} x2={635} y1={42} y2={42} />
            <text x={710} y={30}>Yazılım ve karar</text>
            <line className="arch__rule arch__rule--soft" x1={710} x2={980} y1={42} y2={42} />
          </g>

          {/* güç akışı */}
          <path className="arch__flow arch__flow--power" d={`M${pv.x},${pv.y + H / 2} H6 V${bat.y + H / 2} H${bat.x}`} />
          <path className="arch__flow arch__flow--power" d={`M${tur.x},${tur.y + H / 2} H6`} />
          <path className="arch__flow arch__flow--backup" d={`M${grid.x + W / 2},${grid.y} V${bat.y + H}`} />
          <path className="arch__flow arch__flow--power" d={curve(right(bat), left(by('stationA')))} />
          <path className="arch__flow arch__flow--power" d={curve(right(bat), left(by('stationB')))} />
          {/* görev ve veri akışı */}
          <path className="arch__flow arch__flow--data" d={curve(right(by('stationA')), left(by('planner')))} />
          <path className="arch__flow arch__flow--data" d={curve(right(by('stationB')), left(by('edge')))} />
          <path className="arch__flow arch__flow--data" d={curve(right(by('stationA')), left(by('edge')))} />
          <path className="arch__flow arch__flow--data" d={curve(right(by('stationB')), left(by('twin')))} />
          <path className="arch__flow arch__flow--decision" d={`M${tower.x + W / 2},${tower.y + H} V496`} />
          <line className="arch__flow arch__flow--decision" x1={110} x2={890} y1={496} y2={496} />

          {NODES.map((n) => (
            <g
              key={n.id}
              className={`arch__node arch__node--${n.kind} ${sel === n.id ? 'is-sel' : ''}`}
              role="button"
              tabIndex={0}
              aria-pressed={sel === n.id}
              aria-label={`${n.title}: ${n.sub}`}
              onClick={() => setSel(n.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setSel(n.id)
                }
              }}
            >
              <rect x={n.x} y={n.y} width={W} height={H} rx={8} />
              <text className="arch__title" x={n.x + W / 2} y={n.y + 36} textAnchor="middle">
                {n.title}
              </text>
              <text className="arch__sub" x={n.x + W / 2} y={n.y + 60} textAnchor="middle">
                {n.sub}
              </text>
            </g>
          ))}

          <text className="arch__out-head" x={20} y={530}>
            Çıktılar
          </text>
          {OUTPUTS.map((o, i) => (
            <g key={o} className="arch__out">
              <rect x={20 + i * 194} y={540} width={182} height={48} rx={6} />
              <text x={20 + i * 194 + 91} y={570} textAnchor="middle">
                {o}
              </text>
            </g>
          ))}
        </svg>

        <ul className="arch__list" aria-label="Mimari bileşenleri">
          {NODES.map((n) => (
            <li key={n.id}>
              <button type="button" aria-pressed={sel === n.id} className={`arch__chip arch__chip--${n.kind}`} onClick={() => setSel(n.id)}>
                <b>{n.title}</b>
                <span>{n.sub}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <aside className="arch__detail" aria-live="polite">
        <p className={`arch__kind arch__kind--${node.x < 300 ? 'energy' : node.x < 700 ? 'station' : 'soft'}`}>
          {node.x < 300 ? 'Enerji adası' : node.x < 700 ? 'Kovan istasyonları' : 'Yazılım ve karar'}
        </p>
        <h3>{node.title}</h3>
        <p className="arch__detail-sub">{node.sub}</p>
        <p>{node.text}</p>
        <div className="arch__actions">
          {node.focus && (
            <button type="button" className="pbtn" onClick={() => openTwin(node.focus!)}>
              Dijital ikizde göster
            </button>
          )}
          {node.planner && (
            <a className="pbtn" href={href('planlayici')}>
              Planlayıcıyı dene
            </a>
          )}
          {node.id === 'tower' && (
            <button type="button" className="pbtn" onClick={() => useSim.getState().set({ opsOpen: true })}>
              Kule onayını dene
            </button>
          )}
        </div>
        <p className="arch__legend">
          <span className="arch__key arch__key--power" /> güç
          <span className="arch__key arch__key--data" /> görev ve veri
          <span className="arch__key arch__key--backup" /> yedek
        </p>
      </aside>
    </div>
  )
}
