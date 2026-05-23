# Spec — Home Landing con Galería de Plantillas

## Visión

Reemplazar la home placeholder (`app/page.tsx`) por una landing pública real que muestre las
plantillas disponibles en una grilla de cards, con un hero y un modal de detalle interactivo.

## Funcionalidades

### Hero
- Título "Bannerly"
- Tagline: "Generación de imágenes dinámicas vía API. Diseña una plantilla una vez, renderiza
  miles de variantes a escala."
- CTA hacia `/dashboard/templates`

### Galería de plantillas
- Server Component que lee todas las plantillas desde Supabase (service-role, sin auth requerida)
- Grilla responsive de cards con: `name`, `slug` (en mono), `width × height`
- Click en una card abre un modal de detalle

### Modal de detalle
- Client Component (estado local con overlay)
- Muestra: `name`, `slug`, `layout_id`, `width × height`, lista de `layers` (name + type)
- Se cierra con: botón X, click en backdrop, tecla Escape
- No requiere librerías externas; puede usar `<dialog>` nativo o estado + overlay

### Estado vacío
- Si no hay plantillas, mensaje amable ("Aún no hay plantillas disponibles")
- No muestra JSON ni error

### Estado de error
- Si Supabase falla, muestra mensaje de error descriptivo
- La página no crashea

## Qué NO se implementa
- Autenticación en la landing (es pública)
- Modificación del pipeline renderer o endpoint `/api/v1/images`
- Dependencias nuevas

## Criterios de aceptación
- La home renderiza la grilla sin JSON crudo
- Click en card abre modal con toda la info; modal se cierra correctamente
- Estado vacío visible si no hay plantillas
- Estado de error visible si Supabase falla

## Golden path E2E
1. Navegar a `/`
2. Verificar hero y galería visibles
3. Click en primera card
4. Verificar modal aparece con name/slug del template
5. Cerrar modal (botón X o Escape)
6. Verificar modal desaparece
