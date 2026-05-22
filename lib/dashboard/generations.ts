import { createClient } from '@/lib/supabase/server'

export interface Generation {
  id: string
  image_url: string
  created_at: string
  templates: { name: string } | null
}

export interface GenerationsResult {
  data: Generation[]
  total: number
}

export async function getGenerations(
  userId: string,
  { page, limit }: { page: number; limit: number }
): Promise<GenerationsResult> {
  const supabase = await createClient()
  const from = (page - 1) * limit
  const to = from + limit - 1

  const { data, count, error } = await supabase
    .from('generations')
    .select('id, image_url, created_at, templates(name)', { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) return { data: [], total: 0 }

  const generations: Generation[] = (data ?? []).map((row) => ({
    id: row.id,
    image_url: row.image_url,
    created_at: row.created_at,
    templates: Array.isArray(row.templates) ? (row.templates[0] ?? null) : row.templates,
  }))

  return { data: generations, total: count ?? 0 }
}
