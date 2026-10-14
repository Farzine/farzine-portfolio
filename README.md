# Farzine Hossen — Profile explorer

Incremental migration of the original static portfolio to Next.js and Supabase. The current phase and exact continuation task live in [CONTEXT.md](CONTEXT.md). This is a work in progress; the public migration and database policy tests are implemented; the CMS and live Supabase integration checks are not yet complete.

## Local development

Node 22+, npm. Run `npm ci`, then `cp .env.example .env.local`, and `npm run dev`. Open http://localhost:3000. Without published settings the site shows an unpublished state. Set `PORTFOLIO_DEMO_MODE=true` in `.env.local` for the explicit local legacy-content preview; production ignores this flag. See [Supabase setup and draft import](docs/deployment.md). Database/auth helpers are implemented; the actual login/CMS workflows are still pending.

Commands: `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `npm run test:e2e`. Browser tests currently use system Chrome; see [deployment notes](docs/deployment.md) for environment limitations.

## Project notes

[Implementation plan](docs/implementation-plan.md), [architecture](docs/architecture.md), [design system](docs/design-system.md), [content inventory](docs/content-inventory.md), [security](docs/security.md), [deployment](docs/deployment.md).

`index.html`, `projects/`, `assets/`, and the pre-existing `Readme.md` are retained unchanged as migration evidence. Next.js uses `app/` as its entry point. Display assets retain their filenames in `public/assets/img/`. Legacy BootstrapMade attribution remains with its original files. This project retains its existing LICENSE.

Current checkpoint: Phases 0–3 passed locally. Phase 4 login/settings/projects CMS is next. Exact observed checks and external gaps are in [the test log](docs/test-log.md). The repository filesystem filled during QA; only an ignored generated cache was relocated. See deployment notes before resuming substantial work.
