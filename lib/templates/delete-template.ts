import type { SupabaseClient } from '@supabase/supabase-js'

export type DeleteTemplateResult = { error: string | null }

export async function deleteTemplate(
  supabase: SupabaseClient,
  id: string,
  userId: string
): Promise<DeleteTemplateResult> {
  const { error } = await supabase
    .from('templates')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)

  return { error: error?.message ?? null }
}
