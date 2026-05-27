import { supabase } from '@/lib/supabase'
import {
  createPlateFavoriteRecord,
  normalizePlateFavorites,
  type PlateFavoriteRecord,
} from '@/store/favoriteTypes'

interface DbPlateFavoriteRow {
  id: string
  user_id: string
  name: string
  selected_template: string | null
  fingerprint: string
  profile: unknown
  created_at: string
  updated_at: string
}

function rowToFavorite(row: DbPlateFavoriteRow): PlateFavoriteRecord | null {
  const [normalized] = normalizePlateFavorites([
    {
      id: row.id,
      name: row.name,
      selectedTemplate: row.selected_template,
      fingerprint: row.fingerprint,
      profile: row.profile,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      userId: row.user_id,
    },
  ])
  return normalized ?? null
}

function favoriteToRow(favorite: PlateFavoriteRecord, userId: string): DbPlateFavoriteRow {
  return {
    id: favorite.id,
    user_id: userId,
    name: favorite.name,
    selected_template: favorite.selectedTemplate,
    fingerprint: favorite.fingerprint,
    profile: favorite.profile,
    created_at: favorite.createdAt,
    updated_at: favorite.updatedAt,
  }
}

export async function fetchPlateFavoritesForUser(
  userId: string,
): Promise<PlateFavoriteRecord[]> {
  if (!supabase) return []

  const { data, error } = await supabase
    .from('plate_favorites')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })

  if (error) throw error
  if (!data?.length) return []

  return data
    .map((row) => rowToFavorite(row as DbPlateFavoriteRow))
    .filter((f): f is PlateFavoriteRecord => f !== null)
}

export async function upsertPlateFavorite(
  favorite: PlateFavoriteRecord,
  userId: string,
): Promise<PlateFavoriteRecord> {
  if (!supabase) return favorite

  const row = favoriteToRow(favorite, userId)
  const { data, error } = await supabase
    .from('plate_favorites')
    .upsert(row, { onConflict: 'id' })
    .select('*')
    .single()

  if (error) throw error
  return rowToFavorite(data as DbPlateFavoriteRow) ?? favorite
}

export async function deletePlateFavoriteFromDb(favoriteId: string): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.from('plate_favorites').delete().eq('id', favoriteId)
  if (error) throw error
}

export function buildPlateFavorite(
  profile: Parameters<typeof createPlateFavoriteRecord>[0],
  selectedTemplate: string | null,
): PlateFavoriteRecord {
  return createPlateFavoriteRecord(profile, selectedTemplate)
}
