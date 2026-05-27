# Admin record schema & complex fields — execution plan

Companion to the planning discussion (v1 **Customizations** parity, admin CRUD for **`record_types`** / **`record_type_fields`**) and **[ADR 0003 — Satellite storage](../adr/0003-satellite-storage-for-complex-field-values.md)** for **where** instance data lives (`records.data` vs **`record_field_entries`** vs **`record_connections`**).

## Grounding decisions

| Decision | Reference |
|----------|-----------|
| Scalar / `multi_select` arrays in **`records.data`** | [ADR 0001](../adr/0001-record-storage-postgres.md) |
| **communication_channel**, **link**, **location**, **location_meta**, **tags** → **`record_field_entries`** | [ADR 0003](../adr/0003-satellite-storage-for-complex-field-values.md) |
| **connection** → **`record_connections`** | [ADR 0003](../adr/0003-satellite-storage-for-complex-field-values.md) |
| Kind → storage routing helpers | [`app/server/utils/record-field-storage.ts`](../../app/server/utils/record-field-storage.ts) |

## Milestones

### M0 — Schema (done when migration `006` applied)

- [x] Migration **`006_record_satellite_field_storage`** creates **`record_field_entries`** + **`record_connections`**.
- [x] Kysely types updated in [`app/server/database/schema.ts`](../../app/server/database/schema.ts).

### M1 — Read-only admin: schema browser

- [x] `/admin` nav: **Record types** → **`/admin/record-schema`** (requires **`admin.access`** shell).
- [x] **`GET /api/admin/record-schema`**: **`admin.access`** RBAC + same payload shape as **`/api/record-types`** plus **`value_storage`** on each field (`data` \| `entries` \| `connections`).
- [ ] Show extended **tiles / config JSON** explorer (defer).

### M2 — Admin CRUD: field definitions (safe kinds)

- [x] Migration **`007_record_type_fields_is_system`** — **`record_type_fields.is_system`** (seed rows locked).
- [x] **`POST /api/admin/record-types`** — create **`is_system: false`** types (`admin.access`).
- [x] **`POST` / `PATCH` / `DELETE`** on **`/api/admin/record-type-fields`** — **`PATCH`/`DELETE`** reject **`is_system`** field rows; **`kind`** / **`field_key`** immutable after create (`admin.access`).
- [x] Validate **`config`** JSON per **`kind`** ([`admin-record-field-validation.ts`](../../app/server/utils/admin-record-field-validation.ts)) — subset of [v1 field settings](https://github.com/DiscipleTools/disciple-tools-theme/blob/master/docs/dt-posts-field-settings.md).
- [x] Admin UI (**`/admin/record-schema`**): New record type, Add field (JSON config), Edit/Delete unlocked rows; **`GET /api/admin/record-schema`** includes **`allowed_field_kinds`**.

### M3 — Instance I/O for satellite tables

- [x] **`GET` detail** merges **`record_field_entries`** + **`record_connections`** into **`detail.fields[].value`** (entry kinds → ordered payload arrays; **`connection`** → ordered target id list). Wired in [`[id].get.ts`](../../app/server/api/records/[typeKey]/[id].get.ts), [`buildRecordDetailPayload`](../../app/server/utils/record-detail-payload.ts), and [`record-satellite-assembly.ts`](../../app/server/utils/record-satellite-assembly.ts).
- [x] **`PATCH` `data`**: rejects keys for satellite-backed kinds ([`record-patch-guards.ts`](../../app/server/utils/record-patch-guards.ts)); dedicated **`…/field-entries`** / **`…/connections`** routes still TBD. **`assertRequiredFields`** skips satellite kinds until those routes exist ([`record-mutations.ts`](../../app/server/utils/record-mutations.ts)).

### M4 — Optional tiles / layout admin

- [x] Persist detail **sections** in **`record_types.meta.detail_layout`** (`sections: [{ id, title?, field_keys }]`; read alias **`meta.tiles`**). Implemented in [`record-type-detail-layout.ts`](../../app/server/utils/record-type-detail-layout.ts); user detail UI already renders **`detail.layout.sections`** (`RecordDetail.vue`).
- [x] **`PATCH /api/admin/record-types/:id`** with **`detail_layout`** or **`null`** to clear — [`record-types/[id].patch.ts`](../../app/server/api/admin/record-types/[id].patch.ts). Admin: **Detail layout** on **`/admin/record-schema`**.

## QA / verification

- Run app migrations against dev DB; confirm new tables exist.
- **`npm run test`** includes **`record-detail-payload.spec.ts`**, **`record-patch-guards.spec.ts`**, **`record-type-detail-layout.spec.ts`**, **`record-field-storage.spec.ts`**, **`admin-record-field-validation.spec.ts`**.
- Before production: migration + rollback spot-check on staging clone.

## Links

- [Master roadmap — Phase 2 / 5](master-roadmap.md)
- [Phase 05 playbook](../phases/phase-05-migration-and-parity.md)
