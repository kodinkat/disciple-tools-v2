# Roles & permissions matrix (v2)

**Purpose**: Single reference for **which roles grant which capabilities**, how that maps to **UI** (toolbar, sidebars), and how **APIs** stay aligned. Permissions are granular strings; roles are bundles declared in application code (`ROLES`). **Servers must enforce** permissions on every Nitro endpoint; UI checks are usability only.

**Source of truth in code**:

- Permissions: [`app/app/utils/permissions.ts`](../../app/app/utils/permissions.ts) — `PERMISSIONS`, `PERMISSION_META`
- Role bundles: [`app/app/utils/role-definitions.ts`](../../app/app/utils/role-definitions.ts)
- Server enforcement helpers: [`app/server/utils/rbac.ts`](../../app/server/utils/rbac.ts), [`app/server/utils/records-rbac.ts`](../../app/server/utils/records-rbac.ts)

---

## Static roles

| Role | Description | Granted permissions |
|------|-------------|---------------------|
| **admin** | Full platform administration (users, roles shell, `/admin`, all record verbs). | **All** entries in `PERMISSIONS`. |
| **member** | Authenticated baseline: dashboard, profile; **record** read/write/create for `contacts` and **groups** (no delete, no admin area). | Listed in `ROLES.member.permissions` (see matrix below). |

Members see **no** admin navigation; admins see **Admin** in the **account dropdown** on the main layout, then inside `/admin` the **sidebar** only shows sections for permissions they retain (today an admin holds all).

---

## Permission registry → meaning

| Permission | Typical UI enabled | Typical API routes (non-exhaustive) |
|-----------|---------------------|--------------------------------------|
| `admin.access` | **Admin** entry in **account dropdown** (`AppToolbarUserMenu` on `/` layout); required to reach `/admin/*` (`admin.ts` middleware). | Indirect via pages; admin APIs gate with narrower permissions below. |
| `users.view` | Admin sidebar: **Users** list (`/admin/users`). | `GET /api/admin/users`, related read helpers. |
| `users.edit` | Edit controls on users. | `PATCH /api/admin/users/:id` |
| `users.delete` | Delete users. | `DELETE /api/admin/users/:id` |
| `users.assign-roles` | Role assignment UI. | `PUT /api/admin/users/:id/roles` |
| `users.verify` | Verify / resend verification actions. | `POST .../verify`, `send-verification` |
| `users.invite` | Invite/create user flows. | `POST /api/admin/users`, resend-invite |
| `roles.view` | Admin sidebar: **Roles** (`/admin/roles`). | Roles reference / future custom-role APIs. |
| `roles.write` | Create/edit roles (when custom roles exist). | (Future) PUT/POST roles |
| `roles.delete` | Delete custom roles (when present). | (Future) DELETE roles |
| `records.contacts.read` | List/read contacts (registry + records). | `GET /api/record-types`, `GET /api/records/contacts`, `GET /api/records/contacts/:id` |
| `records.contacts.write` | Update contacts. | `PATCH /api/records/contacts/:id` |
| `records.contacts.create` | Create contacts. | `POST /api/records/contacts` |
| `records.contacts.delete` | Delete contacts (elevated / admin today). | `DELETE /api/records/contacts/:id` |
| `records.groups.read` | List/read groups. | Same pattern with `groups` segment. |
| `records.groups.write` | Update groups. | `PATCH /api/records/groups/:id` |
| `records.groups.create` | Create groups. | `POST /api/records/groups` |
| `records.groups.delete` | Delete groups (elevated / admin today). | `DELETE /api/records/groups/:id` |

Delegation rule today: users with **`users.assign-roles`** (and similar) can only delegate permissions **they themselves hold** (subset rule in API handlers).

Unknown record `typeKey` (not in [`record-type-slugs`](../../app/server/utils/record-type-slugs.ts)): APIs respond **404** without leaking existence.

---

## Matrix: permission × role

| Permission | admin | member |
|------------|:-----:|:------:|
| `admin.access` | ✅ | ❌ |
| `users.view` | ✅ | ❌ |
| `users.edit` | ✅ | ❌ |
| `users.delete` | ✅ | ❌ |
| `users.assign-roles` | ✅ | ❌ |
| `users.verify` | ✅ | ❌ |
| `users.invite` | ✅ | ❌ |
| `roles.view` | ✅ | ❌ |
| `roles.write` | ✅ | ❌ |
| `roles.delete` | ✅ | ❌ |
| `records.contacts.read` | ✅ | ✅ |
| `records.contacts.write` | ✅ | ✅ |
| `records.contacts.create` | ✅ | ✅ |
| `records.contacts.delete` | ✅ | ❌ |
| `records.groups.read` | ✅ | ✅ |
| `records.groups.write` | ✅ | ✅ |
| `records.groups.create` | ✅ | ✅ |
| `records.groups.delete` | ✅ | ❌ |

---

## Surfaces governed by RBAC

1. **Main app contextual sidebar** (`default.vue`, signed-in only): **Dashboard** plus **Records** links (`/contacts`, `/groups`) filtered by `records.*.read` via `useAppNavigation` / `APP_NAV_SECTIONS` in `useAppNavigation.ts`. Not shown to guests.
2. **Main app header** (`default.vue`): **`header-right` slot** defaults to theme toggle; **account menu** (`AppToolbarUserMenu`, rightmost) shows **Admin** → `/admin` when `admin.access`, then **Profile**, **Sign out**; email label row when display name differs from email.
3. **Admin layout** (`admin.vue`): route middleware **`admin`** requires `admin.access`; **sidebar links** gated per row (e.g. `users.view`, `roles.view`).
4. **Nitro APIs**: **`requirePermission`**, **`requireRecordVerb`** — never rely on obscurity.

---

## Future conventions

- **Additional record types**: Add `records.{typeKey}.{read|write|create|delete}` to `PERMISSIONS`, `PERMISSION_META`, `record-type-slugs.ts`, and extend this matrix / `ROLES`.
- **Custom roles in DB** (stubbed in RBAC comments): extend this matrix when that blueprint lands.

Maintain this document when **`PERMISSIONS`** or **`ROLES`** change.

---

## See also

- [Testing strategy](../testing-strategy.md)
- [Phase 02 execution checklist](phase-02-execution-checklist.md)
- [ADR 0002 — RBAC alignment for navigation & admin](../adr/0002-rbac-navigation-and-admin-shell.md)
- [Extensibility (Layers + hooks)](extensibility-nuxt-layers-and-hooks.md)
