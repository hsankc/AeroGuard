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

/*
  ICAO Ek 14 engel sınırlama yüzeyleri (sahnede gösterilen basitleştirilmiş hali; değerler güncel baskıdan doğrulanacak):
  pist şeridi eksenden her iki yana 140 m, pist uçlarından 60 m öteye uzanır; geçiş yüzeyi şerit kenarından 1:7 (%14,3)
  eğimle iç yatay yüzeye (45 m) kadar yükselir. Kalıcı her yapı şeridin dışında ve bu yüzeyin altında kalmalı.
*/
export const ANNEX14 = { stripHalf: 140, stripEnd: 60, slope: 7, innerHorizontal: 45 }

/** Pist ekseninden yanal uzaklığa göre geçiş yüzeyinin izin verdiği yükseklik (m). Şerit içinde 0. */
export function allowedHeight(z: number) {
  return Math.min(ANNEX14.innerHorizontal, Math.max(0, (Math.abs(z) - ANNEX14.stripHalf) / ANNEX14.slope))
}

/** Petekler: şerit kenarından 40 m dışarıda (izin verilen ≈5,7 m; petek ve direği ≈4 m) */
const PETEK_Z = 180
/** Drone'lar şeride petek hizasındaki bu kapıdan girip çıkar (şerit içi, pist omzunun dışı) */
export const GATE_Z = 100

export const LAYOUT = {
  stationA: { x: -RWY.half + 60, z: PETEK_Z },
  stationB: { x: RWY.half - 60, z: PETEK_Z },
  // türbin tepesi ≈9,2 m; 255 m'de izin verilen ≈16,4 m
  energy: { x: -260, z: 255 },
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
  // pist şeridi kutusu + her petek için 60 m genişliğinde koridor
  geofence: { x0: -RWY.half - 90, x1: RWY.half + 90, z0: -105, z1: 105, tabHalf: 30, tabZ: PETEK_Z + 25, ceiling: PARAMS.drone.geofenceCeiling },
  fence: { x0: -1520, x1: 1520, z0: -440, z1: 300 },
}

/** Sanal sınırın taban çokgeni (x, z), saat yönünün tersine. */
export function geofenceOutline(): [number, number][] {
  const G = LAYOUT.geofence
  const tabs = [LAYOUT.stationB.x, LAYOUT.stationA.x] // +x'ten −x'e doğru
  const pts: [number, number][] = [
    [G.x0, G.z0],
    [G.x1, G.z0],
    [G.x1, G.z1],
  ]
  for (const tx of tabs)
    pts.push([tx + G.tabHalf, G.z1], [tx + G.tabHalf, G.tabZ], [tx - G.tabHalf, G.tabZ], [tx - G.tabHalf, G.z1])
  pts.push([G.x0, G.z1])
  return pts
}

/** Nokta sanal sınırın içinde mi (çokgen içinde nokta testi). */
export function insideGeofence(x: number, z: number) {
  const pts = geofenceOutline()
  let inside = false
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, zi] = pts[i]
    const [xj, zj] = pts[j]
    if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) inside = !inside
  }
  return inside
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
