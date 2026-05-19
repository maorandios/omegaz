import type { Bend, FoldedProfile, Segment } from './types'
import { createId, defaultFabrication } from './types'
import {
  horizontalSegmentIndexForTemplate,
  inferBendHandedness,
  turnDeltaToInteriorAngle,
  updateProfileGeometry,
} from './calculateProfilePoints'

type TemplateId =
  | 'omega'
  | 'channel'
  | 'gutter'
  | 'z-profile'
  | 'zigzag'
  | 'l-angle'
  | 'square'
  | 'c-profile'
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
    name: 'Hat',
    segmentLengths: [40, 40, 40, 40, 40],
    /** Up at left web, across crown, down right web, out bottom flange. */
    bendAngles: [90, 270, 270, 90],
  },
  channel: {
    name: 'Channel',
    /** Left web up → top flange → right web down (opening at bottom, like ∩). */
    segmentLengths: [50, 50, 50],
    bendAngles: [-90, -90],
    startDirectionDeg: 90,
  },
  gutter: {
    name: 'Gutter',
    /** Inward hem → wall down → floor → step up → top flange (floor parallel to screen bottom). */
    segmentLengths: [20, 200, 200, 100, 70],
    bendAngles: [90, 90, 90, -90],
    startDirectionDeg: 180,
  },
  'z-profile': {
    name: 'Z Profile',
    /** Top lip down → top flange left → web → bottom flange left → bottom lip up. */
    segmentLengths: [20, 50, 100, 50, 20],
    bendAngles: [90, 90, -90, -90],
    startDirectionDeg: 90,
  },
  zigzag: {
    name: 'ZigZag',
    /** Top flange → diagonal web → bottom flange (matches zigzag icon). */
    segmentLengths: [57, 52, 57],
    bendAngles: [135, 45],
    startDirectionDeg: 0,
  },
  'l-angle': {
    name: 'L Angle',
    segmentLengths: [50, 50],
    bendAngles: [90],
    /** Down, then bend right — reads as letter L (not └). */
    startDirectionDeg: 270,
  },
  square: {
    name: 'Square',
    segmentLengths: [40, 40, 40, 40],
    bendAngles: [90, 90, 90],
  },
  'c-profile': {
    name: 'C Profile',
    /** Open C: bottom lip → bottom flange → back → top flange → top lip (gap on the right). */
    segmentLengths: [20, 50, 100, 50, 20],
    bendAngles: [-90, -90, -90, -90],
    startDirectionDeg: 270,
  },
  custom: {
    name: 'Custom Folded Profile',
    /** Default L: left leg up 50 → top leg right 50 (matches template preview). */
    segmentLengths: [50, 50],
    bendAngles: [-90],
    startDirectionDeg: 90,
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

  const horizontalSegmentIndex = horizontalSegmentIndexForTemplate(templateId)

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
    ...(horizontalSegmentIndex !== undefined ? { horizontalSegmentIndex } : {}),
    ...(templateId === 'square' ? { plateConstraint: 'square' as const } : {}),
    ...(templateId === 'custom' ? { plateConstraint: 'custom' as const } : {}),
    ...(templateId === 'c-profile'
      ? { layoutOrigin: { x: 50, y: -20 } as const }
      : {}),
    ...(templateId === 'z-profile'
      ? {
          layoutOrigin: { x: 100, y: -100 } as const,
          horizontalReferenceDeg: 180 as const,
        }
      : {}),
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
