import * as THREE from 'three'
import { buildScout, buildWorker, type DronePart } from '../sim/models/drones'
import { buildCell, buildTurbine } from '../sim/models/structures'

/*
  Hangar görüntüleyicisinin modelleri: 3D havalimanındaki gerçekçi modellerin aynısı, parçalarına ayrılabilir.
  explode 0..1: parçalar tanımlı yönlerine kayar; "radial" işaretli gruplarda her alt parça merkezden dışarı açılır.
*/

export type HangarModelId = 'scout' | 'guard' | 'worker' | 'cell' | 'turbine'
export type HeadId = 'pickup' | 'camera'

export type HangarModel = {
  group: THREE.Group
  parts: DronePart[]
  update: (t: number, dt: number, explode: number) => void
  setHead?: (h: HeadId) => void
}

function exploder(parts: DronePart[]) {
  for (const p of parts) {
    p.obj.userData.home = p.obj.position.clone()
    for (const c of p.obj.children) c.userData.home = c.position.clone()
  }
  return (explode: number) => {
    const k = explode * explode * (3 - 2 * explode)
    for (const p of parts) {
      p.obj.position.copy(p.obj.userData.home as THREE.Vector3).addScaledVector(p.explode, k)
      const radial = p.obj.userData.radial as number | undefined
      for (const c of p.obj.children) {
        const home = c.userData.home as THREE.Vector3
        const out = (c.userData.out as THREE.Vector3 | undefined) ?? (radial ? home.clone().setY(0).normalize().multiplyScalar(radial) : null)
        if (out) c.position.copy(home).addScaledVector(out, k)
      }
    }
  }
}

/** Hangarda pervaneler yavaş döner (kanatlar görünür, ürün fotoğrafı gibi) */
function spin(props: THREE.Object3D[], discs: THREE.Mesh[], dt: number, explode: number) {
  props.forEach((p, i) => {
    p.rotation.y += dt * (explode > 0.5 ? 0.4 : 1.1) * (i % 2 ? 1 : -1)
    p.visible = true
  })
  discs.forEach((d) => (d.visible = false))
}

export function buildHangarModel(id: HangarModelId): HangarModel {
  if (id === 'scout' || id === 'guard') {
    const m = buildScout(id, id === 'scout' ? 'KÂŞİF-1' : 'BEKÇİ')
    const ex = exploder(m.parts)
    return { group: m.group, parts: m.parts, update: (_t, dt, e) => (ex(e), spin(m.props, m.discs, dt, e)) }
  }
  if (id === 'worker') {
    const m = buildWorker('İŞÇİ')
    m.parts.find((p) => p.id === 'arms')!.obj.userData.radial = 0.16
    m.parts.find((p) => p.id === 'props')!.obj.userData.radial = 0.2
    const ex = exploder(m.parts)
    return {
      group: m.group,
      parts: m.parts,
      setHead: m.setHead,
      update: (_t, dt, e) => {
        ex(e)
        spin(m.props, m.discs, dt, e)
        m.updateHead?.(dt)
      },
    }
  }
  if (id === 'cell') {
    const m = buildCell()
    const ex = exploder(m.parts)
    return {
      group: m.group,
      parts: m.parts,
      update: (t, dt, e) => {
        ex(e)
        const open = Math.max(0, Math.sin(t * 0.5)) * (1 - Math.min(1, e * 2))
        m.lidL.rotation.z = open * 1.75
        m.lidR.rotation.z = -open * 1.75
        m.cups.rotation.y += dt * 5
        m.vane.rotation.y = Math.sin(t * 0.4) * 0.5
      },
    }
  }
  const m = buildTurbine()
  const ex = exploder(m.parts)
  return {
    group: m.group,
    parts: m.parts,
    update: (_t, dt, e) => {
      ex(e)
      m.rotor.rotation.y += dt * (e > 0.5 ? 0.25 : 1.3)
    },
  }
}
