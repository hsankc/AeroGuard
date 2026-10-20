import * as THREE from 'three'
import { allowedHeight, ANNEX14, LAYOUT, RWY } from './layout'

/*
  Ek 14 katmanı (keşif modunda açılır): pist şeridi zeminde, geçiş yüzeyleri iki yanda 1:7 eğimle yükselen
  yarı saydam düzlemler. Petekler ve türbin için "izin verilen / gerçek yükseklik" işaretleri.
  Değerler basitleştirilmiştir ve Ek 14'ün güncel baskısından doğrulanacaktır.
*/

function textSprite(lines: string[], color = '#f6b93b') {
  const c = document.createElement('canvas')
  c.width = 512
  c.height = 64 + 52 * (lines.length - 1)
  const g = c.getContext('2d')!
  g.fillStyle = 'rgba(8, 16, 30, 0.82)'
  g.beginPath()
  g.roundRect(0, 0, c.width, c.height, 18)
  g.fill()
  g.strokeStyle = color
  g.lineWidth = 3
  g.stroke()
  g.fillStyle = '#edf2f8'
  g.font = '600 34px "Barlow Semi Condensed", sans-serif'
  g.textBaseline = 'middle'
  lines.forEach((l, i) => {
    g.fillStyle = i === 0 ? color : '#edf2f8'
    g.fillText(l, 22, 32 + i * 52)
  })
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true }))
  s.renderOrder = 10
  s.userData.aspect = c.width / c.height
  return s
}

const fmt = (n: number) => n.toLocaleString('tr-TR', { maximumFractionDigits: 1, minimumFractionDigits: 1 })

export class Annex14Layer {
  group = new THREE.Group()
  private sprites: THREE.Sprite[] = []

  constructor() {
    const x0 = -RWY.half - ANNEX14.stripEnd
    const x1 = RWY.half + ANNEX14.stripEnd
    const L = x1 - x0
    const S = ANNEX14.stripHalf
    const top = ANNEX14.innerHorizontal
    const zTop = S + top * ANNEX14.slope

    // pist şeridi: zeminde yarı saydam bant ve kenar çizgileri
    const strip = new THREE.Mesh(
      new THREE.PlaneGeometry(L, S * 2).rotateX(-Math.PI / 2).translate(0, 0.2, 0),
      new THREE.MeshBasicMaterial({ color: '#f6b93b', transparent: true, opacity: 0.07, depthWrite: false }),
    )
    this.group.add(strip)
    const lineMat = new THREE.LineBasicMaterial({ color: '#f6b93b', transparent: true, opacity: 0.85 })
    const stripEdge = new THREE.LineLoop(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(x0, 0.3, -S),
        new THREE.Vector3(x1, 0.3, -S),
        new THREE.Vector3(x1, 0.3, S),
        new THREE.Vector3(x0, 0.3, S),
      ]),
      lineMat,
    )
    this.group.add(stripEdge)

    // geçiş yüzeyleri: şerit kenarından iç yatay yüzeye kadar eğimli düzlem
    const surfMat = new THREE.MeshBasicMaterial({ color: '#5aaaf0', transparent: true, opacity: 0.09, side: THREE.DoubleSide, depthWrite: false })
    const contourMat = new THREE.LineBasicMaterial({ color: '#5aaaf0', transparent: true, opacity: 0.55 })
    for (const sgn of [-1, 1]) {
      const g = new THREE.BufferGeometry()
      const v = [x0, 0, sgn * S, x1, 0, sgn * S, x1, top, sgn * zTop, x0, top, sgn * zTop]
      g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3))
      g.setIndex([0, 1, 2, 0, 2, 3])
      this.group.add(new THREE.Mesh(g, surfMat))
      // her 5 m'de bir eş yükselti çizgisi
      const pts: number[] = []
      for (let h = 5; h <= top; h += 5) {
        const z = sgn * (S + h * ANNEX14.slope)
        pts.push(x0, h, z, x1, h, z)
      }
      const cg = new THREE.BufferGeometry()
      cg.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3))
      this.group.add(new THREE.LineSegments(cg, contourMat))
    }

    // etiketler
    const label = (lines: string[], x: number, y: number, z: number, scale: number, color?: string) => {
      const s = textSprite(lines, color)
      s.position.set(x, y, z)
      s.scale.set(scale * s.userData.aspect, scale, 1)
      s.userData.base = scale
      this.group.add(s)
      this.sprites.push(s)
    }
    label(['Pist şeridi', '±140 m, uçlardan 60 m'], -RWY.half + 240, 6, -S, 4.5)
    label(['Geçiş yüzeyi', '1:7 eğim, 45 m’ye kadar'], -RWY.half + 520, 24, -(S + 24 * ANNEX14.slope), 6, '#5aaaf0')

    // yapıların yükseklik payı: gerçek yükseklikten yüzeye dikey çizgi
    const marks = [
      { name: 'Petek A', x: LAYOUT.stationA.x, z: LAYOUT.stationA.z, h: 4 },
      { name: 'Petek B', x: LAYOUT.stationB.x, z: LAYOUT.stationB.z, h: 4 },
      { name: 'Türbin', x: LAYOUT.energy.x + 8, z: LAYOUT.energy.z, h: 9.2 },
      // nöbetçi direk peteğin pistten uzak kenarında (petek merkezinden 9,5 m geride)
      { name: 'Nöbetçi direk', x: LAYOUT.stationB.x, z: LAYOUT.stationB.z + 9.5, h: 5.2 },
    ]
    for (const m of marks) {
      const a = allowedHeight(m.z)
      const lg = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(m.x, m.h, m.z), new THREE.Vector3(m.x, a, m.z)])
      this.group.add(new THREE.Line(lg, new THREE.LineDashedMaterial({ color: '#72c766', dashSize: 0.6, gapSize: 0.4 })).computeLineDistances())
      const tick = new THREE.Mesh(new THREE.RingGeometry(1.2, 1.6, 24).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#72c766', side: THREE.DoubleSide }))
      tick.position.set(m.x, a, m.z)
      this.group.add(tick)
      label([m.name, `izin ≈${fmt(a)} m · yapı ≈${fmt(m.h)} m`], m.x, a + 4, m.z, 1.6, '#72c766')
    }

    this.group.visible = false
  }

  setVisible(v: boolean) {
    this.group.visible = v
  }

  /** Etiketler uzaktan da okunsun: kameraya uzaklıkla büyür (sınırlı) */
  update(camPos: THREE.Vector3) {
    if (!this.group.visible) return
    for (const s of this.sprites) {
      const d = camPos.distanceTo(s.position)
      const k = THREE.MathUtils.clamp(d / 120, 1, 14)
      const b = s.userData.base as number
      s.scale.set(b * k * (s.userData.aspect as number), b * k, 1)
    }
  }
}
