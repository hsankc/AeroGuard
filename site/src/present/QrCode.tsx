import { QR_PATH, QR_SIZE, QR_URL } from './qr'

export { QR_URL }
export const QR_HOST = QR_URL.replace(/^https?:\/\//, '')

/** Yayın adresinin QR kodu: beyaz zemin, 4 modül sessiz alan, keskin kenarlı modüller */
export function QrCode({ size = 128, label }: { size?: number; label?: string }) {
  const s = QR_SIZE + 8
  return (
    <svg className="qr" width={size} height={size} viewBox={`-4 -4 ${s} ${s}`} role="img" aria-label={label ?? QR_URL} shapeRendering="crispEdges">
      <rect x={-4} y={-4} width={s} height={s} fill="#fff" />
      <path d={QR_PATH} fill="#0d1117" />
    </svg>
  )
}
