import type { Bend, FoldedProfile, Point2D, Segment } from './types'

/** -180..180 */
export function normalizeAngleDeg(deg: number): number {
  let n = deg % 360
  if (n > 180) n -= 360
  if (n < -180) n += 360
  return n
}

/** 0..360 */
function normalizeDirectionDeg(deg: number): number {
  let n = deg % 360
  if (n < 0) n += 360
  return n
}

/** Smallest angle between two travel directions (0–180). */
export function angleBetweenDirections(a: number, b: number): number {
  let d = Math.abs(normalizeDirectionDeg(a) - normalizeDirectionDeg(b))
  if (d > 180) d = 360 - d
  return d
}

export function inferBendHandedness(turnDeg: number): 1 | -1 {
  const t = normalizeAngleDeg(turnDeg)
  if (t === 0) return 1
  return t > 0 ? 1 : -1
}

function clampInterior(deg: number): number {
  if (!Number.isFinite(deg)) return 90
  if (deg < 0) return 0
  if (deg > 180) return 180
  return deg
}

/**
 * Interior corner angle ↔ polyline turn:
 *   straight line (no fold) → interior = 180°, turn = 0°
 *   right angle             → interior =  90°, turn = 90°
 *   sharp 45° corner        → interior =  45°, turn = 135°
 *   folded back on itself   → interior =   0°, turn = 180°
 */
export function interiorAngleToSignedTurn(interiorDeg: number, handedness: 1 | -1): number {
  return handedness * (180 - clampInterior(interiorDeg))
}

/** Signed polyline turn → fabricator interior corner angle. */
export function turnDeltaToInteriorAngle(turnDeg: number): number {
  const t = Math.abs(normalizeAngleDeg(turnDeg))
  const interior = 180 - t
  return Math.round(interior * 10) / 10
}

export function getBendInteriorAngle(bend: Bend): number {
  if (Number.isFinite(bend.interiorAngle)) return clampInterior(bend.interiorAngle)
  return turnDeltaToInteriorAngle(bend.angle)
}

/** @deprecated */
export function interiorAngleToTurnDelta(interiorDeg: number): number {
  return interiorAngleToSignedTurn(interiorDeg, 1)
}

export function directionAfterBend(currentDirectionDeg: number, bendAngleDeg: number): number {
  return normalizeDirectionDeg(currentDirectionDeg + bendAngleDeg)
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

function ensureBendFields(bend: Bend): Bend {
  const interior =
    Number.isFinite(bend.interiorAngle) && bend.interiorAngle >= 0
      ? clampInterior(bend.interiorAngle)
      : turnDeltaToInteriorAngle(bend.angle)
  const handedness = bend.handedness ?? inferBendHandedness(bend.angle)
  return { ...bend, interiorAngle: interior, handedness }
}

/**
 * Folded strip layout: first segment keeps its bearing.
 * Each bend rotates direction by `handedness * (180 - interiorAngle)`.
 */
export function calculateProfilePoints(
  segments: Pick<Segment, 'id' | 'length' | 'angle'>[],
  bends: Bend[],
): { segments: Segment[]; bends: Bend[] } {
  if (segments.length === 0) return { segments: [], bends: [...bends] }

  const updatedBends = bends.map((b) => ensureBendFields(b))
  let direction = normalizeDirectionDeg(segments[0]?.angle ?? 0)
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

    if (i < updatedBends.length) {
      const bend = updatedBends[i]
      const turn = interiorAngleToSignedTurn(
        bend.interiorAngle,
        bend.handedness ?? 1,
      )
      bend.angle = turn
      direction = directionAfterBend(direction, turn)
    }
  }

  return { segments: result, bends: updatedBends }
}

export function updateProfileGeometry(profile: FoldedProfile): FoldedProfile {
  const { segments, bends } = calculateProfilePoints(profile.segments, profile.bends)
  return { ...profile, segments, bends }
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

/**
 * Saved profiles: re-derive interior from turn and handedness from turn sign.
 * Drops any legacy template-snapping fields.
 */
export function migrateProfileBends(profile: FoldedProfile): FoldedProfile {
  const migrated: FoldedProfile = {
    ...profile,
    bends: profile.bends.map((b) => {
      const handedness = b.handedness ?? inferBendHandedness(b.angle)
      const interior = turnDeltaToInteriorAngle(b.angle)
      return {
        id: b.id,
        angle: b.angle,
        interiorAngle: interior,
        handedness,
        betweenSegmentIds: b.betweenSegmentIds,
      }
    }),
  }
  if (migrated.segments.length > 0 && migrated.segments[0].angle === 225) {
    migrated.segments = migrated.segments.map((s, i) =>
      i === 0 ? { ...s, angle: 0 } : s,
    )
  }
  return updateProfileGeometry(migrated)
}

/** Back-compat no-op (older code paths called this). */
export function stampTemplateBendGeometry(profile: FoldedProfile): FoldedProfile {
  return profile
}
