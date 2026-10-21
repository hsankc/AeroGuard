/*
  Rekabet matrisi: sunumdaki slayt 11 ile birebir aynı işaretler.
  Ayrıntılı karşılaştırma rapordaki Tablo 2'den.
*/

const COLS = ['Çok görev', 'Sabit altyapı gerekmez', 'Tarifeye göre otomatik', 'Yenilenebilir enerji', 'Bölgesel bütçeye uygun', 'Sürekli izleme']

const ROWS: { name: string; ex: string; v: boolean[]; strong: string; limit: string; us?: boolean }[] = [
  {
    name: 'Sabit FOD radarı veya kamerası',
    ex: 'FODRAD (Antalya), A-FOD (Gazipaşa), Xsight FODetect, QinetiQ Tarsier',
    v: [false, false, false, false, false, true],
    strong: '7/24 sürekli izleme',
    limit: 'Pist boyunca altyapı ve yüksek maliyet; tek görev',
  },
  {
    name: 'Kuş radarı',
    ex: 'KUŞRAD, Robin Radar',
    v: [false, false, false, false, false, true],
    strong: 'Geniş alanda kuş takibi',
    limit: 'Yalnızca tespit; caydırma için ayrı sistem gerekir',
  },
  {
    name: 'Tek görevli drone',
    ex: 'Cranfield Havalimanı denemesi (2020)',
    v: [false, true, false, false, true, false],
    strong: 'Sabit altyapı gerektirmez',
    limit: 'Tek görev; tarife entegrasyonu ve enerji çözümü yok',
  },
  {
    name: 'Araçla manuel denetim',
    ex: 'Bugünkü uygulama',
    v: [true, true, false, false, true, false],
    strong: 'Esnek, düşük maliyet',
    limit: 'İnsan dikkatine bağlı, kayıt üretmez, fosil yakıtlı',
  },
  {
    name: 'AERO-GUARD kovanı',
    ex: 'Bölgesel havalimanı paketi',
    v: [true, true, true, true, true, false],
    strong: 'Görevine göre uzmanlaşmış kovan: tarama, toplama, caydırma, acil durumu ilk görme; tarifeye duyarlı, kendi enerjisini üretir',
    limit: 'Sürekli değil, periyodik izleme (düşük trafikte yeterli)',
    us: true,
  },
]

export function Market() {
  return (
    <div className="mkt">
      <div className="mkt__scroll">
        <table className="mkt__table">
          <caption className="visually-hidden">Mevcut çözümler ve AERO-GUARD</caption>
          <thead>
            <tr>
              <th scope="col">Yaklaşım</th>
              {COLS.map((c) => (
                <th key={c} scope="col">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r) => (
              <tr key={r.name} className={r.us ? 'is-us' : undefined}>
                <th scope="row">
                  <b>{r.name}</b>
                  <span>{r.ex}</span>
                </th>
                {r.v.map((on, i) => (
                  <td key={i}>
                    <span className={on ? 'mkt__dot is-on' : 'mkt__dot'} aria-hidden="true" />
                    <span className="visually-hidden">{on ? 'var' : 'yok'}</span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mkt__legend">
        <span className="mkt__dot is-on" aria-hidden="true" /> var <span className="mkt__dot" aria-hidden="true" /> yok
      </p>

      <p className="mkt__honest">
        <span className="sign-loc">!</span>
        <span>
          <b>Dürüst sınır:</b> AERO-GUARD sürekli izleme yapmaz. Günde birkaç hareketin olduğu bir pistte pistin kullanılmadığı süre saatlerce sürer; her hareketten hemen önce yapılan
          tarama, pistin uçak tarafından kullanıldığı anlar için aynı güvenceyi çok daha düşük maliyetle verir.
        </span>
      </p>

      <details className="mkt__details">
        <summary>Güçlü yanlar ve sınırlar</summary>
        <dl>
          {ROWS.map((r) => (
            <div key={r.name}>
              <dt>{r.name}</dt>
              <dd>
                <span>
                  <b>Güçlü yanı:</b> {r.strong}
                </span>
                <span>
                  <b>Sınırı:</b> {r.limit}
                </span>
              </dd>
            </div>
          ))}
        </dl>
      </details>
    </div>
  )
}
