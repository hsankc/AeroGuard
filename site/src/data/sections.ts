import type { Text } from '../i18n'

/*
  Bölüm sırası sunum akışını izler. Her bölümün bir taksi yolu harfi vardır;
  gezinme çubuğu bunları havalimanı tabelası gibi gösterir.
  ICAO, karışıklık yaratmaması için taksi yollarında I, O ve X harflerini kullanmaz; biz de kullanmıyoruz.
*/
export type SectionMeta = {
  id: string
  letter: string
  short: Text
  title: Text
  lead: Text
  coming?: Text
  slide?: number
}

export const SECTIONS: SectionMeta[] = [
  {
    id: 'problem',
    letter: 'A',
    short: { tr: 'Problem', en: 'Problem' },
    title: { tr: 'Pistteki küçük bir cisim, büyük bir maliyet', en: 'A small object on the runway, a large cost' },
    lead: {
      tr: 'Bir cıvata, taş ya da plastik parçası motora girdiğinde iş gecikme, iptal ve pahalı bir motor onarımına dönüşür. Bölgesel havalimanlarında pist, yaban hayatı ve çit denetimlerinin hepsi hâlâ gözle ve araçla yapılıyor: kayıt yok, karşılaştırma yok.',
    },
    coming: { tr: 'Gelecek: animasyonlu maliyet sayaçları ve dönen 3D FOD nesneleri (cıvata, taş, plastik, lastik parçası).' },
    slide: 2,
  },
  {
    id: 'evolution',
    letter: 'B',
    short: { tr: 'Başvurudan finale', en: 'What changed' },
    title: { tr: 'Mentörlerden aldığımız ders: doğru havalimanını seçmek', en: 'What our mentors taught us: pick the right airport' },
    lead: {
      tr: 'Başvuruda büyük havalimanlarını hedefliyorduk. Sabiha Gökçen’de dakikada yaklaşık bir hareket var; drone’a pistte zaman kalmıyor ve bu iş için kurulu sistemler zaten mevcut. Soruyu tersine çevirdik: bu sistemlere erişemeyen kim?',
    },
    coming: { tr: 'Gelecek: Sabiha Gökçen ↔ Çanakkale anahtarı, trafik yoğunluğu animasyonu ve kapsamdan çıkardığımız maddeler.' },
    slide: 3,
  },
  {
    id: 'site',
    letter: 'C',
    short: { tr: 'Çanakkale', en: 'Pilot site' },
    title: { tr: 'Pilot saha: Çanakkale Havalimanı', en: 'Pilot site: Çanakkale Airport' },
    lead: {
      tr: 'Tek pist, günde yaklaşık dört ticari hareket ve saatlerce boş kalan bir pist. Çanakkale aynı zamanda rüzgâr kurulu gücünde Türkiye’nin önde gelen illerinden ve üniversitemize yakın; saha ziyareti ve veri toplama kolay.',
    },
    coming: { tr: 'Gelecek: stilize saha haritası ve havalimanı bilgi kartı.' },
  },
  {
    id: 'architecture',
    letter: 'D',
    short: { tr: 'Mimari', en: 'Architecture' },
    title: { tr: 'Kovan istasyonu, enerji adası, akıllı yazılım', en: 'Hive stations, an energy island, smart software' },
    lead: {
      tr: 'Pistin iki ucunda birer otomatik drone istasyonu, güneş ve rüzgârdan beslenen bir enerji adası ve uçuş tarifesini okuyan bir yazılım katmanı. Kule onaylamadan hiçbir drone kalkmaz.',
    },
    coming: { tr: 'Gelecek: güç ve veri akışı canlandırılmış etkileşimli mimari şeması.' },
    slide: 4,
  },
  {
    id: 'ops',
    letter: 'E',
    short: { tr: 'Operasyon merkezi', en: 'Operations' },
    title: { tr: 'Görevi kendiniz yönetin', en: 'Run a mission yourself' },
    lead: {
      tr: 'Çanakkale pistinin dijital ikizinde bir uçuş öncesi FOD taramasını baştan sona izleyin: kule onayını siz verin, piste kendi nesnenizi bırakın, drone’ların onu bulmasını izleyin ve bir arıza vererek emniyet kurallarının nasıl devreye girdiğini görün.',
    },
    slide: 5,
  },
  {
    id: 'planner',
    letter: 'F',
    short: { tr: 'Planlayıcı', en: 'Planner' },
    title: { tr: 'Tarifeye duyarlı planlama: drone ile uçak hiç karşılaşmaz', en: 'Schedule-aware planning: drones and aircraft never meet' },
    lead: {
      tr: 'Görevler sabit saatlerde değil, uçuş tarifesine ve gerçekleşen kalkış/varış saatlerine göre otomatik planlanır. Pist sağlığı taraması ve çit devriyesi gibi uzun görevler gün içindeki boşluklara yerleşir.',
    },
    coming: { tr: 'Gelecek: uçuşları sürükleyebildiğiniz 24 saatlik planlayıcı, gecikme ve rüzgâr senaryoları, “Sabiha Gökçen modu”.' },
    slide: 7,
  },
  {
    id: 'scan',
    letter: 'G',
    short: { tr: 'Tarama hesabı', en: 'Scan math' },
    title: { tr: 'Her uçuştan önce yaklaşık 12 dakikada temiz pist', en: 'A clean runway in about 12 minutes before every flight' },
    lead: {
      tr: 'İki drone aynı anda kalkar; her biri pistin yarısını 20 m irtifadan üç geçişle tarar. Kazancımız hız değil tutarlılık: her tarama aynı rotada, aynı çözünürlükte ve kayıt altında.',
    },
    coming: { tr: 'Gelecek: irtifa, görüş açısı, bindirme ve hız kaydırıcılarıyla tarama hesaplayıcısı.' },
    slide: 5,
  },
  {
    id: 'missions',
    letter: 'H',
    short: { tr: 'Görevler', en: 'Missions' },
    title: { tr: 'Aynı iki drone, beş görev', en: 'The same two drones, five missions' },
    lead: {
      tr: 'Bölgesel bir havalimanı dört ayrı sisteme yatırım yapamaz. Aynı donanım FOD taraması, pist sağlığı ve GRF desteği, yaban hayatı caydırma, çit devriyesi ve acil durum desteğini üstlenir.',
    },
    coming: { tr: 'Gelecek: her görev için dijital ikizde oynatılan kısa sahneler.' },
    slide: 6,
  },
  {
    id: 'ai',
    letter: 'J',
    short: { tr: 'Yapay zekâ', en: 'AI' },
    title: { tr: 'Yapay zekâ önerir, insan karar verir', en: 'AI suggests, people decide' },
    lead: {
      tr: 'Açık FOD-A veri setiyle başlıyor, Çanakkale pistinde kontrollü bırakılan test nesneleriyle ince ayar yapıyoruz. Operatörün onayladığı ya da reddettiği her tespit yeni bir etikete dönüşür. Sistem pisti asla kendisi açmaz.',
    },
    coming: { tr: 'Gelecek: dört adımlı eğitim akışı, operatör onay mini oyunu ve pilot KPI tablosu.' },
    slide: 8,
  },
  {
    id: 'energy',
    letter: 'K',
    short: { tr: 'Enerji adası', en: 'Energy' },
    title: { tr: 'Sistem tükettiğinden fazlasını üretiyor', en: 'The system produces more than it uses' },
    lead: {
      tr: 'Günde yaklaşık 10 kWh tüketiyoruz; en büyük kalem istasyonların iklimlendirmesi. Güneş ve rüzgâr yılda yaklaşık 8.550 kWh üretiyor. Türbinin kapasite faktörünü bilerek düşük, %12 aldık.',
    },
    coming: { tr: 'Gelecek: tüm varsayımları değiştirilebilen enerji hesaplayıcısı ve enerji akışı animasyonu.' },
    slide: 9,
  },
  {
    id: 'impact',
    letter: 'L',
    short: { tr: 'Sürdürülebilirlik', en: 'Impact' },
    title: { tr: 'Gerçekçi rakam: yılda yaklaşık 10 ton CO₂, asıl kazanç dolaylı', en: 'An honest number: about 10 t CO₂ a year; the real gain is indirect' },
    lead: {
      tr: 'Başvuruda yazdığımız 15–25 bin tonun hesabı yoktu. Şimdi yalnızca gerçekten etkilediğimiz kalemleri hesaplıyoruz. Tek havalimanı için küçük bir rakam; bunu açıkça söylüyoruz.',
    },
    coming: { tr: 'Gelecek: CO₂ dökümü, havalimanı sayısı kaydırıcısı ve dolaylı etkiler.' },
    slide: 10,
  },
  {
    id: 'market',
    letter: 'M',
    short: { tr: 'Rekabet', en: 'Landscape' },
    title: { tr: 'Parçalar var, bütün yok', en: 'The pieces exist; the whole does not' },
    lead: {
      tr: 'Sabit FOD radarları ve kuş radarları büyük havalimanlarında sürekli izleme sağlar ama pahalı ve tek görevlidir. AERO-GUARD bunları bölgesel havalimanı için tek pakette birleştirir. Dürüst sınırımız: sürekli izleme yapmıyoruz.',
    },
    coming: { tr: 'Gelecek: etkileşimli karşılaştırma matrisi.' },
    slide: 11,
  },
  {
    id: 'safety',
    letter: 'N',
    short: { tr: 'Emniyet', en: 'Safety' },
    title: { tr: 'Emniyet ilkesi: drone’un kendisi asla FOD olmamalı', en: 'Safety first: the drone must never become debris' },
    lead: {
      tr: 'Kule onayı olmadan kalkış yok. Sanal sınır drone’u pist şeridi içinde ve 30 m’nin altında tutar, ADS-B alıcısı yaklaşan hava aracını algılar. Arızada drone pist dışındaki acil iniş noktasına iner ve indiği yer otomatik olarak kuleye bildirilir.',
    },
    coming: { tr: 'Gelecek: kurallar, arıza senaryoları ve regülasyon çerçevesi.' },
    slide: 12,
  },
  {
    id: 'business',
    letter: 'P',
    short: { tr: 'İş modeli', en: 'Business' },
    title: { tr: 'Havalimanına kurulum yükü yok: hizmet olarak drone', en: 'No upfront cost for the airport: drone as a service' },
    lead: {
      tr: 'Havalimanı kurulum parası ödemez, beş yıllık abonelik öder. Donanım, kurulum, bakım ve yazılım güncellemeleri bizde.',
    },
    coming: { tr: 'Gelecek: maliyet kalemleri ve abonelik hesaplayıcısı.' },
    slide: 13,
  },
  {
    id: 'roadmap',
    letter: 'Q',
    short: { tr: 'Yol haritası', en: 'Roadmap' },
    title: { tr: '30 ayda Çanakkale’den 3–5 bölgesel havalimanına', en: 'From Çanakkale to 3–5 regional airports in 30 months' },
    lead: {
      tr: 'İlk üç ayda FOD-A ile eğitilmiş YOLO demosu ve görev planlayıcı simülasyonu. İzin sürecine ilk ayda başlıyoruz; ilk uçuşlar uçuşsuz saatlerde apron ve taksi yolunda.',
    },
    coming: { tr: 'Gelecek: dört faz ve yedi iş paketinden oluşan etkileşimli Gantt şeması.' },
    slide: 14,
  },
  {
    id: 'faq',
    letter: 'R',
    short: { tr: 'Jüri soruları', en: 'Questions' },
    title: { tr: 'Aklınıza gelebilecek sorular', en: 'Questions you might have' },
    lead: {
      tr: 'Drone düşerse ne olur, askeri alanda görüntü nasıl korunur, rüzgârlı günlerde ne yapılır? Kısa cevaplar ve her birinin canlı gösterimi.',
    },
    coming: { tr: 'Gelecek: her cevabı ilgili etkileşime bağlayan soru listesi.' },
  },
  {
    id: 'team',
    letter: 'S',
    short: { tr: 'Ekip', en: 'Team' },
    title: { tr: 'Her uçuştan önce, doğrulanmış temiz pist', en: 'A verified clean runway before every flight' },
    lead: {
      tr: 'Çanakkale Onsekiz Mart Üniversitesi Bilgisayar Mühendisliği öğrencileriyiz. Büyük havalimanlarının pahalı sistemlerine erişemeyen bölgesel havalimanları için uygun maliyetli, kendi enerjisini üreten otonom denetim geliştiriyoruz.',
    },
    slide: 15,
  },
]
