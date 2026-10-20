import { Fact } from '../../components/Fact'
import { BirdIcon, BoltIcon, CrackIcon } from './icons'

export function Problem() {
  return (
    <div className="prob">
      <div className="prob__fig">
        <p className="prob__big">
          <Fact id="fodCostTotal" />
        </p>
        <p className="prob__cap">FOD ve kuş çarpmalarının dünya genelinde yıllık toplam maliyeti: gecikme, iptal, motor onarımı.</p>
        <dl className="prob__sub">
          <div>
            <dt>yıllık doğrudan maliyet</dt>
            <dd>
              <Fact id="fodCostDirect" />
            </dd>
          </div>
          <div>
            <dt>ABD’de her 10.000 harekette havayolunun FOD kaynaklı bakım maliyeti</dt>
            <dd>
              <Fact id="fodCostPer10k" />
            </dd>
          </div>
        </dl>
        <p className="prob__src">ACRP Synthesis 26 (2011), McCreary (2010) tahminleri</p>
      </div>

      <ul className="prob__risks">
        <li>
          <BoltIcon />
          <div>
            <h3>Yabancı madde (FOD)</h3>
            <p>
              Pist, taksi yolu ve aprondaki cıvata, lastik parçası, taş, plastik ya da hayvan kalıntısı. Motora girdiğinde maliyetin büyük kısmı dolaylıdır. Bir motor onarımı, yeni parça üretimi ve
              lojistik nedeniyle karbon açısından da ağır bir yüktür.
            </p>
          </div>
        </li>
        <li>
          <BirdIcon />
          <div>
            <h3>Yaban hayatı</h3>
            <p>
              Sabit ses topları ve hoparlörlerin etkisi zamanla azalır, çünkü kuşlar tekrarlı uyarana alışır. Bölgesel havalimanlarında kontrol çoğunlukla personelin araçla devriyesine dayanır;
              çitten giren köpek ve tilki ayrı bir risktir.
            </p>
          </div>
        </li>
        <li>
          <CrackIcon />
          <div>
            <h3>Pist yüzeyi ve raporlama</h3>
            <p>
              Çatlak, kopma ve derz bozulmaları hem FOD üretir hem de geç fark edilirse karbon yoğun kapsamlı yenilemeye dönüşür. ICAO’nun 2021’den beri uyguladığı Küresel Raporlama Formatı
              (GRF), pistin her üçte biri için kirletici türü, kaplama oranı ve derinliği ister; bugün bu değerlendirme büyük ölçüde gözle yapılıyor.
            </p>
          </div>
        </li>
      </ul>

      <div className="prob__gap">
        <div>
          <h3>Büyük havalimanlarında</h3>
          <p>
            Sabit sistemler kurulu: DHMİ ile TÜBİTAK BİLGEM’in geliştirdiği FOD radarı FODRAD Antalya’da, kuş radarı KUŞRAD 2017’de Atatürk Havalimanı’nda, A-FOD Gazipaşa-Alanya’da. Sürekli izleme
            sağlarlar ama pist boyunca altyapı ve inşaat gerektirirler.
          </p>
        </div>
        <div>
          <h3>Bölgesel havalimanlarında</h3>
          <p>
            FOD, pist ve çit kontrolleri hâlâ personelin araçla yaptığı görsel denetime dayanıyor. İnsan dikkatine bağlı, küçük nesneleri kaçırabilir ve karşılaştırılabilir kayıt üretmez.
            AERO-GUARD bu boşluğu hedefliyor.
          </p>
        </div>
      </div>
    </div>
  )
}
