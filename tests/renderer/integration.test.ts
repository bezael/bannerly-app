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

vi.mock('satori', () => ({ default: vi.fn().mockResolvedValue('<svg><rect width="1200" height="630"/></svg>') }))
vi.mock('@resvg/resvg-js', () => ({
  Resvg: class {
    render() { return { asPng: () => Buffer.from('PNG_BYTES') } }
  },
}))

const uploadedFiles: string[] = []

vi.mock('@/lib/supabase/service-role', () => ({
  createServiceRoleClient: vi.fn(() => ({
    from: vi.fn((table: string) => {
      if (table === 'templates') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: 'tpl-uuid-1',
                  template_uid: 'tpl_og_basic',
                  jsx_code: `({ title }) => React.createElement('div', { style: { width: 1200, height: 630 } }, title)`,
                  width: 1200,
                  height: 630,
                },
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
        upload: vi.fn((path: string) => { uploadedFiles.push(path); return { error: null } }),
        getPublicUrl: vi.fn((path: string) => ({
          data: { publicUrl: `https://cdn.example.com/${path}` },
        })),
      })),
    },
  })),
}))

vi.mock('@/lib/auth/validateApiKey', () => ({
  validateApiKey: vi.fn().mockResolvedValue('user-123'),
}))

describe('Rendering integration: validate → load template → render → upload', () => {
  beforeEach(() => {
    uploadedFiles.length = 0
    vi.clearAllMocks()
  })

  it('full pipeline returns gen_ id and CDN image_url', async () => {
    const { POST } = await import('@/app/api/v1/images/route')

    const req = new NextRequest('http://localhost/api/v1/images', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer bnly_testkey',
      },
      body: JSON.stringify({
        template_id: 'tpl_og_basic',
        modifications: [
          { name: 'title', text: 'Hello Bannerly' },
        ],
      }),
    })

    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.id).toMatch(/^gen_/)
    expect(json.template_id).toBe('tpl_og_basic')
    expect(json.image_url).toContain('cdn.example.com')
    expect(uploadedFiles[0]).toMatch(/generations\/gen_.*\.png/)
  })
})
