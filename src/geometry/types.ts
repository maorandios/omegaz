import {
  defaultMaterialGrade,
  FABRICATION_MATERIAL_OTHER,
  isFabricationMaterialOption,
  normalizeFabricationFinish,
} from './constants'

export type AppStep =
  | 'sketch'
  | 'draw'
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
  /** Custom material name when material is Other. */
  materialCustom: string
  /** Alloy / grade designation (defaults from material; user may override). */
  grade: string
  thickness: number
  partLength: number
  quantity: number
  /** Request hem on plate edges. */
  hem: boolean
  checkerPlate: boolean
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
  /** Segment forced to screen-horizontal. Omega / channel use 0° (east); Z uses 180° (west). */
  horizontalSegmentIndex?: number
  /** Locked horizontal travel direction (default 0°). Z profile top flange uses 180°. */
  horizontalReferenceDeg?: number
  /** Polyline start (default 0,0). C / Z profiles set this for open layouts. */
  layoutOrigin?: Point2D
  /** Wizard + geometry constraints (e.g. square plate = 2 inputs, 90° corners). */
  plateConstraint?: 'square' | 'custom'
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
    materialCustom: '',
    grade: 'DX51D',
    thickness: 1.2,
    partLength: 1000,
    quantity: 1,
    hem: false,
    checkerPlate: false,
    finish: 'Mill Finish',
    notes: '',
  }
}

export function normalizeFabrication(fab: Partial<FabricationDetails>): FabricationDetails {
  const defaults = defaultFabrication()
  let material = typeof fab.material === 'string' ? fab.material : defaults.material
  let materialCustom =
    typeof fab.materialCustom === 'string' ? fab.materialCustom : defaults.materialCustom

  if (!isFabricationMaterialOption(material)) {
    const legacy = material.trim()
    if (legacy) materialCustom = materialCustom.trim() || legacy
    material = FABRICATION_MATERIAL_OTHER
  }

  const finish =
    typeof fab.finish === 'string'
      ? normalizeFabricationFinish(fab.finish)
      : defaults.finish

  let grade = typeof fab.grade === 'string' ? fab.grade : ''
  if (!grade.trim()) {
    grade = defaultMaterialGrade(material)
  }

  const notes = typeof fab.notes === 'string' ? fab.notes : defaults.notes

  return {
    ...defaults,
    ...fab,
    material,
    materialCustom,
    grade,
    finish,
    notes,
    hem: typeof fab.hem === 'boolean' ? fab.hem : defaults.hem,
    checkerPlate:
      typeof fab.checkerPlate === 'boolean' ? fab.checkerPlate : defaults.checkerPlate,
  }
}

export function getFabricationGrade(fab: Partial<FabricationDetails>): string {
  const normalized = normalizeFabrication(fab)
  return normalized.grade.trim() || '—'
}

export function createId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`
}

/** Deep copy so workflow edits never mutate project plates until explicit save. */
export function cloneFoldedProfile(profile: FoldedProfile): FoldedProfile {
  return JSON.parse(JSON.stringify(profile)) as FoldedProfile
}
