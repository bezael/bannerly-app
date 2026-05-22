import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const mockLimit = vi.fn()

vi.mock('@upstash/ratelimit', () => ({
  Ratelimit: class {
    static slidingWindow() { return {} }
    limit = mockLimit
  },
}))
vi.mock('@upstash/redis', () => ({
  Redis: class {
    static fromEnv() { return new this() }
  },
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
              single: vi.fn().mockResolvedValue({
                data: { id: 'tpl-uuid', template_uid: 'tpl_og_basic', jsx_code: '<div/>', width: 1200, height: 630 },
                error: null,
              }),
            })),
          })),
        }
      }
      return { insert: vi.fn().mockResolvedValue({ error: null }) }
    }),
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn().mockResolvedValue({ error: null }),
        getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'https://storage.example.com/img.png' } })),
      })),
    },
  })),
}))

function makeRequest(apiKey = 'bnly_validkey') {
  return new NextRequest('http://localhost/api/v1/images', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ template_id: 'tpl_og_basic', modifications: [] }),
  })
}

describe('Rate limiting on POST /api/v1/images', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 429 when rate limit is exceeded', async () => {
    const { validateApiKey } = await import('@/lib/auth/validateApiKey')
    vi.mocked(validateApiKey).mockResolvedValue('user-123')
    mockLimit.mockResolvedValue({ success: false, limit: 100, remaining: 0, reset: Date.now() + 3600000 })

    const { POST } = await import('@/app/api/v1/images/route')
    const res = await POST(makeRequest())

    expect(res.status).toBe(429)
  })

  it('allows request through when under rate limit', async () => {
    const { validateApiKey } = await import('@/lib/auth/validateApiKey')
    const { renderTemplate } = await import('@/lib/renderer')
    vi.mocked(validateApiKey).mockResolvedValue('user-123')
    vi.mocked(renderTemplate).mockResolvedValue(Buffer.from('png'))
    mockLimit.mockResolvedValue({ success: true, limit: 100, remaining: 99, reset: Date.now() + 3600000 })

    const { POST } = await import('@/app/api/v1/images/route')
    const res = await POST(makeRequest())

    expect(res.status).toBe(200)
  })
})
