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

/** Materials shown on the fabrication form. */
export const FABRICATION_MATERIAL_OPTIONS = [
  'Galvanized Steel',
  'Mild Steel',
  'Stainless Steel',
  'Aluminum',
  'Zinc',
  'Copper',
  'Other',
] as const

export const FABRICATION_MATERIAL_OTHER = 'Other' as const

export type FabricationMaterial = (typeof FABRICATION_MATERIAL_OPTIONS)[number]

export function isFabricationMaterialOption(
  material: string,
): material is FabricationMaterial {
  return (FABRICATION_MATERIAL_OPTIONS as readonly string[]).includes(material)
}

export function getFabricationMaterialLabel(material: string, materialCustom: string): string {
  if (material === FABRICATION_MATERIAL_OTHER) {
    const custom = materialCustom.trim()
    return custom || FABRICATION_MATERIAL_OTHER
  }
  return material
}

/** Default steel/alloy grade shown when a standard material is selected. */
export const MATERIAL_DEFAULT_GRADES: Partial<Record<FabricationMaterial, string>> = {
  'Galvanized Steel': 'DX51D',
  'Mild Steel': 'S235JR',
  'Stainless Steel': 'Grade 304 (1.4301)',
  Aluminum: '1050',
  Zinc: 'Titanium-Zinc (Z1)',
  Copper: 'Cu-DHP',
}

export function defaultMaterialGrade(material: string): string {
  if (isFabricationMaterialOption(material)) {
    return MATERIAL_DEFAULT_GRADES[material] ?? ''
  }
  return ''
}

export const THICKNESS_OPTIONS = [0.8, 1.0, 1.2, 1.5, 2.0, 3.0] as const

export const FINISH_OPTIONS = [
  'Mill Finish',
  'Pre-Painted',
  'Powder Coated',
  'Anodized',
  'Custom',
] as const

/** Finishes shown on the fabrication form. */
export const FABRICATION_FINISH_OPTIONS = [
  'Mill Finish',
  'Pre-Painted',
  'Powder Coated',
  'Anodized',
] as const

export type FabricationFinish = (typeof FABRICATION_FINISH_OPTIONS)[number]

export function isFabricationFinishOption(finish: string): finish is FabricationFinish {
  return (FABRICATION_FINISH_OPTIONS as readonly string[]).includes(finish)
}

const LEGACY_FINISH_MAP: Record<string, FabricationFinish> = {
  Raw: 'Mill Finish',
  Painted: 'Pre-Painted',
  Galvanized: 'Mill Finish',
  'Powder Coated': 'Powder Coated',
}

export function normalizeFabricationFinish(finish: string): FabricationFinish {
  if (isFabricationFinishOption(finish)) return finish
  return LEGACY_FINISH_MAP[finish] ?? FABRICATION_FINISH_OPTIONS[0]
}

/** Max thickness (mm) for the fabrication slider. */
export const FABRICATION_THICKNESS_MAX_MM = 30

/** Max thickness (mm) per material for the fabrication slider. */
export const MATERIAL_THICKNESS_MAX_MM: Record<FabricationMaterial, number> = {
  'Galvanized Steel': FABRICATION_THICKNESS_MAX_MM,
  'Mild Steel': FABRICATION_THICKNESS_MAX_MM,
  'Stainless Steel': FABRICATION_THICKNESS_MAX_MM,
  Aluminum: FABRICATION_THICKNESS_MAX_MM,
  Zinc: FABRICATION_THICKNESS_MAX_MM,
  Copper: FABRICATION_THICKNESS_MAX_MM,
  Other: FABRICATION_THICKNESS_MAX_MM,
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

export function defaultMaterialThickness(_material: string): number {
  return 1.2
}

/** Accept any positive thickness (no min/max range). */
export function normalizeFabricationThickness(thickness: number): number {
  if (!Number.isFinite(thickness) || thickness <= 0) return defaultMaterialThickness('')
  return thickness
}

/**
 * Density in kg/mm³ (g/cm³ × 10⁻⁶).
 * Reference kg/m³: Mild/Galv 7850, Stainless 8000, Al 1050 2710, Zinc 7180, Cu 8960.
 */
export const MATERIAL_DENSITY_KG_PER_MM3: Record<string, number> = {
  'Galvanized Steel': 7.85e-6,
  'Mild Steel': 7.85e-6,
  'Stainless Steel': 8.0e-6,
  Aluminum: 2.71e-6,
  Zinc: 7.18e-6,
  Copper: 8.96e-6,
  Other: 7.85e-6,
  Custom: 7.85e-6,
}

export const DEFAULT_SKETCH_TARGET_WIDTH_MM = 200
export const MIN_SEGMENT_LENGTH_MM = 5
