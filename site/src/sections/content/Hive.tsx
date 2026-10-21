import { useState } from 'react'
import { Fact } from '../../components/Fact'
import { href } from '../../app/router'
import { CASTES, HiveMini, type CasteId } from '../../pages/HiveMini'

/*
  Kovan sayfası içerikleri (V3). Rakamlar V3 planındaki ön tahminlerdir; Varsayımlar panelinde kaynaklarıyla.
*/

const DETAIL: Record<CasteId, { tasks: string[]; platform: string; payload: string; home: string; note: string }> = {
  scout: {
    tasks: ['Uçuş öncesi FOD taraması', 'Açılış taraması', 'Pist sağlığı ve GRF desteği', 'Hareket sonrası tarama (lastik patlaması gibi)'],
    platform: 'M3TD sınıfı, petekte otomatik iniş ve şarj',
    payload: '48 MP geniş açı + 640 × 512 termal kamera, entegre',
    home: 'Petek A ve Petek B (birer kâşif)',
    note: 'İki kâşif pistin birer yarısını aynı yönde, aralarında hep 1.175 m mesafeyle tarar; tam tarama ≈12 dk.',
  },
  guard: {
    tasks: ['Yaban hayatı caydırma (şafak, gün batımı, uyarıda)', 'Çevre çiti devriyesi', 'İzinsiz giriş takibi', 'Gece termal arama'],
    platform: 'M3TD sınıfı',
    payload: 'Termal kamera + hafif hoparlör ve ışık',
    home: 'Petek A',
    note: 'Kâşifler pisti tararken bekçi aynı anda çit boyunca çalışabilir; kovan drone’ları bölgelere göre ayırır.',
  },
  worker: {
    tasks: ['Bulunan küçük nesneyi toplama', 'Nesneyi FOD kutusuna taşıma ve kayda geçirme'],
    platform: 'M350 RTK sınıfı, ağır gövde',
    payload: 'Vinç + toplama başlığı: elektro-kalıcı mıknatıs veya yumuşak kıskaç',
    home: 'Petek B, FOD kutusunun yanında',
    note: 'Yere inmez: nesnenin 4 m üstünde asılı kalır, başlığı kabloyla indirir. Böylece pervane rüzgârı hafif nesneyi savurmaz.',
  },
  nurse: {
    tasks: ['Kış sabahı park eden uçağın buz ve kırağı haritası', 'De-icing sonrası kontrol uçuşu'],
    platform: 'İşçiyle aynı gövde; başlık değişir',
    payload: 'RGB + termal kamera başlığı (ileride hiperspektral)',
    home: 'Petek B',
    note: 'Sıvı sıkmaz; ekibe yalnızca nereye sıkılacağını gösterir. Yağış veya dondurucu sis varsa uçmaz, uçağın üzerinden asla geçmez.',
  },
  sentinel: {
    tasks: ['Her iniş-kalkışta pisti izleme', 'Yangın, pistten çıkma ve parçalanmayı ilk fark etme'],
    platform: 'Petek direklerinde sabit kamera',
    payload: 'Termal + görünür PTZ kamera, kenar sunucuda YZ',
    home: 'Petek A ve Petek B direkleri',
    note: 'Uçak hareket ederken drone’lar yerdedir; acil durumu ilk gören nöbetçidir.',
  },
}

export function HiveCastes() {
  const [sel, setSel] = useState<CasteId>('scout')
  const c = CASTES.find((x) => x.id === sel)!
  const d = DETAIL[sel]
  return (
    <div className="hive-castes">
      <div className="hive-castes__map">
        <HiveMini active={sel} onPick={setSel} />
        <p className="hive-castes__hint">Bir hücreye tıklayın.</p>
      </div>
      <div className="hive-castes__detail glass glass--soft" aria-live="polite" style={{ ['--c' as string]: c.color }}>
        <p className="hive-castes__count">
          {c.name} {c.count}
        </p>
        <h3>{c.role}</h3>
        <ul>
          {d.tasks.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
        <dl>
          <div>
            <dt>Platform</dt>
            <dd>{d.platform}</dd>
          </div>
          <div>
            <dt>Yük</dt>
            <dd>{d.payload}</dd>
          </div>
          <div>
            <dt>Yuvası</dt>
            <dd>{d.home}</dd>
          </div>
        </dl>
        <p className="hive-castes__note">{d.note}</p>
      </div>
    </div>
  )
}

const ANALOGY: [string, string][] = [
  ['Kâşif arılar yeni kaynak bulur', 'Kâşif drone’lar pisti tarar, yabancı nesneyi bulur'],
  ['Sallanma dansı kaynağın yönünü ve uzaklığını anlatır', 'Kâşif, nesnenin konumunu ve fotoğrafını kovana bildirir'],
  ['Feromon: arıların çevreye bıraktığı iz', 'Dijital ikizdeki işaretler: her drone ortak haritayı okur ve ona yazar (stigmerji)'],
  ['Toplayıcı işçiler nektarı kovana taşır', 'İşçi drone nesneyi toplar, FOD kutusuna taşır'],
  ['Nöbetçi arılar kovan girişini bekler', 'Nöbetçi kameralar her iniş-kalkışta pisti izler'],
  ['Bekçi arılar tehdidi uzaklaştırır', 'Bekçi drone kuşu ve hayvanı uzaklaştırır, çiti dolaşır'],
  ['Bakıcı arılar yavruya bakar', 'Bakıcı rolü park eden uçağın buz haritasını çıkarır'],
  ['Arılarda iş bölümü yaşla değişir', 'Bizde başlıkla değişir: aynı ağır gövde toplama başlığıyla işçi, kamera başlığıyla bakıcı'],
  ['Petek: altıgen hücreler', 'Petek istasyonu: her hücre bir drone yuvası; kovan hücre ekleyerek büyür'],
  ['Bal: kovanın enerji deposu', 'Batarya: güneş ve rüzgârla dolan enerji deposu'],
  ['Arılar kanat çırparak kovanı serinletir', 'İstasyon iklimlendirmesi en büyük tüketim; ortak yalıtımlı petek bu yükü azaltabilir'],
  ['Tehdide en yakın arılar savunur', 'Acil durumda en yakın uygun drone görevlendirilir'],
]

export function HiveAnalogy() {
  return (
    <div className="hive-analogy">
      <div className="hive-analogy__row hive-analogy__row--head" aria-hidden="true">
        <span>Arı kovanında</span>
        <span>AERO-GUARD’da</span>
      </div>
      <dl>
        {ANALOGY.map(([a, b]) => (
          <div key={a} className="hive-analogy__row">
            <dt>{a}</dt>
            <dd>{b}</dd>
          </div>
        ))}
      </dl>
      <p className="hive-analogy__queen">
        <b>Kraliçe yok.</b> Gerçek kovanda merkezi bir emir veren yoktur. Bizim kovanda emniyet için merkezi bir planlayıcı ve kule onayı var; drone’lar ise engelden kaçınma ve arıza
        anında güvenli davranma konusunda kendi başına karar verir. Kovanın kararını kule ve insan verir.
      </p>
    </div>
  )
}

export function HivePetek() {
  return (
    <div className="bento">
      <div className="tile tile--w6 glass glass--soft">
        <span className="tile__label">Petek A, pist 04 ucu</span>
        <span className="tile__title">Kâşif-1, Bekçi, nöbetçi direk</span>
        <span className="tile__text">İki hücre dolu, altı hücreye kadar büyüyebilir.</span>
      </div>
      <div className="tile tile--w6 glass glass--soft">
        <span className="tile__label">Petek B, pist 22 ucu</span>
        <span className="tile__title">Kâşif-2, İşçi/Bakıcı, FOD kutusu, nöbetçi direk</span>
        <span className="tile__text">Toplanan nesneler burada sınıf, ağırlık ve konumla kayda geçer.</span>
      </div>
      <div className="tile tile--w12 glass glass--soft">
        <span className="tile__label">Nasıl yapılıyor</span>
        <span className="tile__text">
          Her petek altıgen hücrelerden oluşan yalıtımlı bir yapı; her hücrede ticari bir otomatik drone istasyonu var. Hücreler güç hattını, iklimlendirmeyi ve ağı paylaşır. Petekler ICAO Ek
          14’e göre pist şeridinin (140 m) dışında ve geçiş yüzeyinin (1:7) altında kalır; kesin yer DHMİ mânia görüşüyle belirlenir.
        </span>
      </div>
    </div>
  )
}

export function HiveSizes() {
  return (
    <div className="hive-sizes">
      <table className="data-table">
        <caption className="visually-hidden">Kovan boyları</caption>
        <thead>
          <tr>
            <th scope="col">Kovan</th>
            <th scope="col">Kim için</th>
            <th scope="col">İçerik</th>
            <th scope="col">Kurulum</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">Mini kovan (v2)</th>
            <td>En küçük havalimanı</td>
            <td>2 kâşif, 2 hücre, enerji adası</td>
            <td>
              <Fact id="hiveMini" />
            </td>
          </tr>
          <tr className="is-us">
            <th scope="row">Çanakkale kovanı</th>
            <td>Düşük trafikli, rüzgârlı</td>
            <td>2 kâşif, 1 bekçi, 1 işçi, nöbetçiler, güvenli konum, 6 kWp güneş</td>
            <td>
              <Fact id="hiveCkz" />
            </td>
          </tr>
          <tr>
            <th scope="row">Kış kovanı</th>
            <td>Soğuk iklim (ör. Erzurum, Kars)</td>
            <td>Çanakkale kovanı + bakıcı rolü</td>
            <td>
              <Fact id="hiveWinter" />
            </td>
          </tr>
          <tr>
            <th scope="row">Geniş kovan</th>
            <td>Daha sık trafik</td>
            <td>+1–2 kâşif ve orta saha peteği</td>
            <td className="num">+≈20 bin $ / kâşif</td>
          </tr>
        </tbody>
      </table>
      <div className="hive-sizes__scale">
        <h3>Kâşif sayısı tarama süresini belirler</h3>
        <p>Her kâşif pistin 1/n’ini üç geçişle tarar. Kısalan tarama daha sık tarifeye sığar; ama dakikada bir hareketin olduğu büyük havalimanında yine pencere oluşmaz.</p>
        <dl className="hive-sizes__n num">
          <div>
            <dt>2 kâşif</dt>
            <dd>≈12 dk</dd>
          </div>
          <div>
            <dt>3 kâşif</dt>
            <dd>≈9 dk</dd>
          </div>
          <div>
            <dt>4 kâşif</dt>
            <dd>≈8 dk</dd>
          </div>
        </dl>
      </div>
      <p className="hive-sizes__note">
        Hepsi V3 ön tahmini (±%30). Çanakkale kovanının beş yıla yayılmış yıllık maliyeti <Fact id="hiveYear" />. Modüler yapı sayesinde her havalimanı yalnızca ihtiyaç duyduğu hücreyi alır.
      </p>
    </div>
  )
}

export function HiveMind() {
  return (
    <div className="bento">
      <div className="tile tile--w4 glass glass--soft">
        <span className="tile__label">Kast ataması</span>
        <span className="tile__text">Tarama, açılış ve pist sağlığı kâşife; yaban hayatı ve çit bekçiye; toplama işçiye; buz haritası bakıcıya. Acil durumda en yakın uygun drone.</span>
      </div>
      <div className="tile tile--w4 glass glass--soft">
        <span className="tile__label">Paralel görev</span>
        <span className="tile__text">Farklı kastlar aynı anda çalışabilir: kâşifler pisti tararken bekçi çit boyunca devriye gezer. Drone’lar bölgelere göre ayrılır.</span>
      </div>
      <div className="tile tile--w4 glass glass--soft">
        <span className="tile__label">Pist kullanım bandı</span>
        <span className="tile__text">Her hareketin 5 dakika öncesi ve sonrası her kast için geçerli: bu sürede hiçbir drone uçmaz. Kule onaylamadan kalkış yok.</span>
      </div>
      <a className="tile tile--w12 glass" href={href('planlayici')}>
        <span className="tile__label">Planlayıcı</span>
        <span className="tile__text">Planlayıcı kast bazlı çalışıyor: kâşif ve bekçi görevleri aynı gün içinde paralel yerleşir. Mini kovanla Çanakkale kovanı arasında geçin, tarifeyi sürükleyip görevlerin nasıl yer değiştirdiğini görün.</span>
        <span className="tile__foot">Planlayıcıyı aç</span>
      </a>
    </div>
  )
}
