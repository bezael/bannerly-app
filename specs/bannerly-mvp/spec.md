# Spec — Bannerly MVP

> Plantilla Spec-First de Dominicode (Bezael Pérez).
> Derivada del análisis de `bannerbear-poc.html` + `CLAUDE.md`.

---

## SECCIÓN 1 — Visión del producto

**Visión:**
Bannerly es una API SaaS open-source que permite a desarrolladores generar imágenes PNG dinámicas (og-images, banners, thumbnails) a partir de plantillas React mediante una llamada REST, como alternativa self-hosteable a Bannerbear/Placid.

---

## SECCIÓN 2 — Usuarios y casos de uso

**Usuario Dashboard (creador de plantillas):** registrarse/iniciar sesión, crear y editar plantillas visuales, obtener y revocar API keys, ver historial de imágenes generadas.

**Usuario API (desarrollador consumidor):** autenticarse con API key `bnly_*`, enviar modificaciones via `POST /api/v1/images`, recibir URL pública de la imagen generada, listar sus generaciones.

**Sistema (procesos automáticos):** renderizar SVG→PNG server-side con Satori + resvg, subir imagen a Supabase Storage, devolver URL pública CDN, validar API key y quota por request.

---

## SECCIÓN 3 — Funcionalidades

**Módulo Auth:**
- El usuario puede registrarse con email y password via Supabase Auth.
- El usuario puede iniciar sesión y mantener sesión con cookies HTTP-only.
- El usuario puede cerrar sesión desde el dashboard.
- El sistema redirige rutas protegidas a `/login` si no hay sesión activa.

**Módulo API Keys:**
- El usuario puede crear una API key con nombre descriptivo (prefijo `bnly_`).
- El usuario puede listar sus API keys activas con fecha de creación.
- El usuario puede revocar (eliminar) una API key existente.
- El sistema valida la API key en cada request a `/api/v1/images` antes de procesar.

**Módulo Templates:**
- El usuario puede crear una plantilla definiendo nombre, dimensiones (ancho × alto) y layout JSX.
- El usuario puede listar sus plantillas con nombre, thumbnail y fecha de creación.
- El usuario puede editar una plantilla existente.
- El usuario puede eliminar una plantilla (con confirmación, solo si no tiene generaciones recientes).
- El sistema almacena las plantillas como código JSX serializado en Supabase.

**Módulo Rendering (API pública):**
- El sistema permite generar una imagen PNG via `POST /api/v1/images` con `template_id` y `modifications`.
- El sistema renderiza el template con Satori (JSX → SVG) y resvg-js (SVG → PNG) server-side.
- El sistema sube la imagen generada al bucket `bannerly-images` de Supabase Storage.
- El sistema devuelve `{ id, template_id, image_url, created_at }` en la respuesta.
- El sistema registra cada generación en la tabla `generations` con metadata.

**Módulo Dashboard (historial):**
- El usuario puede ver su historial de imágenes generadas con thumbnail, template usado y fecha.
- El usuario puede filtrar generaciones por template o rango de fechas.
- El sistema muestra estadísticas básicas: total de generaciones este mes y uso de quota.

---

## SECCIÓN 4 — Flujos de usuario

**Flujo — Registro y primera API key:**
1. El usuario navega a `/register` e ingresa email + password.
2. El sistema crea cuenta vía Supabase Auth y redirige al dashboard.
3. El usuario va a "API Keys" y hace clic en "Nueva API Key".
4. Ingresa un nombre descriptivo y confirma.
5. El sistema genera una key con prefijo `bnly_` y la muestra una sola vez.
6. El usuario copia la key; el sistema almacena solo el hash SHA-256.
- **Error:** si el email ya está registrado, el sistema muestra "Email ya en uso".
- **Error:** si el password tiene menos de 8 caracteres, el sistema muestra validación inline.

**Flujo — Crear plantilla:**
1. El usuario hace clic en "Nueva Plantilla" en el dashboard.
2. Ingresa nombre y dimensiones (ej. 1200×630).
3. Pega o edita el JSX del componente de plantilla.
4. El sistema muestra un preview renderizado en tiempo real.
5. El usuario guarda; el sistema almacena la plantilla con un `template_id` único (`tpl_*`).
- **Error:** si el JSX tiene errores de sintaxis, el preview muestra el error en rojo y el botón Guardar se deshabilita.
- **Error:** si el nombre ya existe para ese usuario, el sistema pide un nombre diferente.

**Flujo — Generar imagen via API:**
1. El desarrollador envía `POST /api/v1/images` con `Authorization: Bearer bnly_<key>`.
2. El sistema valida la API key (hash match + no revocada).
3. El sistema carga el template JSX del `template_id` solicitado.
4. El sistema aplica las `modifications` como props al componente.
5. Satori convierte JSX → SVG; resvg-js convierte SVG → PNG buffer.
6. El PNG se sube a Supabase Storage; el sistema devuelve la URL pública.
- **Error:** si la API key es inválida o revocada → `401 Unauthorized`.
- **Error:** si el `template_id` no existe → `404 Not Found`.
- **Error:** si el render falla (JSX inválido en producción) → `500` con mensaje descriptivo y log.

**Flujo — Ver historial de generaciones:**
1. El usuario autenticado navega a `/dashboard/generations`.
2. El sistema carga la lista paginada de generaciones del usuario (20 por página).
3. El usuario puede hacer clic en una generación para ver la imagen full-size y el payload usado.
4. El usuario puede filtrar por template usando el selector.
- **Error:** si Supabase Storage no responde, el thumbnail muestra un placeholder y un mensaje de error.

**Flujo — Revocar API key:**
1. El usuario en `/dashboard/api-keys` hace clic en "Revocar" junto a una key.
2. El sistema muestra un diálogo de confirmación con el nombre de la key.
3. El usuario confirma; el sistema marca la key como revocada (soft delete).
4. Cualquier request posterior con esa key recibe `401 Unauthorized`.
- **Error:** si la key ya fue revocada previamente, el sistema lo indica sin error crítico.

---

## SECCIÓN 5 — Arquitectura

**Arquitectura propuesta:**

- **Frontend:** Next.js 16 App Router — ya definido en CLAUDE.md; SSR + route handlers en un solo repo.
- **Backend:** Next.js API Routes (`app/api/v1/images/`) — serverless, sin servidor adicional.
- **Base de datos:** Supabase (PostgreSQL) — ya configurado; RLS para aislamiento por usuario.
- **Autenticación:** Supabase Auth (email/password) para dashboard + API keys propias con hash SHA-256 para la REST API.
- **Hosting:** Vercel (frontend/API) + Supabase Cloud (DB + Storage) — stack de referencia para Next.js.
- **Render pipeline:** Satori (`@vercel/satori`) → `@resvg/resvg-js` → Supabase Storage bucket `bannerly-images`.
- **Integraciones:** Supabase Storage (imágenes), Supabase Auth (sesiones), Supabase DB (templates, generations, api_keys).

---

## SECCIÓN 6 — Requisitos no funcionales

**Requisitos:**

- **Rendimiento:** endpoint `/api/v1/images` debe responder en < 3 segundos para templates de hasta 1200×630px; dashboard carga inicial < 2s.
- **Seguridad:** API keys almacenadas solo como hash SHA-256 (nunca el valor plano); RLS de Supabase asegura que cada usuario solo accede a sus propios recursos; SUPABASE_SERVICE_ROLE_KEY nunca expuesta al cliente.
- **Escalabilidad:** diseñado para hasta 500 usuarios y 10.000 generaciones/mes en v1; función serverless escala automáticamente con Vercel.
- **Idioma:** interfaz en español para el webinar/demo; strings en inglés en el código (variables, funciones, APIs).
- **Accesibilidad:** formularios críticos (login, register) con labels semánticos y manejo de errores WCAG 2.1 AA básico.
- **Compliance / privacidad:** no se almacena PII más allá del email de Supabase Auth; imágenes generadas son públicas por diseño (bucket público).

---

## Open questions

- [x] ¿El editor de plantillas es un textarea con JSX crudo o un editor visual drag-and-drop? — **Resuelto: textarea con JSX crudo.**
- [x] ¿Se implementa quota/rate-limiting en v1 o se deja para v2? — **Resuelto: se implementa en v1** (100 req/hora por API key).
- [x] ¿Las plantillas de seed (ej. `tpl_og_basic`) se crean como fixtures en DB o como código hardcoded? — **Resuelto: fixtures en DB** (migration de seed).

---

*Cuando todas las secciones estén cerradas y los open questions resueltos, pasa a `plan.md`.*
