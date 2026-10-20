import type { DroneMode, LogKind, Phase } from '../sim/store'

export const PHASE_LABEL: Record<Phase, string> = {
  idle: 'Planlandı, kule onayı istenmedi',
  awaiting: 'Kule onayı bekleniyor',
  preflight: 'Ön kontroller yapılıyor',
  blocked: 'Görev başlamadı',
  flight: 'Uçuşta: pist taranıyor',
  return: 'Görev kesildi, eve dönüş',
  verify: 'Dönüş doğrulanıyor',
  report: 'Rapor hazırlanıyor',
  done: 'Rapor kuleye iletildi',
  aborted: 'Görev kesildi, rapor yok',
}

export const MODE_LABEL: Record<DroneMode, string> = {
  docked: 'Peteğinde',
  lid: 'Kapak hareketi',
  takeoff: 'Kalkış',
  transit: 'Transit',
  scan: 'Tarama',
  rth: 'Eve dönüş',
  landing: 'İniş',
  emergency: 'Acil iniş',
  down: 'Pist dışında, yerde',
  patrol: 'Devriye',
  pickup: 'Toplama: vinçle alıyor',
  respond: 'Olay yerinde',
}

export const LOG_LABEL: Record<LogKind, string> = {
  info: 'Bilgi',
  ok: 'Tamam',
  warn: 'Dikkat',
  alert: 'Uyarı',
  tower: 'Kule',
}

/** Görev adımları (sıralı süreç). */
export const STEPS = ['Planlandı', 'Kule onayı', 'Ön kontrol', 'Uçuş ve tarama', 'Dönüş doğrulama', 'Rapor'] as const

export function stepIndex(p: Phase) {
  switch (p) {
    case 'idle':
      return 0
    case 'awaiting':
      return 1
    case 'preflight':
    case 'blocked':
      return 2
    case 'flight':
    case 'return':
      return 3
    case 'verify':
    case 'aborted':
      return 4
    case 'report':
    case 'done':
      return 5
  }
}
