# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Genefy v2 — a dairy cattle genetic mating/breeding SaaS for Holstein herds (CDCB genomic data). React 19 + TypeScript + Next.js 16 (App Router) + Tailwind, backed by Supabase (Postgres + Auth + RLS). UI text, comments, and domain vocabulary are in Brazilian Portuguese (touros = bulls, fêmeas = females, tanque = semen tank, acasalamento = mating, rebanho = herd).

## Commands

```bash
npm run dev        # Next dev server at http://localhost:3000
npm run build      # tsc --noEmit && next build — tsc is the only check; there is no lint or test setup
npm run start      # serve the production build
npm run seed       # tsx scripts/seed.ts — seeds Supabase from BASE_BULLS/BASE_FEMALES (needs SUPABASE_SERVICE_ROLE_KEY in .env)
```

Env vars (see `.env.example`): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (inlined into the client bundle at **build time**), plus `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` for the seed script only. Deployed on Vercel.

## Architecture

### Routing: Next App Router — CSR pages + internal API

`src/app/` holds the pages (`/`, `/login`, `/solicitar`, `/app`, plus a `[...rest]` catch-all that redirects to `/`) and the **internal API** (`src/app/api/`). Every `page.tsx` is a `'use client'` wrapper that loads the real screen from `src/views/` via `next/dynamic` with `ssr: false` — page rendering is deliberately 100% CSR (several components read `localStorage` in `useState` initializers, so do NOT remove `ssr: false` or convert screens to Server Components without handling that). Providers (AuthContext) are mounted in `src/app/providers.tsx`.

### Data access: internal API + RLS (Phase 2 architecture)

The client NEVER queries Supabase tables directly. All data flows through Route Handlers under `src/app/api/` (`farm`, `bulls` (+`/import`), `females`, `tank`, `weights`, `herd-strategy`, `matings` (+`/failed-counts`), `calc/*`), which use `src/lib/supabase-server.ts` (`@supabase/ssr` `createServerClient` + `requireUser()` → 401 without session). **Authorization is RLS only** — handlers run the same queries the old hooks ran, scoped by the user's JWT; never hand-roll farm checks and never use the service-role key for user data (it is reserved for `scripts/seed.ts`). The session lives in **cookies** (`src/lib/supabase.ts` uses `createBrowserClient`) so it reaches the server; `src/proxy.ts` (Next 16's middleware) refreshes expired tokens. The browser Supabase client is used ONLY for auth (`signInWithPassword`, `signOut`, `updateUser`).

Calculations: the decision-making math runs SERVER-SIDE via `POST /api/calc/{top3,mating-plan,meta-search,progeny}` — these import genetics.ts directly and rebuild inputs server-side (`getCalcContext` in `src/lib/calc-data-server.ts`); the client sends ids/codes + params through the `src/lib/calc-client.ts` façade (which has NO runtime import of genetics — the decision algorithms are not in the client bundle). Render-level transforms (progeny chips inside cards/history, herd-merit memo in `useHerdStrategy`, `estimateCowPtas` in HerdTab, `norm`/ICFG) intentionally stay client-side.

**Bundle hygiene (Phase 3 invariant):** `data.ts` (real Granja Cavalli herd), `catalog-bulls.ts` and `demo-females.ts` are SERVER-ONLY imports (route handlers / seed). Never import them from components/hooks/views — the catalog reaches the client via `GET /api/catalog` (cacheable) and herd data via `/api/females`. `getTop3Options`/`runMatingPlan`/`searchByGoal` must not be imported by client modules either.

### The app shell + the demo account (two data paths)

`src/views/App.tsx` exports `AppShell` = `AuthGuard > SupabaseApp` (the old build-time `DemoApp`/`NEXT_PUBLIC_DEMO_MODE` mode was removed in Phase 3). `SupabaseApp` uses the API-backed hooks (`useFarm`, `useBulls`, `useFemales`, `useTank`, `useWeights`).

There is a **demo account**: logging in as `demo@gmail.com` short-circuits auth in `src/contexts/AuthContext.tsx` (mock session + a server-readable `genefy_demo_session` cookie). Since Phase 3 the demo READS come from the API: handlers check `isDemoRequest()` (`src/lib/demo-server.ts`) BEFORE `requireUser()` and serve fictional data (fixed "Fazenda Teste", `DEMO_FEMALES` from `src/lib/demo-females.ts`, the static catalog) without ever touching Supabase; `/api/calc/*` compute over the fictional data. Demo WRITES stay per-browser (in-memory edits + localStorage `genefy_demo_account_*` keys; matings via `src/lib/demo-matings.ts`) — the server never persists anything for demo. Real herd data is unreachable for demo by construction (no Supabase cookies → RLS-scoped handlers 401).

**Consequence:** any new data feature must be implemented in the fetch path of the hook AND in the `isDemoUser` write-branch inside the same hook; new GET handlers that serve farm data need an `isDemoRequest()` branch.

### Domain math: `src/lib/genetics.ts`

All genetic/scoring math lives here (~900 lines), extracted from a validated legacy HTML app. The file header says **do not change the logic without validating against the original** — treat formulas (e.g. `scoreBull` weighted 0–100 normalization via `ICFG`, `inb` = bull GFI/2 + cow gINB/4, `calcPppv`, `runMatingPlan`, `getTop3Options`, `estimateCowPtas`) as fixed business rules. `src/lib/matching.ts` is only a re-export barrel of genetics.ts; components import from `matching`, not `genetics` directly.

### Two type representations everywhere

- **Domain types** `Bull`/`Female` (camelCase-ish, index-signature, defined in genetics.ts) — used by all math and most components.
- **DB row types** `BullRow`/`FemaleRow` etc. (snake_case, defined in `src/lib/supabase.ts`) — mirror the Postgres schema.

Hooks load rows from the API and convert (`rowToFemale`/`rowToBull` in `src/lib/row-mappers.ts` — framework-agnostic because the `/api/calc/*` handlers use them too); both forms (`bulls`+`bullRows`, `females`+`femaleRows`) are threaded through props side by side. When adding a column you typically touch: SQL migration, the Row interface, the domain interface, the row→domain mapper (and `femalesToRows` if the demo data should carry it), and the Route Handler (if whitelisted, e.g. the `PATCHABLE` list in `/api/females/[id]`).

### UI structure

No global state library — inside `/app`, a single `activeTab` string in `src/views/App.tsx` switches tab components under `src/components/<feature>/` (tabs are NOT routes), with all data passed down as props from the app shell. `Sidebar` holds the matching filters (weights/presets, max inbreeding, A2A2-only, tank-only, bull type, female categories) whose state also lives in the shell.

(The former "Análise Completa" females × bulls matrix tab and its Web Worker were removed by product decision in Phase 2.)

### Database

Schema in `supabase/schema.sql`, incremental changes in `supabase/migrations/` (plain SQL, run via Supabase SQL Editor — no CLI migration tooling). Tables: `farms`, `bulls` (`farm_id IS NULL` = shared system catalog), `females`, `tank_bulls`, `matings`, `weight_presets`, `herd_strategy`, `female_semen_assignments`. RLS scopes everything by farm ownership (`farms.user_id` → `auth.uid()`); see `AUTH_SETUP.md` for the auth/RLS setup steps.

### Generated data files — do not hand-edit

- `src/lib/data.ts` (~670 KB): `BASE_BULLS` (376 CDCB bulls) + `BASE_FEMALES` (469 Granja Cavalli females). Regenerated by `scripts/import-females-xlsx.js` from the CDCB Excel file at repo root.
- `src/lib/catalog-bulls.ts` (~19k lines): `CATALOG_BULLS` from AI-company catalogs (Semex, ABS, Genex, Select Sires, STgenetics, Alta…). `src/lib/naab-brands.ts` maps NAAB code prefixes to company names.
- Root-level `build-*.js` / `rebuild-*.js` / `fix-*.js` / `splice-semex.js` are one-off catalog-munging scripts with hardcoded paths from an older machine (`C:/granja-novo-genefy/...`) — historical artifacts, not part of any workflow; don't run them as-is.
