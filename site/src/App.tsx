import { lazy, Suspense, useEffect, useState } from 'react'
import { LangProvider } from './i18n'
import { SignNav } from './components/SignNav'
import { Hero } from './sections/Hero'
import { Sections } from './sections/Sections'
import { SECTIONS } from './data/sections'
import { SimHost } from './sim/SimHost'
import { useSim } from './sim/store'
import { Assumptions } from './components/Assumptions'

const OpsCenter = lazy(() => import('./ops/OpsCenter'))

/** Ekranın ortasındaki bölümü izler; tabela dizisi buna göre güncellenir. */
function useCurrentSection() {
  const [current, setCurrent] = useState(-1)
  useEffect(() => {
    const els = SECTIONS.map((s) => document.getElementById(s.id)).filter(Boolean) as HTMLElement[]
    const hero = document.getElementById('top')
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue
          if (e.target === hero) setCurrent(-1)
          else setCurrent(SECTIONS.findIndex((s) => s.id === e.target.id))
        }
      },
      { rootMargin: '-45% 0px -50% 0px' },
    )
    if (hero) io.observe(hero)
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])
  return current
}

export default function App() {
  const current = useCurrentSection()
  const opsOpen = useSim((s) => s.opsOpen)

  useEffect(() => {
    document.body.classList.toggle('ops-open', opsOpen)
  }, [opsOpen])

  return (
    <LangProvider>
      <SimHost />
      <SignNav current={current} />
      <main>
        <Hero />
        <Sections />
      </main>
      <Assumptions />
      {opsOpen && (
        <Suspense fallback={null}>
          <OpsCenter />
        </Suspense>
      )}
    </LangProvider>
  )
}
