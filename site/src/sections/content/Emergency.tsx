import { Fact } from '../../components/Fact'

/*
  Acil durum: "ilk fark eden kovan". Drone'lar uçak hareketi sırasında yerdedir; pisti nöbetçi kameralar izler.
  ICAO itfaiyenin pistin her noktasına 3 dakikada ulaşmasını hedefler; biz "daha hızlı ulaşırız" demiyoruz.
*/

export function EmergencyPrinciple() {
  return (
    <div className="bento">
      <div className="tile tile--w4 glass glass--soft">
        <span className="tile__label">Fark etme</span>
        <span className="tile__value">
          <Fact id="sentinelKpi" />
        </span>
        <span className="tile__text">Olaydan kule uyarısına hedef. Nöbetçi kameralar her iniş-kalkışta pisti izler, YZ olayı işaretler.</span>
      </div>
      <div className="tile tile--w4 glass glass--soft">
        <span className="tile__label">Kalkış</span>
        <span className="tile__value">≈60 sn</span>
        <span className="tile__text">Kule onaylarsa kovan en yakın uygun drone’u kaldırır: kapak açılır, drone olay yerine yönelir.</span>
      </div>
      <div className="tile tile--w4 glass glass--soft">
        <span className="tile__label">Dürüst sınır</span>
        <span className="tile__value">3 dk</span>
        <span className="tile__text">ICAO itfaiyenin pistin her noktasına bu sürede ulaşmasını hedefler. Biz “ilk ulaşan” değil, “ilk gören” oluyoruz: ekibe durum farkındalığı.</span>
      </div>
    </div>
  )
}

const SCENARIOS = [
  { name: 'İnişte fren veya motor yangını', first: 'Nöbetçi termal', action: 'Sıcak noktayı işaretler; en yakın drone havadan termal görüntü verir', to: 'Kule, itfaiye', critical: true },
  { name: 'Pist dışına çıkma', first: 'Nöbetçi, iz takibi', action: 'Uçağın konumu; termal kişi sayımı', to: 'Kule, itfaiye, sağlık', critical: true },
  { name: 'Lastik patlaması ve parçalanma', first: 'Nöbetçi', action: 'Kâşifler hareket sonrası tarama yapar, işçi parçaları toplar', to: 'Kule, saha ekibi' },
  { name: 'Kuş çarpması bildirimi', first: 'Pilot bildirimi', action: 'Kâşif kalıntıyı arar, bekçi sürüyü uzaklaştırır', to: 'Saha ekibi' },
  { name: 'Yakıt veya hidrolik sızıntısı', first: 'Termal ve RGB', action: 'Alanı işaretler, büyümesini izler', to: 'Apron, itfaiye', critical: true },
  { name: 'Çitten izinsiz giriş', first: 'Bekçi devriyesi', action: 'İzler, güvenliği yönlendirir', to: 'Güvenlik' },
  { name: 'İzinsiz drone', first: 'RF izleyici, Remote ID', action: 'Konum ve yön uyarısı; müdahale etmeyiz', to: 'Kule, güvenlik' },
  { name: 'Deprem sonrası pist hasarı', first: 'Kule çağrısı', action: 'Şebeke çökse de enerji adasıyla ≈15 dk’da çatlak taraması: yardım uçakları için pistin kullanılabilirliği belgelenir', to: 'Kule, AFAD', critical: true },
  { name: 'Şebeke kesintisi', first: 'Enerji yönetimi', action: 'Kovan ≈1,5 gün bataryayla çalışmayı sürdürür', to: 'Teknik birim' },
  { name: 'Çevrede yangın ve duman', first: 'Bekçi', action: 'Çevre izleme, görüş uyarısı', to: 'Kule' },
  { name: 'Gece kayıp kişi araması', first: 'Kule çağrısı', action: 'Bekçi ile termal arama', to: 'Güvenlik' },
  { name: 'Acil iniş beklentisi', first: 'Kule çağrısı', action: 'Pisti önceden tarar, inişten hemen sonra tekrar tarar', to: 'Kule' },
]

export function EmergencyScenarios() {
  return (
    <div className="emer">
      <ul className="emer__grid">
        {SCENARIOS.map((s) => (
          <li key={s.name} className={`glass glass--soft ${s.critical ? 'is-critical' : ''}`}>
            <h3>{s.name}</h3>
            <dl>
              <div>
                <dt>İlk tespit</dt>
                <dd>{s.first}</dd>
              </div>
              <div>
                <dt>Kovan ne yapar</dt>
                <dd>{s.action}</dd>
              </div>
              <div>
                <dt>Kime gider</dt>
                <dd>{s.to}</dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>
      <p className="hangar__note">Senaryoları saniye saniye 3D’de oynatma bu sayfaya eklenecek. Bugün iletişim kaybı ve ADS-B uyarısı operasyon merkezindeki arıza laboratuvarında denenebilir.</p>
    </div>
  )
}
