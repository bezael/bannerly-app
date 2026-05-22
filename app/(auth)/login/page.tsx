import { AuthForm } from '@/components/AuthForm'
import { login } from './actions'

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm bg-white border border-gray-200 rounded-xl shadow-sm p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Iniciar sesión</h1>
        <AuthForm
          action={login}
          submitLabel="Entrar"
          footerLink={{ href: '/register', label: '¿No tienes cuenta? Regístrate' }}
        />
      </div>
    </main>
  )
}
