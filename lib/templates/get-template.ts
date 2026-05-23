import type { SupabaseClient } from '@supabase/supabase-js'
import type { Template } from './types'

export async function getTemplateBySlug(
  supabase: SupabaseClient,
  slug: string,
  userId: string
): Promise<Template | null> {
  const { data, error } = await supabase
    .from('templates')
    .select('*')
    .eq('slug', slug)
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error
  return data as Template | null
}
