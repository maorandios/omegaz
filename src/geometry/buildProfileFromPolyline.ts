import { MIN_SEGMENT_LENGTH_MM } from './constants'
import {
  inferBendHandedness,
  turnDeltaToInteriorAngle,
} from './calculateProfilePoints'
import type { Bend, Point2D, Segment } from './types'
import { createId } from './types'

/**
 * Grid-tap drawing uses a fixed real-world scale: one grid cell = this many
 * millimetres. Tapping a 5-cell-long edge yields a 50mm segment, which feels
 * intuitive and is easy to tweak in the wizard afterwards.
 */
export const DRAW_GRID_CELL_MM = 10

function signedTurnDeg(fromDir: number, toDir: number): number {
  let d = toDir - fromDir
  while (d > 180) d -= 360
  while (d < -180) d += 360
  return d
}

/**
 * Build a folded-profile-compatible {segments, bends} pair from an explicit
 * polyline. Unlike cleanFreehandSketch this trusts the input vertices exactly
 * (they came from snapped grid taps), so we skip resampling / RDP / corner
 * detection and just walk the polyline.
 *
 * `pixelsPerCell` lets the caller convert canvas-space distances to grid cells
 * so that the real-world mm length is independent of the screen's grid pitch.
 */
export function buildProfileFromPolylineGeometry(
  points: Point2D[],
  pixelsPerCell: number,
): { segments: Segment[]; bends: Bend[] } {
  if (points.length < 2 || pixelsPerCell <= 0) {
    return { segments: [], bends: [] }
  }

  const mmPerPixel = DRAW_GRID_CELL_MM / pixelsPerCell

  const segments: Segment[] = []
  const edgeDirs: number[] = []

  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i]
    const b = points[i + 1]
    const dxPx = b.x - a.x
    // Flip Y because canvas y-down vs profile-math y-up.
    const dyPx = -(b.y - a.y)
    const lengthMm = Math.hypot(dxPx, dyPx) * mmPerPixel
    if (lengthMm < MIN_SEGMENT_LENGTH_MM) continue

    const dirDeg = (Math.atan2(dyPx, dxPx) * 180) / Math.PI
    edgeDirs.push(dirDeg)

    segments.push({
      id: createId('seg'),
      length: Math.max(MIN_SEGMENT_LENGTH_MM, Math.round(lengthMm)),
      angle: dirDeg,
      startPoint: { x: 0, y: 0 },
      endPoint: { x: 0, y: 0 },
    })
  }

  const bends: Bend[] = []
  for (let i = 0; i < segments.length - 1; i++) {
    const rawTurn = signedTurnDeg(edgeDirs[i], edgeDirs[i + 1])
    // Vertices are at exact grid intersections so the turn is already a
    // clean multiple of 45°. Snap to the nearest 5° anyway to guard against
    // floating-point drift.
    const turn = Math.round(rawTurn / 5) * 5
    bends.push({
      id: createId('bend'),
      angle: turn,
      interiorAngle: turnDeltaToInteriorAngle(turn),
      handedness: inferBendHandedness(turn),
      betweenSegmentIds: [segments[i].id, segments[i + 1].id],
    })
  }

  return { segments, bends }
}
