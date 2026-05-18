/** Horizontal / vertical — preferred for freehand cleanup */
export const SNAP_CARDINAL_ANGLES = [0, 90, -90, 180] as const
/** Diagonals — only when the stroke is clearly intentional */
export const SNAP_DIAGONAL_ANGLES = [45, -45, 135, -135] as const
/** Within this range, wobbly strokes snap to H/V (degrees) */
export const SNAP_CARDINAL_TOLERANCE_DEG = 22
/** Tight range — only obvious 45° lines (degrees) */
export const SNAP_DIAGONAL_TOLERANCE_DEG = 6

/** @deprecated Use cardinal/diagonal tolerances above */
export const SNAP_ANGLES = [0, 45, 90, 135, 180] as const
export const SNAP_TOLERANCE_DEG = 7

export const MATERIAL_OPTIONS = [
  'Galvanized Steel',
  'Mild Steel',
  'Stainless Steel',
  'Aluminum',
  'Custom',
] as const

/** Materials shown on the fabrication form (no custom entry). */
export const FABRICATION_MATERIAL_OPTIONS = [
  'Galvanized Steel',
  'Mild Steel',
  'Stainless Steel',
  'Aluminum',
] as const

export type FabricationMaterial = (typeof FABRICATION_MATERIAL_OPTIONS)[number]

export const THICKNESS_OPTIONS = [0.8, 1.0, 1.2, 1.5, 2.0, 3.0] as const

export const FINISH_OPTIONS = ['Raw', 'Painted', 'Powder Coated', 'Galvanized', 'Custom'] as const

/** Finishes shown on the fabrication form (no custom entry). */
export const FABRICATION_FINISH_OPTIONS = ['Raw', 'Painted', 'Powder Coated', 'Galvanized'] as const

/** Max thickness (mm) for the fabrication slider. */
export const FABRICATION_THICKNESS_MAX_MM = 30

/** Max thickness (mm) per material for the fabrication slider. */
export const MATERIAL_THICKNESS_MAX_MM: Record<FabricationMaterial, number> = {
  'Galvanized Steel': FABRICATION_THICKNESS_MAX_MM,
  'Mild Steel': FABRICATION_THICKNESS_MAX_MM,
  'Stainless Steel': FABRICATION_THICKNESS_MAX_MM,
  Aluminum: FABRICATION_THICKNESS_MAX_MM,
}

/** 0.1–2 mm in 0.1 steps, then 3…max in 1 mm steps. */
export function buildThicknessSteps(maxMm: number): number[] {
  const steps: number[] = []
  for (let v = 0.1; v <= 2.001; v = Math.round((v + 0.1) * 10) / 10) {
    steps.push(Math.round(v * 10) / 10)
  }
  const cap = Math.max(2, Math.ceil(maxMm))
  for (let v = 3; v <= cap; v += 1) {
    if (v <= maxMm + 0.001) steps.push(v)
  }
  return steps
}

export function clampThicknessForMaterial(
  thickness: number,
  material: string,
): number {
  const max =
    MATERIAL_THICKNESS_MAX_MM[material as FabricationMaterial] ??
    MATERIAL_THICKNESS_MAX_MM['Galvanized Steel']
  const steps = buildThicknessSteps(max)
  if (steps.length === 0) return 1.2
  const clamped = Math.min(Math.max(thickness, steps[0]), steps[steps.length - 1])
  return steps.reduce((best, s) =>
    Math.abs(s - clamped) < Math.abs(best - clamped) ? s : best,
  steps[0])
}

export function defaultMaterialThickness(material: string): number {
  const max =
    MATERIAL_THICKNESS_MAX_MM[material as FabricationMaterial] ??
    MATERIAL_THICKNESS_MAX_MM['Galvanized Steel']
  const steps = buildThicknessSteps(max)
  const preferred = steps.find((s) => s >= 1.2) ?? steps[0]
  return preferred ?? 1.2
}

/** Density in kg/mm³ */
export const MATERIAL_DENSITY_KG_PER_MM3: Record<string, number> = {
  'Galvanized Steel': 7.85e-6,
  'Mild Steel': 7.85e-6,
  'Stainless Steel': 7.93e-6,
  Aluminum: 2.7e-6,
  Custom: 7.85e-6,
}

export const DEFAULT_SKETCH_TARGET_WIDTH_MM = 200
export const MIN_SEGMENT_LENGTH_MM = 5
