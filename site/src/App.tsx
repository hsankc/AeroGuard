import { lazy, Suspense, useEffect } from 'react'
import { LangProvider, useTx } from './i18n'
import { GlassNav } from './app/GlassNav'
import { SiteFoot } from './app/SiteFoot'
import { pageById } from './app/pages'
import { scrollToBlock, useRoute } from './app/router'
import { RouteView } from './pages/Routes'
import { SimHost } from './sim/SimHost'
import { useSim } from './sim/store'
import { Assumptions } from './components/Assumptions'
import { Presenter } from './present/Presenter'

const OpsCenter = lazy(() => import('./ops/OpsCenter'))
const ExploreHud = lazy(() => import('./explore/ExploreHud').then((m) => ({ default: m.ExploreHud })))
const SceneHud = lazy(() => import('./emergency/SceneHud').then((m) => ({ default: m.SceneHud })))

export default function App() {
  const route = useRoute()
  const meta = pageById(route.id)
  const opsOpen = useSim((s) => s.opsOpen)
  const exploreOpen = useSim((s) => s.exploreOpen)
  const scene = useSim((s) => s.scene)

  useEffect(() => {
    document.body.classList.toggle('ops-open', opsOpen)
  }, [opsOpen])

  // yeni sayfa başa açılır; blok verildiyse o bloğa kaydırılır (efekt DOM güncellendikten sonra çalışır)
  useEffect(() => {
    scrollToBlock(route.block)
  }, [route.id, route.block])

  return (
    <LangProvider>
      <DocTitle home={route.id === 'home'} nav={meta.nav} />
      <SimHost station={meta.station} />
      <GlassNav current={route.id} />
      <div key={route.id} className="route">
        <RouteView id={route.id} />
      </div>
      <SiteFoot />
      <Assumptions />
      <Presenter />
      {opsOpen && (
        <Suspense fallback={null}>
          <OpsCenter />
        </Suspense>
      )}
      {exploreOpen && !opsOpen && !scene && (
        <Suspense fallback={null}>
          <ExploreHud />
        </Suspense>
      )}
      {scene && !opsOpen && (
        <Suspense fallback={null}>
          <SceneHud />
        </Suspense>
      )}
    </LangProvider>
  )
}

/** Sekme başlığı seçili dilde */
function DocTitle({ home, nav }: { home: boolean; nav: string }) {
  const tx = useTx()
  useEffect(() => {
    document.title = home ? 'AERO-GUARD' : `${tx(nav)} · AERO-GUARD`
  }, [home, nav, tx])
  return null
}
