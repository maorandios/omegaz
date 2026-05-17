export const SNAP_ANGLES = [0, 45, 90, 135, 180] as const
export const SNAP_TOLERANCE_DEG = 7

export const MATERIAL_OPTIONS = [
  'Galvanized Steel',
  'Mild Steel',
  'Stainless Steel',
  'Aluminum',
  'Custom',
] as const

export const THICKNESS_OPTIONS = [0.8, 1.0, 1.2, 1.5, 2.0, 3.0] as const

export const FINISH_OPTIONS = ['Raw', 'Painted', 'Powder Coated', 'Galvanized', 'Custom'] as const

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
