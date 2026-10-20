import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { LAYOUT } from './layout'

/** Pist dışı acil iniş noktaları: çimde kırmızı X işaretleri. */
export function buildEmergencyMarks() {
  const geos: THREE.BufferGeometry[] = []
  for (const p of LAYOUT.emergency) {
    for (const a of [Math.PI / 4, -Math.PI / 4]) {
      const g = new THREE.PlaneGeometry(10, 1.4)
      g.rotateX(-Math.PI / 2)
      g.rotateY(a)
      g.translate(p.x, 0.1, p.z)
      geos.push(g)
    }
    const ring = new THREE.RingGeometry(6.2, 7, 40)
    ring.rotateX(-Math.PI / 2)
    ring.translate(p.x, 0.1, p.z)
    geos.push(ring)
  }
  const mesh = new THREE.Mesh(
    mergeGeometries(geos),
    new THREE.MeshStandardMaterial({ color: '#d0342c', roughness: 0.7, emissive: new THREE.Color('#d0342c'), emissiveIntensity: 0.15, polygonOffset: true, polygonOffsetFactor: -2 }),
  )
  mesh.receiveShadow = true
  return mesh
}

/** Sanal sınır: pist şeridi ve istasyon koridorlarını kapsayan, 30 m tavanlı kutu. */
export class Geofence {
  group = new THREE.Group()
  private faces: THREE.Mesh
  private edges: THREE.LineSegments
  private alert = 0

  constructor() {
    const G = LAYOUT.geofence
    const w = G.x1 - G.x0
    const d = G.z1 - G.z0
    const box = new THREE.BoxGeometry(w, G.ceiling, d)
    box.translate((G.x0 + G.x1) / 2, G.ceiling / 2, (G.z0 + G.z1) / 2)
    this.faces = new THREE.Mesh(
      box,
      new THREE.MeshBasicMaterial({ color: '#ffc72c', transparent: true, opacity: 0.035, depthWrite: false, side: THREE.DoubleSide }),
    )
    this.edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(box),
      new THREE.LineBasicMaterial({ color: '#ffc72c', transparent: true, opacity: 0.55 }),
    )
    this.group.add(this.faces, this.edges)
  }

  setAlert(on: boolean) {
    this.alert = on ? 1 : 0
  }

  setVisible(v: boolean) {
    this.group.visible = v
  }

  update(t: number) {
    const fm = this.faces.material as THREE.MeshBasicMaterial
    const em = this.edges.material as THREE.LineBasicMaterial
    if (this.alert) {
      const pulse = 0.5 + 0.5 * Math.sin(t * 10)
      fm.color.set('#ff3b30')
      em.color.set('#ff3b30')
      fm.opacity = 0.05 + pulse * 0.1
      em.opacity = 0.6 + pulse * 0.4
    } else {
      fm.color.set('#ffc72c')
      em.color.set('#ffc72c')
      fm.opacity = 0.035
      em.opacity = 0.5
    }
  }
}
