import type { Permission } from '~~/app/utils/permissions'

export interface AppNavItem {
  label: string
  to: string
  icon: string
  permission?: Permission
}

export interface AppNavSection {
  id: string
  label?: string
  items: readonly AppNavItem[]
}

/**
 * Main app (non-admin) nav — permission-filtered in {@link useAppNavigation}.
 */
export const APP_NAV_SECTIONS: readonly AppNavSection[] = [
  {
    id: 'core',
    items: [
      { label: 'Dashboard', to: '/dashboard', icon: 'i-lucide-layout-dashboard' }
    ]
  },
  {
    id: 'records',
    label: 'Records',
    items: [
      {
        label: 'Contacts',
        to: '/contacts',
        icon: 'i-lucide-user-circle',
        permission: 'records.contacts.read'
      },
      {
        label: 'Groups',
        to: '/groups',
        icon: 'i-lucide-users-round',
        permission: 'records.groups.read'
      }
    ]
  }
] as const

export function useAppNavigation() {
  const { hasPermission } = usePermissions()

  const sections = computed(() =>
    APP_NAV_SECTIONS.map(section => ({
      ...section,
      items: section.items.filter(
        item => !item.permission || hasPermission(item.permission)
      )
    })).filter(section => section.items.length > 0)
  )

  return { sections }
}
