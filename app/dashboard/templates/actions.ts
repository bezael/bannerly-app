'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createTemplate } from '@/lib/templates/create-template'
import { deleteTemplate } from '@/lib/templates/delete-template'

export type ActionState = { error: string | null }

async function getAuthedClient() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return { supabase, user }
}

export async function createTemplateAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const slug = String(formData.get('slug') ?? '').trim()
  const name = String(formData.get('name') ?? '').trim()
  const layout_id = String(formData.get('layout_id') ?? '').trim()

  if (!slug || !name || !layout_id) {
    return { error: 'slug, name and layout_id are required' }
  }

  const { supabase, user } = await getAuthedClient()
  const result = await createTemplate(
    supabase,
    { slug, name, layout_id },
    user.id
  )

  if (result.error) return { error: result.error }

  revalidatePath('/dashboard/templates')
  return { error: null }
}

export async function deleteTemplateAction(id: string): Promise<void> {
  const { supabase, user } = await getAuthedClient()
  const result = await deleteTemplate(supabase, id, user.id)
  if (result.error) throw new Error(result.error)
  revalidatePath('/dashboard/templates')
}
