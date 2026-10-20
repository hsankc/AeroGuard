import type { ReactNode } from 'react'
import { usePlanner } from '../../planner/store'
import { WIND_PRESETS } from '../../planner/plan'
import { useSim } from '../../sim/store'

/*
  Jüri soruları: kısa cevap + canlı gösterim. Cevaplar rapor ve konuşmacı notlarından.
*/

const openOps = () => useSim.getState().set({ opsOpen: true })
const goPlanner = (setup?: () => void) => {
  setup?.()
  document.getElementById('planner')?.scrollIntoView({ behavior: 'smooth' })
}

const QA: { q: string; a: ReactNode; action?: { label: string; run: () => void } }[] = [
  {
    q: 'Drone düşerse kendisi pistte FOD olmaz mı?',
    a: 'Dört önlem var. Kule onaylamadan kalkış yok. Güç veya iletişim kaybında drone pist dışındaki acil iniş noktasına iner ve indiği yer otomatik olarak FOD diye kuleye bildirilir. RTK ve görsel konumlama birlikte kullanılır. İki drone istasyona döndüğü doğrulanmadan temiz pist raporu üretilmez.',
    action: { label: 'Arıza laboratuvarında göster', run: openOps },
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
    a: 'Görüntüler havalimanı dışına çıkmaz: işleme ve depolama havalimanı içindeki kenar sunucuda yapılır, görüntüleme alanı pist şeridiyle sınırlanır, iletişim şifrelidir ve kule ekranına yalnızca iç ağdan erişilir.',
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
    a: 'Kurulum parası ödemeden: hizmet olarak drone modelinde havalimanı beş yıllık sözleşmeyle yıllık abonelik öder. Kurulum ve işletme beş yıla yayıldığında maliyet yaklaşık 39 bin $/yıl; abonelik fiyatı pilot sonrası netleşecek.',
  },
  {
    q: 'İzin çıkmazsa?',
    a: 'En uzun süreç izin olduğu için ona ilk ayda başlıyoruz (İP3). Sınırlı pilotu uçuşsuz saatlerde apron ve taksi yolunda yapıyoruz; görüş hattı ötesi izin alınana kadar sahada bir uzaktan pilot gözetimde.',
  },
  {
    q: 'De-icing neden projeden çıktı?',
    a: 'Buzlanma koşullarında küçük drone’lar uçamıyor; buz kontrolü yasal olarak ekip ve kaptanın sorumluluğunda; Çanakkale’de de ihtiyaç nadir. Gerçekçi olmayan bir modülü taşımak yerine çıkardık.',
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
