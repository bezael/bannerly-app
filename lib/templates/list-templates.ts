import type { SupabaseClient } from '@supabase/supabase-js'
import type { Template } from './types'

export async function listTemplates(
  supabase: SupabaseClient,
  userId: string
): Promise<Template[]> {
  const { data, error } = await supabase
    .from('templates')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as Template[]
}
