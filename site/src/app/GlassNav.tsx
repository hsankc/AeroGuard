import { useEffect, useState } from 'react'
import { PAGES } from './pages'
import { href, type RouteId } from './router'
import { useLang } from '../i18n'
import { useSim } from '../sim/store'
import { useUi } from '../components/uiStore'
import logo from '../assets/logo.webp'
import './glassnav.css'

/** Üst gezinme: cam çubuk, birincil sayfalar, sağda araçlar; dar ekranda açılır menü. */
export function GlassNav({ current }: { current: RouteId }) {
  const { lang, setLang, t } = useLang()
  const [menu, setMenu] = useState(false)
  const openOps = () => {
    setMenu(false)
    useSim.getState().set({ opsOpen: true })
  }

  useEffect(() => setMenu(false), [current])
  useEffect(() => {
    if (!menu) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenu(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [menu])

  const primary = PAGES.filter((p) => p.primary)
  const secondary = PAGES.filter((p) => !p.primary && p.id !== 'home')

  return (
    <header className="gnav">
      <div className="gnav__bar">
        <a className="gnav__brand" href="#/" aria-label="AERO-GUARD ana sayfa">
          <img src={logo} alt="" width={40} height={29} />
          <span>AERO-GUARD</span>
        </a>

        <nav className="gnav__links" aria-label="Sayfalar">
          {primary.map((p) => (
            <a key={p.id} href={href(p.id)} aria-current={current === p.id ? 'page' : undefined}>
              {p.nav}
            </a>
          ))}
          {secondary.map((p) => (
            <a key={p.id} className="gnav__secondary" href={href(p.id)} aria-current={current === p.id ? 'page' : undefined}>
              {p.nav}
            </a>
          ))}
        </nav>

        <div className="gnav__tools">
          <button type="button" className="gnav__tool gnav__asm" onClick={() => useUi.getState().openAssumptions()}>
            {t({ tr: 'Varsayımlar', en: 'Assumptions' })}
          </button>
          <button type="button" className="gnav__tool" onClick={() => setLang(lang === 'tr' ? 'en' : 'tr')} aria-label={lang === 'tr' ? 'Switch to English' : 'Türkçeye geç'}>
            {lang === 'tr' ? 'EN' : 'TR'}
          </button>
          <button type="button" className="btn btn--primary gnav__ops" onClick={openOps}>
            {t({ tr: 'Operasyon merkezi', en: 'Operations' })}
          </button>
          <button type="button" className="gnav__tool gnav__menu-btn" aria-expanded={menu} aria-controls="gnav-menu" onClick={() => setMenu((v) => !v)}>
            {menu ? 'Kapat' : 'Menü'}
          </button>
        </div>
      </div>

      {menu && (
        <div id="gnav-menu" className="gnav__sheet glass glass--strong">
          <nav aria-label="Tüm sayfalar">
            {PAGES.map((p) => (
              <a key={p.id} href={href(p.id)} aria-current={current === p.id ? 'page' : undefined}>
                {p.nav}
              </a>
            ))}
          </nav>
          <div className="gnav__sheet-tools">
            <button type="button" className="btn btn--primary" onClick={openOps}>
              Operasyon merkezini aç
            </button>
            <button
              type="button"
              className="gnav__tool"
              onClick={() => {
                setMenu(false)
                useUi.getState().openAssumptions()
              }}
            >
              Varsayımlar
            </button>
          </div>
        </div>
      )}
    </header>
  )
}
