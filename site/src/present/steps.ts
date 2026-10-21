import type { RouteId } from '../app/router'
import type { PickId } from '../sim/store'
import type { SceneId } from '../sim/scenario'
import type { Text } from '../i18n'

/*
  Sunum modu: jüriye ≈5 dakikalık rehberli tur. Her adım bir sayfaya, 3D keşfe ya da sahneye gider;
  alttaki şeritte konuşma notu görünür. Oklar ve boşluk ilerletir, Esc çıkar.
*/

export type Step = {
  title: Text
  note: Text
  route?: RouteId
  block?: string
  explore?: { focus?: PickId; annex?: boolean }
  scene?: SceneId
}

export const STEPS: Step[] = [
  {
    title: { tr: 'Her uçuştan önce, doğrulanmış temiz pist', en: 'A verified clean runway before every flight' },
    note: {
      tr: 'AERO-GUARD, bölgesel havalimanları için kendi enerjisini üreten bir drone kovanı. Pilot saha Çanakkale Havalimanı.',
      en: 'AERO-GUARD is a self-powered drone hive for regional airports. Pilot site: Çanakkale Airport.',
    },
    route: 'home',
  },
  {
    title: { tr: 'Problem: pistteki küçük bir cisim', en: 'The problem: a small object on the runway' },
    note: {
      tr: 'FOD ve kuş çarpmalarının yıllık maliyeti ≈13,9 milyar $. Bölgesel havalimanlarında denetim hâlâ gözle ve araçla; kayıt yok.',
      en: 'FOD and bird strikes cost ≈$13.9 bn a year. Regional airports still inspect by eye and by car, with no record.',
    },
    route: 'sistem',
    block: 'problem',
  },
  {
    title: { tr: 'Çözüm: görevine göre uzmanlaşmış kovan', en: 'The answer: a hive specialised by task' },
    note: {
      tr: 'Kâşifler tarar, işçi toplar, bekçi kuşu uzaklaştırır, nöbetçi kameralar acil durumu ilk görür. Kraliçe yok: kararı kule ve insan verir.',
      en: 'Scouts scan, the worker picks up, the guard deters birds, sentinel cameras see emergencies first. No queen: the tower and people decide.',
    },
    route: 'kovan',
    block: 'kastlar',
  },
  {
    title: { tr: 'Petekler ve Ek 14 yerleşimi', en: 'Hive stations and Annex 14 layout' },
    note: {
      tr: 'Petekler pist şeridinin (140 m) dışında ve 1:7 geçiş yüzeyinin altında; türbin 255 m’de. Değerler Ek 14’ten doğrulanacak.',
      en: 'Stations sit outside the 140 m runway strip and below the 1:7 transitional surface; the turbine at 255 m. Values to be verified against Annex 14.',
    },
    explore: { focus: 'petekA', annex: true },
  },
  {
    title: { tr: 'Tarifeye duyarlı planlama', en: 'Schedule-aware planning' },
    note: {
      tr: 'Tarama hareketten 18 dk önce başlar, ≈12 dk sürer; hareketin ±5 dk çevresinde hiçbir drone uçmaz. Bekçi görevleri kâşiflerle aynı anda.',
      en: 'Scans start 18 min before each movement and take ≈12 min; no drone flies within ±5 min of a movement. Guard tasks run in parallel.',
    },
    route: 'planlayici',
  },
  {
    title: { tr: 'Bul ve topla', en: 'Find and pick up' },
    note: {
      tr: 'Kâşif nesneyi bulur, konumu işçiye gider. İşçi 4 m üstünde asılı kalır, vinçle ≤ 1 kg nesneyi alır. Büyük lastik parçaları saha ekibinde.',
      en: 'A scout finds the object and shares its position. The worker hovers 4 m above and winches up items ≤ 1 kg. Large tyre debris stays with the ground crew.',
    },
    scene: 'tire',
  },
  {
    title: { tr: 'Acil durumu ilk gören', en: 'First to see an emergency' },
    note: {
      tr: 'Nöbetçi kamera ≤ 10 sn’de kuleyi uyarır, en yakın drone termal görüntü verir. İtfaiyenin yerini almıyoruz; ICAO hedefi 3 dk.',
      en: 'A sentinel camera alerts the tower in ≤ 10 s and the nearest drone streams thermal video. We do not replace firefighters; ICAO targets 3 min.',
    },
    scene: 'fire',
  },
  {
    title: { tr: 'Kış sabahı: buz haritası', en: 'Winter morning: ice map' },
    note: {
      tr: 'Sıvı sıkmıyoruz: bakıcı kırağı bölgelerini haritalar, ekip sıkar. Dondurucu yağış veya sis varsa uçmaz. Olgunluk TRL 3–4.',
      en: 'We do not spray: the carer maps frost, the crew sprays. No flight in freezing fog or precipitation. Maturity TRL 3–4.',
    },
    scene: 'ice',
  },
  {
    title: { tr: 'Sinyal karıştırmaya dayanıklı', en: 'Resilient to jamming' },
    note: {
      tr: 'Ön kontrolde RF/GNSS bütünlüğü kırmızıysa kalkış yok. Havada konum GNSS, RTK, UWB, görsel ve IMU’dan; tutarsız kaynak dışlanır.',
      en: 'If RF/GNSS integrity is red at pre-flight, nothing takes off. In flight, position comes from GNSS, RTK, UWB, vision and IMU; outliers are excluded.',
    },
    route: 'emniyet',
    block: 'karistirma',
  },
  {
    title: { tr: 'Kovanını kur: maliyet ve enerji', en: 'Build your hive: cost and energy' },
    note: {
      tr: 'Mini kovan ≈124 bin $, Çanakkale kovanı ≈218 bin $ (±%30), beş yıla yayılmış ≈63 bin $/yıl. 6 kWp güneşle üretim yükün ≈1,5 katı.',
      en: 'Mini hive ≈$124k, Çanakkale hive ≈$218k (±30%), ≈$63k/yr over five years. With 6 kWp solar, production is ≈1.5× the load.',
    },
    route: 'kovan',
    block: 'kur',
  },
  {
    title: { tr: 'Gelişim: v1 → v2 → V3', en: 'Evolution: v1 → v2 → V3' },
    note: {
      tr: 'Mentörlerin geri bildirimiyle kapsamı daralttık, sonra arı kovanı benzetmesini mimariye çevirdik. 30 ayda 3–5 bölgesel havalimanı.',
      en: 'Mentor feedback narrowed the scope; then we turned the beehive analogy into the architecture. 3–5 regional airports in 30 months.',
    },
    route: 'gelisim',
    block: 'surumler',
  },
  {
    title: { tr: 'Teşekkürler', en: 'Thank you' },
    note: {
      tr: 'Siteyi telefonunuzda açın; operasyon merkezinde kule onayını siz verin. Sorularınızı bekliyoruz.',
      en: 'Open the site on your phone and approve a mission in the operations centre yourself. Questions welcome.',
    },
    route: 'gelisim',
    block: 'ekip',
  },
]
