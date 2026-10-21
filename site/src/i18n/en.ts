/*
  İngilizce metinler: Türkçe metin → İngilizce karşılığı (birebir eşleşme).
  Çevrilmeyen metin Türkçe görünür. Kapsam: gezinme, sayfa ve blok başlıkları, açıklamalar, ana sayfa,
  arayüz düğmeleri. Ayrıntılı içerik metinleri Türkçe kalır; sayfalarda bunu söyleyen bir not görünür.
*/
export const EN: Record<string, string> = {
  // gezinme ve sayfalar
  'Ana sayfa': 'Home',
  'Her uçuştan önce, doğrulanmış temiz pist.': 'A verified clean runway before every flight.',
  Kovan: 'Hive',
  'Görevine göre uzmanlaşmış bir drone kovanı': 'A drone hive specialised by task',
  'Kâşifler pisti tarar, işçiler bulunan nesneyi toplar, bekçiler kuşu ve hayvanı uzaklaştırır, nöbetçiler acil durumu ilk fark eder. Hepsi aynı haritayı okur ve ona yazar; kovan güneş ve rüzgârdan kendi enerjisini üretir.':
    'Scouts scan the runway, workers pick up what they find, guards keep birds and animals away, sentinels see emergencies first. All read and write one shared map; the hive makes its own energy from sun and wind.',
  Kastlar: 'Castes',
  'Arı kovanından ne aldık': 'What we took from the beehive',
  'Petek istasyonu': 'Hive station',
  'Kovan boyları': 'Hive sizes',
  'Kovanını kur': 'Build your hive',
  'Kovan zekâsı': 'Hive intelligence',
  Sistem: 'System',
  'Pistteki küçük bir cisim, büyük bir maliyet': 'A small object on the runway, a big cost',
  'Bölgesel havalimanlarında pist, yaban hayatı ve çit denetimleri hâlâ gözle ve araçla yapılıyor. AERO-GUARD bunları kendi enerjisini üreten, uçuş tarifesine göre çalışan tek bir sistemde topluyor.':
    'At regional airports, runway, wildlife and fence checks are still done by eye and by car. AERO-GUARD combines them in one self-powered system that works around the flight schedule.',
  Problem: 'Problem',
  Mimari: 'Architecture',
  'Türbin ve enerji adası': 'Turbine and energy island',
  'Pilot saha': 'Pilot site',
  Görevler: 'Missions',
  'Yedi görev, tek kovan': 'Seven missions, one hive',
  'Uçuş öncesi taramadan buz haritasına kadar her görevi kovandaki bir kast üstlenir. Bölgesel bir havalimanının yedi ayrı sisteme yatırım yapması gerekmez.':
    'From the pre-flight scan to the ice map, each mission belongs to a caste in the hive. A regional airport does not need to buy seven separate systems.',
  'Nesne toplama': 'Object pickup',
  'Buz haritası': 'Ice map',
  'Tarama hesabı': 'Scan calculator',
  'Yapay zekâ': 'AI',
  Hangar: 'Hangar',
  'Ne kadar taşır, ne kadar dayanır': 'Payload and durability',
  'Kovanın iki drone sınıfı ve petek hücresi: faydalı yük, koruma sınıfı, rüzgâr ve sıcaklık sınırları, uçuş süresi ve pilottan önce yapılacak dayanıklılık testleri.':
    'The hive’s two drone classes and the station cell: payload, protection rating, wind and temperature limits, flight time and the durability tests before the pilot.',
  '3D hangar': '3D hangar',
  Platformlar: 'Platforms',
  'Dayanıklılık testleri': 'Durability tests',
  'Acil durum': 'Emergencies',
  'Acil durumu ilk fark eden kovan': 'The hive sees emergencies first',
  'Uçak inip kalkarken drone’lar yerdedir; pisti nöbetçi kameralar izler. Olay saniyeler içinde kuleye bildirilir ve kovan en yakın uygun drone’u kaldırır.':
    'Drones stay on the ground while aircraft move; sentinel cameras watch the runway. The tower is alerted within seconds and the hive launches the nearest suitable drone.',
  İlke: 'Principle',
  Senaryolar: 'Scenarios',
  Planlayıcı: 'Planner',
  'Tarifeye duyarlı planlama: drone ile uçak hiç karşılaşmaz': 'Schedule-aware planning: drones and aircraft never meet',
  'Görevler sabit saatlerde değil, uçuş tarifesine ve gerçekleşen kalkış/varış saatlerine göre kendiliğinden yerleşir. Bir uçuşu sürükleyin, gecikme ekleyin ya da rüzgârı artırın.':
    'Missions are not on fixed times: they fit themselves around the timetable and actual movements. Drag a flight, add a delay or raise the wind.',
  Çizelge: 'Timeline',
  Etki: 'Impact',
  'Enerji, karbon ve maliyet: her rakam varsayımıyla': 'Energy, carbon and cost: every figure with its assumption',
  'Hesaplayıcıların varsayılan değerleri raporu aynen verir. Değerleri değiştirip sonucun nasıl değiştiğini kendiniz görün.':
    'The calculators’ defaults reproduce the report exactly. Change the inputs and see how the results move.',
  'Enerji adası': 'Energy island',
  Karbon: 'Carbon',
  'İş modeli': 'Business model',
  Rekabet: 'Competition',
  Emniyet: 'Safety',
  'Drone’un kendisi asla FOD olmamalı': 'The drone itself must never become FOD',
  'Kule onayı, sanal sınır, pist dışına acil iniş, sahada kalan veri ve sinyal karıştırmaya karşı katmanlı konum: emniyet tasarımın ilk satırı.':
    'Tower approval, geofence, emergency landing off the runway, data that stays on site and layered positioning against jamming: safety is the first line of the design.',
  'Kurallar ve riskler': 'Rules and risks',
  'Sinyal karıştırma': 'Jamming',
  Gelişim: 'Evolution',
  'Başvurudan V3’e: nasıl olgunlaştı': 'From application to V3: how it matured',
  'Mentörlerin geri bildirimiyle kapsamı daralttık, sonra kovanı görevine göre uzmanlaştırdık. Her sürümde neyi neden değiştirdiğimiz ve 30 aylık yol haritası.':
    'Mentor feedback narrowed the scope, then we specialised the hive by task. What we changed in each version, why, and the 30-month roadmap.',
  Sürümler: 'Versions',
  'Mentörlerden ders': 'Lessons from mentors',
  'Yol haritası': 'Roadmap',
  Ekip: 'Team',
  Sorular: 'Questions',
  'Aklınıza gelebilecek sorular': 'Questions you might ask',
  'Drone düşerse ne olur, kovanın kraliçesi kim, sinyal karıştırılırsa ne yapılır? Kısa cevaplar ve her birinin canlı gösterimi.':
    'What if a drone falls, who is the hive’s queen, what if the signal is jammed? Short answers, each with a live demo.',

  // blok başlıkları ve açıklamaları
  'Beş kast, tek kovan': 'Five castes, one hive',
  'Her kast bir işte uzmanlaşır. Hücreye tıklayıp görevlerini, platformunu ve yuvasını görün.': 'Each caste specialises in one job. Click a cell to see its tasks, platform and home station.',
  'Mentörlerimiz projeyi bir arı kovanına benzetti. Benzetmeyi süs olarak değil, mimari olarak kullandık.': 'Our mentors compared the project to a beehive. We used the analogy as architecture, not decoration.',
  'Pistin iki ucunda altıgen hücrelerden oluşan iki petek. Her hücre bir drone yuvası.': 'Two hexagonal stations at the two ends of the runway. Each cell is a drone’s home.',
  'Kovan trafiğe ve iklime göre büyür; her havalimanı yalnızca ihtiyaç duyduğu hücreyi alır.': 'The hive grows with traffic and climate; each airport buys only the cells it needs.',
  'Hücre ekleyin ya da çıkarın: kurulum, yıllık maliyet, tarama süresi, enerji dengesi ve yetenekler anında değişir.':
    'Add or remove cells: set-up cost, annual cost, scan time, energy balance and capabilities update instantly.',
  'Görevler kastlara atanır, farklı kastlar aynı anda çalışabilir, pist kullanımdayken hiçbir drone uçmaz.': 'Missions are assigned to castes, different castes can work at once, and no drone flies while the runway is in use.',
  'Bir cıvata, taş ya da plastik parçası motora girdiğinde iş gecikme, iptal ve pahalı bir motor onarımına dönüşür. Bölgesel havalimanlarında denetimlerin hepsi hâlâ gözle ve araçla yapılıyor: kayıt yok, karşılaştırma yok.':
    'A bolt, stone or piece of plastic in an engine means delays, cancellations and an expensive repair. Regional airports still inspect by eye and by car: no record, no comparison.',
  'Petek istasyonları, enerji adası, akıllı yazılım': 'Hive stations, energy island, smart software',
  'Pistin iki ucunda birer petek, güneş ve rüzgârdan beslenen bir enerji adası ve uçuş tarifesini okuyan bir yazılım katmanı. Bir bileşene tıklayın; kule onaylamadan hiçbir drone kalkmaz.':
    'A station at each end of the runway, an energy island fed by sun and wind, and software that reads the timetable. Click a component; no drone takes off without tower approval.',
  'Rüzgâr türbini ve enerji adası': 'Wind turbine and energy island',
  'Kovanın balı: güneş ve küçük bir dikey eksenli türbin bataryayı doldurur, batarya bütün hücreleri besler.': 'The hive’s honey: solar and a small vertical-axis turbine charge the battery, which powers every cell.',
  'Pilot saha: Çanakkale Havalimanı': 'Pilot site: Çanakkale Airport',
  'Tek pist, günde yaklaşık dört ticari hareket ve saatlerce boş kalan bir pist. Çanakkale rüzgâr kurulu gücünde Türkiye’nin önde gelen illerinden ve üniversitemize yakın.':
    'One runway, about four commercial movements a day and hours of idle runway. Çanakkale is among Türkiye’s leading wind-power provinces and close to our university.',
  'Yedi görev': 'Seven missions',
  'Satırın rengi görevi üstlenen kastın rengidir.': 'Each row is coloured by the caste that flies it.',
  'Nesne toplama: işçi': 'Object pickup: worker',
  'Bulunan küçük nesneyi işçi toplar; karar operatörün, pencere kulenin.': 'The worker picks up small objects; the operator decides and the tower grants the window.',
  'Buz haritası: bakıcı': 'Ice map: carer',
  'De-icing geri geldi, ama yalnızca harita olarak: drone sıvı sıkmaz, ekibe nereye sıkılacağını gösterir. Önce şunu sorar: bu havada uçabilir miyim?':
    'De-icing is back, but only as a map: the drone never sprays, it shows the crew where to spray. First it asks: can I fly in this weather?',
  'Her uçuştan önce yaklaşık 12 dakikada temiz pist': 'A clean runway in about 12 minutes before every flight',
  'İki kâşif aynı anda kalkar; her biri pistin yarısını 20 m irtifadan üç geçişle tarar. Kazancımız hız değil tutarlılık: her tarama aynı rotada, aynı çözünürlükte ve kayıt altında.':
    'Two scouts take off together; each scans half the runway at 20 m in three passes. The gain is consistency, not speed: same route, same resolution, every scan on record.',
  'Yapay zekâ önerir, insan karar verir': 'AI suggests, people decide',
  'Açık FOD-A veri setiyle başlıyor, Çanakkale pistinde kontrollü bırakılan test nesneleriyle ince ayar yapıyoruz. Operatörün her kararı yeni bir etikete dönüşür. Sistem pisti asla kendisi açmaz.':
    'We start from the open FOD-A dataset and fine-tune with test objects placed on the Çanakkale runway. Every operator decision becomes a new label. The system never opens the runway by itself.',
  'Kovanın modelleri gerçek ölçekte. Döndürün, yakınlaştırın, parçalarına ayırın; işçide toplama ve kamera başlığını değiştirin.':
    'The hive’s models at real scale. Rotate, zoom, explode them; swap the worker’s pickup and camera heads.',
  'Referans platformlar ticari ürün sınıflarıdır; değerler üretici verisi, “doğrulanacak” yazanlar resmi veriyle kontrol edilecek.':
    'Reference platforms are commercial product classes; values are manufacturer data, items marked “to verify” will be checked against official data.',
  'Dayanıklılık test planı': 'Durability test plan',
  'Pilottan önce her platform ve petek hücresi bu testlerden geçer.': 'Before the pilot, every platform and station cell goes through these tests.',
  'İlk gören, ilk ulaşan değil': 'First to see, not first to arrive',
  'Kovan itfaiyenin yerini almaz; ona ilk saniyelerde göz olur.': 'The hive does not replace firefighters; it gives them eyes in the first seconds.',
  '12 senaryo': '12 scenarios',
  'Her senaryoda olayı kim ilk fark eder, kovan ne yapar ve bilgi kime gider. Kırmızı kenarlılar hayati olanlar.': 'For each scenario: who notices first, what the hive does and who is told. Red-edged ones are critical.',
  'Bir günün planı': 'A day’s plan',
  'Pist sağlığı taraması ve çit devriyesi gibi uzun görevler gün içindeki boşluklara yerleşir. Rüzgâr 8 m/s’yi aşınca görev araçla denetime düşer.':
    'Long missions such as the runway-health scan and the fence patrol fill the gaps in the day. Above 8 m/s wind, a mission falls back to a vehicle inspection.',
  'Kovan tükettiğinden fazlasını üretiyor': 'The hive produces more than it uses',
  'Mini kovan günde yaklaşık 10 kWh tüketiyor; en büyük kalem hücrelerin iklimlendirmesi. Güneş ve rüzgâr yılda yaklaşık 8.550 kWh üretiyor. Türbinin kapasite faktörünü bilerek düşük, %12 aldık.':
    'The mini hive uses about 10 kWh a day; cell climate control is the largest item. Sun and wind produce about 8,550 kWh a year. We deliberately took a low 12% turbine capacity factor.',
  'Gerçekçi rakam: yılda yaklaşık 10 ton CO₂, asıl kazanç dolaylı': 'An honest figure: about 10 t CO₂ a year; the real gain is indirect',
  'Başvuruda yazdığımız rakamın hesabı yoktu. Şimdi yalnızca gerçekten etkilediğimiz kalemleri hesaplıyoruz. Tek havalimanı için küçük bir rakam; bunu açıkça söylüyoruz.':
    'The figure in our application had no calculation behind it. Now we count only what we actually affect. For one airport it is small, and we say so.',
  'Havalimanına kurulum yükü yok: hizmet olarak drone': 'No set-up cost for the airport: drone as a service',
  'Havalimanı kurulum parası ödemez, beş yıllık abonelik öder. Mini kovanı (rapor v2) ve Çanakkale kovanını (V3 ön tahmini) karşılaştırın.':
    'The airport pays no set-up cost, only a five-year subscription. Compare the mini hive (report v2) with the Çanakkale hive (V3 estimate).',
  'Parçalar var, bütün yok': 'The parts exist, the whole does not',
  'Sabit FOD radarları ve kuş radarları büyük havalimanlarında sürekli izleme sağlar ama pahalı ve tek görevlidir. Dürüst sınırımız: sürekli izleme yapmıyoruz.':
    'Fixed FOD and bird radars give continuous monitoring at large airports but are expensive and single-purpose. Our honest limit: we do not monitor continuously.',
  'Kule onayı olmadan kalkış yok. Sanal sınır her drone’u görev alanında (pist şeridi, çit hattı ya da apron) ve 30 m’nin altında tutar, ADS-B alıcısı yaklaşan hava aracını algılar. Arızada drone pist dışındaki acil iniş noktasına iner.':
    'No take-off without tower approval. The geofence keeps each drone inside its task area (runway strip, fence line or apron) and below 30 m; ADS-B detects approaching aircraft. On failure, a drone lands at an emergency point off the runway.',
  'Sinyal karıştırma ve aldatma': 'Jamming and spoofing',
  'Katmanlı savunma: önce tespit, sonra birden çok konum kaynağı, güvenli bağlantı ve prosedür.': 'Layered defence: detection first, then multiple position sources, a secure link and procedures.',
  'Her sürümde ne değişti, ne kaldı.': 'What changed in each version, and what stayed.',
  'Mentörlerden aldığımız ders: doğru havalimanını seçmek': 'Lesson from our mentors: choose the right airport',
  'Başvuruda büyük havalimanlarını hedefliyorduk. Sabiha Gökçen’de dakikada yaklaşık bir hareket var; drone’a pistte zaman kalmıyor. Soruyu tersine çevirdik: bu sistemlere erişemeyen kim?':
    'Our application targeted large airports. Sabiha Gökçen has about one movement a minute; there is no runway time left for a drone. We flipped the question: who cannot afford these systems?',
  '30 ayda Çanakkale’den 3–5 bölgesel havalimanına': 'From Çanakkale to 3–5 regional airports in 30 months',
  'İlk üç ayda FOD-A ile eğitilmiş YOLO demosu ve görev planlayıcı simülasyonu. İzin sürecine ilk ayda başlıyoruz; ilk uçuşlar uçuşsuz saatlerde apron ve taksi yolunda.':
    'In three months: a YOLO demo trained on FOD-A and a planner simulation. Permits start in month one; first flights are on the apron and taxiway in idle hours.',
  'Çanakkale Onsekiz Mart Üniversitesi Bilgisayar Mühendisliği öğrencileriyiz. Pahalı sistemlere erişemeyen bölgesel havalimanları için kendi enerjisini üreten otonom denetim geliştiriyoruz.':
    'We are Computer Engineering students at Çanakkale Onsekiz Mart University, building self-powered autonomous inspection for regional airports that cannot afford expensive systems.',
  'Kısa cevaplar': 'Short answers',
  'Bir soruyu açın; çoğunun altında ilgili sahneye giden bir düğme var.': 'Open a question; most have a button that takes you to the matching scene.',

  // ana sayfa
  'AERO-GUARD, bölgesel havalimanları için kendi enerjisini üreten bir drone kovanı: kâşifler pisti tarar, işçiler bulunanı toplar, bekçiler kuşu uzaklaştırır, nöbetçiler acil durumu ilk fark eder. Pilot saha Çanakkale Havalimanı.':
    'AERO-GUARD is a self-powered drone hive for regional airports: scouts scan the runway, workers pick up what they find, guards deter birds, sentinels see emergencies first. Pilot site: Çanakkale Airport.',
  'Operasyon merkezini aç': 'Open operations',
  '3D’de gez (WASD)': 'Explore in 3D (WASD)',
  'Kovanı tanı': 'Meet the hive',
  'iki kâşif ile tam pist taraması': 'full runway scan with two scouts',
  'yenilenebilir üretim / tasarım yükü, mini kovan': 'renewable output / design load, mini hive',
  'yıllık CO₂ azaltımı, havalimanı başına': 'annual CO₂ saving per airport',
  'mini kovan kurulumu': 'mini hive set-up',
  'prototipten 3–5 havalimanına': 'from prototype to 3–5 airports',
  'Temsili simülasyon görüntüsü': 'Representative simulation',
  'Görevine göre uzmanlaşmış drone’lar': 'Drones specialised by task',
  'Kastları ve kovan boylarını gör': 'See castes and hive sizes',
  'Operasyon merkezi': 'Operations centre',
  'Kule onayını siz verin': 'You give the tower approval',
  'Piste bir cıvata bırakın, kâşiflerin onu bulmasını izleyin, sonra bir arıza verip emniyet kurallarının devreye girişini görün.':
    'Drop a bolt on the runway, watch the scouts find it, then inject a fault and see the safety rules kick in.',
  'Simülasyonu başlat': 'Start the simulation',
  'Bir günü oynat': 'Play a day',
  '05:00’ten gece yarısına': 'From 05:00 to midnight',
  'Uçaklar iner ve kalkar, görevler tarifeye göre başlar, rüzgârlı saatlerde pist araçla denetlenir.': 'Aircraft land and leave, missions follow the timetable, windy hours fall back to vehicle checks.',
  '300× hızla izle': 'Watch at 300×',
  'FOD ve kuş çarpmalarının dünya genelinde yıllık toplam maliyeti': 'Annual worldwide cost of FOD and bird strikes',
  'Drone ile uçak hiç karşılaşmaz': 'Drones and aircraft never meet',
  'Yangından deprem sonrası pist taramasına: olayı ilk fark eden kovan.': 'From fire to a post-earthquake runway scan: the hive sees it first.',
  'Ne kadar taşır?': 'How much can it carry?',
  'İşçi drone ≈2,7 kg faydalı yük; nesne toplamada tasarım sınırı 1 kg.': 'Worker drone: ≈2.7 kg payload; design limit for pickup 1 kg.',
  'Sinyal karıştırmaya dayanıklı': 'Resilient to jamming',
  'GNSS kesilirse UWB ve görsel konum devreye girer; tutarsız kaynak dışarıda kalır.': 'If GNSS drops, UWB and visual positioning take over; inconsistent sources are excluded.',
  'Mini kovan tükettiğinin 1,8 katını güneş ve rüzgârdan üretiyor. Hücre ekledikçe dengenin nasıl değiştiğini Kovanını kur’da görün.':
    'The mini hive produces 1.8× what it uses from sun and wind. See how the balance changes as you add cells in Build your hive.',
  'Mentör geri bildirimiyle kapsamı daralttık, sonra kovanı görevine göre uzmanlaştırdık.': 'Mentor feedback narrowed the scope, then we specialised the hive by task.',
  'Görevi kendiniz yönetin': 'Run the mission yourself',
  'Çanakkale pistinin dijital ikizinde bir uçuş öncesi FOD taramasını baştan sona izleyin: kule onayını siz verin, piste kendi nesnenizi bırakın ve bir arıza vererek emniyet kurallarının nasıl devreye girdiğini görün.':
    'Follow a pre-flight FOD scan on the Çanakkale runway’s digital twin: give tower approval, drop your own object and inject a fault to see the safety rules work.',

  // arayüz
  Varsayımlar: 'Assumptions',
  Menü: 'Menu',
  Kapat: 'Close',
  Keşfet: 'Explore',
  'Bu sayfadaki ayrıntılı metinler Türkçedir; başlıklar, rakamlar ve 3D gösterimler iki dillidir.':
    'Detailed text on this page is in Turkish; headings, figures and the 3D demos are bilingual.',
  '3D sahne ve simülasyonlar temsilidir. Rakamlar ön tasarım tahminidir; her birinin varsayımı Varsayımlar panelinde.':
    '3D scenes and simulations are representative. Figures are preliminary design estimates; each one’s assumption is in the Assumptions panel.',
  'Sitenin QR kodu': 'QR code for the site',
  'Telefonda aç': 'Open on your phone',
  'İnişte fren veya motor yangını': 'Brake or engine fire on landing',
  'Pist dışına çıkma': 'Runway excursion',
  'Lastik patlaması ve parçalanma': 'Tyre burst and debris',
  'Kuş çarpması bildirimi': 'Bird strike report',
  'Yakıt veya hidrolik sızıntısı': 'Fuel or hydraulic leak',
  'Çitten izinsiz giriş': 'Fence intrusion',
  'İzinsiz drone': 'Unauthorised drone',
  'Deprem sonrası pist hasarı': 'Runway damage after an earthquake',
  'Şebeke kesintisi': 'Grid outage',
  'Çevrede yangın ve duman': 'Nearby fire and smoke',
  'Gece kayıp kişi araması': 'Night search for a missing person',
  'Acil iniş beklentisi': 'Expected emergency landing',
  'Kış sabahı buz haritası': 'Winter-morning ice map',
  'Nöbetçi termal kamera': 'Sentinel thermal camera',
  'Nöbetçi, iz takibi': 'Sentinel, track following',
  'Nöbetçi': 'Sentinel',
  'Pilot bildirimi': 'Pilot report',
  'Termal ve RGB kamera': 'Thermal and RGB camera',
  'Bekçi devriyesi': 'Guard patrol',
  'RF izleyici, Remote ID': 'RF monitor, Remote ID',
  'Kule çağrısı': 'Tower call',
  'Enerji yönetimi': 'Energy management',
  'Bekçi': 'Guard',
  'Bakıcı (işçinin kamera başlığı)': 'Nurse (worker with camera head)',
}
