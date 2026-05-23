import type { SupabaseClient } from '@supabase/supabase-js'
import type { CreateTemplateInput, Template } from './types'

export type CreateTemplateResult =
  | { data: Template; error: null }
  | { data: null; error: string }

export async function createTemplate(
  supabase: SupabaseClient,
  input: CreateTemplateInput,
  userId: string
): Promise<CreateTemplateResult> {
  const row = {
    slug: input.slug,
    name: input.name,
    layout_id: input.layout_id,
    width: input.width ?? 1200,
    height: input.height ?? 630,
    layers: input.layers ?? [],
    user_id: userId,
  }

  const { data, error } = await supabase
    .from('templates')
    .insert(row)
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return { data: null, error: `Slug "${input.slug}" already exists` }
    }
    return { data: null, error: error.message }
  }

  return { data: data as Template, error: null }
}
