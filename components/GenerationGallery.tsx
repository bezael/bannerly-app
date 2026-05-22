'use client'

interface Generation {
  id: string
  image_url: string
  created_at: string
  templates: { name: string } | null
}

interface GenerationGalleryProps {
  generations: Generation[]
  total: number
  page: number
  limit: number
}

export function GenerationGallery({ generations, total, page, limit }: GenerationGalleryProps) {
  const totalPages = Math.ceil(total / limit)

  if (generations.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        Aún no has generado imágenes. Llama a <code className="bg-gray-100 px-1 rounded text-xs font-mono">POST /api/v1/images</code> para empezar.
      </p>
    )
  }

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {generations.map((gen) => (
          <div key={gen.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="aspect-video bg-gray-100 overflow-hidden">
              <img
                src={gen.image_url}
                alt={gen.id}
                className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
            </div>
            <div className="p-3">
              <p className="text-xs font-mono text-gray-400 truncate">{gen.id}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {gen.templates?.name ?? 'Plantilla eliminada'} · {new Date(gen.created_at).toLocaleDateString('es-ES')}
              </p>
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center gap-2 mt-6 text-sm">
          {page > 1 && (
            <a href={`?page=${page - 1}`} className="px-3 py-1.5 border border-gray-300 rounded hover:bg-gray-50 transition">
              ← Anterior
            </a>
          )}
          <span className="text-gray-500">Página {page} de {totalPages}</span>
          {page < totalPages && (
            <a href={`?page=${page + 1}`} className="px-3 py-1.5 border border-gray-300 rounded hover:bg-gray-50 transition">
              Siguiente →
            </a>
          )}
        </div>
      )}
    </div>
  )
}
