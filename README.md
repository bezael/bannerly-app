# Bannerly

> Generación de imágenes dinámicas vía API. Diseña una plantilla una vez, renderiza miles de variantes a escala.

Alternativa open-source enfocada al desarrollador hispanohablante a [Bannerbear](https://www.bannerbear.com), Placid y similares. Construido en directo durante el workshop **Beyond Prompts** (22–23 mayo 2026) por [Bezael · Dominicode](https://www.youtube.com/@Dominicode) y [Freddy Montes](https://github.com/freddymontes), aplicando metodología **Spec-Driven Development**.

---

## Casos de uso

- Imágenes Open Graph dinámicas para blogs y SaaS
- Certificados, recibos y diplomas personalizados
- Creatividades para campañas y redes sociales a escala
- Miniaturas de YouTube generadas desde un script o automatización
- Tarjetas de bienvenida personalizadas en flujos de onboarding

## Features

### MVP (v0.1)

- Autenticación con email/password (Supabase Auth)
- Galería de plantillas pre-cargadas + plantillas propias
- Sustitución de textos, imágenes y colores por capa nombrada
- API REST autenticada con API keys por usuario
- Renderizado server-side a PNG (Satori + resvg)
- Almacenamiento en Supabase Storage
- Dashboard con historial de generaciones y previews

### Roadmap

- [ ] Editor visual drag-and-drop de capas
- [ ] Webhooks de generación asíncrona
- [ ] Signed URLs con expiración
- [ ] Colecciones (varios tamaños desde una sola plantilla)
- [ ] Generación de vídeo
- [ ] Integraciones con n8n y Zapier
- [ ] Billing con Stripe y planes por volumen

## Stack

| Capa | Tecnología |
|------|-----------|
| Framework | [Next.js 16](https://nextjs.org) (App Router) |
| Estilos | [Tailwind CSS](https://tailwindcss.com) |
| Auth + DB + Storage | [Supabase](https://supabase.com) |
| Renderer | [Satori](https://github.com/vercel/satori) + [@resvg/resvg-js](https://github.com/yisibl/resvg-js) |
| Validación | [Zod](https://zod.dev) |
| Deploy | [Vercel](https://vercel.com) |

## Empezar en local

### Requisitos

- Node.js 22+
- pnpm (recomendado) o npm
- Cuenta de [Supabase](https://supabase.com) (free tier basta)

### 1. Clonar e instalar

```bash
git clone https://github.com/dominicode/bannerly.git
cd bannerly
pnpm install
```

### 2. Configurar Supabase con la CLI

Necesitas la [Supabase CLI](https://supabase.com/docs/guides/cli) instalada y autenticada (`supabase login`).

#### Opción A — proyecto nuevo en la nube

```bash
# Crea el proyecto (te pedirá org-id; lista las tuyas con `supabase orgs list`)
supabase projects create bannerly-app \
  --org-id <tu-org-id> \
  --region us-east-1 \
  --db-password "<una-password-fuerte>"

# Enlaza el repo local al proyecto recién creado
supabase link --project-ref <project-ref>

# Aplica todas las migraciones (crea tabla `templates`, bucket `bannerly-images`
# y siembra la plantilla `og-basic`)
supabase db push
```

#### Opción B — proyecto existente

```bash
supabase link --project-ref <project-ref>
supabase db push
```

#### Opción C — Supabase local (Docker)

```bash
supabase start          # arranca Postgres + Storage + Auth en local
supabase db reset       # aplica migraciones contra la instancia local
```

`supabase start` imprime las URLs y keys locales que usarás en `.env.local`.

### 3. Configurar variables de entorno

Copia `.env.example` a `.env.local` y rellena con los valores de tu proyecto
(obtén las keys con `supabase projects api-keys --project-ref <ref>` o desde
el dashboard):

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=ey...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Arrancar

```bash
pnpm dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Uso de la API

Todas las peticiones requieren un API key en el header `Authorization`. Genera tu key desde `/dashboard/api-keys`.

### Generar una imagen

```bash
curl -X POST https://bannerly.app/api/v1/images \
  -H "Authorization: Bearer bnly_xxxxxxxxxxxxxxxxxxxx" \
  -H "Content-Type: application/json" \
  -d '{
    "template_id": "tpl_og_basic",
    "modifications": [
      { "name": "title",    "text": "Hola Dominicode" },
      { "name": "subtitle", "text": "Generado con Bannerly" },
      { "name": "avatar",   "image_url": "https://github.com/bezael.png" }
    ]
  }'
```

**Respuesta:**

```json
{
  "id": "gen_01HXYZABCDEF",
  "template_id": "tpl_og_basic",
  "image_url": "https://xxxxx.supabase.co/storage/v1/object/public/bannerly-images/gen_01HXYZABCDEF.png",
  "created_at": "2026-05-22T12:00:00Z"
}
```

### Listar generaciones

```bash
curl https://bannerly.app/api/v1/images \
  -H "Authorization: Bearer bnly_xxxxxxxxxxxxxxxxxxxx"
```

## Estructura del proyecto

```
bannerly/
├── app/
│   ├── (auth)/                  # login, register
│   ├── dashboard/               # UI privada
│   │   ├── templates/
│   │   ├── generations/
│   │   └── api-keys/
│   └── api/
│       └── v1/
│           └── images/          # endpoint público
├── components/
├── lib/
│   ├── supabase/                # clients (server, client, service-role)
│   ├── renderer/                # Satori + resvg
│   └── auth/                    # API key validation
├── supabase/
│   └── migrations/              # schema SQL
├── templates/                   # plantillas seed
└── specs/                       # specs SDD del proyecto
```

## Filosofía: construido con SDD

Bannerly se especifica antes de codear. Cada feature pasa por:

1. **Spec** — qué hace, qué no, contratos de API, criterios de aceptación
2. **Plan** — descomposición en tareas atómicas
3. **Implementación** — guiada por la spec, sin desvíos

Las specs viven en `/specs` y son ciudadanas de primera del repo. Si encuentras un comportamiento que no está en una spec, es un bug o una spec faltante. Si te interesa el método, échale un ojo a [SDD: Construye con control](https://leanpub.com/sdd-bezael).

## Flujo agéntico end-to-end (Claude + GitHub Actions)

El repo incluye un sistema agéntico que, a partir de un solo issue, implementa un
feature, lo prueba en un navegador real grabando vídeo, abre el PR y publica un
reporte. Es el demo construido durante el workshop **Beyond Prompts**.

### Cómo dispararlo (human-in-the-loop)

1. Abre un issue describiendo el feature. **No pasa nada todavía** — el issue queda a la espera.

   ```
   Título: Agregar página /preview

   Crea una ruta pública /preview que muestre las plantillas en una grilla
   de cards con su nombre. Pruébala navegando y verificando que renderiza.
   ```

2. Cuando quieras que Claude se ponga a trabajar, **añade la etiqueta `e2e`** al issue.
   Ese gesto manual es lo que dispara el flujo.

El disparo por etiqueta (`issues: labeled`) no choca con el workflow general
`claude.yml` (que responde a `@claude` pero no escucha el evento `labeled`). Crea la
etiqueta una vez con:

```bash
gh label create e2e --description "Dispara el flujo agéntico e2e de Claude" --color 5319e7
```

### Qué hace el agente

El workflow [`.github/workflows/claude-e2e-feature.yml`](.github/workflows/claude-e2e-feature.yml)
ejecuta el ciclo completo sin intervención humana:

1. **Implementa** — lee `/specs/` (crea uno si falta), crea la rama `feat/issue-N` e implementa el feature.
2. **Prueba** — añade un spec en `e2e/` que ejercita el golden path; Playwright graba un vídeo `.webm` de cada test. Corre `pnpm test:e2e`, `pnpm lint` y `pnpm test` hasta dejar todo en verde.
3. **Abre el PR** — contra `main`, con `Closes #N`.
4. **Reporta** — comenta en el PR qué se implementó, el resultado de los tests y el enlace a la corrida.
5. **Sube el vídeo** — como artifact descargable `e2e-video` de la corrida del workflow.

### Pruebas end-to-end en local

Las pruebas viven en `e2e/` y usan [Playwright](https://playwright.dev), configurado
en [`playwright.config.ts`](playwright.config.ts) para grabar vídeo, trace y screenshots
(`video: 'on'`). Playwright levanta `pnpm dev` automáticamente.

```bash
pnpm exec playwright install chromium   # una sola vez
pnpm test:e2e                           # corre los specs y graba vídeo
```

Los artefactos quedan en `e2e/.results/` (vídeos `.webm`, traces) y el reporte HTML
en `e2e/.report/`. Ambos directorios están en `.gitignore`.

### Secrets requeridos

En **Settings → Secrets and variables → Actions** del repo:

| Secret | Uso |
|--------|-----|
| `CLAUDE_CODE_OAUTH_TOKEN` | Token de Claude Code (compartido con los demás workflows) |
| `NEXT_PUBLIC_SUPABASE_URL` | Para que `pnpm dev` levante en CI |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Para que `pnpm dev` levante en CI |
| `SUPABASE_SERVICE_ROLE_KEY` | Para que `pnpm dev` levante en CI |

Sin las keys de Supabase el demo igual graba el vídeo (la home renderiza el estado
de error), pero con ellas se ejercita la app con datos reales.

## Contribuir

Este es un proyecto educativo construido en directo. Issues y PRs bienvenidos, especialmente si encuentras bugs durante o después del workshop. Para cambios grandes, abre primero un issue con la propuesta de spec.

## Licencia

MIT © 2026 [Bezael · Dominicode](https://www.youtube.com/@Dominicode) & Freddy Montes

## Agradecimientos

Inspirado en [Bannerbear](https://www.bannerbear.com) — gracias por marcar el estándar de lo que una API de generación de imágenes debe ser.
