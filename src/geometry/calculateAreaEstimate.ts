export function calculateAreaEstimate(flatWidthMm: number, partLengthMm: number): number {
  return Math.max(flatWidthMm, 0) * Math.max(partLengthMm, 0)
}
