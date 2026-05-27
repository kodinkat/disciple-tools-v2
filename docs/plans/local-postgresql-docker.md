# Local PostgreSQL with Docker

## Goal

Provide a **repeatable local database** for Disciple Tools v2 development: one command to start Postgres, with **all data persisted on disk** in a directory next to the Compose file (`docker/postgresql/data/`).

This matches the greenfield stance in [Master roadmap](./master-roadmap.md): the Nuxt blueprint stack uses Postgres (via `DATABASE_URL`); contributors should not rely on a system-wide Postgres install unless they prefer to.

## Directory layout

Repository paths (relative to v2 repo root):

```
docker/postgresql/
├── docker-compose.yml  # postgres + adminer (optional web UI)
├── .env.example
├── README.md           # Operator quick-start
└── data/               # Host bind mount target (created at runtime; gitignored)
```

- **Compose file location**: Compose uses a **relative** volume `./data:/var/lib/postgresql/data`. Running `docker compose` from **`docker/postgresql`** ensures `./data` is always `docker/postgresql/data/` — predictable and documented.
- **Persistence**: PostgreSQL writes its full data directory into `data/`. Stopping or recreating the container does not remove `data/` unless you delete it manually.
- **Git**: `docker/postgresql/data/` is listed in the repo-root `.gitignore` so accidental commits of DB files cannot occur.

## Environment variables

`docker/postgresql/.env.example` documents:

- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_DB`
- `POSTGRES_PORT` (host port mapping; default `5432`)
- `ADMINER_PORT` (host port for Adminer; default `8080`)

Compose includes **Adminer** for browser-based schema and data inspection — see [docker/postgresql/README.md](../../docker/postgresql/README.md).

Copy to `.env` in the same directory. Treat `.env` as local secrets; do not commit it (add to `.gitignore` if you store real passwords).

## Application wiring (post-scaffold)

Once the Nuxt blueprint app exists, set:

```text
DATABASE_URL=postgresql://USER:PASSWORD@localhost:PORT/DBNAME
```

using the same values as in `docker/postgresql/.env`. Blueprints often read `DATABASE_URL` from the project root `.env` — that file is separate from `docker/postgresql/.env` but the **credentials should match**.

## Operational notes

- **Port conflicts**: If another Postgres uses `5432`, set `POSTGRES_PORT=5433` (or similar) in `docker/postgresql/.env`.
- **Major version**: The Compose file pins **Postgres 16** (`postgres:16-alpine`) for consistency with production targets; bump deliberately and document in an ADR if needed.
- **Healthcheck**: The service includes a `pg_isready` healthcheck so dependent tooling (or future Compose profiles) can wait for readiness.
- **Production**: This Compose stack is **for local development only**. Production databases use managed Postgres (or your ops standard), not this bind-mounted layout.

## See also

- [docker/postgresql/README.md](../../docker/postgresql/README.md) — copy-paste commands.
