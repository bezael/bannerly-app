'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { ActionState } from '@/app/dashboard/templates/actions'
import { TemplateEditor } from './template-editor'
import type { Layer, Template } from '@/lib/templates/types'

interface TemplateEditFormProps {
  template: Template
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>
}

const initialState: ActionState = { error: null }

export function TemplateEditForm({ template, action }: TemplateEditFormProps) {
  const router = useRouter()
  const [layers, setLayers] = useState<Layer[]>(template.layers)
  const layersRef = useRef<HTMLInputElement>(null)
  const [state, formAction, pending] = useActionState(action, initialState)

  useEffect(() => {
    if (state && state.error === null && state !== initialState) {
      router.push('/dashboard/templates')
    }
  }, [state, router])

  function handleLayersChange(next: Layer[]) {
    setLayers(next)
    if (layersRef.current) {
      layersRef.current.value = JSON.stringify(next)
    }
  }

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Slug</span>
        <input
          name="slug_display"
          disabled
          value={template.slug}
          className="rounded border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-500"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Name</span>
        <input
          name="name"
          required
          defaultValue={template.name}
          className="rounded border border-neutral-300 px-3 py-2 text-sm"
        />
      </label>

      <input
        ref={layersRef}
        type="hidden"
        name="layers"
        defaultValue={JSON.stringify(layers)}
      />

      <TemplateEditor initialLayers={template.layers} onChange={handleLayersChange} />

      {state?.error ? (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="rounded bg-black px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
      >
        {pending ? 'Saving…' : 'Save changes'}
      </button>
    </form>
  )
}
