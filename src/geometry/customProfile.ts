import {
  directionAfterBend,
  inferBendHandedness,
  updateProfileGeometry,
} from './calculateProfilePoints'
import type { Bend, FoldedProfile } from './types'
import { createId } from './types'

export const CUSTOM_MAX_SEGMENTS = 10
export const CUSTOM_MIN_SEGMENTS = 2
export const CUSTOM_DEFAULT_SEGMENT_LENGTH = 50
export const CUSTOM_DEFAULT_INTERIOR_ANGLE = 90
/** 90° interior corner; same handedness as the default L start shape. */
export const CUSTOM_DEFAULT_TURN_DEG = -90

export function isCustomPlateProfile(
  profile: FoldedProfile,
  templateId?: string | null,
): boolean {
  return (
    (templateId === 'custom' || profile.plateConstraint === 'custom') &&
    profile.segments.length >= CUSTOM_MIN_SEGMENTS
  )
}

export function appendCustomSegment(profile: FoldedProfile): FoldedProfile | null {
  if (profile.segments.length >= CUSTOM_MAX_SEGMENTS) return null

  const laidOut = updateProfileGeometry(profile)
  const lastSeg = laidOut.segments[laidOut.segments.length - 1]
  if (!lastSeg) return null

  const turnDeg = CUSTOM_DEFAULT_TURN_DEG
  const newSegId = createId('seg')
  const newBend: Bend = {
    id: createId('bend'),
    angle: turnDeg,
    interiorAngle: CUSTOM_DEFAULT_INTERIOR_ANGLE,
    handedness: inferBendHandedness(turnDeg),
    betweenSegmentIds: [lastSeg.id, newSegId],
  }

  const newSeg = {
    id: newSegId,
    length: CUSTOM_DEFAULT_SEGMENT_LENGTH,
    angle: directionAfterBend(lastSeg.angle, turnDeg),
    startPoint: { x: 0, y: 0 },
    endPoint: { x: 0, y: 0 },
  }

  return updateProfileGeometry({
    ...laidOut,
    segments: [...laidOut.segments, newSeg],
    bends: [...laidOut.bends, newBend],
  })
}

export function removeCustomSegment(profile: FoldedProfile): FoldedProfile | null {
  if (profile.segments.length <= CUSTOM_MIN_SEGMENTS) return null

  return updateProfileGeometry({
    ...profile,
    segments: profile.segments.slice(0, -1),
    bends: profile.bends.slice(0, -1),
  })
}
