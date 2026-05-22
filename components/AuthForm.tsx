'use client'

import { useActionState } from 'react'

type AuthAction = (formData: FormData) => Promise<{ error: string } | void>

interface AuthFormProps {
  action: AuthAction
  submitLabel: string
  footerLink: { href: string; label: string }
}

export function AuthForm({ action, submitLabel, footerLink }: AuthFormProps) {
  const [state, formAction, pending] = useActionState<{ error: string } | null, FormData>(
    async (_, formData) => {
      const result = await action(formData)
      return result ?? null
    },
    null
  )

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <p role="alert" className="text-sm text-red-500 bg-red-50 border border-red-200 rounded px-3 py-2">
          {state.error}
        </p>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          minLength={8}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full bg-black text-white rounded-md py-2 text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition"
      >
        {pending ? 'Cargando...' : submitLabel}
      </button>

      <p className="text-center text-sm text-gray-500">
        <a href={footerLink.href} className="underline hover:text-black">
          {footerLink.label}
        </a>
      </p>
    </form>
  )
}
