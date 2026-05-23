# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
pnpm dev          # start dev server on port 3000
pnpm build        # production build
pnpm start        # serve production build
pnpm lint         # ESLint (flat config, Next.js + TypeScript rules)
```

No test runner is configured yet. Package manager is **pnpm**.

## Architecture

Bannerly is a Next.js full-stack SaaS for dynamic image generation via API — an open-source alternative to Bannerbear/Placid. Users design templates once, then call a REST API to render PNG variants at scale.

**Rendering pipeline (server-side):** `POST /api/v1/images` → validate API key → fetch template → Satori (React JSX → SVG) → @resvg/resvg-js (SVG → PNG) → upload to Supabase Storage → return `image_url`.

**Auth model:** Supabase Auth (email/password) for dashboard users; per-user API keys (prefix `bnly_`) for the REST API.

**Planned directory structure:**
```
app/
  (auth)/               # login, register (Supabase Auth)
  dashboard/            # protected UI — templates, generations, api-keys
  api/v1/images/        # public REST endpoint (API key auth)
components/
lib/
  supabase/             # three clients: browser, server (cookies), service-role
  renderer/             # Satori + resvg pipeline
  auth/                 # API key validation middleware
supabase/migrations/    # SQL schemas
templates/              # seed template data
specs/                  # SDD specs — read these before implementing a feature
```

## Key technical details

- **Tailwind CSS v4** — configured via `@import "tailwindcss"` in `globals.css` and the `@tailwindcss/postcss` PostCSS plugin. There is no `tailwind.config.js`; theme customization uses `@theme inline` blocks in CSS.
- **Path alias** — `@/*` resolves to the project root (e.g. `import { x } from "@/lib/renderer"`).
- **ESLint** — flat config (`eslint.config.mjs`), ESLint 9. Run `pnpm lint` before committing.
- **Supabase Storage** — bucket `bannerly-images` (public). Generated PNGs are stored there and the public URL is returned in API responses.

## Environment variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=      # server-only, never expose to client
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## SDD methodology

Every feature starts with a spec in `/specs/` before any code is written. If you're asked to implement a feature, check `/specs/` first. If no spec exists, create one before implementing. Specs define what a feature does, what it doesn't do, API contracts, and acceptance criteria.

## API contract (v1)

```
POST /api/v1/images
Authorization: Bearer bnly_<key>
Content-Type: application/json

{
  "template_id": "tpl_og_basic",
  "modifications": [
    { "name": "title",     "text": "..." },
    { "name": "avatar",    "image_url": "https://..." }
  ]
}

→ { "id": "gen_01HXYZ", "template_id": "...", "image_url": "https://...", "created_at": "..." }
```
