import type { ReactNode } from 'react'
import type { PageMeta } from './pages'
import { href } from './router'
import { useLang, useTx } from '../i18n'

/** Sayfa kabuğu: başlık, açıklama, sayfa içi çipler ve bloklar. */
export function Page({ meta, children, actions }: { meta: PageMeta; children: ReactNode; actions?: ReactNode }) {
  const tx = useTx()
  const { lang } = useLang()
  return (
    <main className="page" aria-labelledby="page-title">
      <div className="page__inner">
        <header className="page-hero">
          <h1 id="page-title">{tx(meta.title)}</h1>
          {meta.lead && <p>{tx(meta.lead)}</p>}
          {lang === 'en' && <p className="page-hero__lang">{tx('Bu sayfadaki ayrıntılı metinler Türkçedir; başlıklar, rakamlar ve 3D gösterimler iki dillidir.')}</p>}
          {(meta.blocks.length > 1 || actions) && (
            <nav className="page-hero__chips" aria-label="Bu sayfada">
              {meta.blocks.length > 1 &&
                meta.blocks.map((b) => (
                  <a key={b.id} className="chip" href={href(meta.id, b.id)}>
                    {tx(b.label)}
                  </a>
                ))}
              {actions}
            </nav>
          )}
        </header>
        {children}
      </div>
    </main>
  )
}

/** İçerik bloğu: cam panel içinde başlık, açıklama ve bileşen. */
export function Block({ id, title, lead, children, className }: { id: string; title: string; lead?: ReactNode; children: ReactNode; className?: string }) {
  const tx = useTx()
  return (
    <section id={id} className={`block glass content-viz ${className ?? ''}`} aria-labelledby={`${id}-h`}>
      <header className="block__head">
        <h2 id={`${id}-h`}>{tx(title)}</h2>
        {lead && <p>{typeof lead === 'string' ? tx(lead) : lead}</p>}
      </header>
      {children}
    </section>
  )
}
