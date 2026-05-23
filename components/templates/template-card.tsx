import type { Template } from '@/lib/templates/types'
import { deleteTemplateAction } from '@/app/dashboard/templates/actions'
import { CopyButton } from './copy-button'

export function TemplateCard({ template }: { template: Template }) {
  const deleteWithId = deleteTemplateAction.bind(null, template.id)

  return (
    <article className="flex h-full flex-col gap-3 rounded border border-neutral-200 p-4">
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

      <form action={deleteWithId} className="mt-auto">
        <button
          type="submit"
          className="w-full rounded border border-red-200 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
        >
          Delete
        </button>
      </form>
    </article>
  )
}
