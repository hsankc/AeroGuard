import { useEffect, useRef, useState } from 'react'
import { Fact } from '../../components/Fact'

/*
  Yapay zekâ önerir, insan karar verir.
  Operatör oyunu: altı tespit görüntüsü (kodla çizilmiş, temsili). Her karar eğitim kuyruğuna etiket olarak döner.
*/

type Kind = 'bolt' | 'stone' | 'plastic' | 'mark' | 'joint' | 'stain'
type Card = { kind: Kind; label: string; conf: number; real: boolean; truth: string }

const CARDS: Card[] = [
  { kind: 'bolt', label: 'Cıvata', conf: 0.94, real: true, truth: 'Gerçek bir cıvata.' },
  { kind: 'mark', label: 'Olası nesne', conf: 0.46, real: false, truth: 'Lastik izi; pistte nesne yok.' },
  { kind: 'stone', label: 'Taş', conf: 0.88, real: true, truth: 'Gerçek bir taş parçası.' },
  { kind: 'joint', label: 'Olası nesne', conf: 0.41, real: false, truth: 'Derz dolgusu; kaplamanın bir parçası.' },
  { kind: 'plastic', label: 'Plastik parça', conf: 0.96, real: true, truth: 'Gerçek bir plastik parça.' },
  { kind: 'stain', label: 'Olası nesne', conf: 0.52, real: false, truth: 'Yağ lekesi; FOD değil.' },
]

function rng(seed: number) {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return s / 2147483647
  }
}

/** Beton zemin üzerinde temsili tespit görüntüsü */
function Crop({ kind, seed }: { kind: Kind; seed: number }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = ref.current
    if (!c) return
    const g = c.getContext('2d')!
    const r = rng(seed)
    const W = c.width
    const H = c.height
    g.fillStyle = '#b8bbb6'
    g.fillRect(0, 0, W, H)
    for (let i = 0; i < 2600; i++) {
      const v = 150 + Math.floor(r() * 80)
      g.fillStyle = `rgba(${v},${v},${v - 4},0.35)`
      g.fillRect(r() * W, r() * H, 1.5, 1.5)
    }
    // derz çizgisi
    g.strokeStyle = 'rgba(80,82,82,0.7)'
    g.lineWidth = 2
    g.beginPath()
    g.moveTo(0, H * 0.82)
    g.lineTo(W, H * 0.82)
    g.stroke()
    const cx = W / 2
    const cy = H / 2
    g.save()
    g.translate(cx, cy)
    g.rotate((r() - 0.5) * 1.2)
    if (kind === 'bolt') {
      g.fillStyle = '#7d858d'
      g.fillRect(-22, -4, 40, 8)
      g.fillStyle = '#5f676f'
      g.beginPath()
      for (let i = 0; i < 6; i++) g.lineTo(-24 + Math.cos((i * Math.PI) / 3) * 9, Math.sin((i * Math.PI) / 3) * 9)
      g.fill()
      g.strokeStyle = 'rgba(255,255,255,0.35)'
      for (let i = -14; i < 16; i += 4) {
        g.beginPath()
        g.moveTo(i, -4)
        g.lineTo(i + 2, 4)
        g.stroke()
      }
    } else if (kind === 'stone') {
      g.fillStyle = '#7b7166'
      g.beginPath()
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * Math.PI * 2
        const rr = 12 + r() * 7
        g.lineTo(Math.cos(a) * rr * 1.2, Math.sin(a) * rr)
      }
      g.fill()
      g.fillStyle = 'rgba(255,255,255,0.15)'
      g.fillRect(-6, -8, 7, 4)
    } else if (kind === 'plastic') {
      g.fillStyle = '#eef2f5'
      g.beginPath()
      g.moveTo(-26, -10)
      g.lineTo(-6, -16)
      g.lineTo(22, -8)
      g.lineTo(28, 10)
      g.lineTo(2, 14)
      g.lineTo(-20, 8)
      g.closePath()
      g.fill()
      g.strokeStyle = 'rgba(120,130,140,0.6)'
      g.stroke()
    } else if (kind === 'mark') {
      g.fillStyle = 'rgba(40,40,40,0.35)'
      g.fillRect(-60, -7, 120, 14)
      g.fillStyle = 'rgba(30,30,30,0.25)'
      g.fillRect(-50, -3, 90, 5)
    } else if (kind === 'joint') {
      g.fillStyle = 'rgba(35,35,35,0.75)'
      g.fillRect(-4, -60, 8, 120)
    } else {
      const grd = g.createRadialGradient(0, 0, 2, 0, 0, 26)
      grd.addColorStop(0, 'rgba(30,28,24,0.55)')
      grd.addColorStop(1, 'rgba(30,28,24,0)')
      g.fillStyle = grd
      g.beginPath()
      g.ellipse(0, 0, 30, 20, 0, 0, Math.PI * 2)
      g.fill()
    }
    g.restore()
    g.strokeStyle = '#ffb020'
    g.lineWidth = 3
    g.strokeRect(cx - 38, cy - 30, 76, 60)
  }, [kind, seed])
  return <canvas ref={ref} width={192} height={144} className="ai-crop" aria-hidden="true" />
}

function OperatorGame() {
  const [answers, setAnswers] = useState<(boolean | null)[]>(CARDS.map(() => null))
  const labels = answers.filter((a) => a !== null).length
  const correct = answers.filter((a, i) => a !== null && a === CARDS[i].real).length
  return (
    <div className="ai-game">
      <div className="ai-game__head">
        <h3 className="content-h3">Saha ekibi siz olun</h3>
        <p>Model altı tespit önerdi. Hangileri gerçek nesne? Her kararınız modele yeni bir etiket olarak döner.</p>
        <p className="ai-game__count num" aria-live="polite">
          Eğitim kuyruğuna eklenen etiket: <b>{labels}</b>
          {labels === CARDS.length && `. ${correct}/${CARDS.length} doğru karar.`}
        </p>
      </div>
      <ul className="ai-game__grid">
        {CARDS.map((c, i) => {
          const a = answers[i]
          const answered = a !== null
          const right = answered && a === c.real
          return (
            <li key={i} className={answered ? (right ? 'is-right' : 'is-wrong') : undefined}>
              <Crop kind={c.kind} seed={i * 97 + 13} />
              <p className="ai-game__guess">
                Model: <b>{c.label}</b> <span className="num">%{Math.round(c.conf * 100)}</span>
              </p>
              {answered ? (
                <p className="ai-game__truth">
                  <span aria-hidden="true">{right ? '✓' : '✕'}</span> {c.truth}
                </p>
              ) : (
                <div className="ai-game__btns">
                  <button type="button" className="pbtn" onClick={() => setAnswers((s) => s.map((x, j) => (j === i ? true : x)))}>
                    Gerçek nesne
                  </button>
                  <button type="button" className="pbtn" onClick={() => setAnswers((s) => s.map((x, j) => (j === i ? false : x)))}>
                    Yanlış alarm
                  </button>
                </div>
              )}
            </li>
          )
        })}
      </ul>
      {labels > 0 && (
        <button type="button" className="ai-game__reset" onClick={() => setAnswers(CARDS.map(() => null))}>
          Baştan başla
        </button>
      )}
      <p className="ai-game__note">Görüntüler temsilidir, kodla çizilmiştir. Gerçek model FOD-A verisiyle eğitilecek ve Çanakkale pistinde yerel veriyle ince ayar yapılacak.</p>
    </div>
  )
}

export function AI() {
  return (
    <div className="ai">
      <ol className="ai-steps">
        <li>
          <span className="ai-steps__n num">1</span>
          <h3>Ön eğitim</h3>
          <p>
            Açık FOD-A veri seti: <Fact id="fodA" />. Her örnek ışık (aydınlık, loş, karanlık) ve hava (kuru, ıslak) koşuluyla etiketli. Hem drone’da hem kenar sunucuda gerçek zamanlı
            çalışabilen YOLO ailesi.
          </p>
        </li>
        <li>
          <span className="ai-steps__n num">2</span>
          <h3>Yerel veri</h3>
          <p>Çanakkale pistinde kontrollü olarak bırakılıp toplanan test nesneleriyle (cıvata, somun, plastik, taş) yerel veri ve ince ayar.</p>
        </li>
        <li>
          <span className="ai-steps__n num">3</span>
          <h3>Aktif öğrenme</h3>
          <p>Operatörün onayladığı veya reddettiği her tespit etiket olarak geri döner; model düzenli olarak yeniden eğitilir.</p>
        </li>
        <li>
          <span className="ai-steps__n num">4</span>
          <h3>İnsan onayı</h3>
          <p>Sistem pisti hiçbir zaman kendiliğinden “açık” ilan etmez. Temiz pist raporu kuleye bilgi olarak gider; karar insandadır.</p>
        </li>
      </ol>

      <OperatorGame />

      <div className="ai-kpi">
        <h3 className="content-h3">Pilot için ölçülebilir hedefler</h3>
        <table>
          <caption className="visually-hidden">Pilot uygulama hedef performans göstergeleri</caption>
          <thead>
            <tr>
              <th scope="col">Gösterge</th>
              <th scope="col">Hedef</th>
            </tr>
          </thead>
          <tbody>
            {(
              [
                ['kpiSensitivity', 'FOD tespit duyarlılığı (≥3 cm nesne)'],
                ['kpiFalseAlarm', 'Yanlış alarm'],
                ['kpiScanTime', 'Tarama süresi (iki drone)'],
                ['kpiReport', 'Tarama bitiminden kuleye rapor'],
                ['kpiCompletion', 'Planlanan taramaların gerçekleşmesi'],
                ['kpiEnergy', 'Yıllık enerji öz-yeterliliği'],
              ] as const
            ).map(([id, label]) => (
              <tr key={id}>
                <th scope="row">{label}</th>
                <td>
                  <Fact id={id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="ai-kpi__note">Hedefler pilotta ölçülerek doğrulanacak. Pilot boyunca araçla denetim paralel sürer.</p>
        <p className="ai-kpi__team">
          Ekip üyelerimizin de yer aldığı ÇOMÜ Binary Health takımı, TEKNOFEST 2026 Sağlıkta Yapay Zekâ yarışmasında kendi eğittiği modelle finale kaldı. Veri hazırlama, eğitim ve
          değerlendirme tecrübesini buraya taşıyoruz.
        </p>
      </div>
    </div>
  )
}
