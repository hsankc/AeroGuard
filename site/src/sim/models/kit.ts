import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'

/*
  Gerçekçi modeller için ortak malzemeler, dokular ve geometriler (hepsi kodla üretilir, dış dosya yok).
  Malzemeler fiziksel tabanlıdır: gövde kabukları vernikli plastik, kollar karbon fiber, motorlar eloksal alüminyum,
  mercekler kaplamalı cam. Ortam yansıması (environment) olan sahnede gerçekçi parlar.
*/

const cache = new Map<string, THREE.Material>()
function once<T extends THREE.Material>(key: string, make: () => T): T {
  if (!cache.has(key)) cache.set(key, make())
  return cache.get(key) as T
}

/** Karbon fiber örgü dokusu */
let carbonTex: THREE.CanvasTexture | null = null
export function carbonTexture() {
  if (carbonTex) return carbonTex
  const c = document.createElement('canvas')
  c.width = c.height = 64
  const g = c.getContext('2d')!
  for (let y = 0; y < 8; y++)
    for (let x = 0; x < 8; x++) {
      const odd = (x + y) % 2
      const grad = odd ? g.createLinearGradient(x * 8, 0, x * 8 + 8, 0) : g.createLinearGradient(0, y * 8, 0, y * 8 + 8)
      grad.addColorStop(0, '#16181b')
      grad.addColorStop(0.5, '#33373d')
      grad.addColorStop(1, '#16181b')
      g.fillStyle = grad
      g.fillRect(x * 8, y * 8, 8, 8)
    }
  carbonTex = new THREE.CanvasTexture(c)
  carbonTex.wrapS = carbonTex.wrapT = THREE.RepeatWrapping
  carbonTex.repeat.set(6, 1)
  carbonTex.colorSpace = THREE.SRGBColorSpace
  return carbonTex
}

/** Gövde üstü yazı ve petek simgesi (kast adı) */
export function labelTexture(text: string, color: string) {
  const c = document.createElement('canvas')
  c.width = 256
  c.height = 64
  const g = c.getContext('2d')!
  g.fillStyle = 'rgba(0,0,0,0)'
  g.fillRect(0, 0, 256, 64)
  // altıgen simge
  g.fillStyle = color
  g.beginPath()
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i - Math.PI / 2
    const x = 30 + Math.cos(a) * 18
    const y = 32 + Math.sin(a) * 18
    if (i === 0) g.moveTo(x, y)
    else g.lineTo(x, y)
  }
  g.closePath()
  g.fill()
  g.fillStyle = '#e8eef6'
  g.font = '700 30px "Barlow Condensed", sans-serif'
  g.textBaseline = 'middle'
  g.fillText(text, 58, 34)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 4
  return t
}

export const MAT = {
  shell: (color = '#3a4047') =>
    once('shell' + color, () => new THREE.MeshPhysicalMaterial({ color, roughness: 0.42, metalness: 0.05, clearcoat: 0.6, clearcoatRoughness: 0.3 })),
  shellWhite: () => once('shellWhite', () => new THREE.MeshPhysicalMaterial({ color: '#e9ecef', roughness: 0.38, metalness: 0.02, clearcoat: 0.7, clearcoatRoughness: 0.25 })),
  matte: (color = '#24282d') => once('matte' + color, () => new THREE.MeshStandardMaterial({ color, roughness: 0.75, metalness: 0.05 })),
  carbon: () => once('carbon', () => new THREE.MeshPhysicalMaterial({ map: carbonTexture(), roughness: 0.32, metalness: 0.25, clearcoat: 1, clearcoatRoughness: 0.15 })),
  alu: (color = '#9aa3ad') => once('alu' + color, () => new THREE.MeshStandardMaterial({ color, roughness: 0.28, metalness: 0.9 })),
  prop: () => once('prop', () => new THREE.MeshPhysicalMaterial({ color: '#121417', roughness: 0.35, metalness: 0.0, clearcoat: 0.5 })),
  glass: () => once('glass', () => new THREE.MeshPhysicalMaterial({ color: '#0a1220', roughness: 0.04, metalness: 0.3, clearcoat: 1, clearcoatRoughness: 0.02, iridescence: 0.6 })),
  rubber: () => once('rubber', () => new THREE.MeshStandardMaterial({ color: '#16181a', roughness: 0.9 })),
  accent: (color: string) => once('acc' + color, () => new THREE.MeshPhysicalMaterial({ color, roughness: 0.35, clearcoat: 0.6, emissive: new THREE.Color(color), emissiveIntensity: 0.15 })),
  led: (color: string) => once('led' + color, () => new THREE.MeshStandardMaterial({ color: '#111', emissive: new THREE.Color(color), emissiveIntensity: 2.4 })),
  label: (text: string, color: string) =>
    once('label' + text + color, () => new THREE.MeshStandardMaterial({ map: labelTexture(text, color), transparent: true, roughness: 0.5, polygonOffset: true, polygonOffsetFactor: -2 })),
}

export function mesh(g: THREE.BufferGeometry, m: THREE.Material, x = 0, y = 0, z = 0) {
  const o = new THREE.Mesh(g, m)
  o.position.set(x, y, z)
  o.castShadow = true
  o.receiveShadow = true
  return o
}

export function rbox(w: number, h: number, d: number, r: number, seg = 3) {
  return new RoundedBoxGeometry(w, h, d, seg, Math.min(r, w / 2 - 1e-4, h / 2 - 1e-4, d / 2 - 1e-4))
}

/** İki nokta arasında silindir (boru, kol, iniş takımı) */
export function tube(a: THREE.Vector3, b: THREE.Vector3, r: number, m: THREE.Material, seg = 14) {
  const len = a.distanceTo(b)
  const o = mesh(new THREE.CylinderGeometry(r, r, len, seg), m)
  o.position.copy(a).add(b).multiplyScalar(0.5)
  o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize())
  return o
}

/** Fırçasız motor: taban flanşı, soğutma kanallı çan ve uçta pervane göbeği (döner tornalama profili) */
export function motorGeometry(r: number, h: number) {
  const p = [
    [0.001, 0],
    [r * 0.95, 0],
    [r, h * 0.12],
    [r * 0.92, h * 0.18],
    [r * 0.98, h * 0.25],
    [r, h * 0.85],
    [r * 0.8, h],
    [r * 0.35, h * 1.05],
    [r * 0.2, h * 1.25],
    [0.001, h * 1.3],
  ].map(([x, y]) => new THREE.Vector2(x, y))
  return new THREE.LatheGeometry(p, 32)
}

/**
  Pervane kanadı: kökten uca daralan ve burulan kanat profili (hücum kenarı yuvarlak, firar kenarı ince).
  Açıklık +x yönünde; kanat düzlemi xz, kalınlık y.
*/
export function bladeGeometry(r0: number, R: number, rootChord: number, tipChord: number, twistRoot: number, twistTip: number, thick: number) {
  const N = 18
  const sec: [number, number][] = [
    [-0.5, 0],
    [-0.42, 0.55],
    [-0.2, 1],
    [0.1, 0.85],
    [0.5, 0.05],
    [0.1, -0.35],
    [-0.2, -0.45],
    [-0.42, -0.3],
  ]
  const pos: number[] = []
  const idx: number[] = []
  for (let i = 0; i <= N; i++) {
    const u = i / N
    const x = r0 + (R - r0) * u
    // uçta yuvarlanan kiriş
    const tip = u > 0.85 ? Math.sqrt(Math.max(0, 1 - ((u - 0.85) / 0.15) ** 2)) : 1
    const chord = (rootChord + (tipChord - rootChord) * u) * Math.max(0.12, tip) * (u < 0.08 ? 0.6 + u * 5 : 1)
    const tw = ((twistRoot + (twistTip - twistRoot) * u) * Math.PI) / 180
    const th = thick * (1 - 0.6 * u)
    const sweep = -chord * 0.15 * u
    for (const [cz, cy] of sec) {
      const z = cz * chord + sweep
      const y = cy * th
      pos.push(x, y * Math.cos(tw) + z * Math.sin(tw), -y * Math.sin(tw) + z * Math.cos(tw))
    }
  }
  const S = sec.length
  for (let i = 0; i < N; i++)
    for (let j = 0; j < S; j++) {
      const a = i * S + j
      const b = i * S + ((j + 1) % S)
      const c = (i + 1) * S + j
      const d = (i + 1) * S + ((j + 1) % S)
      idx.push(a, c, b, b, c, d)
    }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setIndex(idx)
  g.computeVertexNormals()
  return g
}

/** İki kanatlı pervane grubu (göbek dahil); dönüş yönüne göre aynalanır */
export function propeller(R: number, chord: number, ccw: boolean) {
  const g = new THREE.Group()
  const blade = bladeGeometry(R * 0.08, R, chord, chord * 0.45, 24, 9, chord * 0.12)
  for (const a of [0, Math.PI]) {
    const m = mesh(blade, MAT.prop())
    m.rotation.y = a
    if (ccw) m.scale.z = -1
    g.add(m)
  }
  g.add(mesh(new THREE.CylinderGeometry(R * 0.07, R * 0.08, chord * 0.35, 16), MAT.prop()))
  // uç işareti: dönen pervane görünür olsun
  for (const a of [0, Math.PI]) {
    const tipMark = mesh(new THREE.BoxGeometry(R * 0.06, chord * 0.02, chord * 0.5), MAT.accent('#e8eef6'), Math.cos(a) * R * 0.92, chord * 0.012, -Math.sin(a) * R * 0.92)
    tipMark.rotation.y = a
    g.add(tipMark)
  }
  return g
}

/** Dönen pervanenin hareket bulanıklığı diski (hızlıyken kanatların yerine görünür) */
export function blurDisc(R: number) {
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const g = c.getContext('2d')!
  const grad = g.createRadialGradient(64, 64, 6, 64, 64, 64)
  grad.addColorStop(0, 'rgba(20,22,26,0.55)')
  grad.addColorStop(0.75, 'rgba(20,22,26,0.22)')
  grad.addColorStop(0.92, 'rgba(230,235,240,0.35)')
  grad.addColorStop(1, 'rgba(20,22,26,0)')
  g.fillStyle = grad
  g.fillRect(0, 0, 128, 128)
  const t = new THREE.CanvasTexture(c)
  const m = new THREE.Mesh(new THREE.CircleGeometry(R, 40).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, side: THREE.DoubleSide }))
  m.visible = false
  return m
}

/** Kaplamalı mercek (dış halka + cam) */
export function lens(r: number, depth: number, axis: 'x' | 'z' = 'x') {
  const g = new THREE.Group()
  const ring = mesh(new THREE.CylinderGeometry(r * 1.25, r * 1.25, depth, 24), MAT.matte('#101215'))
  const glass = mesh(new THREE.SphereGeometry(r, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), MAT.glass(), 0, depth / 2, 0)
  glass.scale.y = 0.35
  g.add(ring, glass)
  if (axis === 'x') g.rotation.z = -Math.PI / 2
  else g.rotation.x = Math.PI / 2
  return g
}
