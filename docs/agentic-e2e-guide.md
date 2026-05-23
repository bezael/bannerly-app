# Guía: Sistema agéntico end-to-end con Claude + GitHub Actions

> Cómo montar, desde cero y en cualquier repo, un flujo donde **un issue con una etiqueta
> dispara a Claude** para que implemente un feature, lo pruebe en un navegador real grabando
> vídeo, abra el PR y publique un reporte con el resultado verificable.

El disparo es **human-in-the-loop**: abres el issue y no pasa nada; cuando le pones la etiqueta
`e2e`, el agente arranca solo.

---

## Cómo funciona (mapa mental)

```
Issue + label "e2e"
        │
        ▼
┌─────────────────────────── GitHub Actions ───────────────────────────┐
│  1. Setup (pnpm, Node, deps, Playwright)                              │
│  2. Claude Code  → implementa feature + escribe spec e2e + abre PR    │  ← el AGENTE
│  3. Checkout de la rama del PR                                        │
│  4. pnpm test:e2e  → graba .webm (Playwright)                         │  ← DETERMINÍSTICO
│  5. Sube el vídeo como artifact                                      │     (el workflow,
│  6. Comenta en el PR: resultado real + link de descarga del vídeo    │      no el agente)
└───────────────────────────────────────────────────────────────────────┘
```

**La idea clave que hace esto confiable:** el agente **solo implementa y deja los tests en
verde**. Quien ejecuta los tests "de verdad", graba el vídeo y reporta el resultado es el
**workflow**, en steps determinísticos. Así el reporte nunca depende de lo que el agente
"diga que hizo" — si el agente alucina "4/4 tests pasados", el step de Playwright lo desmiente.

---

## Requisitos previos

- Un repo en GitHub (puede ser un fork).
- Proyecto Next.js con `pnpm`. (Adaptable a otros stacks; ajusta los comandos.)
- Cuenta de Claude Code.
- `gh` CLI autenticado (`gh auth login`).

---

## Paso 1 — Instalar la GitHub App de Claude en el repo

Sin esto, el workflow obtiene el token de Claude pero **falla con `401 Bad credentials`** al
operar sobre GitHub (verificar permisos, comentar, abrir PR).

Desde la terminal:

```bash
claude
# dentro de Claude Code:
/install-github-app
```

O en el navegador: **https://github.com/apps/claude → Configure →** selecciona tu repo
(o "All repositories"). Concede los permisos que pide (contents, issues, pull requests, workflows).

> **Forks:** los forks NO heredan secrets ni instalaciones del upstream. Instala la app y
> configura los secrets **en el fork**.

Verifica que quedó instalada (debe devolver el nombre de la app, no 404/401):

```bash
gh api /repos/<owner>/<repo>/installation --jq '.app_slug'
```

---

## Paso 2 — Habilitar issues (solo si es un fork)

Los forks suelen tener los issues deshabilitados. Si `gh issue create` cae al upstream o falla:

```bash
gh api -X PATCH repos/<owner>/<repo> -f has_issues=true --jq '.has_issues'
```

---

## Paso 3 — Configurar los secrets del repo

En **Settings → Secrets and variables → Actions** del repo:

| Secret | Uso |
|--------|-----|
| `CLAUDE_CODE_OAUTH_TOKEN` | Token de Claude Code. Lo genera `/install-github-app` o `claude setup-token`. |
| `NEXT_PUBLIC_SUPABASE_URL` | Para que `pnpm dev` levante en CI. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | idem |
| `SUPABASE_SERVICE_ROLE_KEY` | idem (server-only) |

```bash
gh secret set CLAUDE_CODE_OAUTH_TOKEN  --repo <owner>/<repo>
gh secret set NEXT_PUBLIC_SUPABASE_URL --repo <owner>/<repo>
gh secret set NEXT_PUBLIC_SUPABASE_ANON_KEY --repo <owner>/<repo>
gh secret set SUPABASE_SERVICE_ROLE_KEY --repo <owner>/<repo>
```

> Si tu app no usa Supabase, omite esos tres y borra las `env:` correspondientes del workflow.
> Sin las keys el demo igual graba vídeo (la app cae a su estado de error), pero no usa datos reales.

---

## Paso 4 — Preparar el proyecto (3 puntos que rompen si faltan)

Estos tres detalles son los que más comúnmente hacen fallar el flujo. Déjalos resueltos de entrada.

### 4.1 — Fijar la versión de pnpm

`pnpm/action-setup@v4` falla con *"No pnpm version is specified"* si no hay versión declarada.
Añade el campo `packageManager` en `package.json` con tu versión local (`pnpm --version`):

```json
{
  "name": "tu-app",
  "packageManager": "pnpm@10.33.0"
}
```

### 4.2 — Playwright configurado para grabar vídeo

`playwright.config.ts` debe grabar vídeo y escribir a una ruta conocida:

```ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  outputDir: "./e2e/.results",          // aquí caen los .webm
  reporter: [["list"], ["html", { outputFolder: "e2e/.report", open: "never" }]],
  use: {
    baseURL: process.env.BASE_URL ?? "http://localhost:3000",
    trace: "on",
    screenshot: "on",
    video: "on",                         // ← graba .webm de cada test
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "pnpm dev",                 // Playwright levanta la app sola
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
```

Y los scripts en `package.json`:

```json
"scripts": {
  "test:e2e": "playwright test",
  "lint": "eslint",
  "test": "vitest run"
}
```

Añade `e2e/.results` y `e2e/.report` al `.gitignore` (son artefactos, no se commitean).

### 4.3 — Recordar: los artifacts viven en directorios ocultos

`e2e/.results` y `e2e/.report` **empiezan con punto**. `actions/upload-artifact@v4` los trata
como ocultos y los ignora salvo que pongas `include-hidden-files: true` (ya incluido en el
workflow del Paso 5). Si lo olvidas, el artifact sale vacío aunque los `.webm` existan.

---

## Paso 5 — El workflow

Crea `.github/workflows/claude-e2e-feature.yml` con esto. **Ya incorpora las tres lecciones
del Paso 4** y separa responsabilidades agente / workflow.

```yaml
name: Claude E2E Feature

# Human-in-the-loop: abres el issue y no pasa nada. Al añadir la etiqueta "e2e",
# arranca: implementa -> prueba con Playwright (graba video) -> abre PR -> reporta.
on:
  issues:
    types: [labeled]

jobs:
  e2e-feature:
    if: github.event.label.name == 'e2e'
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write
      issues: write
      id-token: write
      actions: read

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup pnpm
        uses: pnpm/action-setup@v4        # toma la versión de packageManager (Paso 4.1)

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Install Playwright browsers
        run: pnpm exec playwright install --with-deps chromium

      # ───────── EL AGENTE: solo implementa y deja los tests en verde ─────────
      - name: Run Claude Code (implement + test + open PR)
        id: claude
        uses: anthropics/claude-code-action@v1
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
          NEXT_PUBLIC_APP_URL: http://localhost:3000
        with:
          claude_code_oauth_token: ${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}
          additional_permissions: |
            actions: read
          claude_args: '--allowed-tools "Bash,Read,Write,Edit,Glob,Grep"'
          prompt: |
            Un humano te asignó este trabajo poniéndole la etiqueta "e2e" al issue
            #${{ github.event.issue.number }} ("${{ github.event.issue.title }}").

            El cuerpo del issue describe un feature a implementar. Ejecuta TODO este ciclo
            sin pedir confirmación, ya que corres en CI sin un humano disponible:

            1. IMPLEMENTAR
               - Lee /specs/ primero (metodología SDD). Si no hay spec para este feature,
                 crea uno breve en /specs/ antes de codear.
               - Crea una rama nueva: feat/issue-${{ github.event.issue.number }}.
               - Implementa el feature descrito en el issue.

            2. PROBAR (E2E) — DEJAR EN VERDE
               - Añade un spec en e2e/ que ejercite el GOLDEN PATH del feature
                 (navega, INTERACTÚA, y haz asserts visibles).
               - Corre `pnpm test:e2e`. Si falla, ARREGLA hasta que pase.
               - Corre `pnpm lint` y `pnpm test` (unit) y deja todo en verde.
               - NO grabes ni subas el video: un step posterior del workflow lo hace.
                 Tu única responsabilidad aquí es que los specs estén en VERDE.

            3. ABRIR PR
               - Commitea y abre un PR contra main con `gh pr create`.
               - El cuerpo del PR debe cerrar el issue con "Closes #${{ github.event.issue.number }}".

            4. REPORTAR en el PR (con `gh pr comment`)
               Reporta SOLO lo que hiciste, sin inventar resultados de tests:
                 - Qué feature implementaste y qué archivos cambiaron.
                 - Qué specs e2e añadiste y qué golden path ejercitan.
               NO afirmes cuántos tests pasaron ni menciones el video: un step
               posterior publica el resultado real y el link al video.

            Reglas: no hagas force-push, no borres ramas ajenas, no toques otros workflows.

      # ───────── DETERMINÍSTICO: el workflow corre los tests y graba el video ─────────
      - name: Checkout PR branch
        run: |
          BRANCH="feat/issue-${{ github.event.issue.number }}"
          git fetch origin "$BRANCH"
          git checkout "$BRANCH"

      - name: Reinstall deps for PR branch
        run: pnpm install --frozen-lockfile

      - name: Run E2E and record video
        id: e2e
        env:
          CI: "true"
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
          NEXT_PUBLIC_APP_URL: http://localhost:3000
        run: |
          set -o pipefail
          pnpm test:e2e 2>&1 | tee e2e-output.txt
        # Si los tests fallan, el job falla (rojo). Los steps de abajo igual corren (if: always()).

      - name: List recorded artifacts (debug)
        if: always()
        run: |
          echo "=== e2e/.results ==="
          ls -laR e2e/.results 2>/dev/null || echo "(vacío)"
          find e2e/.results -name '*.webm' 2>/dev/null || echo "(ningún .webm)"

      - name: Upload E2E video & report
        id: upload
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: e2e-video
          path: |
            e2e/.results/**
            e2e/.report/**
          include-hidden-files: true       # .results/.report empiezan con punto (Paso 4.3)
          if-no-files-found: warn
          retention-days: 14

      - name: Comment test result + video link on PR
        if: always()
        env:
          GH_TOKEN: ${{ github.token }}
        run: |
          PR=$(gh pr list --head "feat/issue-${{ github.event.issue.number }}" --json number --jq '.[0].number')
          if [ -z "$PR" ]; then echo "No PR found, skipping comment"; exit 0; fi

          RUN_URL="${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}"
          if [ "${{ steps.e2e.outcome }}" = "success" ]; then
            STATUS="✅ **E2E en verde**"
          else
            STATUS="❌ **E2E en rojo** — revisa el log de la corrida"
          fi
          VIDEOS=$(find e2e/.results -name '*.webm' 2>/dev/null | wc -l | tr -d ' ')

          # Link de descarga DIRECTA del artifact (un clic baja el zip).
          ARTIFACT_ID="${{ steps.upload.outputs.artifact-id }}"
          if [ -n "$ARTIFACT_ID" ]; then
            VIDEO_LINK="[⬇️ Descargar video (e2e-video.zip)]($RUN_URL/artifacts/$ARTIFACT_ID)"
          else
            VIDEO_LINK="Artifact **e2e-video** en [esta corrida]($RUN_URL) (no se subió video)"
          fi

          {
            echo "## Reporte de tests (generado por el workflow)"
            echo ""
            echo "$STATUS"
            echo ""
            echo "- Videos \`.webm\` grabados: **$VIDEOS**"
            echo "- $VIDEO_LINK"
            echo ""
            echo "_Resultado producido por un step determinístico del workflow corriendo \`pnpm test:e2e\` — no por el agente._"
          } > pr-comment.md

          gh pr comment "$PR" --body-file pr-comment.md
```

---

## Paso 6 — Crear la etiqueta `e2e`

Una sola vez por repo:

```bash
gh label create e2e --repo <owner>/<repo> \
  --description "Dispara el flujo agéntico e2e de Claude" --color 5319e7
```

---

## Paso 7 — Escribir un buen issue

El cuerpo del issue **es el spec** que recibe el agente. Para un demo lucido:

- **Que sea visual e interactivo.** El vídeo se ve mejor con movimiento. Pide explícitamente
  una interacción (ej. "al hacer click en una card se abre un modal con el detalle") y exige
  que el spec e2e ejercite ese click con esperas explícitas (`toBeVisible()` / `toBeHidden()`).
  Un test que solo carga una página da un `.webm` estático de ~1s; uno con click→modal→cierre
  da un vídeo con movimiento real.
- **Autocontenido y acotado.** Un solo archivo o componente, sin tocar pipelines críticos.
- **Que no exista todavía**, para que el agente lo construya de verdad.

Ejemplo de issue (resumido):

```
Título: Reemplazar home por landing con galería de plantillas

Reemplaza app/page.tsx por una landing con hero + grilla de cards.
Al hacer CLICK en una card, abre un modal con toda la info del template.

Spec E2E (golden path CON interacción):
1. Navega a / y verifica el hero.
2. Click en la primera card.
3. Verifica que el modal aparece (assert sobre el contenido).
4. Cierra el modal (botón X o Escape) y verifica que desaparece.
Usa esperas explícitas en cada transición para que el video grabe el movimiento.
```

---

## Paso 8 — Disparar el flujo

```bash
# 1. Crear el issue (queda a la espera, NO pasa nada)
gh issue create --repo <owner>/<repo> --title "..." --body "..."

# 2. Cuando quieras que Claude trabaje, añade la etiqueta:
gh issue edit <N> --repo <owner>/<repo> --add-label e2e
```

Para **re-disparar** el mismo issue, hay que quitar y volver a poner la etiqueta (el workflow
escucha el evento `labeled`, no la presencia de la etiqueta):

```bash
gh issue edit <N> --repo <owner>/<repo> --remove-label e2e
gh issue edit <N> --repo <owner>/<repo> --add-label e2e
```

---

## Paso 9 — Verificar el resultado

```bash
# Ver la última corrida
gh run list --repo <owner>/<repo> --workflow=claude-e2e-feature.yml --limit 1

# El PR que abrió el agente
gh pr list --repo <owner>/<repo> --state open

# El comentario determinístico (resultado real + link de descarga del video)
gh pr view <PR> --repo <owner>/<repo> --json comments --jq '.comments[].body'
```

En el comentario del workflow verás `✅ E2E en verde`, cuántos `.webm` se grabaron, y un
enlace **⬇️ Descargar video** que baja el zip directo.

---

## Paso 10 — Dejar limpio para repetir el demo

Tras una corrida, cierra el PR, borra la rama y quita la etiqueta para volver al estado inicial:

```bash
gh pr close <PR> --repo <owner>/<repo> --comment "Reset para el demo"
git push origin --delete feat/issue-<N>
gh issue edit <N> --repo <owner>/<repo> --remove-label e2e
```

> Importante: **borra siempre la rama `feat/issue-N`** antes de re-disparar. Si la rama ya
> existe, el agente choca al intentar crearla.
>
> Verifica que se borró con la API (es la fuente de verdad; `git ls-remote` puede mostrar refs
> en caché):
> ```bash
> gh api /repos/<owner>/<repo>/branches/feat/issue-<N> --jq '.name'   # debe dar 404
> ```

---

## Apéndice — Errores comunes y su causa

| Síntoma en el log | Causa | Solución |
|---|---|---|
| `No pnpm version is specified` | `pnpm/action-setup` sin versión | `packageManager` en `package.json` (4.1) |
| `401 Bad credentials` al checar permisos | App de Claude no instalada en el repo | `/install-github-app` (Paso 1) |
| `the '<repo>' repository has disabled issues` | Fork con issues off | `gh api -X PATCH ... has_issues=true` (Paso 2) |
| Reporte dice "4/4 tests pasados" pero no hay rastro | El agente narra sin ejecutar | Tests en step determinístico, no en el prompt (Paso 5) |
| Artifact `e2e-video` vacío pese a haber `.webm` | `upload-artifact` ignora rutas ocultas | `include-hidden-files: true` (4.3) |
| Vídeo de ~1s sin movimiento | El golden path no interactúa | Issue pide interacción + spec con esperas explícitas (Paso 7) |

---

## Por qué este diseño

- **El agente no se "autoevalúa".** Separar "implementar" (agente) de "verificar + reportar"
  (workflow determinístico) elimina el riesgo de reportes alucinados. El vídeo y el "verde/rojo"
  son hechos producidos por el runner, no afirmaciones del modelo.
- **`if: always()` en los steps de cierre** garantiza que, aun con tests en rojo, se suba lo que
  se grabó y se comente el resultado honesto en el PR.
- **Human-in-the-loop por etiqueta**: abrir el issue no gasta nada; tú decides cuándo arranca.
```