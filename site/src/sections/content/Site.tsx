import { Fact } from '../../components/Fact'
import { openExplore } from '../../explore/actions'

/*
  Pilot saha: Çanakkale Havalimanı. Harita yok; saha 3D dijital ikizde gösterilir.
*/

const explore = () => openExplore({ focus: 'runway' })

export function Site() {
  return (
    <div className="site">
      <div className="site__data">
        <h3 className="site__data-title">
          <span className="sign-loc">LTBH</span> Çanakkale Havalimanı
        </h3>
        <dl className="aip">
          <div>
            <dt>Pist</dt>
            <dd>
              <Fact id="runway" />, beton
            </dd>
          </div>
          <div>
            <dt>Yolcu (2025)</dt>
            <dd>
              <Fact id="passengers2025" />
            </dd>
          </div>
          <div>
            <dt>Yolcu (Ocak–Temmuz 2026)</dt>
            <dd>
              <Fact id="passengersCkz2026" />
            </dd>
          </div>
          <div>
            <dt>Düzenli hat</dt>
            <dd>AJet, Ankara</dd>
          </div>
          <div>
            <dt>Ticari hareket</dt>
            <dd>
              günde <Fact id="dailyMovements" />
            </dd>
          </div>
          <div>
            <dt>Statü</dt>
            <dd>Sivil–askeri ortak kullanım</dd>
          </div>
          <div>
            <dt>Terminal kapasitesi</dt>
            <dd>
              <Fact id="terminalCapacity" />
            </dd>
          </div>
          <div>
            <dt>İl rüzgâr kurulu gücü</dt>
            <dd>
              <Fact id="windRank" />, Türkiye’de 3.
            </dd>
          </div>
        </dl>
      </div>

      <div className="site__side">
        <ul className="site__why">
          <li>
            <b>Trafik çok düşük.</b> Sabiha Gökçen’in yaklaşık 1/400’ü ölçeğinde; uçuşlar arasında drone’lar kule onaylı güvenli pencerelerde çalışabilir.
          </li>
          <li>
            <b>Rüzgâr var.</b> Çanakkale rüzgâr kurulu gücünde Türkiye’nin önde gelen illerinden; sahada rüzgâr üretimi anlamlı.
          </li>
          <li>
            <b>Üniversitemize yakın.</b> Saha ziyareti, veri toplama ve paydaşlarla düzenli iletişim kolay.
          </li>
          <li>
            <b>Sivil–askeri kullanım.</b> Görüntüler buluta gönderilmez; işleme ve depolama havalimanı içindeki kenar sunucuda yapılır.
          </li>
        </ul>
        <button type="button" className="pbtn" onClick={explore}>
          Pisti 3D dijital ikizde gez
        </button>
      </div>
    </div>
  )
}
