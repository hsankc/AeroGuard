import { Fact } from '../../components/Fact'

/*
  FOD toplama (İşçi). Akış V3 planı 4.1'den. İnsan kararı ve kule onayı olmadan toplama yok.
*/

const STEPS = [
  { t: 'Bildirim', d: 'Kâşif nesneyi bulur; RTK konumu, fotoğraf, sınıf ve tahmini boyut kovana gider. Nesne dijital ikize işaret olarak düşer: kovanın sallanma dansı.' },
  { t: 'İnsan kararı', d: 'Operatör “İşçi ile topla” der. Kule, pist kullanımda değilken pencereyi onaylar.' },
  { t: 'Konumlanma', d: 'İşçi kalkar ve nesnenin 4 m üstünde asılı kalır. Yere inmez: pervane rüzgârı hafif nesneyi savurmaz, drone piste değmez.' },
  { t: 'Alma', d: 'Vinç başlığı kabloyla indirir. Metalde elektro-kalıcı mıknatıs (güç kesilse de tutar, yalnızca komutla bırakır), metal olmayanda normalde kapalı yumuşak kıskaç.' },
  { t: 'Teslim', d: 'Nesne Petek B’deki FOD kutusuna bırakılır. Sınıf, ağırlık, konum ve saat kayda geçer; FOD kaynağı analizine girdi olur.' },
  { t: 'Doğrulama', d: 'Kâşif bölgeyi kısa bir taramayla “temizlendi” diye işaretler; işaret dijital ikizden silinir.' },
]

export function Pickup() {
  return (
    <div className="pick">
      <ol className="pick__steps">
        {STEPS.map((s, i) => (
          <li key={s.t} className="glass glass--soft">
            <span className="pick__n num">{i + 1}</span>
            <h3>{s.t}</h3>
            <p>{s.d}</p>
          </li>
        ))}
      </ol>
      <div className="bento">
        <div className="tile tile--w4 glass glass--soft">
          <span className="tile__label">Toplanabilen</span>
          <span className="tile__value">
            <Fact id="pickupLimit" />
          </span>
          <span className="tile__text">ve ≤ 30 cm. Azami faydalı yük ≈2,7 kg; vinç ve başlık ≈1,2 kg; %33 güvenlik payı.</span>
        </div>
        <div className="tile tile--w4 glass glass--soft">
          <span className="tile__label">Saha ekibine kalan</span>
          <span className="tile__text">Islak ya da yapışık nesneler, sıvılar, büyük keskin parçalar ve hayvan kalıntıları. Kovan bunları yalnızca işaretler.</span>
        </div>
        <div className="tile tile--w4 glass glass--soft">
          <span className="tile__label">Koşul</span>
          <span className="tile__text">Rüzgâr ≤ 8 m/s ve pist kullanımda değil. Kablo salınımı nedeniyle toplama sırasında hız sınırlı.</span>
        </div>
      </div>
      <p className="hangar__note">Yeni KPI’lar pilotta ölçülecek: tespitten temizliğe geçen süre ve ≤ 1 kg nesnelerde toplama başarı oranı. 3D’de toplama görevi bir sonraki sürümde oynatılabilecek.</p>
    </div>
  )
}
