import * as THREE from 'three'

/* Kodla üretilen dokular: dış dosya yok, lisans sorunu yok, internetsiz çalışır. */

function canvas(w: number, h: number) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return [c, c.getContext('2d')!] as const
}

function rng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

function finish(c: HTMLCanvasElement, repeat?: [number, number], srgb = true) {
  const t = new THREE.CanvasTexture(c)
  if (srgb) t.colorSpace = THREE.SRGBColorSpace
  if (repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(repeat[0], repeat[1])
  }
  t.anisotropy = 8
  t.needsUpdate = true
  return t
}

/** Beton pist: 10 m × 10 m karo, 5 m'de bir derz (dilatasyon) çizgisi. */
export function concreteTexture() {
  const [c, g] = canvas(512, 512)
  const r = rng(7)
  for (let sy = 0; sy < 2; sy++)
    for (let sx = 0; sx < 2; sx++) {
      const v = 186 + Math.floor(r() * 12)
      g.fillStyle = `rgb(${v},${v + 2},${v - 2})`
      g.fillRect(sx * 256, sy * 256, 256, 256)
    }
  for (let i = 0; i < 9000; i++) {
    const v = 150 + Math.floor(r() * 90)
    g.fillStyle = `rgba(${v},${v},${v},${0.18 + r() * 0.25})`
    g.fillRect(r() * 512, r() * 512, 1 + r() * 2, 1 + r() * 2)
  }
  // lastik izleri (koyu, uzunlamasına)
  for (let i = 0; i < 26; i++) {
    g.fillStyle = `rgba(40,40,40,${0.02 + r() * 0.05})`
    g.fillRect(0, r() * 512, 512, 4 + r() * 18)
  }
  g.strokeStyle = 'rgba(70,72,72,0.85)'
  g.lineWidth = 2
  for (const p of [1, 256, 511]) {
    g.beginPath()
    g.moveTo(p, 0)
    g.lineTo(p, 512)
    g.moveTo(0, p)
    g.lineTo(512, p)
    g.stroke()
  }
  return finish(c)
}

/** Omuz ve taksi yolu asfaltı. */
export function asphaltTexture(seed = 3, base = 74) {
  const [c, g] = canvas(256, 256)
  const r = rng(seed)
  g.fillStyle = `rgb(${base},${base + 3},${base + 6})`
  g.fillRect(0, 0, 256, 256)
  for (let i = 0; i < 6000; i++) {
    const v = base - 20 + Math.floor(r() * 50)
    g.fillStyle = `rgba(${v},${v},${v + 4},0.5)`
    g.fillRect(r() * 256, r() * 256, 1.5, 1.5)
  }
  return finish(c)
}

/** Ekim ayında Çanakkale: yer yer sararmış çim. */
export function grassTexture() {
  const [c, g] = canvas(512, 512)
  const r = rng(11)
  g.fillStyle = '#76844a'
  g.fillRect(0, 0, 512, 512)
  for (let i = 0; i < 260; i++) {
    const x = r() * 512
    const y = r() * 512
    const rad = 20 + r() * 80
    const grd = g.createRadialGradient(x, y, 0, x, y, rad)
    const tone = r()
    const col = tone < 0.4 ? '139,140,82' : tone < 0.75 ? '96,118,62' : '118,128,70'
    grd.addColorStop(0, `rgba(${col},0.45)`)
    grd.addColorStop(1, `rgba(${col},0)`)
    g.fillStyle = grd
    g.fillRect(x - rad, y - rad, rad * 2, rad * 2)
  }
  for (let i = 0; i < 16000; i++) {
    const v = r()
    g.fillStyle = v < 0.5 ? 'rgba(60,78,40,0.35)' : 'rgba(160,160,100,0.25)'
    g.fillRect(r() * 512, r() * 512, 1, 2 + r() * 2)
  }
  return finish(c)
}

/** Pist numarası ("04", "22"): beyaz, şeffaf zemin. */
export function runwayNumberTexture(text: string) {
  const [c, g] = canvas(256, 384)
  g.fillStyle = '#fff'
  g.font = '700 300px "Barlow Condensed", "Arial Narrow", sans-serif'
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.fillText(text, 128, 200)
  return finish(c)
}

/** Havalimanı tabelası dokusu (konum: sarı/siyah, zorunlu: kırmızı/beyaz). */
export function signTexture(parts: { text: string; kind: 'loc' | 'hold' | 'dir' }[]) {
  const unitW = 150
  const [c, g] = canvas(unitW * parts.length, 100)
  parts.forEach((p, i) => {
    const x = i * unitW
    if (p.kind === 'hold') {
      g.fillStyle = '#c8102e'
      g.fillRect(x, 0, unitW, 100)
      g.strokeStyle = '#fff'
      g.lineWidth = 4
      g.strokeRect(x + 6, 6, unitW - 12, 88)
      g.fillStyle = '#fff'
    } else if (p.kind === 'loc') {
      g.fillStyle = '#1d1d1b'
      g.fillRect(x, 0, unitW, 100)
      g.strokeStyle = '#ffc72c'
      g.lineWidth = 5
      g.strokeRect(x + 8, 8, unitW - 16, 84)
      g.fillStyle = '#ffc72c'
    } else {
      g.fillStyle = '#ffc72c'
      g.fillRect(x, 0, unitW, 100)
      g.fillStyle = '#1d1d1b'
    }
    g.font = '700 64px "Barlow Condensed", "Arial Narrow", sans-serif'
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    g.fillText(p.text, x + unitW / 2, 54)
  })
  return finish(c)
}

/** Rüzgâr tulumu: kırmızı/beyaz şeritler. */
export function windsockTexture() {
  const [c, g] = canvas(256, 64)
  for (let i = 0; i < 5; i++) {
    g.fillStyle = i % 2 === 0 ? '#e0452d' : '#f4f4f0'
    g.fillRect((i * 256) / 5, 0, 256 / 5 + 1, 64)
  }
  return finish(c)
}

/** Güneş paneli hücreleri. */
export function solarCellTexture() {
  const [c, g] = canvas(128, 192)
  g.fillStyle = '#16294a'
  g.fillRect(0, 0, 128, 192)
  g.strokeStyle = 'rgba(160,180,210,0.55)'
  g.lineWidth = 1.5
  for (let x = 0; x <= 128; x += 21.3) {
    g.beginPath()
    g.moveTo(x, 0)
    g.lineTo(x, 192)
    g.stroke()
  }
  for (let y = 0; y <= 192; y += 19.2) {
    g.beginPath()
    g.moveTo(0, y)
    g.lineTo(128, y)
    g.stroke()
  }
  g.strokeStyle = '#c9ced6'
  g.lineWidth = 6
  g.strokeRect(0, 0, 128, 192)
  return finish(c)
}

/** Uçak gövdesi: pencere sırası ve ince bir şerit. Gerçek bir havayolu boyası değildir. */
export function fuselageTexture() {
  const [c, g] = canvas(1024, 128)
  g.fillStyle = '#f2f4f6'
  g.fillRect(0, 0, 1024, 128)
  g.fillStyle = '#0f1e33'
  g.fillRect(0, 84, 1024, 7)
  g.fillStyle = '#1478c8'
  g.fillRect(0, 93, 1024, 3)
  g.fillStyle = '#2a3646'
  for (let x = 150; x < 900; x += 15) {
    if (x > 300 && x < 330) continue
    g.fillRect(x, 52, 7, 10)
  }
  return finish(c)
}

/** İniş pedi üzerindeki H işareti. */
export function padTexture(accent: string) {
  const [c, g] = canvas(128, 128)
  g.fillStyle = '#2b3138'
  g.fillRect(0, 0, 128, 128)
  g.strokeStyle = accent
  g.lineWidth = 6
  g.beginPath()
  g.arc(64, 64, 52, 0, Math.PI * 2)
  g.stroke()
  g.fillStyle = '#e8ebee'
  g.font = '700 70px "Barlow Condensed", sans-serif'
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.fillText('H', 64, 68)
  return finish(c)
}

/** Yumuşak ışık lekesi (ışıklar ve parlamalar için). */
export function glowTexture() {
  const [c, g] = canvas(64, 64)
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32)
  grd.addColorStop(0, 'rgba(255,255,255,1)')
  grd.addColorStop(0.25, 'rgba(255,255,255,0.75)')
  grd.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = grd
  g.fillRect(0, 0, 64, 64)
  return finish(c, undefined, false)
}

/** Çit teli (yarı saydam örgü). */
export function fenceTexture() {
  const [c, g] = canvas(64, 64)
  g.clearRect(0, 0, 64, 64)
  g.strokeStyle = 'rgba(200,205,210,0.9)'
  g.lineWidth = 1.4
  for (let i = -64; i < 128; i += 10) {
    g.beginPath()
    g.moveTo(i, 0)
    g.lineTo(i + 64, 64)
    g.moveTo(i + 64, 0)
    g.lineTo(i, 64)
    g.stroke()
  }
  return finish(c)
}
