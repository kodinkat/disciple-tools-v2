# Phase 02 execution checklist — domain model & record types

Companion to [Phase 2 playbook](../phases/phase-02-domain-model-and-record-types.md) and [ADR 0001](../adr/0001-record-storage-postgres.md).

Use this list to sequence work and sign off increments. Checked items denote **engineering agreement**; track actual completion in issues/PRs.

---

## A. Decisions & documentation

- [x] **ADR 0001** — Record storage (`record_types`, `record_type_fields`, `records`) — [accepted](../adr/0001-record-storage-postgres.md).
- [x] **ADR 0002** — RBAC for toolbar + admin shell — [accepted](../adr/0002-rbac-navigation-and-admin-shell.md).
- [x] **Roles matrix** — [roles-and-permissions-matrix.md](roles-and-permissions-matrix.md) (update when `PERMISSIONS` grows).
- [x] **Hook catalogue** — [phase-02-v1-hook-catalogue.md](phase-02-v1-hook-catalogue.md): v1 `dt_*` filters/actions traced from `dt-posts/dt-posts.php` + `posts.php` (delete), mapped to v2 names and **Shipped** / **Planned** status; registry extended incrementally.

---

## B. Data layer

- [x] **Kysely schema** — `record_types`, `record_type_fields`, `records` in `server/database/schema.ts`.
- [x] **Migrations** — `004_create_record_storage_tables`, `005_seed_contacts_and_groups` + `server/plugins/migrations.ts`.
- [x] **System record types**: seed **`contacts`** and **`groups`** (v1 field concepts; `005_seed_contacts_and_groups.ts`).
- [x] **indexes** — Baseline btree/uniques in `004` (`records_type_idx`, `records_updated_idx`, field uniques); GIN/deferred per ADR / Phase 03.

---

## C. Authorization

- [x] **`PERMISSIONS` + roles** — `records.{contacts|groups}.{read|write|create|delete}` + mapping in [roles-and-permissions-matrix.md](roles-and-permissions-matrix.md).
- [x] **Expand `ROLES`** or document **delegation defaults** — `member` gets record read/write/create (no delete); `admin` = all; subset delegation unchanged for admin user APIs.
- [x] **`rbac.ts` helpers** — `requirePermission` / `requireRecordVerb` (`records-rbac.ts`) on record + admin APIs.

---

## D. Nitro APIs (minimal vertical slice)

- [x] **`GET/PATCH`** single record by `id` — `/api/records/:typeKey`, `/:typeKey/:id`, `PATCH :typeKey/:id`.
- [x] **`POST`** create — `POST /api/records/:typeKey` (schema subset + hooks + required fields).
- [x] **`GET`** list by type — pagination + total; rich filters → Phase 03.
- [x] **Activity logging** — `logCreate` / `logUpdate` / `logDelete` on record mutations.

---

## E. UI shell (carry-over from Phase 01 direction)

- [x] **Admin entry for `admin.access`** — **Admin** navigates to `/admin` from the **account dropdown** (`AppToolbarUserMenu`), not a separate toolbar pill (`default.vue`).
- [x] **Main app collapsible contextual sidebar** (left): nav from `useAppNavigation` / `APP_NAV_SECTIONS`; collapse persisted in `localStorage` (`useContextualSidebar`); Dashboard + Contacts/Groups placeholders with permission-aware links; mobile slideover mirrors admin pattern (`default.vue`).
- [x] **`/admin`** continues to gate sidebar items via **granular permissions** (`admin.vue` pattern).

_layers_: Optional extract of record pages into a Nuxt Layer **after** vertical slice stabilises — not a Phase 02 gate.

---

## F. Exit criteria (Phase 02 “done” for first increment)

- [x] **End-to-end (first increment)** — Contacts and **groups**: **API + auth + nav placeholders** complete; list/detail record **UI** deferred to Phases **03–04** (see playbook).
- [x] Roles matrix reflects any **new** permissions.
- [x] Server tests baseline — [testing-strategy.md](../testing-strategy.md) + Vitest unit tests (`app/tests/unit/`).

**Manual QA before sign-off** (`npm run dev` with `DATABASE_URL` set, migrations applied):

1. **Sign in** as a user with **`member`** role: main sidebar shows **Dashboard**, **Contacts**, **Groups** (no admin link); **contacts** / **groups** redirect if read permission removed.
2. **Sign in** as **admin**: open **account menu** — **Admin** item navigates to **`/admin`**; menu remains the rightmost control.
3. **Contextual sidebar**: toggle collapse; **reload** — width preference persists (`localStorage`).
4. **Account menu** (right edge): **Admin** (if permitted) → `/admin`; **Profile** → `/profile`; **Sign out** clears session and lands on **`/login`**.
5. **Record APIs** (optional): `GET /api/record-types` (cookie auth), `POST /api/records/contacts` with `{ "data": { "name": "Smoke" } }`, then `GET` list/detail for the new id.

---

## Links

- [Master roadmap — Phase 2](master-roadmap.md)
- [v1 → v2 hook catalogue](phase-02-v1-hook-catalogue.md)
- [Extensibility — Layers + hooks](extensibility-nuxt-layers-and-hooks.md)
