# Phase 04 — Detail view contract (`GET /api/records/:typeKey/:id`)

Stable JSON envelope for **record detail UI** (v1 mental model: `post_settings` + field list). Phase 04 **first increment** ships a **single primary section** and **field-level metadata** derived from **`record_type_fields`**. Tiles, multi-section layouts, and edit `write` gating expand later without breaking the top-level keys.

## Response shape

Existing:

- **`record`** — same shape as Phase 02 (`id`, `type_key`, `created_at`, `updated_at`, `created_by`, `data`).

New:

- **`detail`** — read-only **view model** for the detail page (not a duplicate of raw `data`; values are merged per field for convenience).

### `detail.layout`

| Field | Type | Notes |
|--------|------|--------|
| `version` | `number` | **`1`** for this contract. Bump when section semantics change. |
| `sections` | array | Ordered. Each entry: `id`, optional `title`, `field_keys` (ordered keys into `detail.fields` / row `data`). |

**Increment 1:** One section **`primary`** titled **`Details`**, listing every schema field in **`field_order`**.

### `detail.fields`

Array of **ordered** field view models (same order as schema `field_order`). Each item:

| Field | Type | Notes |
|--------|------|--------|
| `field_key` | string | Stable key in `records.data`. |
| `kind` | string | From **`record_type_fields.kind`** (e.g. `text`, `key_select`). |
| `label` | string | Display label. |
| `description` | string \| null | Help text. |
| `field_order` | number | From schema (duplicate kept for client sort safety). |
| `config` | object | **`record_type_fields.config`** JSON (options, required, …). |
| `value` | unknown | Current value from **`record.data[field_key]`** (may be `null` / missing). |
| `select_options` | array? | Present when **`kind === 'key_select'`**: `{ id, label }[]` where **`id`** is stored in JSON (v1 **`key`**); maps to **`dt-single-select`** `options`. |

### Unsupported kinds

Clients should render a **fallback** (plain text / JSON) for unknown **`kind`** until the registry maps them to [@disciple.tools/web-components](https://github.com/DiscipleTools/disciple-tools-web-components).

## SSR / Lit

The Nuxt app runs with **`ssr: false`** in this repo; **Lit** components still register on the **client** via a **`dt-web-components`** plugin so **`customElements`** exist before the detail fields mount.

## See also

- [Phase 04 playbook](../phases/phase-04-record-detail-and-field-rendering.md)  
- [Phase 04 execution checklist](./phase-04-execution-checklist.md)
