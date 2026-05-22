import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@upstash/ratelimit', () => ({
  Ratelimit: class {
    static slidingWindow() { return {} }
    limit = vi.fn().mockResolvedValue({ success: true })
  },
}))
vi.mock('@upstash/redis', () => ({
  Redis: class { static fromEnv() { return new this() } },
}))
vi.mock('@/lib/auth/validateApiKey', () => ({ validateApiKey: vi.fn() }))
vi.mock('@/lib/renderer', () => ({ renderTemplate: vi.fn() }))
vi.mock('@/lib/supabase/service-role', () => ({
  createServiceRoleClient: vi.fn(() => ({
    from: vi.fn((table: string) => {
      if (table === 'templates') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: mockTemplateSingle,
            })),
          })),
        }
      }
      if (table === 'generations') {
        return { insert: vi.fn().mockResolvedValue({ error: null }) }
      }
    }),
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn().mockResolvedValue({ error: null }),
        getPublicUrl: vi.fn(() => ({
          data: { publicUrl: 'https://storage.example.com/image.png' },
        })),
      })),
    },
  })),
}))

const mockTemplateSingle = vi.fn()

function makeRequest(body: unknown, apiKey = 'bnly_validkey') {
  return new NextRequest('http://localhost/api/v1/images', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  })
}

describe('POST /api/v1/images', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 200 with image_url for valid key and template', async () => {
    const { validateApiKey } = await import('@/lib/auth/validateApiKey')
    const { renderTemplate } = await import('@/lib/renderer')
    vi.mocked(validateApiKey).mockResolvedValue('user-123')
    vi.mocked(renderTemplate).mockResolvedValue(Buffer.from('png'))
    mockTemplateSingle.mockResolvedValue({
      data: { id: 'tpl-uuid', template_uid: 'tpl_og_basic', jsx_code: '<div/>', width: 1200, height: 630 },
      error: null,
    })

    const { POST } = await import('@/app/api/v1/images/route')
    const res = await POST(makeRequest({ template_id: 'tpl_og_basic', modifications: [] }))
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json).toMatchObject({
      id: expect.stringMatching(/^gen_/),
      template_id: 'tpl_og_basic',
      image_url: expect.stringContaining('https://'),
    })
  })

  it('returns 401 for invalid or missing API key', async () => {
    const { validateApiKey } = await import('@/lib/auth/validateApiKey')
    vi.mocked(validateApiKey).mockResolvedValue(null)

    const { POST } = await import('@/app/api/v1/images/route')
    const res = await POST(makeRequest({ template_id: 'tpl_og_basic', modifications: [] }, 'bad_key'))

    expect(res.status).toBe(401)
  })

  it('returns 404 when template_id does not exist', async () => {
    const { validateApiKey } = await import('@/lib/auth/validateApiKey')
    vi.mocked(validateApiKey).mockResolvedValue('user-123')
    mockTemplateSingle.mockResolvedValue({ data: null, error: { code: 'PGRST116' } })

    const { POST } = await import('@/app/api/v1/images/route')
    const res = await POST(makeRequest({ template_id: 'tpl_nonexistent', modifications: [] }))

    expect(res.status).toBe(404)
  })

  it('returns 400 when template_id is missing from body', async () => {
    const { validateApiKey } = await import('@/lib/auth/validateApiKey')
    vi.mocked(validateApiKey).mockResolvedValue('user-123')

    const { POST } = await import('@/app/api/v1/images/route')
    const res = await POST(makeRequest({ modifications: [] }))

    expect(res.status).toBe(400)
  })
})
