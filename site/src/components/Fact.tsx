import { useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { FACTS, SOURCES, type FactId } from '../data/facts'
import { useUi } from './uiStore'

/** Bir rakamı gösterir; üzerine gelince veya odaklanınca varsayımını ve kaynağını açar. */
export function Fact({ id, children }: { id: FactId; children?: React.ReactNode }) {
  const fact = FACTS[id]
  const ref = useRef<HTMLButtonElement>(null)
  const [pos, setPos] = useState<{ x: number; y: number; below: boolean } | null>(null)
  const tipId = useId()

  const open = () => {
    const r = ref.current?.getBoundingClientRect()
    if (!r) return
    const below = r.top < 160
    const x = Math.min(Math.max(12, r.left), window.innerWidth - 352)
    setPos({ x, y: below ? r.bottom + 8 : r.top - 8, below })
  }
  const close = () => setPos(null)

  const src = 'src' in fact ? fact.src : undefined

  return (
    <>
      <button
        ref={ref}
        type="button"
        className="fact num"
        aria-describedby={pos ? tipId : undefined}
        onMouseEnter={open}
        onMouseLeave={close}
        onFocus={open}
        onBlur={close}
        onClick={() => {
          close()
          useUi.getState().openAssumptions(id)
        }}
      >
        {children ?? fact.value}
      </button>
      {pos &&
        createPortal(
          <span
            id={tipId}
            role="tooltip"
            className="fact-tip"
            style={{
              left: pos.x,
              top: pos.y,
              transform: pos.below ? undefined : 'translateY(-100%)',
            }}
          >
            <span className="fact-tip__label">{fact.label}</span>
            {fact.note}
            {src && <span className="fact-tip__src">Kaynak: {src.map((n) => `[${n}] ${SOURCES[n]}`).join(' ')}</span>}
            <span className="fact-tip__src">Tüm varsayımlar için tıklayın</span>
          </span>,
          document.body,
        )}
    </>
  )
}
