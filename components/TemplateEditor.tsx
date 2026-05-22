'use client'

import { useState, useTransition } from 'react'

interface TemplateEditorProps {
  initialCode?: string
  onSave: (jsx_code: string) => Promise<{ error: string } | void>
}

export function TemplateEditor({ initialCode = '', onSave }: TemplateEditorProps) {
  const [code, setCode] = useState(initialCode)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function handleSave() {
    setError(null)
    startTransition(async () => {
      const result = await onSave(code)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">JSX del template</label>
        <button
          onClick={handleSave}
          disabled={pending || !code.trim()}
          className="bg-black text-white text-sm px-4 py-1.5 rounded-md hover:bg-gray-800 disabled:opacity-40 transition"
        >
          {pending ? 'Guardando...' : 'Guardar'}
        </button>
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
          {error}
        </p>
      )}

      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        rows={20}
        spellCheck={false}
        className="w-full font-mono text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black resize-y"
        placeholder={'({ title, subtitle, badge, bgColor, accentColor, imageUrl }) => (\n  <div style={{ width: 1200, height: 630 }}>\n    ...\n  </div>\n)'}
      />

      <p className="text-xs text-gray-400">
        El componente recibe props como función de flecha. Usa estilos inline — Satori no soporta clases CSS.
      </p>
    </div>
  )
}
