/* Çizgi ikonlar: pist boyası inceliğinde, metin rengini alır. */
const base = {
  width: 44,
  height: 44,
  viewBox: '0 0 44 44',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  className: 'cicon',
}

export function BoltIcon() {
  return (
    <svg {...base}>
      <path d="M7 15l6-3.5 6 3.5v7l-6 3.5-6-3.5z" />
      <path d="M19 18.5h18M19 22h18M22 18.5v3.5M26 18.5v3.5M30 18.5v3.5M34 18.5v3.5" />
    </svg>
  )
}

export function BirdIcon() {
  return (
    <svg {...base}>
      <path d="M5 24c5-6 10-6 14-1 3-7 9-11 19-10-5 3-8 7-9 12-1 6-6 9-12 9" />
      <path d="M19 23c-2 4-2 7 0 11" />
      <circle cx="31" cy="15.5" r="0.8" fill="currentColor" />
    </svg>
  )
}

export function CrackIcon() {
  return (
    <svg {...base}>
      <rect x="5" y="7" width="34" height="30" rx="2" />
      <path d="M5 22h34M22 7v30" opacity="0.45" />
      <path d="M11 12l5 6-2 4 6 5-1 4 5 3" />
    </svg>
  )
}

export function TowerIcon() {
  return (
    <svg {...base}>
      <path d="M15 10h14l-2 7H17z" />
      <path d="M18 17l-2 20h12l-2-20M22 4v6" />
    </svg>
  )
}

export function FenceIcon() {
  return (
    <svg {...base}>
      <path d="M6 10v26M17 10v26M28 10v26M39 10v26M6 15h33M6 31h33" />
      <path d="M6 15l11 16M17 15l11 16M28 15l11 16M17 15L6 31M28 15L17 31M39 15L28 31" opacity="0.45" />
    </svg>
  )
}

export function ShieldIcon() {
  return (
    <svg {...base}>
      <path d="M22 5l14 5v10c0 9-6 15-14 19C14 35 8 29 8 20V10z" />
      <path d="M16 21l4 4 8-9" />
    </svg>
  )
}

export function RadarIcon() {
  return (
    <svg {...base}>
      <circle cx="22" cy="22" r="15" />
      <circle cx="22" cy="22" r="8" opacity="0.5" />
      <path d="M22 22l10-11" />
      <circle cx="29" cy="25" r="1.6" fill="currentColor" />
    </svg>
  )
}

export function DataIcon() {
  return (
    <svg {...base}>
      <rect x="9" y="7" width="26" height="9" rx="2" />
      <rect x="9" y="19" width="26" height="9" rx="2" />
      <path d="M14 11.5h.01M14 23.5h.01M22 28v8M15 36h14" />
    </svg>
  )
}
