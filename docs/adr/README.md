# Architecture Decision Records

This folder records **accepted** architectural decisions for Disciple Tools v2. Discussion and exploratory notes live primarily in [`../plans/`](../plans/) until a decision is finalized.

## Index

| ID | Title | Status |
|----|-------|--------|
| [0001](0001-record-storage-postgres.md) | Record storage model (PostgreSQL) | Accepted |
| [0002](0002-rbac-navigation-and-admin-shell.md) | RBAC alignment for navigation & admin shell | Accepted |

### Expected decisions (titles only — drafts to link from phase playbooks)

- **ADR-XXX** — Cross-type listing implementation (Postgres-only vs auxiliary search engine).
- **ADR-XXX** — Extensibility packaging: **Nuxt Layers** for build-time bundles vs **runtime hook registry** for WordPress-style filters/actions (see [Extensibility plan](../plans/extensibility-nuxt-layers-and-hooks.md)).
- **ADR-XXX** — Trust / signing model if third-party “plugins” load code at runtime.

## Conventions

- Number sequentially: `0001-short-title.md`, `0002-...`.
- Start from the [template](0000-template.md).
- One decision per file; update the table above when status changes.
