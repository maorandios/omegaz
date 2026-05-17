import { MATERIAL_DENSITY_KG_PER_MM3 } from './constants'

export function calculateWeightEstimate(
  areaMm2: number,
  thicknessMm: number,
  material: string,
): number {
  const density = MATERIAL_DENSITY_KG_PER_MM3[material] ?? MATERIAL_DENSITY_KG_PER_MM3['Mild Steel']
  const volumeMm3 = areaMm2 * Math.max(thicknessMm, 0)
  return volumeMm3 * density
}
