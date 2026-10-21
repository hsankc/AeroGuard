import { Fact } from '../components/Fact'
import { href } from '../app/router'
import { useSim } from '../sim/store'
import { getEngine } from '../sim/engine'
import { usePlanner } from '../planner/store'
import { DAY_END, DAY_START, actual, fmt } from '../planner/plan'
import { HiveMini } from './HiveMini'
import { useLang, useNum, useTx } from '../i18n'
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
  const tx = useTx()
  const num = useNum()
  const { t } = useLang()
  const stats = usePlanner((s) => s.plan.stats)
  const next = usePlanner((s) => s.plan.tasks.find((t) => t.type === 'fod' && t.status === 'ok'))

  return (
    <>
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero__shade" aria-hidden="true" />
        <div className="hero__content">
          <h1 id="hero-title" className="hero__title">
            {tx('Her uçuştan önce, doğrulanmış temiz pist.')}
          </h1>
          <p className="hero__sub">
            {tx('AERO-GUARD, bölgesel havalimanları için kendi enerjisini üreten bir drone kovanı: kâşifler pisti tarar, işçiler bulunanı toplar, bekçiler kuşu uzaklaştırır, nöbetçiler acil durumu ilk fark eder. Pilot saha Çanakkale Havalimanı.')}
          </p>
          <div className="hero__actions">
            <button type="button" className="btn btn--primary" onClick={openOps}>
              {tx('Operasyon merkezini aç')}
            </button>
            <button type="button" className="btn btn--ghost-light" onClick={() => openExplore()}>
              {tx('3D’de gez (WASD)')}
            </button>
            <a className="btn btn--ghost-light" href={href('kovan')}>
              {tx('Kovanı tanı')}
            </a>
          </div>
        </div>
        <dl className="hero__readout glass glass--soft">
          <div>
            <dt>{tx('iki kâşif ile tam pist taraması')}</dt>
            <dd>
              <Fact id="scanTime" />
            </dd>
          </div>
          <div>
            <dt>{tx('yenilenebilir üretim / tasarım yükü, mini kovan')}</dt>
            <dd>
              <Fact id="energyRatio" />
            </dd>
          </div>
          <div>
            <dt>{tx('yıllık CO₂ azaltımı, havalimanı başına')}</dt>
            <dd>
              <Fact id="co2" />
            </dd>
          </div>
          <div>
            <dt>{tx('mini kovan kurulumu')}</dt>
            <dd>
              <Fact id="capex" />
            </dd>
          </div>
          <div>
            <dt>{tx('prototipten 3–5 havalimanına')}</dt>
            <dd>
              <Fact id="roadmap" />
            </dd>
          </div>
        </dl>
        <p className="hero__sim-note">{tx('Temsili simülasyon görüntüsü')}</p>
      </section>

      <main className="home" aria-label="Keşfet">
        <div className="bento">
          <a className="tile tile--w7 tile--tall glass home-hive" href={href('kovan')}>
            <span className="tile__label">{tx('Kovan')}</span>
            <span className="tile__title">{tx('Görevine göre uzmanlaşmış drone’lar')}</span>
            <HiveMini />
            <span className="tile__foot">{tx('Kastları ve kovan boylarını gör')}</span>
          </a>

          <button type="button" className="tile tile--w5 glass home-ops" onClick={openOps}>
            <span className="tile__label">{tx('Operasyon merkezi')}</span>
            <span className="tile__title">{tx('Kule onayını siz verin')}</span>
            <span className="tile__text">{tx('Piste bir cıvata bırakın, kâşiflerin onu bulmasını izleyin, sonra bir arıza verip emniyet kurallarının devreye girişini görün.')}</span>
            <span className="tile__foot">{tx('Simülasyonu başlat')}</span>
          </button>

          <button type="button" className="tile tile--w5 glass" onClick={playDay}>
            <span className="tile__label">{tx('Bir günü oynat')}</span>
            <span className="tile__title">{tx('05:00’ten gece yarısına')}</span>
            <span className="tile__text">{tx('Uçaklar iner ve kalkar, görevler tarifeye göre başlar, rüzgârlı saatlerde pist araçla denetlenir.')}</span>
            <span className="tile__foot">{tx('300× hızla izle')}</span>
          </button>

          <a className="tile tile--w4 glass" href={href('sistem', 'problem')}>
            <span className="tile__label">{tx('Problem')}</span>
            <span className="tile__value">{num('13,9 milyar $')}</span>
            <span className="tile__text">{tx('FOD ve kuş çarpmalarının dünya genelinde yıllık toplam maliyeti')}</span>
          </a>

          <a className="tile tile--w8 glass home-planner" href={href('planlayici')}>
            <span className="tile__label">{tx('Planlayıcı')}</span>
            <span className="tile__title">{tx('Drone ile uçak hiç karşılaşmaz')}</span>
            <MiniDay />
            <span className="tile__text">
              {t({
                tr: `Bugün ${stats.planned} görev, %${Math.round(stats.completion * 100)} gerçekleşme.`,
                en: `${stats.planned} tasks today, ${Math.round(stats.completion * 100)}% completed.`,
              })}
              {next ? t({ tr: ` Sıradaki FOD taraması ${fmt(next.start)}: ${next.label}.`, en: ` Next FOD scan at ${fmt(next.start)}.` }) : ''}
            </span>
          </a>

          <a className="tile tile--w4 glass home-emergency" href={href('acil-durum')}>
            <span className="tile__label">{tx('Acil durum')}</span>
            <span className="tile__title">{tx('12 senaryo')}</span>
            <span className="tile__text">{tx('Yangından deprem sonrası pist taramasına: olayı ilk fark eden kovan.')}</span>
          </a>

          <a className="tile tile--w4 glass" href={href('hangar')}>
            <span className="tile__label">{tx('Hangar')}</span>
            <span className="tile__title">{tx('Ne kadar taşır?')}</span>
            <span className="tile__text">{tx('İşçi drone ≈2,7 kg faydalı yük; nesne toplamada tasarım sınırı 1 kg.')}</span>
          </a>

          <a className="tile tile--w4 glass" href={href('emniyet', 'karistirma')}>
            <span className="tile__label">{tx('Emniyet')}</span>
            <span className="tile__title">{tx('Sinyal karıştırmaya dayanıklı')}</span>
            <span className="tile__text">{tx('GNSS kesilirse UWB ve görsel konum devreye girer; tutarsız kaynak dışarıda kalır.')}</span>
          </a>

          <a className="tile tile--w4 glass" href={href('etki')}>
            <span className="tile__label">{tx('Etki')}</span>
            <span className="tile__value">{num('1,8×')}</span>
            <span className="tile__text">{tx('Mini kovan tükettiğinin 1,8 katını güneş ve rüzgârdan üretiyor. Hücre ekledikçe dengenin nasıl değiştiğini Kovanını kur’da görün.')}</span>
          </a>

          <a className="tile tile--w4 glass" href={href('gelisim')}>
            <span className="tile__label">{tx('Gelişim')}</span>
            <span className="tile__title">v1 → v2 → V3</span>
            <span className="tile__text">{tx('Mentör geri bildirimiyle kapsamı daralttık, sonra kovanı görevine göre uzmanlaştırdık.')}</span>
          </a>
        </div>

        <section className="block glass home-block" aria-labelledby="ops-h">
          <header className="block__head">
            <h2 id="ops-h">{tx('Görevi kendiniz yönetin')}</h2>
            <p>
              {tx('Çanakkale pistinin dijital ikizinde bir uçuş öncesi FOD taramasını baştan sona izleyin: kule onayını siz verin, piste kendi nesnenizi bırakın ve bir arıza vererek emniyet kurallarının nasıl devreye girdiğini görün.')}
            </p>
          </header>
          <OpsTeaser />
        </section>
      </main>
    </>
  )
}
