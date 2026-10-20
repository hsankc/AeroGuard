import * as THREE from 'three'
import type { FodClass } from '../store'
import { RWY, SCAN_HALF_WIDTH } from './layout'

/* FOD nesneleri görünürlük için gerçek boyutun ≈4 katı modellenmiştir. */
export const FOD_SCALE = 4

export const FOD_LABEL: Record<FodClass | 'artifact', string> = {
  bolt: 'Cıvata',
  stone: 'Taş',
  plastic: 'Plastik parça',
  tire: 'Lastik parçası',
  artifact: 'Olası nesne',
}

function boltMesh() {
  const g = new THREE.Group()
  const steel = new THREE.MeshStandardMaterial({ color: '#c3cad1', metalness: 0.55, roughness: 0.35 })
  const head = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.013, 0.009, 6), steel)
  head.rotation.z = Math.PI / 2
  head.position.x = -0.028
  const shank = new THREE.Mesh(new THREE.CylinderGeometry(0.0055, 0.0055, 0.05, 10), steel)
  shank.rotation.z = Math.PI / 2
  g.add(head, shank)
  g.position.y = 0.012
  return g
}

function stoneMesh() {
  const geo = new THREE.IcosahedronGeometry(0.03, 1)
  const p = geo.attributes.position as THREE.BufferAttribute
  for (let i = 0; i < p.count; i++) {
    const k = 0.75 + ((Math.sin(i * 12.9898) * 43758.5453) % 1 + 1) % 1 * 0.5
    p.setXYZ(i, p.getX(i) * k, p.getY(i) * k * 0.6, p.getZ(i) * k)
  }
  geo.computeVertexNormals()
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: '#7d7466', roughness: 0.95, flatShading: true }))
  m.position.y = 0.015
  return m
}

function plasticMesh() {
  const geo = new THREE.PlaneGeometry(0.14, 0.09, 6, 4)
  const p = geo.attributes.position as THREE.BufferAttribute
  for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(i * 2.7) * 0.008)
  geo.rotateX(-Math.PI / 2)
  geo.computeVertexNormals()
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: '#e9eef2', roughness: 0.5, side: THREE.DoubleSide }))
  m.position.y = 0.01
  return m
}

function tireMesh() {
  const geo = new THREE.TorusGeometry(0.11, 0.022, 6, 16, 1.1)
  geo.rotateX(Math.PI / 2)
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: '#1b1c1e', roughness: 0.9 }))
  m.position.y = 0.012
  return m
}

const BUILDERS: Record<FodClass, () => THREE.Object3D> = { bolt: boltMesh, stone: stoneMesh, plastic: plasticMesh, tire: tireMesh }

export type FodItem = {
  id: number
  cls: FodClass
  x: number
  z: number
  obj: THREE.Group
  ring: THREE.Mesh
  detected: boolean
  status: 'none' | 'pending' | 'confirmed' | 'rejected'
}

const RING_COLOR = { none: '#ffffff', pending: '#ffb020', confirmed: '#ff3b30', rejected: '#8a96a5' }

export class FodField {
  group = new THREE.Group()
  items: FodItem[] = []
  private seq = 0
  private t = 0

  add(cls: FodClass, x: number, z: number) {
    const obj = new THREE.Group()
    const mesh = BUILDERS[cls]()
    mesh.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) o.castShadow = true
    })
    obj.add(mesh)
    obj.scale.setScalar(FOD_SCALE)
    obj.rotation.y = Math.random() * Math.PI * 2
    obj.position.set(x, 0.07, z)
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(1.1, 1.45, 40),
      new THREE.MeshBasicMaterial({ color: RING_COLOR.pending, transparent: true, opacity: 0.9, depthWrite: false, side: THREE.DoubleSide }),
    )
    ring.rotation.x = -Math.PI / 2
    ring.position.set(x, 0.16, z)
    ring.visible = false
    this.group.add(obj, ring)
    const item: FodItem = { id: ++this.seq, cls, x, z, obj, ring, detected: false, status: 'none' }
    this.items.push(item)
    return item
  }

  /** Rastgele nesneler: pist ve omuzlar içinde, uçlardaki eşik işaretlerinden uzakta. */
  randomize(n: number) {
    const classes: FodClass[] = ['bolt', 'plastic', 'stone', 'tire']
    for (let i = 0; i < n; i++) {
      const x = (Math.random() * 2 - 1) * (RWY.half - 120)
      const z = (Math.random() * 2 - 1) * (SCAN_HALF_WIDTH - 6)
      this.add(classes[i % classes.length], x, z)
    }
  }

  setStatus(id: number, status: FodItem['status']) {
    const it = this.items.find((i) => i.id === id)
    if (!it) return
    it.status = status
    it.ring.visible = status !== 'none'
    ;(it.ring.material as THREE.MeshBasicMaterial).color.set(RING_COLOR[status])
  }

  /** Saha ekibi nesneyi kaldırdı */
  remove(id: number) {
    const it = this.items.find((i) => i.id === id)
    if (!it) return
    this.group.remove(it.obj, it.ring)
    it.ring.geometry.dispose()
    this.items = this.items.filter((i) => i !== it)
  }

  clear() {
    for (const it of this.items) {
      this.group.remove(it.obj, it.ring)
      it.ring.geometry.dispose()
    }
    this.items = []
  }

  resetDetections() {
    for (const it of this.items) {
      it.detected = false
      this.setStatus(it.id, 'none')
    }
  }

  update(dt: number) {
    this.t += dt
    const s = 1 + Math.sin(this.t * 4) * 0.12
    for (const it of this.items) if (it.ring.visible) it.ring.scale.setScalar(it.status === 'pending' ? s : 1)
  }
}
