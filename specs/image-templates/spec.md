# Spec — Image Templates

> Plantilla Spec-First de Dominicode (Bezael Pérez).

---

## SECCIÓN 1 — Visión del producto

**Visión:**
Permitir que cada usuario de Bannerly cree, gestione y use sus propios templates de imagen, definidos como componentes React JSX con campos dinámicos, de modo que el endpoint `POST /api/v1/images` pueda renderizarlos en PNG a partir de un `template_id` + `modifications`.

---

## SECCIÓN 2 — Usuarios y casos de uso

**Usuario dashboard (dueño del proyecto):** ver la lista de sus templates, crear un template nuevo eligiendo un layout JSX predefinido y nombrando sus campos, ver el `template_id` de cada template para usarlo en la API, eliminar un template.

**Usuario API consumer (desarrollador):** llamar `POST /api/v1/images` con un `template_id` propio y recibir una `image_url` con el PNG generado.

**Sistema:** autenticar al usuario del dashboard vía Supabase Auth, aislar templates por `user_id`, leer el template correcto al momento del render, aplicar las `modifications` sobre el componente JSX y producir el PNG.

---

## SECCIÓN 3 — Funcionalidades

**Módulo `supabase` — schema (tabla existente, adaptada):**
- La tabla `templates` tiene: `id`, `user_id`, `template_uid` (identificador único por usuario, ej. `og-basic`), `name`, `width`, `height`, `jsx_code` (JSX como string con placeholders `{{fieldName}}`), `thumbnail_url`, `created_at`, `updated_at`.
- El JSX se almacena en la DB. Los campos modificables son los placeholders `{{fieldName}}` dentro del `jsx_code`.
- El sistema aplica RLS: un usuario solo puede leer y escribir sus propios templates.

**Módulo `lib/templates`:**
- El sistema permite obtener un template por `template_uid` + `user_id` desde Supabase (server-side, service-role).
- El sistema devuelve `null` si el template no existe o no pertenece al usuario.
- El sistema permite listar todos los templates de un usuario.
- El sistema permite crear un template nuevo validando que el `template_uid` sea único por usuario.

**Módulo `templates/seeds`:**
- El sistema incluye al menos un template semilla: `og-basic` — 1200×630, con placeholders `{{title}}` y `{{avatar}}` en su `jsx_code`.
- Los seeds se insertan vía migration SQL o script.

**Módulo `lib/renderer`:**
- El sistema permite sustituir los placeholders `{{fieldName}}` en el `jsx_code` con los valores de `modifications`.
- El sistema permite evaluar el JSX string resultante y renderizarlo con Satori → SVG.
- El sistema permite convertir el SVG → PNG via @resvg/resvg-js.
- El sistema permite subir el PNG a Supabase Storage bucket `bannerly-images` y retornar la URL pública.

**Módulo `app/dashboard/templates` — UI:**
- El usuario puede ver la lista de sus templates (nombre, template_uid, dimensiones, fecha).
- El usuario puede crear un template nuevo con nombre, template_uid y jsx_code.
- El usuario puede ver el `template_uid` de cada template para copiar y usar en la API.
- El usuario puede eliminar un template (con confirmación).

**Módulo `app/api/v1/images` — endpoint:**
- El sistema permite recibir `POST /api/v1/images` con `{ template_id, modifications }`.
- El sistema valida que el template exista y pertenezca al usuario autenticado vía API key.
- El sistema sustituye los placeholders del `jsx_code` con los valores de `modifications`.
- El sistema retorna `{ id, template_id, image_url, created_at }`.

---

## SECCIÓN 4 — Flujos de usuario

**Flujo — Crear un template desde el dashboard:**
1. El usuario navega a `/dashboard/templates`.
2. El sistema muestra la lista de templates existentes (vacía si es nuevo).
3. El usuario hace clic en "Nuevo template".
4. El sistema muestra un formulario: nombre, layout predefinido (selector), preview estático.
5. El usuario completa el nombre, elige el layout `og-basic` y confirma.
6. El sistema genera el `slug` a partir del nombre (kebab-case), inserta el template en Supabase con el `user_id` del usuario autenticado.
7. El sistema redirige al listado y muestra el template recién creado con su `slug`.
- **Error:** nombre vacío → validación client-side, no se envía el form.
- **Error:** slug duplicado para ese usuario → el sistema responde con mensaje "Ya tienes un template con ese nombre".
- **Error:** usuario no autenticado → redirect a `/login`.

**Flujo — Renderizar imagen via API:**
1. El API consumer llama `POST /api/v1/images` con `Authorization: Bearer bnly_<key>` y `{ template_id: "tpl_og_basic", modifications: [{ name: "title", text: "Hello World" }, { name: "avatar", image_url: "https://..." }] }`.
2. El sistema valida el Bearer token y obtiene el `user_id` asociado (scope futuro: tabla `api_keys`; en MVP se puede usar el anon key o un stub).
3. El sistema busca el template por `slug = template_id` y `user_id`.
4. El sistema mapea las `modifications` a `fields: { title: "Hello World", avatar: "https://..." }`.
5. El sistema llama al renderer: JSX layout(`og-basic`) + fields → SVG → PNG.
6. El sistema sube el PNG a `bannerly-images/<user_id>/<gen_id>.png`.
7. El sistema inserta un registro en `generations` (scope futuro) y responde `200 { id, template_id, image_url, created_at }`.
- **Error:** template no encontrado → `404 { error: "Template not found" }`.
- **Error:** modification con `name` que no existe en el layout → ignorar o `400 { error: "Unknown layer: X" }`.
- **Error:** falla Satori/resvg → `500 { error: "Render failed", detail: "..." }`.
- **Error:** falla Storage upload → `500 { error: "Storage upload failed" }`.

**Flujo — Eliminar un template:**
1. El usuario hace clic en "Eliminar" sobre un template en el listado.
2. El sistema muestra un diálogo de confirmación ("¿Eliminar tpl_og_basic? Esta acción no se puede deshacer.").
3. El usuario confirma.
4. El sistema llama `DELETE /api/templates/:id` (o Server Action) y elimina el registro.
5. El sistema actualiza el listado sin el template eliminado.
- **Error:** intento de eliminar un template de otro usuario → RLS bloquea, `403`.
- **Error:** fallo de red → mensaje de error en UI, el template sigue visible.

---

## SECCIÓN 5 — Arquitectura

- **Frontend:** Next.js 16 App Router — `app/dashboard/templates/` con Server Components + Client Components para el form.
- **Backend:** Route Handler en `app/api/v1/images/route.ts`; Server Actions o Route Handler para CRUD de templates en el dashboard.
- **Base de datos:** Supabase PostgreSQL — tabla `templates` con RLS. Migration SQL en `supabase/migrations/`.
- **Rendering:** `satori` + `@resvg/resvg-js` (a instalar). Layouts JSX en `templates/layouts/`.
- **Storage:** bucket `bannerly-images` (público). Path: `<user_id>/<gen_id>.png`.
- **Auth:** Supabase Auth (cookies) para el dashboard; API key stub para el endpoint (la validación completa es scope de `api-keys` feature).
- **Integraciones:** `satori`, `@resvg/resvg-js`.

---

## SECCIÓN 6 — Requisitos no funcionales

- **Rendimiento:** render completo (Satori → resvg → upload) < 5s para una imagen 1200×630.
- **Seguridad:** RLS en la tabla `templates`; service-role key solo en server-side; el PNG en Storage es público pero bajo un path que incluye `user_id`.
- **Escalabilidad:** cada request de render es stateless; el PNG se guarda en Storage para reutilización.
- **Idioma:** UI del dashboard en español; respuestas JSON de la API en inglés.
- **Accesibilidad:** el formulario de creación de templates debe ser navegable por teclado y tener labels correctos.

---

*Cuando todas las secciones estén cerradas, pasa a `plan.md`.*
