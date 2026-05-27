# Local PostgreSQL (Docker)

Disciple Tools v2 expects a Postgres database for local development — see [docs/plans/local-postgresql-docker.md](../../docs/plans/local-postgresql-docker.md) for design notes and how to set `DATABASE_URL` once the app is scaffolded.

## Layout

```
docker/postgresql/
├── README.md           # This file
├── docker-compose.yml  # Postgres + Adminer services
├── .env.example        # Sample variables — copy to .env (gitignored recommended)
└── data/               # Created by Docker; Postgres files live here (gitignored)
```

The bind mount `./data:/var/lib/postgresql/data` keeps all database files under `docker/postgresql/data/` on your machine so containers can be recreated without losing data.

## Usage

From the repository root:

```bash
cd docker/postgresql
cp .env.example .env
docker compose up -d
docker compose logs -f postgres
```

## Adminer (web UI)

Compose also starts **[Adminer](https://www.adminer.org/)** on **`http://localhost:${ADMINER_PORT:-8080}`** (override with `ADMINER_PORT` in `.env`).

1. Open the URL in a browser.
2. **System**: PostgreSQL  
3. **Server**: `postgres` (defaulted from `ADMINER_DEFAULT_SERVER` — must match the Postgres service name on the Docker network)  
4. **Username** / **Password** / **Database**: use the same values as `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` in this directory’s `.env`.

To pre-fill database and user (you still enter the password manually):

```text
http://localhost:8080/?pgsql=postgres&username=dtv2&db=dtv2
```

Adjust host port and query parameters if you changed `ADMINER_PORT`, `POSTGRES_USER`, or `POSTGRES_DB`.

Stop without removing data:

```bash
docker compose down
```

Reset the database (destroys local data). Use this after **reordering or renaming Kysely migrations** during development so `kysely_migration` stays in sync:

```bash
docker compose down
rm -rf data
docker compose up -d
```

## Connection string

When `POSTGRES_*` matches your `.env`, the app `DATABASE_URL` typically looks like:

```text
postgresql://dtv2:dtv2_dev_change_me@localhost:5432/dtv2
```

Use the username, password, port, and database from your `.env`.
