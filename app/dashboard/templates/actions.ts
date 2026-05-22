'use server'

import { revalidatePath } from 'next/cache'
import { nanoid } from 'nanoid'
import { createClient } from '@/lib/supabase/server'

interface TemplateData {
  name: string
  width: number
  height: number
  jsx_code: string
}

export async function createTemplate(data: TemplateData) {
  if (!data.name?.trim()) return { error: 'El nombre es obligatorio' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  const { error } = await supabase.from('templates').insert({
    user_id: user.id,
    template_uid: `tpl_${nanoid(16)}`,
    name: data.name.trim(),
    width: data.width,
    height: data.height,
    jsx_code: data.jsx_code,
  })

  if (error) return { error: error.message }

  revalidatePath('/dashboard/templates')
}

export async function updateTemplate(id: string, data: Partial<TemplateData>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  const { error } = await supabase
    .from('templates')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/templates')
}

export async function deleteTemplate(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { count } = await supabase
    .from('generations')
    .select('id', { count: 'exact', head: true })
    .eq('template_id', id)
    .gte('created_at', since)

  if ((count ?? 0) > 0) {
    return { error: 'No se puede eliminar: tiene generaciones en las últimas 24h' }
  }

  const { error } = await supabase
    .from('templates')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/templates')
}
