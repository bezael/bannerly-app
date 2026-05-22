import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { logout } from '@/app/(auth)/login/actions'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="min-h-screen flex bg-gray-50">
      <aside className="w-56 bg-white border-r border-gray-200 flex flex-col shrink-0">
        <div className="px-5 py-4 border-b border-gray-100">
          <span className="font-bold text-gray-900 tracking-tight">Bannerly</span>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 text-sm">
          {[
            { href: '/dashboard', label: 'Inicio' },
            { href: '/dashboard/templates', label: 'Plantillas' },
            { href: '/dashboard/api-keys', label: 'API Keys' },
            { href: '/dashboard/generations', label: 'Generaciones' },
          ].map(({ href, label }) => (
            <a
              key={href}
              href={href}
              className="flex items-center px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100 transition"
            >
              {label}
            </a>
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-gray-100">
          <p className="text-xs text-gray-400 px-3 mb-2 truncate">{user.email}</p>
          <form action={logout}>
            <button
              type="submit"
              className="w-full text-left px-3 py-2 text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-md transition"
            >
              Cerrar sesión
            </button>
          </form>
        </div>
      </aside>
      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  )
}
