import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ApiKeyRow } from '@/components/ApiKeyRow'
import { createApiKey } from './actions'

export default async function ApiKeysPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: keys } = await supabase
    .from('api_keys')
    .select('id, name, prefix, created_at')
    .is('revoked_at', null)
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">API Keys</h1>
        <form action={async (formData) => {
          'use server'
          const name = formData.get('name') as string
          if (name?.trim()) await createApiKey(name.trim())
        }}>
          <div className="flex gap-2">
            <input
              name="name"
              placeholder="Nombre de la key"
              required
              className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
            <button
              type="submit"
              className="bg-black text-white text-sm px-4 py-1.5 rounded-md hover:bg-gray-800 transition"
            >
              Nueva Key
            </button>
          </div>
        </form>
      </div>

      {keys && keys.length > 0 ? (
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-gray-400">
              <th className="pb-2 pr-4">Nombre</th>
              <th className="pb-2 pr-4">Key</th>
              <th className="pb-2 pr-4">Creada</th>
              <th className="pb-2" />
            </tr>
          </thead>
          <tbody>
            {keys.map((k) => (
              <ApiKeyRow
                key={k.id}
                id={k.id}
                name={k.name}
                prefix={k.prefix}
                createdAt={k.created_at}
              />
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-sm text-gray-500">No tienes API keys activas. Crea una para empezar.</p>
      )}
    </div>
  )
}
