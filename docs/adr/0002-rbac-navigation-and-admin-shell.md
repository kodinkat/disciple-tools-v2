# ADR 0002 — RBAC alignment for navigation & admin shell

## Status

Accepted

## Context

Product requirements:

- **Toolbar link** into the administration area visible only when the signed-in principal may access admin.
- **Within `/admin`**, navigation and actionable UI reflect **granular** authority (not an all-or-nothing “is admin” boolean for every control).
- APIs must stay **authoritative**; clients must not be the only enforcement layer.

Today the blueprint ships **static roles** (`admin`, `member`) and a **flat permission string** registry (`admin.access`, `users.*`, `roles.*`).

## Decision

1. **Single permission vocabulary** drives **HTTP APIs**, **route middleware**, and **nav visibility** — no parallel “menu role” system.
2. **Route entry** to `/admin` requires **`admin.access`** (client: `admin` middleware; server: any admin-scoped route handler must still check specific permissions for mutations).
3. **Progressive disclosure** inside the admin shell:
   - Toolbar: show **Admin** link iff `hasPermission('admin.access')`.
   - Admin sidebar (and future global sidebar): each item requires the **same permission** the backing API uses for that feature (e.g. `users.view` for Users list).
4. **Future record permissions** (Phase 02+) follow the same rule: nav & actions require explicit strings (e.g. `records.contacts.read`) documented in the [roles matrix](../plans/roles-and-permissions-matrix.md) when introduced.
5. **Do not** infer permissions from **role name alone** in new code — use `user.permissions` from `/api/auth/me` (role expansion happens server-side). `hasRole('admin')` remains a convenience diagnostic only where appropriate.

## Consequences

- **Positive**: Fewer divergence bugs between “can see UI” vs “API 403”; OAuth/delegation story stays tied to granular permissions.
- **Negative**: Adding a surface requires updating **permissions.ts**, RBAC helpers, roles matrix doc, and **both** UI + API checks briefly listed in PR checklist.
- **Follow-up**: Phase 02 introduces record-type permissions generator or JSON matrix — extend `PERMISSIONS`/`PERMISSION_META` together.

## Links

- [Roles & permissions matrix](../plans/roles-and-permissions-matrix.md)
- [`app/app/middleware/admin.ts`](../../app/app/middleware/admin.ts)
- [`app/server/utils/rbac.ts`](../../app/server/utils/rbac.ts)
