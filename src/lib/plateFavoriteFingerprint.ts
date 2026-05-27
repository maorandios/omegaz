import { migrateProfileBends } from '@/geometry/calculateProfilePoints'
import type { FoldedProfile } from '@/geometry/types'

/** Stable key so the same geometry + fab spec maps to one favourite slot. */
export function plateFavoriteFingerprint(
  profile: FoldedProfile,
  selectedTemplate: string | null,
): string {
  const migrated = migrateProfileBends(profile)
  const fab = migrated.fabrication
  return JSON.stringify({
    template: selectedTemplate,
    segments: migrated.segments.map((s) => Math.round(s.length * 10) / 10),
    bends: migrated.bends.map((b) => b.interiorAngle),
    material: fab.material,
    materialCustom: fab.materialCustom?.trim() ?? '',
    grade: fab.grade,
    thickness: Math.round(fab.thickness * 1000) / 1000,
    finish: fab.finish,
    hem: fab.hem,
    checkerPlate: fab.checkerPlate,
  })
}
