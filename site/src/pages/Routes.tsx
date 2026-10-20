import type { ReactNode } from 'react'
import { Block, Page } from '../app/Page'
import { pageById } from '../app/pages'
import type { RouteId } from '../app/router'
import { Planner } from '../planner/Planner'
import { Home } from './Home'
import { HiveAnalogy, HiveCastes, HiveMind, HivePetek, HiveSizes } from '../sections/content/Hive'
import { Problem } from '../sections/content/Problem'
import { Architecture } from '../sections/content/Architecture'
import { EnergyStory } from '../sections/content/EnergyStory'
import { Site } from '../sections/content/Site'
import { Missions } from '../sections/content/Missions'
import { Pickup } from '../sections/content/Pickup'
import { IceMap } from '../sections/content/IceMap'
import { ScanCalc } from '../sections/content/ScanCalc'
import { AI } from '../sections/content/AI'
import { HangarPlatforms, HangarTests } from '../sections/content/Hangar'
import { EmergencyPrinciple, EmergencyScenarios } from '../sections/content/Emergency'
import { EnergyCalc } from '../sections/content/EnergyCalc'
import { ImpactCalc } from '../sections/content/ImpactCalc'
import { BusinessCalc } from '../sections/content/BusinessCalc'
import { Market } from '../sections/content/Market'
import { Safety } from '../sections/content/Safety'
import { Jamming } from '../sections/content/Jamming'
import { Versions } from '../sections/content/Versions'
import { Evolution } from '../sections/content/Evolution'
import { Roadmap } from '../sections/content/Roadmap'
import { Team } from '../sections/content/Team'
import { Faq } from '../sections/content/Faq'
import '../sections/content/content.css'
import '../sections/content/content2.css'
import '../sections/content/content3.css'
import '../sections/content/content4.css'

/*
  Her sayfa: başlık + cam bloklar. Blok kimlikleri pages.ts'teki bloklarla aynıdır (#/sayfa/blok).
*/

function Kovan() {
  return (
    <Page meta={pageById('kovan')}>
      <Block id="kastlar" title="Beş kast, tek kovan" lead="Her kast bir işte uzmanlaşır. Hücreye tıklayıp görevlerini, platformunu ve yuvasını görün.">
        <HiveCastes />
      </Block>
      <Block id="benzetme" title="Arı kovanından ne aldık" lead="Mentörlerimiz projeyi bir arı kovanına benzetti. Benzetmeyi süs olarak değil, mimari olarak kullandık.">
        <HiveAnalogy />
      </Block>
      <Block id="petek" title="Petek istasyonu" lead="Pistin iki ucunda altıgen hücrelerden oluşan iki petek. Her hücre bir drone yuvası.">
        <HivePetek />
      </Block>
      <Block id="boylar" title="Kovan boyları" lead="Kovan trafiğe ve iklime göre büyür; her havalimanı yalnızca ihtiyaç duyduğu hücreyi alır.">
        <HiveSizes />
      </Block>
      <Block id="zeka" title="Kovan zekâsı" lead="Görevler kastlara atanır, farklı kastlar aynı anda çalışabilir, pist kullanımdayken hiçbir drone uçmaz.">
        <HiveMind />
      </Block>
    </Page>
  )
}

function Sistem() {
  return (
    <Page meta={pageById('sistem')}>
      <Block
        id="problem"
        title="Pistteki küçük bir cisim, büyük bir maliyet"
        lead="Bir cıvata, taş ya da plastik parçası motora girdiğinde iş gecikme, iptal ve pahalı bir motor onarımına dönüşür. Bölgesel havalimanlarında denetimlerin hepsi hâlâ gözle ve araçla yapılıyor: kayıt yok, karşılaştırma yok."
      >
        <Problem />
      </Block>
      <Block
        id="mimari"
        title="Petek istasyonları, enerji adası, akıllı yazılım"
        lead="Pistin iki ucunda birer petek, güneş ve rüzgârdan beslenen bir enerji adası ve uçuş tarifesini okuyan bir yazılım katmanı. Bir bileşene tıklayın; kule onaylamadan hiçbir drone kalkmaz."
      >
        <Architecture />
      </Block>
      <Block id="enerji" title="Rüzgâr türbini ve enerji adası" lead="Kovanın balı: güneş ve küçük bir dikey eksenli türbin bataryayı doldurur, batarya bütün hücreleri besler.">
        <EnergyStory />
      </Block>
      <Block
        id="saha"
        title="Pilot saha: Çanakkale Havalimanı"
        lead="Tek pist, günde yaklaşık dört ticari hareket ve saatlerce boş kalan bir pist. Çanakkale rüzgâr kurulu gücünde Türkiye’nin önde gelen illerinden ve üniversitemize yakın."
      >
        <Site />
      </Block>
    </Page>
  )
}

function Gorevler() {
  return (
    <Page meta={pageById('gorevler')}>
      <Block id="liste" title="Yedi görev" lead="Satırın rengi görevi üstlenen kastın rengidir.">
        <Missions />
      </Block>
      <Block id="toplama" title="Nesne toplama: işçi" lead="Bulunan küçük nesneyi işçi toplar; karar operatörün, pencere kulenin.">
        <Pickup />
      </Block>
      <Block id="buz" title="Buz haritası: bakıcı" lead="De-icing geri geldi, ama yalnızca harita olarak: drone sıvı sıkmaz, ekibe nereye sıkılacağını gösterir. Önce şunu sorar: bu havada uçabilir miyim?">
        <IceMap />
      </Block>
      <Block
        id="tarama"
        title="Her uçuştan önce yaklaşık 12 dakikada temiz pist"
        lead="İki kâşif aynı anda kalkar; her biri pistin yarısını 20 m irtifadan üç geçişle tarar. Kazancımız hız değil tutarlılık: her tarama aynı rotada, aynı çözünürlükte ve kayıt altında."
      >
        <ScanCalc />
      </Block>
      <Block
        id="yz"
        title="Yapay zekâ önerir, insan karar verir"
        lead="Açık FOD-A veri setiyle başlıyor, Çanakkale pistinde kontrollü bırakılan test nesneleriyle ince ayar yapıyoruz. Operatörün her kararı yeni bir etikete dönüşür. Sistem pisti asla kendisi açmaz."
      >
        <AI />
      </Block>
    </Page>
  )
}

function Hangar() {
  return (
    <Page meta={pageById('hangar')}>
      <Block id="platformlar" title="Platformlar" lead="Referans platformlar ticari ürün sınıflarıdır; değerler üretici verisi, “doğrulanacak” yazanlar resmi veriyle kontrol edilecek.">
        <HangarPlatforms />
      </Block>
      <Block id="dayaniklilik" title="Dayanıklılık test planı" lead="Pilottan önce her platform ve petek hücresi bu testlerden geçer.">
        <HangarTests />
      </Block>
    </Page>
  )
}

function AcilDurum() {
  return (
    <Page meta={pageById('acil-durum')}>
      <Block id="ilke" title="İlk gören, ilk ulaşan değil" lead="Kovan itfaiyenin yerini almaz; ona ilk saniyelerde göz olur.">
        <EmergencyPrinciple />
      </Block>
      <Block id="senaryolar" title="12 senaryo" lead="Her senaryoda olayı kim ilk fark eder, kovan ne yapar ve bilgi kime gider. Kırmızı kenarlılar hayati olanlar.">
        <EmergencyScenarios />
      </Block>
    </Page>
  )
}

function Planlayici() {
  return (
    <Page meta={pageById('planlayici')}>
      <Block id="cizelge" title="Bir günün planı" lead="Pist sağlığı taraması ve çit devriyesi gibi uzun görevler gün içindeki boşluklara yerleşir. Rüzgâr 8 m/s’yi aşınca görev araçla denetime düşer.">
        <Planner />
      </Block>
    </Page>
  )
}

function Etki() {
  return (
    <Page meta={pageById('etki')}>
      <Block
        id="enerji"
        title="Kovan tükettiğinden fazlasını üretiyor"
        lead="Mini kovan günde yaklaşık 10 kWh tüketiyor; en büyük kalem hücrelerin iklimlendirmesi. Güneş ve rüzgâr yılda yaklaşık 8.550 kWh üretiyor. Türbinin kapasite faktörünü bilerek düşük, %12 aldık."
      >
        <EnergyCalc />
      </Block>
      <Block
        id="karbon"
        title="Gerçekçi rakam: yılda yaklaşık 10 ton CO₂, asıl kazanç dolaylı"
        lead="Başvuruda yazdığımız rakamın hesabı yoktu. Şimdi yalnızca gerçekten etkilediğimiz kalemleri hesaplıyoruz. Tek havalimanı için küçük bir rakam; bunu açıkça söylüyoruz."
      >
        <ImpactCalc />
      </Block>
      <Block
        id="maliyet"
        title="Havalimanına kurulum yükü yok: hizmet olarak drone"
        lead="Havalimanı kurulum parası ödemez, beş yıllık abonelik öder. Hesaplayıcı mini kovanı (v2) gösterir; Çanakkale kovanının ön tahmini Kovan sayfasında."
      >
        <BusinessCalc />
      </Block>
      <Block
        id="rekabet"
        title="Parçalar var, bütün yok"
        lead="Sabit FOD radarları ve kuş radarları büyük havalimanlarında sürekli izleme sağlar ama pahalı ve tek görevlidir. Dürüst sınırımız: sürekli izleme yapmıyoruz."
      >
        <Market />
      </Block>
    </Page>
  )
}

function Emniyet() {
  return (
    <Page meta={pageById('emniyet')}>
      <Block
        id="kurallar"
        title="Kurallar ve riskler"
        lead="Kule onayı olmadan kalkış yok. Sanal sınır drone’u pist şeridi içinde ve 30 m’nin altında tutar, ADS-B alıcısı yaklaşan hava aracını algılar. Arızada drone pist dışındaki acil iniş noktasına iner."
      >
        <Safety />
      </Block>
      <Block id="karistirma" title="Sinyal karıştırma ve aldatma" lead="Katmanlı savunma: önce tespit, sonra birden çok konum kaynağı, güvenli bağlantı ve prosedür.">
        <Jamming />
      </Block>
    </Page>
  )
}

function Gelisim() {
  return (
    <Page meta={pageById('gelisim')}>
      <Block id="surumler" title="v1 → v2 → V3" lead="Her sürümde ne değişti, ne kaldı.">
        <Versions />
      </Block>
      <Block
        id="ders"
        title="Mentörlerden aldığımız ders: doğru havalimanını seçmek"
        lead="Başvuruda büyük havalimanlarını hedefliyorduk. Sabiha Gökçen’de dakikada yaklaşık bir hareket var; drone’a pistte zaman kalmıyor. Soruyu tersine çevirdik: bu sistemlere erişemeyen kim?"
      >
        <Evolution />
      </Block>
      <Block
        id="yol"
        title="30 ayda Çanakkale’den 3–5 bölgesel havalimanına"
        lead="İlk üç ayda FOD-A ile eğitilmiş YOLO demosu ve görev planlayıcı simülasyonu. İzin sürecine ilk ayda başlıyoruz; ilk uçuşlar uçuşsuz saatlerde apron ve taksi yolunda."
      >
        <Roadmap />
      </Block>
      <Block
        id="ekip"
        title="Ekip"
        lead="Çanakkale Onsekiz Mart Üniversitesi Bilgisayar Mühendisliği öğrencileriyiz. Pahalı sistemlere erişemeyen bölgesel havalimanları için kendi enerjisini üreten otonom denetim geliştiriyoruz."
      >
        <Team />
      </Block>
    </Page>
  )
}

function Sorular() {
  return (
    <Page meta={pageById('sorular')}>
      <Block id="sss" title="Kısa cevaplar" lead="Bir soruyu açın; çoğunun altında ilgili sahneye giden bir düğme var.">
        <Faq />
      </Block>
    </Page>
  )
}

const VIEWS: Record<RouteId, () => ReactNode> = {
  home: Home,
  kovan: Kovan,
  sistem: Sistem,
  gorevler: Gorevler,
  hangar: Hangar,
  'acil-durum': AcilDurum,
  planlayici: Planlayici,
  etki: Etki,
  emniyet: Emniyet,
  gelisim: Gelisim,
  sorular: Sorular,
}

export function RouteView({ id }: { id: RouteId }) {
  const View = VIEWS[id]
  return <View />
}
