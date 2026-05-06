<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

const { user, logout } = useAuth()
const { hasPermission } = usePermissions()

const triggerLabel = computed(
  () => user.value?.display_name || user.value?.email || 'Account'
)

/** Menu rows for {@link UDropdownMenu}. Last section is destructive (sign out). */
const menuItems = computed((): DropdownMenuItem[][] => {
  const u = user.value
  if (!u) return []

  const mainActions: DropdownMenuItem[] = []

  if (hasPermission('admin.access')) {
    mainActions.push({
      label: 'Admin',
      icon: 'i-lucide-shield',
      to: '/admin'
    })
  }

  mainActions.push({
    label: 'Profile',
    icon: 'i-lucide-circle-user',
    to: '/profile'
  })

  const signOutRow: DropdownMenuItem[] = [
    {
      label: 'Sign out',
      icon: 'i-lucide-log-out',
      color: 'error',
      async onSelect() {
        await logout()
      }
    }
  ]

  const email = typeof u.email === 'string' ? u.email : ''
  const name = typeof u.display_name === 'string' ? u.display_name : ''

  if (email && name) {
    return [
      [{ type: 'label', label: email }],
      [{ type: 'separator' }],
      mainActions,
      signOutRow
    ]
  }

  return [mainActions, signOutRow]
})
</script>

<template>
  <UDropdownMenu
    v-if="user"
    :items="menuItems"
    :content="{ align: 'end', side: 'bottom' }"
    :ui="{ content: 'min-w-52 z-[60]' }"
  >
    <UButton
      color="neutral"
      variant="ghost"
      class="max-w-[min(14rem,calc(100vw-12rem))]"
      trailing-icon="i-lucide-chevrons-up-down"
      :aria-label="`Account menu for ${triggerLabel}`"
    >
      <span class="truncate">{{ triggerLabel }}</span>
    </UButton>
  </UDropdownMenu>
</template>
