import type { SupabaseClient } from '@supabase/supabase-js'
import type { Template } from './types'

/** Lists all templates across all users. Must be called with a service-role client. */
export async function listTemplatesGlobal(
  supabase: SupabaseClient,
): Promise<Template[]> {
  const { data, error } = await supabase
    .from('templates')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as Template[]
}
