'use client'

import { useState } from 'react'

export function CopyButton({ value, label }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {}
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="rounded border border-neutral-300 px-2 py-0.5 text-xs hover:bg-neutral-100"
      aria-label={label ?? `Copy ${value}`}
    >
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}
