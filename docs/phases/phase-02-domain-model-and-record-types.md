# Phase 2 — Domain model: core + custom record types

> **Status**: **First increment complete** (2026-05-06) — execution checklist signed off pending your visual QA on `npm run dev`.  
> **Parent plan**: [Master roadmap](../plans/master-roadmap.md)

## Objectives

- Record type registry (system vs custom); migrations; optional admin hooks.
- Field schema aligned with v1 concepts (`dt_custom_fields_settings` as **compatibility checklist**, not WP storage mechanics).
- **Authorization** scoped by record type and role (server-enforced).
- **Extensibility**: server-side hook points for record lifecycle (create/update/list/detail schema) — see [Extensibility](../plans/extensibility-nuxt-layers-and-hooks.md).

## Decisions (accepted)

| Topic | Document |
|-------|----------|
| PostgreSQL record storage shape | [ADR 0001 — Record storage](../adr/0001-record-storage-postgres.md) |
| Toolbar / admin RBAC consistency | [ADR 0002 — Navigation & admin shell RBAC](../adr/0002-rbac-navigation-and-admin-shell.md) |
| Role × permission reference | [Roles & permissions matrix](../plans/roles-and-permissions-matrix.md) |

## Agreed MVP scope (2026-05)

Product direction captured from planning — **iterate in small increments**, then widen.

| Area | Decision |
|------|-----------|
| **Record types** | **Contacts** and **groups** only for the first vertical slice — use v1 **`dt-contacts/`**, **`dt-groups/`**, and theme **`docs/`** (`dt-posts-field-settings.md`, field formats, list query) as the **conceptual checklist** for labels, descriptions, and **core fields** — not WP storage verbatim. |
| **Permissions vocabulary** | **Bootstrap from v1** — primary source **`dt-core/configuration/class-roles.php`** and the **`dt_set_roles_and_permissions`** / capability model (multiplier, user_manager, dt_admin, etc.). Map those capabilities into **v2 granular strings** (`permissions.ts` + matrix) incrementally so OAuth/delegation stay viable; no requirement to replicate every role on day one. |
| **Hook parity** | For each critical path (e.g. **create**, **update**, **read**, **list**), trace v1 **`DT_Posts`** and module code for **`apply_filters` / `do_action`** touching that path — e.g. `dt_post_create_fields`, `dt_post_created`, `dt_post_updated`, `dt_after_get_post_fields_filter`, permission filters (`dt_filter_access_permissions`, …) — then stand up **matching v2 Nitro hook points** per [Extensibility plan](../plans/extensibility-nuxt-layers-and-hooks.md). Work is **sequenced per path**, not exhaustive on day one. |

## Execution checklist

Tracked in **[Phase 02 execution checklist](../plans/phase-02-execution-checklist.md)** (data layer, APIs, permissions, contextual sidebar milestone).

## Deliverables

- [x] Contacts + groups domain APIs + Postgres migrations (per ADR 0001 and MVP scope above).
- [x] Documented hook names and payload contracts — [Phase 02 v1 → v2 hook catalogue](../plans/phase-02-v1-hook-catalogue.md) (aligned to v1 create/update/read/list/delete paths; list/query detail → Phase 03 where noted).

## Dependencies

- Phase 1 scaffold (complete for current increment).
- **ADR 0001** / **0002** accepted.

## References

- v1 theme: **`dt-core/configuration/class-roles.php`**, **`dt-posts/dt-posts.php`** (create/update/read/list hooks).
- v1 theme `docs/`: `dt-posts-field-settings.md`, `dt-posts-field-formats.md`, `dt-posts-list-query.md`.
