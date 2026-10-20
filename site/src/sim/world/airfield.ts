import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { LAYOUT, RWY } from './layout'
import {
  asphaltTexture,
  concreteTexture,
  fenceTexture,
  glowTexture,
  grassTexture,
  runwayNumberTexture,
  signTexture,
  windsockTexture,
} from './textures'

/* Yere yatay dikdörtgen (x boyunca w, z boyunca d). */
function flatRect(cx: number, cz: number, w: number, d: number, y = 0) {
  const g = new THREE.PlaneGeometry(w, d)
  g.rotateX(-Math.PI / 2)
  g.translate(cx, y, cz)
  return g
}

/* Basit değer gürültüsü (arazi için). */
function hash(x: number, y: number) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453
  return s - Math.floor(s)
}
function noise(x: number, y: number) {
  const xi = Math.floor(x)
  const yi = Math.floor(y)
  const xf = x - xi
  const yf = y - yi
  const u = xf * xf * (3 - 2 * xf)
  const v = yf * yf * (3 - 2 * yf)
  const a = hash(xi, yi)
  const b = hash(xi + 1, yi)
  const c = hash(xi, yi + 1)
  const d = hash(xi + 1, yi + 1)
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v
}
function fbm(x: number, y: number) {
  let s = 0
  let amp = 0.5
  let f = 1
  for (let i = 0; i < 4; i++) {
    s += amp * noise(x * f, y * f)
    f *= 2.03
    amp *= 0.5
  }
  return s
}
const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

/*
  Çanakkale Boğazı (stilize): kıyı havalimanının ≈2,4 km batı-kuzeybatısında,
  boğaz kabaca 20° doğrultusunda ve Çanakkale önünde ≈1,4 km genişliğinde.
*/
const STRAIT = { px: -1060, pz: -2914, dx: Math.cos((-20 * Math.PI) / 180), dz: Math.sin((-20 * Math.PI) / 180), half: 700 }
/** Boğaz eksenine işaretli uzaklık: + havalimanı (Anadolu) yakası, − Gelibolu yakası. */
function straitDistance(x: number, z: number) {
  const rx = x - STRAIT.px
  const rz = z - STRAIT.pz
  return rz * STRAIT.dx - rx * STRAIT.dz
}

/** Arazi yüksekliği: havalimanı ve kıyı düzlüğü düz, iç kesimler ve karşı kıyı tepelik. */
function terrainHeight(x: number, z: number) {
  const ex = x / 2100
  const ez = (z + 70) / 900
  const airport = Math.sqrt(ex * ex + ez * ez)
  const sd = straitDistance(x, z)
  if (Math.abs(sd) < STRAIT.half) return -12
  if (sd < 0) return 40 + fbm(x / 1100, z / 1100) * 320 * smooth(-STRAIT.half, -STRAIT.half - 1500, sd)
  return smooth(1.25, 3.2, airport) * (30 + fbm(x / 1400, z / 1400) * 210) * smooth(2300, 3400, sd)
}

export type Airfield = {
  group: THREE.Group
  update: (night: number, wind: number, windDir: number, t: number) => void
}

export function buildAirfield(): Airfield {
  const group = new THREE.Group()
  group.name = 'airfield'

  /* ---------- Arazi, deniz, şehir ---------- */
  const grassTex = grassTexture()
  grassTex.repeat.set(700, 700)
  const terrainGeo = new THREE.PlaneGeometry(18000, 18000, 180, 180)
  terrainGeo.rotateX(-Math.PI / 2)
  const pos = terrainGeo.attributes.position as THREE.BufferAttribute
  const colors = new Float32Array(pos.count * 3)
  const cGrass = new THREE.Color('#ffffff')
  const cDry = new THREE.Color('#d8cfa4')
  const cSand = new THREE.Color('#d9c9a0')
  const cDeep = new THREE.Color('#5c6b6b')
  const tmp = new THREE.Color()
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const z = pos.getZ(i)
    const sd = straitDistance(x, z)
    const inWater = Math.abs(sd) < STRAIT.half
    const shore = smooth(STRAIT.half + 140, STRAIT.half, Math.abs(sd))
    let h = terrainHeight(x, z)
    if (!inWater) h *= 1 - shore * 0.9
    pos.setY(i, h)
    if (inWater) tmp.copy(cDeep)
    else if (shore > 0.3) tmp.copy(cSand)
    else tmp.copy(cGrass).lerp(cDry, Math.min(1, h / 260) * 0.7)
    colors[i * 3] = tmp.r
    colors[i * 3 + 1] = tmp.g
    colors[i * 3 + 2] = tmp.b
  }
  terrainGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  terrainGeo.computeVertexNormals()
  const terrain = new THREE.Mesh(
    terrainGeo,
    new THREE.MeshStandardMaterial({ map: grassTex, vertexColors: true, roughness: 1, metalness: 0 }),
  )
  terrain.receiveShadow = true
  group.add(terrain)

  const water = new THREE.Mesh(
    new THREE.PlaneGeometry(STRAIT.half * 2, 30000),
    new THREE.MeshStandardMaterial({ color: '#2f5f7a', roughness: 0.18, metalness: 0.35 }),
  )
  water.rotation.x = -Math.PI / 2
  water.rotation.z = Math.atan2(STRAIT.dx, STRAIT.dz) // uzun kenar boğaz doğrultusunda
  water.position.set(STRAIT.px, -1.5, STRAIT.pz)
  group.add(water)

  // Şehir: boğaz kıyısıyla havalimanı arasında alçak yapılar
  const cityCount = 700
  const city = new THREE.InstancedMesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshStandardMaterial({ color: '#b9ab98', roughness: 0.95, emissive: new THREE.Color('#ffb257'), emissiveIntensity: 0 }),
    cityCount,
  )
  const cityLights: number[] = []
  const m4 = new THREE.Matrix4()
  const q = new THREE.Quaternion()
  let placed = 0
  let seed = 1
  const rnd = () => {
    seed = (seed * 16807) % 2147483647
    return seed / 2147483647
  }
  let tries = 0
  while (placed < cityCount && tries++ < 20000) {
    // Şehir: kıyı ile havalimanının kuzeyi arasındaki düzlük
    const x = -2800 + rnd() * 4400
    const z = -3600 + rnd() * 2900
    const sd = straitDistance(x, z)
    if (sd < STRAIT.half + 70 || sd > 2250 || z > -680) continue
    const w = 10 + rnd() * 18
    const d = 10 + rnd() * 18
    const h = 4 + rnd() * rnd() * 20
    const gy = Math.max(0, terrainHeight(x, z))
    q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), (-20 * Math.PI) / 180 + (rnd() - 0.5) * 0.3)
    m4.compose(new THREE.Vector3(x, gy + h / 2, z), q, new THREE.Vector3(w, h, d))
    city.setMatrixAt(placed++, m4)
    if (rnd() < 0.8) cityLights.push(x + (rnd() - 0.5) * w, gy + h + 1, z + (rnd() - 0.5) * d)
  }
  city.count = placed
  // Binalar yalnızca uzaktan siluet olarak; gece şehir ışıkları asıl görünen kısım
  city.visible = false
  group.add(city)

  /* ---------- Pist ---------- */
  const len = RWY.half * 2
  const concrete = concreteTexture()
  concrete.repeat.set(len / 10, (RWY.halfWidth * 2) / 10)
  const runway = new THREE.Mesh(
    flatRect(0, 0, len, RWY.halfWidth * 2, 0.06),
    new THREE.MeshStandardMaterial({ map: concrete, roughness: 0.92, metalness: 0 }),
  )
  runway.receiveShadow = true
  group.add(runway)

  const shoulderTex = asphaltTexture(5, 82)
  shoulderTex.repeat.set(len / 8, 1)
  const shoulderMat = new THREE.MeshStandardMaterial({ map: shoulderTex, roughness: 0.95 })
  const shoulderGeo = mergeGeometries([
    flatRect(0, -(RWY.halfWidth + RWY.shoulder / 2), len + 30, RWY.shoulder, 0.04),
    flatRect(0, RWY.halfWidth + RWY.shoulder / 2, len + 30, RWY.shoulder, 0.04),
    // pist sonu güvenlik alanı (asfalt cep)
    flatRect(-RWY.half - 30, 0, 60, RWY.halfWidth * 2 + RWY.shoulder * 2, 0.04),
    flatRect(RWY.half + 30, 0, 60, RWY.halfWidth * 2 + RWY.shoulder * 2, 0.04),
  ])
  const shoulders = new THREE.Mesh(shoulderGeo, shoulderMat)
  shoulders.receiveShadow = true
  group.add(shoulders)

  // ICAO Ek 14 işaretleri (45 m pist için sadeleştirilmiş)
  const marks: THREE.BufferGeometry[] = []
  const y = 0.09
  for (const end of [-1, 1]) {
    const th = end * RWY.half // eşik x
    const inward = -end // eşikten pist içine doğru
    marks.push(flatRect(th + inward * 0.9, 0, 1.8, RWY.halfWidth * 2, y)) // eşik çizgisi
    for (let i = 0; i < 6; i++) {
      const zz = 3 + i * 3.4
      for (const s of [-1, 1]) marks.push(flatRect(th + inward * 21, s * zz, 30, 1.8, y)) // piyano tuşları
    }
    // nişan noktası (400 m)
    for (const s of [-1, 1]) marks.push(flatRect(th + inward * 400, s * 13, 45, 8, y))
    // temas bölgesi işaretleri
    const tdz: [number, number][] = [
      [150, 3],
      [300, 3],
      [550, 2],
      [700, 2],
    ]
    for (const [d, n] of tdz)
      for (let k = 0; k < n; k++) for (const s of [-1, 1]) marks.push(flatRect(th + inward * d, s * (9.9 + k * 3.3), 22.5, 1.8, y))
  }
  // kenar çizgileri
  for (const s of [-1, 1]) marks.push(flatRect(0, s * (RWY.halfWidth - 0.45), len, 0.9, y))
  // merkez hattı: 30 m çizgi, 20 m boşluk
  for (let x = -RWY.half + 75; x < RWY.half - 90; x += 50) marks.push(flatRect(x + 15, 0, 30, 0.9, y))
  const paint = new THREE.MeshStandardMaterial({ color: '#f4f5f0', roughness: 0.75, polygonOffset: true, polygonOffsetFactor: -2 })
  const markMesh = new THREE.Mesh(mergeGeometries(marks), paint)
  markMesh.receiveShadow = true
  group.add(markMesh)

  // pist numaraları
  for (const [text, end] of [
    ['04', -1],
    ['22', 1],
  ] as const) {
    const g = new THREE.PlaneGeometry(6.2, 9)
    g.rotateX(-Math.PI / 2)
    g.rotateY(end === -1 ? -Math.PI / 2 : Math.PI / 2)
    const tex = runwayNumberTexture(text)
    const mesh = new THREE.Mesh(
      g,
      new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: 0.75, polygonOffset: true, polygonOffsetFactor: -2 }),
    )
    mesh.position.set(end * (RWY.half - 54), y, 0)
    group.add(mesh)
  }

  /* ---------- Taksi yolu, apron, binalar ---------- */
  const taxiTex = asphaltTexture(9, 68)
  taxiTex.repeat.set(4, 20)
  const taxiMat = new THREE.MeshStandardMaterial({ map: taxiTex, roughness: 0.95 })
  const ap = LAYOUT.apron
  const taxiLen = -(ap.z + ap.d / 2) - (RWY.halfWidth + RWY.shoulder)
  const taxiGeo = mergeGeometries([
    flatRect(LAYOUT.taxiway.x, -(RWY.halfWidth + RWY.shoulder) - taxiLen / 2, 23, taxiLen + 2, 0.05),
    flatRect(ap.x, ap.z, ap.w, ap.d, 0.05),
  ])
  const taxi = new THREE.Mesh(taxiGeo, taxiMat)
  taxi.receiveShadow = true
  group.add(taxi)

  const yellow = new THREE.MeshStandardMaterial({ color: '#f2c230', roughness: 0.7, polygonOffset: true, polygonOffsetFactor: -2 })
  const ymarks: THREE.BufferGeometry[] = [
    flatRect(LAYOUT.taxiway.x, -(RWY.halfWidth + RWY.shoulder) - taxiLen / 2, 0.3, taxiLen, 0.08),
    // apron park yeri çizgileri
    flatRect(ap.x, ap.z + 10, ap.w - 20, 0.3, 0.08),
    ...[-90, 0, 90].map((dx) => flatRect(ap.x + dx, ap.z - 15, 0.3, 50, 0.08)),
  ]
  // bekleme noktası işareti (iki düz + iki kesikli çizgi)
  const hz = LAYOUT.holdLine
  ymarks.push(flatRect(LAYOUT.taxiway.x, hz - 0.9, 21, 0.3, 0.08), flatRect(LAYOUT.taxiway.x, hz - 0.3, 21, 0.3, 0.08))
  for (let i = -5; i <= 5; i++) {
    ymarks.push(flatRect(LAYOUT.taxiway.x + i * 2, hz + 0.6, 1, 0.3, 0.08), flatRect(LAYOUT.taxiway.x + i * 2, hz + 1.2, 1, 0.3, 0.08))
  }
  group.add(new THREE.Mesh(mergeGeometries(ymarks), yellow))

  // Pist bekleme tabelası "04-22" ve konum tabelası "A"
  const signTex = signTexture([
    { text: 'A', kind: 'loc' },
    { text: '04-22', kind: 'hold' },
  ])
  const sign = new THREE.Group()
  const face = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 1.2), new THREE.MeshStandardMaterial({ map: signTex, roughness: 0.6, emissive: '#ffffff', emissiveMap: signTex, emissiveIntensity: 0 }))
  face.position.set(0, 1.25, -0.16)
  face.rotation.y = Math.PI // apron tarafına (−z) bakar
  const box = new THREE.Mesh(new THREE.BoxGeometry(3.7, 1.3, 0.3), new THREE.MeshStandardMaterial({ color: '#2c2f33' }))
  box.position.y = 1.25
  sign.add(box, face)
  for (const lx of [-1.3, 1.3]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.6), box.material)
    leg.position.set(lx, 0.3, 0)
    sign.add(leg)
  }
  sign.position.set(LAYOUT.taxiway.x - 17, 0, hz - 2)
  group.add(sign)

  const wallMat = new THREE.MeshStandardMaterial({ color: '#d6dade', roughness: 0.85 })
  const roofMat = new THREE.MeshStandardMaterial({ color: '#8d969f', roughness: 0.7 })
  const glassMat = new THREE.MeshStandardMaterial({
    color: '#294b6b',
    roughness: 0.15,
    metalness: 0.6,
    emissive: new THREE.Color('#ffcf8a'),
    emissiveIntensity: 0,
  })
  const addBox = (w: number, h: number, d: number, x: number, yy: number, z: number, mat: THREE.Material) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat)
    m.position.set(x, yy, z)
    m.castShadow = true
    m.receiveShadow = true
    group.add(m)
    return m
  }
  const tm = LAYOUT.terminal
  addBox(130, 11, 34, tm.x, 5.5, tm.z, wallMat)
  addBox(136, 1.2, 40, tm.x, 11.6, tm.z, roofMat)
  addBox(118, 6, 0.4, tm.x, 5, tm.z + 17.1, glassMat)
  // İtfaiye (ARFF) binası, kırmızı kapılarla
  addBox(36, 8, 18, -120, 4, -205, wallMat)
  const doorMat = new THREE.MeshStandardMaterial({ color: '#b3261e', roughness: 0.6 })
  for (let i = 0; i < 3; i++) addBox(8, 5.5, 0.3, -132 + i * 12, 2.75, -195.9, doorMat)
  // Hangar
  const hangarRoof = new THREE.Mesh(new THREE.CylinderGeometry(24, 24, 50, 24, 1, false, 0, Math.PI), roofMat)
  hangarRoof.rotation.z = Math.PI / 2
  hangarRoof.rotation.y = Math.PI / 2
  hangarRoof.scale.set(1, 1, 0.45)
  hangarRoof.position.set(640, 6, -330)
  hangarRoof.castShadow = true
  group.add(hangarRoof)
  addBox(48, 6, 50, 640, 3, -330, wallMat)
  // Kontrol kulesi
  const tw = LAYOUT.tower
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 3.4, 26, 16), wallMat)
  shaft.position.set(tw.x, 13, tw.z)
  shaft.castShadow = true
  group.add(shaft)
  const cab = new THREE.Mesh(new THREE.CylinderGeometry(5.6, 4.6, 4.6, 8), glassMat)
  cab.position.set(tw.x, 28.3, tw.z)
  group.add(cab)
  const cabBase = new THREE.Mesh(new THREE.CylinderGeometry(4.6, 3.2, 1.6, 8), wallMat)
  cabBase.position.set(tw.x, 25.2, tw.z)
  group.add(cabBase)
  const cabRoof = new THREE.Mesh(new THREE.CylinderGeometry(6.2, 6.2, 0.8, 8), roofMat)
  cabRoof.position.set(tw.x, 31, tw.z)
  group.add(cabRoof)
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 6), roofMat)
  mast.position.set(tw.x, 34.4, tw.z)
  group.add(mast)
  // Yol
  group.add(new THREE.Mesh(flatRect(tm.x - 20, -800, 14, 900, 0.04), taxiMat))

  /* ---------- Çevre çiti ---------- */
  const F = LAYOUT.fence
  const fencePosts: THREE.Vector3[] = []
  const edges: [number, number, number, number][] = [
    [F.x0, F.z0, F.x1, F.z0],
    [F.x1, F.z0, F.x1, F.z1],
    [F.x1, F.z1, F.x0, F.z1],
    [F.x0, F.z1, F.x0, F.z0],
  ]
  const fenceTex = fenceTexture()
  const fenceGeos: THREE.BufferGeometry[] = []
  for (const [ax, az, bx, bz] of edges) {
    const L = Math.hypot(bx - ax, bz - az)
    const n = Math.floor(L / 6)
    for (let i = 0; i <= n; i++) fencePosts.push(new THREE.Vector3(ax + ((bx - ax) * i) / n, 1.2, az + ((bz - az) * i) / n))
    const g = new THREE.PlaneGeometry(L, 2.4)
    const uv = g.attributes.uv as THREE.BufferAttribute
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * (L / 2.4), uv.getY(i))
    g.rotateY(-Math.atan2(bz - az, bx - ax))
    g.translate((ax + bx) / 2, 1.2, (az + bz) / 2)
    fenceGeos.push(g)
  }
  fenceTex.wrapS = fenceTex.wrapT = THREE.RepeatWrapping
  const fenceMesh = new THREE.Mesh(
    mergeGeometries(fenceGeos),
    new THREE.MeshStandardMaterial({ map: fenceTex, transparent: true, alphaTest: 0.3, side: THREE.DoubleSide, roughness: 0.6, metalness: 0.4 }),
  )
  group.add(fenceMesh)
  const posts = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.05, 0.05, 2.4, 5),
    new THREE.MeshStandardMaterial({ color: '#9aa1a8', metalness: 0.5, roughness: 0.5 }),
    fencePosts.length,
  )
  fencePosts.forEach((p, i) => {
    m4.makeTranslation(p.x, p.y, p.z)
    posts.setMatrixAt(i, m4)
  })
  group.add(posts)

  /* ---------- Rüzgâr tulumları ---------- */
  const sockTex = windsockTexture()
  const socks: THREE.Group[] = []
  for (const w of LAYOUT.windsocks) {
    const g = new THREE.Group()
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 6.5), new THREE.MeshStandardMaterial({ color: '#d0d4d8' }))
    pole.position.y = 3.25
    g.add(pole)
    const pivot = new THREE.Group()
    pivot.position.y = 6.3
    const coneGeo = new THREE.CylinderGeometry(0.22, 0.45, 3.6, 16, 1, true)
    coneGeo.rotateZ(Math.PI / 2) // +x yönünde uzanır
    coneGeo.translate(1.8, 0, 0)
    const cone = new THREE.Mesh(coneGeo, new THREE.MeshStandardMaterial({ map: sockTex, side: THREE.DoubleSide, roughness: 0.8 }))
    cone.castShadow = true
    pivot.add(cone)
    g.add(pivot)
    g.position.set(w.x, 0, w.z)
    g.userData.pivot = pivot
    group.add(g)
    socks.push(g)
  }

  /* ---------- Işıklar (geceleri parlar) ---------- */
  const glow = glowTexture()
  const lightSets: { points: THREE.Points; base: number }[] = []
  const addLights = (pts: number[], color: string, size: number, base = 0.08) => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3))
    const mat = new THREE.PointsMaterial({
      color,
      size,
      map: glow,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    })
    const p = new THREE.Points(geo, mat)
    group.add(p)
    lightSets.push({ points: p, base })
    return p
  }
  const edge: number[] = []
  for (let x = -RWY.half; x <= RWY.half + 0.1; x += 58.75) for (const s of [-1, 1]) edge.push(x, 0.45, s * (RWY.halfWidth + 1.5))
  addLights(edge, '#ffe9b0', 7.5)
  const green: number[] = []
  const red: number[] = []
  for (let z = -RWY.halfWidth; z <= RWY.halfWidth + 0.1; z += 3) {
    green.push(-RWY.half - 1, 0.35, z, RWY.half + 1, 0.35, z)
    if (Math.abs(z) > 6) red.push(-RWY.half - 3, 0.35, z, RWY.half + 3, 0.35, z)
  }
  addLights(green, '#5cff8a', 6)
  addLights(red, '#ff4a3d', 5.5)
  const approach: number[] = []
  for (let d = 60; d <= 420; d += 30) {
    approach.push(-RWY.half - d, 0.6, 0)
    if (d === 300) for (let z = -15; z <= 15; z += 3) approach.push(-RWY.half - d, 0.6, z)
  }
  addLights(approach, '#ffffff', 8)
  const taxiLights: number[] = []
  for (let z = -(RWY.halfWidth + RWY.shoulder) - 4; z > ap.z + ap.d / 2; z -= 15)
    for (const s of [-1, 1]) taxiLights.push(LAYOUT.taxiway.x + s * 12.5, 0.35, z)
  addLights(taxiLights, '#4f8dff', 5)
  const papi: number[] = []
  for (let i = 0; i < 4; i++) papi.push(-RWY.half + 400, 0.8, -(RWY.halfWidth + 15 + i * 9))
  addLights(papi.slice(0, 6), '#ff5a4d', 7, 0.25)
  addLights(papi.slice(6), '#ffffff', 7, 0.25)
  const floods: number[] = []
  for (let i = 0; i < 5; i++) floods.push(ap.x - 140 + i * 70, 18, ap.z - ap.d / 2 + 2)
  addLights(floods, '#ffd9a0', 22, 0)
  const cityPts = addLights(cityLights, '#ffb862', 16, 0)

  // apron projektör direkleri
  for (let i = 0; i < 5; i++) {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 18), roofMat)
    p.position.set(ap.x - 140 + i * 70, 9, ap.z - ap.d / 2 + 2)
    group.add(p)
  }

  const cityMat = city.material as THREE.MeshStandardMaterial
  const update = (night: number, wind: number, windDir: number, t: number) => {
    for (const s of lightSets) (s.points.material as THREE.PointsMaterial).opacity = s.base + (1 - s.base) * night
    ;(cityPts.material as THREE.PointsMaterial).opacity = night * 0.9
    glassMat.emissiveIntensity = night * 0.55
    cityMat.emissiveIntensity = night * 0.08
    ;(face.material as THREE.MeshStandardMaterial).emissiveIntensity = night * 0.6
    // rüzgâr tulumu: rüzgârın estiği yöne (rüzgârın geldiği yönün tersine) uzanır; 7,7 m/s'de tam yatay
    const toward = ((windDir + 180 - RWY.heading) * Math.PI) / 180
    const lift = Math.min(1, wind / 7.7)
    for (const s of socks) {
      const pivot = s.userData.pivot as THREE.Group
      pivot.rotation.set(0, -toward + Math.sin(t * 1.7 + s.position.x) * 0.05 * lift, 0)
      pivot.rotateZ(-(1 - lift) * 1.2 + Math.sin(t * 3.1) * 0.03)
    }
  }

  return { group, update }
}
