import { NextRequest, NextResponse } from 'next/server'
import { nanoid } from 'nanoid'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { validateApiKey } from '@/lib/auth/validateApiKey'
import { renderTemplate } from '@/lib/renderer'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

export const runtime = 'nodejs'

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, '1 h'),
  prefix: 'bannerly:rl',
})

interface Modification {
  name: string
  text?: string
  image_url?: string
}

export async function POST(req: NextRequest) {
  // 1. Validate API key
  const authHeader = req.headers.get('authorization') ?? ''
  const apiKey = authHeader.replace(/^Bearer\s+/i, '')
  const userId = await validateApiKey(apiKey)
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Rate limit per API key
  const { success } = await ratelimit.limit(apiKey)
  if (!success) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
  }

  // 3. Parse body
  let body: { template_id?: string; modifications?: Modification[] }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.template_id) {
    return NextResponse.json({ error: 'template_id is required' }, { status: 400 })
  }

  const supabase = createServiceRoleClient()

  // 4. Load template
  const { data: template, error: tplError } = await supabase
    .from('templates')
    .select('id, template_uid, jsx_code, width, height')
    .eq('template_uid', body.template_id)
    .single()

  if (tplError || !template) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 })
  }

  // 5. Build props from modifications array
  const props: Record<string, unknown> = {}
  for (const mod of body.modifications ?? []) {
    props[mod.name] = mod.text ?? mod.image_url
  }

  // 6. Render
  const start = Date.now()
  let pngBuffer: Buffer
  try {
    pngBuffer = await renderTemplate(template.jsx_code, props, template.width, template.height)
  } catch (err) {
    console.error('[renderer]', err)
    return NextResponse.json({ error: 'Render failed' }, { status: 500 })
  }

  // 7. Upload to Storage + save generation
  const generationId = `gen_${nanoid(16)}`
  const imageUrl = await uploadToStorage(supabase, generationId, pngBuffer)
  await saveGeneration(supabase, {
    id: generationId,
    userId,
    templateId: template.id,
    templateUid: template.template_uid,
    imageUrl,
    modifications: body.modifications ?? [],
    renderMs: Date.now() - start,
  })

  return NextResponse.json({
    id: generationId,
    template_id: template.template_uid,
    image_url: imageUrl,
    created_at: new Date().toISOString(),
  })
}

async function uploadToStorage(
  supabase: ReturnType<typeof createServiceRoleClient>,
  generationId: string,
  buffer: Buffer
): Promise<string> {
  const path = `generations/${generationId}.png`
  await supabase.storage.from('bannerly-images').upload(path, buffer, {
    contentType: 'image/png',
    upsert: false,
  })
  const { data } = supabase.storage.from('bannerly-images').getPublicUrl(path)
  return data.publicUrl
}

async function saveGeneration(
  supabase: ReturnType<typeof createServiceRoleClient>,
  opts: {
    id: string
    userId: string
    templateId: string
    templateUid: string
    imageUrl: string
    modifications: Modification[]
    renderMs: number
  }
) {
  await supabase.from('generations').insert({
    id: opts.id,
    user_id: opts.userId,
    template_id: opts.templateId,
    image_url: opts.imageUrl,
    modifications: opts.modifications,
    render_ms: opts.renderMs,
  })
}
