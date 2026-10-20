/*
  Kovanın petek görünümü: her altıgen bir kast. Kimliği etiket taşır, renk ikincil.
*/
export type CasteId = 'scout' | 'guard' | 'worker' | 'nurse' | 'sentinel'

export const CASTES: { id: CasteId; name: string; count: string; role: string; color: string }[] = [
  { id: 'scout', name: 'Kâşif', count: '× 2', role: 'Pisti tarar, nesneyi bulur', color: 'var(--caste-scout)' },
  { id: 'guard', name: 'Bekçi', count: '× 1', role: 'Kuşu uzaklaştırır, çiti dolaşır', color: 'var(--caste-guard)' },
  { id: 'worker', name: 'İşçi', count: '× 1', role: 'Bulunan nesneyi toplar', color: 'var(--caste-worker)' },
  { id: 'nurse', name: 'Bakıcı', count: 'işçinin rolü', role: 'Uçağın buz haritasını çıkarır', color: 'var(--caste-nurse)' },
  { id: 'sentinel', name: 'Nöbetçi', count: '× 2 direk', role: 'Pisti izler, acil durumu ilk fark eder', color: 'var(--caste-sentinel)' },
]

const R = 46
const hex = (cx: number, cy: number, r = R) =>
  Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i + Math.PI / 6
    return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`
  }).join(' ')

// sivri uçlu altıgen petek yerleşimi
const W = Math.sqrt(3) * R
const POS: Record<CasteId, [number, number]> = {
  scout: [W * 1, R * 1.1],
  guard: [W * 2, R * 1.1],
  worker: [W * 0.5, R * 2.6],
  nurse: [W * 1.5, R * 2.6],
  sentinel: [W * 2.5, R * 2.6],
}

export function HiveMini({ active, onPick }: { active?: CasteId | null; onPick?: (id: CasteId) => void }) {
  return (
    <svg className="hive-mini" viewBox={`0 0 ${W * 3 + 4} ${R * 3.8}`} role={onPick ? 'group' : 'img'} aria-label="Kovanın kastları">
      {CASTES.map((c) => {
        const [x, y] = POS[c.id]
        const on = active === c.id
        const props = onPick
          ? {
              role: 'button',
              tabIndex: 0,
              'aria-pressed': on,
              'aria-label': `${c.name}: ${c.role}`,
              onClick: () => onPick(c.id),
              onKeyDown: (e: React.KeyboardEvent) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onPick(c.id)
                }
              },
            }
          : {}
        return (
          <g key={c.id} className={`hive-mini__cell ${on ? 'is-on' : ''} ${onPick ? 'is-btn' : ''}`} style={{ ['--c' as string]: c.color }} {...props}>
            <polygon points={hex(x, y, R - 3)} />
            <circle cx={x} cy={y - 14} r={6} />
            <text x={x} y={y + 8} textAnchor="middle" className="hive-mini__name">
              {c.name}
            </text>
            <text x={x} y={y + 26} textAnchor="middle" className="hive-mini__count">
              {c.count}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
