import { Fact } from '../components/Fact'
import { href } from '../app/router'
import { useSim } from '../sim/store'
import { getEngine } from '../sim/engine'
import { usePlanner } from '../planner/store'
import { DAY_END, DAY_START, TASK_SPEC, actual, fmt } from '../planner/plan'
import { HiveMini } from './HiveMini'
import { OpsTeaser } from '../sections/content/OpsTeaser'
import { openExplore } from '../explore/actions'
import '../sections/hero.css'
import './home.css'

const openOps = () => useSim.getState().set({ opsOpen: true })
const playDay = () => {
  useSim.getState().set({ opsOpen: true })
  window.setTimeout(() => getEngine()?.playDay(300), 80)
}

/** Planlayıcıdan canlı beslenen küçük gün çizelgesi */
function MiniDay() {
  const plan = usePlanner((s) => s.plan)
  const moves = usePlanner((s) => s.movements)
  const x = (t: number) => ((t - DAY_START) / (DAY_END - DAY_START)) * 100
  const lane = { fod: 0, fence: 1, health: 2, wildlife: 3, opening: 0 } as const
  return (
    <svg className="mini-day" viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden="true">
      {moves.slice(0, 40).map((m) => (
        <line key={m.id} x1={x(actual(m))} x2={x(actual(m))} y1={0} y2={40} className="mini-day__move" />
      ))}
      {plan.tasks.map((t) => (
        <rect
          key={t.id}
          x={x(t.start)}
          y={4 + lane[t.type] * 9}
          width={Math.max(0.8, x(t.end) - x(t.start))}
          height={6}
          rx={1}
          className={`mini-day__task mini-day__task--${t.type} ${t.status !== 'ok' ? 'is-off' : ''}`}
        />
      ))}
    </svg>
  )
}

export function Home() {
  const stats = usePlanner((s) => s.plan.stats)
  const next = usePlanner((s) => s.plan.tasks.find((t) => t.type === 'fod' && t.status === 'ok'))

  return (
    <>
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero__shade" aria-hidden="true" />
        <div className="hero__content">
          <h1 id="hero-title" className="hero__title">
            Her uçuştan önce, doğrulanmış temiz pist.
          </h1>
          <p className="hero__sub">
            AERO-GUARD, bölgesel havalimanları için kendi enerjisini üreten bir drone kovanı: kâşifler pisti tarar, işçiler bulunanı toplar, bekçiler kuşu uzaklaştırır, nöbetçiler acil
            durumu ilk fark eder. Pilot saha Çanakkale Havalimanı.
          </p>
          <div className="hero__actions">
            <button type="button" className="btn btn--primary" onClick={openOps}>
              Operasyon merkezini aç
            </button>
            <button type="button" className="btn btn--ghost-light" onClick={() => openExplore()}>
              3D’de gez (WASD)
            </button>
            <a className="btn btn--ghost-light" href={href('kovan')}>
              Kovanı tanı
            </a>
          </div>
        </div>
        <dl className="hero__readout glass glass--soft">
          <div>
            <dt>iki kâşif ile tam pist taraması</dt>
            <dd>
              <Fact id="scanTime" />
            </dd>
          </div>
          <div>
            <dt>yenilenebilir üretim / tasarım yükü</dt>
            <dd>
              <Fact id="energyRatio" />
            </dd>
          </div>
          <div>
            <dt>yıllık CO₂ azaltımı, havalimanı başına</dt>
            <dd>
              <Fact id="co2" />
            </dd>
          </div>
          <div>
            <dt>mini kovan kurulumu</dt>
            <dd>
              <Fact id="capex" />
            </dd>
          </div>
          <div>
            <dt>prototipten 3–5 havalimanına</dt>
            <dd>
              <Fact id="roadmap" />
            </dd>
          </div>
        </dl>
        <p className="hero__sim-note">Temsili simülasyon görüntüsü</p>
      </section>

      <main className="home" aria-label="Keşfet">
        <div className="bento">
          <a className="tile tile--w7 tile--tall glass home-hive" href={href('kovan')}>
            <span className="tile__label">Kovan</span>
            <span className="tile__title">Görevine göre uzmanlaşmış drone’lar</span>
            <HiveMini />
            <span className="tile__foot">Kastları ve kovan boylarını gör</span>
          </a>

          <button type="button" className="tile tile--w5 glass home-ops" onClick={openOps}>
            <span className="tile__label">Operasyon merkezi</span>
            <span className="tile__title">Kule onayını siz verin</span>
            <span className="tile__text">Piste bir cıvata bırakın, kâşiflerin onu bulmasını izleyin, sonra bir arıza verip emniyet kurallarının devreye girişini görün.</span>
            <span className="tile__foot">Simülasyonu başlat</span>
          </button>

          <button type="button" className="tile tile--w5 glass" onClick={playDay}>
            <span className="tile__label">Bir günü oynat</span>
            <span className="tile__title">05:00’ten gece yarısına</span>
            <span className="tile__text">Uçaklar iner ve kalkar, görevler tarifeye göre başlar, rüzgârlı saatlerde pist araçla denetlenir.</span>
            <span className="tile__foot">300× hızla izle</span>
          </button>

          <a className="tile tile--w4 glass" href={href('sistem', 'problem')}>
            <span className="tile__label">Problem</span>
            <span className="tile__value">13,9 milyar $</span>
            <span className="tile__text">FOD ve kuş çarpmalarının dünya genelinde yıllık toplam maliyeti</span>
          </a>

          <a className="tile tile--w8 glass home-planner" href={href('planlayici')}>
            <span className="tile__label">Planlayıcı</span>
            <span className="tile__title">Drone ile uçak hiç karşılaşmaz</span>
            <MiniDay />
            <span className="tile__text">
              Bugün {stats.planned} görev, %{Math.round(stats.completion * 100)} gerçekleşme.
              {next ? ` Sıradaki FOD taraması ${fmt(next.start)}, ${TASK_SPEC[next.type].name.toLowerCase()} ${next.label}.` : ''}
            </span>
          </a>

          <a className="tile tile--w4 glass home-emergency" href={href('acil-durum')}>
            <span className="tile__label">Acil durum</span>
            <span className="tile__title">12 senaryo</span>
            <span className="tile__text">Yangından deprem sonrası pist taramasına: olayı ilk fark eden kovan.</span>
          </a>

          <a className="tile tile--w4 glass" href={href('hangar')}>
            <span className="tile__label">Hangar</span>
            <span className="tile__title">Ne kadar taşır?</span>
            <span className="tile__text">İşçi drone ≈2,7 kg faydalı yük; nesne toplamada tasarım sınırı 1 kg.</span>
          </a>

          <a className="tile tile--w4 glass" href={href('emniyet', 'karistirma')}>
            <span className="tile__label">Emniyet</span>
            <span className="tile__title">Sinyal karıştırmaya dayanıklı</span>
            <span className="tile__text">GNSS kesilirse UWB ve görsel konum devreye girer; tutarsız kaynak dışarıda kalır.</span>
          </a>

          <a className="tile tile--w4 glass" href={href('etki')}>
            <span className="tile__label">Etki</span>
            <span className="tile__value">1,8×</span>
            <span className="tile__text">Kovan tükettiğinden fazlasını güneş ve rüzgârdan üretiyor. Varsayımları değiştirip kendiniz hesaplayın.</span>
          </a>

          <a className="tile tile--w4 glass" href={href('gelisim')}>
            <span className="tile__label">Gelişim</span>
            <span className="tile__title">v1 → v2 → v3</span>
            <span className="tile__text">Mentör geri bildirimiyle kapsamı daralttık, sonra kovanı görevine göre uzmanlaştırdık.</span>
          </a>
        </div>

        <section className="block glass home-block" aria-labelledby="ops-h">
          <header className="block__head">
            <h2 id="ops-h">Görevi kendiniz yönetin</h2>
            <p>
              Çanakkale pistinin dijital ikizinde bir uçuş öncesi FOD taramasını baştan sona izleyin: kule onayını siz verin, piste kendi nesnenizi bırakın ve bir arıza vererek emniyet
              kurallarının nasıl devreye girdiğini görün.
            </p>
          </header>
          <OpsTeaser />
        </section>
      </main>
    </>
  )
}
