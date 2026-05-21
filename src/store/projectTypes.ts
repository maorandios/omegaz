import { calculateAreaEstimate } from '@/geometry/calculateAreaEstimate'
import { calculateGeometricFlatWidth } from '@/geometry/calculateGeometricFlatWidth'
import { calculateWeightEstimate } from '@/geometry/calculateWeightEstimate'
import type { FoldedProfile } from '@/geometry/types'
import { cloneFoldedProfile, createId } from '@/geometry/types'

/** Single plate / profile entry inside a fabrication project batch. */
export interface PlateRecord {
  id: string
  /** Display serial within the project: p01, p02, … */
  serial: string
  profile: FoldedProfile
  selectedTemplate: string | null
  weightKg: number
  createdAt: string
  updatedAt: string
}

/**
 * Fabrication project — a named batch holding one or more plates.
 * Future: add `userId` when syncing to Supabase so each user sees only their projects.
 */
export interface ProjectRecord {
  id: string
  /** Display serial: #001, #002, … */
  serial: string
  name: string
  plates: PlateRecord[]
  /** Sum of plate weights in this project. */
  weightKg: number
  createdAt: string
  updatedAt: string
}

/** Estimated mass for a single fabricated part (kg). */
export function computePlateWeightPerPartKg(profile: FoldedProfile): number {
  const flatWidth = calculateGeometricFlatWidth(profile.segments)
  const area = calculateAreaEstimate(flatWidth, profile.fabrication.partLength)
  return calculateWeightEstimate(
    area,
    profile.fabrication.thickness,
    profile.fabrication.material,
  )
}

/** Total estimated mass for this plate line (per-part × quantity). */
export function computePlateWeightKg(profile: FoldedProfile): number {
  const qty = Math.max(0, profile.fabrication.quantity)
  return computePlateWeightPerPartKg(profile) * qty
}

export function computeProjectWeightKg(plates: PlateRecord[]): number {
  return plates.reduce((sum, plate) => sum + computePlateWeightKg(plate.profile), 0)
}

export function nextProjectSerial(projects: ProjectRecord[]): string {
  const max = projects.reduce((n, p) => {
    const m = p.serial.match(/^#(\d+)$/)
    return m ? Math.max(n, parseInt(m[1], 10)) : n
  }, 0)
  return `#${String(max + 1).padStart(3, '0')}`
}

const PLATE_SERIAL_RE = /^p(\d{2})$/i

export function nextPlateSerial(plates: PlateRecord[]): string {
  const max = plates.reduce((n, plate) => {
    const m = plate.serial?.match(PLATE_SERIAL_RE)
    return m ? Math.max(n, parseInt(m[1], 10)) : n
  }, 0)
  return `p${String(max + 1).padStart(2, '0')}`
}

/** Assign p01…pNN by createdAt when any plate is missing a valid serial. */
export function normalizePlateSerials(plates: PlateRecord[]): PlateRecord[] {
  const allValid = plates.every((p) => PLATE_SERIAL_RE.test(p.serial ?? ''))
  if (allValid) return plates

  const sorted = [...plates].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  )
  return sorted.map((plate, index) => ({
    ...plate,
    serial: `p${String(index + 1).padStart(2, '0')}`,
  }))
}

export function plateDisplayName(plate: PlateRecord): string {
  return plate.profile.fabrication.partName.trim() || plate.profile.name
}

export function createPlateRecord(
  profile: FoldedProfile,
  selectedTemplate: string | null,
  serial: string,
  plateId?: string,
): PlateRecord {
  const now = new Date().toISOString()
  return {
    id: plateId ?? createId('plate'),
    serial,
    profile: cloneFoldedProfile(profile),
    selectedTemplate,
    weightKg: computePlateWeightKg(profile),
    createdAt: now,
    updatedAt: now,
  }
}
