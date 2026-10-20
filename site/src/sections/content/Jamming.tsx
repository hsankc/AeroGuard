import { Fact } from '../../components/Fact'

/*
  Sinyal karıştırma ve aldatma: katmanlı savunma (V3 "güvenli konum").
  Biz karıştırıcı kullanmayız; yalnızca tespit eder ve dayanıklı kalırız.
*/

const LAYERS = [
  {
    t: 'Uçuştan önce tespit',
    d: 'Peteklerdeki RF ve GNSS bütünlük izleyici sinyal gücü düşüşüne, ani konum veya saat sıçramasına ve sahte uydu imzasına bakar. Sorun varsa ön kontrolde “RF/GNSS bütünlüğü” kırmızı yanar ve hiçbir drone kalkmaz.',
  },
  {
    t: 'Birden çok konum kaynağı',
    d: 'Çok bantlı GNSS (L1/L5, dört takımyıldız), havalimanındaki sabit RTK baz istasyonu, pist işaretlerinden görsel konum, pist kenarındaki ≈40 UWB işaretçisi ve IMU. Bütünlük denetleyici kaynakları karşılaştırır; tutarsız olanı dışarıda bırakır. Aldatma bu yolla yakalanır.',
  },
  {
    t: 'Güvenli komuta bağlantısı',
    d: 'Ana bağlantı frekans atlamalı ve şifreli, yedek bağlantı özel LTE/5G. Bağlantı kesilirse önceden yüklenmiş otonom eve dönüş; konum da yoksa drone IMU ve görsel konumla en yakın acil iniş noktasına iner.',
  },
  {
    t: 'Prosedür ve koordinasyon',
    d: 'Frekanslar BTK ile, karşı-İHA sistemleri sivil–askeri ortak kullanım nedeniyle askeri birimle koordine edilir; drone’larımız “dost” listesindedir.',
  },
]

export function Jamming() {
  return (
    <div className="jam">
      <p className="jam__why">
        Neden önemli: EASA’nın GNSS kesintileri bülteni <Fact id="gnssRisk" /> bölgesini karıştırma ve aldatmanın belirgin arttığı yerler arasında sayıyor. Çanakkale sivil–askeri ortak
        kullanımlı; sahada askeri karşı-İHA sistemleri bulunabilir.
      </p>
      <ol className="jam__layers">
        {LAYERS.map((l, i) => (
          <li key={l.t} className="glass glass--soft">
            <span className="jam__n num">{i + 1}</span>
            <div>
              <h3>{l.t}</h3>
              <p>{l.d}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className="jam__no">
        <b>Karıştırıcı kullanmıyoruz.</b> Bu yasal değil; kovan yalnızca tespit eder ve dayanıklı kalır. Karıştırmayı canlı görmek için operasyon merkezine “GNSS karıştırma” arızası
        eklenecek.
      </p>
    </div>
  )
}
