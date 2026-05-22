# Tasks — Bannerly MVP

> Derivado de `spec.md` + `plan.md`. Ejecutar en orden estricto.
> 🔴 test que falla → 🟢 implementación mínima → 🔵 refactor (si aporta).
> Si una tarea revela ambigüedad en el spec → vuelve al spec primero.

---

## Convenciones

- `[ ]` → pendiente / `[x]` → completada
- ⚙️ Setup | 🔴 Red | 🟢 Green | 🔵 Refactor | 🔗 Integración

---

## Fase 0 — Setup del proyecto

- [ ] ⚙️ **Instalar Vitest + Testing Library** — `pnpm add -D vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom`. Archivos: `vitest.config.ts`, `vitest.setup.ts`. Test: `pnpm test` muestra "no tests found" sin error.
- [ ] ⚙️ **Instalar dependencias de rendering** — `pnpm add @vercel/satori @resvg/resvg-js nanoid`. Verificar que `pnpm build` pasa con Node runtime.
- [ ] ⚙️ **Crear estructura de carpetas** — `app/(auth)/`, `app/dashboard/`, `app/api/v1/images/`, `components/`, `lib/supabase/`, `lib/renderer/`, `lib/auth/`. Test: N/A.
- [ ] ⚙️ **Configurar tres clientes Supabase** — `lib/supabase/browser.ts`, `lib/supabase/server.ts` (cookies), `lib/supabase/service-role.ts`. Test: N/A.
- [ ] ⚙️ **Instalar dependencias de rate limiting** — `pnpm add @upstash/ratelimit @upstash/redis`. Configurar variables `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN` en `.env.local`. Test: N/A.
- [ ] ⚙️ **Migration inicial: tablas api_keys, templates, generations** — archivo `supabase/migrations/001_core_tables.sql` con RLS habilitado. Test: `pnpm supabase db reset` sin errores.
- [ ] ⚙️ **Migration seed: plantillas base** — archivo `supabase/migrations/002_seed_templates.sql` con `tpl_og_basic` (1200×630) y `tpl_og_wide` (1200×400) como JSX serializado. Test: `SELECT count(*) FROM templates WHERE template_uid LIKE 'tpl_%'` devuelve 2.

---

## Fase 1 — Módulo Auth

### Funcionalidad: El usuario puede registrarse con email y password

- [ ] 🔴 **Test: registro con email válido crea sesión** — archivos: `tests/auth/register.test.ts`. Criterio: `spec.md §3 → "El usuario puede registrarse"`. Mockear Supabase Auth. Debe FALLAR.
- [ ] 🟢 **Implementar `app/(auth)/register/page.tsx` + server action** — `<AuthForm>` con campos email/password, llama `supabase.auth.signUp()`. Hace pasar el test.
- [ ] 🔵 **Refactor: extraer `<AuthForm>`** — archivos: `components/AuthForm.tsx`. Reutilizable para login. Tests en verde.

### Funcionalidad: El usuario puede iniciar y cerrar sesión

- [ ] 🔴 **Test: login con credenciales válidas setea cookie de sesión** — archivos: `tests/auth/login.test.ts`. Debe FALLAR.
- [ ] 🟢 **Implementar `app/(auth)/login/page.tsx` + server action** — `supabase.auth.signInWithPassword()`. Test en verde.
- [ ] 🔴 **Test: logout elimina cookie de sesión y redirige a /login** — archivos: `tests/auth/logout.test.ts`. Debe FALLAR.
- [ ] 🟢 **Implementar server action de logout** — `supabase.auth.signOut()` + `redirect('/login')`. Test en verde.

### Funcionalidad: El sistema redirige rutas protegidas sin sesión

- [ ] 🔴 **Test: GET /dashboard sin sesión redirige a /login** — archivos: `tests/auth/middleware.test.ts`. Debe FALLAR.
- [ ] 🟢 **Implementar `middleware.ts`** — usar `@supabase/ssr` para leer sesión desde cookies; redirigir si no existe. Test en verde.

### Cierre del módulo

- [ ] 🔗 **Test de integración Auth** — registro → login → acceder a /dashboard → logout → verificar redirección. Archivos: `tests/auth/integration.test.ts`.

---

## Fase 2 — Módulo API Keys

### Funcionalidad: El usuario puede crear una API key

- [ ] 🔴 **Test: crear key genera prefijo bnly_ y almacena hash SHA-256** — archivos: `tests/api-keys/create.test.ts`. Criterio: `spec.md §3 → "El usuario puede crear una API key"`. Debe FALLAR.
- [ ] 🟢 **Implementar `lib/auth/apiKeys.ts`** — `generateApiKey()` con nanoid + prefijo `bnly_`, `hashApiKey()` con `crypto.subtle.digest`. Test en verde.
- [ ] 🟢 **Implementar `app/dashboard/api-keys/actions.ts`** — server action `createApiKey(name)` → inserta en tabla `api_keys`. Test en verde.
- [ ] 🟢 **Implementar `app/dashboard/api-keys/page.tsx`** — UI con form de nombre + lista de keys activas (`<ApiKeyRow>`). Test en verde.

### Funcionalidad: El usuario puede revocar una API key

- [ ] 🔴 **Test: revocar key setea revoked_at y bloquea requests** — archivos: `tests/api-keys/revoke.test.ts`. Debe FALLAR.
- [ ] 🟢 **Implementar server action `revokeApiKey(id)`** — update `revoked_at = now()`. Test en verde.

### Funcionalidad: El sistema valida API key en cada request

- [ ] 🔴 **Test: validateApiKey() retorna user_id para key válida y null para revocada** — archivos: `tests/api-keys/validate.test.ts`. Debe FALLAR.
- [ ] 🟢 **Implementar `lib/auth/validateApiKey.ts`** — hash del Bearer token, buscar en DB, verificar `revoked_at is null`. Test en verde.

### Cierre del módulo

- [ ] 🔗 **Test de integración API Keys** — crear key → validar → revocar → validar nuevamente (debe fallar). Archivos: `tests/api-keys/integration.test.ts`.

---

## Fase 3 — Módulo Templates

### Funcionalidad: El usuario puede crear y listar plantillas

- [ ] 🔴 **Test: crear template guarda jsx_code y genera template_uid tpl_*** — archivos: `tests/templates/create.test.ts`. Criterio: `spec.md §3 → "El usuario puede crear una plantilla"`. Debe FALLAR.
- [ ] 🟢 **Implementar server action `createTemplate(data)`** — inserta en tabla `templates` con `nanoid()` prefijado `tpl_`. Test en verde.
- [ ] 🟢 **Implementar `app/dashboard/templates/page.tsx`** — lista de `<TemplateCard>` con fetch server-side. Test en verde.

### Funcionalidad: El usuario puede editar y eliminar plantillas

- [ ] 🔴 **Test: editar template actualiza jsx_code y updated_at** — archivos: `tests/templates/update.test.ts`. Debe FALLAR.
- [ ] 🟢 **Implementar server action `updateTemplate(id, data)`** — update en DB. Test en verde.
- [ ] 🔴 **Test: eliminar template solo procede si no tiene generaciones recientes (últimas 24h)** — archivos: `tests/templates/delete.test.ts`. Debe FALLAR.
- [ ] 🟢 **Implementar server action `deleteTemplate(id)`** — verificar generaciones recientes, luego delete. Test en verde.
- [ ] 🟢 **Implementar `app/dashboard/templates/[id]/page.tsx`** — `<TemplateEditor>` con textarea JSX. Test en verde.

### Cierre del módulo

- [ ] 🔗 **Test de integración Templates** — crear → editar → intentar eliminar con generaciones recientes (debe fallar) → eliminar sin generaciones. Archivos: `tests/templates/integration.test.ts`.

---

## Fase 4 — Módulo Rendering (API pública)

### Funcionalidad: El sistema genera imagen PNG via POST /api/v1/images

- [ ] 🔴 **Test: renderTemplate() recibe JSX string + props y devuelve Buffer PNG** — archivos: `tests/renderer/render.test.ts`. Criterio: `spec.md §3 → "El sistema permite generar una imagen PNG"`. Debe FALLAR.
- [ ] 🟢 **Implementar `lib/renderer/index.ts`** — `renderTemplate(jsx, props, width, height)`: Satori → SVG string → resvg → PNG Buffer. Test en verde.
- [ ] 🔵 **Refactor renderer** — extraer `buildSatoriTree()` y `svgToPng()` como funciones puras. Tests en verde.

- [ ] 🔴 **Test: POST /api/v1/images con key válida y template existente devuelve 200 con image_url** — archivos: `tests/api/images.test.ts`. Debe FALLAR.
- [ ] 🔴 **Test: POST /api/v1/images con key inválida devuelve 401** — archivos: `tests/api/images-auth.test.ts`. Debe FALLAR.
- [ ] 🔴 **Test: POST /api/v1/images con template_id inexistente devuelve 404** — archivos: `tests/api/images-notfound.test.ts`. Debe FALLAR.
- [ ] 🟢 **Implementar `app/api/v1/images/route.ts`** — validar key → cargar template → renderizar → subir a Storage → insertar generation → responder. Tests en verde.
- [ ] 🔵 **Refactor route handler** — extraer `uploadToStorage()` y `saveGeneration()` a funciones separadas. Tests en verde.

### Funcionalidad: El sistema aplica rate limiting de 100 req/hora por API key

- [ ] 🔴 **Test: 101 requests con la misma key en una hora devuelve 429** — archivos: `tests/api/rate-limit.test.ts`. Criterio: `spec.md §2 → "El sistema valida API key y quota"`. Debe FALLAR.
- [ ] 🟢 **Implementar `lib/auth/rateLimiter.ts`** — `Ratelimit` de `@upstash/ratelimit` con ventana deslizante de 1h / 100 requests, con la API key como identificador. Integrar en el route handler antes del rendering. Test en verde.

### Cierre del módulo

- [ ] 🔗 **Test de integración Rendering** — crear template → generar imagen via API → verificar URL accesible → verificar generation en DB. Archivos: `tests/renderer/integration.test.ts`.

---

## Fase 5 — Módulo Dashboard (historial)

### Funcionalidad: El usuario puede ver su historial de generaciones

- [ ] 🔴 **Test: /dashboard/generations devuelve lista paginada del usuario autenticado** — archivos: `tests/dashboard/generations.test.ts`. Criterio: `spec.md §3 → "El usuario puede ver su historial"`. Debe FALLAR.
- [ ] 🟢 **Implementar `app/dashboard/generations/page.tsx`** — Server Component con fetch paginado + `<GenerationGallery>`. Test en verde.

### Funcionalidad: El sistema muestra estadísticas básicas

- [ ] 🔴 **Test: stats devuelve total de generaciones del mes actual** — archivos: `tests/dashboard/stats.test.ts`. Debe FALLAR.
- [ ] 🟢 **Implementar `app/dashboard/page.tsx`** — query COUNT con filtro `created_at >= inicio_del_mes`. Test en verde.
- [ ] 🟢 **Implementar `<DashboardLayout>`** — sidebar con links a Templates, API Keys, Generations. Test: N/A (visual).

---

## Fase E2E — Flujos end-to-end

- [ ] 🔗 **E2E flujo: registro y primera API key** — happy path completo. Archivos: `tests/e2e/onboarding.test.ts`.
- [ ] 🔗 **E2E flujo: registro con email duplicado** — error path. Archivos: `tests/e2e/onboarding-error.test.ts`.
- [ ] 🔗 **E2E flujo: generar imagen via API** — crear template → generar → verificar URL. Archivos: `tests/e2e/generate.test.ts`.
- [ ] 🔗 **E2E flujo: API key revocada bloquea generación** — revocar → intentar generar → 401. Archivos: `tests/e2e/generate-revoked.test.ts`.

---

## Fase final — Requisitos no funcionales

- [ ] 🔗 **NFR rendimiento: render < 3s para 1200×630** — benchmark con `console.time` en tests de rendering; falla si supera 3000ms. Archivos: `tests/perf/render-speed.test.ts`.
- [ ] 🔗 **NFR seguridad: usuario B no puede leer recursos de usuario A** — test RLS: crear 2 usuarios, verificar que queries devuelven 0 resultados cruzados. Archivos: `tests/security/rls.test.ts`.
- [ ] 🔗 **NFR seguridad: API key no se almacena en claro** — test que `api_keys.key_hash` nunca contiene la key original. Archivos: `tests/security/api-key-storage.test.ts`.
- [ ] ⚙️ **NFR idioma: strings de UI en español** — revisar todos los componentes; extraer a constantes si hay mezcla. Archivos: `components/**/*.tsx`.

---

## Reglas de ejecución

1. **Una tarea a la vez.** No abrir dos en paralelo en la misma sesión.
2. **Antes de marcar 🟢 completada:** correr `pnpm test` y verificar que el test correspondiente pasa.
3. **Antes de marcar 🔵 completada:** correr TODOS los tests y verificar que siguen en verde.
4. **Si una tarea revela ambigüedad en el spec:** detener ejecución, actualizar `spec.md` y `plan.md`, regenerar tareas afectadas.
5. **Commits:** uno por tarea completada. Mensaje: `[faseN] feat(módulo): descripción — task #N`.
