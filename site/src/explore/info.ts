import type { RouteId } from '../app/router'
import type { PickId } from '../sim/store'
import { FACTS } from '../data/facts'
import { allowedHeight, LAYOUT } from '../sim/world/layout'
import type { HangarModelId } from '../hangar/models'

/*
  Keşif modunda seçilen nesnenin bilgi kartı. Rakamlar sitedeki diğer yerlerle aynı kaynaktan.
  live: kart açıkken saniyede birkaç kez yenilenen anlık değerler (motor içinden okunur).
*/

export type PickInfo = {
  kicker: string
  title: string
  text: string
  rows?: [string, string][]
  live?: 'drone1' | 'drone2' | 'guard' | 'worker' | 'petekA' | 'petekB' | 'energy' | 'wind'
  links?: { label: string; to: RouteId; block?: string; model?: HangarModelId }[]
  ops?: string
}

const fmt1 = (n: number) => n.toLocaleString('tr-TR', { maximumFractionDigits: 1, minimumFractionDigits: 1 })
const petekRow = (z: number): [string, string] => ['Ek 14 payı', `izin ≈${fmt1(allowedHeight(z))} m · petek ≈4,0 m`]

export const PICKS: Record<PickId, PickInfo> = {
  petekA: {
    kicker: 'Petek A · pist 04 ucu',
    title: 'Petek A',
    text: 'Altıgen hücrelerden oluşan istasyon: Kâşif-1 ve Bekçi’nin yuvası, arkada nöbetçi direk. Her hücrede otomatik iniş, şarj (%20 → %90, 32 dk) ve iklimlendirme; kesik çizgili yuvalar kovanın büyüyebileceği yer.',
    rows: [['Konum', `pist ekseninden ${LAYOUT.stationA.z} m, şeridin dışında`], petekRow(LAYOUT.stationA.z)],
    live: 'petekA',
    links: [
      { label: 'Petek istasyonu', to: 'kovan', block: 'petek' },
      { label: 'Hangar’da aç', to: 'hangar', block: 'model', model: 'cell' },
    ],
  },
  petekB: {
    kicker: 'Petek B · pist 22 ucu',
    title: 'Petek B',
    text: 'Kâşif-2, İşçi/Bakıcı ve sarı FOD kutusu burada. İşçinin topladığı nesneler sınıf, ağırlık ve konumla kayda geçer.',
    rows: [['Konum', `pist ekseninden ${LAYOUT.stationB.z} m, şeridin dışında`], petekRow(LAYOUT.stationB.z)],
    live: 'petekB',
    links: [
      { label: 'Petek istasyonu', to: 'kovan', block: 'petek' },
      { label: 'Hangar’da aç', to: 'hangar', block: 'model', model: 'cell' },
    ],
  },
  drone1: {
    kicker: 'Kâşif-1 · M3TD sınıfı',
    title: 'Kâşif drone',
    text: 'Pistin 04 yarısını 20 m irtifadan üç geçişle tarar (3,5 mm/piksel). Kule onayı olmadan kalkmaz.',
    live: 'drone1',
    links: [{ label: 'Hangar’da aç', to: 'hangar', block: 'model', model: 'scout' }],
    ops: 'Bu görevi oynat',
  },
  drone2: {
    kicker: 'Kâşif-2 · M3TD sınıfı',
    title: 'Kâşif drone',
    text: 'Pistin 22 yarısını tarar; iki kâşif aynı yönde ve aralarında hep 1.175 m mesafeyle uçar.',
    live: 'drone2',
    links: [{ label: 'Hangar’da aç', to: 'hangar', block: 'model', model: 'scout' }],
    ops: 'Bu görevi oynat',
  },
  guard: {
    kicker: 'Bekçi · M3TD sınıfı',
    title: 'Bekçi drone',
    text: 'Kâşifler pisti tararken aynı anda çit boyunca ya da pistin çevresinde dolaşır; kuşu ve hayvanı hoparlör ve ışıkla uzaklaştırır. Geçtiği yere soluk turuncu feromon izi bırakır.',
    live: 'guard',
    links: [
      { label: 'Kastlar', to: 'kovan', block: 'kastlar' },
      { label: 'Görevler', to: 'gorevler', block: 'liste' },
    ],
  },
  worker: {
    kicker: 'İşçi · M350 sınıfı',
    title: 'İşçi drone',
    text: 'Kâşifin bildirdiği nesnenin 4 m üstünde asılı kalır, vinçle indirdiği mıknatıs ya da kıskaçla alır ve Petek B’deki FOD kutusuna getirir. Toplama sınırı 1 kg.',
    live: 'worker',
    links: [
      { label: 'Toplama adımları', to: 'gorevler', block: 'toplama' },
      { label: 'Hangar’da aç', to: 'hangar', block: 'model', model: 'worker' },
    ],
  },
  energy: {
    kicker: 'Enerji adası',
    title: 'Güneş, türbin, batarya',
    text: 'Çanakkale kovanı için 6 kWp güneş paneli (mini kovanda 4 kWp), 3 kW dikey eksenli türbin, 20 kWh LFP batarya ve kenar YZ sunucusu. Şebeke yalnızca yedek.',
    rows: [['Ek 14 payı', `türbin ≈9,2 m · izin ≈${fmt1(allowedHeight(LAYOUT.energy.z))} m`]],
    live: 'energy',
    links: [
      { label: 'Türbin ve enerji adası', to: 'sistem', block: 'enerji' },
      { label: 'Enerji hesaplayıcısı', to: 'etki', block: 'enerji' },
    ],
  },
  tower: {
    kicker: 'Kontrol kulesi',
    title: 'Kule',
    text: 'Her görev kule onayıyla başlar; temiz pist raporu buraya gelir. Kovanın kararını kule ve insan verir.',
    ops: 'Kule onayını siz verin',
  },
  terminal: {
    kicker: 'Çanakkale Havalimanı',
    title: 'Terminal',
    text: 'Tek pistli, düşük trafikli bölgesel havalimanı: uçuşlar arasında pist saatlerce boş kalır.',
    rows: [
      ['Yolcu (2025)', FACTS.passengers2025.value],
      ['Terminal kapasitesi', FACTS.terminalCapacity.value],
    ],
    links: [{ label: 'Pilot saha', to: 'sistem', block: 'saha' }],
  },
  arff: {
    kicker: 'Kurtarma ve yangınla mücadele',
    title: 'İtfaiye (ARFF)',
    text: 'ICAO pistin her noktasına 3 dakikada ulaşmayı hedefler. Kovan itfaiyenin yerini almaz; ilk saniyelerde termal görüntüyle göz olur.',
    links: [{ label: '12 acil durum senaryosu', to: 'acil-durum', block: 'senaryolar' }],
  },
  aircraft: {
    kicker: 'Apron',
    title: 'Park eden uçak',
    text: 'Kış sabahı bakıcı rolü kanat, stabilizör ve gövde üstündeki kırağıyı haritalar; sıvı sıkmaz, uçağın üzerinden asla geçmez.',
    links: [{ label: 'Buz haritası', to: 'gorevler', block: 'buz' }],
  },
  runway: {
    kicker: 'Pist 04/22',
    title: '2.350 × 45 m beton pist',
    text: 'Her ticari hareketten önce iki kâşif pisti 60 m genişlikte ≈12 dakikada tarar; hareketin 5 dk öncesi ve sonrası hiçbir drone uçmaz.',
    links: [
      { label: 'Tarama hesabı', to: 'gorevler', block: 'tarama' },
      { label: 'Planlayıcı', to: 'planlayici' },
    ],
    ops: 'Piste nesne bırakın',
  },
  windsock: {
    kicker: 'Meteoroloji',
    title: 'Rüzgâr tulumu',
    text: 'Rüzgâr 8 m/s’yi aşarsa görev başlamaz; denetim bugünkü gibi araçla yapılır.',
    live: 'wind',
    links: [{ label: 'Planlayıcıda rüzgârı artır', to: 'planlayici' }],
  },
  emergency: {
    kicker: 'Emniyet',
    title: 'Acil iniş noktası',
    text: 'Pist dışında 6 nokta. İletişim veya güç kaybında drone en yakın noktaya iner; indiği yer kuleye otomatik olarak FOD diye bildirilir.',
    links: [{ label: 'Emniyet kuralları', to: 'emniyet', block: 'kurallar' }],
    ops: 'Arıza laboratuvarında dene',
  },
}
