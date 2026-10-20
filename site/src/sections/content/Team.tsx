import { useLang } from '../../i18n'
import logo from '../../assets/logo.webp'

const TEAM = ['Hasan Kaşıkcı', 'Oğuz Kortun', 'Ensar Enes Akkuş', 'Efekaan Bengi']

export function Team() {
  const { t } = useLang()
  return (
    <div className="team">
      <img className="team__logo" src={logo} alt="AERO-GUARD logosu" width={260} height={187} />
      <div>
        <ul className="team__names">
          {TEAM.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
        <p className="team__uni">{t({ tr: 'Çanakkale Onsekiz Mart Üniversitesi, Bilgisayar Mühendisliği', en: 'Çanakkale Onsekiz Mart University, Computer Engineering' })}</p>
        <p className="team__note">
          {t({
            tr: 'Ekip üyelerimizin de yer aldığı ÇOMÜ Binary Health takımı, TEKNOFEST 2026 Sağlıkta Yapay Zekâ yarışmasında kendi eğittiği modelle finale kaldı. Bu tecrübeyi veri hazırlama, eğitim ve değerlendirme süreçlerine taşıyoruz.',
            en: 'ÇOMÜ Binary Health, a team that includes some of our members, reached the TEKNOFEST 2026 AI in Healthcare final with a model it trained itself.',
          })}
        </p>
        <p className="team__event">Innovative Approaches in Technology for Sustainable Aviation, Türkiye Sürdürülebilir Havacılık Platformu (TSAA)</p>
      </div>
    </div>
  )
}
