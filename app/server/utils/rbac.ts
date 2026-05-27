import type { H3Event } from 'h3'
import { db } from './database'
import { requireAuth } from './auth'
import { getStaticRole, ROLES, STATIC_ROLE_NAMES } from '~~/app/utils/role-definitions'
import type { Permission } from '~~/app/utils/permissions'

export async function getUserRoles(userId: string): Promise<string[]> {
  const row = await db
    .selectFrom('users')
    .select('roles')
    .where('id', '=', userId)
    .executeTakeFirst()

  return row?.roles ?? []
}

// Resolves a list of role names to the union of permissions they grant.
// Baseline: static definitions only. The optional `custom-roles` block ships
// a replacement of this file that also falls back to the `custom_roles` table
// for names that aren't statically defined.
export async function getRolePermissions(roleNames: readonly string[]): Promise<Set<Permission>> {
  const set = new Set<Permission>()
  for (const roleName of roleNames) {
    const staticRole = getStaticRole(roleName)
    if (!staticRole) continue
    for (const perm of staticRole.permissions) set.add(perm)
  }
  return set
}

export async function getUserPermissions(userId: string): Promise<Set<Permission>> {
  const roles = await getUserRoles(userId)
  return getRolePermissions(roles)
}

export async function userHasRole(userId: string, roleName: string): Promise<boolean> {
  const roles = await getUserRoles(userId)
  return roles.includes(roleName)
}

export async function userHasPermission(userId: string, permission: Permission): Promise<boolean> {
  const perms = await getUserPermissions(userId)
  return perms.has(permission)
}

export async function requireRole(event: H3Event, roleName: string) {
  const authUser = requireAuth(event)
  const ok = await userHasRole(authUser.userId, roleName)
  if (!ok) {
    throw createError({ statusCode: 403, statusMessage: `Role required: ${roleName}` })
  }
  return authUser
}

export async function requirePermission(event: H3Event, permission: Permission) {
  const authUser = requireAuth(event)
  const ok = await userHasPermission(authUser.userId, permission)
  if (!ok) {
    throw createError({ statusCode: 403, statusMessage: `Permission required: ${permission}` })
  }
  return authUser
}

// Validates that every entry in `roles` is a known role name.
// v1: only static roles are known. The optional custom-roles block extends
// this to also consult the `custom_roles` table.
export async function validateRoleNames(roles: string[]): Promise<{ valid: boolean; unknown: string[] }> {
  const known = new Set<string>(STATIC_ROLE_NAMES)
  const unknown = roles.filter(r => !known.has(r))
  return { valid: unknown.length === 0, unknown }
}

export { ROLES, STATIC_ROLE_NAMES }
