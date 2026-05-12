# Phase 5 — Migration and v1 parity hardening

> **Status**: Stub — expand during execution  
> **Parent plan**: [Master roadmap](../plans/master-roadmap.md)

## Objectives

- Import / ETL from WordPress where required; ID mapping and reconciliation.
- Contract tests: sample v1 `dt-posts/v2` payloads vs v2 responses.
- Decide v1 **field-key compatibility** (identical vs breaking) before migration coding.
- **Extension compatibility**: document how WP-style filters map to v2 hooks (if third-party parity matters).

## Deliverables

- [ ] Migration runbooks.
- [ ] Parity checklist (link from Phase 0 matrix); keep [Parity appendix](#parity-appendix) updated as v2 endpoints and hook names land.
- [ ] Contract test matrix derived from the REST table below.
- [ ] **Completion report** — `docs/reports/YYMMDDHHMM-phase-05-completion-summary.md` (same naming pattern as [Phase 03](../reports/2605121430-phase-03-completion-summary.md)).

## Dependencies

- Phases 2–4 stable for core flows.

---

## Parity appendix

Working reference for **v1 Disciple.Tools (WordPress theme)** ↔ **Disciple Tools v2** — routes, filters, and actions. **v2 names are planned conventions** until implemented; adjust when ADRs and code exist. Deeper strategy: [Extensibility: Nuxt Layers and hooks](../plans/extensibility-nuxt-layers-and-hooks.md).

**How to read “v2 target”**

- **Filter** → ordered handler that receives and returns a payload (WordPress `apply_filters` mental model).
- **Action** → event emission, return value ignored (WordPress `do_action` mental model).
- Namespacing uses `records:*` for the record/post domain; final catalog TBD in server hook ADR.

### A. REST surface (dt-posts API mental model)

v1 base: `dt-posts/v2/{post_type}/…` (authenticated). Placeholder v2 paths assume a single prefix such as `api/` or Nitro route naming — replace with actual routes when scaffolded.

| v1 capability (REST / PHP entry) | Typical v1 pattern | Planned v2 surface | Parity notes |
|----------------------------------|-------------------|--------------------|--------------|
| List post types | `DT_Posts::get_post_types()` | `GET …/record-types` (or `/post-types`) | Enum of slugs + labels |
| Post type settings (fields, tiles) | `GET` settings payload / `get_post_settings` | `GET …/record-types/{type}/settings` | Tiles, sections, field defs |
| Create record | `POST dt-posts/v2/{post_type}/` | `POST …/records/{type}` | Body = field map |
| Get record | `GET …/{post_type}/{id}` | `GET …/records/{type}/{id}` | Includes flattened fields |
| Update record | `PATCH` / `POST` update | `PATCH …/records/{type}/{id}` | Partial updates |
| List records | `GET` list + query | `GET …/records/{type}` + `GET …/records` (cross-type) | Filters, sort, pagination |
| Comments (if parity needed) | various `dt-posts` comment routes | TBD Nitro routes | Align with Phase 4 scope |

Contract tests should snapshot **request/response bodies** for at least: create, get, update, list (per type).

### B. Selected v1 **filters** (`apply_filters`) → planned v2 **filters**

Source references: `dt-posts/dt-posts.php`, `dt-posts/custom-post-type.php`. Only the highest-impact hooks are listed; grep the theme for `apply_filters( 'dt_` during migration for a full inventory.

| v1 filter name | Role | Planned v2 filter (convention) | Status |
|----------------|------|--------------------------------|--------|
| `dt_registered_post_types` | Register post types | `records:registeredTypes` | TBD |
| `dt_register_post_type_defaults` | Defaults per type | `records:postTypeDefaults` | TBD |
| `dt_get_post_type_settings` | Mutate settings object | `records:postTypeSettings` | TBD |
| `dt_custom_fields_settings` | Field definitions | `records:fieldSchema` | TBD |
| `dt_custom_fields_settings_after_combine` | After merge | `records:fieldSchema:combined` | TBD |
| `dt_details_additional_tiles` | Extra tiles | `records:detail:tiles` | TBD |
| `dt_details_additional_section_ids` | Section IDs | `records:detail:sectionIds` | TBD |
| `dt_custom_tiles_after_combine` | Tiles after merge | `records:detail:tiles:combined` | TBD |
| `dt_post_create_fields` / `dt_post_update_fields` | Incoming fields | `records:fields:create` / `records:fields:update` | TBD |
| `dt_after_get_post_fields_filter` | Outgoing fields on read | `records:fields:afterRead` | TBD |
| `dt_list_posts_custom_fields` | List row shape | `records:list:row` | TBD |
| `dt_search_viewable_posts_query` | DB/query for search | `records:list:query` | TBD |
| `dt_filter_access_permissions` | Capability checks | `records:permissions:filter` | TBD |
| `dt_can_*_permission` (view/update/delete) | Fine-grained permission | `records:permissions:canView` (etc.) | TBD |

If v1 **field keys** remain identical in JSON, note that explicitly in an ADR; if not, map via migration transforms.

### C. Selected v1 **actions** (`do_action`) → planned v2 **events**

| v1 action | Role | Planned v2 event (convention) | Status |
|-----------|------|---------------------------------|--------|
| `dt_post_created` | After create | `records:post:created` | TBD |
| `dt_post_updated` | After update | `records:post:updated` | TBD |
| `dt_before_post_deleted` | Before delete | `records:post:beforeDelete` | TBD |
| `dt_post_deleted` | After delete | `records:post:deleted` | TBD |
| `dt_comment_created` | Comment added | `records:comment:created` | TBD |
| `post_connection_added` / `post_connection_removed` | Connection field changes | `records:connection:added` / `records:connection:removed` | TBD |

### D. Maintenance

- When the v2 hook registry is implemented, **replace “planned v2” strings** with exported constants or OpenAPI tags and link to source.
- For third-party plugins that rely on rare `dt_*` hooks, add rows here as migration tickets warrant.

---

## References

- v1: `docs/dt-posts-api-reference.md` (disciple-tools-theme)
- v1 list queries: `docs/dt-posts-list-query.md`
- v1 field settings: `docs/dt-posts-field-settings.md`
