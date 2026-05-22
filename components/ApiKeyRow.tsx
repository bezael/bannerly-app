'use client'

import { useTransition } from 'react'
import { revokeApiKey } from '@/app/dashboard/api-keys/actions'

interface ApiKeyRowProps {
  id: string
  name: string
  prefix: string
  createdAt: string
}

export function ApiKeyRow({ id, name, prefix, createdAt }: ApiKeyRowProps) {
  const [pending, startTransition] = useTransition()

  function handleRevoke() {
    if (!confirm(`¿Revocar la key "${name}"? Esta acción no se puede deshacer.`)) return
    startTransition(() => { revokeApiKey(id) })
  }

  return (
    <tr className="border-t border-gray-100">
      <td className="py-3 pr-4 text-sm font-medium text-gray-900">{name}</td>
      <td className="py-3 pr-4 text-sm font-mono text-gray-500">bnly_...{prefix}</td>
      <td className="py-3 pr-4 text-sm text-gray-500">
        {new Date(createdAt).toLocaleDateString('es-ES')}
      </td>
      <td className="py-3 text-right">
        <button
          onClick={handleRevoke}
          disabled={pending}
          className="text-sm text-red-600 hover:text-red-800 disabled:opacity-40 transition"
        >
          {pending ? 'Revocando...' : 'Revocar'}
        </button>
      </td>
    </tr>
  )
}
