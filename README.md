# Farzine portfolio

Next.js App Router, strict TypeScript and Supabase portfolio with a protected owner CMS. The migration preserves the original section-switch layout, typography, imagery and historical content. Dark is the first-visit default; light is an accessible palette translation. Optional Three.js enhances the existing project-card brackets after desktop interaction; the site works without JavaScript or WebGL.

The legacy site is [farzine.vercel.app](https://farzine.vercel.app/). This branch has **not** been pushed or deployed, and no hosted database has been changed. Local test coverage and remaining operational checks are in [QA](docs/qa/phase-8.md) and [deployment](docs/deployment.md).

## Run locally

Use Node 22.x, npm 10+ and Docker for local Supabase.

```sh
npm ci
npx supabase start
npm run dev:local
```

Open http://127.0.0.1:3000. The wrapper passes only the local provider URL/publishable key in memory. Imports start draft/hidden; review them before publishing. On an existing local stack, use `npx supabase migration up --local` without resetting data. For environment configuration, an explicit read-only source preview and test fixtures, see [setup](docs/setup.md). Preserve an existing `.env.local`; never put secrets into Git or chat.

## Edit content

Provision the owner through Supabase Dashboard and the private UUID allowlist, then visit `/admin/login`. There is no public signup. [Bootstrap](docs/supabase.md#owner-project-bootstrap-manual-never-paste-keys-in-chat) and [owner guide](docs/admin.md) cover identity/biography, all projects and source collections, section order/visibility, navigation, resume/social/contact links, public labels, media and SEO. All writes validate on the server and require a verified allowlisted identity; normal runtime needs no service-role key.

New uploads default private. Publish a separate public copy and select it in content; replace references before deleting old files. [Media guide](docs/media.md) explains limits, retries and public-byte privacy. Contact uses real editable links; no message-delivery form or fake analytics is supplied.

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
npm run audit:performance
```

`test:db` requires the separate disposable policy container described in [Supabase setup](docs/supabase.md#reproduce-local-sqlrls-gate). Fixtures and CMS browser tests mutate only the isolated local test stack; never use them on valued/hosted data. `CHROME_PATH=/usr/bin/google-chrome` selects installed Chrome. Audit downloads pinned Lighthouse 13.5.0 on first use and measures its own production server on 3103; browser tests own 3102 and production-boundary 3101. Run profiling separately. Ignored traces can contain sessions; do not publish them.

## Deploy and maintain

Run `npm run build` / `npm run start` with real environment configuration, a supported Node/sharp runtime and the reviewed migrations. Static GitHub Pages export is not supported: Auth, CMS, dynamic content, cache invalidation and nonce CSP require a Next server. [Deployment](docs/deployment.md) covers Vercel/self-hosting, environment names, first admin, cache/proxy requirements, backups, rollback and verification. No external deployment or production migration is authorized by these instructions.

- [Architecture and caching](docs/architecture.md)
- [Security model and checks](docs/security.md)
- [Source/content provenance](docs/content-inventory.md)
- [Design preservation and deviations](docs/design-preservation.md), [tokens](docs/design-system.md)
- [Phase plan](docs/implementation-plan.md), [continuation state](CONTEXT.md)

Original `index.html`, `assets/` and `projects/` remain preserved. The legacy Personal template/BootstrapMade attribution remains in source and adapted CSS; review original/vendor asset licenses before redistribution. Historical dates and claims are imported snapshots, not assertions that they are current.
