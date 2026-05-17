import type { Bend, FoldedProfile, Point2D, Segment } from './types'

/**
 * Bend angle = interior turn at vertex (sheet-metal notation).
 * Walking the polyline: each bend adds to the travel direction (CCW positive).
 * Screen Y is flipped so positive angles turn upward on canvas.
 */
export function directionAfterBend(currentDirectionDeg: number, bendAngleDeg: number): number {
  return currentDirectionDeg + bendAngleDeg
}

export function pointAtDirection(
  start: Point2D,
  length: number,
  directionDeg: number,
): Point2D {
  const rad = (directionDeg * Math.PI) / 180
  return {
    x: start.x + length * Math.cos(rad),
    y: start.y - length * Math.sin(rad),
  }
}

export function calculateProfilePoints(
  segments: Pick<Segment, 'id' | 'length'>[],
  bends: Bend[],
): Segment[] {
  if (segments.length === 0) return []

  let direction = 0
  let current: Point2D = { x: 0, y: 0 }
  const result: Segment[] = []

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i]
    const length = Math.max(seg.length, 0)
    const startPoint = { ...current }
    const endPoint = pointAtDirection(startPoint, length, direction)

    result.push({
      id: seg.id,
      length,
      angle: direction,
      startPoint,
      endPoint,
    })

    current = endPoint

    if (i < bends.length) {
      direction = directionAfterBend(direction, bends[i].angle)
    }
  }

  return result
}

export function updateProfileGeometry(profile: FoldedProfile): FoldedProfile {
  const segments = calculateProfilePoints(profile.segments, profile.bends)
  return { ...profile, segments }
}

export function buildWizardSteps(profile: FoldedProfile): { type: 'segment' | 'bend'; id: string }[] {
  const steps: { type: 'segment' | 'bend'; id: string }[] = []
  profile.segments.forEach((seg, i) => {
    steps.push({ type: 'segment', id: seg.id })
    if (i < profile.bends.length) {
      steps.push({ type: 'bend', id: profile.bends[i].id })
    }
  })
  return steps
}

export function getBendVertexPoint(segments: Segment[], bendIndex: number): Point2D | null {
  if (bendIndex < 0 || bendIndex >= segments.length - 1) return null
  return { ...segments[bendIndex].endPoint }
}
