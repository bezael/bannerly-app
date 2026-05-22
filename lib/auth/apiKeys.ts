import { nanoid } from 'nanoid'

export function generateApiKey(): { key: string; prefix: string } {
  const id = nanoid(32)
  const key = `bnly_${id}`
  const prefix = key.slice(-4)
  return { key, prefix }
}

export async function hashApiKey(key: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(key)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}
