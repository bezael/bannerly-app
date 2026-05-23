import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TemplateForm } from '@/components/templates/template-form'

export default async function NewTemplatePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <main className="mx-auto w-full max-w-xl px-6 py-10">
      <header className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">New template</h1>
        <Link
          href="/dashboard/templates"
          className="text-sm text-neutral-600 hover:text-black"
        >
          Back
        </Link>
      </header>
      <TemplateForm />
    </main>
  )
}
