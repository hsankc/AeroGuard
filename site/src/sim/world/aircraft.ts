import * as THREE from 'three'
import { fuselageTexture, glowTexture } from './textures'

/*
  Dar gövdeli yolcu uçağı (A320 sınıfı ölçüler: 37,6 m boy, 35,8 m açıklık) ve
  ADS-B senaryosu için helikopter. Genel boya; gerçek bir havayolu markası kullanılmaz.
*/

function wing(span: number, rootChord: number, tipChord: number, sweep: number, thick: number) {
  const s = new THREE.Shape()
  s.moveTo(0, 0)
  s.lineTo(sweep, span)
  s.lineTo(sweep - tipChord, span)
  s.lineTo(-rootChord, 0)
  s.closePath()
  const g = new THREE.ExtrudeGeometry(s, { depth: thick, bevelEnabled: false })
  g.translate(0, 0, -thick / 2)
  return g
}

export function buildAirliner() {
  const g = new THREE.Group()
  const white = new THREE.MeshStandardMaterial({ color: '#f1f3f5', roughness: 0.4, metalness: 0.15 })
  const grey = new THREE.MeshStandardMaterial({ color: '#b9c0c8', roughness: 0.45, metalness: 0.4 })
  const navy = new THREE.MeshStandardMaterial({ color: '#0f1e33', roughness: 0.5 })
  const fus = new THREE.MeshStandardMaterial({ map: fuselageTexture(), roughness: 0.4, metalness: 0.15 })

  // gövde: burun ve kuyruk konisi olan dönel profil, x ekseni boyunca
  const prof: THREE.Vector2[] = []
  const L = 37.6
  for (let i = 0; i <= 40; i++) {
    const t = i / 40
    let r = 1.98
    if (t < 0.11) r = 1.98 * Math.sqrt(1 - Math.pow(1 - t / 0.11, 2))
    if (t > 0.72) r = 1.98 * (1 - Math.pow((t - 0.72) / 0.28, 1.6) * 0.82)
    prof.push(new THREE.Vector2(Math.max(0.05, r), t * L))
  }
  const fg = new THREE.LatheGeometry(prof, 32)
  fg.rotateZ(-Math.PI / 2)
  fg.translate(-L / 2, 0, 0)
  const body = new THREE.Mesh(fg, fus)
  body.position.y = 4.2
  body.castShadow = true
  g.add(body)

  // kanatlar
  for (const side of [-1, 1]) {
    const wg = wing(16.5, 6.2, 1.6, -5.6, 0.45)
    const w = new THREE.Mesh(wg, white)
    w.position.set(2.5, 3.2, 0)
    w.castShadow = true
    // şekil xy düzleminde (y = açıklık); x ekseni etrafında ±90° çevirince açıklık ±z yönüne yatar
    w.rotation.x = side * (Math.PI / 2 - 0.05) // 0,05 rad: hafif dihedral
    g.add(w)
    // motor
    const eng = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 0.9, 4.2, 20), grey)
    eng.rotation.z = Math.PI / 2
    eng.position.set(3.6, 2.4, side * 5.7)
    eng.castShadow = true
    g.add(eng)
    const intake = new THREE.Mesh(new THREE.CircleGeometry(0.95, 20), navy)
    intake.rotation.y = Math.PI / 2
    intake.position.set(5.72, 2.4, side * 5.7)
    g.add(intake)
    const pylon = new THREE.Mesh(new THREE.BoxGeometry(3, 0.8, 0.3), white)
    pylon.position.set(3.0, 3.0, side * 5.7)
    g.add(pylon)
    // yatay stabilizör
    const hs = new THREE.Mesh(wing(6.2, 3.6, 1.2, -3.2, 0.25), white)
    hs.rotation.set(side === 1 ? Math.PI / 2 : -Math.PI / 2, 0, 0)
    hs.position.set(-14.8, 5.0, 0)
    hs.castShadow = true
    g.add(hs)
    // ana iniş takımı
    const gear = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.5, 14), navy)
    gear.rotation.x = Math.PI / 2
    gear.position.set(-0.5, 0.55, side * 3.8)
    g.add(gear)
  }
  // dikey stabilizör
  const vs = new THREE.Shape()
  vs.moveTo(0, 0)
  vs.lineTo(-4.5, 6.2)
  vs.lineTo(-6.6, 6.2)
  vs.lineTo(-6.4, 0)
  vs.closePath()
  const vsg = new THREE.ExtrudeGeometry(vs, { depth: 0.3, bevelEnabled: false })
  vsg.translate(0, 0, -0.15)
  const fin = new THREE.Mesh(vsg, navy)
  fin.position.set(-11.6, 5.6, 0)
  fin.castShadow = true
  g.add(fin)
  const nose = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.4, 12), navy)
  nose.rotation.x = Math.PI / 2
  nose.position.set(13.5, 0.4, 0)
  g.add(nose)

  // seyir ışıkları
  const glow = glowTexture()
  const lights: THREE.Sprite[] = []
  for (const [c, z] of [
    ['#ff3b30', -17.9],
    ['#3dff7a', 17.9],
  ] as const) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: c, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }))
    s.scale.setScalar(2.4)
    s.position.set(-3, 3.4, z)
    g.add(s)
    lights.push(s)
  }
  // iniş ışıkları (burun ve kanat kökleri) ve gövde üstünde kırmızı çakar
  const landing: THREE.Sprite[] = []
  for (const [x, y, z, size] of [
    [18.6, 3.6, 0, 5.5],
    [4.5, 3.1, -3.2, 4],
    [4.5, 3.1, 3.2, 4],
  ] as const) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: '#fff6e0', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }))
    s.scale.setScalar(size)
    s.position.set(x, y, z)
    g.add(s)
    landing.push(s)
  }
  const beacon = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: '#ff2a1f', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }))
  beacon.scale.setScalar(4)
  beacon.position.set(-2, 6.4, 0)
  g.add(beacon)
  g.userData.beacon = beacon
  g.userData.landing = landing
  return { group: g, lights }
}

export function buildHelicopter() {
  const g = new THREE.Group()
  const red = new THREE.MeshStandardMaterial({ color: '#c8102e', roughness: 0.45, metalness: 0.2 })
  const white = new THREE.MeshStandardMaterial({ color: '#f1f3f5', roughness: 0.5 })
  const dark = new THREE.MeshStandardMaterial({ color: '#22272c', roughness: 0.5 })
  const glass = new THREE.MeshStandardMaterial({ color: '#203a55', roughness: 0.1, metalness: 0.7 })

  const cabin = new THREE.Mesh(new THREE.SphereGeometry(1.6, 20, 14), red)
  cabin.scale.set(1.9, 1, 1)
  cabin.castShadow = true
  g.add(cabin)
  const wind = new THREE.Mesh(new THREE.SphereGeometry(1.2, 16, 10, 0, Math.PI), glass)
  wind.rotation.y = -Math.PI / 2
  wind.position.set(1.6, 0.25, 0)
  wind.scale.set(1.2, 0.8, 1)
  g.add(wind)
  const boom = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.55, 6.5, 12), white)
  boom.rotation.z = Math.PI / 2
  boom.position.set(-5.4, 0.3, 0)
  g.add(boom)
  const fin = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.8, 0.15), red)
  fin.position.set(-8.6, 1.1, 0)
  g.add(fin)
  const tail = new THREE.Group()
  const tb = new THREE.Mesh(new THREE.BoxGeometry(0.18, 2.2, 0.06), dark)
  tail.add(tb)
  tail.position.set(-8.7, 1.1, 0.25)
  g.add(tail)
  const rotor = new THREE.Group()
  for (let i = 0; i < 4; i++) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.06, 0.35), dark)
    b.position.x = 2.7
    const h = new THREE.Group()
    h.rotation.y = (i * Math.PI) / 2
    h.add(b)
    rotor.add(h)
  }
  rotor.position.y = 2.0
  g.add(rotor)
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.6), dark)
  mast.position.y = 1.7
  g.add(mast)
  for (const s of [-1, 1]) {
    const skid = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 4.4), dark)
    skid.rotation.z = Math.PI / 2
    skid.position.set(0, -1.7, s * 1.2)
    g.add(skid)
  }
  return { group: g, rotor, tail }
}
