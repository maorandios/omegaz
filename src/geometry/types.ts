export type AppStep =
  | 'sketch'
  | 'segment-wizard'
  | 'fabrication'
  | 'summary'
  | 'export'

export interface Point2D {
  x: number
  y: number
}

export interface Segment {
  id: string
  length: number
  angle: number
  startPoint: Point2D
  endPoint: Point2D
}

export interface Bend {
  id: string
  /** Signed polyline turn used for layout (computed = handedness × (180 − interior)). */
  angle: number
  /** Fabricator interior corner angle — what the user types (0–180, 90° = right angle). */
  interiorAngle: number
  /** Bend direction (CW/CCW). Set once from the template / sketch; preserved across edits. */
  handedness?: 1 | -1
  betweenSegmentIds: [string, string]
}

export interface FabricationDetails {
  partName: string
  material: string
  thickness: number
  partLength: number
  quantity: number
  finish: string
  notes: string
}

export interface FoldedProfile {
  id: string
  name: string
  unit: 'mm'
  segments: Segment[]
  bends: Bend[]
  fabrication: FabricationDetails
}

export type WizardItemType = 'segment' | 'bend'

export interface WizardStep {
  type: WizardItemType
  id: string
}

export const FLAT_WIDTH_DISCLAIMER =
  'Flat width is geometrical estimate only. Final bend deduction/tooling compensation should be verified by the fabricator.'

export const FLAT_WIDTH_LABEL = 'Estimated Geometrical Flat Width'

export function defaultFabrication(): FabricationDetails {
  return {
    partName: '',
    material: 'Galvanized Steel',
    thickness: 1.2,
    partLength: 1000,
    quantity: 1,
    finish: 'Raw',
    notes: '',
  }
}

export function createId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`
}
