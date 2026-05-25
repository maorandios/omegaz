import type { PlateRecord, ProjectRecord } from '@/store/projectTypes'

export interface DbProjectRow {
  id: string
  user_id: string
  serial: string
  name: string
  weight_kg: number
  plates: PlateRecord[]
  created_at: string
  updated_at: string
}

export interface DbProfileRow {
  id: string
  email: string
  full_name: string
  phone: string | null
  business_name: string | null
  subscription: unknown
  onboarding_complete: boolean
  created_at: string
  updated_at: string
}

export function projectToDbRow(project: ProjectRecord, userId: string): DbProjectRow {
  return {
    id: project.id,
    user_id: userId,
    serial: project.serial,
    name: project.name,
    weight_kg: project.weightKg,
    plates: project.plates,
    created_at: project.createdAt,
    updated_at: project.updatedAt,
  }
}

export function dbRowToProject(row: DbProjectRow): ProjectRecord {
  return {
    id: row.id,
    userId: row.user_id,
    serial: row.serial,
    name: row.name,
    plates: row.plates,
    weightKg: Number(row.weight_kg),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}
