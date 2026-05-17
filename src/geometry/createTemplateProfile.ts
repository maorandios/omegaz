import type { Bend, FoldedProfile, Segment } from './types'
import { createId, defaultFabrication } from './types'
import { updateProfileGeometry } from './calculateProfilePoints'

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
  bendAngles: number[]
}

const TEMPLATES: Record<TemplateId, TemplateSpec> = {
  omega: {
    name: 'Omega Profile',
    segmentLengths: [40, 30, 50, 30, 40],
    bendAngles: [90, 90, 90, 90],
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

function buildSegmentsAndBends(lengths: number[], bendAngles: number[]): {
  segments: Segment[]
  bends: Bend[]
} {
  const segments: Segment[] = lengths.map((length) => ({
    id: createId('seg'),
    length,
    angle: 0,
    startPoint: { x: 0, y: 0 },
    endPoint: { x: 0, y: 0 },
  }))

  const bends: Bend[] = bendAngles.map((angle, i) => ({
    id: createId('bend'),
    angle,
    betweenSegmentIds: [segments[i].id, segments[i + 1].id],
  }))

  return { segments, bends }
}

export function createTemplateProfile(templateId: string): FoldedProfile {
  const spec = TEMPLATES[templateId as TemplateId] ?? TEMPLATES.custom
  const { segments, bends } = buildSegmentsAndBends(spec.segmentLengths, spec.bendAngles)

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
    bends,
    fabrication: {
      ...defaultFabrication(),
      partName: name,
    },
  }
  return updateProfileGeometry(profile)
}
