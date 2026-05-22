import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getDashboardStats } from '@/lib/dashboard/stats'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [stats, { count: totalTemplates }] = await Promise.all([
    getDashboardStats(user.id),
    supabase.from('templates').select('id', { count: 'exact', head: true })
      .or(`user_id.eq.${user.id},user_id.is.null`),
  ])

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Bienvenido</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard label="Generaciones este mes" value={stats.generationsThisMonth} />
        <StatCard label="Plantillas disponibles" value={totalTemplates ?? 0} />
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="font-semibold text-gray-900 mb-3">Inicio rápido</h2>
        <ol className="space-y-2 text-sm text-gray-600 list-decimal list-inside">
          <li>
            Ve a <a href="/dashboard/api-keys" className="text-black underline">API Keys</a> y crea tu primera key.
          </li>
          <li>
            Ve a <a href="/dashboard/templates" className="text-black underline">Plantillas</a> y elige una base o crea la tuya.
          </li>
          <li>
            Llama a{' '}
            <code className="bg-gray-100 px-1 rounded font-mono text-xs">POST /api/v1/images</code>{' '}
            con tu key y el <code className="bg-gray-100 px-1 rounded font-mono text-xs">template_id</code>.
          </li>
        </ol>
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
    </div>
  )
}
