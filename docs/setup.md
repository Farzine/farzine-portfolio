# Local setup (migration in progress)

Use Node 22.x and npm 10+. From the repository root:

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Open http://127.0.0.1:3000. Phase 1 works without Supabase: the Next homepage is a faithful foundation snapshot and section links open the preserved legacy preview. It is intentionally not an editable CMS yet. `PORTFOLIO_USE_DEV_SEED` is reserved for the explicit read-only development fallback in phase 2/3; it does not persist writes.

`npm run dev` and `npm run build` run `scripts/sync-legacy.mjs`: copy original assets to ignored `public/assets`, root icon to `public/favicon.ico`, and source HTML to ignored `public/legacy`. Original index.html, projects/ and assets/ remain unchanged. Generated HTML fixes asset URL resolution only; legacy interactions/content remain. The preview is noindex and will be retired after database-backed public migration. It still contains existing personal details, external scripts and old accessibility issues: do not deploy the interim preview as the completed migration.

```sh
npm run lint
npm run format:check
npm run typecheck
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

Playwright starts `npm run start` on port 3000 and tests the production build. If Chrome is already installed, use `CHROME_PATH=/usr/bin/google-chrome npm run test:e2e` instead of downloading a browser. Local sandbox environments may require explicit host permission for network installs, server sockets and headless Chrome. CI installs Chromium and runs all checks. Biome checks only application/config/scripts/tests, leaving legacy sources and captured references intact. `npm run format` formats those same files.

To inspect/capture original references, start `python3 -m http.server 4173 --bind 127.0.0.1` and run `npm run capture:legacy`; this intentionally refreshes local/live reference screenshots and report. `npm run inventory` rebuilds the provenance ledger from source, not from current database content. Do not refresh the baseline automatically when validating visual parity.

See [implementation plan](implementation-plan.md), [architecture](architecture.md) and [CONTEXT](../CONTEXT.md) for current phase and next task. See [Supabase setup and policy verification](supabase.md) for migrations, seed, first-admin provisioning, local policy tests and generated types. The public root remains the Phase 1 snapshot until Phase 3; login/CMS UI follows in Phase 4.
