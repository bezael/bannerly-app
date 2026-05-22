import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TemplateCard } from '@/components/TemplateCard'

export default async function TemplatesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: templates } = await supabase
    .from('templates')
    .select('id, name, width, height, thumbnail_url, created_at')
    .or(`user_id.eq.${user.id},user_id.is.null`)
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Plantillas</h1>
        <a
          href="/dashboard/templates/new"
          className="bg-black text-white text-sm px-4 py-2 rounded-md hover:bg-gray-800 transition"
        >
          Nueva Plantilla
        </a>
      </div>

      {templates && templates.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((t) => (
            <TemplateCard
              key={t.id}
              id={t.id}
              name={t.name}
              width={t.width}
              height={t.height}
              createdAt={t.created_at}
              thumbnailUrl={t.thumbnail_url}
            />
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500">No hay plantillas. Crea una o usa las plantillas base.</p>
      )}
    </div>
  )
}
