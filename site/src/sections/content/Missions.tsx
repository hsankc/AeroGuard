import { Fact } from '../../components/Fact'
import { href } from '../../app/router'
import { getEngine } from '../../sim/engine'
import { useSim } from '../../sim/store'

/*
  Yedi görev, tek kovan. Her satırın rengi görevi üstlenen kastın rengidir; kast adı da etiket olarak yazılır.
*/

const openOps = () => useSim.getState().set({ opsOpen: true })
const playDay = () => {
  useSim.getState().set({ opsOpen: true })
  window.setTimeout(() => getEngine()?.playDay(300), 80)
}

function Caste({ id, children }: { id: 'scout' | 'guard' | 'worker' | 'nurse' | 'sentinel'; children: string }) {
  return <span className={`mis__caste mis__caste--${id}`}>{children}</span>
}

export function Missions() {
  return (
    <div className="mis">
      <article className="mis__row mis__row--scout">
        <header>
          <Caste id="scout">Kâşif × 2</Caste>
          <h3>Uçuş öncesi FOD taraması</h3>
          <p className="mis__freq">her ticari hareketten önce, günde ≈4; sabah açılış taraması ayrıca</p>
        </header>
        <div className="mis__body">
          <p>
            İki kâşif eş zamanlı kalkar; her biri pistin yarısını (1.175 m) <Fact id="altitude" /> irtifadan üç geçişle tarar. Tespit edilen nesneler konumu ve fotoğrafıyla kuleye ve saha ekibine
            gider. Tarama bitince kuleye “temiz pist” raporu iletilir.
          </p>
          <p className="mis__note">
            Kazanç hız değil tutarlılık: araçla birkaç geçişlik denetime benzer sürede (<Fact id="scanTime" />) ama her seferinde aynı rotada, aynı çözünürlükte ve kayıt altında.
          </p>
          <button type="button" className="pbtn" onClick={openOps}>
            Operasyon merkezinde dene
          </button>
        </div>
      </article>

      <article className="mis__row mis__row--worker">
        <header>
          <Caste id="worker">İşçi × 1</Caste>
          <h3>Nesne toplama</h3>
          <p className="mis__freq">tespit edilince, operatör ve kule onayıyla</p>
        </header>
        <div className="mis__body">
          <p>
            İşçi nesnenin 4 m üstünde asılı kalır, vinçle indirdiği mıknatıs veya kıskaçla nesneyi alır ve Petek B’deki FOD kutusuna taşır. Toplama sınırı <Fact id="pickupLimit" /> ve 30 cm;
            daha büyük, ıslak ya da yapışık nesneler saha ekibinde kalır.
          </p>
          <a className="pbtn" href={href('gorevler', 'toplama')}>
            Toplama adımlarını gör
          </a>
        </div>
      </article>

      <article className="mis__row mis__row--scout">
        <header>
          <Caste id="scout">Kâşif</Caste>
          <h3>Pist sağlığı ve GRF desteği</h3>
          <p className="mis__freq">haftada 1, uçuşsuz uzun bir boşlukta</p>
        </header>
        <div className="mis__body">
          <p>
            Kâşifler pisti 10 m irtifadan (≈1,7 mm/piksel) tarar. Görüntüler fotogrametriyle birleştirilerek pistin dijital ikizi oluşturulur; çatlak, kopma ve derz bozulmaları işaretlenip
            haftadan haftaya karşılaştırılır. Küçük bir çatlağın büyümesi erken fark edilirse düşük maliyetli bir müdahale büyük onarımı geciktirebilir.
          </p>
          <div className="mis__thirds" aria-label="GRF: pist üçte birleri">
            {['Pistin ilk üçte biri', 'Orta üçte bir', 'Son üçte bir'].map((t) => (
              <span key={t}>{t}</span>
            ))}
          </div>
          <p className="mis__note">
            Yağışlı veya kirli pistte görüntüler, her üçte bir için kirletici türü ve kaplama oranının değerlendirilmesine destek verir. GRF pist durum kodunu belirlemek eğitimli personelin
            sorumluluğunda kalır; sistem ona kayıtlı, görsel bir kanıt sunar.
          </p>
        </div>
      </article>

      <article className="mis__row mis__row--nurse">
        <header>
          <Caste id="nurse">Bakıcı (işçinin rolü)</Caste>
          <h3>Buz haritası</h3>
          <p className="mis__freq">kış sabahı, kırağı koşulunda</p>
        </header>
        <div className="mis__body">
          <p>
            Park eden uçağın kanat, stabilizör ve gövde üstündeki kırağıyı haritalar; de-icing ekibine nereye sıvı sıkılacağını gösterir. Kendisi sıvı sıkmaz. Dondurucu yağış veya sis varsa
            uçmaz, uçağın üzerinden asla geçmez.
          </p>
          <p className="mis__note">
            Olgunluk <Fact id="iceTrl" />; glikol tasarrufu için rakam vermiyoruz, pilotta ölçülecek.
          </p>
          <a className="pbtn" href={href('gorevler', 'buz')}>
            Uçabilir mi, deneyin
          </a>
        </div>
      </article>

      <article className="mis__row mis__row--guard">
        <header>
          <Caste id="guard">Bekçi × 1</Caste>
          <h3>Yaban hayatı caydırma</h3>
          <p className="mis__freq">şafakta, gün batımında ve uyarı üzerine</p>
        </header>
        <div className="mis__body">
          <p>
            Bekçi termal kamerayla pist çevresini tarar; kuş sürüsü veya hayvan görünce hafif hoparlör ve ışık aksesuarıyla hayvanları pistten uzaklaştırır. Yalnızca hava aracı hareketi olmayan
            pencerelerde ve kuşları yaklaşma koridorlarından uzağa yönlendiren rotalarla.
          </p>
          <p className="mis__note">
            Hareketli bir kaynak olduğu için kuşların sabit sistemlere göre daha geç alışması bekleniyor; etkinlik pilotta kuş gözlem kayıtlarıyla ölçülecek. Başvurudaki “%80 azalma” iddiası
            dayanaksız olduğu için kaldırıldı.
          </p>
        </div>
      </article>

      <article className="mis__row mis__row--guard">
        <header>
          <Caste id="guard">Bekçi</Caste>
          <h3>Çevre çiti ve hayvan girişi devriyesi</h3>
          <p className="mis__freq">günde 2</p>
        </header>
        <div className="mis__body">
          <p>
            Bekçi çevre çiti boyunca uçarak çitteki hasarları, açıklıkları ve sahaya giren hayvanları tespit eder. Kâşifler pisti tararken aynı anda çalışabilir. Bugün personelin araçla yaptığı
            devriyenin yerini alır veya onu destekler.
          </p>
          <button type="button" className="pbtn" onClick={playDay}>
            Bir günü 3D’de oynat
          </button>
        </div>
      </article>

      <article className="mis__row mis__row--sentinel">
        <header>
          <Caste id="sentinel">Nöbetçi × 2 direk</Caste>
          <h3>Acil durum</h3>
          <p className="mis__freq">her iniş-kalkışta izler, gerektiğinde kule onayıyla</p>
        </header>
        <div className="mis__body">
          <p>
            Nöbetçi kameralar olayı fark eder ve <Fact id="sentinelKpi" /> içinde kuleye bildirir; kule onaylarsa kovan en yakın uygun drone’u kaldırır ve olay yerinin termal görüntüsünü
            kurtarma ve yangınla mücadele ekibine iletir.
          </p>
          <p className="mis__note">
            ICAO bu ekiplerin pistin her noktasına üç dakika içinde ulaşmasını hedeflediği için drone’un ekiplerden “daha hızlı” ulaştığını iddia etmiyoruz. Katkımız ilk görmek ve ilk dakikalarda
            durum farkındalığı.
          </p>
          <a className="pbtn" href={href('acil-durum')}>
            12 senaryoyu gör
          </a>
        </div>
      </article>
    </div>
  )
}
