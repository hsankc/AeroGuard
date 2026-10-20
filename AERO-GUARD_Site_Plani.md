# AERO-GUARD İnteraktif Site — Uygulama Planı

> Kaynaklar: `AERO-GUARD_Genisletilmis_Proje_Raporu` (final), `AERO-GUARD_Final_Sunumu.pptx` (15 slayt + konuşmacı notları), `AERO-GUARD (1).pdf` (ilk başvuru).
> Hazırlanma: 16 Ekim 2026

---

## 0. Temel ilke: Site final sürümü anlatır

İlk başvuru (İstanbul, 50+ drone'luk sürü, de-icing, radar emici kaplama, %73 / %99 / %80, yılda 15–25 bin ton CO₂) ile final sürüm (Çanakkale, 2 istasyon, 2 drone, varsayımları açık rakamlar) birbirinden çok farklı.
Jürinin ve mentörlerin final sürümde takdir edeceği şey **dürüstlük ve gerçekçilik**. Bu yüzden:

- Sitedeki her rakam final rapordan gelir ve yanında varsayımı yazar (ⓘ ipucu + "Varsayımlar" paneli).
- Başvuruda olup finalde çıkarılan iddialar (de-icing, glikol, RAM kaplama, türbin tepesinde şarj, %80, 15–25 bin ton) **sadece** "Başvurudan Finale" bölümünde, üstü çizili olarak ve neden çıkarıldıklarıyla birlikte yer alır.
- Tüm 3D / canlı akışlar köşede **"Simülasyon · temsili veri"** etiketi taşır. Henüz eğitilmiş model veya pilot verisi yok; olmayan bir şeyi var gibi göstermeyiz.
- Tek doğruluk kaynağı: Tüm rakamlar `src/data/facts.ts` dosyasında (değer + birim + varsayım + kaynak no). Metin, hesap makineleri ve Varsayımlar paneli hep buradan okur, böylece hiçbir yerde rakamlar birbirini tutmazlık yapmaz.

---

## 1. Hedef: Siteyle neyi kazanacağız?

| Jüri sorusu | Sitedeki cevabı |
|---|---|
| "Gerçekten çalışır mı?" | 3D dijital ikizde uçtan uca FOD görevi: kule onayı → kalkış → tarama → tespit → temiz pist raporu |
| "Drone ile uçak çakışmaz mı?" | Tarifeye duyarlı planlayıcı: uçuşu sürükle, gecikme ekle, görevler otomatik kayar |
| "Neden büyük havalimanı değil?" | Planlayıcıda "Sabiha Gökçen modu": dakikada 1 hareket → hiç boş pencere kalmaz |
| "Drone düşerse kendisi FOD olmaz mı?" | Arıza Laboratuvarı: arıza ver, drone pist dışı acil iniş noktasına iner, konumu otomatik FOD olarak işaretlenir |
| "Rakamlar nereden?" | Her hesap makinesi rapordaki rakamı varsayılan değerlerle aynen yeniden üretir; jüri kaydırıcıyla kendisi değiştirebilir |
| "Enerji gerçekten yetiyor mu?" | Enerji adası hesaplayıcısı: 1,8× üretim, 1,5 gün özerklik, ≈21.000 km fazla enerji |
| "Para kim öder?" | Hizmet olarak drone (DaaS) hesaplayıcısı: ≈39 bin $/yıl |

**Canlı demo senaryosu (finalde ≈3 dk):**
1. Siteyi aç → hero'da pistin üzerinden şafak uçuşu.
2. "Operasyon Merkezi"ne geç → planlayıcı 08:55 kalkışı için 08:40 FOD taramasını göstermiş.
3. "Kule onayı iste" → jüriden birine **Onayla** tıklat.
4. İki drone kalkar, kamera akışında "cıvata · %94" kutusu çıkar → saha ekibine bildirim.
5. Drone'lar iner → ≈2 dk içinde **Temiz Pist Raporu** açılır (yazdırılabilir).
6. "ADS-B uyarısı" arızası ver → drone'lar görevi keser, eve döner.
7. Planlayıcıda "Sabiha Gökçen modu" → hiç pencere yok → "işte bu yüzden bölgesel havalimanı".

---

## 2. Teknoloji kararı

| Konu | Karar | Neden |
|---|---|---|
| Altyapı | **Vite + TypeScript + React** | Ekibin tanıdığı yapı; çok sayıda etkileşimli panel (hesap makinesi, planlayıcı, modallar) için uygun |
| 3D | **Three.js** (React'ten bağımsız, imperatif motor sınıfı) | Tam kontrol, performans; drone/istasyon/türbin modelleri kodla üretilir (lisans sorunu yok, dosya boyutu küçük) |
| Animasyon | **GSAP + ScrollTrigger** | Kaydırmaya bağlı kamera hareketleri ve sayaçlar |
| Durum | **Zustand** | Planlayıcı, 3D ikiz ve UI aynı görev durumunu paylaşır |
| Grafikler | Elle yazılmış SVG (Gantt, enerji çubukları) | Kütüphane gereksiz; sunumdaki görsellerle birebir aynı stil |
| Yazı tipleri | Inter + JetBrains Mono (gömülü) | Sunumla aynı tipografi; internetsiz çalışır |
| Çıktı | **Tek dosya `index.html`** (vite-plugin-singlefile) | İnternet olmadan USB'den / dizüstünden açılır; aynı dosya her yere yüklenebilir |
| Yayın | 1) claude.ai Artifact linki (anında, özel, paylaşılabilir) · 2) İsterseniz GitHub Pages / Netlify ile kalıcı adres | Jüriye QR kodla link; salonda internet olmasa da yerel dosya |
| Sürüm takibi | Bu klasörde git deposu | Her fazın geri alınabilir olması |

**Görsel kimlik:** Sunum ve rapordaki renk dili korunur, böylece sunum, rapor ve site tek bir marka gibi görünür.
- Lacivert `#0F1E33` (karar / kule) · Mavi `#1478C8` (istasyonlar, Drone 2) · Yeşil `#3E9B37` (enerji, Drone 1) · Amber (çit devriyesi) · Mor (pist sağlığı) · Kırmızı (acil iniş noktaları)
- Koyu "operasyon merkezi" teması (logo da koyu zeminde), okuma ağırlıklı bölümlerde açık kartlar. Projektörde okunabilirlik için yüksek kontrast modu.

---

## 3. Site haritası (tek sayfa, kaydırmalı hikâye + tam ekran Operasyon Merkezi)

| # | Bölüm | Sunum slaytı | İçerik ve etkileşim |
|---|---|---|---|
| 0 | **Hero** | 1 | Gece→şafak geçişinde Çanakkale pisti üzerinden 3D uçuş, logo, "Her uçuştan önce, doğrulanmış temiz pist." Akan KPI şeridi: ≈12 dk · 1,8× · ≈10 t · ≈124 bin $ · 30 ay |
| 1 | **Problem** | 2 | 13,9 milyar $ ve 250 bin $ animasyonlu sayaçlar; dönen 3D FOD nesneleri (cıvata, taş, plastik, lastik parçası); yaban hayatı ve pist yüzeyi kartları; kaynak: ACRP Synthesis 26 |
| 2 | **Başvurudan Finale** | 3 | Aç/kapa anahtarı: Sabiha Gökçen (28 milyon yolcu, dakikada ≈1 hareket) ↔ Çanakkale (71 bin, günde ≈4). Trafik nokta animasyonu, "≈400×" ölçek; Tablo 1'deki 8 değişiklik kart olarak döner; çıkarılan maddeler üstü çizilerek düşer. *Mentörü dinlediğinizi gösteren en güçlü bölüm.* |
| 3 | **Pilot saha: Çanakkale** | — | Stilize harita (Boğaz, şehir, havalimanı), pist 04/22 · 2.350 × 45 m, 192.434 yolcu (2025), sivil–askeri, rüzgârda Türkiye 3.'sü (976 MW) |
| 4 | **Sistem Mimarisi** | 4 | Etkileşimli şema: Enerji Adası → Kovan İstasyonları → Yazılım ve Karar → Çıktılar. Kablolarda akan güç/veri parçacıkları; bir kutuya tıklayınca 3D sahnede o parça vurgulanır |
| 5 | **⭐ Operasyon Merkezi (3D Dijital İkiz)** | 5, 7, 12 | Sitenin kalbi. Ayrıntısı Bölüm 4'te |
| 6 | **Tarifeye Duyarlı Planlayıcı** | 7 | 24 saatlik etkileşimli Gantt. Ayrıntısı Bölüm 5'te |
| 7 | **Tarama Hesaplayıcı** | 5 | İrtifa, görüş açısı, bindirme, hız kaydırıcıları → iz genişliği, mm/piksel, geçiş sayısı, 3 cm'lik nesnenin piksel sayısı, süre, enerji. Varsayılanlar raporu aynen verir: 20 m → 28 m iz, 3,5 mm/piksel, 3 geçiş, 8–9 piksel, ≈12 dk |
| 8 | **Görev Modülleri** | 6 | 5 kart, her biri mini sahne: FOD · Pist sağlığı + GRF · Yaban hayatı · Çit devriyesi · Acil durum. Tıklayınca 3D ikizde o görev oynar |
| 9 | **Yapay Zekâ** | 8 | 4 adımlı akış (FOD-A ön eğitim → yerel veri → aktif öğrenme → insan onayı). Mini oyun: jüri tespitleri onaylar/reddeder, her karar "yeni etiket" olarak modele döner. Pilot KPI hedefleri tablosu |
| 10 | **Enerji Adası** | 9 | Hesaplayıcı (GES kWp, türbin kW, kapasite faktörü, tüketim kalemleri, %30 pay, batarya) → 8.550 / 4.745 kWh = 1,8×, 1,5 gün, ≈21.000 km. Rüzgâr kaydırıcısıyla türbin hızı değişir; güneş/rüzgâr→batarya→istasyon enerji akışı animasyonu |
| 11 | **Sürdürülebilirlik** | 10 | CO₂ dökümü (2,0 + 1,3 + 5,0 + 1,6 ≈ 10 t); "havalimanı sayısı" kaydırıcısı (20 → ≈200 t); dolaylı etkiler; 4 hackathon teması rozeti |
| 12 | **Rekabet** | 11 | Etkileşimli karşılaştırma matrisi (FODRAD, A-FOD, Xsight, Tarsier, KUŞRAD, Robin, Cranfield, manuel); "dürüst sınır: sürekli izleme yapmıyoruz" notu |
| 13 | **Emniyet ve Regülasyon** | 12 | 4 kural, arıza senaryoları (Arıza Laboratuvarı'na bağlantı), regülasyon rozetleri: ICAO Ek 14, GRF, SHT-İHA, DHMİ mânia, JARUS SORA, EU 2019/947 |
| 14 | **İş Modeli** | 13 | Maliyet kalemleri (Tablo 8) + DaaS hesaplayıcısı: sözleşme yılı, havalimanı sayısı → ≈39 bin $/yıl; 2. havalimanında 90 bin $ |
| 15 | **Yol Haritası** | 14 | Kaydırınca çizilen Gantt: İP1–İP7, 4 faz, kilometre taşları (Demo · İlk pilot raporu · KPI doğrulama · 3–5 havalimanı) |
| 16 | **Jüri Soruları (SSS)** | — | "Drone düşerse?", "Askeri alan?", "Rüzgâr?", "Neden sürekli izleme değil?", "Kuşlar drone'a alışmaz mı?", "İzin çıkmazsa?". Her cevap ilgili etkileşime atlar |
| 17 | **Ekip ve Kapanış** | 15 | 4 kişi, ÇOMÜ, TEKNOFEST 2026 Sağlıkta YZ finali notu; QR kod; rapor ve sunum PDF indirme |
| — | **Varsayımlar paneli** | — | Her yerden açılan çekmece: sitedeki tüm rakamlar, varsayımları ve kaynak numaraları [1]–[16] |

---

## 4. Operasyon Merkezi: 3D Dijital İkiz (ayrıntı)

### 4.1 Sahne (gerçek metre ölçeğinde, kodla üretilmiş modeller)
- **Pist:** 2.350 × 45 m beton, iki yanda 7,5 m omuz; eşik "piyano tuşları", "04" ve "22" yazıları, merkez hattı, kenar ışıkları (gece parlar), PAPI ışıkları.
- **Çevre:** taksi yolu, apron, küçük terminal, **kule** (onay ekranı buraya bağlı), çevre çiti, rüzgâr tulumu (rüzgâr hızına göre şişer), çim, uzakta Boğaz ve şehir ışıkları (stilize).
- **İstasyon A (04 ucu, yeşil) ve İstasyon B (22 ucu, mavi):** kapağı açılan/kapanan drone kutusu, şarj göstergesi.
- **Enerji adası:** GES dizisi, dönen dikey eksenli (helisel) türbin, batarya konteyneri, kenar sunucu kabini, kesikli çizgiyle şebeke yedeği.
- **Drone'lar:** dört pervaneli, gimbal kameralı, yeşil/kırmızı seyir ışıkları yanıp söner; altlarında kameranın gördüğü alan konisi; geçtikleri şerit yerde "tarandı" olarak dolar (kapsama yüzdesi).
- **Diğer:** A320 benzeri uçak (yaklaşma, iniş, kalkış), kuş sürüsü (sürü davranışı), çitten giren tilki, FOD nesneleri, 6 kırmızı acil iniş noktası, pist şeridi üzerinde 30 m tavanlı yarı saydam **sanal sınır** kutusu.
- **Işık:** saat kaydırıcısına bağlı güneş konumu (Çanakkale için gerçek gün doğumu/batımı hesabı), gece ışıklandırması, parlama efekti.

### 4.2 Kamera modları
Genel bakış · Drone 1'i takip · Drone 2'yi takip · **Drone kamerası** · Kule görünümü.

### 4.3 Canlı panel
- **Telemetri:** batarya %, irtifa, hız, mm/piksel, kapsama %, geçiş no.
- **Kamera akışı (resim içinde resim):** drone kamerasından ayrı render; FOD nesnelerinin üzerine YOLO tarzı kutular ve güven oranları ("cıvata 0,94"). Konum: "04 eşiğinden 812 m, merkez hattın 6 m solu".
- **Olay günlüğü:** zaman damgalı satırlar (kule onayı, kalkış, tespit, saha ekibine bildirim, iniş, rapor).
- **Termal görünüm anahtarı:** yaban hayatı ve acil durum için yanlış renk görüntü.

### 4.4 Görev durum makinesi (planlayıcı ve 3D aynı mantığı kullanır)
```
PLANLANDI → KULE ONAYI BEKLENİYOR → ÖN KONTROL (rüzgâr ≤ 8 m/s, yağış, ADS-B temiz, batarya)
 → KALKIŞ → TARAMA (3 geçiş × 1.175 m) → [TESPİT → kuleye + saha ekibine]
 → EVE DÖNÜŞ → İNİŞ/ŞARJ → İKİ DRONE DA İSTASYONDA MI? → TEMİZ PİST RAPORU (≤ 2 dk)
Kesintiler:
 Kule iptali ............ → eve dönüş
 ADS-B uyarısı .......... → görev durur, eve dönüş
 Sanal sınır aşımı ...... → otomatik eve dönüş
 Güç/iletişim kaybı ..... → en yakın pist dışı acil iniş noktası + konum otomatik FOD + rapor üretilmez
 Rüzgâr > 8 m/s ......... → görev başlamaz → "araçla denetim" uyarısı
```

### 4.5 Kule Onay Ekranı
Ayrı modal; kule arayüzü gibi tasarlanır: görev özeti, pencere süresi, hava durumu, "Onayla / Reddet / Geri Çağır" düğmeleri. Kural ekranda yazar: "Kule onaylamadan kalkış yok." Bunu sahnede jüriden birine tıklatmak etkili olur.

### 4.6 Temiz Pist Raporu
Yazdırılabilir belge: görev no, saat, drone'lar, kapsama, tespit listesi (3D'den alınmış küçük görüntüler + pist koordinatları), "Rapor kuleye bilgi olarak iletildi; karar kule ve saha ekibinindir." Yazdır / PDF olarak kaydet.

### 4.7 Arıza Laboratuvarı
Düğmeler: Batarya/iletişim kaybı · ADS-B: yaklaşan uçak · Sanal sınır aşımı · Rüzgâr 10 m/s · Kule iptali. Her biri durum makinesinin ilgili yolunu 3D'de canlı oynatır.

---

## 5. Tarifeye Duyarlı Planlayıcı (gerçek algoritma, sahte animasyon değil)

**Girdi:** uçuş hareketleri (saat, geliş/kalkış), saatlik rüzgâr tahmini, tarih (gün doğumu/batımı otomatik hesaplanır).
**Kurallar (rapordan):**
- Her ticari hareketten ≈15 dk önce FOD taraması; pencere hareketten en az 5 dk önce kapanır.
- Açılış taraması 06:00.
- Çit devriyesi günde 2, en uzun boşluklara.
- Pist sağlığı haftada 1, en uzun uçuşsuz boşluğa (10 m irtifa).
- Yaban hayatı devriyesi şafakta, gün batımında ve uyarı üzerine.
- Şarj kısıtı: %20→%90 = 32 dk; drone başına günde ≈9–10 sorti.
- Rüzgâr > 8 m/s olan saatlerde görev "araçla denetim" olarak işaretlenir.

**Etkileşimler:**
- Uçuş işaretini sürükle → görevler yeniden yerleşir.
- "Gecikme ekle (+25 dk)" → *gerçekleşen saate* göre tarama otomatik kayar.
- Saatlik rüzgâr kaydırıcıları → iptal edilen görevler ve gerçekleşme oranı (KPI ≥ %85).
- **"Sabiha Gökçen modu"** → dakikada 1 hareket, ekranda tek bir boş pencere kalmaz.
- **"Bu günü oynat"** → 3D ikiz günü 60×–600× hızda oynatır: güneş hareket eder, uçaklar iner/kalkar, drone'lar plana göre çıkar.
- Gün özeti: sorti/drone, enerji tüketimi (kWh), gerçekleşme oranı.

---

## 6. Hesap makineleri: varsayılanlar rapordaki rakamları aynen vermeli

| Hesaplayıcı | Formül özeti | Varsayılan sonuç (rapor) |
|---|---|---|
| Tarama | iz = 2·h·tan(HFOV/2); mm/piksel = iz / 8000 px; geçiş = ⌈60 / (iz·(1−bindirme))⌉; yol = geçiş·1.175 m + dönüşler; süre = yol / hız + kalkış/iniş | 28 m · 3,5 mm/piksel · 3 geçiş · ≈3,8 km · ≈12 dk |
| Enerji | GES = kWp·1.350; türbin = kW·8.760·CF; yük = Σtüketim·1,3; özerklik = batarya / günlük yük; fazla km = (üretim − yük) / 0,18 | 8.550 kWh · 4.745 kWh · 1,8× · 1,5 gün · ≈21.000 km |
| CO₂ | denetim aracı + çit aracı + EV ikamesi + şebeke ikamesi | 2,0 + 1,3 + 5,0 + 1,6 ≈ 10 t/yıl; 20 havalimanı ≈ 200 t |
| DaaS | (kurulum + yıllık işletme·yıl) / yıl | (124k + 14k·5) / 5 ≈ 39 bin $/yıl; 2. havalimanı (90k + 70k) / 5 = 32 bin $/yıl |

Her hesaplayıcıda "Formülü göster" ve "Rapordaki değerlere sıfırla" düğmeleri olacak.

---

## 7. Aklınıza gelmemiş olabilecek detaylar

1. **İnternetsiz çalışma:** Salon wifi'ı çökerse site yine açılır (tek HTML dosyası, USB ve dizüstünde yedek).
2. **QR kod:** Sitede ve sunumun son slaytında; jüri kendi telefonundan inceler. Mobil görünüm buna göre tasarlanır.
3. **Sunum modu (`P` tuşu):** Site 15 slaytlık akışla bölüm bölüm ilerler (← →). İsterseniz pptx yerine doğrudan site sunulur. İkinci pencerede konuşmacı notları ve süre sayacı (notlarınızdaki ≈30–50 sn süreleri) gösterilir.
4. **Stand modu:** 60 sn dokunulmazsa site kendi kendine "günü oynat" moduna geçer; fuar/stand ekranı için.
5. **Kalite ayarı:** Zayıf dizüstü için Düşük/Orta/Yüksek grafik ayarı, ekran dışındaysa 3D durur, WebGL yoksa sabit görsellere düşer.
6. **TR / EN dil anahtarı:** Hackathon adı İngilizce; uluslararası jüri üyesi olursa diye.
7. **Hareket azaltma ve klavye erişimi:** `prefers-reduced-motion` desteği, tüm düğmeler klavyeyle kullanılabilir.
8. **Gizlilik:** Ekip e-postaları herkese açık sitede varsayılan olarak **gösterilmez** (spam riski); tek bir iletişim adresi veya form yeterli. Siz isterseniz eklenir.
9. **"Simülasyon" etiketi:** Jüri "bu gerçek veri mi?" diye sorarsa cevap ekranda yazıyor; dürüstlük temasıyla tutarlı.
10. **Gelecekte gerçek model:** Yol haritasındaki 0–3. ay YOLO demosu hazır olunca, ONNX Runtime Web ile tarayıcıda gerçek tespit çalıştırılabilecek şekilde kamera akışı modülü ayrı tutulur.

---

## 8. Uygulama fazları

| Faz | Kapsam | Çıktı |
|---|---|---|
| **1. İskelet** | Vite + React + TS kurulumu, git, tasarım token'ları, yazı tipleri, `facts.ts` (tüm rakamlar), bölüm iskeleti, gezinme, TR/EN altyapısı | Tüm bölümleri boş da olsa gezilebilen site |
| **2. 3D Dijital İkiz** | Sahne, pist, istasyonlar, enerji adası, drone'lar, FOD görevi uçtan uca, kule onayı, kamera akışı, olay günlüğü, rapor | **Demo anı hazır** (en kritik faz) |
| **3. Planlayıcı** | Algoritma, Gantt, sürükle-bırak, gecikme, rüzgâr, Sabiha Gökçen modu, "günü oynat" ile 3D bağlantısı | Tarifeye duyarlılık kanıtı |
| **4. İçerik + hesap makineleri** | Problem, Başvurudan Finale, Çanakkale, mimari, YZ, enerji, CO₂, rekabet, emniyet, iş modeli, yol haritası, SSS, ekip, Varsayımlar paneli | Hikâye tamamlanır |
| **5. Diğer görevler + Arıza Lab.** | Yaban hayatı (termal + kuş sürüsü), çit devriyesi (tilki), pist sağlığı (çatlak haritası + GRF üçte birler), acil durum, arıza enjeksiyonu | 5 görevin hepsi 3D'de oynar |
| **6. Cila ve yayın** | Sunum modu, stand modu, EN çeviri, mobil, performans, tek dosya derleme, QR, 1920×1080 projektör testi, Artifact / GitHub Pages yayını | Finale hazır site |

Öncelik sırası (zaman kısıtlıysa): **2 → 3 → 4 → 6 → 5**. Faz 2 ve 3 tek başına bile jüriye canlı demo yaptırır.

---

## 9. Ekipten gerekenler

- Final sunum tarihi ve formatı (canlı demo serbest mi, kaç dakika?).
- Ekip rolleri (kim YZ, kim yazılım vb.) ve isterseniz fotoğraflar; belgelerde rol bilgisi yok, uydurmayacağız.
- Yayın tercihi: claude.ai linki yeterli mi, yoksa kalıcı bir adres (örn. GitHub Pages) mı istiyorsunuz?
- Sitede iletişim bilgisi olarak hangi e-posta görünsün?
