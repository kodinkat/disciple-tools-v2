# Phase 02 — v1 → v2 hook catalogue

**Purpose**: Trace WordPress **filters** (`apply_filters`) and **actions** (`do_action`) on v1 record lifecycles, and map them to **v2 Nitro hook names** (implemented in [`app/server/utils/record-hooks.ts`](../../app/server/utils/record-hooks.ts) or planned). Companion to [Phase 02 execution checklist](phase-02-execution-checklist.md) item **A — Hook catalogue**.

**v1 primary sources**

- [`dt-posts/dt-posts.php`](https://github.com/DiscipleTools/disciple-tools-theme/blob/master/dt-posts/dt-posts.php) — `DT_Posts::create_post`, `update_post`, `get_post`, `list_posts`, settings.
- [`dt-posts/posts.php`](https://github.com/DiscipleTools/disciple-tools-theme/blob/master/dt-posts/posts.php) — search, delete, comments, activity helpers.
- Contacts / groups modules add field definitions via `dt_custom_fields_settings` (schema path), not always new DT_Posts choke points.

**Legend**

| Status | Meaning |
|--------|---------|
| **Shipped** | Registry + call site in v2 Nitro handlers / utils |
| **Planned** | Named for parity; register and wire in a later increment |
| **Different model** | v2 handles concern elsewhere (e.g. static RBAC vs `dt_filter_access_permissions`) |
| **Phase 03+** | List/search/query filters — owned by listing phase |

---

## Create path

| v1 hook | Type | v1 location (indicative) | v2 API | Status |
|---------|------|-------------------------|--------|--------|
| `dt_create_post_check_proceed` | filter | `dt-posts.php` | `runRecordCreateCheckProceed` (bool + context) | Planned |
| `dt_create_post_args` | filter | `dt-posts.php` | merge into internal create options | Planned |
| `dt_create_check_for_duplicate_posts` | filter | `dt-posts.php` | `runRecordDuplicateCheck` | Planned |
| `dt_post_create_fields` | filter | `dt-posts.php` | `runPostCreateFields` | **Shipped** |
| `dt_post_create_allow_fields` | filter | `dt-posts.php` | field allowlist after schema load | Planned |
| `dt_post_created` | action | `dt-posts.php` | `runPostCreated` | **Shipped** |

**v2 create payload (action)** — `RecordHookPayloadCreated`: `{ typeKey, recordId, data }` (see `record-hooks.ts`). v1 passes `($post_type, $post_id, $initial_fields, $args)`; extensions can map from `data` + route context.

---

## Update path

| v1 hook | Type | v1 location | v2 API | Status |
|---------|------|-------------|--------|--------|
| `dt_update_post_check_proceed` | filter | `dt-posts.php` | `runRecordUpdateCheckProceed` | Planned |
| `dt_post_update_fields` | filter | `dt-posts.php` | `runPostUpdateFields` | **Shipped** |
| `dt_post_update_allow_fields` | filter | `dt-posts.php` | update-time allowlist | Planned |
| `dt_post_updated_custom_handled_meta` | filter | `dt-posts.php` | reserved for typed field handlers (JSONB vs meta) | Phase 03+ / domain |
| `dt_post_updated` | action | `dt-posts.php` | `runPostUpdated` | **Shipped** |

**v2 update payload (action)** — `RecordHookPayloadUpdated`: `{ typeKey, recordId, data, previousData }`. v1: `($post_type, $post_id, $initial_fields, $existing_post, $post)`.

---

## Delete path

| v1 hook | Type | v1 location | v2 API | Status |
|---------|------|-------------|--------|--------|
| `dt_before_post_deleted` | action | `posts.php` `delete_post` | `runBeforeRecordDeleted` | Planned |
| `dt_purge_post_storage_objects` | action | `posts.php` | storage cleanup (S3, etc.) | Planned / integration |
| `dt_post_deleted` | action | `posts.php` | `runPostDeleted` | Planned |

v2 `DELETE /api/records/:typeKey/:id` currently logs via `logDelete` only; **before/after delete hooks** should load `data` (or summary) **before** delete when those registries ship.

---

## Read / detail (single record)

| v1 hook | Type | v1 location | v2 API | Status |
|---------|------|-------------|--------|--------|
| `dt_after_get_post_fields_filter` | filter | `dt-posts.php` | `runAfterGetRecordFields` | Planned (GET `/:id`) |
| `dt_adjust_post_custom_fields` | filter | `posts.php` | merge with details pipeline | Planned |

---

## List / compact search (viewable)

| v1 hook | Type | v1 location | v2 API | Status |
|---------|------|-------------|--------|--------|
| `dt_list_posts_custom_fields` | filter | `dt-posts.php` | `runListRecordsCustomFields` | Phase 03 |
| `dt_search_viewable_posts_query` | filter | `dt-posts.php`, `posts.php` | listing query builder hook | Phase 03 |
| `dt_get_viewable_compact_search_query` | filter | `dt-posts.php` | compact search | Phase 03 |
| `dt_get_viewable_compact` | filter | `dt-posts.php` | compact search result shape | Phase 03 |
| `dt_search_extra_post_meta_fields` | filter | `posts.php` | search index fields | Phase 03 |

---

## Permissions & access (v1 filters)

| v1 hook | Notes | v2 |
|---------|-------|-----|
| `dt_filter_access_permissions` | Shapes `$permissions` array per post type | **Different model**: `records.{typeKey}.{verb}` + `requireRecordVerb` (`records-rbac.ts`); row-level ACL is future ADR |
| `dt_can_view_permission` | `posts.php` | map to read permission + future row checks |
| `dt_can_update_permission` | `posts.php` | map to write |
| `dt_can_delete_permission` | `posts.php` | map to delete |

Document permission mapping in [roles-and-permissions-matrix.md](roles-and-permissions-matrix.md).

---

## Schema / UI configuration (parity reference)

These drive v1 REST and UI; v2 stores field schema in **`record_types` / `record_type_fields`** and serves `GET /api/record-types` instead of assembling via PHP filters at runtime:

| v1 hook | Purpose |
|---------|---------|
| `dt_registered_post_types` | type registry |
| `dt_get_post_type_settings` | type config + tiles |
| `dt_custom_fields_settings` | field definitions |
| `dt_custom_fields_settings_after_combine` | merged schema |
| `dt_details_additional_tiles` | UI tiles |
| `dt_details_additional_section_ids` | UI sections |
| `dt_custom_tiles_after_combine` | tiles merge |

Runtime “schema plugins” for v2: **planned** via Layers + optional filters on **`runRecordTypeSettings`** when an ADR introduces it.

---

## Comments, activity, misc.

| v1 hook | Purpose | v2 |
|---------|---------|-----|
| `dt_comment_created` | action | Planned when comments API exists |
| `dt_filter_post_comments` | filter | Planned |
| `dt_format_activity_message` | filter | Phase 04+ activity stream |
| `dt_format_post_activity` | filter | Phase 04+ |

---

## Implementation notes

1. **Filters vs actions**: v2 mirrors v1 loosely — **field transforms** are async filter chains returning merged objects; **actions** fire after persistence (`runPostCreated`, `runPostUpdated`).
2. **Incremental delivery**: parity is **path-by-path**; this table is the backlog order reference.
3. **Tests**: cover pure hooks with Vitest (`runPostCreateFields` / `runPostUpdateFields` with empty listeners); listener registration tests need isolation — see [testing-strategy.md](../testing-strategy.md).

---

## See also

- [Extensibility — layers + hooks](extensibility-nuxt-layers-and-hooks.md)
- [ADR 0001 — record storage Postgres](../adr/0001-record-storage-postgres.md)
