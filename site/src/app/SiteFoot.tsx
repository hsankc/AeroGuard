import { PAGES } from './pages'
import { href } from './router'
import { useUi } from '../components/uiStore'

export function SiteFoot() {
  return (
    <footer className="site-foot">
      <div className="site-foot__inner">
        <p>
          <b>AERO-GUARD</b> · ÇOMÜ Bilgisayar Mühendisliği · TSAA Innovative Approaches in Technology for Sustainable Aviation
        </p>
        <nav aria-label="Alt bilgi">
          {PAGES.filter((p) => p.id !== 'home').map((p) => (
            <a key={p.id} href={href(p.id)}>
              {p.nav}
            </a>
          ))}
          <button type="button" className="site-foot__link" onClick={() => useUi.getState().openAssumptions()}>
            Varsayımlar
          </button>
        </nav>
        <p>3D sahne ve simülasyonlar temsilidir. Rakamlar ön tasarım tahminidir; her birinin varsayımı Varsayımlar panelinde.</p>
      </div>
    </footer>
  )
}
