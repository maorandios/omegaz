import { inferBendHandedness, updateProfileGeometry } from './calculateProfilePoints'
import type { FoldedProfile, WizardStep } from './types'

/** Horizontal segments (bottom + top). */
export const SQUARE_WIDTH_SEGMENT_INDICES = [0, 2] as const
/** Vertical segments (left + right). */
export const SQUARE_HEIGHT_SEGMENT_INDICES = [1, 3] as const

export function isSquarePlateProfile(
  profile: FoldedProfile,
  templateId?: string | null,
): boolean {
  return (
    (templateId === 'square' || profile.plateConstraint === 'square') &&
    profile.segments.length === 4 &&
    profile.bends.length === 3
  )
}

export function squareWidthFromProfile(profile: FoldedProfile): number {
  return profile.segments[0]?.length ?? 40
}

export function squareHeightFromProfile(profile: FoldedProfile): number {
  return profile.segments[1]?.length ?? 40
}

export function applySquarePlateProfile(
  profile: FoldedProfile,
  width: number,
  height: number,
): FoldedProfile {
  const w = Math.max(0, width)
  const h = Math.max(0, height)

  const segments = profile.segments.map((s, i) => {
    if ((SQUARE_WIDTH_SEGMENT_INDICES as readonly number[]).includes(i)) {
      return { ...s, length: w }
    }
    if ((SQUARE_HEIGHT_SEGMENT_INDICES as readonly number[]).includes(i)) {
      return { ...s, length: h }
    }
    return s
  })

  const bends = profile.bends.map((b) => ({
    ...b,
    interiorAngle: 90,
    handedness: b.handedness ?? inferBendHandedness(b.angle),
  }))

  return updateProfileGeometry({ ...profile, segments, bends })
}

export function buildSquareWizardSteps(profile: FoldedProfile): WizardStep[] {
  if (profile.segments.length < 4) return []
  return [
    { type: 'segment', id: profile.segments[0].id },
    { type: 'segment', id: profile.segments[1].id },
  ]
}

/** Segment ids that share the same square dimension as `segmentId`. */
export function squarePairedSegmentIds(
  profile: FoldedProfile,
  segmentId: string,
): string[] {
  if (profile.plateConstraint !== 'square') return [segmentId]
  const idx = profile.segments.findIndex((s) => s.id === segmentId)
  if (idx < 0) return [segmentId]
  if ((SQUARE_WIDTH_SEGMENT_INDICES as readonly number[]).includes(idx)) {
    return [profile.segments[0].id, profile.segments[2].id]
  }
  if ((SQUARE_HEIGHT_SEGMENT_INDICES as readonly number[]).includes(idx)) {
    return [profile.segments[1].id, profile.segments[3].id]
  }
  return [segmentId]
}

export function isSquareSegmentActive(
  profile: FoldedProfile,
  activeItemId: string | null,
  segmentId: string,
): boolean {
  if (!activeItemId) return false
  if (profile.plateConstraint !== 'square') return activeItemId === segmentId
  const activeSeg = profile.segments.some((s) => s.id === activeItemId)
  if (!activeSeg) return activeItemId === segmentId
  return squarePairedSegmentIds(profile, activeItemId).includes(segmentId)
}

/** All four rectangle corners for angle labels (includes closing corner with no bend). */
export function getSquareCornerPairs(): {
  segInIndex: number
  segOutIndex: number
  /** Bend index at this corner, or null for the closing corner. */
  bendIndex: number | null
}[] {
  return [
    { segInIndex: 3, segOutIndex: 0, bendIndex: null },
    { segInIndex: 0, segOutIndex: 1, bendIndex: 0 },
    { segInIndex: 1, segOutIndex: 2, bendIndex: 1 },
    { segInIndex: 2, segOutIndex: 3, bendIndex: 2 },
  ]
}
