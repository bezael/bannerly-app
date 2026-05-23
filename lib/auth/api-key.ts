export interface ApiKeyContext {
  key: string
}

export function validateApiKey(authHeader: string | null): ApiKeyContext | null {
  if (!authHeader) return null

  const match = authHeader.match(/^Bearer\s+(bnly_[A-Za-z0-9_-]+)$/)
  if (!match) return null

  return { key: match[1] }
}
