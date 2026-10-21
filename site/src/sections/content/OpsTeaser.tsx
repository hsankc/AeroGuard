import { useLang } from '../../i18n'
import { useSim } from '../../sim/store'

const STEPS = [
  { tr: 'Kule onay ekranında görevi onaylayın; onay olmadan drone kalkmaz.', en: 'Approve the mission on the tower screen; no drone takes off without it.' },
  { tr: 'Piste kendi nesnenizi bırakın ve tarama sırasında drone kamerasında tespit edilişini izleyin.', en: 'Drop your own object on the runway and watch the drone camera detect it.' },
  { tr: 'Tespitleri saha ekibi olarak onaylayın, yanlış alarm olarak işaretleyin ya da küçük nesneyi işçiye toplatın.', en: 'Confirm detections as the field team, mark them as false alarms, or have the worker pick up a small object.' },
  { tr: 'Kâşifler peteğe döndüğünde temiz pist raporunu açın ve yazdırın.', en: 'When the scouts are docked, open and print the clean runway report.' },
]

export function OpsTeaser() {
  const { t } = useLang()
  const open = () => useSim.getState().set({ opsOpen: true })
  return (
    <div className="ops-teaser">
      <ol className="ops-teaser__steps">
        {STEPS.map((s, i) => (
          <li key={i}>
            <span className="ops-teaser__n num">{i + 1}</span>
            <span>{t(s)}</span>
          </li>
        ))}
      </ol>
      <div className="ops-teaser__cta glass glass--soft">
        <button type="button" className="btn btn--primary" onClick={open}>
          {t({ tr: 'Operasyon merkezini aç', en: 'Open operations' })}
        </button>
        <p>
          {t({
            tr: 'Bir arıza da verebilirsiniz: ADS-B uyarısı, iletişim kaybı, ani yan rüzgâr, GNSS karıştırma ya da aldatma; kule görevi her an geri çağırabilir.',
            en: 'You can also inject a fault: an ADS-B alert, a lost link, a sudden crosswind, GNSS jamming or spoofing; the tower can recall the mission at any time.',
          })}
        </p>
      </div>
    </div>
  )
}
