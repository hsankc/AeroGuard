import { PAGES } from './pages'
import { href } from './router'
import { useUi } from '../components/uiStore'
import { useTx } from '../i18n'
import { QR_HOST, QR_URL, QrCode } from '../present/QrCode'

export function SiteFoot() {
  const tx = useTx()
  return (
    <footer className="site-foot">
      <div className="site-foot__inner">
        <p>
          <b>AERO-GUARD</b> · ÇOMÜ Bilgisayar Mühendisliği · TSAA Innovative Approaches in Technology for Sustainable Aviation
        </p>
        <nav aria-label="Alt bilgi">
          {PAGES.filter((p) => p.id !== 'home').map((p) => (
            <a key={p.id} href={href(p.id)}>
              {tx(p.nav)}
            </a>
          ))}
          <button type="button" className="site-foot__link" onClick={() => useUi.getState().openAssumptions()}>
            {tx('Varsayımlar')}
          </button>
        </nav>
        <a className="site-foot__qr" href={QR_URL}>
          <QrCode size={84} label={tx('Sitenin QR kodu')} />
          <span>
            {tx('Telefonda aç')}
            <b className="num">{QR_HOST}</b>
          </span>
        </a>
        <p>{tx('3D sahne ve simülasyonlar temsilidir. Rakamlar ön tasarım tahminidir; her birinin varsayımı Varsayımlar panelinde.')}</p>
      </div>
    </footer>
  )
}
