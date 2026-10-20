import { useEffect, useRef } from 'react'
import { getEngine } from '../sim/engine'
import { fmtClock, fmtDuration, useSim } from '../sim/store'
import { describePosition } from '../sim/world/layout'
import logo from '../assets/logo.webp'

/** Temiz pist raporu: kuleye bilgi olarak iletilen, yazdırılabilir belge. */
export function ReportModal() {
  const open = useSim((s) => s.reportOpen)
  const report = useSim((s) => s.report)
  const set = useSim((s) => s.set)
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    closeRef.current?.focus()
    const onKey = (ev: KeyboardEvent) => ev.key === 'Escape' && set({ reportOpen: false })
    window.addEventListener('keydown', onKey)
    document.body.classList.add('printing-report')
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.classList.remove('printing-report')
    }
  }, [open, set])

  if (!open || !report) return null
  const live = report.detections.filter((d) => d.status !== 'rejected')
  const rejected = report.detections.filter((d) => d.status === 'rejected')
  const pending = report.detections.filter((d) => d.status === 'pending')
  const clean = live.length === 0
  const duration = report.dockedAt - report.startedAt

  return (
    <div className="report-backdrop">
      <article className="report" role="dialog" aria-modal="true" aria-labelledby="report-h">
        <header className="report__head">
          <img src={logo} alt="" width={86} height={62} />
          <div>
            <p className="report__org">AERO-GUARD, LTBH Çanakkale Havalimanı</p>
            <h2 id="report-h">{clean ? 'Temiz pist raporu' : 'Pist tarama raporu: nesne tespit edildi'}</h2>
            <p className="report__meta num">
              Görev {report.id}, pist 04/22, {fmtClock(report.createdAt)} yerel saat
            </p>
          </div>
          <span className={`report__stamp ${clean ? 'is-clean' : 'is-found'}`}>{clean ? 'Nesne yok' : `${live.length} nesne`}</span>
        </header>

        <dl className="report__grid num">
          <div>
            <dt>Tarama</dt>
            <dd>
              {fmtClock(report.startedAt)}–{fmtClock(report.dockedAt)} ({fmtDuration(duration)})
            </dd>
          </div>
          <div>
            <dt>Kapsama</dt>
            <dd>%{Math.round(report.coverage * 100)} (60 m genişlik, 2 × 3 geçiş)</dd>
          </div>
          <div>
            <dt>Çözünürlük</dt>
            <dd>20 m irtifa, ≈3,5 mm/piksel</dd>
          </div>
          <div>
            <dt>Rapor süresi</dt>
            <dd>
              {fmtDuration(report.generatedIn)} (hedef ≤ 2 dk)
            </dd>
          </div>
          <div>
            <dt>Dönüş doğrulaması</dt>
            <dd>İki drone istasyonda, kapaklar kapalı</dd>
          </div>
          <div>
            <dt>Görüntü işleme</dt>
            <dd>Kenar sunucu, veri havalimanı dışına çıkmadı</dd>
          </div>
        </dl>

        <h3 className="report__sub">Tespitler</h3>
        {report.detections.length === 0 ? (
          <p className="report__none">Taranan alanda yabancı nesne tespit edilmedi.</p>
        ) : (
          <table className="report__table num">
            <thead>
              <tr>
                <th scope="col">Görüntü</th>
                <th scope="col">Nesne</th>
                <th scope="col">Konum</th>
                <th scope="col">Durum</th>
              </tr>
            </thead>
            <tbody>
              {report.detections.map((d) => (
                <tr key={d.id}>
                  <td>{d.thumb && <img src={d.thumb} alt={d.label} width={120} height={90} />}</td>
                  <td>
                    <b>{d.label}</b>
                    <br />
                    güven %{Math.round(d.conf * 100)}, D{d.drone}, {fmtClock(d.t, true)}
                  </td>
                  <td>{describePosition(d.x, d.z)}</td>
                  <td>
                    {d.status === 'confirmed' ? 'Saha ekibi onayladı, kaldırılacak' : d.status === 'rejected' ? 'Yanlış alarm (eğitim etiketi)' : 'Saha ekibi incelemesi bekleniyor'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {rejected.length > 0 && (
          <p className="report__note">
            {rejected.length} tespit operatör tarafından yanlış alarm olarak işaretlendi; görüntüler bir sonraki eğitim turuna etiket olarak eklendi.
          </p>
        )}
        {pending.length > 0 && <p className="report__note">{pending.length} tespit saha ekibi kararını bekliyor.</p>}

        <p className="report__decision">
          Bu rapor kuleye bilgi olarak iletilmiştir. AERO-GUARD pisti kendiliğinden kullanıma açmaz; karar kule ve saha ekibine aittir.
        </p>
        <p className="report__sim">Simülasyon çıktısıdır; gerçek operasyon verisi değildir.</p>

        <footer className="report__actions">
          <button type="button" className="btn btn--primary" onClick={() => window.print()}>
            Yazdır
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => {
              set({ reportOpen: false })
              getEngine()?.newMission(false)
            }}
          >
            Yeni görev
          </button>
          <button ref={closeRef} type="button" className="btn" onClick={() => set({ reportOpen: false })}>
            Kapat
          </button>
        </footer>
      </article>
    </div>
  )
}
