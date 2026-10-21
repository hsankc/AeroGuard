/*
  Tek doğruluk kaynağı: Sitede görünen her rakam buradan gelir.
  Değerler "Genişletilmiş Proje Raporu · Final Aşaması" (Ekim 2026) ile birebir aynıdır.
  `src` alanı SOURCES dizisindeki kaynak numaralarıdır (rapordaki [1]–[16]).
  Hesap makinelerinin kullandığı sayısal girdiler PARAMS içindedir.
*/

export type Fact = {
  value: string
  label: string
  note: string
  src?: number[]
}

export const SOURCES: Record<number, string> = {
  1: 'ACRP Synthesis 26 (2011). Current Airport Inspection Practices Regarding FOD. National Academies Press.',
  2: 'Munyer vd. (2021). FOD-A: A Dataset for Foreign Object Debris in Airports. arXiv:2110.03072.',
  3: 'ICAO (2022). Annex 14, Volume I: Aerodrome Design and Operations.',
  4: 'ICAO Doc 9981 PANS-Aerodromes: Global Reporting Format (4 Kasım 2021).',
  5: 'Commission Implementing Regulation (EU) 2019/947.',
  6: 'JARUS. Specific Operations Risk Assessment (SORA).',
  7: 'SHGM. İnsansız Hava Aracı Sistemleri Talimatı (SHT-İHA).',
  8: 'DHMİ (2026). Havalimanları Yolcu Trafiği, Ocak–Temmuz 2026 (kesin olmayan veriler).',
  9: 'Çanakkale Havalimanı pist bilgileri ve yıllık yolcu istatistikleri (DHMİ verilerine dayanan derleme).',
  10: 'Küre Ansiklopedi. Çanakkale Havalimanı (terminal kapasitesi ve statü).',
  11: 'haber.aero (2022). DHMİ yerli ve millî sistemlerle TEKNOFEST’te (FODRAD, KUŞRAD).',
  12: 'Milliyet (2018). A-FOD ile yabancı cisim tespiti.',
  13: 'Cranfield University (2020). Drones used to conduct automated inspections at Cranfield Airport.',
  14: 'DJI Enterprise. DJI Dock 2 ve Matrice 3D/3TD teknik özellikleri.',
  15: 'Ekonomist (2023). Türkiye’de rüzgâr enerjisinde lider iller (Aralık 2023).',
  16: 'Airports Council International. Airport Carbon Accreditation programı.',
  17: 'EASA (2024). Safety Information Bulletin 2022-02R3: Global Navigation Satellite System outages and alterations.',
  18: 'SEI projesi (Spectral Evidence of Ice): Drones 4(3):45 (2020) ve ISPRS Archives XLIII-B2-2020: drone ile buz tespiti.',
  19: 'DJI Matrice 350 RTK teknik özellikleri (satıcı sayfaları; DJI resmi verisiyle doğrulanacak).',
}

/** Hesap makineleri ve simülasyon için sayısal girdiler (rapordaki varsayılanlar). */
export const PARAMS = {
  runway: { length: 2350, width: 45, shoulder: 7.5, heading: 40 },
  scan: {
    width: 60, // 45 m pist + 2 × 7,5 m omuz
    altitude: 20,
    hfovDeg: 70,
    sensorPx: 8000, // 48 MP geniş açı kameranın yatay piksel sayısı
    overlap: 0.2,
    speed: 6,
    halfLength: 1175,
    targetSize: 0.03,
    leadMinutes: 15,
    returnBufferMinutes: 5,
  },
  health: { altitude: 10 },
  dock: { chargeMinutes: 32, chargeFrom: 20, chargeTo: 90 },
  drone: { batteryWh: 115, windOpsLimit: 12, windTakeoffLimit: 8, geofenceCeiling: 30 },
  energy: {
    pvKwp: 4,
    pvYield: 1350,
    turbineKw: 3,
    turbineCf: 0.12,
    batteryKwh: 20,
    loads: [
      { id: 'climate', label: 'İstasyon iklimlendirme ve bekleme (2 adet)', watts: 200 },
      { id: 'edge', label: 'Kenar sunucu ve ağ', watts: 150 },
      { id: 'charge', label: 'Drone şarjı (2 drone, ≈20 sorti/gün)', kwhPerDay: 1.0 },
      { id: 'comms', label: 'Haberleşme ve aksesuarlar', watts: 25 },
    ],
    safetyMargin: 0.3,
    evKwhPer100km: 18,
  },
  co2: {
    dieselKgPerKm: 0.24,
    gridKgPerKwh: 0.45,
    inspectionKm: 8200,
    fenceKm: 5500,
    evKm: 21000,
    gridKwh: 3650,
  },
  cost: {
    items: [
      { label: '2 × otomatik drone istasyonu (DJI Dock 2 sınıfı)', usd: 21000 },
      { label: '2 × termal kameralı drone', usd: 16000 },
      { label: 'Yedek bataryalar, hoparlör ve ışık aksesuarları', usd: 4000 },
      { label: 'Güneş paneli 4 kWp (kurulu)', usd: 5000 },
      { label: 'Dikey eksenli türbin 3 kW (direk ve kurulum dahil)', usd: 12000 },
      { label: '20 kWh LFP batarya ve hibrit invertör', usd: 10000 },
      { label: 'Kenar YZ sunucusu, ağ ve depolama', usd: 6000 },
      { label: 'Yazılım geliştirme ve entegrasyon (ilk kurulum)', usd: 35000 },
      { label: 'İzin, mühendislik, kurulum ve eğitim', usd: 15000 },
    ],
    opexPerYear: 14000,
    nextAirport: 90000,
    contractYears: 5,
  },
} as const

export const FACTS = {
  /* Problem */
  fodCostTotal: {
    value: '13,9 milyar $',
    label: 'FOD ve kuş çarpmalarının yıllık toplam maliyeti',
    note: 'Dünya geneli, doğrudan + dolaylı maliyet. McCreary (2010) tahminleri, ACRP Synthesis 26 derlemesi.',
    src: [1],
  },
  fodCostDirect: {
    value: '1,26 milyar $',
    label: 'FOD’un yıllık doğrudan maliyeti',
    note: 'Kuş çarpmaları dahil, dünya geneli doğrudan maliyet tahmini.',
    src: [1],
  },
  fodCostPer10k: {
    value: '250 bin $',
    label: 'Her 10.000 harekette FOD kaynaklı bakım maliyeti',
    note: 'ABD’deki havayolları için ortalama.',
    src: [1],
  },

  /* Pilot saha */
  runway: {
    value: '04/22 · 2.350 × 45 m',
    label: 'Çanakkale Havalimanı pisti',
    note: 'Tek pist, beton kaplama.',
    src: [9],
  },
  passengers2025: {
    value: '192.434',
    label: 'Çanakkale Havalimanı yolcu sayısı (2025)',
    note: 'DHMİ verilerine dayanan derleme.',
    src: [9],
  },
  passengersCkz2026: {
    value: '71 bin',
    label: 'Çanakkale yolcu sayısı, Ocak–Temmuz 2026',
    note: 'Kesin olmayan DHMİ verisi.',
    src: [8],
  },
  passengersSaw2026: {
    value: '28 milyon',
    label: 'Sabiha Gökçen yolcu sayısı, Ocak–Temmuz 2026',
    note: 'Kesin olmayan DHMİ verisi.',
    src: [8],
  },
  scaleRatio: {
    value: '≈400×',
    label: 'Sabiha Gökçen / Çanakkale trafik oranı',
    note: '28 milyon ÷ 71 bin ≈ 394 (Ocak–Temmuz 2026).',
    src: [8],
  },
  dailyMovements: {
    value: '≈4',
    label: 'Günlük ticari hareket (Çanakkale)',
    note: 'Yıllık yolcu ÷ 365 ÷ hareket başına ≈150 yolcu.',
    src: [9],
  },
  terminalCapacity: {
    value: '180.000 yolcu/yıl',
    label: 'Terminal kapasitesi',
    note: 'Sivil–askeri ortak kullanımlı havalimanı.',
    src: [10],
  },
  windRank: {
    value: '976 MW',
    label: 'Çanakkale rüzgâr kurulu gücü',
    note: '2023 sonu itibarıyla il bazında Türkiye’de üçüncü sıra.',
    src: [15],
  },

  /* Tarama */
  scanTime: {
    value: '≈12 dk',
    label: 'İki drone ile tam pist taraması',
    note: 'Kalkış ve iniş dahil, iki drone paralel; her biri pistin yarısını (1.175 m) üç geçişle tarar.',
  },
  altitude: {
    value: '20 m',
    label: 'Tarama irtifası',
    note: 'Kule onaylı pencere içinde, sanal sınırla.',
  },
  footprint: {
    value: '≈28 m',
    label: 'Kamera iz genişliği',
    note: '48 MP geniş açı kamera, ≈70° yatay görüş açısı: 2 × 20 m × tan 35° ≈ 28 m.',
  },
  gsd: {
    value: '≈3,5 mm',
    label: 'Piksel başına yer çözünürlüğü',
    note: '28 m iz ÷ 8.000 piksel ≈ 3,5 mm/piksel.',
  },
  objectPx: {
    value: '8–9 piksel',
    label: '3 cm’lik bir nesnenin görüntüdeki boyu',
    note: '30 mm ÷ 3,5 mm/piksel ≈ 8,6 piksel.',
  },
  targetSize: {
    value: '≥3 cm',
    label: 'Hedef nesne boyutu',
    note: 'Pilot KPI’ı bu boyuttaki nesneler için tanımlıdır.',
  },
  passes: {
    value: '3 geçiş',
    label: 'Drone başına geçiş sayısı',
    note: '60 m tarama genişliği (45 m pist + 2 × 7,5 m omuz), %20 yan bindirme ile.',
  },
  pathPerDrone: {
    value: '≈3,8 km',
    label: 'Drone başına tarama yolu',
    note: '3 × 1.175 m + dönüşler.',
  },
  scanSpeed: {
    value: '6 m/s',
    label: 'Tarama hızı',
    note: 'Hareket bulanıklığını sınırlamak için.',
  },
  sortieEnergy: {
    value: '≈0,04 kWh',
    label: 'Sorti başına enerji',
    note: '115 Wh bataryanın ≈%25–30’u, şarj kaybı dahil.',
  },
  leadTime: {
    value: '18 dk',
    label: 'Taramanın ticari hareketten önce başladığı süre',
    note: 'Tarama ≈12 dk sürer ve hareketten ≈6 dk önce biter; pencere hareketten en az 5 dk önce kapanır, drone’lar peteklerindedir.',
  },
  sortiesPerDay: {
    value: '9–10',
    label: 'Drone başına günlük sorti',
    note: 'Temsili bir tarifeyle görev planından.',
  },

  /* Donanım */
  dockCharge: {
    value: '32 dk',
    label: 'İstasyonda %20’den %90’a şarj',
    note: 'Referans donanım: DJI Dock 2 sınıfı, IP55, –25 °C ile 45 °C arası çalışma.',
    src: [14],
  },
  droneSpec: {
    value: '48 MP + 640 × 512 termal',
    label: 'Drone kamera donanımı',
    note: 'Matrice 3TD sınıfı: RTK konumlama, ≈50 dk uçuş (laboratuvar koşulu). Mimari donanımdan bağımsızdır.',
    src: [14],
  },
  windLimit: {
    value: '8 m/s',
    label: 'İniş-kalkış rüzgâr sınırı',
    note: 'Sınır aşılırsa görev başlamaz, denetim bugünkü gibi araçla yapılır. Operasyon sırasında sınır 12 m/s.',
    src: [14],
  },
  geofence: {
    value: '30 m',
    label: 'Sanal sınır tavanı',
    note: 'Her drone görev alanında (pist şeridi, çit hattı, apron) ve petek koridorlarında, 30 m’nin altında kalır; aşım otomatik eve dönüşü tetikler.',
  },

  /* Enerji */
  pv: {
    value: '4 kWp',
    label: 'Güneş paneli, mini kovan',
    note: '≈1.350 kWh/kWp·yıl (temkinli) → ≈5.400 kWh/yıl. Çanakkale kovanında 6 kWp → ≈8.100 kWh/yıl.',
  },
  turbine: {
    value: '3 kW',
    label: 'Dikey eksenli rüzgâr türbini',
    note: 'Kapasite faktörü bilinçli olarak düşük, %12 → ≈3.150 kWh/yıl.',
  },
  battery: {
    value: '20 kWh',
    label: 'LFP batarya',
    note: 'Şebeke yalnızca yedek olarak bağlıdır.',
  },
  energyRatio: {
    value: '1,8×',
    label: 'Yenilenebilir üretim / tasarım yükü',
    note: '8.550 kWh üretim ÷ 4.745 kWh tasarım yükü (3.650 kWh tüketim + %30 güvenlik payı).',
  },
  autonomy: {
    value: '1,5 gün',
    label: 'Bataryayla özerklik',
    note: '20 kWh ÷ 13 kWh/gün tasarım yükü.',
  },
  evKm: {
    value: '≈21.000 km',
    label: 'Fazla enerjiyle elektrikli saha aracı / yıl',
    note: '≈3.800 kWh fazla ÷ 18 kWh/100 km.',
  },
  consumption: {
    value: '10 kWh/gün',
    label: 'Toplam tüketim',
    note: 'En büyük kalem istasyonların iklimlendirmesi (≈100 W/istasyon); kenar sunucu ≈150 W.',
  },

  /* Sürdürülebilirlik */
  co2: {
    value: '≈10 t',
    label: 'Havalimanı başına yıllık doğrudan CO₂ azaltımı',
    note: 'Denetim aracı ≈2,0 + çit devriyesi ≈1,3 + elektrikli saha aracı ≈5,0 + şebeke yerine yenilenebilir ≈1,6 t.',
  },
  co2Fleet: {
    value: '≈200 t',
    label: '20 bölgesel havalimanında yıllık azaltım',
    note: 'Tek havalimanı için küçük bir rakam; asıl kazanç dolaylı etkilerde.',
  },

  /* Maliyet */
  capex: {
    value: '≈124 bin $',
    label: 'Havalimanı başına ilk kurulum',
    note: '2026 piyasa koşullarına göre tahmin, ±%20 belirsizlik.',
  },
  opex: {
    value: '≈14 bin $/yıl',
    label: 'Yıllık işletme gideri',
    note: 'Bakım, yedek parça, yazılım güncellemeleri, sigorta ve haberleşme.',
  },
  nextAirport: {
    value: '≈90 bin $',
    label: 'Sonraki havalimanlarında kurulum',
    note: 'Yazılım geliştirme maliyeti tekrarlanmaz.',
  },
  daas: {
    value: '≈39 bin $/yıl',
    label: 'Beş yıla yayılmış yıllık maliyet',
    note: '(124 bin $ + 5 × 14 bin $) ÷ 5. Abonelik fiyatı pilot sonrası netleşir.',
  },

  /* YZ ve KPI */
  fodA: {
    value: '31 sınıf · 30.000+ örnek',
    label: 'FOD-A açık veri seti',
    note: 'Her örnek ışık (aydınlık, loş, karanlık) ve hava (kuru, ıslak) koşuluyla etiketli.',
    src: [2],
  },
  kpiSensitivity: { value: '≥ %90', label: 'FOD tespit duyarlılığı (≥3 cm)', note: 'Pilotta ölçülerek doğrulanacak hedef.' },
  kpiFalseAlarm: { value: '≤ 1 / tarama', label: 'Yanlış alarm', note: 'Pilotta ölçülerek doğrulanacak hedef.' },
  kpiScanTime: { value: '≤ 15 dk', label: 'Tarama süresi (iki drone)', note: 'Pilotta ölçülerek doğrulanacak hedef.' },
  kpiReport: { value: '≤ 2 dk', label: 'Tarama bitiminden kuleye rapor', note: 'Pilotta ölçülerek doğrulanacak hedef.' },
  kpiCompletion: { value: '≥ %85', label: 'Planlanan taramaların gerçekleşmesi', note: 'Rüzgâr ve yağış nedeniyle iptal edilenler dahil.' },
  kpiEnergy: { value: '≥ %80', label: 'Yıllık enerji öz-yeterliliği', note: 'Pilotta ölçülerek doğrulanacak hedef.' },

  /* V3: kovan (ön tahmin, ±%30) */
  hiveMini: {
    value: '≈124 bin $',
    label: 'Mini kovan kurulumu (v2)',
    note: '2 kâşif, 2 petek hücresi, enerji adası, kenar sunucu, yazılım ve izinler. Rapordaki Tablo 8.',
  },
  hiveCkz: {
    value: '≈218 bin $',
    label: 'Çanakkale kovanı kurulumu (V3, önerilen)',
    note: 'Mini kovan + bekçi hücresi ≈20 + işçi hücresi ≈35 + nöbetçi kameralar ≈14 + güvenli konum ≈12 + kovan yazılımı ≈10 + ek 2 kWp güneş ≈2,5 bin $. V3 ön tahmini, ±%30.',
  },
  hiveWinter: {
    value: '≈223 bin $',
    label: 'Kış kovanı kurulumu (V3)',
    note: 'Çanakkale kovanı + bakıcı rolü (yazılım ve kalibrasyon ≈5 bin $). Soğuk iklimli bölgesel havalimanları için.',
  },
  hiveYear: {
    value: '≈63 bin $/yıl',
    label: 'Çanakkale kovanı, beş yıla yayılmış yıllık maliyet',
    note: '(≈218 bin $ + 5 × ≈19 bin $ işletme) ÷ 5. V3 ön tahmini.',
  },
  hiveEnergy: {
    value: '≈1,5×',
    label: 'Çanakkale kovanı: yenilenebilir üretim / tasarım yükü',
    note: '6 kWp güneş (≈8.100 kWh) + 3 kW türbin (≈3.150 kWh) ≈11.250 kWh/yıl ÷ (≈16 kWh/gün × 365 × 1,3). Tüketim: 4 hücre × 100 W, sunucu 150 W, iletişim 25 W, 2 nöbetçi direk × 20 W (varsayım), sortiler ≈1,3 kWh/gün. 4 kWp ile oran ≈1,1× kalırdı; bu yüzden güneş paneli büyütüldü.',
  },
  hiveAutonomy: {
    value: '≈1 gün',
    label: 'Çanakkale kovanı: bataryayla özerklik',
    note: '20 kWh ÷ ≈21 kWh/gün tasarım yükü. Mini kovanda ≈1,5 gün. Sonrasında şebeke devreye girer.',
  },
  workerPayload: {
    value: '≈2,7 kg',
    label: 'İşçi drone azami faydalı yük',
    note: 'Matrice 350 RTK sınıfı, üretici verisi. Vinç ve toplama başlığı ≈1,2 kg (tasarım tahmini).',
    src: [19],
  },
  pickupLimit: {
    value: '≤ 1 kg',
    label: 'İşçinin toplayabileceği nesne',
    note: 'Yük bütçesinden %33 payla tasarım sınırı; ≤ 30 cm. Islak, yapışık, sıvı ve büyük keskin parçalar saha ekibinde.',
  },
  sentinelKpi: {
    value: '≤ 10 sn',
    label: 'Olaydan kule uyarısına (hedef)',
    note: 'Nöbetçi kameralar ve YZ; pilotta ölçülecek hedef.',
  },
  gnssRisk: {
    value: 'Akdeniz',
    label: 'GNSS karıştırma ve aldatmanın arttığı bölgeler arasında',
    note: 'EASA’nın 2024 bülteni; 2022 sürümü Kıbrıs ve Türkiye çevresini ayrıca anıyordu.',
    src: [17],
  },
  iceTrl: {
    value: 'TRL 3–4',
    label: 'Buz haritası rolünün olgunluğu',
    note: 'Drone ile uçakta buz tespiti araştırma aşamasında; hiperspektral kamera daha güvenilir bulundu.',
    src: [18],
  },

  /* Yol haritası */
  roadmap: {
    value: '30 ay',
    label: 'Prototipten 3–5 bölgesel havalimanına',
    note: '4 faz, 7 iş paketi; izin süreci ilk ayda başlar.',
  },
} satisfies Record<string, Fact>

export type FactId = keyof typeof FACTS
