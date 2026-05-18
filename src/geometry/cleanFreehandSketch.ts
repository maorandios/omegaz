import {
  DEFAULT_SKETCH_TARGET_WIDTH_MM,
  MIN_SEGMENT_LENGTH_MM,
  SNAP_CARDINAL_ANGLES,
  SNAP_CARDINAL_TOLERANCE_DEG,
  SNAP_DIAGONAL_ANGLES,
  SNAP_DIAGONAL_TOLERANCE_DEG,
} from './constants'
import {
  inferBendHandedness,
  turnDeltaToInteriorAngle,
} from '@/geometry/calculateProfilePoints'
import type { Bend, Point2D, Segment } from './types'
import { createId } from './types'

function distance(a: Point2D, b: Point2D): number {
  return Math.hypot(b.x - a.x, b.y - a.y)
}

function resample(points: Point2D[], spacing: number): Point2D[] {
  if (points.length < 2) return points
  const result: Point2D[] = [points[0]]
  let carry = 0

  for (let i = 1; i < points.length; i++) {
    let a = points[i - 1]
    let b = points[i]
    let segLen = distance(a, b)
    if (segLen === 0) continue

    while (carry + segLen >= spacing) {
      const t = (spacing - carry) / segLen
      const p = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }
      result.push(p)
      a = p
      segLen = distance(a, b)
      carry = 0
    }
    carry += segLen
  }

  if (result[result.length - 1] !== points[points.length - 1]) {
    result.push(points[points.length - 1])
  }
  return result
}

function perpendicularDistance(point: Point2D, lineStart: Point2D, lineEnd: Point2D): number {
  const dx = lineEnd.x - lineStart.x
  const dy = lineEnd.y - lineStart.y
  const norm = Math.hypot(dx, dy)
  if (norm === 0) return distance(point, lineStart)
  return Math.abs(dy * point.x - dx * point.y + lineEnd.x * lineStart.y - lineEnd.y * lineStart.x) / norm
}

function rdp(points: Point2D[], epsilon: number): Point2D[] {
  if (points.length <= 2) return points

  let maxDist = 0
  let index = 0
  const end = points.length - 1

  for (let i = 1; i < end; i++) {
    const d = perpendicularDistance(points[i], points[0], points[end])
    if (d > maxDist) {
      maxDist = d
      index = i
    }
  }

  if (maxDist > epsilon) {
    const left = rdp(points.slice(0, index + 1), epsilon)
    const right = rdp(points.slice(index), epsilon)
    return [...left.slice(0, -1), ...right]
  }
  return [points[0], points[end]]
}

function normalizeAngleDeg(deg: number): number {
  let n = ((deg % 360) + 360) % 360
  if (n > 180) n -= 360
  return n
}

function nearestSnapAngle(deg: number, candidates: readonly number[]): number {
  const normalized = normalizeAngleDeg(deg)
  let best = candidates[0]
  let bestDiff = Infinity
  for (const snap of candidates) {
    for (const c of [snap, snap - 360, snap + 360]) {
      const diff = Math.abs(normalized - c)
      if (diff < bestDiff) {
        bestDiff = diff
        best = snap
      }
    }
  }
  return best
}

function diffToSnap(deg: number, snap: number): number {
  const normalized = normalizeAngleDeg(deg)
  return Math.min(
    Math.abs(normalized - snap),
    Math.abs(normalized - (snap - 360)),
    Math.abs(normalized - (snap + 360)),
  )
}

/**
 * Prefer horizontal/vertical; allow 45° only when the stroke is clearly diagonal.
 * Anything in-between defaults to the nearest H/V.
 */
function snapSketchDirectionAngle(deg: number): number {
  const normalized = normalizeAngleDeg(deg)

  for (const diagonal of SNAP_DIAGONAL_ANGLES) {
    if (diffToSnap(normalized, diagonal) <= SNAP_DIAGONAL_TOLERANCE_DEG) {
      return diagonal
    }
  }

  for (const cardinal of SNAP_CARDINAL_ANGLES) {
    if (diffToSnap(normalized, cardinal) <= SNAP_CARDINAL_TOLERANCE_DEG) {
      return cardinal
    }
  }

  return nearestSnapAngle(normalized, SNAP_CARDINAL_ANGLES)
}

/** Snap bend turns — prefer 90° corners; 45° only when unambiguous. */
function snapSketchBendAngle(turnDeg: number): number {
  const t = normalizeAngleDeg(turnDeg)
  const abs = Math.abs(t)

  if (abs >= 40 && abs <= 50) return t >= 0 ? 45 : -45
  if (abs >= 130 && abs <= 140) return t >= 0 ? 135 : -135
  if (abs >= 55 && abs <= 125) return t >= 0 ? 90 : -90
  if (abs >= 160) return t >= 0 ? 180 : -180

  return t >= 0 ? 90 : -90
}

/** Signed turn from one travel direction to the next (degrees, -180..180). */
function signedTurnDeg(fromDir: number, toDir: number): number {
  let d = toDir - fromDir
  while (d > 180) d -= 360
  while (d < -180) d += 360
  return d
}

/** Edge direction in profile math space (Y-up, matches ProfileCanvas). */
function edgeDirectionDeg(a: Point2D, b: Point2D, scale: number): number {
  const dx = (b.x - a.x) * scale
  const dy = -(b.y - a.y) * scale
  return snapSketchDirectionAngle((Math.atan2(dy, dx) * 180) / Math.PI)
}

function cornerPoints(points: Point2D[], minCornerDeg = 15): Point2D[] {
  if (points.length < 3) return points

  const corners: Point2D[] = [points[0]]
  for (let i = 1; i < points.length - 1; i++) {
    const a = points[i - 1]
    const b = points[i]
    const c = points[i + 1]
    const v1 = { x: b.x - a.x, y: b.y - a.y }
    const v2 = { x: c.x - b.x, y: c.y - b.y }
    const m1 = Math.hypot(v1.x, v1.y)
    const m2 = Math.hypot(v2.x, v2.y)
    if (m1 === 0 || m2 === 0) continue

    const dot = (v1.x * v2.x + v1.y * v2.y) / (m1 * m2)
    const angleDeg = (Math.acos(Math.max(-1, Math.min(1, dot))) * 180) / Math.PI
    if (Math.abs(180 - angleDeg) >= minCornerDeg) {
      corners.push(b)
    }
  }
  corners.push(points[points.length - 1])
  return corners
}

export function cleanFreehandSketch(
  rawPoints: Point2D[],
): Pick<{ segments: Segment[]; bends: Bend[] }, 'segments' | 'bends'> {
  if (rawPoints.length < 2) {
    return { segments: [], bends: [] }
  }

  const resampled = resample(rawPoints, 4)
  const simplified = rdp(resampled, 14)
  const corners = cornerPoints(simplified, 22)

  if (corners.length < 2) {
    return { segments: [], bends: [] }
  }

  const bounds = corners.reduce(
    (acc, p) => ({
      minX: Math.min(acc.minX, p.x),
      maxX: Math.max(acc.maxX, p.x),
      minY: Math.min(acc.minY, p.y),
      maxY: Math.max(acc.maxY, p.y),
    }),
    { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity },
  )

  const sketchWidth = Math.max(bounds.maxX - bounds.minX, 1)
  const scale = DEFAULT_SKETCH_TARGET_WIDTH_MM / sketchWidth

  const segments: Segment[] = []
  const bends: Bend[] = []

  const edgeDirs: number[] = []

  for (let i = 0; i < corners.length - 1; i++) {
    const a = corners[i]
    const b = corners[i + 1]
    const dx = (b.x - a.x) * scale
    const dy = -(b.y - a.y) * scale
    const length = Math.hypot(dx, dy)

    if (length < MIN_SEGMENT_LENGTH_MM) continue

    const dirDeg = edgeDirectionDeg(a, b, scale)
    edgeDirs.push(dirDeg)

    segments.push({
      id: createId('seg'),
      length: Math.round(length),
      angle: dirDeg,
      startPoint: { x: 0, y: 0 },
      endPoint: { x: 0, y: 0 },
    })
  }

  for (let i = 0; i < segments.length - 1; i++) {
    const turn = signedTurnDeg(edgeDirs[i], edgeDirs[i + 1])
    const bendAngle = snapSketchBendAngle(turn)
    bends.push({
      id: createId('bend'),
      angle: bendAngle,
      interiorAngle: turnDeltaToInteriorAngle(bendAngle),
      handedness: inferBendHandedness(bendAngle),
      betweenSegmentIds: [segments[i].id, segments[i + 1].id],
    })
  }

  return { segments, bends }
}
