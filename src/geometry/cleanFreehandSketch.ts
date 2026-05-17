import {
  DEFAULT_SKETCH_TARGET_WIDTH_MM,
  MIN_SEGMENT_LENGTH_MM,
  SNAP_ANGLES,
  SNAP_TOLERANCE_DEG,
} from './constants'
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

function snapDirectionAngle(deg: number): number {
  let normalized = ((deg % 360) + 360) % 360
  if (normalized > 180) normalized -= 360

  let best = normalized
  let bestDiff = Infinity
  for (const snap of SNAP_ANGLES) {
    const candidates = [snap, snap - 360, snap + 360]
    for (const c of candidates) {
      const diff = Math.abs(normalized - c)
      if (diff < bestDiff) {
        bestDiff = diff
        best = c
      }
    }
  }

  if (bestDiff <= SNAP_TOLERANCE_DEG) return best
  return normalized
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

  const resampled = resample(rawPoints, 3)
  const simplified = rdp(resampled, 10)
  const corners = cornerPoints(simplified, 12)

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

  for (let i = 0; i < corners.length - 1; i++) {
    const a = corners[i]
    const b = corners[i + 1]
    const dx = (b.x - a.x) * scale
    const dy = -(b.y - a.y) * scale
    const length = Math.hypot(dx, dy)

    if (length < MIN_SEGMENT_LENGTH_MM) continue

    const dirDeg = snapDirectionAngle((Math.atan2(-dy, dx) * 180) / Math.PI)

    segments.push({
      id: createId('seg'),
      length: Math.round(length),
      angle: dirDeg,
      startPoint: { x: 0, y: 0 },
      endPoint: { x: 0, y: 0 },
    })
  }

  for (let i = 0; i < segments.length - 1; i++) {
    const rawTurn = segments[i + 1].angle - segments[i].angle
    let bendAngle = ((rawTurn % 360) + 360) % 360
    if (bendAngle > 180) bendAngle = 360 - bendAngle
    const snapped = Math.round(snapDirectionAngle(bendAngle))
    bends.push({
      id: createId('bend'),
      angle: Math.max(1, snapped),
      betweenSegmentIds: [segments[i].id, segments[i + 1].id],
    })
  }

  return { segments, bends }
}
