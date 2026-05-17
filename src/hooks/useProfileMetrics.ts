import { useMemo } from 'react'
import { calculateAreaEstimate } from '@/geometry/calculateAreaEstimate'
import { calculateGeometricFlatWidth } from '@/geometry/calculateGeometricFlatWidth'
import { calculateProfileBounds } from '@/geometry/calculateProfileBounds'
import { calculateWeightEstimate } from '@/geometry/calculateWeightEstimate'
import type { FoldedProfile } from '@/geometry/types'

export function useProfileMetrics(profile: FoldedProfile | null) {
  return useMemo(() => {
    if (!profile) {
      return {
        flatWidth: 0,
        bendCount: 0,
        bounds: { width: 0, height: 0 },
        area: 0,
        weight: 0,
      }
    }

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
  }, [profile])
}
