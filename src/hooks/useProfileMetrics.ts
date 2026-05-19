import { useMemo } from 'react'
import type { FoldedProfile } from '@/geometry/types'
import { computeProfileMetrics, type ProfileMetrics } from '@/lib/profileMetrics'

const EMPTY_METRICS: ProfileMetrics = {
  flatWidth: 0,
  bendCount: 0,
  bounds: { width: 0, height: 0 },
  area: 0,
  weight: 0,
}

export function useProfileMetrics(profile: FoldedProfile | null) {
  return useMemo(() => {
    if (!profile) return EMPTY_METRICS
    return computeProfileMetrics(profile)
  }, [profile])
}
