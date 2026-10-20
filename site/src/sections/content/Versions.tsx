import { Fact } from '../../components/Fact'

/*
  Sürümler: başvuru (v1) → final raporu (v2) → kovan (V3).
  V3 mentörlerin "bu proje bir arı kovanı gibi" benzetmesinden doğdu; v2'nin dürüstlük kuralları korunur.
*/

const VERSIONS = [
  {
    v: 'v1',
    name: 'Başvuru',
    tag: 'fikir',
    items: ['Büyük, yoğun havalimanları (İstanbul)', '50+ drone’luk merkeziyetsiz sürü', 'Drone ile de-icing ve glikol geri kazanımı', 'Radar emici kaplamalı türbinler', '%73 süre, %99 hata, %80 kuş çarpması iddiaları'],
  },
  {
    v: 'v2',
    name: 'Final raporu',
    tag: 'Ekim 2026',
    items: ['Düşük trafikli bölgesel havalimanı, pilot Çanakkale', '2 drone, 2 istasyon, tarifeye duyarlı planlayıcı', 'Güneş + dikey türbin + batarya, üretim/yük 1,8×', 'Kule onaylı pencereler, sanal sınır', 'Her rakam varsayımıyla; dayanaksız iddialar çıkarıldı'],
  },
  {
    v: 'V3',
    name: 'Kovan',
    tag: 'bu site',
    items: [
      'Görevine göre uzmanlaşmış kastlar: kâşif, bekçi, işçi, bakıcı, nöbetçi',
      'İşçi küçük nesneyi toplar (≤ 1 kg)',
      'Buz haritası geri geldi, ama yalnızca harita: sıvı sıkılmaz',
      'Sinyal karıştırmaya karşı katmanlı konum',
      'Acil durumu ilk fark eden nöbetçi kameralar, 12 senaryo',
    ],
    us: true,
  },
]

const KEPT = ['Tarama geometrisi ve ≈12 dk tarama', 'Kule onayı olmadan kalkış yok', 'Tarifeye duyarlı planlayıcı ve ±5 dk pist bandı', 'Enerji adası ve şebeke yedeği', 'Rakamlar varsayımıyla, tahminler etiketli']

export function Versions() {
  return (
    <div className="ver">
      <ol className="ver__cards">
        {VERSIONS.map((x) => (
          <li key={x.v} className={`glass glass--soft ${x.us ? 'is-us' : ''}`}>
            <header>
              <span className="ver__v">{x.v}</span>
              <div>
                <h3>{x.name}</h3>
                <span className="ver__tag">{x.tag}</span>
              </div>
            </header>
            <ul>
              {x.items.map((i) => (
                <li key={i}>{x.v === 'v1' ? <s>{i}</s> : i}</li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
      <div className="ver__why bento">
        <div className="tile tile--w7 glass glass--soft">
          <span className="tile__label">v2’den V3’e neden</span>
          <span className="tile__text">
            Mentörler projeyi bir arı kovanına benzetti. Bu benzetmeyi mimariye çevirdik: tek tip drone yerine görevine göre uzmanlaşmış kastlar, ortak bir harita ve kendi enerjisini üreten petekler.
            Kovan havalimanının ihtiyacına göre hücre ekleyerek büyür; mini kovan (v2) <Fact id="hiveMini" />, Çanakkale kovanı <Fact id="hiveCkz" />.
          </span>
        </div>
        <div className="tile tile--w5 glass glass--soft">
          <span className="tile__label">Değişmeyenler</span>
          <ul className="ver__kept">
            {KEPT.map((k) => (
              <li key={k}>{k}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
