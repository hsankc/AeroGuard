/*
  Güneş konumu (NOAA yaklaşık formülleri), Çanakkale Havalimanı için.
  Sahnedeki ışık, gün doğumu/batımı ve planlayıcıdaki şafak/gün batımı devriyeleri bunu kullanır.
*/
export const SITE = { lat: 40.1377, lon: 26.4268, tz: 3 } // UTC+3

const RAD = Math.PI / 180

/** 16 Ekim 2026 → 289. gün */
export const DEFAULT_DAY_OF_YEAR = 289

function solarTerms(dayOfYear: number, hourLocal: number) {
  const g = ((2 * Math.PI) / 365) * (dayOfYear - 1 + (hourLocal - SITE.tz - 12) / 24)
  const eqTime =
    229.18 *
    (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g))
  const decl =
    0.006918 -
    0.399912 * Math.cos(g) +
    0.070257 * Math.sin(g) -
    0.006758 * Math.cos(2 * g) +
    0.000907 * Math.sin(2 * g) -
    0.002697 * Math.cos(3 * g) +
    0.00148 * Math.sin(3 * g)
  return { eqTime, decl }
}

/** Yükseklik ve azimut (radyan; azimut kuzeyden saat yönünde). */
export function sunPosition(dayOfYear: number, secOfDay: number) {
  const hour = secOfDay / 3600
  const { eqTime, decl } = solarTerms(dayOfYear, hour)
  const tst = hour * 60 + eqTime + 4 * SITE.lon - 60 * SITE.tz
  const ha = (tst / 4 - 180) * RAD
  const lat = SITE.lat * RAD
  const cosZen = Math.sin(lat) * Math.sin(decl) + Math.cos(lat) * Math.cos(decl) * Math.cos(ha)
  const elev = Math.PI / 2 - Math.acos(Math.min(1, Math.max(-1, cosZen)))
  const az = Math.atan2(Math.sin(ha), Math.cos(ha) * Math.sin(lat) - Math.tan(decl) * Math.cos(lat)) + Math.PI
  return { elev, az }
}

/** Yerel saatle gün doğumu ve batımı (günün saniyesi). */
export function sunTimes(dayOfYear: number) {
  const { eqTime, decl } = solarTerms(dayOfYear, 12)
  const lat = SITE.lat * RAD
  const cosH = Math.cos(90.833 * RAD) / (Math.cos(lat) * Math.cos(decl)) - Math.tan(lat) * Math.tan(decl)
  const h = Math.acos(Math.min(1, Math.max(-1, cosH))) / RAD
  const noon = 720 - 4 * SITE.lon - eqTime + SITE.tz * 60
  return { sunrise: (noon - 4 * h) * 60, sunset: (noon + 4 * h) * 60, noon: noon * 60 }
}
