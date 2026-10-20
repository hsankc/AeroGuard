import type { ReactNode } from 'react'
import { SECTIONS, type SectionMeta } from '../data/sections'
import { useLang } from '../i18n'
import { useSim } from '../sim/store'
import logo from '../assets/logo.webp'
import { Planner } from '../planner/Planner'
import './sections.css'
import './content/content.css'
import { Problem } from './content/Problem'
import { Evolution } from './content/Evolution'
import { Site } from './content/Site'
import { Architecture } from './content/Architecture'
import { Missions } from './content/Missions'
import { ScanCalc } from './content/ScanCalc'
import { EnergyCalc } from './content/EnergyCalc'
import { ImpactCalc } from './content/ImpactCalc'
import { BusinessCalc } from './content/BusinessCalc'
import { AI } from './content/AI'
import { Market } from './content/Market'
import { Safety } from './content/Safety'
import { Roadmap } from './content/Roadmap'
import { Faq } from './content/Faq'
import './content/content2.css'
import './content/content3.css'

/** Bölüm kimliği → içerik bileşeni (henüz yazılmamış olanlar yer tutucu metni gösterir) */
const CONTENT: Record<string, () => ReactNode> = {
  ai: AI,
  market: Market,
  safety: Safety,
  roadmap: Roadmap,
  faq: Faq,
  problem: Problem,
  evolution: Evolution,
  site: Site,
  architecture: Architecture,
  missions: Missions,
  scan: ScanCalc,
  energy: EnergyCalc,
  impact: ImpactCalc,
  business: BusinessCalc,
  planner: Planner,
}

function SectionShell({ meta, tone, children }: { meta: SectionMeta; tone?: 'dark'; children?: ReactNode }) {
  const { t } = useLang()
  return (
    <section id={meta.id} className={`section ${tone === 'dark' ? 'section--dark' : ''}`} aria-labelledby={`${meta.id}-title`}>
      <div className="section__inner">
        <header className="section__head">
          <h2 id={`${meta.id}-title`} className="section__title">
            <span className="sign-loc section__sign" aria-hidden="true">
              {meta.letter}
            </span>
            {t(meta.title)}
          </h2>
          <p className="section__lead">{t(meta.lead)}</p>
        </header>
        {children ?? (meta.coming && <p className="placeholder-note">{t(meta.coming)}</p>)}
      </div>
    </section>
  )
}

function OpsTeaser({ meta }: { meta: SectionMeta }) {
  const { t } = useLang()
  const open = () => useSim.getState().set({ opsOpen: true })
  const steps = [
    { tr: 'Kule onay ekranında görevi onaylayın; onay olmadan drone kalkmaz.', en: 'Approve the mission on the tower screen; no drone takes off without it.' },
    { tr: 'Piste kendi nesnenizi bırakın ve tarama sırasında drone kamerasında tespit edilişini izleyin.', en: 'Drop your own object on the runway and watch the drone camera detect it.' },
    { tr: 'Tespitleri saha ekibi olarak onaylayın ya da yanlış alarm olarak işaretleyin.', en: 'Confirm detections as the field team, or mark them as false alarms.' },
    { tr: 'İki drone istasyona döndüğünde temiz pist raporunu açın ve yazdırın.', en: 'When both drones are docked, open and print the clean runway report.' },
  ]
  return (
    <SectionShell meta={meta} tone="dark">
      <div className="ops-teaser">
        <ol className="ops-teaser__steps">
          {steps.map((s, i) => (
            <li key={i}>
              <span className="ops-teaser__n num">{i + 1}</span>
              <span>{t(s)}</span>
            </li>
          ))}
        </ol>
        <div className="ops-teaser__cta">
          <button type="button" className="btn btn--primary" onClick={open}>
            {t({ tr: 'Operasyon merkezini aç', en: 'Open operations' })}
          </button>
          <p>
            {t({
              tr: 'Bir arıza da verebilirsiniz: ADS-B uyarısı, iletişim kaybı, sanal sınır aşımı ya da kulenin geri çağırması.',
              en: 'You can also inject a fault: an ADS-B alert, a lost link, a geofence breach or a tower recall.',
            })}
          </p>
        </div>
      </div>
    </SectionShell>
  )
}

const TEAM = ['Hasan Kaşıkcı', 'Oğuz Kortun', 'Ensar Enes Akkuş', 'Efekaan Bengi']

function Team({ meta }: { meta: SectionMeta }) {
  const { t } = useLang()
  return (
    <SectionShell meta={meta} tone="dark">
      <div className="team">
        <img className="team__logo" src={logo} alt="AERO-GUARD logosu" width={260} height={187} />
        <div>
          <ul className="team__names">
            {TEAM.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
          <p className="team__uni">
            {t({ tr: 'Çanakkale Onsekiz Mart Üniversitesi, Bilgisayar Mühendisliği', en: 'Çanakkale Onsekiz Mart University, Computer Engineering' })}
          </p>
          <p className="team__note">
            {t({
              tr: 'Ekip üyelerimizin de yer aldığı ÇOMÜ Binary Health takımı, TEKNOFEST 2026 Sağlıkta Yapay Zekâ yarışmasında kendi eğittiği modelle finale kaldı. Bu tecrübeyi veri hazırlama, eğitim ve değerlendirme süreçlerine taşıyoruz.',
              en: 'ÇOMÜ Binary Health, a team that includes some of our members, reached the TEKNOFEST 2026 AI in Healthcare final with a model it trained itself.',
            })}
          </p>
          <p className="team__event">Innovative Approaches in Technology for Sustainable Aviation, Türkiye Sürdürülebilir Havacılık Platformu (TSAA)</p>
        </div>
      </div>
    </SectionShell>
  )
}

export function Sections() {
  return (
    <>
      {SECTIONS.map((meta) => {
        if (meta.id === 'ops') return <OpsTeaser key={meta.id} meta={meta} />
        if (meta.id === 'team') return <Team key={meta.id} meta={meta} />
        const Body = CONTENT[meta.id]
        return (
          <SectionShell key={meta.id} meta={meta}>
            {Body ? (
              <div className="content-viz">
                <Body />
              </div>
            ) : undefined}
          </SectionShell>
        )
      })}
    </>
  )
}
