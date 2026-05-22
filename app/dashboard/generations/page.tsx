import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getGenerations } from '@/lib/dashboard/generations'
import { GenerationGallery } from '@/components/GenerationGallery'

const LIMIT = 20

export default async function GenerationsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { page: pageParam } = await searchParams
  const page = Math.max(1, parseInt(pageParam ?? '1', 10))

  const { data, total } = await getGenerations(user.id, { page, limit: LIMIT })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Generaciones</h1>
        <span className="text-sm text-gray-400">{total} total</span>
      </div>
      <GenerationGallery generations={data} total={total} page={page} limit={LIMIT} />
    </div>
  )
}
