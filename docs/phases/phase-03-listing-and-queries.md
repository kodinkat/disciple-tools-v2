# Phase 3 — Listing and queries

> **Status**: **Implemented** — run [manual QA §](#qa-phase-03) before tagging a milestone that claims Phase&nbsp;03 done.  
> **Execution tracker**: [phase-03-execution-checklist](../plans/phase-03-execution-checklist.md)  
> **Parent plan**: [Master roadmap](../plans/master-roadmap.md)  
> **List query contract**: [phase-03-list-query-contract.md](../plans/phase-03-list-query-contract.md)

## Objectives

- Per-type list API (mental model: `DT_Posts::list_posts(post_type, query)`).
- Cross-type / unified listing surface; filter JSON contract stable for clients.
- Optional search index (ADR) if Postgres-only listing is insufficient.
- **Hook points** (optional): pre/post list query, filter normalization — [Extensibility](../plans/extensibility-nuxt-layers-and-hooks.md).

## Deliverables

- [x] List endpoint extensions + pagination/sort/filter docs ([contract](../plans/phase-03-list-query-contract.md)).
- [x] Mermaid sequence or flow diagrams for list request → policy → query → response (below).
- [x] Contacts / Groups hubs: manual QA playbook ([§ QA](#qa-phase-03)).
- [x] Phase completion summary in `docs/reports/` — [2605121430-phase-03-completion-summary.md](../reports/2605121430-phase-03-completion-summary.md).

## List request flow (implemented path)

```mermaid
sequenceDiagram
  participant C as Client
  participant H as API handler
  participant RBAC as requireRecordVerb
  participant T as Type + field schema
  participant P as record-list-query
  participant DB as PostgreSQL

  C->>H: GET /api/records/:typeKey?limit&offset&sort&q&filters
  H->>RBAC: records.<typeKey>.read
  alt missing permission
    RBAC-->>C: 403
  end
  RBAC-->>H: ok
  H->>T: getRecordTypeByKey, loadFieldsForType
  alt unknown type
    T-->>C: 404
  end
  H->>P: parse query / sort / coerce filters
  Note over H,P: Optional registerRecordBeforeList handlers may adjust list params — handler sanitizes paging and qSearch, parses sort again, coerces equality filters against schema again
  alt invalid params
    P-->>C: 400
  end
  H->>DB: SELECT rows (predicates + sort + page)
  H->>DB: COUNT (*) same predicates
  DB-->>H: rows + total
  H->>H: map rows → JSON (+ ISO timestamps); optional runAfterList
  H-->>C: JSON records + pagination
```

_Handler steps (reads top-to-bottom in `server/api/records/[typeKey].get.ts`):_ flatten query string → **`requireRecordVerb`** → load type + **`record_type_fields`** → **`parseRecordListQuery`**, first-pass **`coerceRecordEqualityFilters`** → **`runBeforeList`** (optional hooks) → **`sanitizeListingBounds`**, **`parseRecordSort`**, **`coerceRecordEqualityFilters`** again (merged equality filters) → shared predicate builder for **`SELECT`** and **`COUNT`** → **`applyRecordSort`**, **`limit`/`offset`** → map DB rows (timestamps → ISO strings) → **`runAfterList`** → respond with **`records`** and **`pagination`**.

## QA (Phase 03)

Execute in **local dev** (`nuxt dev` + app database migrated and seeded enough to exercise listing). **Firefox** establishes baseline behaviour; repeat the same flows in **Safari** (macOS/iOS). Note quirks (focus rings, scrollbar, `:hover` gaps) alongside pass/fail.

### Preconditions

1. Signed-in user with **`records.contacts.read`**, **`records.groups.read`**, and (to test Create) **`records.contacts.create`** / **`records.groups.create`** as needed.
2. For **pagination**: at least **26** contacts or groups (hub page size **25**) *or* temporarily lower **`PAGE_SIZE`** in `RecordTypeHub.vue` in a throwaway branch to force multiple pages.

### Pagination

1. Open **`/contacts`** (and separately **`/groups`**).
2. Confirm **total** count text matches **`pagination.total`** from **`GET /api/records/:typeKey`** (Network tab optional).
3. Use **`UPagination`** to move to page 2; rows and count should remain consistent (no duplication across pages unless data changed).
4. Return to page 1; list should match first page query (`sort=-updated_at`).

### Empty state

1. Enter a **search** string that matches no names (for example **`zzzz-nonexistent-queue`**).
2. Table should show the **empty state** (icon + “No contacts/groups found”), **not** a hard error alert.
3. Clear search; records should reload.

### Forbidden (missing `read`)

**UI:** assign a role (or temporary user) that **does not** include **`records.contacts.read`** (and similarly for **`records.groups.read`** when testing groups). Open **`/contacts`** — app should **redirect** away (middleware sends you to **`/dashboard`**, not an empty table pretending success).

**API (optional cross-check):** `GET /api/records/contacts` with session cookie JWT for that user should return **403**.

### Search and create smoke

1. **Search:** filter list with a substring that matches a known name.
2. **Row → detail:** click a row; confirm **`/contacts/:id`** or **`/groups/:id`** loads **read-only** detail.
3. **Create:** use **New contact / group**; submit with name only (optional nickname on contacts); confirm toast, navigation to detail, **`overall_status`** / **`group_type`** defaulted on read-only detail, and hub **refresh** reflects the new row when returning to list.

### Safari vs Firefox baseline

Repeat **pagination**, **empty state**, **row navigation**, **create modal** (submit + cancel + dismiss), and **back** link on detail. Record any Safari-only issues (e.g. modal scroll, table row hit target, `datetime` display) in the release or follow-up issue.

## Explicitly deferred this phase

- **Cross-type unified list** — one endpoint spanning multiple `type_key` values with a stable row shape (not shipped in Phase 03).
- **Cursor pagination** — offset/limit only; cursor/`after` tokens are future work if needed at scale.
- **Dedicated search index ADR** — Postgres `ILIKE` on `data->>'name'` is acceptable for Phase 03; revisit if workloads outgrow it.

See also: [phase-03-execution-checklist.md](../plans/phase-03-execution-checklist.md) section A.

## Dependencies

- Phase 2 domain model + authz.

## References

- v1: `docs/dt-posts-list-query.md` (disciple-tools-theme)
- Phase close-out: [Phase 03 completion summary](../reports/2605121430-phase-03-completion-summary.md)
