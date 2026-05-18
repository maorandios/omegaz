import type { Bend, FoldedProfile, Segment } from './types'
import { createId, defaultFabrication } from './types'
import {
  inferBendHandedness,
  turnDeltaToInteriorAngle,
  updateProfileGeometry,
} from './calculateProfilePoints'

type TemplateId =
  | 'omega'
  | 'channel'
  | 'gutter'
  | 'z-profile'
  | 'l-angle'
  | 'u-profile'
  | 'square'
  | 'custom'

interface TemplateSpec {
  name: string
  segmentLengths: number[]
  /** Polyline turn at each bend (seeds interiorAngle + handedness). */
  bendAngles: number[]
  /** First segment travel direction (degrees). Default 0 = east. */
  startDirectionDeg?: number
}

const TEMPLATES: Record<TemplateId, TemplateSpec> = {
  omega: {
    name: 'Omega Profile',
    segmentLengths: [40, 40, 40, 40, 40],
    /** Up at left web, across crown, down right web, out bottom flange. */
    bendAngles: [90, 270, 270, 90],
  },
  channel: {
    name: 'Channel',
    segmentLengths: [60, 40, 60],
    bendAngles: [90, 90],
  },
  gutter: {
    name: 'Gutter',
    segmentLengths: [50, 35, 50, 25],
    bendAngles: [90, 90, 90],
  },
  'z-profile': {
    name: 'Z Profile',
    segmentLengths: [40, 30, 40],
    bendAngles: [90, 90],
  },
  'l-angle': {
    name: 'L Angle',
    segmentLengths: [50, 50],
    bendAngles: [90],
    /** Down, then bend right — reads as letter L (not └). */
    startDirectionDeg: 270,
  },
  'u-profile': {
    name: 'U Profile',
    segmentLengths: [30, 50, 30],
    bendAngles: [90, 90],
  },
  square: {
    name: 'Square',
    segmentLengths: [40, 40, 40, 40],
    bendAngles: [90, 90, 90],
  },
  custom: {
    name: 'Custom Folded Profile',
    segmentLengths: [50, 50],
    bendAngles: [90],
  },
}

function buildSegmentsAndBends(
  lengths: number[],
  bendAngles: number[],
  startDirectionDeg = 0,
): {
  segments: Segment[]
  bends: Bend[]
} {
  const segments: Segment[] = lengths.map((length, i) => ({
    id: createId('seg'),
    length,
    angle: i === 0 ? startDirectionDeg : 0,
    startPoint: { x: 0, y: 0 },
    endPoint: { x: 0, y: 0 },
  }))

  const bends: Bend[] = bendAngles.map((angle, i) => ({
    id: createId('bend'),
    angle,
    interiorAngle: turnDeltaToInteriorAngle(angle),
    handedness: inferBendHandedness(angle),
    betweenSegmentIds: [segments[i].id, segments[i + 1].id],
  }))

  return { segments, bends }
}

export function createTemplateProfile(templateId: string): FoldedProfile {
  const spec = TEMPLATES[templateId as TemplateId] ?? TEMPLATES.custom
  const { segments, bends } = buildSegmentsAndBends(
    spec.segmentLengths,
    spec.bendAngles,
    spec.startDirectionDeg ?? 0,
  )

  const profile: FoldedProfile = {
    id: createId('profile'),
    name: spec.name,
    unit: 'mm',
    segments,
    bends,
    fabrication: {
      ...defaultFabrication(),
      partName: spec.name,
    },
  }

  return updateProfileGeometry(profile)
}

export function createProfileFromSketch(
  segments: Segment[],
  bends: Bend[],
  name = 'Sketched Profile',
): FoldedProfile {
  const profile: FoldedProfile = {
    id: createId('profile'),
    name,
    unit: 'mm',
    segments,
    bends: bends.map((b) => ({
      ...b,
      interiorAngle:
        Number.isFinite(b.interiorAngle) && b.interiorAngle > 0
          ? b.interiorAngle
          : turnDeltaToInteriorAngle(b.angle),
      handedness: b.handedness ?? inferBendHandedness(b.angle),
    })),
    fabrication: {
      ...defaultFabrication(),
      partName: name,
    },
  }
  return updateProfileGeometry(profile)
}
