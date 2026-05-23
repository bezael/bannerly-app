'use client'

import { useState } from 'react'
import type { Layer, TextLayer, ImageLayer } from '@/lib/templates/types'

interface TemplateEditorProps {
  initialLayers?: Layer[]
  onChange: (layers: Layer[]) => void
}

function defaultTextLayer(): TextLayer {
  return {
    type: 'text',
    name: 'title',
    defaultText: 'Hello World',
    x: 60,
    y: 60,
    fontSize: 48,
    color: '#000000',
  }
}

function defaultImageLayer(): ImageLayer {
  return {
    type: 'image',
    name: 'avatar',
    defaultUrl: '',
    x: 60,
    y: 160,
    width: 100,
    height: 100,
  }
}

export function TemplateEditor({ initialLayers = [], onChange }: TemplateEditorProps) {
  const [layers, setLayers] = useState<Layer[]>(initialLayers)

  function update(next: Layer[]) {
    setLayers(next)
    onChange(next)
  }

  function addLayer(type: 'text' | 'image') {
    const layer = type === 'text' ? defaultTextLayer() : defaultImageLayer()
    update([...layers, layer])
  }

  function removeLayer(index: number) {
    update(layers.filter((_, i) => i !== index))
  }

  function updateLayer(index: number, patch: Partial<TextLayer & ImageLayer>) {
    const next = layers.map((l, i) =>
      i === index ? ({ ...l, ...patch } as Layer) : l
    )
    update(next)
  }

  return (
    <fieldset className="flex flex-col gap-4">
      <legend className="mb-2 text-sm font-medium">Layers</legend>

      {layers.length === 0 && (
        <p className="text-sm text-neutral-500">No layers yet. Add one below.</p>
      )}

      {layers.map((layer, i) => (
        <div
          key={i}
          data-testid={`layer-${i}`}
          className="flex flex-col gap-2 rounded border border-neutral-200 p-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">
              {layer.type} layer
            </span>
            <button
              type="button"
              data-testid={`remove-layer-${i}`}
              onClick={() => removeLayer(i)}
              className="text-xs text-red-500 hover:text-red-700"
            >
              Remove
            </button>
          </div>

          <label className="flex flex-col gap-1 text-sm">
            <span>Name</span>
            <input
              value={layer.name}
              onChange={(e) => updateLayer(i, { name: e.target.value })}
              placeholder="title"
              className="rounded border border-neutral-300 px-2 py-1 text-sm"
            />
          </label>

          {layer.type === 'text' && (
            <>
              <label className="flex flex-col gap-1 text-sm">
                <span>Default text</span>
                <input
                  value={(layer as TextLayer).defaultText}
                  onChange={(e) => updateLayer(i, { defaultText: e.target.value })}
                  placeholder="Hello World"
                  className="rounded border border-neutral-300 px-2 py-1 text-sm"
                />
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label className="flex flex-col gap-1 text-sm">
                  <span>Font size</span>
                  <input
                    type="number"
                    value={(layer as TextLayer).fontSize}
                    onChange={(e) => updateLayer(i, { fontSize: Number(e.target.value) })}
                    className="rounded border border-neutral-300 px-2 py-1 text-sm"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span>Color</span>
                  <input
                    type="color"
                    value={(layer as TextLayer).color}
                    onChange={(e) => updateLayer(i, { color: e.target.value })}
                    className="h-9 w-full rounded border border-neutral-300 px-1"
                  />
                </label>
              </div>
            </>
          )}

          {layer.type === 'image' && (
            <>
              <label className="flex flex-col gap-1 text-sm">
                <span>Default URL</span>
                <input
                  value={(layer as ImageLayer).defaultUrl}
                  onChange={(e) => updateLayer(i, { defaultUrl: e.target.value })}
                  placeholder="https://example.com/avatar.png"
                  className="rounded border border-neutral-300 px-2 py-1 text-sm"
                />
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label className="flex flex-col gap-1 text-sm">
                  <span>Width</span>
                  <input
                    type="number"
                    value={(layer as ImageLayer).width}
                    onChange={(e) => updateLayer(i, { width: Number(e.target.value) })}
                    className="rounded border border-neutral-300 px-2 py-1 text-sm"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span>Height</span>
                  <input
                    type="number"
                    value={(layer as ImageLayer).height}
                    onChange={(e) => updateLayer(i, { height: Number(e.target.value) })}
                    className="rounded border border-neutral-300 px-2 py-1 text-sm"
                  />
                </label>
              </div>
            </>
          )}

          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-1 text-sm">
              <span>X</span>
              <input
                type="number"
                value={layer.x}
                onChange={(e) => updateLayer(i, { x: Number(e.target.value) })}
                className="rounded border border-neutral-300 px-2 py-1 text-sm"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span>Y</span>
              <input
                type="number"
                value={layer.y}
                onChange={(e) => updateLayer(i, { y: Number(e.target.value) })}
                className="rounded border border-neutral-300 px-2 py-1 text-sm"
              />
            </label>
          </div>
        </div>
      ))}

      <div className="flex gap-2">
        <button
          type="button"
          data-testid="add-text-layer"
          onClick={() => addLayer('text')}
          className="rounded border border-neutral-300 px-3 py-1.5 text-xs hover:bg-neutral-50"
        >
          + Text layer
        </button>
        <button
          type="button"
          data-testid="add-image-layer"
          onClick={() => addLayer('image')}
          className="rounded border border-neutral-300 px-3 py-1.5 text-xs hover:bg-neutral-50"
        >
          + Image layer
        </button>
      </div>
    </fieldset>
  )
}
