# Local setup

Use Node 22.x/npm 10+. Run `npm ci`. If you need a new environment file, use `cp -n .env.example .env.local`; preserve any existing file and keep values out of Git/chat.

## Database-backed development

```sh
npx supabase start
npm run dev:local
```

Open http://127.0.0.1:3000. The local wrapper reads CLI status privately and passes only the local project URL/publishable key to the child process. It never writes credentials into source or prints them. Original imports are drafts/invisible, so initially collections show honest empty states. For the isolated test stack only, `npm run test:fixtures:local` publishes historical imports while leaving personal facts and the private regression canary hidden. This modifies local test content; never use these fixtures with valued data or a hosted project. Owner-facing settings/project publication controls are at `/admin`; see [owner workflow](admin.md). The fixture command also provisions dedicated local test accounts, never hosted users.

For an existing Supabase test project, configure the URL/publishable key using [Supabase setup](supabase.md), then `npm run dev`. No service-role key is required. Missing/broken production configuration returns a real error/recovery state, never silent seed data.

## Read-only historical preview without a database

```sh
PORTFOLIO_USE_DEV_SEED=true npm run dev
```

Explicit development mode previews original public collections for visual work, displays a local-only notice and disables indexing. Private birthday/address/phone/email facts remain excluded. This does not persist writes or authenticate an admin; it is forbidden in production. The normal seed stays draft/invisible in the DB.

`npm run dev` / `npm run build` synchronize original assets/icon to ignored public copies. Original index.html, projects/ and assets/ remain unchanged. Old generated `public/legacy` HTML is moved to ignored `.legacy-preview` so edits are preserved but never served. If both folders exist, the script stops for review rather than overwriting either. Do not edit generated public assets; replace source assets or use the CMS media controls.

## Checks

```sh
npm run lint
npm run format:check
npm run typecheck
npm test
npm run test:db
npm run test:fixtures:local
npm run build:local
npx playwright install chromium
npm run test:production-boundary
npm run test:e2e:local
npm run test:security
```

The lightweight SQL harness (`test:db`) requires the separate disposable Postgres container described in [Supabase setup](supabase.md). Production browser tests use the full local stack and publication fixtures. `npm run build` also works without a running DB; dynamic public routes require valid configuration at request time. `npm run start` serves the production build; it does not enable development seed mode.

Playwright starts/stops its own app on reserved test port 3102 (development remains 3000) and refuses to reuse an existing server, tests desktop 1440×900/tablet 768×1024/mobile 390×844 and attaches screenshots to ignored test-results. If Chrome is installed, prefix browser commands with `CHROME_PATH=/usr/bin/google-chrome` instead of downloading Chromium. The production-boundary check uses port 3101 and stops its own server. CI creates isolated SQL/Supabase fixtures, builds and runs the same browser tests; startup logs containing local keys are not printed or uploaded. Sandbox environments may require host permission for npm network, tsx IPC, Docker, server sockets and Chrome.

`npm run format` formats only app/config/scripts/tests; legacy sources and reference captures remain untouched. `npm run inventory` rebuilds the original provenance ledger, not current DB content. `npm run capture:legacy` intentionally refreshes the original screenshot baseline using a server on 4173: serve a temporary copy of only index.html/assets/projects/favicon.ico, **never the repository root containing .env files**. Existing committed references should normally remain unchanged.

See [implementation plan](implementation-plan.md), [architecture](architecture.md), [security](security.md), [deployment](deployment.md), and [CONTEXT](../CONTEXT.md). Complete content/media CMS, themes, progressive project-hover WebGL, isolated public caching and CSP/SEO are implemented locally. See [final QA](qa/phase-8.md) for the local acceptance evidence and outstanding hosted checks.

After updating a working local stack, use `npx supabase migration up --local` (no reset) to apply new migrations, then regenerate types as documented in [Supabase setup](supabase.md). Fresh stacks apply all migrations at startup. Media uses native sharp binaries; keep the supported Node 22 deployment/runtime and do not omit required native dependencies. See [media](media.md) for limits and recovery.


`CHROME_PATH=/usr/bin/google-chrome node scripts/with-local-supabase.mjs test:e2e:motion` runs theme/graphics checks against an exclusively owned app server. It includes actual rendering/cleanup on a capable desktop browser and fallback checks on mobile/tablet. The full test:e2e command includes these tests. Admin test output uses test-results/admin so the second runner does not erase public reference captures. Do not upload traces; they contain session/action material.

Admin workflows run serially because they intentionally mutate one test portfolio; public viewport tests use two workers. After a production build/browser run, `test:security` scans reachable Git blobs, nonignored files, client chunks and available public Data Cache entries without reading ignored environment files or printing credential matches. It requires Git and a built `.next/static/chunks`; a restricted sandbox may need host permission for Git batch subprocess pipes. CI fetches full history. Pattern checks are bounded detection, not a credential guarantee.

`CHROME_PATH=/usr/bin/google-chrome npm run audit:performance` starts its own loopback production server3103 and runs pinned Lighthouse13.5.0 on home/project in simulated mobile and desktop modes. Requires Node≥22.19, installed Chrome (or a compatible CHROME_PATH), internet for the first ephemeral CLI download and the built app/local provider. Run separately from browser tests; summary is written to docs/qa/phase-8/lighthouse-summary.json, raw reports remain ignored. These are lab samples, not field scores. `npm run audit:links` checks historical seed external links/logos read-only and records owner-review cases; it does not rewrite source/CMS data or prove authenticated links are dead.
