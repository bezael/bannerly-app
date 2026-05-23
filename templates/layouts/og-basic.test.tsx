import { describe, it, expect } from 'vitest'
import { createElement, isValidElement, type ReactNode } from 'react'
import { getLayout } from './index'

function collectText(node: ReactNode): string[] {
  if (node == null || typeof node === 'boolean') return []
  if (typeof node === 'string' || typeof node === 'number') return [String(node)]
  if (Array.isArray(node)) return node.flatMap(collectText)
  if (isValidElement(node)) {
    const props = node.props as { children?: ReactNode }
    return collectText(props.children)
  }
  return []
}

describe('layout registry', () => {
  it('returns the og-basic component', () => {
    const Layout = getLayout('og-basic')
    expect(Layout).not.toBeNull()
    expect(typeof Layout).toBe('function')
  })

  it('returns null for unknown layout ids', () => {
    expect(getLayout('does-not-exist')).toBeNull()
  })
})

describe('og-basic layout', () => {
  it('renders title and subtitle from fields', () => {
    const Layout = getLayout('og-basic')!
    const element = createElement(Layout, {
      fields: { title: 'Hello World', subtitle: 'A subtitle here' },
      layers: [
        { name: 'title', type: 'text' },
        { name: 'subtitle', type: 'text' },
      ],
    })

    const tree = (element.type as (props: unknown) => ReactNode)(element.props)
    const text = collectText(tree)

    expect(text).toContain('Hello World')
    expect(text).toContain('A subtitle here')
  })

  it('falls back to placeholders when fields are missing', () => {
    const Layout = getLayout('og-basic')!
    const element = createElement(Layout, {
      fields: {},
      layers: [],
    })

    const tree = (element.type as (props: unknown) => ReactNode)(element.props)
    const text = collectText(tree)

    expect(text.some((t) => t.length > 0)).toBe(true)
  })
})
