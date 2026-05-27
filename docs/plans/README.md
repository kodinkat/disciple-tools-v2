# Plans (Disciple Tools v2)

This folder is the **canonical place to track implementation and delivery plans** for the v2 codebase. Execution status, ADRs, and phase notes should link from here once work begins.

## Documents

| Document | Purpose |
|----------|---------|
| [Master roadmap](./master-roadmap.md) | Phased delivery from blueprint scaffold through migration; decisions, risks, v1 parity goals. |
| [Roles & permissions matrix](./roles-and-permissions-matrix.md) | Role × permission reference; UI surfaces (toolbar, admin); links to code and ADR 0002. |
| [Phase 02 execution checklist](./phase-02-execution-checklist.md) | Sequenced tasks for domain model, storage (ADR 0001), APIs, RBAC, shell sidebar. |
| [Phase 03 execution checklist](./phase-03-execution-checklist.md) | List API extensions, hubs, QA for listing and queries. |
| [Phase 04 execution checklist](./phase-04-execution-checklist.md) | Detail/layout APIs, web components, QA, **completion report** (§ E). |
| [Phase 03 list query contract](./phase-03-list-query-contract.md) | `GET /api/records/:typeKey` query params (`sort`, `q`, `filters`, pagination). |
| [Admin record schema & complex fields](./admin-record-schema-execution.md) | Admin UI/API milestones (custom types & fields); satellite storage per ADR 0003. |
| [Phase 04 detail view contract](./phase-04-detail-view-contract.md) | **`GET /api/records/:typeKey/:id`** response `detail` envelope (`layout`, `fields`). |
| [Extensibility (Layers + hooks)](./extensibility-nuxt-layers-and-hooks.md) | Build-time Layers vs runtime hook registry; Mermaid diagrams; WP parity notes. |
| [Local PostgreSQL (Docker)](./local-postgresql-docker.md) | Compose layout, `./data` volume persistence, env vars, app `DATABASE_URL`. |

Implementable assets live next to docs:

| Path | Role |
|------|------|
| [`docker/postgresql/`](../../docker/postgresql/) | `docker-compose.yml`, `.env.example`, operator README; host data in **`data/`**. |

## Relationship to other `docs/` content

After the application scaffold exists, supplementary material may live alongside this folder:

- `docs/` (repo root): high-level contributor index, architecture overview, glossary.
- **`docs/phases/`** — phase execution playbooks ([index](../phases/README.md); stubs committed, expand during each phase).
- **`docs/adr/`** — Architecture Decision Records ([index](../adr/README.md); template [`0000-template.md`](../adr/0000-template.md)).

Plans stay under **`docs/plans/`** so product and engineering can review scope without navigating application-specific docs trees.
