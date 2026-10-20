import { Fact } from '../../components/Fact'
import { getEngine } from '../../sim/engine'
import { useSim } from '../../sim/store'

/*
  Aynı iki drone, beş görev. Renkler planlayıcı satırlarıyla aynıdır (FOD mavi, çit amber, pist sağlığı mor,
  yaban hayatı yeşil); acil durum desteği planlı bir görev olmadığı için renksizdir.
*/

const openOps = () => useSim.getState().set({ opsOpen: true })
const playDay = () => {
  useSim.getState().set({ opsOpen: true })
  window.setTimeout(() => getEngine()?.playDay(300), 80)
}

export function Missions() {
  return (
    <div className="mis">
      <article className="mis__row mis__row--fod">
        <header>
          <h3>Uçuş öncesi FOD taraması</h3>
          <p className="mis__freq">her ticari hareketten önce, günde ≈5</p>
        </header>
        <div className="mis__body">
          <p>
            İki drone eş zamanlı kalkar; her biri pistin yarısını (1.175 m) <Fact id="altitude" /> irtifadan üç geçişle tarar. Tespit edilen nesneler konumu ve fotoğrafıyla kuleye ve saha ekibine
            gider; nesneyi kaldırma kararı ve işlemi insan ekibindir. Tarama bitince kuleye “temiz pist” raporu iletilir.
          </p>
          <p className="mis__note">
            Kazanç hız değil tutarlılık: araçla birkaç geçişlik denetime benzer sürede (<Fact id="scanTime" />) ama her seferinde aynı rotada, aynı çözünürlükte ve kayıt altında.
          </p>
          <button type="button" className="pbtn" onClick={openOps}>
            Operasyon merkezinde dene
          </button>
        </div>
      </article>

      <article className="mis__row mis__row--health">
        <header>
          <h3>Pist sağlığı ve GRF desteği</h3>
          <p className="mis__freq">haftada 1, uçuşsuz uzun bir boşlukta</p>
        </header>
        <div className="mis__body">
          <p>
            Drone’lar pisti 10 m irtifadan (≈1,7 mm/piksel) tarar. Görüntüler fotogrametriyle birleştirilerek pistin dijital ikizi oluşturulur; çatlak, kopma ve derz bozulmaları işaretlenip
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

      <article className="mis__row mis__row--wildlife">
        <header>
          <h3>Yaban hayatı caydırma</h3>
          <p className="mis__freq">şafakta, gün batımında ve uyarı üzerine</p>
        </header>
        <div className="mis__body">
          <p>
            Drone termal kamerayla pist çevresini tarar; kuş sürüsü veya hayvan görünce hafif hoparlör ve ışık aksesuarıyla hayvanları pistten uzaklaştırır. Yalnızca hava aracı hareketi
            olmayan pencerelerde ve kuşları yaklaşma koridorlarından uzağa yönlendiren rotalarla.
          </p>
          <p className="mis__note">
            Hareketli bir kaynak olduğu için kuşların sabit sistemlere göre daha geç alışması bekleniyor; etkinlik pilotta kuş gözlem kayıtlarıyla ölçülecek. Başvurudaki “%80 azalma” iddiası
            dayanaksız olduğu için kaldırıldı.
          </p>
        </div>
      </article>

      <article className="mis__row mis__row--fence">
        <header>
          <h3>Çevre çiti ve hayvan girişi devriyesi</h3>
          <p className="mis__freq">günde 2</p>
        </header>
        <div className="mis__body">
          <p>Drone’lar çevre çiti boyunca uçarak çitteki hasarları, açıklıkları ve sahaya giren hayvanları tespit eder. Bugün personelin araçla yaptığı devriyenin yerini alır veya onu destekler.</p>
          <button type="button" className="pbtn" onClick={playDay}>
            Bir günü 3D’de oynat
          </button>
        </div>
      </article>

      <article className="mis__row mis__row--emergency">
        <header>
          <h3>Acil durum desteği</h3>
          <p className="mis__freq">gerektiğinde, kule onayıyla</p>
        </header>
        <div className="mis__body">
          <p>Bir kaza veya acil durumda drone olay yerinin termal görüntüsünü ve konumunu kurtarma ve yangınla mücadele ekibine iletir.</p>
          <p className="mis__note">
            ICAO bu ekiplerin pistin her noktasına üç dakika içinde ulaşmasını hedeflediği için drone’un ekiplerden “daha hızlı” ulaştığını iddia etmiyoruz. Katkımız ilk dakikalarda durum
            farkındalığı.
          </p>
        </div>
      </article>
    </div>
  )
}
