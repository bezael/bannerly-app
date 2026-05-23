# Tasks — Image Templates (TDD)

> Orden: Fase 0 → 1 → 2 → 3 → 4 → 5 → 6. No avanzar a la siguiente fase sin que todos los tests de la actual estén en verde.
> Cada tarea tiene: título · archivos que toca · criterio de aceptación.

---

## Fase 0 — Setup test runner (Vitest)

- [x] **Setup: instalar Vitest**
  - Archivos: `package.json`
  - Cmd: `pnpm add -D vitest @vitejs/plugin-react vite @testing-library/react @testing-library/jest-dom jsdom`
  - Criterio: `pnpm list vitest` muestra la versión instalada

- [x] **Setup: crear vitest.config.ts**
  - Archivos: `vitest.config.ts`
  - Criterio: archivo existe con `environment: 'node'`; setupFiles apunta a `vitest.setup.ts`

- [x] **Setup: agregar script de test en package.json**
  - Archivos: `package.json`
  - Criterio: `pnpm test` ejecuta Vitest y sale con código 0

- [x] 🔴 **Red: smoke test**
  - Archivos: `src/__tests__/smoke.test.ts`
  - Test: `expect(1 + 1).toBe(3)` — debe fallar
  - Criterio: `pnpm test` reporta 1 test fallido ✅

- [x] 🟢 **Green: arreglar smoke test**
  - Archivos: `src/__tests__/smoke.test.ts`
  - Test: `expect(1 + 1).toBe(2)`
  - Criterio: `pnpm test` reporta 1 test pasado → runner confirmado ✅

---

## Fase 1 — DB schema + tipos TypeScript

- [x] **Setup: crear tipos TypeScript**
  - Archivos: `lib/templates/types.ts`
  - Contenido: interfaces `Template`, `CreateTemplateInput`, `Modification` — adaptadas al schema real de Supabase (`template_uid`, `jsx_code`)
  - Criterio: tipos válidos sin errores TS ✅

- [x] **Setup: crear migration SQL**
  - Archivos: `supabase/migrations/001_create_templates.sql`
  - Nota: la tabla ya existía con schema diferente (`jsx_code`, `template_uid`). Archivo guardado como referencia.
  - Criterio: archivo SQL existe ✅

- [x] **Setup: aplicar migration en Supabase**
  - Cmd: aplicado via Supabase MCP
  - Nota: tabla pre-existente verificada con columnas reales: `template_uid`, `jsx_code`, `thumbnail_url`, `updated_at`
  - Criterio: tabla `templates` verificada en Supabase ✅

- [ ] **Setup: crear seed template**
  - Archivos: `supabase/migrations/002_seed_templates.sql`
  - Contenido: INSERT de `og-basic` como template semilla
  - Criterio: registro insertable sin violar RLS cuando se usa service-role

---

## Fase 2 — lib/templates (CRUD functions)

- [ ] 🔴 **Red: getTemplateByUid — retorna null si no existe**
  - Archivos: `lib/templates/get-template.test.ts`
  - Test: llamar `getTemplateByUid('uid-inexistente', 'user-fake-id')` → debe retornar `null`
  - Criterio: test falla porque la función no existe aún

- [ ] 🟢 **Green: implementar getTemplateByUid**
  - Archivos: `lib/templates/get-template.ts`
  - Criterio: test pasa; función usa cliente service-role para buscar por `template_uid` + `user_id`

- [ ] 🔴 **Red: listTemplates — retorna array vacío para usuario sin templates**
  - Archivos: `lib/templates/list-templates.test.ts`
  - Test: `listTemplates('user-sin-templates')` → debe retornar `[]`
  - Criterio: test falla porque la función no existe

- [ ] 🟢 **Green: implementar listTemplates**
  - Archivos: `lib/templates/list-templates.ts`
  - Criterio: test pasa; función retorna `Template[]` ordenados por `created_at desc`

- [ ] 🔴 **Red: createTemplate — error si template_uid duplicado para el mismo usuario**
  - Archivos: `lib/templates/create-template.test.ts`
  - Test: insertar dos templates con el mismo `template_uid` + `user_id` → segundo insert retorna `{ error: 'Template UID already exists' }`
  - Criterio: test falla porque la función no existe

- [ ] 🟢 **Green: implementar createTemplate**
  - Archivos: `lib/templates/create-template.ts`
  - Criterio: captura el error de constraint unique y retorna el error tipado

- [ ] 🔴 **Red: deleteTemplate — no afecta templates de otro usuario**
  - Archivos: `lib/templates/delete-template.test.ts`
  - Test: crear template con `user_id_A`, intentar `deleteTemplate(id, user_id_B)` → RLS bloquea, registro intacto
  - Criterio: test falla porque la función no existe

- [ ] 🟢 **Green: implementar deleteTemplate**
  - Archivos: `lib/templates/delete-template.ts`
  - Criterio: test pasa; RLS impide eliminar registros ajenos

- [ ] 🔵 **Refactor: extraer cliente Supabase service-role**
  - Archivos: `lib/templates/*.ts`
  - Criterio: todos importan el cliente desde `lib/supabase/service.ts`; tests en verde

---

## Fase 3 — lib/renderer (Satori + resvg pipeline)

- [x] **Setup: instalar dependencias de rendering**
  - Cmd: `pnpm add satori @resvg/resvg-js sucrase @fontsource/inter`
  - Nota: `sucrase` añadido para transpilación JSX en runtime; `@fontsource/inter` para fuente WOFF compatible con Satori
  - Criterio: dependencias instaladas ✅

- [x] **Setup: fuente Inter como asset**
  - Archivos: `lib/renderer/fonts.ts`
  - Nota: se usa `@fontsource/inter/files/inter-latin-400-normal.woff` desde node_modules (Satori soporta WOFF)
  - Criterio: `loadFont()` retorna `ArrayBuffer` válido ✅

- [x] 🔴 **Red: renderTemplate — retorna un Buffer PNG con tamaño > 0**
  - Archivos: `lib/renderer/render.test.ts`
  - Criterio: test falla con "renderTemplate is not a function" ✅

- [x] 🟢 **Green: implementar pipeline Satori → resvg**
  - Archivos: `lib/renderer/satori.ts`, `lib/renderer/resvg.ts`, `lib/renderer/render.ts`
  - `render.ts`: sustituye `{{placeholders}}`, transpila JSX con sucrase, llama satori → resvg
  - Criterio: test pasa; bytes `\x89PNG` verificados ✅

- [x] 🔵 **Refactor: extraer loadFont a función separada**
  - Archivos: `lib/renderer/fonts.ts`
  - Criterio: `render.ts` importa `loadFont` desde `fonts.ts`; test en verde ✅

- [ ] **Test de integración: render produce PNG válido con jsx_code real**
  - Archivos: `lib/renderer/render.integration.test.ts`
  - Test: render con jsx_code de og-basic y fields reales → buffer PNG con magic bytes válidos
  - Criterio: test pasa y PNG es visualmente correcto (verificación manual)

---

## Fase 4 — Layout og-basic (JSX seed)

- [ ] **Setup: crear jsx_code del template og-basic**
  - Archivos: `templates/seeds/og-basic.tsx` (referencia) + `supabase/migrations/002_seed_templates.sql`
  - Contenido: JSX 1200×630 con placeholders `{{title}}` y `{{avatar}}`; solo flexbox
  - Criterio: `pnpm build` sin errores de tipo

- [ ] 🔴 **Red: render og-basic con placeholders → PNG válido**
  - Archivos: `lib/renderer/render.integration.test.ts`
  - Test: `renderTemplate(ogBasicJsx, [{name:'title', text:'Hello'}], 1200, 630)` → PNG con magic bytes
  - Criterio: test falla si jsx_code está mal formado

- [ ] 🟢 **Green: jsx_code de og-basic pasa el test**
  - Criterio: test en verde; PNG generado visualmente correcto

---

## Fase 5 — API endpoint POST /api/v1/images

- [ ] 🔴 **Red: POST sin body retorna 400**
  - Archivos: `app/api/v1/images/route.test.ts`
  - Test: `POST /api/v1/images` con body vacío → `{ status: 400 }`
  - Criterio: test falla porque la route no existe

- [ ] 🔴 **Red: POST con template_id inexistente retorna 404**
  - Archivos: `app/api/v1/images/route.test.ts`
  - Test: POST con `{ template_id: 'uid-inexistente', modifications: [] }` → `{ status: 404 }`
  - Criterio: test falla

- [ ] 🟢 **Green: implementar route handler**
  - Archivos: `app/api/v1/images/route.ts`
  - Pasos: parsear body → getTemplateByUid → renderTemplate → uploadImage → responder 200
  - Criterio: los dos tests anteriores pasan

- [ ] **Setup: upload a Supabase Storage**
  - Archivos: `lib/storage/upload-image.ts`
  - Contenido: `uploadImage(buffer, path)` → URL pública del bucket `bannerly-images`
  - Criterio: función reutilizable, importada desde `route.ts`

- [ ] 🔴 **Red: POST con template válido retorna 200 + image_url**
  - Archivos: `app/api/v1/images/route.test.ts` (integración)
  - Test: POST con template real en DB → `{ id, template_id, image_url, created_at }`
  - Criterio: `image_url` apunta a PNG real en Supabase Storage

---

## Fase 6 — Dashboard UI

- [ ] **Setup: crear estructura de rutas del dashboard**
  - Archivos: `app/dashboard/templates/page.tsx`, `app/dashboard/templates/new/page.tsx`
  - Criterio: rutas accesibles sin errores

- [ ] 🔴 **Red: TemplateList muestra mensaje vacío si no hay templates**
  - Archivos: `components/templates/template-list.test.tsx`
  - Test: render `<TemplateList templates={[]} />` → contiene "No tienes templates"
  - Criterio: test falla porque el componente no existe

- [ ] 🟢 **Green: implementar TemplateList**
  - Archivos: `components/templates/template-list.tsx`

- [ ] 🔴 **Red: TemplateCard muestra el template_uid copiable**
  - Archivos: `components/templates/template-card.test.tsx`
  - Test: render `<TemplateCard template={mockTemplate} />` → contiene `template_uid` en el DOM

- [ ] 🟢 **Green: implementar TemplateCard**
  - Archivos: `components/templates/template-card.tsx`

- [ ] 🔴 **Red: TemplateForm no envía si nombre está vacío**
  - Archivos: `components/templates/template-form.test.tsx`

- [ ] 🟢 **Green: implementar TemplateForm**
  - Archivos: `components/templates/template-form.tsx`

- [ ] **Setup: conectar Server Actions al dashboard**
  - Archivos: `app/dashboard/templates/page.tsx`, `new/page.tsx`

- [ ] **Test de integración: flujo completo dashboard → API**
  - Manual / E2E: crear template → copiar template_uid → `POST /api/v1/images` → PNG válido

---

## Definición de "done" para este feature

- [x] Migration verificada en Supabase con RLS activo
- [ ] Seed template `og-basic` insertado en DB
- [ ] `pnpm test` pasa sin errores (todas las fases)
- [ ] `pnpm build` pasa sin errores de TypeScript ni ESLint
- [ ] Se puede crear un template desde el dashboard y renderizar una imagen vía API
- [ ] El PNG generado es visible en Supabase Storage
