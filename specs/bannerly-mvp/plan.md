# Plan técnico — Bannerly MVP

> Derivado de `spec.md`. Stack ya definido en `CLAUDE.md`; este plan lo detalla con decisiones técnicas concretas.

---

## 1. Stack final

- **Frontend:** Next.js 16 App Router + Tailwind CSS v4 — definido en CLAUDE.md; App Router permite colocar Server Components, route handlers y middleware en un solo repo.
- **Backend / API:** Next.js Route Handlers (`app/api/v1/images/route.ts`) — serverless sin infraestructura adicional; se despliega en Vercel Edge/Node runtime.
- **Base de datos:** Supabase PostgreSQL — RLS nativo para aislamiento por usuario; migrations en `supabase/migrations/`.
- **Autenticación:** Supabase Auth (email/password) para sesiones de dashboard + API keys propias con hash SHA-256 almacenado en tabla `api_keys`.
- **Render pipeline:** `@vercel/satori` (JSX→SVG) + `@resvg/resvg-js` (SVG→PNG) — ambas corren server-side en el route handler; sin necesidad de headless browser.
- **Storage:** Supabase Storage bucket `bannerly-images` (público) — URL pública directa sin signed URLs.
- **Hosting:** Vercel (Next.js) + Supabase Cloud — stack estándar, CI/CD automático desde GitHub.
- **CI / Tests:** Vitest (unit + integration) + Playwright (E2E) — Vitest para lógica de rendering/validación, Playwright para flujos de UI críticos.

### Stacks descartados

- **Headless Chromium (Puppeteer):** descartado porque Satori+resvg es 10× más rápido en serverless y no requiere instancia dedicada.
- **NextAuth.js:** descartado porque Supabase Auth ya provee email/password, sesiones por cookie, y RLS sin configuración adicional.
- **Firebase Storage:** descartado porque Supabase Storage está en el mismo proyecto, reduciendo latencia y complejidad.

---

## 2. Modelo de datos

- **`users`** — gestionado por Supabase Auth (`auth.users`); campos clave: `id (uuid), email`. Relación: tiene muchos `api_keys`, `templates`, `generations`.
- **`api_keys`** — campos: `id, user_id (fk), name, key_hash (sha256), prefix (últimos 4 chars), revoked_at (nullable), created_at`. Relación: pertenece a `users`.
- **`templates`** — campos: `id, user_id (fk), template_uid (tpl_*), name, width, height, jsx_code (text), thumbnail_url (nullable), created_at, updated_at`. Relación: pertenece a `users`, tiene muchos `generations`.
- **`generations`** — campos: `id (gen_*), user_id (fk), template_id (fk), image_url, modifications (jsonb), render_ms, created_at`. Relación: pertenece a `users` y `templates`.

---

## 3. Contratos (API y componentes principales)

**Backend / API:**
- `POST /api/v1/images` — genera imagen PNG. Input: `{ template_id, modifications[] }` + header `Authorization: Bearer bnly_*`. Output: `{ id, template_id, image_url, created_at }`.
- `GET /api/v1/images` — lista generaciones del usuario autenticado (paginado). Input: query `?page&limit&template_id`. Output: `{ data: Generation[], total }`.
- `GET /api/health` — health check básico. Output: `{ status: "ok", ts }`.

**Frontend / componentes principales:**
- `<AuthForm>` — formulario reutilizable login/register con validación client-side.
- `<TemplateEditor>` — textarea JSX + preview live usando iframe sandboxed o servidor de preview.
- `<TemplateCard>` — card con thumbnail, nombre, fecha, acciones (editar/eliminar).
- `<ApiKeyRow>` — fila de tabla con nombre, prefijo, fecha y botón revocar.
- `<GenerationGallery>` — grid paginado de generaciones con thumbnail y metadata.
- `<DashboardLayout>` — layout protegido con sidebar de navegación.

---

## 4. Dependencias externas

- **`@vercel/satori`** — uso: JSX→SVG server-side. Plan B: `puppeteer` en instancia dedicada (más lento, más caro).
- **`@resvg/resvg-js`** — uso: SVG→PNG buffer. Plan B: `sharp` con SVG input (menor fidelidad tipográfica).
- **`@supabase/ssr`** — uso: cliente Supabase con cookies para App Router. Plan B: `@supabase/supabase-js` con gestión manual de tokens.
- **`jose` o `crypto` nativo** — uso: hash SHA-256 para API keys. Plan B: `bcryptjs` (más lento pero estándar para passwords).
- **`nanoid`** — uso: generar IDs únicos con prefijos (`tpl_`, `gen_`, `bnly_`). Plan B: `uuid` (sin prefijo legible).
- **`@upstash/ratelimit` + `@upstash/redis`** — uso: rate limiting 100 req/hora por API key en `/api/v1/images`. Plan B: contador en tabla Supabase con `updated_at` (más lento, sin Redis).
- **Seed migration** (`supabase/migrations/002_seed_templates.sql`) — fixtures de plantillas base (`tpl_og_basic`, `tpl_og_wide`) insertadas en DB para que los usuarios puedan generar desde el primer día.

---

## 5. Riesgos técnicos y mitigaciones

- **Riesgo:** `@resvg/resvg-js` tiene binarios nativos que pueden fallar en Vercel Edge runtime. **Mitigación:** usar Vercel Node.js runtime (no Edge) para el route handler de rendering; verificar en CI con `pnpm build`.
- **Riesgo:** El JSX de usuario ejecutado server-side puede inyectar código malicioso. **Mitigación:** ejecutar Satori en un contexto sandboxed; validar que el JSX solo usa tags HTML permitidos (whitelist); no usar `eval` directo.
- **Riesgo:** Imágenes grandes (>2MB) pueden exceder el límite de respuesta de Vercel (4.5MB). **Mitigación:** limitar dimensiones máximas en spec a 2400×1260; comprimir PNG con `sharp` antes de subir.
- **Riesgo:** Rate limiting ausente en v1 puede ser abusado. **Mitigación:** añadir middleware de rate limit por API key (100 req/hora) con `upstash/ratelimit` o contador en Supabase.
- **Riesgo:** RLS mal configurado expone templates/generaciones entre usuarios. **Mitigación:** tests de integración que verifican que usuario B no puede leer recursos de usuario A; audit en cada migration.

---

## 6. Orden de construcción

1. **Módulo Auth** — primero porque todas las rutas protegidas dependen de sesión; sin esto nada más funciona.
2. **Módulo API Keys** — segundo porque el pipeline de rendering necesita validar keys; se puede probar con Postman antes de tener templates reales.
3. **Módulo Templates (CRUD básico)** — tercero porque el rendering necesita templates almacenados; editor avanzado se deja para después.
4. **Módulo Rendering (`POST /api/v1/images`)** — cuarto, es el core del producto; depende de Templates y API Keys.
5. **Módulo Dashboard (historial + stats)** — al final porque es UI sobre datos ya generados; no bloquea el valor principal.

---

## 7. Criterios de "hecho" para el plan

- [x] Todas las funcionalidades del spec aparecen en el modelo de datos o en los contratos
- [x] Cada riesgo tiene mitigación
- [x] El orden de construcción es claro y no tiene ciclos
- [x] El usuario ha confirmado el stack

*Cuando los 4 puntos estén tickeados, pasa a `tasks.md`.*
