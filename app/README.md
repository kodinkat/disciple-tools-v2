# Disciple Tools v2 — web application

Nuxt 4 + Nuxt UI, assembled from [nuxt-blueprints](https://github.com/corsacca/nuxt-blueprints): JWT auth, Mailgun transport, Postgres + Kysely, activity logging, DB-backed rate limiting, S3-compatible client helpers, admin shell + user-management, and a kitchen-sink page.

### Requirements

- **Node.js ≥ 22.12.0** is what Nuxt 4 / toolchain packages declare. Slightly older patch versions may work but can skip optional native modules; prefer **22.12+** (e.g. `nvm install 22.12 && nvm use 22.12`).
- To work around npm optional-dependency issues with **oxc** natives on macOS, this package pins `@oxc-{parser,transform,minify}/binding-darwin-x64` and lists `binding-darwin-arm64` under `optionalDependencies`. On **Linux**, add the matching `@oxc-*/binding-linux-x64-gnu` packages if `nuxt prepare` reports missing native bindings.
- **`patch-package`**: `postinstall` applies [`patches/@nuxt+ui+4.7.1.patch`](patches/@nuxt+ui+4.7.1.patch) on **`@nuxt/ui`** so the colors plugin avoids `useHead()` during SPA bootstrap (injects `<style>` in `document.head` instead when `ssr: false`) and uses **`nuxtApp.runWithContext`** elsewhere — fixes `useHead() was called without provide context`. Remove when upstream matches this behaviour.

## Quick start

From this directory (`app/`):

```bash
cp .env.example .env
npm install
```

Start PostgreSQL (repo root [`../docker/postgresql/`](../docker/postgresql/)) and align `DATABASE_URL` in `.env`.

```bash
npm run dev
```

Open `http://localhost:3000` (or whatever you set `NUXT_PUBLIC_SITE_URL` to).

## First-user bootstrap

Registering against an empty `users` table creates an **verified admin** and logs you in immediately (see blueprint `auth-jwt`).

Then use `/admin/users` for invitations and roles, `/admin/roles` for the permission matrix, `/kitchen` for the UI showcase (authenticated).

**Assembled** blocks are listed in [.blueprints.json](.blueprints.json).
