import { createElement } from 'react'
import { NextResponse } from 'next/server'
import { validateApiKey } from '@/lib/auth/api-key'
import { createServiceClient } from '@/lib/supabase/service'
import { getTemplateBySlugGlobal } from '@/lib/templates/get-template-by-slug-global'
import { getLayout } from '@/templates/layouts'
import { renderLayout } from '@/lib/renderer/render'
import { uploadImage } from '@/lib/storage/upload-image'
import type { Modification } from '@/lib/templates/types'

interface RequestBody {
  template_id?: string
  modifications?: Modification[]
}

function modificationsToFields(mods: Modification[]): Record<string, string> {
  const fields: Record<string, string> = {}
  for (const m of mods) fields[m.name] = m.text ?? m.image_url ?? ''
  return fields
}

export async function POST(request: Request) {
  const auth = validateApiKey(request.headers.get('authorization'))
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: RequestBody
  try {
    body = (await request.json()) as RequestBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!body.template_id || !Array.isArray(body.modifications)) {
    return NextResponse.json(
      { error: 'template_id and modifications are required' },
      { status: 400 },
    )
  }

  const supabase = createServiceClient()
  const template = await getTemplateBySlugGlobal(supabase, body.template_id)
  if (!template) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 })
  }

  const Layout = getLayout(template.layout_id)
  if (!Layout) {
    return NextResponse.json(
      { error: `Unknown layout_id: ${template.layout_id}` },
      { status: 500 },
    )
  }

  const fields = modificationsToFields(body.modifications)
  const element = createElement(Layout, { fields, layers: template.layers })

  let png: Buffer
  try {
    png = await renderLayout(element, template.width, template.height)
  } catch (err) {
    return NextResponse.json(
      { error: 'Render failed', detail: (err as Error).message },
      { status: 500 },
    )
  }

  let upload
  try {
    upload = await uploadImage(supabase, template.user_id, png)
  } catch (err) {
    return NextResponse.json(
      { error: 'Storage upload failed', detail: (err as Error).message },
      { status: 500 },
    )
  }

  return NextResponse.json({
    id: upload.id,
    template_id: body.template_id,
    image_url: upload.publicUrl,
    created_at: new Date().toISOString(),
  })
}
