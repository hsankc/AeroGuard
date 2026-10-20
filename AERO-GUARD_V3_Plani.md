# AERO-GUARD V3 Planı: Kovan

> Tarih: 20 Ekim 2026
> Önceki plan ([AERO-GUARD_Site_Plani.md](AERO-GUARD_Site_Plani.md)) ve Faz 1–4 çıktılarının hepsi korunur. Bu belge, projenin V3 mimarisini (Kovan) ve sitenin baştan tasarımını tanımlar.

**V3 tek cümleyle:** AERO-GUARD bir arı kovanı gibi çalışır.
- Görevlerine göre uzmanlaşmış drone'lar tek bir ortak harita üzerinden iş birliği yapar.
- Kâşifler pisti tarar, işçiler bulunan nesneyi toplar, bekçiler kuşu ve hayvanı uzaklaştırır.
- Nöbetçiler acil durumu ilk fark eder; bakıcılar kış sabahı uçakta buzun nerede olduğunu gösterir.
- Kovan güneş ve rüzgârdan kendi enerjisini üretir, ihtiyaç oldukça hücre ekleyerek büyür.

---

## 1. Neden kovan, ve mentörlere nasıl uyuyor

- **Benzetme mentörlerden geldi.** Mentörler projeyi bir arı kovanına benzetti. Başvurudaki "Kovan" kavramı da buydu; V3'te bu benzetme projenin omurgası oluyor.
- **Mentörlerin itirazı kovanın büyüklüğüneydi.** Bölgesel bir havalimanı için 50+ drone'luk sürü gerçekçi değildi. V3'teki kovan küçük başlıyor (Çanakkale için 4 drone) ve yalnızca ihtiyaç kadar büyüyor.
- **Uzmanlaşma işleri gerçekçi kılıyor.** Her drone tek tip işe göre donatılır, sertifikalandırılır ve risk değerlendirmesi (SORA) kendi görevi için yapılır. Gerçek kovanda olduğu gibi her bireyin bir rolü var.
- **Kraliçe yok.** Gerçek kovanda merkezi bir emir veren yoktur. Bizim kovanda emniyet için merkezi bir planlayıcı ve kule onayı var. Drone'lar ise engelden kaçınma ve arıza durumunda güvenli davranma konusunda kendi başına karar verir. Jüri "Kraliçe kim?" diye sorarsa cevap: "Kovanın kararını kule ve insan verir."
- **De-icing püskürtme değil.** Drone yalnızca buz haritası çıkarır, sıvıyı ekip sıkar. Drone buzlanma koşulunda uçmaz.
- **Hikâye üç sürüm:**
  - v1 (başvuru): büyük bir sürü ve her görev.
  - v2 (final): 2 drone'la odaklandık.
  - v3: aynı odak, ama görevine göre uzmanlaşmış küçük bir kovan.

---

## 2. Kovan benzetmesi: neyin neye karşılık geldiği

| Arı kovanında | AERO-GUARD'da |
|---|---|
| Kâşif arılar yeni kaynak bulur | **Kâşif drone'lar** pisti tarar, yabancı nesneyi bulur |
| Sallanma dansı kaynağın yönünü ve uzaklığını anlatır | Kâşif, nesnenin konumunu ve fotoğrafını kovana bildirir |
| Feromon: arıların çevreye bıraktığı iz | **Dijital ikiz** üzerindeki işaretler. Her drone ortak haritayı okur ve ona yazar; biyolojideki adı stigmerji |
| Toplayıcı işçiler nektarı kovana taşır | **İşçi drone** nesneyi toplar, istasyondaki FOD kutusuna taşır |
| Nöbetçi arılar kovan girişini bekler | **Nöbetçi kameralar** her iniş-kalkışta pisti izler |
| Bekçi arılar tehdidi uzaklaştırır | **Bekçi drone** kuşu ve hayvanı uzaklaştırır, çiti dolaşır |
| Bakıcı arılar yavruya bakar | **Bakıcı rolü** park eden uçağın buz haritasını çıkarır |
| Arılarda iş bölümü yaşla değişir | Bizde başlıkla değişir: aynı ağır gövde toplama başlığıyla işçi, kamera başlığıyla bakıcı olur |
| Petek: altıgen hücreler | **Petek istasyonu:** her hücre bir drone yuvası; kovan hücre ekleyerek büyür |
| Bal: kovanın enerji deposu | **Batarya:** güneş ve rüzgârla dolan enerji deposu |
| Arılar kanat çırparak kovanı serinletir | İstasyon iklimlendirmesi en büyük tüketim kalemi. Ortak yalıtımlı petek bu yükü azaltabilir; pilotta ölçülecek |
| Tehdide en yakın arılar savunur | Acil durumda **en yakın uygun drone** görevlendirilir |

---

## 3. Kastlar ve Çanakkale kovanı

### 3.1 Kastlar

| Kast | Görevler | Platform | Yük | Petek |
|---|---|---|---|---|
| **Kâşif** × 2 | FOD taraması, açılış taraması, pist sağlığı ve GRF, hareket sonrası tarama | M3TD sınıfı | 48 MP + termal, entegre | A ve B |
| **Bekçi** × 1 | Yaban hayatı caydırma, çit devriyesi, izinsiz giriş takibi | M3TD sınıfı | Termal + hafif hoparlör ve ışık | A |
| **İşçi** × 1 | FOD toplama | M350 sınıfı, ≈2,7 kg yük | Vinç + toplama başlığı (EPM mıknatıs veya kıskaç) + termal/zoom kamera | B |
| **Bakıcı** (işçinin ikinci rolü) | Kış sabahı buz haritası | İşçiyle aynı gövde | Kamera başlığı; ek donanım yok | B |
| **Nöbetçi** × 2 direk | Her harekette pisti izler, olayı ilk fark eder | Sabit termal + görünür PTZ kamera | — | A ve B direkleri |

### 3.2 Petek istasyonu

- Her petek, altıgen hücrelerden oluşan yalıtımlı bir yapı. Her hücrede ticari bir otomatik drone istasyonu bulunuyor.
- Hücreler güç hattını, iklimlendirmeyi ve ağı paylaşıyor.
- **Petek A (04 ucu):** Kâşif-1, Bekçi ve nöbetçi direk.
- **Petek B (22 ucu):** Kâşif-2, İşçi/Bakıcı, FOD kutusu ve nöbetçi direk.
- Her petek altı hücreye kadar büyüyebilir.
- **ICAO Ek 14 yerleşimi:** Petekler pist şeridinin (140 m) dışında ve geçiş yüzeyinin (1:7) altında kalmalı. Bu değerler Ek 14'ün güncel baskısından doğrulanacak; kesin yer DHMİ mânia görüşüyle belirlenecek.

### 3.3 Kovan boyları

Kovan trafiğe ve iklime göre büyür.

| Kovan | Kim için | İçerik | Kurulum (tahmin, ±%30) | Beş yıla yayılmış yıllık maliyet |
|---|---|---|---|---|
| **Mini kovan (v2)** | En küçük havalimanı | 2 kâşif, 2 hücre, enerji adası | ≈124 bin $ | ≈39 bin $ |
| **Çanakkale kovanı (önerilen)** | Düşük trafikli, rüzgârlı | 2 kâşif, 1 bekçi, 1 işçi, nöbetçiler, güvenli konum, 6 kWp güneş | ≈218 bin $ | ≈63 bin $ |
| **Kış kovanı** | Soğuk iklim (ör. Erzurum, Kars) | Çanakkale kovanı + bakıcı rolü | ≈223 bin $ | ≈64 bin $ |
| **Geniş kovan** | Daha sık trafik | +1–2 kâşif ve orta saha peteği | +≈20 bin $ / kâşif | — |

**Ek kalemler** (tahmin, ±%30):

| Kalem | Tahmin |
|---|---|
| Bekçi hücresi | ≈20 bin $ |
| İşçi hücresi | ≈35 bin $ |
| Bakıcı rolü (yazılım ve kalibrasyon) | ≈5 bin $ |
| Nöbetçi kameralar | ≈14 bin $ |
| Güvenli konum | ≈12 bin $ |
| Kovan yazılımı (çok kastlı görev dağıtımı) | ≈10 bin $ |
| Ek güneş paneli (4 → 6 kWp, rapordaki birim fiyatla) | ≈2,5 bin $ |

**Yıllık işletme:** Mini kovanda ≈14 bin $, Çanakkale kovanında ≈19 bin $.

**Ölçekleme kuralı: kâşif sayısı tarama süresini belirler.** Her kâşif pistin 1/n'ini üç geçişle tarar:

| Kâşif sayısı | Tarama süresi |
|---|---|
| 2 | ≈12 dk |
| 3 | ≈9 dk |
| 4 | ≈8 dk |

Kısalan tarama, daha sık tarifeye sığar. Ancak dakikada bir hareketin olduğu büyük havalimanında yine pencere oluşmaz; sınırımız değişmiyor.

Bunlar ön tahmin ve sitede de öyle etiketlenecek. Modüler yapı sayesinde her havalimanı yalnızca ihtiyaç duyduğu hücreyi alır.

---

## 4. Yeni yetenekler (teknik tasarım)

### 4.1 FOD toplama: İşçi

**Akış** (sıralı süreç):
1. **Bildirim:** Kâşif nesneyi bulur ve kovana bildirir: RTK konumu, fotoğraf, sınıf ve tahmini boyut. Bu, sallanma dansının karşılığı. Nesne dijital ikize işaret olarak düşer.
2. **İnsan kararı:** Operatör "İşçi ile topla" der. Kule, pist kullanımda değilken pencereyi onaylar.
3. **Konumlanma:** İşçi kalkar ve nesnenin **4 m üstünde asılı kalır.** Yere inmez; böylece pervane rüzgârı hafif nesneyi savurmaz, drone da piste değmez.
4. **Alma:** **Vinç**, kabloyla toplama başlığını indirir. Metal nesnede **elektro-kalıcı mıknatıs (EPM)** kullanılır; EPM güç kesilse bile tutar ve yalnızca komutla bırakır. Metal olmayan nesnede **normalde kapalı yumuşak kıskaç** kullanılır.
5. **Teslim:** Nesne Petek B'deki **FOD kutusuna** bırakılır. Sınıf, ağırlık, konum ve saat kaydedilir; bu kayıtlar FOD kaynağı analizine girdi olur.
6. **Doğrulama:** Kâşif bölgeyi kısa bir taramayla "temizlendi" diye işaretler ve işaret dijital ikizden silinir.

**Sınırlar:**
- **Toplanabilen:** Nesne ≤ 1 kg ve ≤ 30 cm.
- **Saha ekibine kalanlar:** Islak ya da yapışık nesneler, sıvılar, büyük keskin parçalar ve hayvan kalıntıları.
- **Koşullar:** Rüzgâr ≤ 8 m/s ve pist kullanımda değil. Kablo salınımı nedeniyle toplama sırasında hız sınırlı.

**Yük bütçesi:**
- Drone'un azami faydalı yükü 2,7 kg (üretici verisi).
- Vinç ve başlık ≈1,2 kg (tasarım tahmini).
- Tasarım sınırı %33 payla **1 kg**.

**Yeni KPI** (pilotta ölçülecek): tespitten temizliğe geçen süre, ≤ 1 kg nesnelerde toplama başarı oranı.

### 4.2 Sinyal karıştırma ve aldatma: güvenli konum

**Neden önemli:**
- EASA'nın GNSS kesintileri bülteni (SIB 2022-02R3, Temmuz 2024), Akdeniz'i karıştırma ve aldatmanın belirgin arttığı bölgeler arasında sayıyor. Bültenin 2022 sürümü Kıbrıs ve Türkiye çevresini ayrıca anıyordu.
- Çanakkale sivil–askeri ortak kullanımlı; sahada askeri karşı-İHA sistemleri bulunabilir.

**Katmanlı savunma:**
1. **Uçuştan önce tespit:** Peteklerdeki SDR tabanlı RF ve GNSS bütünlük izleyici şunlara bakar: sinyal gücü düşüşü, ani konum ya da saat sıçraması, sahte uydu imzası. Sorun varsa ön kontrolde **"RF/GNSS bütünlüğü"** kırmızı yanar ve hiçbir drone kalkmaz.
2. **Çok kaynaklı konum:** Konum altı kaynaktan gelir. Bütünlük denetleyici kaynakları karşılaştırır ve tutarsız olanı dışarıda bırakır; aldatma bu yolla tespit edilir.
   - çok bantlı, çok takımyıldızlı GNSS (L1/L5)
   - sabit RTK baz istasyonu
   - görsel konumlama (pist işaretleri ve kenar ışıkları hazır bir harita)
   - pist kenarı hizasında ≈40 UWB işaretçisi
   - IMU
3. **Komuta bağlantısı:** Ana bağlantı frekans atlamalı ve şifreli; yedek bağlantı özel LTE/5G. Bağlantı kesilirse önceden yüklenmiş otonom eve dönüş devreye girer. Konum da yoksa drone IMU ve görsel konumlamayla en yakın acil iniş noktasına iner.
4. **Prosedür:** Frekanslar BTK ile koordine edilir. Askeri birimle karşı-İHA koordinasyonu yapılır; drone'larımız "dost" listesindedir.
5. **Karıştırıcı kullanmıyoruz.** Bu yasal değil; biz yalnızca tespit ediyor ve dayanıklılık sağlıyoruz.

### 4.3 Buz haritası: Bakıcı

**Ne yapar:** Park etmiş uçağın kanat üstünde, yatay stabilizöründe ve gövde üstünde kırağı ya da buz olan bölgeleri haritalar. Bölgeler de-icing ekibinin tabletine **"püskürtme bölgeleri"** olarak düşer. İşlemden sonra kontrol uçuşu yapılır.

**Ne yapmaz:**
- Sıvı sıkmaz.
- "Uçak temiz" kararı vermez. Temiz uçak ilkesi gereği karar kaptan ve ekibindir.

**Drone düşmemeli: uçuş koşulu (git / gitme):**

| Koşul | Kural |
|---|---|
| Yağış ve sis | Kar, dondurucu yağmur veya çisenti, dondurucu sis yoksa uçar. METAR'da FZFG, FZDZ, FZRA, SN ya da PL varsa **uçmaz**. |
| Neden kırağı senaryosu | Açık ve sakin bir kış sabahında, ışınımsal soğumayla park eden uçakta kırağı oluşur. Havada aşırı soğumuş sıvı damlacık yoktur, bu yüzden drone'da buzlanma beklenmez. |
| Sıcaklık | ≥ –20 °C (üretici çalışma sınırı). Batarya ön ısıtılır, uçuş ≤ 15 dk. |
| Rüzgâr | ≤ 8 m/s |
| Koşul yoksa | Bugünkü gibi ekip gözle ve elle kontrol eder. |

**Emniyet geometrisi:**
- Uçağın **üzerinden asla geçmez.** Arıza olursa uçağa değil apron zeminine düşer.
- Gövdeye en az 6 m yatay mesafe; irtifa en fazla kuyruk yüksekliği + 3 m; hız ≤ 3 m/s.
- Motorlar kapalıyken uçar; APU çalışıyorsa kuyruk bölgesinden uzak durur.

**Sensör:** Haritalama RGB + termal ile yapılır. Araştırmalar (SEI projesi) hiperspektral kameranın daha güvenilir olduğunu gösteriyor; bunu ileride eklenecek bir başlık olarak planlıyoruz.

**Sayı vermiyoruz:**
- Glikol tasarrufu pilotta ölçülecek; başvurudaki "%45" iddiası geri gelmiyor.
- Bu rolün olgunluğu düşük (TRL 3–4) ve sitede de öyle yazılacak.

**Saha:** Kış pilotu soğuk iklimli bir bölgesel havalimanıyla iş birliğiyle yapılır.

### 4.4 Acil durum: ilk fark eden kovan

**Mimari:**
- Ticari hareket sırasında drone'lar yerde olduğu için pisti iki nöbetçi direk izler.
- YZ olayı saniyeler içinde kuleye bildirir; kule onaylarsa kovan **en yakın uygun drone'u** kaldırır (≈60 sn).
- Hedef KPI: **olaydan kule uyarısına ≤ 10 sn** (pilotta ölçülecek).
- ICAO, itfaiyenin pistin her noktasına 3 dakikada ulaşmasını hedefliyor. Biz "itfaiyeden önce ulaşırız" demiyoruz; iddiamız **ilk görmek** ve ekibe durum farkındalığı vermek.

| Senaryo | İlk tespit | Kovan ne yapar | Kime gider |
|---|---|---|---|
| İnişte fren veya motor yangını | Nöbetçi termal | Sıcak noktayı işaretler; en yakın drone havadan termal görüntü verir | Kule, itfaiye |
| Pist dışına çıkma | Nöbetçi, iz takibi | Uçağın konumu; termal kişi sayımı | Kule, itfaiye, sağlık |
| Lastik patlaması ve parçalanma | Nöbetçi | Kâşifler hareket sonrası tarama yapar; işçi parçaları toplar | Kule, saha ekibi |
| Kuş çarpması bildirimi | Pilot bildirimi | Kâşif kuş kalıntısını arar; bekçi kuş sürüsünü uzaklaştırır | Saha ekibi |
| Yakıt veya hidrolik sızıntısı | Termal ve RGB | Alanı işaretler, büyümesini izler | Apron, itfaiye |
| Çitten izinsiz giriş | Bekçi devriyesi | İzler, güvenliği yönlendirir | Güvenlik |
| İzinsiz drone | RF izleyici, Remote ID | Konum ve yön uyarısı (biz müdahale etmeyiz) | Kule, güvenlik |
| Deprem sonrası pist hasarı | Kule çağrısı | Şebeke çökse de enerji adasıyla ≈15 dk'da çatlak taraması: yardım uçakları için pistin kullanılabilirliği belgelenir | Kule, AFAD |
| Şebeke kesintisi | Enerji yönetimi | Kovan bataryayla çalışır: Çanakkale kovanında ≈1 gün, mini kovanda ≈1,5 gün | Teknik birim |
| Çevrede yangın, duman | Bekçi | Çevre izleme, görüş uyarısı | Kule |
| Gece kayıp kişi araması | Kule çağrısı | Bekçi ile termal arama | Güvenlik |
| Acil iniş beklentisi | Kule çağrısı | Pisti önceden tarar, inişten hemen sonra tekrar tarar | Kule |

### 4.5 Rüzgâr türbini ve enerji adası

**Neden dikey eksen:**
- Rüzgâr yönü değiştiğinde dönmesi gerekmez.
- Düşük devirlidir, sessizdir ve kompakttır.
- Bakım noktaları yere yakındır.

**Güç eğrisi** (temsili; kesin değerler üretici seçimine göre):
- Devreye girme ≈3 m/s, nominal güç ≈12 m/s'de 3 kW, korumaya geçiş ≈25 m/s.
- Kapasite faktörü temkinli olarak %12.

**Yerleşim:** Türbin pist şeridinin dışında ve geçiş yüzeyinin altında olmalı. Örnek hesap: pist merkezinden 250 m'de izin verilen yükseklik ≈ (250 − 140) ÷ 7 ≈ 15,7 m; türbinin toplam yüksekliği ≈9 m. Doğrulama DHMİ mânia görüşü ve radar etki analiziyle yapılır.

**Kovanın balı:**
- Güneş ve türbin LFP bataryayı doldurur; batarya bütün hücreleri besler.
- Bir sorti ≈0,04–0,05 kWh.
- Bekçi ve işçi hücreleri tüketimi artırır, özellikle iklimlendirme. Kovan boyuna göre hesap (sitedeki "Kovanını kur" ile aynı):

  | | Mini kovan (v2) | Çanakkale kovanı |
  |---|---|---|
  | Hücre | 2 | 4 |
  | Günlük tüketim | 10 kWh (2 × 100 W iklimlendirme, sunucu 150 W, iletişim 25 W, sortiler 1 kWh) | ≈16 kWh (4 × 100 W, sunucu, iletişim, 2 nöbetçi direk × 20 W varsayım, sortiler ≈1,3 kWh) |
  | Güneş | 4 kWp, ≈5.400 kWh/yıl | **6 kWp**, ≈8.100 kWh/yıl |
  | Toplam üretim | ≈8.550 kWh/yıl | ≈11.250 kWh/yıl |
  | Üretim / tasarım yükü (×1,3) | 1,8× | ≈1,5× (4 kWp ile ≈1,1× kalırdı) |
  | 20 kWh bataryayla özerklik | ≈1,5 gün | ≈1 gün |

### 4.6 Taşıma kapasitesi ve dayanıklılık

| | Kâşif / Bekçi (M3TD sınıfı) | İşçi / Bakıcı (M350 sınıfı) | Petek hücresi (Dock 2 sınıfı) |
|---|---|---|---|
| Faydalı yük | Yok (kamera entegre) | ≈2,7 kg | — |
| Koruma | IP54 (doğrulanacak) | IP55 | IP55 |
| Rüzgâr | 12 m/s operasyon, 8 m/s iniş-kalkış | 12 m/s | — |
| Sıcaklık | –20…45 °C (doğrulanacak) | –20…50 °C | –25…45 °C |
| Uçuş süresi | ≈50 dk (laboratuvar) | ≈55 dk boş; yükle daha kısa | %20 → %90 şarj 32 dk |

**Dayanıklılık test planı (pilottan önce):**
- yağmur (IP)
- 12 m/s rüzgâr
- –20 °C soğuk ve +45 °C sıcak
- titreşim
- 500 kapak çevrimi
- RF karıştırma ve EMC
- vinç ve başlık için yük testi

**Drone'un FOD'a dönüşmemesi için:** Her kalkıştan önce hücre kamerası pervaneleri ve gövdeyi kontrol eder.

### 4.7 Kovan zekâsı: planlayıcının yeni hali

- **Kast ataması:** Görevler kastlara atanır.
  - Tarama, açılış ve pist sağlığı → kâşif
  - Yaban hayatı ve çit → bekçi
  - Toplama → işçi
  - Buz haritası → bakıcı
  - Acil durum → en yakın uygun drone
- **Paralel görev:** Farklı kastlar aynı anda çalışabilir. Örneğin kâşifler pisti tararken bekçi çit boyunca devriye gezer; drone'lar bölgelere göre ayrılır.
- **Pist kullanım bandı:** Hareketin 5 dk öncesi ve sonrası **her kast için** geçerli; bu sürede hiçbir drone uçmaz.
- **Batarya ve sorti:** Her drone için ayrı izlenir. Yeni KPI'lar kast başına sorti ve kast başına doluluk.
- **Bir günü oynat:** 4 drone aynı anda görünür, dijital ikizde feromon işaretleri belirir.

---

## 5. Site V3: baştan tasarım

### 5.1 Konsept: Canlı kovan, cam katmanlar

- 3D havalimanı her zaman arkada ve canlı.
- Sayfalar onun üzerinde duran **cam (glassmorphism) paneller.**
- Sayfa değiştikçe kamera ilgili nesneye uçar.
- **Keşif modu** siteyi bir oyuna çevirir.
- **Harita yok:** 3D havalimanı yalnızca "Çanakkale Havalimanı" diye adlandırılıyor.
- **Harf tabelaları (A, B, C…) ve tek uzun sayfa düzeni kalkıyor.**

### 5.2 Görsel sistem

- **Cam:**
  - Panel zemini yarı saydam lacivert, 16–20 px bulanıklık, 1 px açık kenar çizgisi.
  - Düşük grafik kalitesinde bulanıklık kapanır.
- **Bento ızgara:** 12 sütun; bazı kutular canlı küçük görseller taşır: anlık telemetri, türbin gücü, günün planı, kovan durumu.
- **Petek motifi:** Kastların altıgen simgeleri ve kovan sayfasındaki etkileşimli petek. Motif yalnızca kovanla ilgili yerlerde, süs olarak her yere serpiştirilmeden kullanılır.
- **Kast renkleri:**
  - Kâşif mavi
  - Bekçi amber
  - İşçi yeşil
  - Bakıcı mor
  - Nöbetçi beyaz
  - Kırmızı yalnızca emniyet ve acil durum için.

  Renkler renk körlüğü testinden geçirilecek; kimliği her zaman etiket taşır.
- **Tipografi:** Barlow ailesi (Türkçe karakter desteği gömülü).
- **Hareket:** Sayfa geçişleri kamera uçuşuyla olur, gerisi ölçülü; hareket azaltma tercihi uygulanır.

### 5.3 Sayfalar

| Sayfa | İçerik | Öne çıkan etkileşim |
|---|---|---|
| **Ana sayfa** | Sinematik açılış, bento özet, giriş kutuları | Kutulardan doğrudan senaryolar |
| **Kovan** | Kastlar, petek, benzetme tablosu, ortak harita (feromon) | **Kovanını kur:** hücre ekle ya da çıkar; maliyet, tarama süresi, enerji yükü ve yetenek listesi anında güncellenir |
| **Sistem** | Mimari, petek istasyonu, enerji adası ve türbin anlatımı, yazılım | Türbin güç eğrisi, Ek 14 yerleşim görselleştirmesi |
| **Hangar** | Kâşif, bekçi, işçi, bakıcı başlığı, petek hücresi, türbin | Döndür, yakınlaştır, patlatılmış görünüm, başlık değişimi animasyonu, teknik kartlar |
| **Görevler** | 7 görev: tarama, toplama, pist sağlığı ve GRF, buz haritası, yaban hayatı, çit, acil durum | Her görevi 3D'de oynat |
| **Acil durum** | 12 senaryo | Saniye saniye oynat: nöbetçi fark eder, kule uyarılır, en yakın drone kalkar, itfaiye ilerler |
| **Operasyon merkezi** | Mevcut konsol; 4 drone, toplama, yeni arızalar | Kule onayı, nesne bırak, işçiyle topla, GNSS karıştır |
| **Planlayıcı** | Kastlara göre satırlar, paralel görevler, kış sabahı ön ayarı, günü oynat | Sürükle, geciktir, rüzgâr, Sabiha Gökçen modu |
| **Etki ve iş modeli** | Enerji, CO₂ ve kovan boyuna göre maliyet; rekabet matrisi | Kovan boyu seç |
| **Emniyet ve siber** | Kurallar, karıştırma savunması, risk matrisi, regülasyon | Karıştırıcıyı aç, konum kaynaklarının devreye girişini izle |
| **Gelişim ve yol haritası** | v1 → v2 → v3, Gantt, ekip | Sürümleri karşılaştır |
| **Sorular** | Jüri soruları; kovan, toplama, buz ve karıştırma dahil | Her cevaptan ilgili sahneye |

Varsayımlar paneli her sayfadan açılır.

### 5.4 3D oyun deneyimi

- **Keşif modu kontrolleri:**

  | Kontrol | İşlev |
  |---|---|
  | W A S D | Hareket |
  | Q / E | Alçal / yüksel |
  | Shift | Hızlı hareket |
  | Fare sürükleme | Bakış |
  | Tekerlek | Yakınlaştırma |
  | Tıklama | Seçme |
  | F | Seçilen nesneye odaklanma |
  | Esc | Çıkış |

  Telefonda sanal joystick kullanılır.
- **İnceleme:** Üzerine gelinen model kontur ışığıyla belirginleşir. Tıklanınca cam bilgi kartı açılır; karttan "Hangar'da aç" ve "Bu görevi oynat" seçilebilir.
- **Kovan görselleri:**
  - altıgen petek istasyonları
  - kast renkli drone'lar
  - dijital ikizde parlayan altıgen feromon işaretleri
  - kâşiften işçiye uzanan "sallanma dansı" bağlantı çizgisi
- **Sinematik turlar:**
  - Bir gün
  - Kış sabahı (buz haritası)
  - Toplama görevi
  - Acil durumlar
- **Model kalitesi** (kodla üretilir; dış dosya, lisans ve indirme sorunu yok):
  - Üç drone platformu ve toplama başlığı.
  - Petek hücresi ve türbinin parçaları.
  - Uçak ayrıntıları: kokpit camı, winglet.
  - Yeni araçlar: de-icing aracı, itfaiye, ambulans.
- **Efektler:**
  - parlama (bloom) ve kenar yumuşatma
  - seçim konturu
  - termal görünüm
  - uçakta buz ısı haritası
  - kırağı ve kar
  - duman ve alev
  - pervane rüzgârı
  - karıştırıcı dalgaları ve UWB işaretçileri
- **Performans:** Grafik kalite profilleri; ekran dışındayken çizim durur; telefonda sade sahne.

### 5.5 Korunan her şey (önceki plandan)

- **Operasyon ve simülasyon:**
  - operasyon merkezi ve kule onay ekranı
  - temiz pist raporu
  - arıza laboratuvarı
- **Planlayıcı:** sürükleme, gecikme, rüzgâr, Sabiha Gökçen modu ve günü oynat.
- **İçerik ve dürüstlük:**
  - dört hesap makinesi ve Varsayımlar paneli
  - "temsili simülasyon" etiketleri
  - rapordaki rakamlara bağlılık
- **Yayın ve sunum:**
  - tek dosya ve internetsiz çalışma
  - QR kod
  - sunum modu
  - stand modu
  - TR/EN
  - erişilebilirlik

### 5.6 Teknik değişiklikler

- **Yönlendirme:** Hash tabanlı sayfa sistemi; tek dosyada çalışır.
- **Motor:**
  - kamera yönetmeni
  - kontrol modları: yörünge, keşif, inceleme
  - seçim ve kontur
  - son işleme
  - senaryo sistemi
  - hava sistemi
  - termal görünüm
- **Filo:** `Mission` sınıfı N drone'a ve kastlara genelleşir. Her drone'un kendi planı, bataryası ve peteği olur. Ortak dijital ikiz işaret katmanı (feromon) eklenir.
- **Planlayıcı:** Kaynak ataması kast bazlı olur; paralel görev ve bölge ayrımı eklenir.
- **Veri:** Kovan rakamları kaynaklarıyla `facts.ts`'e; Ek 14'e göre yeni yerleşim `layout.ts`'e.

---

## 6. Fazlar

| Faz | Kapsam | Çıktı |
|---|---|---|
| **V3-1 Tasarım sistemi ve sayfalar** | Cam ve bento token'ları, yeni gezinme, yönlendirme; mevcut içerik sayfalara taşınır; harf tabelaları ve harita kalkar | Profesyonel, çok sayfalı iskelet |
| **V3-2 3D oyun motoru** | Kamera istasyonları, keşif modu (WASD), seçme ve inceleme, son işleme; Ek 14'e uygun yerleşim | Site oyun gibi hissettirir |
| **V3-3 Kovan** | 4 drone ve kastlar, petek istasyonları, feromon katmanı, kast bazlı planlayıcı, Kovanını kur hesaplayıcısı | Kovan canlı çalışır |
| **V3-4 Yeni görevler** | Toplama, buz haritası (kış sahnesi), GNSS karıştırma ve aldatma, 12 acil durum senaryosu | V3 yetenekleri oynar |
| **V3-5 Hangar ve modeller** | Ayrıntılı modeller, başlık değişimi, patlatılmış görünüm, teknik kartlar | Taşıma kapasitesi ve dayanıklılık görünür |
| **V3-6 İçerik V3** | Kovan, sistem ve türbin, görevler, acil durum, emniyet ve siber, kovan boyuna göre maliyet ve enerji, v1→v3, SSS | Bütün konular anlatılmış |
| **V3-7 Cila ve yayın** | Sunum modu, EN, telefon, performans, tek dosya, QR | Finale hazır |
| **V3-8 Rapor ve sunum V3** | Kovan mimarisi, kastlar, yeni yetenekler, maliyet, risk, KPI ve kaynakça | Belgeler siteyle aynı hikâyeyi anlatır |

**Zaman kısıtlıysa öncelik:** V3-1 → V3-2 → V3-3 → V3-4 → V3-5 → V3-6 → V3-7 → V3-8.

---

## 7. Rapor ve sunum V3

- **Rapor:**
  - Bölüm 5 "Kovan mimarisi ve kastlar" olarak yeniden yazılır.
  - Yeni bölümler: toplama, buz haritası, acil durum, sinyal karıştırma.
  - Enerji hesabı kovan boyuna göre güncellenir.
  - Maliyet kovan boylarına göre tablolanır.
  - Risk ve KPI tabloları güncellenir.
  - Kaynakçaya EASA SIB, SEI projesi ve üretici verileri eklenir.
- **Sunum:** 15 slayt korunur. Slayt 4 "Kovan: kastlar ve petek" olur; "V3 yetenekleri" ve "Acil durum ve karıştırma" için iki slayt eklenir, diğerleri sıkıştırılır.

---

## 8. Karar bekleyen noktalar

1. Final sunum tarihi ve süresi.
2. Çanakkale kovanı (2 kâşif, 1 bekçi, 1 işçi) uygun mu?
3. Rapor ve sunum da V3'e güncellensin mi?
4. Site dili: Türkçe öncelikli, İngilizce sonra mı?

---

## Kaynaklar (V3 için yapılan kontroller)

- [EASA SIB 2022-02R3: GNSS outages and alterations](https://ad.easa.europa.eu/blob/EASA_SIB_2022_02_R3.pdf/SIB_2022-02R3_1)
- [EASA: Global Navigation Satellite System outages and alterations](https://www.easa.europa.eu/en/domains/air-operations/global-navigation-satellite-system-outages-and-alterations)
- [SEI projesi: Drones 4(3):45 (MDPI, 2020)](https://www.mdpi.com/2504-446X/4/3/45)
- [ISPRS Archives XLIII-B2-2020: drone ile buz tespiti](https://isprs-archives.copernicus.org/articles/XLIII-B2-2020/183/2020/)
- [Matrice 350 RTK teknik özellikleri (satıcı sayfası; DJI resmi verisiyle doğrulanacak)](https://advexure.com/collections/dji-matrice-350-series/products/dji-matrice-350-rtk)
- [Matrice 350 RTK teknik özellikleri (Aonic)](https://aonic.com/my/products/industrial/drones-and-payloads/dji-matrice-350-rtk/)
- ICAO Ek 14 şerit genişliği (140 m) ve geçiş yüzeyi eğimi (1:7): genel bilgi; Ek 14 Cilt I'in güncel baskısından doğrulanacak.
