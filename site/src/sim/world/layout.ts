import { PARAMS } from '../../data/facts'

/*
  Sahne koordinatları (metre):
  x  pist ekseni boyunca; 04 eşiği x = -1175, 22 eşiği x = +1175
  z  yanal; z < 0 pistin sol tarafı (04'ten 22'ye bakarken), terminal bu tarafta
  y  yukarı
  Yerleşim stilizedir; pist ölçüleri ve tarama geometrisi rapordaki değerlerle birebir aynıdır.
*/

export const RWY = {
  half: PARAMS.runway.length / 2, // 1175
  halfWidth: PARAMS.runway.width / 2, // 22,5
  shoulder: PARAMS.runway.shoulder, // 7,5
  heading: PARAMS.runway.heading, // pist 04'ün yaklaşık manyetik yönü
}

export const SCAN_HALF_WIDTH = PARAMS.scan.width / 2 // 30 m

export const LAYOUT = {
  stationA: { x: -RWY.half - 40, z: 95 },
  stationB: { x: RWY.half + 40, z: 95 },
  energy: { x: -260, z: 175 },
  tower: { x: 140, z: -300 },
  terminal: { x: 330, z: -315 },
  apron: { x: 330, z: -215, w: 320, d: 120 },
  taxiway: { x: 330 },
  holdLine: -78,
  windsocks: [
    { x: -RWY.half + 320, z: 72 },
    { x: RWY.half - 320, z: 72 },
  ],
  // Pist dışı acil iniş noktaları (rapordaki Şekil 2)
  emergency: [-590, 0, 590].flatMap((x) => [
    { x, z: -68 },
    { x, z: 68 },
  ]),
  geofence: { x0: -RWY.half - 90, x1: RWY.half + 90, z0: -105, z1: 105, ceiling: PARAMS.drone.geofenceCeiling },
  fence: { x0: -1520, x1: 1520, z0: -440, z1: 300 },
}

/** Görüntü ekseni: yatay görüş açısı uçuş yönüne dik (z), dikey görüş açısı uçuş yönünde (x). */
export function footprint(alt: number) {
  const hfov = (PARAMS.scan.hfovDeg * Math.PI) / 180
  const across = 2 * alt * Math.tan(hfov / 2) // 20 m → 28 m
  const vfov = 2 * Math.atan(Math.tan(hfov / 2) * 0.75) // 4:3 sensör
  const along = 2 * alt * Math.tan(vfov / 2) // 20 m → 21 m
  return { across, along, vfovDeg: (vfov * 180) / Math.PI }
}

/** Şerit aralığı: iz × (1 − bindirme) = 22,4 m */
export function laneSpacing(alt = PARAMS.scan.altitude) {
  return footprint(alt).across * (1 - PARAMS.scan.overlap)
}

/** Pist koordinatını insanın okuyacağı konuma çevirir. */
export function describePosition(x: number, z: number) {
  const fromThreshold = Math.round(x + RWY.half)
  const lateral = Math.round(Math.abs(z))
  const side = z < 0 ? 'solu' : 'sağı'
  return lateral < 1
    ? `04 eşiğinden ${fromThreshold.toLocaleString('tr-TR')} m, merkez hattı üzerinde`
    : `04 eşiğinden ${fromThreshold.toLocaleString('tr-TR')} m, merkez hattın ${lateral} m ${side}`
}
