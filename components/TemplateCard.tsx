'use client'

import { useTransition } from 'react'
import { deleteTemplate } from '@/app/dashboard/templates/actions'

interface TemplateCardProps {
  id: string
  name: string
  width: number
  height: number
  createdAt: string
  thumbnailUrl?: string | null
}

export function TemplateCard({ id, name, width, height, createdAt, thumbnailUrl }: TemplateCardProps) {
  const [pending, startTransition] = useTransition()

  function handleDelete() {
    if (!confirm(`¿Eliminar la plantilla "${name}"?`)) return
    startTransition(async () => {
      const result = await deleteTemplate(id)
      if (result?.error) alert(result.error)
    })
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition">
      <div className="aspect-video bg-gray-100 flex items-center justify-center overflow-hidden">
        {thumbnailUrl ? (
          <img src={thumbnailUrl} alt={name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-xs text-gray-400 font-mono">{width}×{height}</span>
        )}
      </div>

      <div className="p-4">
        <p className="font-medium text-gray-900 text-sm truncate">{name}</p>
        <p className="text-xs text-gray-400 mt-0.5">
          {new Date(createdAt).toLocaleDateString('es-ES')}
        </p>

        <div className="flex gap-2 mt-3">
          <a
            href={`/dashboard/templates/${id}`}
            className="flex-1 text-center text-xs border border-gray-300 rounded px-2 py-1.5 hover:bg-gray-50 transition"
          >
            Editar
          </a>
          <button
            onClick={handleDelete}
            disabled={pending}
            className="text-xs text-red-600 hover:text-red-800 disabled:opacity-40 px-2 py-1.5 transition"
          >
            {pending ? '...' : 'Eliminar'}
          </button>
        </div>
      </div>
    </div>
  )
}
