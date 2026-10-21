import { useEffect, useRef, useState } from 'react'
import { HangarViewerEngine } from './viewer'
import { useHangar } from './store'
import type { HangarModelId, HeadId } from './models'
import './hangar.css'

/*
  3D hangar: kovanın modelleri stüdyo ışığında. Döndür, yakınlaştır, parçalarına ayır, parçaya tıkla;
  işçide toplama ve kamera başlığı arasında geçiş. Teknik değerler platform kartlarıyla aynı kaynaktan.
*/

const MODELS: { id: HangarModelId; name: string; caste: string; color: string }[] = [
  { id: 'scout', name: 'Kâşif', caste: 'M3TD sınıfı', color: 'var(--caste-scout)' },
  { id: 'guard', name: 'Bekçi', caste: 'M3TD sınıfı + hoparlör ve ışık', color: 'var(--caste-guard)' },
  { id: 'worker', name: 'İşçi / Bakıcı', caste: 'M350 sınıfı', color: 'var(--caste-worker)' },
  { id: 'cell', name: 'Petek hücresi', caste: 'Dock 2 sınıfı istasyon', color: 'var(--honey)' },
  { id: 'turbine', name: 'Türbin', caste: '3 kW dikey eksenli', color: 'var(--energy)' },
]

const SPECS: Record<HangarModelId, [string, string][]> = {
  scout: [
    ['Görev', 'FOD taraması, açılış, pist sağlığı'],
    ['Kamera', '48 MP geniş + 640 × 512 termal'],
    ['Uçuş', '≈50 dk (laboratuvar)'],
    ['Rüzgâr', '12 m/s çalışma, 8 m/s iniş-kalkış'],
    ['Koruma', 'IP54, −20…45 °C (doğrulanacak)'],
  ],
  guard: [
    ['Görev', 'Yaban hayatı, çit, izinsiz giriş'],
    ['Ek', 'Hafif hoparlör ve ışık'],
    ['Uçuş', '≈50 dk (laboratuvar)'],
    ['Paralel', 'Kâşiflerle aynı anda uçabilir'],
  ],
  worker: [
    ['Görev', 'Nesne toplama; bakıcı rolünde buz haritası'],
    ['Faydalı yük', '≈2,7 kg; başlık ≈1,2 kg'],
    ['Toplama sınırı', '≤ 1 kg, ≤ 30 cm'],
    ['Koruma', 'IP55, −20…50 °C, 12 m/s'],
    ['Uçuş', '≈55 dk boş, yükle daha kısa'],
  ],
  cell: [
    ['Koruma', 'IP55, −25…45 °C'],
    ['Şarj', '%20 → %90, 32 dk'],
    ['Enerji', 'İklimlendirme ≈100 W'],
    ['Büyüme', 'Petek başına 6 hücreye kadar'],
  ],
  turbine: [
    ['Güç', '3 kW, ≈12 m/s’de'],
    ['Devreye girme / koruma', '≈3 m/s / ≈25 m/s'],
    ['Yükseklik', '≈9,2 m (izin ≈16 m)'],
    ['Kapasite faktörü', '%12 (temkinli)'],
  ],
}

export function HangarViewer() {
  const wrap = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const labels = useRef<HTMLDivElement>(null)
  const eng = useRef<HangarViewerEngine | null>(null)
  const model = useHangar((s) => s.model)
  const setModel = useHangar((s) => s.setModel)
  const [exploded, setExploded] = useState(false)
  const [head, setHead] = useState<HeadId>('pickup')
  const [sel, setSel] = useState<string | null>(null)
  const [hover, setHover] = useState<string | null>(null)
  const [, force] = useState(0)

  useEffect(() => {
    if (!canvas.current || !wrap.current) return
    let e: HangarViewerEngine
    try {
      e = new HangarViewerEngine(canvas.current, wrap.current, { hover: setHover, select: setSel })
    } catch {
      return
    }
    e.labelLayer = labels.current
    eng.current = e
    e.load(useHangar.getState().model)
    if (import.meta.env.DEV) (window as unknown as { __hangar: HangarViewerEngine }).__hangar = e
    return () => {
      e.dispose()
      eng.current = null
    }
  }, [])

  useEffect(() => {
    eng.current?.load(model)
    setExploded(false)
    setSel(null)
    setHead('pickup')
  }, [model])

  useEffect(() => {
    if (eng.current) eng.current.explodeTarget = exploded ? 1 : 0
  }, [exploded])

  // başlık değişimi sürerken parça adı değişir: kartı tazele
  useEffect(() => {
    eng.current?.setHead(head)
    const id = window.setTimeout(() => force((n) => n + 1), 1500)
    return () => window.clearTimeout(id)
  }, [head])

  const info = eng.current?.partName(sel ?? hover) ?? null
  const m = MODELS.find((x) => x.id === model)!

  return (
    <div className="hv">
      <div className="hv__stage glass glass--soft" ref={wrap}>
        <canvas ref={canvas} className="hv__canvas" aria-label={`${m.name} 3D modeli: sürükleyerek döndürün`} />
        <div className="hv__labels" ref={labels} aria-hidden="true" />
        <span className="hv__hint">Sürükle: döndür · tekerlek: yakınlaştır · parçaya tıkla</span>
        <span className="hv__tag">Temsili model, gerçek ölçek</span>
      </div>
      <aside className="hv__side glass glass--soft">
        <div className="hv__tabs" role="tablist" aria-label="Modeller">
          {MODELS.map((x) => (
            <button key={x.id} type="button" role="tab" aria-selected={x.id === model} style={{ ['--c' as string]: x.color }} onClick={() => setModel(x.id)}>
              {x.name}
            </button>
          ))}
        </div>
        <div className="hv__head" style={{ ['--c' as string]: m.color }}>
          <span className="tile__label">{m.caste}</span>
          <h3>{m.name}</h3>
        </div>
        <div className="hv__controls">
          <button type="button" className="btn btn--primary" aria-pressed={exploded} onClick={() => setExploded((v) => !v)}>
            {exploded ? 'Parçaları birleştir' : 'Parçalarına ayır'}
          </button>
          {model === 'worker' && (
            <div className="pseg" role="group" aria-label="Başlık">
              <button type="button" aria-pressed={head === 'pickup'} onClick={() => setHead('pickup')}>
                Toplama başlığı
              </button>
              <button type="button" aria-pressed={head === 'camera'} onClick={() => setHead('camera')}>
                Kamera (bakıcı)
              </button>
            </div>
          )}
        </div>
        <div className="hv__part" aria-live="polite">
          {info ? (
            <>
              <b>{info.name}</b>
              <p>{info.info}</p>
            </>
          ) : (
            <p className="hv__muted">Bir parçaya tıklayın ya da “Parçalarına ayır” ile bütün parçaları görün.</p>
          )}
        </div>
        <dl className="hv__specs">
          {SPECS[model].map(([k, v]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
      </aside>
    </div>
  )
}
