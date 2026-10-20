import { actual, DAY_END, DAY_START, fmt, TASK_SPEC, type Movement, type PlanResult, type Task } from '../planner/plan'
import type { LogKind } from './store'
import { AircraftFleet } from './world/fleet'
import type { FodField } from './world/fod'
import { RWY, SCAN_HALF_WIDTH } from './world/layout'
import { InspectionVehicle } from './world/vehicle'
import type { Mission } from './mission/mission'
import type { FodClass } from './store'

/*
  "Bu günü oynat": planlayıcının çıkardığı planı 05:00'ten 24:00'e kadar oynatır.
  Görevler plan saatinde başlar (kule onayı alınmış sayılır), uçamayan görevlerde pist araçla denetlenir,
  her ticari hareketten sonra pistte bir cisim kalabilir; bir sonraki tarama onu bulur, saha ekibi kaldırır.
*/

export type DayHost = {
  mission: Mission
  fod: FodField
  log: (kind: LogKind, text: string) => void
  launch: (task: Task) => void
  review: (id: number, status: 'confirmed' | 'rejected') => void
  setTask: (label: string | null) => void
  finish: (summary: string) => void
}

type RunTask = Task & { handled: boolean }

const FOD_TYPES: FodClass[] = ['bolt', 'stone', 'plastic', 'tire']

export class DayRunner {
  fleet = new AircraftFleet()
  vehicle = new InspectionVehicle()
  readonly tasks: RunTask[]
  private moves: { t: number; kind: 'arr' | 'dep'; label: string; logged: boolean; dropAt: number; dropped: boolean }[]
  private reviews: { at: number; id: number; status: 'confirmed' | 'rejected' }[] = []
  private current: RunTask | null = null
  private currentGuard: RunTask | null = null
  private vehicleFor: RunTask | null = null
  finished = false
  stats = { flown: 0, vehicle: 0, detections: 0, confirmed: 0 }

  constructor(
    private host: DayHost,
    plan: PlanResult,
    movements: Movement[],
  ) {
    this.tasks = plan.tasks.map((t) => ({ ...t, handled: false }))
    this.moves = movements
      .map((m) => ({
        t: actual(m),
        kind: m.kind,
        label: m.label,
        logged: false,
        dropAt: actual(m) + 90 + Math.random() * 300,
        dropped: Math.random() > 0.45, // ≈%55 olasılıkla hareketten sonra pistte bir cisim kalır
      }))
      .sort((a, b) => a.t - b.t)
    this.fleet.build(this.moves)
  }

  /** Bir tespit yapıldığında: saha ekibi 2 dk sonra gerçek nesneyi kaldırır, iz kaynaklı alarmı reddeder. */
  onDetect(id: number, isArtifact: boolean, clock: number) {
    this.stats.detections++
    this.reviews.push({ at: clock + 120, id, status: isArtifact ? 'rejected' : 'confirmed' })
  }

  private showTask() {
    const parts = [this.current, this.currentGuard].filter(Boolean).map((t) => `${TASK_SPEC[t!.type].name}: ${t!.label}${t!.caste === 'guard' ? ' (bekçi)' : ''}`)
    this.host.setTask(parts.length ? parts.join(' · ') : null)
  }

  /** Ana görev bittiğinde (kâşifler peteğinde) */
  onDocked() {
    if (this.current) {
      this.host.log('ok', `${TASK_SPEC[this.current.type].name} tamamlandı, kâşifler peteğinde şarjda`)
      this.current = null
      this.showTask()
    }
  }

  /** Bekçi sortisi bittiğinde */
  onSortieDone(id: number) {
    if (id === 3 && this.currentGuard) {
      this.host.log('ok', `${TASK_SPEC[this.currentGuard.type].name} tamamlandı, bekçi peteğinde şarjda`)
      this.currentGuard = null
      this.showTask()
    }
  }

  update(clock: number, realT: number) {
    if (this.finished) return
    const m = this.host.mission

    this.fleet.update(clock)

    // ticari hareketler ve pistte kalan cisimler
    for (const mv of this.moves) {
      if (!mv.logged && clock >= mv.t && mv.t >= DAY_START) {
        mv.logged = true
        this.host.log('tower', `${fmt(mv.t)} ${mv.label}: ${mv.kind === 'arr' ? 'uçak indi' : 'uçak kalktı'}. Pist ${mv.kind === 'arr' ? 'boşaltıldı' : 'serbest'}.`)
      }
      if (!mv.dropped && clock >= mv.dropAt) {
        mv.dropped = true
        const cls = FOD_TYPES[Math.floor(Math.random() * FOD_TYPES.length)]
        this.host.fod.add(cls, (Math.random() * 2 - 1) * (RWY.half - 150), (Math.random() * 2 - 1) * (SCAN_HALF_WIDTH - 8))
      }
    }

    // saha ekibi kararları
    const due = this.reviews.filter((r) => r.at <= clock)
    if (due.length) {
      this.reviews = this.reviews.filter((r) => r.at > clock)
      for (const r of due) {
        this.host.review(r.id, r.status)
        if (r.status === 'confirmed') {
          this.stats.confirmed++
          if (r.id > 0) this.host.fod.remove(r.id)
        }
      }
    }

    // görevler
    for (const t of this.tasks) {
      if (t.handled || clock < t.start) continue
      if (t.status !== 'ok') {
        t.handled = true
        const why = t.status === 'wind' ? 'rüzgâr sınırın üzerinde' : t.status === 'nowindow' ? 'hareketler arasında yeterli boşluk yok' : 'şarj yetersiz'
        if (t.type === 'fod' || t.type === 'opening') {
          this.stats.vehicle++
          this.host.log('warn', `${fmt(t.start)} ${TASK_SPEC[t.type].name} (${t.label}) yapılamadı: ${why}. Pist araçla denetleniyor.`)
          if (!this.vehicle.busy) {
            this.vehicle.begin(clock)
            this.vehicleFor = t
          }
        } else this.host.log('warn', `${fmt(t.start)} ${TASK_SPEC[t.type].name} ertelendi: ${why}.`)
        continue
      }
      // aynı kastın önceki görevi sürüyorsa drone'lar dönünce başlar; farklı kastlar aynı anda uçabilir
      const crew = t.caste === 'guard' ? [m.guard] : m.drones
      const idle = crew.every((d) => !d.active && d.mode === 'docked')
      if (!idle) continue
      t.handled = true
      if (t.caste === 'guard') this.currentGuard = t
      else this.current = t
      this.stats.flown++
      this.showTask()
      this.host.log('tower', `${fmt(clock)} Kule onayı alındı: ${TASK_SPEC[t.type].name} (${t.label}${t.caste === 'guard' ? ', bekçi' : ''})`)
      this.host.launch(t)
    }

    if (this.vehicle.update(clock, realT) && this.vehicleFor) {
      this.host.log('ok', `Araçla denetim bitti (${this.vehicleFor.label}). Sonuç kayıt altına alınmadı: bugünkü uygulama.`)
      this.vehicleFor = null
    }

    if (clock >= DAY_END - 60) {
      this.finished = true
      const s = this.stats
      this.host.finish(
        `Gün tamamlandı: ${s.flown} drone görevi uçuldu, ${s.vehicle} denetim araçla yapıldı, ${s.detections} tespit (${s.confirmed} nesne kaldırıldı).`,
      )
    }
  }

  /** Sıradaki olaylar (arayüz için) */
  upcoming(clock: number, n = 5) {
    const ev = [
      ...this.tasks.filter((t) => t.start > clock).map((t) => ({ t: t.start, text: `${TASK_SPEC[t.type].name}${t.status !== 'ok' ? ' (araçla)' : ''}`, kind: t.type as string })),
      ...this.moves.filter((m) => m.t > clock && m.t >= DAY_START).map((m) => ({ t: m.t, text: m.label, kind: m.kind as string })),
    ]
    return ev.sort((a, b) => a.t - b.t).slice(0, n)
  }

  dispose() {
    this.fleet.clear()
    this.vehicle.reset()
  }
}
