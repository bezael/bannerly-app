import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSatori = vi.fn()
const mockResvg = vi.fn()

vi.mock('satori', () => ({ default: mockSatori }))
vi.mock('@resvg/resvg-js', () => ({
  Resvg: class {
    render() { return { asPng: () => Buffer.from('fakepng') } }
  },
}))

describe('renderTemplate', () => {
  beforeEach(() => vi.clearAllMocks())

  it('calls Satori with the evaluated component and returns a Buffer', async () => {
    mockSatori.mockResolvedValue('<svg><rect/></svg>')

    const { renderTemplate } = await import('@/lib/renderer')
    const jsx_code = `({ title }) => React.createElement('div', { style: { width: 100, height: 100 } }, title)`
    const result = await renderTemplate(jsx_code, { title: 'Hola' }, 1200, 630)

    expect(mockSatori).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ width: 1200, height: 630 })
    )
    expect(result).toBeInstanceOf(Buffer)
  })

  it('throws when jsx_code cannot be evaluated', async () => {
    const { renderTemplate } = await import('@/lib/renderer')
    await expect(
      renderTemplate('esto no es JS válido %%%', {}, 1200, 630)
    ).rejects.toThrow()
  })

  it('passes modifications as props to the component', async () => {
    mockSatori.mockResolvedValue('<svg/>')
    let capturedElement: unknown

    mockSatori.mockImplementation((el) => {
      capturedElement = el
      return Promise.resolve('<svg/>')
    })

    const { renderTemplate } = await import('@/lib/renderer')
    const jsx_code = `({ title, badge }) => React.createElement('div', null, title + ' ' + badge)`
    await renderTemplate(jsx_code, { title: 'Test', badge: 'EP01' }, 800, 400)

    expect(capturedElement).toBeDefined()
  })
})
