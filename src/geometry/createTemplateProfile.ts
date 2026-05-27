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
  | 'apron'
  | 'wall-abutment'
  | 'valley-flashing'
  | 'ridge-cap'
  | 'barge-verge'
  | 'drip-edge-tray'
  | 'eaves-flashing'
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
    /** Top horizontal → vertical down → bottom horizontal (stepped Z). */
    segmentLengths: [100, 100, 100],
    bendAngles: [-90, 90],
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
  apron: {
    name: 'Apron Flashing',
    /** Vertical leg down → horizontal apron → short 45° drip flap. */
    segmentLengths: [100, 150, 20],
    bendAngles: [90, -45],
    startDirectionDeg: 270,
  },
  'wall-abutment': {
    name: 'Wall Abutment',
    /** Bottom foot ← up the wall → top deck → short return → tiny hook. */
    segmentLengths: [50, 150, 120, 20, 15],
    bendAngles: [-90, -90, -90, -90],
    startDirectionDeg: 180,
  },
  'valley-flashing': {
    name: 'Valley Flashing',
    /** Symmetric V: outward drip hem → down the left slope → 40mm channel → up the right slope → outward drip hem. */
    segmentLengths: [25, 250, 40, 250, 25],
    bendAngles: [-45, 45, 45, -45],
    startDirectionDeg: 0,
  },
  'ridge-cap': {
    name: 'Ridge Cap',
    /** Symmetric tent: drip up → foot in → slope to peak → slope down → foot out → drip down. */
    segmentLengths: [10, 15, 140, 140, 15, 10],
    bendAngles: [-90, 60, -120, 60, -90],
    startDirectionDeg: 90,
  },
  'barge-verge': {
    name: 'Barge / Verge Board',
    /** Foot out → up the verge → horizontal barge → 45° drip (like apron + bottom foot). */
    segmentLengths: [15, 100, 150, 15],
    bendAngles: [90, -90, -45],
    startDirectionDeg: 0,
  },
  'drip-edge-tray': {
    name: 'Drip Edge / Tray',
    /** Tray lip across → down the face → short 45° drip outward (down-right). */
    segmentLengths: [80, 60, 20],
    bendAngles: [-90, 45],
    startDirectionDeg: 0,
  },
  'eaves-flashing': {
    name: 'Eaves flashing',
    /** Sloped top lip → vertical drop → short outward 45° drip. */
    segmentLengths: [120, 60, 20],
    bendAngles: [-85, 45],
    startDirectionDeg: 355,
  },
  'external-corner': {
    name: 'External Corner Trim',
    /** Top return → down wall → along soffit → small downstand. */
    segmentLengths: [15, 120, 120, 15],
    bendAngles: [-90, 90, -90],
    startDirectionDeg: 0,
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
    ...(templateId === 'eaves-flashing'
      ? {
          horizontalReferenceDeg: 270 as const,
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
