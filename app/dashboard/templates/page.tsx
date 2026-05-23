import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { listTemplates } from '@/lib/templates/list-templates'
import { TemplateList } from '@/components/templates/template-list'

export default async function TemplatesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const templates = await listTemplates(supabase, user.id)

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-10">
      <header className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Templates</h1>
        <Link
          href="/dashboard/templates/new"
          className="rounded bg-black px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
        >
          New template
        </Link>
      </header>
      <TemplateList templates={templates} />
    </main>
  )
}
