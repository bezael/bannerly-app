import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TemplateEditor } from '@/components/TemplateEditor'
import { createTemplate } from '../actions'

export default async function NewTemplatePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  async function save(jsx_code: string) {
    'use server'
    return createTemplate({ name: 'Nueva plantilla', width: 1200, height: 630, jsx_code })
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Nueva Plantilla</h1>
      <TemplateEditor onSave={save} />
    </div>
  )
}
