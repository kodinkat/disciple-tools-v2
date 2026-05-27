# Phase 1 — Scaffold and platform (Nuxt blueprints)

> **Status**: Initial scaffold landed (iteration in progress — CI, infra, layering TBD)  
> **Parent plan**: [Master roadmap](../plans/master-roadmap.md)

## What was implemented (2026-05-05)

### Location

All application source lives under **[`app/`](../../app/)** (sibling of `docker/` and `docs/` at repo root).

### Base template

Because `nuxi init` prompts are non-interactive-hostile in some environments, the UI baseline was seeded from **[`nuxt/starter`](https://github.com/nuxt/starter) `templates/ui`**, matching the blueprint expectation (Nuxt 4 + Nuxt UI).

### Blocks copied (manifest)

From [nuxt-blueprints](https://github.com/corsacca/nuxt-blueprints), in dependency order:

| Block | Notes |
|-------|-------|
| `core` | Kysely + Postgres-js, migrations plugin, layouts, starter pages |
| `email/mailgun` + `email/shared` | `server/utils/email.ts`, `email-templates.ts` |
| `activity-log` | `activity_logger`, migration `003_create_activity_logs_table`, schema fragment merged |
| `rate-limiting/db` | `server/utils/rate-limit.ts` |
| `auth-jwt` | JWT auth, RBAC baseline, login/register/profile, API routes |
| `admin` | `/admin` layout + middleware gate (`admin.access`) |
| `user-management` | `/admin/users`, `/admin/users` APIs, wired nav in `layouts/admin.vue` |
| `s3-storage` | `server/utils/storage.ts` |
| `kitchen-sink` | `/kitchen` (auth middleware included in blueprint page) |

Inventory: **[`app/.blueprints.json`](../../app/.blueprints.json)**

### Consolidated artifacts

| Artifact | Purpose |
|----------|---------|
| [`app/server/database/schema.ts`](../../app/server/database/schema.ts) | Single merged Kysely `Database` interface (users + auth columns + password_reset_requests + activity_logs) |
| [`app/.env.example`](../../app/.env.example) | Env vars merged from blocks; `DATABASE_URL` defaults aligned with Docker compose user/db |
| [`app/package.json`](../../app/package.json) | Dependencies merged; **`@oxc-*` Darwin bindings pinned** optional npm optional-deps behavior (see README) |

### UX wiring beyond raw copies

- [`app/app/app.vue`](../../app/app/app.vue): `UApp` + layout shell (blueprint core).
- [`app/app/layouts/default.vue`](../../app/app/layouts/default.vue): Profile link + display name (`auth-jwt` wiring notes).
- [`app/app/pages/index.vue`](../../app/app/pages/index.vue): Auth-aware landing; redirects authenticated users to `/dashboard`.
- [`app/app/pages/dashboard.vue`](../../app/app/pages/dashboard.vue): `middleware: ['auth']`.
- Removed starter-only components `AppLogo.vue`, `TemplateMenu.vue`.

### Verify locally

```bash
cd ../../docker/postgresql && docker compose up -d
cd ../../app && cp .env.example .env && npm install && npm run dev
```

Smoke: `npm run build` completes (done once in scaffolding).

### Node / toolchain

- Prefer **Node ≥ 22.12.0**. See **[`app/README.md`](../../app/README.md)** if `nuxt prepare` fails on missing `@oxc-*` natives.

---

## Outstanding (next iterations)

- [ ] CI workflow (lint, typecheck, build) on pushes/PRs.
- [ ] Optional `layers/` structure for domains per [Extensibility plan](../plans/extensibility-nuxt-layers-and-hooks.md).
- [ ] MailHog / Mailgun dev ergonomics validated end-to-end.
- [ ] Linux/WSL developer notes if `oxc` binding packages beyond Darwin are needed.

---

## Dependencies

Phase 0 decisions (constraints, glossary, parity matrix) — polish in parallel.

## References

- [nuxt-blueprints](https://github.com/corsacca/nuxt-blueprints) — upstream blocks and blueprint docs.
- [Nuxt Layers](https://nuxt.com/docs/getting-started/layers).
