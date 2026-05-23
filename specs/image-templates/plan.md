# Plan técnico — Image Templates

> Derivado de `spec.md`. Traduce decisiones de negocio a decisiones técnicas concretas.

---

## Stack final

| Capa | Decisión | Rationale |
|------|----------|-----------|
| Frontend | Next.js 16 App Router — Server + Client Components | Ya instalado; Server Components para fetch de datos, Client Components para el form interactivo |
| Backend | Route Handlers (`app/api/v1/images`) + Server Actions (dashboard CRUD) | Server Actions simplifican el CRUD sin exponer endpoints extra |
| Base de datos | Supabase PostgreSQL + RLS | Ya configurado; RLS garantiza aislamiento por `user_id` sin lógica extra en app |
| Rendering | `satori` + `@resvg/resvg-js` | Satori convierte JSX → SVG sin browser; resvg convierte SVG → PNG en Node |
| Storage | Supabase Storage — bucket `bannerly-images` | Ya mencionado en CLAUDE.md; path `<user_id>/<gen_id>.png` |
| Auth | Supabase Auth (cookies) para dashboard | Ya en el stack; RLS se apoya en `auth.uid()` |
| CI / Tests | Vitest (a instalar) | Ecosistema Node-TS; compatible con Next.js sin config extra |

---

## Modelo de datos

```sql
-- supabase/migrations/001_create_templates.sql

create table public.templates (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null,                        -- ej. "tpl_og_basic", único por usuario
  name        text not null,                        -- display name
  layout_id   text not null,                        -- referencia al componente JSX: "og-basic"
  width       integer not null default 1200,
  height      integer not null default 630,
  layers      jsonb not null default '[]',           -- [{ name, type, style? }]
  user_id     uuid not null references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique(slug, user_id)
);

-- RLS
alter table public.templates enable row level security;

create policy "Users can manage their own templates"
  on public.templates
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

**Nota:** `layout_id` es el identificador del componente JSX en `templates/layouts/`. La tabla no almacena el JSX — solo el ID que el renderer usa para importar el layout correcto.

### Tipo Layer (TypeScript)

```ts
type LayerType = 'text' | 'image'

interface Layer {
  name: string       // identificador del campo modificable, ej. "title"
  type: LayerType
  style?: {          // opcional — valores por defecto del layout
    fontSize?: number
    color?: string
    x?: number
    y?: number
  }
}
```

---

## Contratos de API / Server Actions

### `POST /api/v1/images` (público, API key auth — stub en MVP)

```
Request:
  Authorization: Bearer bnly_<key>   (stub: se acepta cualquier Bearer en MVP)
  Body: { template_id: string, modifications: { name: string, text?: string, image_url?: string }[] }

Response 200:
  { id: string, template_id: string, image_url: string, created_at: string }

Response 404:
  { error: "Template not found" }

Response 500:
  { error: "Render failed" | "Storage upload failed", detail?: string }
```

### Server Actions — Dashboard Templates

```ts
getTemplates(userId)          // → Template[]
createTemplate(data, userId)  // → Template | { error: string }
deleteTemplate(id, userId)    // → void | { error: string }
```

---

## Estructura de archivos

```
supabase/
  migrations/
    001_create_templates.sql

templates/
  layouts/
    og-basic.tsx              # componente JSX: recibe fields, retorna JSX para Satori
    index.ts                  # registry: layout_id → componente

lib/
  templates/
    get-template.ts           # getTemplateBySlug(slug, userId) → Template | null
    list-templates.ts         # listTemplates(userId) → Template[]
    create-template.ts        # createTemplate(data, userId) → Template
    delete-template.ts        # deleteTemplate(id, userId) → void
  renderer/
    render.ts                 # renderTemplate(layout, fields, width, height) → Buffer (PNG)
    satori.ts                 # jsx → svg via satori
    resvg.ts                  # svg → png buffer via @resvg/resvg-js

app/
  dashboard/
    templates/
      page.tsx                # Server Component — lista templates del usuario
      new/
        page.tsx              # Client Component — form de creación
  api/
    v1/
      images/
        route.ts              # POST handler — render pipeline completo

components/
  templates/
    template-list.tsx         # lista de templates con botón eliminar
    template-card.tsx         # card individual con slug copiable
    template-form.tsx         # form de creación (Client Component)
```

---

## Dependencias externas a instalar

```bash
pnpm add satori @resvg/resvg-js
pnpm add -D vitest @vitejs/plugin-react vite
```

---

## Riesgos técnicos y mitigaciones

| Riesgo | Mitigación |
|--------|-----------|
| `@resvg/resvg-js` requiere binario nativo — puede fallar en algunos entornos | Testear en dev local primero; en Vercel usar Edge Runtime solo para Satori, resvg en Node runtime |
| Satori solo soporta un subconjunto de CSS (flexbox, no grid) | Diseñar `og-basic.tsx` solo con flexbox; documentar restricción |
| Fuentes en Satori deben cargarse como `ArrayBuffer` | Incluir fuente (Inter o similar) como asset estático en `public/fonts/` y cargarla en el renderer |
| Slug duplicado por race condition | `unique(slug, user_id)` en DB; capturar error de constraint en la Server Action |
| RLS mal configurado expone templates de otros usuarios | Test de integración con dos usuarios distintos antes de merge |

---

## Orden de construcción

```
Fase 0 — Setup test runner (Vitest)
Fase 1 — DB schema (migration + RLS)
Fase 2 — Lib/templates (CRUD functions)
Fase 3 — Lib/renderer (satori + resvg pipeline)
Fase 4 — Layout og-basic.tsx + registry
Fase 5 — API endpoint POST /api/v1/images
Fase 6 — Dashboard UI (list + create + delete)
```

Cada fase tiene sus tests Red → Green antes de pasar a la siguiente.
