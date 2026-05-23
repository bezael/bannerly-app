import { describe, it, expect } from 'vitest'
import { createTemplate } from './create-template'
import { mockSupabase } from './test-utils'
import type { Template } from './types'

const input = {
  slug: 'og-basic',
  name: 'OG Basic',
  layout_id: 'og-basic',
}

const created: Template = {
  id: 'uuid-1',
  slug: 'og-basic',
  name: 'OG Basic',
  layout_id: 'og-basic',
  width: 1200,
  height: 630,
  layers: [],
  user_id: 'user-1',
  created_at: '2026-01-01T00:00:00Z',
}

describe('createTemplate', () => {
  it('inserts row with defaults and returns created template', async () => {
    const { client, chain } = mockSupabase({ data: created, error: null })
    const result = await createTemplate(client, input, 'user-1')

    expect(result).toEqual({ data: created, error: null })
    expect(chain.insert).toHaveBeenCalledWith({
      slug: 'og-basic',
      name: 'OG Basic',
      layout_id: 'og-basic',
      width: 1200,
      height: 630,
      layers: [],
      user_id: 'user-1',
    })
  })

  it('returns friendly error on unique-constraint violation', async () => {
    const { client } = mockSupabase({
      data: null,
      error: { code: '23505', message: 'duplicate' },
    })
    const result = await createTemplate(client, input, 'user-1')

    expect(result.data).toBeNull()
    expect(result.error).toContain('already exists')
  })

  it('returns generic error on other failures', async () => {
    const { client } = mockSupabase({
      data: null,
      error: { code: 'XYZ', message: 'bad' },
    })
    const result = await createTemplate(client, input, 'user-1')

    expect(result).toEqual({ data: null, error: 'bad' })
  })
})
