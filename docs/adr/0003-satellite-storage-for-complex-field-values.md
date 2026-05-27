# ADR 0003 — Satellite storage for multi-valued & relational field kinds

## Status

Accepted

## Context

[ADR 0001](0001-record-storage-postgres.md) places canonical **scalar** and **simple structured** field payloads in **`records.data` (jsonb)** per **`field_key`**. That remains the right default for listing hot paths and PATCH ergonomics.

Disciple Tools **v1** treats several **`dt_custom_fields_settings`** kinds as **multi-valued** or **relational** (arrays of structured objects, post-to-post edges), not as a single scalar key in `post_meta`. Examples include `communication_channel`, `link`, `location` / `location_meta`, `tags`, and **`connection`** ([v1 field settings guide](https://github.com/DiscipleTools/disciple-tools-theme/blob/master/docs/dt-posts-field-settings.md)).

For v2 we want to:

- Avoid stuffing **unbounded arrays** of heterogeneous rows into **`records.data`** for kinds that deserve **indexed / FK-backed** storage.
- Introduce **one generalized row-per-value store** plus **one relationship table** for **connection** edges, so Phase 05 migration and admin tooling can target stable tables.
- Leave **multi_select** (fixed option set) and similar **enumerated** multi-values in **`records.data`** as a **JSON array** unless reporting forces normalization later (documented as reversible).

## Decision

### 1. Keep **`records.data`** as the default store for

Kinds that map naturally to **one JSON value per `field_key`** (CREATE/UPDATE merge at the key level):

- `text`, `textarea`, `number`, `boolean`, `date`, `key_select`, `user_select`
- `multi_select` — **array of option keys** in **`data[field_key]`** (v1-compatible mental model).
- any future scalar kinds unless promoted to satellite storage by a later ADR.

### 2. Add **`record_field_entries`** — polymorphic **row-per-value** satellite

Stores **multiple ordered rows** per **`(record_id, field_key)`** for kinds that are not simple scalars:

| `entry_type` (column) | Purpose | **payload** `jsonb` (illustrative v1-aligned shapes) |
|-----------------------|---------|------------------------------------------------------|
| `communication_channel` | Phone / email / etc. | e.g. `{ "value": "+1…", "key": "phone", "verified": false }` — exact keys validated in services |
| `link` | Multiple URLs | e.g. `{ "type": "default", "value": "https://…" }` |
| `location` | Multiple map points | e.g. `{ "label": "…", "lat": n, "lng": n }` |
| `location_meta` | Grid / detailed locations | e.g. `{ "label": "…", "lng", "lat", "grid_meta_id": "…" }` — rich validation deferred to mapping layer |
| `tags` | Freeform tags (multi-row string) | e.g. `{ "value": "urgent" }` |

- **`sort_order`** (int) establishes display / canonical ordering within a field.
- **Timestamps** on each row support audit and sync (optional consumer).

### 3. Add **`record_connections`** — relational **connection** fields

Directed edges **from** a source **`records`** row **to** a target **`records`** row:

- **`record_id`** — source (v1 “from” side depending on field `p2p_direction`; server resolves using **`record_type_fields.config`** when implementing PATCH/detail).
- **`field_key`** — which `connection` field on the source.
- **`connected_record_id`** — target row (**FK** to **`records.id`**).
- **`meta` jsonb** — optional field-level attributes.
- **`sort_order` int** — ordering among connections on the same field.

Deleting either endpoint record removes rows via **`ON DELETE CASCADE`** (same as v1 “post deleted” behavior for P2P-style stores).

### 4. Contract with **APIs** (implementation follow-up)

- **`GET` detail / list** should **assemble** satellite rows into the same **field value shapes** v1 clients expect (arrays, connection id lists), keyed by **`field_key`** — see Phase 05 parity.
- **`PATCH`** may **reject** writes to **`data[field_key]`** for kinds stored in satellites and require **dedicated routes** or nested operations (follow-up design; not blocked by this ADR).

## Alternatives considered

- **Single EAV table for all non-scalars** — rejected for connections: **FK** to **`records`** is valuable for integrity and “other contacts in this group” queries.
- **Everything in `records.data`** — rejected for communication/tags volume and connection referential integrity at scale.
- **Separate physical table per field kind** — deferred; **`record_field_entries`** + `entry_type` keeps migrations and admin CRUD simpler until metrics justify splitting.

## Consequences

- **Positive**: Clear home for migration scripts from v1 `post_meta` / connection stores; indexes on **`(record_id, field_key)`** and **`connected_record_id`** support list/detail.
- **Negative**: Application code must **branch** on **`record_type_fields.kind`** when reading/writing (helpers in **`record-field-storage`** utilities).
- **Follow-up**: Admin UI for schema editing (per prior plan) and Nitro routes for satellite PATCH; **ADR 0001** unchanged for scalar majority.

## Links

- [ADR 0001 — Record storage (Postgres)](0001-record-storage-postgres.md)
- [Phase 05 — Migration & parity](../phases/phase-05-migration-and-parity.md)
- [Admin record schema execution plan](../plans/admin-record-schema-execution.md)
- v1: `dt-posts-field-settings.md`, `dt-posts.php` (`communication_channel`, `connection` handling)
