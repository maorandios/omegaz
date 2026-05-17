import type { Segment } from './types'

export function calculateGeometricFlatWidth(segments: Pick<Segment, 'length'>[]): number {
  return segments.reduce((sum, s) => sum + Math.max(s.length, 0), 0)
}
