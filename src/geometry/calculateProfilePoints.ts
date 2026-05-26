import { buildSquareWizardSteps, isSquarePlateProfile } from './squareProfile'
import { normalizeFabrication } from './types'
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

/** Screen-horizontal travel (0° = east, parallel to bottom of viewport). */
export const HORIZONTAL_REFERENCE_DEG = 0

/** Signed turn from `fromDeg` to `toDeg` along the polyline (-180..180). */
export function turnBetweenDirections(fromDeg: number, toDeg: number): number {
  let delta = normalizeDirectionDeg(toDeg) - normalizeDirectionDeg(fromDeg)
  if (delta > 180) delta -= 360
  if (delta < -180) delta += 360
  return delta
}

/** Travel direction into a bend that yields `targetDirection` after `turnDeg`. */
export function directionBeforeBend(targetDirectionDeg: number, turnDeg: number): number {
  return normalizeDirectionDeg(targetDirectionDeg - turnDeg)
}

export function horizontalSegmentIndexForTemplate(templateId: string | null): number | undefined {
  if (templateId === 'omega') return 2
  if (templateId === 'channel') return 1
  if (templateId === 'z-profile') return 1
  if (templateId === 'zigzag') return 0
  if (templateId === 'gutter') return 2
  if (templateId === 'square') return 2
  if (templateId === 'c-profile') return 3
  if (templateId === 'apron') return 1
  if (templateId === 'wall-abutment') return 0
  if (templateId === 'valley-flashing') return 2
  if (templateId === 'ridge-cap') return 1
  return undefined
}

export function ensureHorizontalLock(
  profile: FoldedProfile,
  templateId: string | null,
): FoldedProfile {
  const idx = profile.horizontalSegmentIndex ?? horizontalSegmentIndexForTemplate(templateId)
  if (idx === undefined) return profile
  return updateProfileGeometry({ ...profile, horizontalSegmentIndex: idx })
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
  lockedHorizontalSegmentIndex?: number,
  layoutOrigin?: Point2D,
  horizontalLockDeg: number = HORIZONTAL_REFERENCE_DEG,
): { segments: Segment[]; bends: Bend[] } {
  if (segments.length === 0) return { segments: [], bends: [...bends] }

  const lockIdx = lockedHorizontalSegmentIndex
  const lockDir = normalizeDirectionDeg(horizontalLockDeg)
  const updatedBends = bends.map((b) => ensureBendFields(b))

  // Precompute travel direction for every segment.
  const directions: number[] = new Array(segments.length)
  for (let i = 0; i < updatedBends.length; i++) {
    updatedBends[i].angle = interiorAngleToSignedTurn(
      updatedBends[i].interiorAngle,
      updatedBends[i].handedness ?? 1,
    )
  }

  if (lockIdx !== undefined && lockIdx >= 0 && lockIdx < segments.length) {
    directions[lockIdx] = normalizeDirectionDeg(lockDir)
    for (let i = lockIdx; i < updatedBends.length; i++) {
      directions[i + 1] = directionAfterBend(directions[i], updatedBends[i].angle)
    }
    for (let i = lockIdx - 1; i >= 0; i--) {
      directions[i] = directionBeforeBend(directions[i + 1], updatedBends[i].angle)
    }
  } else {
    directions[0] = normalizeDirectionDeg(segments[0]?.angle ?? 0)
    for (let i = 0; i < updatedBends.length; i++) {
      directions[i + 1] = directionAfterBend(directions[i], updatedBends[i].angle)
    }
  }

  let current: Point2D = layoutOrigin ? { ...layoutOrigin } : { x: 0, y: 0 }
  const result: Segment[] = []
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i]
    const length = Math.max(seg.length, 0)
    const startPoint = { ...current }
    const endPoint = pointAtDirection(startPoint, length, directions[i])
    result.push({
      id: seg.id,
      length,
      angle: directions[i],
      startPoint,
      endPoint,
    })
    current = endPoint
  }

  return { segments: result, bends: updatedBends }
}

function syncProfileLayoutOrigin(profile: FoldedProfile): FoldedProfile {
  if (profile.layoutOrigin === undefined || profile.segments.length !== 5) {
    return profile
  }
  if (profile.name === 'Z Profile') {
    const topLip = profile.segments[0]?.length ?? 20
    const topFlange = profile.segments[1]?.length ?? 50
    const web = profile.segments[2]?.length ?? 100
    const bottomFlange = profile.segments[3]?.length ?? 50
    const bottomLip = profile.segments[4]?.length ?? 20
    return {
      ...profile,
      layoutOrigin: {
        x: topFlange + bottomFlange,
        y: -web - bottomLip + topLip,
      },
    }
  }
  const bottomLip = profile.segments[0]?.length ?? 20
  const bottomFlange = profile.segments[1]?.length ?? 50
  return {
    ...profile,
    layoutOrigin: { x: bottomFlange, y: -bottomLip },
  }
}

export function updateProfileGeometry(profile: FoldedProfile): FoldedProfile {
  const synced = syncProfileLayoutOrigin(profile)
  const { segments, bends } = calculateProfilePoints(
    synced.segments,
    synced.bends,
    synced.horizontalSegmentIndex,
    synced.layoutOrigin,
    synced.horizontalReferenceDeg ?? HORIZONTAL_REFERENCE_DEG,
  )
  return { ...synced, segments, bends }
}

export function buildWizardSteps(
  profile: FoldedProfile,
  templateId?: string | null,
): { type: 'segment' | 'bend'; id: string }[] {
  if (isSquarePlateProfile(profile, templateId)) {
    return buildSquareWizardSteps(profile)
  }
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
    fabrication: normalizeFabrication(profile.fabrication),
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
