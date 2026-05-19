import { calculateAreaEstimate } from '@/geometry/calculateAreaEstimate'
import { calculateGeometricFlatWidth } from '@/geometry/calculateGeometricFlatWidth'
import { calculateProfileBounds } from '@/geometry/calculateProfileBounds'
import { calculateWeightEstimate } from '@/geometry/calculateWeightEstimate'
import type { FoldedProfile } from '@/geometry/types'

export interface ProfileMetrics {
  flatWidth: number
  bendCount: number
  bounds: { width: number; height: number }
  area: number
  weight: number
}

export function computeProfileMetrics(profile: FoldedProfile): ProfileMetrics {
  const flatWidth = calculateGeometricFlatWidth(profile.segments)
  const bounds = calculateProfileBounds(profile.segments)
  const area = calculateAreaEstimate(flatWidth, profile.fabrication.partLength)
  const weight = calculateWeightEstimate(
    area,
    profile.fabrication.thickness,
    profile.fabrication.material,
  )

  return {
    flatWidth,
    bendCount: profile.bends.length,
    bounds,
    area,
    weight,
  }
}
