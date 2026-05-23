import { describe, it, expect } from 'vitest'
import { getTemplateBySlug } from './get-template'
import { mockSupabase } from './test-utils'
import type { Template } from './types'

const sample: Template = {
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

describe('getTemplateBySlug', () => {
  it('returns template when found', async () => {
    const { client, from, chain } = mockSupabase({ data: sample, error: null })
    const result = await getTemplateBySlug(client, 'og-basic', 'user-1')

    expect(result).toEqual(sample)
    expect(from).toHaveBeenCalledWith('templates')
    expect(chain.eq).toHaveBeenCalledWith('slug', 'og-basic')
    expect(chain.eq).toHaveBeenCalledWith('user_id', 'user-1')
    expect(chain.maybeSingle).toHaveBeenCalled()
  })

  it('returns null when not found', async () => {
    const { client } = mockSupabase({ data: null, error: null })
    const result = await getTemplateBySlug(client, 'missing', 'user-1')
    expect(result).toBeNull()
  })

  it('throws on supabase error', async () => {
    const { client } = mockSupabase({ data: null, error: { message: 'boom' } })
    await expect(
      getTemplateBySlug(client, 'og-basic', 'user-1')
    ).rejects.toBeTruthy()
  })
})
