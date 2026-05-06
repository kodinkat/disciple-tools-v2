# ADR 0001 — Record storage model (PostgreSQL)

## Status

Accepted

## Context

Disciple Tools v2 needs a **greenfield PostgreSQL model** for “records” (contacts, groups, and future/custom types) that:

- Mirrors **v1 mental models** (`DT_Posts`, `dt_custom_fields_settings`, field kinds) **without copying WordPress storage**.
- Supports **many record types**, **typed field schemas** per type, and **reasonable query paths** toward Phase 3 listing (filters, sort, pagination).
- Avoids premature **over-normalisation** while keeping room for hot-path indexes later (generated columns or partial indexes).

Competing directions:

| Option | Upside | Downside |
|--------|--------|----------|
| EAV-only (single `field_values` table) | Maximum flexibility early | Heavy joins or JSON aggregation for lists; brittle constraints. |
| Fully normalised tables per type | Reporting & FK joy | Divergent schemas per migration; duplication for cross-type tooling. |
| Document DB / separate service | Simple nested docs | Diverges from “Postgres-first” roadmap; infra sprawl Phase 02. |

## Decision

Adopt **registry + typed field definitions + polymorphic records with JSON payload**:

1. **`record_types`** — One row per logical type (`contacts`, `groups`, …).
   - Columns (minimum concept): surrogate `id`, stable **`key`** (`text`, unique), **`label`**, **`is_system`** (bool), timestamps, optional **`meta` jsonb** for non-field settings.

2. **`record_type_fields`** — Ordered field schema rows per type.
   - Columns: `id`, `record_type_id` (FK cascade), **`field_key`** (unique within type), **`kind`** (`text`; maps to renderer + validation semantics), **`label`**, **`order`** (int), **`config` jsonb** (select options, connection targets, placeholders, constraints).
   - Uniqueness: **`(record_type_id, field_key)`**.

3. **`records`** — One row per record instance.
   - Columns: `id` (uuid PK), **`record_type_id`** (FK), **`created_at` / `updated_at`**, **`created_by`** (nullable FK `users`), **`data` jsonb** (canonical field payloads keyed **`field_key` → stored value**, shapes defined by Phase 02 field-kind contract mirroring v1 compatibility docs).
   - Indexing baseline: btree on **`record_type_id`**, **`updated_at`** (DESC) for timelines; defer **expression / GIN** indexes until workload evidence (ADR follow-up acceptable).

Field **presence** defaults and **required** rules live primarily in **`record_type_fields.config`** plus server validation helpers; **`data`** stores only authoritative values.

**Authorization** remains **orthogonal**: permissions will reference **`record_types.key`** or type-scoped verbs (specified with implementation); storage shape does not embed auth rows.

### Non-goals (this ADR)

- Cross-type unified materialised view — Phase 3 / separate ADR.
- Full-text / external search cluster — defer to Phase 3 decision.
- v1-post **ID** parity or field-key equivalence — Phase 5 / pairing ADR before migration tooling.

### Alternatives rejected (short)

- **EAV-only** for values: rejected due to predictable list/read hot paths and ergonomics across many types.
- **One physical table per type** at Phase 02: defer until optimisation needs exceed JSON trade-offs.

## Consequences

- **Positive**: One migration story for new types; schema evolution via **additive** field rows + optional data migration scripts; aligns with Nitro APIs returning **field schema + payload** blobs for Phase 4 detail UI.
- **Negative**: Some reporting needs may require generated columns / views; validators must coerce JSON carefully.
- **Follow-up**: TypeScript/Kysely types for `records.data` may use `unknown`/per-kind inference in services; Phase 03 listing ADR should reference indexing strategy (`jsonb` path vs generated columns vs denormalised sort keys).

## Links

- [Phase 02 playbook](../phases/phase-02-domain-model-and-record-types.md)
- [Phase 02 execution checklist](../plans/phase-02-execution-checklist.md)
- [Master roadmap — Phase 2](../plans/master-roadmap.md)
- v1 conceptual references (theme repo): `dt-posts-field-settings.md`, `dt-posts-field-formats.md`
