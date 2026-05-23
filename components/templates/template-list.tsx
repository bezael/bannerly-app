import Link from 'next/link'
import type { Template } from '@/lib/templates/types'
import { TemplateCard } from './template-card'

export function TemplateList({ templates }: { templates: Template[] }) {
  if (templates.length === 0) {
    return (
      <div className="rounded border border-dashed border-neutral-300 p-10 text-center">
        <p className="mb-3 text-neutral-600">No templates yet</p>
        <Link
          href="/dashboard/templates/new"
          className="text-sm font-medium text-black underline"
        >
          Create your first template
        </Link>
      </div>
    )
  }

  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {templates.map((t) => (
        <li key={t.id}>
          <TemplateCard template={t} />
        </li>
      ))}
    </ul>
  )
}
