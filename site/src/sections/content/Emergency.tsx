import { Fact } from '../../components/Fact'
import { openScene } from '../../emergency/actions'
import type { SceneId } from '../../sim/scenario'

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
  { scene: 'fire' as SceneId, name: 'İnişte fren veya motor yangını', first: 'Nöbetçi termal', action: 'Sıcak noktayı işaretler; en yakın drone havadan termal görüntü verir', to: 'Kule, itfaiye', critical: true },
  { scene: 'excursion' as SceneId, name: 'Pist dışına çıkma', first: 'Nöbetçi, iz takibi', action: 'Uçağın konumu; termal kişi sayımı', to: 'Kule, itfaiye, sağlık', critical: true },
  { scene: 'tire' as SceneId, name: 'Lastik patlaması ve parçalanma', first: 'Nöbetçi', action: 'Kâşifler hareket sonrası tarama yapar, işçi parçaları toplar', to: 'Kule, saha ekibi' },
  { scene: 'bird' as SceneId, name: 'Kuş çarpması bildirimi', first: 'Pilot bildirimi', action: 'Kâşif kalıntıyı arar, bekçi sürüyü uzaklaştırır', to: 'Saha ekibi' },
  { scene: 'leak' as SceneId, name: 'Yakıt veya hidrolik sızıntısı', first: 'Termal ve RGB', action: 'Alanı işaretler, büyümesini izler', to: 'Apron, itfaiye', critical: true },
  { scene: 'intrusion' as SceneId, name: 'Çitten izinsiz giriş', first: 'Bekçi devriyesi', action: 'İzler, güvenliği yönlendirir', to: 'Güvenlik' },
  { scene: 'rogue' as SceneId, name: 'İzinsiz drone', first: 'RF izleyici, Remote ID', action: 'Konum ve yön uyarısı; müdahale etmeyiz', to: 'Kule, güvenlik' },
  { scene: 'quake' as SceneId, name: 'Deprem sonrası pist hasarı', first: 'Kule çağrısı', action: 'Şebeke çökse de enerji adasıyla ≈15 dk’da çatlak taraması: yardım uçakları için pistin kullanılabilirliği belgelenir', to: 'Kule, AFAD', critical: true },
  { scene: 'grid' as SceneId, name: 'Şebeke kesintisi', first: 'Enerji yönetimi', action: 'Kovan bataryayla çalışmayı sürdürür: Çanakkale kovanında ≈1 gün, mini kovanda ≈1,5 gün', to: 'Teknik birim' },
  { scene: 'smoke' as SceneId, name: 'Çevrede yangın ve duman', first: 'Bekçi', action: 'Çevre izleme, görüş uyarısı', to: 'Kule' },
  { scene: 'search' as SceneId, name: 'Gece kayıp kişi araması', first: 'Kule çağrısı', action: 'Bekçi ile termal arama', to: 'Güvenlik' },
  { scene: 'landing' as SceneId, name: 'Acil iniş beklentisi', first: 'Kule çağrısı', action: 'Pisti önceden tarar, inişten hemen sonra tekrar tarar', to: 'Kule' },
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
            <button type="button" className="pbtn emer__play" onClick={() => openScene(s.scene)}>
              3D’de saniye saniye oynat
            </button>
          </li>
        ))}
      </ul>
      <p className="hangar__note">
        Oynatıcıdaki süreler temsilidir: nöbetçi uyarısı için hedef ≤ 10 sn, kule onayından sonra en yakın drone ≈1 dk, itfaiye için ICAO hedefi 3 dk. İletişim kaybı, ADS-B, GNSS karıştırma ve aldatma
        operasyon merkezindeki arıza laboratuvarında da denenebilir.
      </p>
    </div>
  )
}
