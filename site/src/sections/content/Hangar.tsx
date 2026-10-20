import { Fact } from '../../components/Fact'

/*
  Hangar: platformların teknik kartları ve dayanıklılık test planı.
  Değerler üretici verisidir ("sınıfı" ifadesiyle referans platform); "doğrulanacak" yazanlar resmi veriyle kontrol edilecek.
*/

const PLATFORMS = [
  {
    name: 'Kâşif ve bekçi',
    ref: 'Matrice 3TD sınıfı',
    color: 'var(--caste-scout)',
    rows: [
      ['Görev', 'Tarama, pist sağlığı, yaban hayatı, çit'],
      ['Faydalı yük', 'Yok, kamera entegre'],
      ['Kamera', '48 MP geniş açı + 640 × 512 termal'],
      ['Koruma', 'IP54 (doğrulanacak)'],
      ['Rüzgâr', '12 m/s operasyon, 8 m/s iniş-kalkış'],
      ['Sıcaklık', '–20…45 °C (doğrulanacak)'],
      ['Uçuş süresi', '≈50 dk (laboratuvar koşulu)'],
    ],
  },
  {
    name: 'İşçi ve bakıcı',
    ref: 'Matrice 350 RTK sınıfı',
    color: 'var(--caste-worker)',
    rows: [
      ['Görev', 'Nesne toplama, buz haritası, acil durum'],
      ['Faydalı yük', '≈2,7 kg'],
      ['Toplama başlığı', 'Vinç + EPM mıknatıs veya kıskaç, ≈1,2 kg'],
      ['Koruma', 'IP55'],
      ['Rüzgâr', '12 m/s'],
      ['Sıcaklık', '–20…50 °C'],
      ['Uçuş süresi', '≈55 dk boş; yükle daha kısa'],
    ],
  },
  {
    name: 'Petek hücresi',
    ref: 'Dock 2 sınıfı otomatik istasyon',
    color: 'var(--honey)',
    rows: [
      ['Görev', 'Drone’u korur, iniş ve şarj'],
      ['Koruma', 'IP55'],
      ['Sıcaklık', '–25…45 °C'],
      ['Şarj', '%20 → %90, 32 dk'],
      ['Enerji', 'İklimlendirme ≈100 W, en büyük tüketim kalemi'],
      ['Büyüme', 'Petek başına 6 hücreye kadar'],
    ],
  },
]

export function HangarPlatforms() {
  return (
    <div className="hangar">
      <div className="bento">
        {PLATFORMS.map((p) => (
          <article key={p.name} className="tile tile--w4 glass glass--soft hangar__card" style={{ ['--c' as string]: p.color }}>
            <span className="tile__label">{p.ref}</span>
            <h3 className="tile__title">{p.name}</h3>
            <dl>
              {p.rows.map(([k, v]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
          </article>
        ))}
      </div>
      <div className="hangar__payload glass glass--soft">
        <div>
          <span className="tile__label">İşçinin yük bütçesi</span>
          <p>
            Azami faydalı yük <Fact id="workerPayload" />. Vinç ve başlık ≈1,2 kg tuttuğu için nesneye ≈1,5 kg kalır; %33 güvenlik payıyla toplama sınırı <Fact id="pickupLimit" />.
          </p>
        </div>
        <div className="hangar__bar" aria-hidden="true">
          <span style={{ width: `${(1.2 / 2.7) * 100}%` }} className="is-head">
            başlık 1,2
          </span>
          <span style={{ width: `${(1 / 2.7) * 100}%` }} className="is-obj">
            nesne 1,0
          </span>
          <span style={{ width: `${(0.5 / 2.7) * 100}%` }} className="is-margin">
            pay
          </span>
        </div>
      </div>
      <p className="hangar__note">
        Mimari donanımdan bağımsızdır; yerli muadiller değerlendirmeye açık. Modelleri döndürüp parçalarına ayırabileceğiniz 3D hangar bu sayfaya eklenecek.
      </p>
    </div>
  )
}

const TESTS = [
  ['Yağmur', 'IP sınıfına göre yağmur testi; kapak ve sızdırmazlık'],
  ['Rüzgâr', '12 m/s operasyon ve 8 m/s iniş-kalkış sınırlarının sahada doğrulanması'],
  ['Sıcaklık', '–20 °C soğuk ve +45 °C sıcak çalışma; batarya ön ısıtma'],
  ['Titreşim', 'Gövde, gimbal ve vinç bağlantıları'],
  ['Kapak çevrimi', '500 açma-kapama çevrimi'],
  ['RF ve EMC', 'Sinyal karıştırma ve elektromanyetik uyumluluk; konum kaynaklarına geçiş'],
  ['Yük testi', 'Vinç, EPM mıknatıs ve kıskacın tutma ve bırakma güvenilirliği'],
]

export function HangarTests() {
  return (
    <div className="hangar-tests">
      <dl>
        {TESTS.map(([k, v]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
      <p className="hangar__note">Testler pilottan önce yapılacak. Her kalkıştan önce hücre kamerası pervaneleri ve gövdeyi otomatik olarak kontrol eder.</p>
    </div>
  )
}
