import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TemplateEditor } from '@/components/TemplateEditor'
import { updateTemplate } from '../actions'

export default async function EditTemplatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: template } = await supabase
    .from('templates')
    .select('id, name, jsx_code, width, height')
    .eq('id', id)
    .single()

  if (!template) notFound()

  async function save(jsx_code: string) {
    'use server'
    return updateTemplate(id, { jsx_code })
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">{template.name}</h1>
      <p className="text-sm text-gray-400 mb-6 font-mono">{template.width}×{template.height}</p>
      <TemplateEditor initialCode={template.jsx_code} onSave={save} />
    </div>
  )
}
