import { Fact } from '../components/Fact'
import { useLang } from '../i18n'
import { useSim } from '../sim/store'
import './hero.css'

export function Hero() {
  const { t } = useLang()
  const openOps = () => useSim.getState().set({ opsOpen: true })

  return (
    <section id="top" className="hero" aria-labelledby="hero-title">
      <div className="hero__shade" aria-hidden="true" />
      <div className="hero__content">
        <h1 id="hero-title" className="hero__title">
          {t({ tr: 'Her uçuştan önce, doğrulanmış temiz pist.', en: 'A verified clean runway before every flight.' })}
        </h1>
        <p className="hero__sub">
          {t({
            tr: 'AERO-GUARD, bölgesel havalimanları için kendi enerjisini üreten ve uçuş tarifesine göre çalışan otonom bir drone istasyonu. Pilot saha: Çanakkale Havalimanı.',
            en: 'AERO-GUARD is an autonomous drone station for regional airports that produces its own energy and works around the flight schedule. Pilot site: Çanakkale Airport.',
          })}
        </p>
        <div className="hero__actions">
          <button type="button" className="btn btn--primary" onClick={openOps}>
            {t({ tr: 'Operasyon merkezini aç', en: 'Open operations' })}
          </button>
          <a className="btn btn--ghost-light" href="#problem">
            {t({ tr: 'Projeyi incele', en: 'Explore the project' })}
          </a>
        </div>
      </div>

      <dl className="hero__readout">
        <div>
          <dt>{t({ tr: 'iki drone ile tam pist taraması', en: 'full runway scan, two drones' })}</dt>
          <dd><Fact id="scanTime" /></dd>
        </div>
        <div>
          <dt>{t({ tr: 'yenilenebilir üretim / tasarım yükü', en: 'renewables / design load' })}</dt>
          <dd><Fact id="energyRatio" /></dd>
        </div>
        <div>
          <dt>{t({ tr: 'yıllık CO₂ azaltımı, havalimanı başına', en: 'CO₂ cut per airport per year' })}</dt>
          <dd><Fact id="co2" /></dd>
        </div>
        <div>
          <dt>{t({ tr: 'havalimanı başına ilk kurulum', en: 'setup cost per airport' })}</dt>
          <dd><Fact id="capex" /></dd>
        </div>
        <div>
          <dt>{t({ tr: 'prototipten 3–5 havalimanına', en: 'prototype to 3–5 airports' })}</dt>
          <dd><Fact id="roadmap" /></dd>
        </div>
      </dl>
      <p className="hero__sim-note">{t({ tr: 'Temsili simülasyon görüntüsü', en: 'Illustrative simulation' })}</p>
    </section>
  )
}
