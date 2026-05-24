import { dbRowToProject, projectToDbRow } from '@/lib/db/types'
import { supabase } from '@/lib/supabase'
import type { ProjectRecord } from '@/store/projectTypes'
import { normalizeProjects } from '@/store/projectsPersist'

export async function fetchProjectsForUser(userId: string): Promise<ProjectRecord[]> {
  if (!supabase) return []

  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })

  if (error) throw error
  if (!data?.length) return []

  const rows = data.map((row) => dbRowToProject(row))
  return normalizeProjects(rows)
}

export async function upsertProject(project: ProjectRecord, userId: string): Promise<void> {
  if (!supabase) return

  const row = projectToDbRow(project, userId)
  const { error } = await supabase.from('projects').upsert(row, { onConflict: 'id' })
  if (error) throw error
}

export async function upsertProjects(projects: ProjectRecord[], userId: string): Promise<void> {
  if (!supabase || projects.length === 0) return

  const rows = projects.map((p) => projectToDbRow(p, userId))
  const { error } = await supabase.from('projects').upsert(rows, { onConflict: 'id' })
  if (error) throw error
}

export async function deleteProjectFromDb(projectId: string): Promise<void> {
  if (!supabase) return

  const { error } = await supabase.from('projects').delete().eq('id', projectId)
  if (error) throw error
}
