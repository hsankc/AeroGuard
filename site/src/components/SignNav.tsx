import { useEffect, useRef, useState } from 'react'
import { SECTIONS } from '../data/sections'
import { useLang } from '../i18n'
import { useSim } from '../sim/store'
import { useUi } from './uiStore'
import logo from '../assets/logo.webp'
import './nav.css'

/*
  Gezinme, havalimanı tabela dizisi gibi çalışır:
  ortada bulunduğunuz bölümün konum tabelası (siyah/sarı),
  iki yanında önceki ve sonraki bölümün yön tabelaları (sarı/siyah).
*/
export function SignNav({ current }: { current: number }) {
  const { lang, setLang, t } = useLang()
  const openOps = () => useSim.getState().set({ opsOpen: true })
  const [mapOpen, setMapOpen] = useState(false)
  const mapRef = useRef<HTMLDivElement>(null)

  const cur = current >= 0 ? SECTIONS[current] : null
  const prev = current > 0 ? SECTIONS[current - 1] : null
  const next = current < SECTIONS.length - 1 ? SECTIONS[current + 1] : null

  useEffect(() => {
    if (!mapOpen) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMapOpen(false)
    const onDown = (e: MouseEvent) => {
      if (mapRef.current && !mapRef.current.contains(e.target as Node)) setMapOpen(false)
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('mousedown', onDown)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('mousedown', onDown)
    }
  }, [mapOpen])

  return (
    <header className={`nav ${current < 0 ? 'nav--hero' : ''}`}>
      <a className="nav__brand" href="#top" aria-label="AERO-GUARD, başa dön">
        <img src={logo} alt="" width={40} height={29} />
        <span>AERO-GUARD</span>
      </a>

      <nav className="nav__signs" aria-label={t({ tr: 'Bölümler', en: 'Sections' })}>
        {prev ? (
          <a className="sign-dir nav__dir" href={`#${prev.id}`} title={t(prev.short)}>
            <span aria-hidden="true">←</span> {prev.letter}
            <span className="visually-hidden">{t(prev.short)}</span>
          </a>
        ) : null}
        <span className="sign-loc nav__loc" aria-current="location">
          {cur ? cur.letter : '04'}
        </span>
        <span className="nav__here">{cur ? t(cur.short) : t({ tr: 'Pist başı', en: 'Runway threshold' })}</span>
        {next && (
          <a className="sign-dir nav__dir" href={`#${next.id}`} title={t(next.short)}>
            {next.letter} <span aria-hidden="true">→</span>
            <span className="visually-hidden">{t(next.short)}</span>
          </a>
        )}
      </nav>

      <div className="nav__tools">
        <div className="nav__map" ref={mapRef}>
          <button
            type="button"
            className="nav__tool"
            aria-expanded={mapOpen}
            aria-controls="airport-diagram"
            onClick={() => setMapOpen((v) => !v)}
          >
            {t({ tr: 'Harita', en: 'Map' })}
          </button>
          {mapOpen && (
            <div id="airport-diagram" className="nav__diagram">
              <ol>
                {SECTIONS.map((s, i) => (
                  <li key={s.id}>
                    <a href={`#${s.id}`} onClick={() => setMapOpen(false)} aria-current={i === current ? 'true' : undefined}>
                      <span className="sign-loc">{s.letter}</span>
                      <span>{t(s.short)}</span>
                    </a>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
        <button type="button" className="nav__tool nav__asm" onClick={() => useUi.getState().openAssumptions()}>
          {t({ tr: 'Varsayımlar', en: 'Assumptions' })}
        </button>
        <button
          type="button"
          className="nav__tool"
          onClick={() => setLang(lang === 'tr' ? 'en' : 'tr')}
          aria-label={lang === 'tr' ? 'Switch to English' : 'Türkçeye geç'}
        >
          {lang === 'tr' ? 'EN' : 'TR'}
        </button>
        <button type="button" className="btn btn--primary nav__ops" onClick={openOps}>
          {t({ tr: 'Operasyon merkezi', en: 'Operations' })}
        </button>
      </div>
    </header>
  )
}
