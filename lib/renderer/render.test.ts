import { describe, it, expect } from 'vitest'
import { renderTemplate } from './render'

describe('renderTemplate', () => {
  it('returns a PNG Buffer with size > 0', async () => {
    const jsxCode = `
      <div style={{ display: 'flex', background: '#fff', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 48 }}>{{title}}</span>
      </div>
    `
    const modifications = [{ name: 'title', text: 'Hello Bannerly' }]

    const buffer = await renderTemplate(jsxCode, modifications, 1200, 630)

    expect(buffer).toBeInstanceOf(Buffer)
    expect(buffer.length).toBeGreaterThan(0)
    // PNG magic bytes: 89 50 4E 47
    expect(buffer[0]).toBe(0x89)
    expect(buffer[1]).toBe(0x50) // P
    expect(buffer[2]).toBe(0x4e) // N
    expect(buffer[3]).toBe(0x47) // G
  })
})
