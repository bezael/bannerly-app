import { AuthForm } from '@/components/AuthForm'
import { register } from './actions'

export default function RegisterPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm bg-white border border-gray-200 rounded-xl shadow-sm p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Crear cuenta</h1>
        <AuthForm
          action={register}
          submitLabel="Registrarse"
          footerLink={{ href: '/login', label: '¿Ya tienes cuenta? Inicia sesión' }}
        />
      </div>
    </main>
  )
}
