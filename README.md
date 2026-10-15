# Farzine Hossen — Profile explorer

Incremental migration of the original static portfolio to Next.js and Supabase. The current phase and exact continuation task live in [CONTEXT.md](CONTEXT.md). This is a work in progress; the public migration and database policy tests are implemented; core login and project/settings CMS are implemented; all modeled content editors, media and stored contact are implemented locally. Visual polish/WebGL, caching/security/SEO, final QA and live Supabase checks remain.

## Local development

Node 22+, npm. Run `npm ci`, then `cp .env.example .env.local`, and `npm run dev`. Open http://localhost:3000. Without published settings the site shows an unpublished state. Set `PORTFOLIO_DEMO_MODE=true` in `.env.local` for the explicit local legacy-content preview; production ignores this flag. See [Supabase setup and draft import](docs/deployment.md). Provision an owner through the setup notes; disable demo mode to use `/admin/login`.

Commands: `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `npm run test:e2e`. Browser tests currently use system Chrome; see [deployment notes](docs/deployment.md) for environment limitations.

## Project notes

[Implementation plan](docs/implementation-plan.md), [architecture](docs/architecture.md), [design system](docs/design-system.md), [content inventory](docs/content-inventory.md), [security](docs/security.md), [deployment](docs/deployment.md).

`index.html`, `projects/`, `assets/`, and the pre-existing `Readme.md` are retained unchanged as migration evidence. Next.js uses `app/` as its entry point. Display assets retain their filenames in `public/assets/img/`. Legacy BootstrapMade attribution remains with its original files. This project retains its existing LICENSE.

Current checkpoint: Phase 5 workflows are implemented; the final gate results are recorded in CONTEXT.md. Phase 6 begins visual/performance refinement. Exact observed checks and external gaps are in [the test log](docs/test-log.md). The repository filesystem filled during QA; only an ignored generated cache was relocated. See deployment notes before resuming substantial work.

`npm run test:cms` runs isolated desktop/mobile admin workflows against simulated Auth/Storage HTTP and real PostgreSQL RLS. Test snapshots/builds use /tmp and preserve the owner’s dev server. No live project is modified.
