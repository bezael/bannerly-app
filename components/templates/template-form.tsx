'use client'

import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  createTemplateAction,
  type ActionState,
} from '@/app/dashboard/templates/actions'

const initialState: ActionState = { error: null }

export function TemplateForm() {
  const router = useRouter()
  const [state, formAction, pending] = useActionState(
    createTemplateAction,
    initialState
  )

  useEffect(() => {
    if (state && state.error === null && state !== initialState) {
      router.push('/dashboard/templates')
    }
  }, [state, router])

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Slug</span>
        <input
          name="slug"
          required
          placeholder="og-basic"
          className="rounded border border-neutral-300 px-3 py-2 text-sm"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Name</span>
        <input
          name="name"
          required
          placeholder="OG Basic"
          className="rounded border border-neutral-300 px-3 py-2 text-sm"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Layout ID</span>
        <input
          name="layout_id"
          required
          defaultValue="og-basic"
          className="rounded border border-neutral-300 px-3 py-2 text-sm"
        />
      </label>

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
        {pending ? 'Creating…' : 'Create template'}
      </button>
    </form>
  )
}
