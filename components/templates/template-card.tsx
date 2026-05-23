'use client'

import Link from 'next/link'
import type { Template } from '@/lib/templates/types'
import { deleteTemplateAction } from '@/app/dashboard/templates/actions'
import { CopyButton } from './copy-button'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function TemplateCard({ template }: { template: Template }) {
  const displayDate = template.updated_at ?? template.created_at

  async function handleDelete() {
    const confirmed = window.confirm(
      `¿Eliminar "${template.slug}"? Esta acción no se puede deshacer.`
    )
    if (!confirmed) return
    await deleteTemplateAction(template.id)
  }

  return (
    <article
      data-testid="dashboard-template-card"
      className="flex h-full flex-col gap-3 rounded border border-neutral-200 p-4"
    >
      <header className="flex items-start justify-between gap-2">
        <h2 className="text-lg font-medium leading-tight">{template.name}</h2>
        <span className="rounded bg-neutral-100 px-2 py-0.5 text-xs text-neutral-700">
          {template.layout_id}
        </span>
      </header>

      <div className="flex items-center gap-2 text-sm text-neutral-600">
        <code className="truncate font-mono text-xs">{template.slug}</code>
        <CopyButton value={template.slug} />
      </div>

      <p className="text-xs text-neutral-500">
        {template.width}&times;{template.height}
      </p>

      <p className="text-xs text-neutral-400">
        {formatDate(displayDate)}
      </p>

      <div className="mt-auto flex gap-2">
        <Link
          href={`/dashboard/templates/${template.id}`}
          className="flex-1 rounded border border-neutral-200 px-3 py-1.5 text-center text-xs hover:bg-neutral-50"
        >
          Edit
        </Link>
        <button
          type="button"
          data-testid="delete-template"
          onClick={handleDelete}
          className="flex-1 rounded border border-red-200 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
        >
          Delete
        </button>
      </div>
    </article>
  )
}
