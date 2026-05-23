import type { SupabaseClient } from '@supabase/supabase-js'
import type { Template, UpdateTemplateInput } from './types'

export type UpdateTemplateResult =
  | { data: Template; error: null }
  | { data: null; error: string }

export async function updateTemplate(
  supabase: SupabaseClient,
  id: string,
  input: UpdateTemplateInput,
  userId: string
): Promise<UpdateTemplateResult> {
  const patch: Record<string, unknown> = {}
  if (input.name !== undefined) patch.name = input.name
  if (input.width !== undefined) patch.width = input.width
  if (input.height !== undefined) patch.height = input.height
  if (input.layers !== undefined) patch.layers = input.layers

  const { data, error } = await supabase
    .from('templates')
    .update(patch)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as Template, error: null }
}
