import { Fact } from '../../components/Fact'
import { useSim } from '../../sim/store'
import { DataIcon, FenceIcon, RadarIcon, TowerIcon } from './icons'

/*
  Emniyet: dört ilke, operasyon kuralları, risk matrisi (Tablo 10) ve regülasyon çerçevesi.
  Kırmızı "04-22" bekleme tabelası sitede yalnızca kule onayı ve emniyet için kullanılır.
*/

type Level = 'Düşük' | 'Orta' | 'Yüksek'
const RISKS: { name: string; short: string; p: Level; i: Level; m: string; lab?: boolean }[] = [
  { name: 'Hareket alanında uçuş izninin gecikmesi', short: 'İzin gecikmesi', p: 'Yüksek', i: 'Yüksek', m: 'İzin sürecine ilk ayda başlamak; sınırlı pilotu uçuşsuz saatlerde apron ve taksi yolunda yapmak.' },
  { name: 'Kuvvetli rüzgâr nedeniyle taramanın yapılamaması', short: 'Kuvvetli rüzgâr', p: 'Orta', i: 'Orta', m: 'Rüzgâr verisine göre planlama; sınır aşılınca araçla denetime dönüş; gerçekleşme oranını KPI olarak izlemek.' },
  { name: 'Drone arızası ve pistte kalması', short: 'Drone arızası', p: 'Düşük', i: 'Yüksek', m: 'Pist dışı acil iniş noktaları, otomatik FOD bildirimi, dönüş doğrulanmadan rapor üretmemek.', lab: true },
  { name: 'YZ’nin nesne kaçırması veya yanlış alarm', short: 'YZ hatası', p: 'Orta', i: 'Yüksek', m: 'İnsan onayı, yerel veriyle ince ayar, aktif öğrenme, pilot boyunca araçla denetimin paralel sürmesi.' },
  { name: 'GNSS / RF girişimi', short: 'GNSS/RF girişimi', p: 'Düşük', i: 'Orta', m: 'RTK + görsel konumlama, frekans koordinasyonu, iletişim kaybında otomatik iniş.', lab: true },
  { name: 'Askeri alan nedeniyle görüntüleme kısıtı', short: 'Görüntüleme kısıtı', p: 'Orta', i: 'Orta', m: 'Verinin sahada kalması, görüntüleme alanının sınırlandırılması, erken paydaş görüşmesi.' },
  { name: 'Enerji üretiminin beklenenin altında kalması', short: 'Düşük üretim', p: 'Orta', i: 'Düşük', m: 'Temkinli kapasite faktörü, hibrit kaynak, şebeke yedeği.' },
  { name: 'Siber saldırı', short: 'Siber saldırı', p: 'Düşük', i: 'Yüksek', m: 'Şifreli iletişim, iç ağ, erişim kontrolü, düzenli güncelleme.' },
]
const LEVELS: Level[] = ['Düşük', 'Orta', 'Yüksek']
const sev = (p: Level, i: Level) => LEVELS.indexOf(p) + LEVELS.indexOf(i) // 0..4

const openLab = () => useSim.getState().set({ opsOpen: true })

export function Safety() {
  return (
    <div className="safe">
      <div className="safe__rules">
        <span className="sign-hold safe__sign" aria-hidden="true">
          04-22
        </span>
        <ul>
          <li>
            <TowerIcon />
            <div>
              <h3>Kule onayı</h3>
              <p>Drone yalnızca kulenin onayladığı pencerede ve pist kullanımda değilken uçar. Kule her an iptal edip geri çağırabilir; pencere bitmeden en az 5 dakika önce drone istasyondadır.</p>
            </div>
          </li>
          <li>
            <FenceIcon />
            <div>
              <h3>Sanal sınır ve ADS-B</h3>
              <p>
                Sanal sınır drone’u pist şeridi içinde ve <Fact id="geofence" /> altında tutar; aşılırsa otomatik eve dönüş. Drone’daki ADS-B alıcısı yakındaki hava aracını algılar,
                beklenmedik yaklaşmada görev durur.
              </p>
            </div>
          </li>
          <li>
            <RadarIcon />
            <div>
              <h3>Arızada pist dışına iniş</h3>
              <p>
                RTK ve görsel konumlama birlikte kullanılır. Güç veya iletişim kaybında drone pist dışındaki acil iniş noktasına iner; indiği yer otomatik olarak FOD diye kuleye bildirilir.
                İki drone istasyona döndüğü doğrulanmadan temiz pist raporu üretilmez.
              </p>
            </div>
          </li>
          <li>
            <DataIcon />
            <div>
              <h3>Veri sahada kalır</h3>
              <p>Sivil–askeri ortak kullanım nedeniyle görüntüler havalimanı dışına çıkmaz; işleme kenar sunucuda yapılır, görüntüleme alanı pist şeridiyle sınırlanır, iletişim şifrelidir.</p>
            </div>
          </li>
        </ul>
        <p className="safe__wind">
          Rüzgâr istasyonun iniş-kalkış sınırı olan <Fact id="windLimit" />’yi aşarsa, yağış veya görüş sınırları aşılırsa görev başlamaz; denetim bugünkü gibi araçla yapılır.
        </p>
        <button type="button" className="pbtn" onClick={openLab}>
          Arıza laboratuvarında dene
        </button>
      </div>

      <div className="safe__risk">
        <h3 className="content-h3">Risk matrisi</h3>
        <div className="risk" role="table" aria-label="Riskler: olasılık ve etki">
          <span className="risk__axis risk__axis--y" aria-hidden="true">
            olasılık
          </span>
          {[...LEVELS].reverse().map((p) => (
            <div key={p} className="risk__row" role="row">
              <span className="risk__lvl" role="rowheader">
                {p}
              </span>
              {LEVELS.map((i) => {
                const items = RISKS.filter((r) => r.p === p && r.i === i)
                return (
                  <div key={i} className={`risk__cell risk__cell--s${sev(p, i)}`} role="cell" aria-label={`Olasılık ${p}, etki ${i}: ${items.map((x) => x.short).join(', ') || 'yok'}`}>
                    {items.map((x) => (
                      <span key={x.short}>{x.short}</span>
                    ))}
                  </div>
                )
              })}
            </div>
          ))}
          <div className="risk__row risk__row--foot" role="row">
            <span />
            {LEVELS.map((i) => (
              <span key={i} className="risk__lvl" role="columnheader">
                {i}
              </span>
            ))}
          </div>
          <span className="risk__axis risk__axis--x" aria-hidden="true">
            etki
          </span>
        </div>

        <ul className="risk__list">
          {RISKS.map((r) => (
            <li key={r.name}>
              <b>{r.name}</b>
              <span className="risk__meta">
                olasılık {r.p.toLowerCase()}, etki {r.i.toLowerCase()}
              </span>
              <span>{r.m}</span>
              {r.lab && (
                <button type="button" className="risk__lab" onClick={openLab}>
                  Arıza laboratuvarında göster
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div className="safe__reg">
        <h3 className="content-h3">Regülasyon çerçevesi</h3>
        <ul>
          <li>ICAO Ek 14: havaalanı tasarımı ve işletimi</li>
          <li>ICAO GRF: pist durum raporlaması</li>
          <li>SHGM İHA Talimatı (SHT-İHA)</li>
          <li>DHMİ mânia görüşü (türbin yeri)</li>
          <li>JARUS SORA risk değerlendirmesi</li>
          <li>AB 2019/947 İHA operasyon kuralları</li>
        </ul>
        <p>Görüş hattı ötesi (BVLOS) izin alınana kadar pilot, sahada görevli bir uzaktan pilotun gözetiminde yürütülür. İzin süreci yol haritasında ayrı bir iş paketidir (İP3).</p>
      </div>
    </div>
  )
}
