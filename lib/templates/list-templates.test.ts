import { describe, it, expect } from 'vitest'
import { listTemplates } from './list-templates'
import { mockSupabase } from './test-utils'
import type { Template } from './types'

const rows: Template[] = [
  {
    id: '1',
    slug: 'a',
    name: 'A',
    layout_id: 'og-basic',
    width: 1200,
    height: 630,
    layers: [],
    user_id: 'user-1',
    created_at: '2026-01-02T00:00:00Z',
  },
]

describe('listTemplates', () => {
  it('returns rows for the user, newest first', async () => {
    const { client, from, chain } = mockSupabase({ data: rows, error: null })
    const result = await listTemplates(client, 'user-1')

    expect(result).toEqual(rows)
    expect(from).toHaveBeenCalledWith('templates')
    expect(chain.eq).toHaveBeenCalledWith('user_id', 'user-1')
    expect(chain.order).toHaveBeenCalledWith('created_at', { ascending: false })
  })

  it('returns [] when data is null', async () => {
    const { client } = mockSupabase({ data: null, error: null })
    const result = await listTemplates(client, 'user-1')
    expect(result).toEqual([])
  })

  it('throws on error', async () => {
    const { client } = mockSupabase({ data: null, error: { message: 'x' } })
    await expect(listTemplates(client, 'user-1')).rejects.toBeTruthy()
  })
})
