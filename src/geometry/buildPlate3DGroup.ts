import * as THREE from 'three'
import type { FoldedProfile, Segment } from './types'

/** Map profile XY (screen-style) to Three.js: X right, Y up, Z = part length. */
function toThreeXY(p: { x: number; y: number }): THREE.Vector2 {
  return new THREE.Vector2(p.x, -p.y)
}

function createSegmentMesh(
  seg: Segment,
  thickness: number,
  partLength: number,
  material: THREE.MeshStandardMaterial,
): THREE.Mesh {
  const start = toThreeXY(seg.startPoint)
  const end = toThreeXY(seg.endPoint)
  const delta = end.clone().sub(start)
  const len = delta.length()
  if (len < 1e-6) return new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.01, 0.01), material)

  const mid = start.clone().add(end).multiplyScalar(0.5)
  const geometry = new THREE.BoxGeometry(len, thickness, partLength)
  const mesh = new THREE.Mesh(geometry, material)
  mesh.position.set(mid.x, mid.y, partLength / 2)
  mesh.rotation.z = Math.atan2(delta.y, delta.x)
  return mesh
}

/**
 * Bent strip: each profile leg extruded along Z by part length (cross-section in XY).
 */
function isMobileDevice(): boolean {
  if (typeof navigator === 'undefined') return false
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
}

export function buildPlate3DGroup(profile: FoldedProfile): THREE.Group {
  const thickness = Math.max(profile.fabrication.thickness, 0.1)
  const partLength = Math.max(profile.fabrication.partLength, 1)
  const lite = isMobileDevice()

  const material = new THREE.MeshStandardMaterial({
    color: 0xc4c4cc,
    metalness: 0.55,
    roughness: 0.4,
    side: THREE.DoubleSide,
  })

  const group = new THREE.Group()

  for (const seg of profile.segments) {
    const mesh = createSegmentMesh(seg, thickness, partLength, material)
    group.add(mesh)

    if (!lite) {
      const edgeMaterial = new THREE.LineBasicMaterial({ color: 0x52525b })
      const start = toThreeXY(seg.startPoint)
      const end = toThreeXY(seg.endPoint)
      const corners = [
        new THREE.Vector3(start.x, start.y, 0),
        new THREE.Vector3(start.x, start.y, partLength),
        new THREE.Vector3(end.x, end.y, partLength),
        new THREE.Vector3(end.x, end.y, 0),
        new THREE.Vector3(start.x, start.y, 0),
      ]
      const edgeGeo = new THREE.BufferGeometry().setFromPoints(corners)
      group.add(new THREE.Line(edgeGeo, edgeMaterial))
    }
  }

  return group
}
