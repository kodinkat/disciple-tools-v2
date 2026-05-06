# disciple-tools-v2

Greenfield **Disciple Tools v2** application (Nuxt + PostgreSQL). Planning and phased delivery are tracked in **`docs/plans/`**.

## Web application (`app/`)

Phase 1 scaffold: Nuxt 4 + [nuxt-blueprints](https://github.com/corsacca/nuxt-blueprints) blocks (JWT, Mailgun, Postgres/Kysely migrations, activity log, DB rate limiting, S3 client, admin + user management, kitchen sink). See **[app/README.md](app/README.md)** for install and run commands.

## Plans and roadmap

- **[docs/README.md](docs/README.md)** — documentation index (diagrams, structure)  
- **[docs/plans/README.md](docs/plans/README.md)** — index of plan documents  
- **[docs/plans/master-roadmap.md](docs/plans/master-roadmap.md)** — full phased implementation roadmap  
- **[docs/plans/extensibility-nuxt-layers-and-hooks.md](docs/plans/extensibility-nuxt-layers-and-hooks.md)** — Nuxt Layers + WordPress-style hooks  
- **[docs/plans/local-postgresql-docker.md](docs/plans/local-postgresql-docker.md)** — local Postgres via Docker  

**Phase playbooks:** [docs/phases/](docs/phases/) · **ADRs:** [docs/adr/](docs/adr/)

## Local PostgreSQL (Docker)

```bash
cd docker/postgresql
cp .env.example .env
docker compose up -d
```

Database files persist under **`docker/postgresql/data/`** (gitignored). See [docker/postgresql/README.md](docker/postgresql/README.md).
