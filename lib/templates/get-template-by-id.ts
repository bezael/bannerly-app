import type { SupabaseClient } from '@supabase/supabase-js'
import type { Template } from './types'

export async function getTemplateById(
  supabase: SupabaseClient,
  id: string,
  userId: string
): Promise<Template | null> {
  const { data, error } = await supabase
    .from('templates')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error
  return data as Template | null
}
