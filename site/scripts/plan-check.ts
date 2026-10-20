// Planlayıcı senaryo kontrolü: npx tsx scripts/plan-check.ts
import { planDay, CKZ_SCHEDULE, sawSchedule, defaultWind, WIND_PRESETS, fmt, actual, BUFFER } from '../src/planner/plan'
import { DEFAULT_DAY_OF_YEAR } from '../src/sim/solar'

function show(title: string, input: Parameters<typeof planDay>[0], verbose = true) {
  const r = planDay(input)
  console.log(`\n=== ${title} ===  gün doğumu ${fmt(r.sunrise)}  batımı ${fmt(r.sunset)}`)
  if (verbose)
    for (const t of r.tasks) console.log(`  ${fmt(t.start)}–${fmt(t.end)}  ${t.type.padEnd(8)} ${t.status.padEnd(8)} ${t.label}${t.reason ? '  ← ' + t.reason : ''}`)
  console.log('  istatistik', JSON.stringify({ ...r.stats, completion: Math.round(r.stats.completion * 100), energyKwh: r.stats.energyKwh.toFixed(2) }))
  // Değişmez kurallar: uçulan hiçbir görev pist kullanım bloklarıyla çakışmaz; FOD hareketten ≥5 dk önce biter
  for (const t of r.tasks.filter((x) => x.status === 'ok')) {
    for (const b of r.blocks) if (t.start < b.end && b.start < t.end) throw new Error(`ÇAKIŞMA ${t.id} ile ${b.movementId}`)
    if (t.type === 'fod') {
      const m = input.movements.find((x) => x.id === t.movementId)!
      if (t.end > actual(m) - BUFFER) throw new Error(`TAMPON İHLALİ ${t.id}`)
    }
  }
  const min = Math.min(...[1, 2].flatMap((d) => r.battery[d as 1 | 2].map((p) => p[1])))
  console.log('  en düşük batarya %', min.toFixed(1))
  return r
}

const base = { movements: CKZ_SCHEDULE, wind: defaultWind(), dayOfYear: DEFAULT_DAY_OF_YEAR, healthDay: true }
show('Çanakkale, temsili gün (pist sağlığı günü)', base)
show('08:55 kalkışı 25 dk gecikmeli', { ...base, movements: CKZ_SCHEDULE.map((m) => (m.id === 'm2' ? { ...m, delay: 25 * 60 } : m)) })
show('Öğleden sonra poyraz', { ...base, wind: WIND_PRESETS[1].wind() })
show('Sabah fırtınası', { ...base, wind: WIND_PRESETS[2].wind() })
show('Sıkışık: 08:10 geliş, 08:20 kalkış', { ...base, movements: [CKZ_SCHEDULE[0], { ...CKZ_SCHEDULE[1], planned: 8 * 3600 + 20 * 60 }] })
show('Sabiha Gökçen modu', { ...base, movements: sawSchedule() }, false)
