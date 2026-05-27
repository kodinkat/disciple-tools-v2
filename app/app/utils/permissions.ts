// Prefer granular permissions (e.g. `pages.read`, `pages.write`, `pages.publish`)
// over coarse ones (e.g. `pages.manage`). Compose breadth via roles in
// `role-definitions.ts` — a role can grant the full granular set when needed.
//
// Why: OAuth / delegation use cases need to grant a subset of a user's authority.
// If permissions are granular from the start, OAuth scopes pass through to the
// same vocabulary (one namespace, one declaration per endpoint). If they're
// coarse, the OAuth layer needs a parallel scope→permission map and every
// protected endpoint ends up declaring two things forever. See
// `permissions-design.md` for the sizing rule and the coarse→granular migration
// playbook.
//
// Central permission registry.
//
// When porting to nuxt-blueprints, each block ships a `permissions.ts` fragment
// and blueprint assembly merges the fragments into this file. Consumer projects
// own this file and are free to edit it.
export const PERMISSIONS = [
  'admin.access',
  'users.view',
  'users.edit',
  'users.delete',
  'users.assign-roles',
  'users.verify',
  'users.invite',
  'roles.view',
  'roles.write',
  'roles.delete',
  'records.contacts.read',
  'records.contacts.write',
  'records.contacts.create',
  'records.contacts.delete',
  'records.groups.read',
  'records.groups.write',
  'records.groups.create',
  'records.groups.delete',
] as const

export type Permission = typeof PERMISSIONS[number]

// Optional: human-readable titles and descriptions shown in admin UI.
// Keys must match entries in PERMISSIONS. Missing entries fall back to the raw
// permission string.
export const PERMISSION_META: Record<string, { title: string; description: string }> = {
  'admin.access': {
    title: 'Access admin area',
    description: 'Required to reach /admin and see the admin shell.'
  },
  'users.view': {
    title: 'View users',
    description: 'See the users list.'
  },
  'users.edit': {
    title: 'Edit users',
    description: 'Edit user attributes such as display name.'
  },
  'users.delete': {
    title: 'Delete users',
    description: 'Permanently delete user accounts.'
  },
  'users.assign-roles': {
    title: 'Assign roles to users',
    description: 'Add or revoke roles on other users (subject to the subset delegation rule).'
  },
  'users.verify': {
    title: 'Verify users',
    description: 'Mark users as verified or resend verification emails.'
  },
  'users.invite': {
    title: 'Invite users',
    description: 'Send invitation emails that let new users set a password and activate an account.'
  },
  'roles.view': {
    title: 'View roles',
    description: 'See the roles reference page.'
  },
  'roles.write': {
    title: 'Create and edit roles',
    description: 'Create new custom roles and edit existing ones.'
  },
  'roles.delete': {
    title: 'Delete roles',
    description: 'Delete custom roles.'
  },
  'records.contacts.read': {
    title: 'View contacts',
    description: 'List and read contact records (v1: access_contacts-style read path).'
  },
  'records.contacts.write': {
    title: 'Update contacts',
    description: 'Edit existing contact records.'
  },
  'records.contacts.create': {
    title: 'Create contacts',
    description: 'Create new contact records (v1: create_contacts).'
  },
  'records.contacts.delete': {
    title: 'Delete contacts',
    description: 'Delete contact records (restricted in v1 to elevated roles).'
  },
  'records.groups.read': {
    title: 'View groups',
    description: 'List and read group records (v1: access_groups).'
  },
  'records.groups.write': {
    title: 'Update groups',
    description: 'Edit existing group records.'
  },
  'records.groups.create': {
    title: 'Create groups',
    description: 'Create new group records (v1: create_groups).'
  },
  'records.groups.delete': {
    title: 'Delete groups',
    description: 'Delete group records (elevated roles in v1).'
  }
}

export function isPermission(value: string): value is Permission {
  return (PERMISSIONS as readonly string[]).includes(value)
}
