import * as THREE from 'three'
import { glowTexture } from './textures'
import { LAYOUT, RWY } from './layout'

/*
  Araçla pist denetimi (bugünkü uygulama): rüzgâr veya pencere yüzünden drone uçamadığında
  sarı "follow-me" aracı pisti baştan sona dolaşır. Hız ≈50 km/s, süre ≈6 dk.
*/
export class InspectionVehicle {
  group = new THREE.Group()
  private beacon: THREE.Sprite
  private path: THREE.Vector3[]
  private lengths: number[] = []
  private total = 0
  private start: number | null = null
  private readonly speed = 14

  constructor() {
    const body = new THREE.Mesh(new THREE.BoxGeometry(4.6, 1.3, 1.9), new THREE.MeshStandardMaterial({ color: '#f2c230', roughness: 0.5 }))
    body.position.y = 0.95
    body.castShadow = true
    const cab = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.8, 1.8), new THREE.MeshStandardMaterial({ color: '#1d1d1b', roughness: 0.3, metalness: 0.4 }))
    cab.position.set(-0.3, 1.9, 0)
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.15, 1.4), new THREE.MeshStandardMaterial({ color: '#ff9a1f', emissive: new THREE.Color('#ff9a1f'), emissiveIntensity: 1 }))
    bar.position.set(-0.3, 2.4, 0)
    this.beacon = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: '#ffa53a', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }))
    this.beacon.scale.setScalar(4)
    this.beacon.position.set(-0.3, 2.6, 0)
    for (const [x, z] of [
      [1.5, 1],
      [1.5, -1],
      [-1.5, 1],
      [-1.5, -1],
    ]) {
      const w = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.3, 14), new THREE.MeshStandardMaterial({ color: '#111' }))
      w.rotation.x = Math.PI / 2
      w.position.set(x, 0.42, z)
      this.group.add(w)
    }
    this.group.add(body, cab, bar, this.beacon)
    this.group.visible = false

    const apronEdge = LAYOUT.apron.z + LAYOUT.apron.d / 2
    const TX = LAYOUT.taxiway.x
    this.path = [
      new THREE.Vector3(TX + 20, 0, apronEdge - 10),
      new THREE.Vector3(TX + 6, 0, apronEdge + 5),
      new THREE.Vector3(TX + 6, 0, -20),
      new THREE.Vector3(TX - 20, 0, -10),
      new THREE.Vector3(-RWY.half + 30, 0, -10),
      new THREE.Vector3(-RWY.half + 10, 0, 0),
      new THREE.Vector3(-RWY.half + 30, 0, 10),
      new THREE.Vector3(RWY.half - 30, 0, 10),
      new THREE.Vector3(RWY.half - 10, 0, 0),
      new THREE.Vector3(RWY.half - 30, 0, -10),
      new THREE.Vector3(TX + 20, 0, -10),
      new THREE.Vector3(TX - 6, 0, -20),
      new THREE.Vector3(TX - 6, 0, apronEdge + 5),
      new THREE.Vector3(TX - 20, 0, apronEdge - 10),
    ]
    for (let i = 0; i < this.path.length - 1; i++) {
      const l = this.path[i].distanceTo(this.path[i + 1])
      this.lengths.push(l)
      this.total += l
    }
  }

  get duration() {
    return this.total / this.speed
  }

  get busy() {
    return this.start !== null
  }

  begin(clock: number) {
    this.start = clock
    this.group.visible = true
  }

  /** true döndürürse denetim bitti */
  update(clock: number, realT: number) {
    if (this.start === null) return false
    let d = (clock - this.start) * this.speed
    if (d >= this.total) {
      this.start = null
      this.group.visible = false
      return true
    }
    let i = 0
    while (i < this.lengths.length - 1 && d > this.lengths[i]) {
      d -= this.lengths[i]
      i++
    }
    const a = this.path[i]
    const b = this.path[i + 1]
    const k = Math.min(1, d / this.lengths[i])
    this.group.position.lerpVectors(a, b, k)
    this.group.rotation.y = -Math.atan2(b.z - a.z, b.x - a.x)
    ;(this.beacon.material as THREE.SpriteMaterial).opacity = Math.sin(realT * 9) > 0 ? 1 : 0.15
    return false
  }

  reset() {
    this.start = null
    this.group.visible = false
  }
}
