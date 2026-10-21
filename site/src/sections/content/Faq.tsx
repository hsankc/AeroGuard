import type { ReactNode } from 'react'
import { usePlanner } from '../../planner/store'
import { WIND_PRESETS } from '../../planner/plan'
import { useSim } from '../../sim/store'
import { navigate, type RouteId } from '../../app/router'

/*
  Jüri soruları: kısa cevap + canlı gösterim. Cevaplar rapor, konuşmacı notları ve V3 planından.
*/

const openOps = () => useSim.getState().set({ opsOpen: true })
const goPlanner = (setup?: () => void) => {
  setup?.()
  navigate('planlayici')
}
const go = (id: RouteId, block?: string) => () => navigate(id, block)

const QA: { q: string; a: ReactNode; action?: { label: string; run: () => void } }[] = [
  {
    q: 'Drone düşerse kendisi pistte FOD olmaz mı?',
    a: 'Dört önlem var. Kule onaylamadan kalkış yok. Güç veya iletişim kaybında drone pist dışındaki acil iniş noktasına iner ve indiği yer otomatik olarak FOD diye kuleye bildirilir. RTK, UWB ve görsel konumlama birlikte kullanılır. Kâşifler peteğe döndüğü doğrulanmadan temiz pist raporu üretilmez.',
    action: { label: 'Arıza laboratuvarında göster', run: openOps },
  },
  {
    q: 'Kovanın kraliçesi kim?',
    a: 'Kraliçe yok. Gerçek kovanda da merkezi bir emir veren yoktur. Bizde emniyet için merkezi bir planlayıcı ve kule onayı var; drone’lar engelden kaçınma ve arıza anında güvenli davranma konusunda kendi başına karar verir. Kovanın kararını kule ve insan verir.',
    action: { label: 'Kovan benzetmesini gör', run: go('kovan', 'benzetme') },
  },
  {
    q: 'Sinyal karıştırılır ya da GPS aldatılırsa?',
    a: 'Peteklerdeki RF ve GNSS izleyici sorunu uçuştan önce görür ve hiçbir drone kalkmaz. Havadayken konum beş kaynaktan gelir (çok bantlı GNSS, RTK baz, görsel konum, UWB işaretçileri, IMU); tutarsız kaynak dışarıda bırakılır. Bağlantı kesilirse drone otonom olarak eve döner. Karıştırıcı kullanmıyoruz; bu yasal değil.',
    action: { label: 'Katmanlı savunmayı gör', run: go('emniyet', 'karistirma') },
  },
  {
    q: 'İşçi nesneyi toplarken düşürürse ya da kendisi düşerse?',
    a: 'Toplama yalnızca operatör “topla” deyip kule pencereyi onayladığında ve pist kullanımda değilken yapılır. İşçi yere inmez, nesnenin 4 m üstünde asılı kalır. Elektro-kalıcı mıknatıs güç kesilse bile nesneyi tutar, yalnızca komutla bırakır. Arızada diğer drone’lar gibi pist dışındaki acil iniş noktasına iner ve indiği yer kuleye FOD olarak bildirilir.',
    action: { label: 'Toplama adımlarını gör', run: go('gorevler', 'toplama') },
  },
  {
    q: 'De-icing projeden çıkmamış mıydı?',
    a: 'Drone ile sıvı püskürtme çıktı ve geri gelmiyor. V3’te yalnızca bakıcı rolüyle buz haritası var: drone park eden uçaktaki kırağıyı haritalar, de-icing ekibine nereye sıkılacağını gösterir. Karar kaptan ve ekibindedir; olgunluk TRL 3–4, glikol tasarrufu için rakam vermiyoruz.',
    action: { label: 'Buz haritasını aç', run: go('gorevler', 'buz') },
  },
  {
    q: 'Buzlanmada drone uçmaz demiştiniz. Buz haritası nasıl uçuyor?',
    a: 'Yalnızca kırağı senaryosunda: açık ve sakin bir kış sabahında park eden uçakta kırağı oluşur ama havada aşırı soğumuş damlacık yoktur, drone’da buzlanma beklenmez. METAR’da dondurucu sis, çisenti, yağmur, kar veya buz taneleri varsa uçmaz; –20 °C altında ve 8 m/s üstü rüzgârda da uçmaz. Uçağın üzerinden asla geçmez.',
    action: { label: 'Uçabilir mi, deneyin', run: go('gorevler', 'buz') },
  },
  {
    q: 'Acil durumu kim ilk fark ediyor?',
    a: 'Uçak hareket ederken drone’lar yerdedir; pisti iki nöbetçi direk kamerası izler. Hedef, olaydan kule uyarısına 10 saniyenin altı (pilotta ölçülecek). İtfaiyeden önce ulaştığımızı iddia etmiyoruz; iddiamız ilk görmek ve ekibe durum farkındalığı vermek.',
    action: { label: '12 senaryoyu gör', run: go('acil-durum', 'senaryolar') },
  },
  {
    q: 'Neden büyük havalimanlarında değil?',
    a: 'Sabiha Gökçen’de dakikada yaklaşık bir hareket var; uçuş öncesi tarama için gereken 18 dakikalık boşluk hiç oluşmuyor. Üstelik büyük havalimanlarında bu iş için sabit sistemler (FODRAD gibi) zaten kurulu. Biz bu sistemlere erişemeyen bölgesel havalimanlarını hedefliyoruz.',
    action: { label: 'Sabiha Gökçen modunu aç', run: () => goPlanner(() => usePlanner.getState().setAirport('saw')) },
  },
  {
    q: 'Sürekli izleme yapmıyorsunuz. Bu yeterli mi?',
    a: 'Günde birkaç hareketin olduğu bir pistte pist saatlerce kullanılmıyor. Her hareketten hemen önce yapılan doğrulanmış tarama, pistin uçak tarafından kullanıldığı anlar için aynı güvenceyi çok daha düşük maliyetle veriyor. Bu sınırımızı gizlemiyoruz.',
  },
  {
    q: 'Rüzgârlı günlerde ne olacak?',
    a: 'Rüzgâr istasyonun iniş-kalkış sınırı olan 8 m/s’yi aşarsa görev başlamaz; denetim bugünkü gibi araçla yapılır. Planlanan taramaların gerçekleşme oranını pilotta KPI olarak izliyoruz (hedef ≥ %85).',
    action: { label: 'Fırtınalı bir sabahı planlayıcıda gör', run: () => goPlanner(() => usePlanner.getState().setWindAll(WIND_PRESETS[2].wind(), 'morning')) },
  },
  {
    q: 'Sivil–askeri havalimanında görüntüler nasıl korunuyor?',
    a: 'Görüntüler havalimanı dışına çıkmaz: işleme ve depolama havalimanı içindeki kenar sunucuda yapılır, görüntüleme alanı havalimanı içindeki görev alanlarıyla sınırlanır, iletişim şifrelidir ve kule ekranına yalnızca iç ağdan erişilir.',
  },
  {
    q: 'Yapay zekâ bir nesneyi kaçırırsa?',
    a: 'Sistem pisti hiçbir zaman kendiliğinden açmaz; rapor kuleye bilgi olarak gider, karar insandadır. Pilot boyunca araçla denetim paralel sürer, model yerel veriyle ince ayarlanır ve operatörün her kararı yeni bir etiket olarak geri döner.',
  },
  {
    q: 'Kuşlar drone’a da alışmaz mı?',
    a: 'Drone hareketli bir kaynak olduğu için kuşların sabit sistemlere göre daha geç alışmasını bekliyoruz, ama bunu iddia olarak değil hipotez olarak koyuyoruz: etkinlik pilotta kuş gözlem kayıtlarıyla ölçülecek. Başvurudaki “%80 azalma” rakamını dayanaksız olduğu için kaldırdık.',
  },
  {
    q: 'Bölgesel bir havalimanı bunu nasıl finanse edecek?',
    a: 'Kurulum parası ödemeden: hizmet olarak drone modelinde havalimanı beş yıllık sözleşmeyle yıllık abonelik öder. Kurulum ve işletme beş yıla yayıldığında maliyet mini kovanda yaklaşık 39 bin $/yıl, önerilen Çanakkale kovanında ≈63 bin $/yıl (ön tahmin); abonelik fiyatı pilot sonrası netleşecek.',
  },
  {
    q: 'İzin çıkmazsa?',
    a: 'En uzun süreç izin olduğu için ona ilk ayda başlıyoruz (İP3). Sınırlı pilotu uçuşsuz saatlerde apron ve taksi yolunda yapıyoruz; görüş hattı ötesi izin alınana kadar sahada bir uzaktan pilot gözetimde.',
  },
  {
    q: 'Neden yer robotu değil de drone?',
    a: 'Yer robotu pist yüzeyini işgal eder ve yavaş ilerler; drone 20 m’den piste değmeden ≈12 dakikada tarar, aynı gövde çit devriyesi ve yaban hayatı caydırmada da kullanılır. Toplama için yer robotu iyi bir alternatif; mimari donanımdan bağımsız olduğu için ileride işçi kastına eklenebilir.',
  },
]

export function Faq() {
  return (
    <div className="faq">
      {QA.map((x) => (
        <details key={x.q} className="faq__item">
          <summary>{x.q}</summary>
          <div className="faq__a">
            <p>{x.a}</p>
            {x.action && (
              <button type="button" className="pbtn" onClick={x.action.run}>
                {x.action.label}
              </button>
            )}
          </div>
        </details>
      ))}
    </div>
  )
}
