import type { SupabaseClient } from '@supabase/supabase-js'
import type { Template } from './types'

/**
 * MVP-only: looks up a template by slug without a user filter, intended to be
 * called with a service-role client. Replace with a per-API-key lookup once
 * real API key auth lands.
 */
export async function getTemplateBySlugGlobal(
  supabase: SupabaseClient,
  slug: string,
): Promise<Template | null> {
  const { data, error } = await supabase
    .from('templates')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()

  if (error) throw error
  return data as Template | null
}
