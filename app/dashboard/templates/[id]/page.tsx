import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getTemplateById } from '@/lib/templates/get-template-by-id'
import { TemplateEditForm } from '@/components/templates/template-edit-form'
import { updateTemplateAction } from '@/app/dashboard/templates/actions'

interface EditTemplatePageProps {
  params: Promise<{ id: string }>
}

export default async function EditTemplatePage({ params }: EditTemplatePageProps) {
  const { id } = await params
  let supabase
  try {
    supabase = await createClient()
  } catch {
    redirect('/login')
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const template = await getTemplateById(supabase, id, user.id)
  if (!template) notFound()

  const action = updateTemplateAction.bind(null, id)

  return (
    <main className="mx-auto w-full max-w-xl px-6 py-10">
      <header className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Edit template</h1>
        <Link
          href="/dashboard/templates"
          className="text-sm text-neutral-600 hover:text-black"
        >
          Back
        </Link>
      </header>
      <TemplateEditForm template={template} action={action} />
    </main>
  )
}
