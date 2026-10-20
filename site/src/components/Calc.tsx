import { useId, type ReactNode } from 'react'
import './calc.css'

/* Hesap makinesi yapı taşları: kaydırıcı satırı, sonuç değeri, formül açıklaması. */

export const tr = (v: number, digits = 0) =>
  v.toLocaleString('tr-TR', { minimumFractionDigits: digits, maximumFractionDigits: digits })

/** Birimli sayı, Türkçe yazımla: %20, 70°, 20 m */
export function withUnit(v: number, unit: string, digits = 0) {
  const n = tr(v, digits)
  if (unit === '%') return `%${n}`
  if (unit === '°') return `${n}°`
  return unit ? `${n} ${unit}` : n
}

type SliderProps = {
  label: string
  value: number
  min: number
  max: number
  step: number
  unit?: string
  digits?: number
  reportValue?: number
  onChange: (v: number) => void
  hint?: string
}

/** Kaydırıcı: rapordaki değerden farklıysa yanında "raporda X" yazar. */
export function Slider({ label, value, min, max, step, unit = '', digits = 0, reportValue, onChange, hint }: SliderProps) {
  const id = useId()
  const changed = reportValue !== undefined && Math.abs(value - reportValue) > step / 2
  return (
    <div className="calc-slider">
      <label htmlFor={id} className="calc-slider__top">
        <span className="calc-slider__label">{label}</span>
        <span className="calc-slider__value num">{withUnit(value, unit, digits)}</span>
      </label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-describedby={hint ? `${id}-h` : undefined}
      />
      <span className="calc-slider__foot">
        {hint && <span id={`${id}-h`}>{hint}</span>}
        {changed && (
          <span className="calc-slider__report num">raporda {withUnit(reportValue!, unit, digits)}</span>
        )}
      </span>
    </div>
  )
}

/** Sonuç değeri: değer önde, etiket altta; rapordaki değerle karşılaştırma isteğe bağlı. */
export function Out({ label, value, note, strong }: { label: string; value: ReactNode; note?: ReactNode; strong?: boolean }) {
  return (
    <div className={`calc-out ${strong ? 'calc-out--strong' : ''}`}>
      <dt className="calc-out__label">{label}</dt>
      <dd className="calc-out__value">{value}</dd>
      {note && <dd className="calc-out__note">{note}</dd>}
    </div>
  )
}

export function Formula({ children }: { children: ReactNode }) {
  return (
    <details className="calc-formula">
      <summary>Formülleri göster</summary>
      <div className="calc-formula__body">{children}</div>
    </details>
  )
}

export function CalcShell({ inputs, outputs, figure, onReset, changed }: { inputs: ReactNode; outputs: ReactNode; figure?: ReactNode; onReset: () => void; changed: boolean }) {
  return (
    <div className="calc">
      <div className="calc__inputs">
        <div className="calc__inputs-head">
          <h3>Varsayımlar</h3>
          <button type="button" className="calc__reset" onClick={onReset} disabled={!changed}>
            Rapordaki değerlere dön
          </button>
        </div>
        {inputs}
      </div>
      <div className="calc__results">
        <dl className="calc__outs">{outputs}</dl>
        {figure}
      </div>
    </div>
  )
}
