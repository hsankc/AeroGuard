// Kovan boyu kontrolü: npx tsx scripts/hive-check.ts
import { computeHive } from '../src/sections/content/HiveBuilder'

const base = { scouts: 2, guard: false, worker: false, nurse: false, sentinel: false, safeNav: false, pv: 4 }
const rows = {
  mini: base,
  ckz: { ...base, guard: true, worker: true, sentinel: true, safeNav: true, pv: 6 },
  ckz4kWp: { ...base, guard: true, worker: true, sentinel: true, safeNav: true, pv: 4 },
  winter: { ...base, guard: true, worker: true, nurse: true, sentinel: true, safeNav: true, pv: 6 },
}
for (const [k, c] of Object.entries(rows)) {
  const r = computeHive(c)
  console.log(k.padEnd(8), `kurulum ${r.capex.toFixed(1)}  yıllık ${r.yearly.toFixed(1)}  tüketim ${r.daily.toFixed(2)} kWh/gün  üretim ${r.production}  oran ${r.ratio.toFixed(2)}×  özerklik ${r.autonomy.toFixed(2)} gün`)
}
