# Migração Genefy v2: Vite → Next.js 16 (App Router) + Backend

> Documentação da migração executada em **05/06/2026**, em três fases planejadas e
> aprovadas separadamente (Fases 1 e 2: `eba46aa..6e50073`; Fase 3: ver seção).
> Este documento descreve **o que mudou, por quê, e o que ficou pendente**.

---

## Visão geral

| | Antes | Depois |
|---|---|---|
| Build/chassi | Vite 5 + react-router-dom 6 | **Next.js 16.2.7 (App Router, Turbopack)** |
| React | 18.2 | **19.2.7** |
| Acesso a dados | supabase-js direto no browser (anon key + RLS) | **API interna** (`src/app/api/*`) com `@supabase/ssr`; client nunca consulta tabelas |
| Sessão | localStorage (padrão supabase-js) | **Cookies** (chegam ao servidor; RLS escopa por usuário no server) |
| Cálculos genéticos | 100% no client | **Decisórios no servidor** (`/api/calc/*`); render-level e demo no client |
| Matriz fêmeas × touros ("Análise Completa") | Web Worker no client | **REMOVIDA do sistema** (decisão de produto) |
| Conta demo (`demo@gmail.com`) | Gravava em farm real compartilhada no banco | **100% client-side** (localStorage por browser; banco inalcançável) |

**Invariantes preservados** (verificado por `git diff` contra o commit pré-migração `0d819ea`):
`src/lib/genetics.ts`, `src/lib/matching.ts`, `src/lib/data.ts`, `src/lib/catalog-bulls.ts`,
`src/lib/naab-brands.ts`, `scripts/seed.ts` e o schema/migrations do Supabase — **0 bytes alterados**.
Nenhuma fórmula mudou. As assinaturas de retorno dos hooks são idênticas.

---

## FASE 1 — Migração estrutural (Vite → Next, sem mudar lógica)

Commits `eba46aa..f5b444d`. Objetivo: trocar o chassi com comportamento **idêntico**.

### O que mudou

1. **Dependências** (`eba46aa`)
   - `next@16.2.7`, `react@19.2.7`, `react-dom@19.2.7` (App Router exige React 19 — inevitável)
   - `lucide-react` 0.344 → 0.577 (última 0.x com peer React 19; mantém aliases de ícones)
   - Removidos: `vite`, `@vitejs/plugin-react`, `react-router-dom`
   - Instalação fecha **sem `--legacy-peer-deps`**; checklist React 19 limpo
     (zero `defaultProps`/`propTypes`/`useRef()` sem argumento no projeto)

2. **`src/pages/` → `src/views/`** (`2b98670`)
   - Obrigatório: com diretório `src/`, o Next interpretaria `src/pages/` como Pages Router
   - `App.tsx` perdeu `<Routes>` e virou `AppShell` (branch `IS_DEMO → DemoApp | AuthGuard>SupabaseApp`);
     o conteúdo de `DemoApp`/`SupabaseApp` não mudou

3. **react-router → next/link + next/navigation** (`f079db0`)
   - `<Link to=>` → `<Link href=>` (LandingPage, LoginPage, SolicitarAcessoPage)
   - `<Navigate>` → `useRouter().replace()` em efeito (AuthGuard, LoginPage)
   - Efeito colateral positivo: corrigiu violação de rules-of-hooks no LoginPage
     (early-return antes dos `useState`, mascarada pelo react-router)

4. **Estrutura `src/app/`** (`7c7780a`)
   - `layout.tsx`: Metadata API (título, favicon), `lang="pt-BR"`, fonts Inter +
     Material Symbols via `<link>` (idêntico ao `index.html` antigo)
   - `providers.tsx` (`'use client'`): monta o `AuthProvider`
   - Rotas `/`, `/login`, `/solicitar`, `/app`: cada `page.tsx` é **`'use client'`**
     com `next/dynamic` + **`ssr: false`** → CSR puro, igual ao Vite.
     ⚠️ NÃO remover o `ssr:false` nem converter telas em Server Components:
     vários componentes leem `localStorage` em inicializadores de `useState`
     (ex.: `useHerdStrategy`) e quebrariam no prerender.
     ⚠️ `ssr:false` só é legal dentro de Client Component — manter o `'use client'` nas pages.
   - `[...rest]/page.tsx`: `redirect('/')` replica o `<Route path="*">` antigo

5. **Env vars** (`1504580`) — `VITE_*` → `NEXT_PUBLIC_*`
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_DEMO_MODE`
   - São **inlined no bundle em build time** (trocar o valor exige rebuild)
   - Vars do seed (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`) seguem sem prefixo

6. **Configs e limpeza** (`3984151`, `fb2f326`, `f5b444d`)
   - Removidos: `vite.config.ts`, `index.html`, `src/main.tsx`, `src/vite-env.d.ts`, `tsconfig.node.json`
   - `postcss.config.js` → `.mjs`; tailwind `content` sem `index.html`
   - Scripts: `dev` = `next dev` (porta **3000**, antes 5173), `build` = `tsc --noEmit && next build`
     (tsc continua sendo o único check do projeto), `start` = `next start`
   - tsconfig ajustado pelo próprio Next (`jsx: react-jsx`, types do `.next`)

### Validação da Fase 1 (browser real, build de produção)

- 4 rotas em HTTP 200; rota inexistente → 307 → `/`
- DemoApp: worker da matriz rodou sob Turbopack — 469×2.720 = 1.275.680 combinações,
  1.143 pares (mesmo código, mesmo resultado) — *aba removida depois, na Fase 2*
- `react-to-print` sob React 19 disparou impressão (iframe `printWindow` interceptado)
- Popup de impressão do plano com conteúdo + `window.print()` no onload
- Conta demo logou e carregou a Fazenda Teste; AuthGuard redirecionou sem sessão

---

## FASE 2 — Supabase e cálculos no backend

Commits `48084ab..6e50073`. Objetivo: client deixa de falar com o Supabase;
API interna do Next com **RLS como única autorização**; cálculos decisórios no servidor.

### Sessão e segurança

```
Browser ──cookies de auth──▶ src/proxy.ts (refresh) ──▶ Route Handler
                                                          └─ requireUser() ─▶ 401 sem sessão
                                                          └─ createServerClient (JWT do usuário)
                                                              └─ Supabase com RLS escopando por farm
```

- `src/lib/supabase.ts`: `createBrowserClient` (@supabase/ssr) — sessão em **cookies**.
  O client Supabase do browser é usado **apenas para auth** (`signInWithPassword`,
  `signOut`, `updateUser`); zero `supabase.from()` fora de `src/app/api/` (verificado por grep).
- `src/lib/supabase-server.ts`: `createServerClient` via `next/headers` + helper `requireUser()`.
- `src/proxy.ts`: refresh de token expirado (padrão @supabase/ssr; no Next 16 o
  middleware chama-se *proxy*). Matcher: `/api/:path*` e `/app`.
- **Proibido**: service role para dados de usuário (reservada ao `scripts/seed.ts`)
  e autorização manual nos handlers — o escopo é 100% RLS (policies em
  `supabase/migrations/20260526000000_enable_rls_all_tables.sql`).
- `supabase-js` 2.39 → **2.107** (exigência do @supabase/ssr 0.10.3).

### Rotas da API interna (`src/app/api/`)

| Rota | Métodos | Substituiu |
|---|---|---|
| `/api/farm` | GET (`?id` opcional, fallback primeira farm visível) | `useFarm` |
| `/api/bulls` | GET (custom da farm, paginado) · POST · PUT (upsert) · PATCH (preço) | `useBulls` |
| `/api/bulls/import` | POST (lote, fallback individual) | `SelectSiresImportModal` |
| `/api/females` | GET · PUT (upsert `farm_id,animal_id`) | `useFemales` |
| `/api/females/[id]` | PATCH (whitelist: `is_primiparous`, `categories`, `notes`) · DELETE | `useFemales`, `PrimiparousTab` |
| `/api/tank` | GET (join bulls) · POST (aceita uuid **ou** code) | `useTank` |
| `/api/tank/[id]` | PATCH (doses/preço) · DELETE | `useTank` |
| `/api/weights` | GET · PUT (upsert `farm_id,name`) | `useWeights` |
| `/api/herd-strategy` | GET (get-or-create default) · PUT | `useHerdStrategy` |
| `/api/matings` | GET (joins, limit 200) · POST (**lote** — o saveAll do plano virou 1 request) | `HistoryTab`, `MatchingTab`, `PrimiparousTab`, `MatingPlanTab` |
| `/api/matings/[id]` | PATCH (status) · DELETE | `HistoryTab` |
| `/api/matings/failed-counts` | GET (contagem por fêmea) | `useHerdStrategy` |
| `/api/calc/top3` | POST (1..N fêmeas em lote) | matching individual + primíparas |
| `/api/calc/mating-plan` | POST | plano de acasalamento |
| `/api/calc/meta-search` | POST | busca por meta |
| `/api/calc/progeny` | POST | modal Perfil da Progênie (via plano) |

- `ensureBullInDb` (resolução touro code→uuid, inserindo do catálogo quando preciso)
  **migrou para o servidor**: `src/lib/ensure-bull-server.ts` (usado por `/api/tank` e `/api/matings`).
  Isso também corrigiu um bug do `PrimiparousTab`, que inseria `bull_id` pseudo-code (FK quebrada).
- Os hooks mantiveram **exatamente** as mesmas assinaturas de retorno; internamente
  usam `fetch(..., { cache: 'no-store' })`. Conversões row→domínio foram extraídas
  para `src/lib/row-mappers.ts` (módulo agnóstico, usado por client E server).

### Cálculos: o que roda onde

| Onde | O quê | Por quê |
|---|---|---|
| **Servidor** (`/api/calc/*` importa `genetics.ts` direto) | `getTop3Options` (1..N fêmeas), `runMatingPlan`, `searchByGoal`, `calcularIndicesProgenie` (modal) | Cálculos decisórios; o client manda só **ids/códigos + parâmetros** e o servidor reconstrói os inputs (`src/lib/calc-data-server.ts` replica o merge de touros do `useBulls`) |
| **Client** | transforms de render: chips de progênie no histórico, `progenyProfile`/`calcPppv` dentro dos cards, `scoreBull` em exibição, mérito do rebanho (`calculateFemaleMeritScore` no memo do `useHerdStrategy`) | São síncronos por linha/render; `genetics.ts` permanece agnóstico de framework de propósito |
| **Client (demo)** | TODOS os cálculos | DemoApp e conta demo não chamam API — a façade `src/lib/calc-client.ts` decide local × remoto via `isLocalCalc()` |

### Os caminhos de dados na Fase 2 (alterados na Fase 3 — ver abaixo)

1. **`NEXT_PUBLIC_DEMO_MODE=true` (DemoApp)** — decidido em build time. 100% client-side,
   hooks `useDemo*`, localStorage `genefy_demo_*`. *(Removido na Fase 3.)*
2. **Conta `demo@gmail.com` (dentro do SupabaseApp)** — sessão mock sem cookies Supabase.
   Na Fase 2 era 100% client-side: farm fixa "Fazenda Teste", fêmeas `DEMO_FEMALES`,
   botijão/presets/estratégia/matings em localStorage (`genefy_demo_account_*`,
   matings via `src/lib/demo-matings.ts`). **Zero chamadas `/api`, zero REST Supabase**.
   *(Na Fase 3, as LEITURAS passaram para a API.)*
   - *Mudança de comportamento (correção)*: antes, todos os visitantes demo
     compartilhavam uma farm/botijão REAIS no banco; agora cada browser tem os seus.
3. **Usuário real** — login Supabase → cookies → API interna → RLS.

### Matriz fêmeas × touros — removida

Por decisão de produto na Fase 2 (em vez das alternativas worker/endpoint paginado/runtime
estendido), a funcionalidade saiu do sistema (`ec2d447`):
- Apagados `src/components/full-analysis/FullAnalysisTab.tsx` e `src/workers/matrixWorker.ts`
- Aba removida do `CustomHeader` (e do `Header.tsx` órfão) e dos dois shells
- As duas chamadas à tabela inexistente `cached_analysis` (404 silencioso) morreram junto

### Validação da Fase 2 (build de produção, Playwright + Chrome)

- ✅ `npm run build` verde em todas as 11 fatias (1 commit por domínio)
- ✅ **12/12 endpoints → 401** sem sessão e com cookie inválido
- ✅ Conta demo e2e: login → matching local → plano (100 fêmeas) → salvar →
  histórico com 86 matings vindos do localStorage
- ✅ Captura de rede da sessão demo inteira: **0 requests `/api`, 0 REST Supabase**
- ✅ DemoApp: banner, matching local, 0 chamadas API, 0 erros JS
- ✅ Aba Análise Completa ausente nos dois modos

---

## FASE 3 — Blindagem do bundle (demo via API)

Motivação: após a Fase 2, **fórmulas e dados ainda eram extraíveis do JS do client**
("view source"): genetics.ts inteiro (por causa do caminho local de cálculo do demo),
`CATALOG_BULLS` (2.720 touros) e — o mais grave — **`BASE_FEMALES`, as 469 fêmeas
REAIS da Granja Cavalli**, embarcadas num bundle servido sem autenticação.

### O que mudou

1. **DemoApp removido do sistema** (`NEXT_PUBLIC_DEMO_MODE` deixou de existir).
   A única experiência de demonstração é a conta `demo@gmail.com`. Apagados:
   `DemoApp` em `views/App.tsx`, `src/hooks/useDemo.ts`, branches `IS_DEMO` em
   HerdTab/FemalesCatalogTab/CustomHeader/MatingPlanTab, prop `demoMode` do HistoryTab.

2. **Demo via API (cookie)**: o login demo grava o cookie `genefy_demo_session`;
   os handlers checam `isDemoRequest()` (`src/lib/demo-server.ts`) ANTES do
   `requireUser()` e servem dados FICTÍCIOS sem tocar no Supabase:
   - `GET /api/farm` → Fazenda Teste fixa
   - `GET /api/females` → `DEMO_FEMALES` (100 fictícias)
   - `POST /api/calc/*` → computam sobre os dados fictícios (`getCalcContext`)
   - **Escritas demo continuam client-side** (memória/localStorage) — servidor
     stateless nunca persiste nada para a demo

3. **`GET /api/catalog`** (sessão OU cookie demo; `Cache-Control: private, max-age=3600`):
   o catálogo saiu do bundle; `useBulls` busca da API (~880KB JSON, cacheado no browser).

4. **`useFemales` sem `BASE_FEMALES`**: estado inicial `[]`; fallbacks do
   catálogo de fêmeas removidos. *(Efeito visível: a aba Catálogo de Fêmeas
   mostra apenas o rebanho da fazenda logada — antes mesclava as 469 fêmeas
   da Granja Cavalli para qualquer usuário.)*

5. **`calc-client.ts` sem caminho local**: sempre POSTa; nenhum import runtime
   de genetics.ts no client (tipos via `typeof import`, apagados na compilação).

### O que foi PROVADO no bundle de produção (grep nos chunks)

| Marcador | Resultado |
|---|---|
| Fêmea real (`bdate 2019-02-12`, 1ª de BASE_FEMALES) | **ausente ✓** |
| Touro de catálogo (`200HO13678` / Timetraveler) | **ausente ✓** |
| `DEMO_FEMALES` (pool `DELTA-LAMBDA`) | **ausente ✓** |
| `doseAllocated` (chave construída SÓ dentro de `runMatingPlan`, lida por nenhum componente) | **0 ocorrências ✓** → corpo dos algoritmos fora do bundle (tree-shake por export confirmado) |
| `ICFG`/`normCdf` (matemática de render: norm, progenyProfile, calcPppv, estimateCowPtas, mérito) | presente — **trade-off aceito** (decisão de produto) |

Tamanho dos chunks do client: **1,5MB total** (antes continha data.ts 670KB + catálogo).

### O que AINDA fica no client (aceito conscientemente)

Matemática de exibição por linha: `estimateCowPtas`/`calcCowRel` (HerdTab),
`calculateFemaleMeritScore` (memo da estratégia), `progenyProfile`/`calcPppv`
(cards/modal), `inb`, `norm` + ranges `ICFG`, helpers de formatação. Movê-los
exigiria endpoints com debounce e latência em sliders/tabelas.

### Smoke da Fase 3 (browser real)

- Login demo → cookie gravado → matching/plano calculados **no servidor**
  (`POST /api/calc/top3` e `/api/calc/mating-plan` observados na rede)
- Histórico demo: 86 matings do localStorage
- **Zero chamadas REST Supabase** na sessão demo inteira; `/api/catalog` 401 sem
  sessão/cookie e 200 com cookie demo
- Zero erros JS

---

## Pendências e ações operacionais

| # | Ação | Responsável |
|---|---|---|
| 1 | **Validação autenticada com login real** (cookie→RLS fim-a-fim): logar com usuário real e conferir rebanho/botijão/salvar acasalamento. Não foi possível automatizar sem criar usuário na base de produção | usuário |
| 2 | **Re-login obrigatório**: sessões antigas viviam em localStorage; com cookies, cada usuário real loga de novo uma vez após o deploy | usuários |
| 3 | **Vercel**: renomear env vars do projeto para `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` antes do próximo deploy (`NEXT_PUBLIC_DEMO_MODE` deixou de existir na Fase 3) | usuário |
| 4 | **Rotacionar a service role key** exposta em `scripts/verify_rls.ts` (pré-existente; o arquivo hardcoda URL + anon + service role) | usuário |
| 5 | Endurecer policies RLS (`owner_id IS NULL` dá acesso público a farms órfãs; `bulls: insert policy` rejeita inserts de catálogo com `farm_id NULL`, herdado pelo `ensureBullInDb` do servidor) — fora de escopo das fases, comportamento mantido | follow-up |

## Mapa de arquivos novos (Fases 2 e 3)

```
src/proxy.ts                      # refresh de sessão (middleware do Next 16)
src/lib/supabase-server.ts        # createServerClient + requireUser (401)
src/lib/ensure-bull-server.ts     # code→uuid no servidor (tank/matings)
src/lib/calc-data-server.ts       # getCalcContext (real via RLS | demo fictício)
src/lib/calc-client.ts            # façade: sempre POST /api/calc/* (F3)
src/lib/row-mappers.ts            # rowToFemale/rowToBull/femalesToRows agnósticos
src/lib/demo-server.ts            # cookie demo + dados fictícios server-side (F3)
src/lib/demo-matings.ts           # store localStorage de matings da conta demo
src/app/api/**                    # 17 route handlers (16 da F2 + /api/catalog)
```

## Como rodar

```bash
npm run dev          # http://localhost:3000 (era 5173 no Vite)
npm run build        # tsc --noEmit && next build (único check do projeto)
npm run start        # serve o build de produção
npm run seed         # inalterado (tsx scripts/seed.ts, service role via .env)
```

`.env.local` (gitignored): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`NEXT_PUBLIC_DEMO_MODE` — ver `.env.example`. Lembre: valores são fixados no build.
