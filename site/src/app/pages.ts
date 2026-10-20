import type { RouteId } from './router'

/*
  Sayfa tanımları. Her sayfanın bir 3D kamera istasyonu vardır: sayfa açılınca kamera oraya uçar.
  Bloklar sayfa içi bağlantılar (#/sayfa/blok) ve başlık çipleri için kullanılır.
*/

export type Station = 'hero' | 'hive' | 'system' | 'missions' | 'hangar' | 'emergency' | 'planner' | 'impact' | 'safety' | 'overview'

export type PageMeta = {
  id: RouteId
  nav: string
  title: string
  lead: string
  station: Station
  blocks: { id: string; label: string }[]
  /** gezinmede birincil mi */
  primary?: boolean
}

export const PAGES: PageMeta[] = [
  {
    id: 'home',
    nav: 'Ana sayfa',
    title: 'Her uçuştan önce, doğrulanmış temiz pist.',
    lead: '',
    station: 'hero',
    blocks: [],
  },
  {
    id: 'kovan',
    nav: 'Kovan',
    title: 'Görevine göre uzmanlaşmış bir drone kovanı',
    lead: 'Kâşifler pisti tarar, işçiler bulunan nesneyi toplar, bekçiler kuşu ve hayvanı uzaklaştırır, nöbetçiler acil durumu ilk fark eder. Hepsi aynı haritayı okur ve ona yazar; kovan güneş ve rüzgârdan kendi enerjisini üretir.',
    station: 'hive',
    primary: true,
    blocks: [
      { id: 'kastlar', label: 'Kastlar' },
      { id: 'benzetme', label: 'Arı kovanından ne aldık' },
      { id: 'petek', label: 'Petek istasyonu' },
      { id: 'boylar', label: 'Kovan boyları' },
      { id: 'zeka', label: 'Kovan zekâsı' },
    ],
  },
  {
    id: 'sistem',
    nav: 'Sistem',
    title: 'Pistteki küçük bir cisim, büyük bir maliyet',
    lead: 'Bölgesel havalimanlarında pist, yaban hayatı ve çit denetimleri hâlâ gözle ve araçla yapılıyor. AERO-GUARD bunları kendi enerjisini üreten, uçuş tarifesine göre çalışan tek bir sistemde topluyor.',
    station: 'system',
    primary: true,
    blocks: [
      { id: 'problem', label: 'Problem' },
      { id: 'mimari', label: 'Mimari' },
      { id: 'enerji', label: 'Türbin ve enerji adası' },
      { id: 'saha', label: 'Pilot saha' },
    ],
  },
  {
    id: 'gorevler',
    nav: 'Görevler',
    title: 'Yedi görev, tek kovan',
    lead: 'Uçuş öncesi taramadan buz haritasına kadar her görevi kovandaki bir kast üstlenir. Bölgesel bir havalimanının yedi ayrı sisteme yatırım yapması gerekmez.',
    station: 'missions',
    primary: true,
    blocks: [
      { id: 'liste', label: 'Görevler' },
      { id: 'toplama', label: 'Nesne toplama' },
      { id: 'buz', label: 'Buz haritası' },
      { id: 'tarama', label: 'Tarama hesabı' },
      { id: 'yz', label: 'Yapay zekâ' },
    ],
  },
  {
    id: 'hangar',
    nav: 'Hangar',
    title: 'Ne kadar taşır, ne kadar dayanır',
    lead: 'Kovanın üç platformu ve petek hücresi: faydalı yük, koruma sınıfı, rüzgâr ve sıcaklık sınırları, uçuş süresi ve pilottan önce yapılacak dayanıklılık testleri.',
    station: 'hangar',
    primary: true,
    blocks: [
      { id: 'platformlar', label: 'Platformlar' },
      { id: 'dayaniklilik', label: 'Dayanıklılık testleri' },
    ],
  },
  {
    id: 'acil-durum',
    nav: 'Acil durum',
    title: 'Acil durumu ilk fark eden kovan',
    lead: 'Uçak inip kalkarken drone’lar yerdedir; pisti nöbetçi kameralar izler. Olay saniyeler içinde kuleye bildirilir ve kovan en yakın uygun drone’u kaldırır.',
    station: 'emergency',
    primary: true,
    blocks: [
      { id: 'ilke', label: 'İlke' },
      { id: 'senaryolar', label: 'Senaryolar' },
    ],
  },
  {
    id: 'planlayici',
    nav: 'Planlayıcı',
    title: 'Tarifeye duyarlı planlama: drone ile uçak hiç karşılaşmaz',
    lead: 'Görevler sabit saatlerde değil, uçuş tarifesine ve gerçekleşen kalkış/varış saatlerine göre kendiliğinden yerleşir. Bir uçuşu sürükleyin, gecikme ekleyin ya da rüzgârı artırın.',
    station: 'planner',
    primary: true,
    blocks: [{ id: 'cizelge', label: 'Çizelge' }],
  },
  {
    id: 'etki',
    nav: 'Etki',
    title: 'Enerji, karbon ve maliyet: her rakam varsayımıyla',
    lead: 'Hesaplayıcıların varsayılan değerleri raporu aynen verir. Değerleri değiştirip sonucun nasıl değiştiğini kendiniz görün.',
    station: 'impact',
    primary: true,
    blocks: [
      { id: 'enerji', label: 'Enerji adası' },
      { id: 'karbon', label: 'Karbon' },
      { id: 'maliyet', label: 'İş modeli' },
      { id: 'rekabet', label: 'Rekabet' },
    ],
  },
  {
    id: 'emniyet',
    nav: 'Emniyet',
    title: 'Drone’un kendisi asla FOD olmamalı',
    lead: 'Kule onayı, sanal sınır, pist dışına acil iniş, sahada kalan veri ve sinyal karıştırmaya karşı katmanlı konum: emniyet tasarımın ilk satırı.',
    station: 'safety',
    primary: true,
    blocks: [
      { id: 'kurallar', label: 'Kurallar ve riskler' },
      { id: 'karistirma', label: 'Sinyal karıştırma' },
    ],
  },
  {
    id: 'gelisim',
    nav: 'Gelişim',
    title: 'Başvurudan V3’e: nasıl olgunlaştı',
    lead: 'Mentörlerin geri bildirimiyle kapsamı daralttık, sonra kovanı görevine göre uzmanlaştırdık. Her sürümde neyi neden değiştirdiğimiz ve 30 aylık yol haritası.',
    station: 'overview',
    blocks: [
      { id: 'surumler', label: 'Sürümler' },
      { id: 'ders', label: 'Mentörlerden ders' },
      { id: 'yol', label: 'Yol haritası' },
      { id: 'ekip', label: 'Ekip' },
    ],
  },
  {
    id: 'sorular',
    nav: 'Sorular',
    title: 'Aklınıza gelebilecek sorular',
    lead: 'Drone düşerse ne olur, kovanın kraliçesi kim, sinyal karıştırılırsa ne yapılır? Kısa cevaplar ve her birinin canlı gösterimi.',
    station: 'overview',
    blocks: [{ id: 'sss', label: 'Sorular' }],
  },
]

export const pageById = (id: RouteId) => PAGES.find((p) => p.id === id) ?? PAGES[0]
