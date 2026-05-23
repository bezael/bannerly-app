import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Template } from '@/lib/templates/types'

const renderLayoutMock = vi.fn()
const uploadImageMock = vi.fn()
const getTemplateMock = vi.fn()
const getLayoutMock = vi.fn()

vi.mock('@/lib/renderer/render', () => ({
  renderLayout: (...args: unknown[]) => renderLayoutMock(...args),
}))
vi.mock('@/lib/storage/upload-image', () => ({
  uploadImage: (...args: unknown[]) => uploadImageMock(...args),
}))
vi.mock('@/lib/templates/get-template-by-slug-global', () => ({
  getTemplateBySlugGlobal: (...args: unknown[]) => getTemplateMock(...args),
}))
vi.mock('@/templates/layouts', () => ({
  getLayout: (...args: unknown[]) => getLayoutMock(...args),
}))
vi.mock('@/lib/supabase/service', () => ({
  createServiceClient: () => ({}),
}))

const { POST } = await import('./route')

const sampleTemplate: Template = {
  id: 'uuid-1',
  slug: 'og-basic',
  name: 'OG',
  layout_id: 'og-basic',
  width: 1200,
  height: 630,
  layers: [],
  user_id: 'user-1',
  created_at: '2026-01-01T00:00:00Z',
}

function makeRequest(body: unknown, auth?: string): Request {
  const headers: Record<string, string> = { 'content-type': 'application/json' }
  if (auth) headers.authorization = auth
  return new Request('http://localhost/api/v1/images', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  renderLayoutMock.mockReset()
  uploadImageMock.mockReset()
  getTemplateMock.mockReset()
  getLayoutMock.mockReset()
})

describe('POST /api/v1/images', () => {
  it('rejects request without API key', async () => {
    const res = await POST(makeRequest({}))
    expect(res.status).toBe(401)
  })

  it('rejects request with invalid body', async () => {
    const res = await POST(makeRequest({}, 'Bearer bnly_abc'))
    expect(res.status).toBe(400)
  })

  it('returns 404 when template is not found', async () => {
    getTemplateMock.mockResolvedValueOnce(null)
    const res = await POST(
      makeRequest(
        { template_id: 'missing', modifications: [] },
        'Bearer bnly_abc',
      ),
    )
    expect(res.status).toBe(404)
  })

  it('returns 500 when layout is unknown', async () => {
    getTemplateMock.mockResolvedValueOnce({
      ...sampleTemplate,
      layout_id: 'unknown',
    })
    getLayoutMock.mockReturnValueOnce(null)
    const res = await POST(
      makeRequest(
        { template_id: 'og-basic', modifications: [] },
        'Bearer bnly_abc',
      ),
    )
    expect(res.status).toBe(500)
    const json = (await res.json()) as { error: string }
    expect(json.error).toContain('Unknown layout_id')
  })

  it('renders and uploads, returning the public URL', async () => {
    getTemplateMock.mockResolvedValueOnce(sampleTemplate)
    getLayoutMock.mockReturnValueOnce(() => null)
    renderLayoutMock.mockResolvedValueOnce(Buffer.from([0x89]))
    uploadImageMock.mockResolvedValueOnce({
      id: 'gen_xyz',
      publicUrl: 'https://example.com/x.png',
    })

    const res = await POST(
      makeRequest(
        {
          template_id: 'og-basic',
          modifications: [{ name: 'title', text: 'Hello' }],
        },
        'Bearer bnly_abc',
      ),
    )
    expect(res.status).toBe(200)
    const json = (await res.json()) as {
      id: string
      template_id: string
      image_url: string
    }
    expect(json).toMatchObject({
      id: 'gen_xyz',
      template_id: 'og-basic',
      image_url: 'https://example.com/x.png',
    })
    expect(renderLayoutMock).toHaveBeenCalledWith(
      expect.anything(),
      1200,
      630,
    )
  })

  it('returns 500 with render error detail when satori fails', async () => {
    getTemplateMock.mockResolvedValueOnce(sampleTemplate)
    getLayoutMock.mockReturnValueOnce(() => null)
    renderLayoutMock.mockRejectedValueOnce(new Error('satori boom'))

    const res = await POST(
      makeRequest(
        { template_id: 'og-basic', modifications: [] },
        'Bearer bnly_abc',
      ),
    )
    expect(res.status).toBe(500)
    const json = (await res.json()) as { error: string; detail: string }
    expect(json.error).toBe('Render failed')
    expect(json.detail).toBe('satori boom')
  })
})
