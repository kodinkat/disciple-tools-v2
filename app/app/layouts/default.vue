<script setup lang="ts">
const config = useRuntimeConfig()
const route = useRoute()

const { user } = useAuth()
const { sections } = useAppNavigation()
const { collapsed, toggleCollapsed } = useContextualSidebar()
const mobileOpen = ref(false)

watch(() => route.fullPath, () => {
  mobileOpen.value = false
})

function navIsActive(to: string) {
  if (to === '/dashboard')
    return route.path === '/dashboard'
  return route.path === to || route.path.startsWith(`${to}/`)
}
</script>

<template>
  <div class="min-h-screen bg-(--ui-bg) text-(--ui-text) flex flex-col">
    <header
      class="bg-(--ui-bg-elevated) border-b border-(--ui-border) py-4 shrink-0 z-50 lg:sticky lg:top-0"
    >
      <div
        class="flex justify-between items-center gap-4 px-4 xl:px-6"
        :class="user ? '' : 'max-w-7xl mx-auto w-full'"
      >
        <div class="flex items-center gap-3 min-w-0">
          <UButton
            v-if="user"
            class="lg:hidden"
            icon="i-lucide-menu"
            variant="ghost"
            color="neutral"
            aria-label="Open menu"
            @click="mobileOpen = true"
          />
          <slot name="header-left">
            <NuxtLink
              to="/"
              class="text-xl font-semibold hover:text-(--ui-text-muted) transition-colors truncate"
            >
              {{ config.public.appName }}
            </NuxtLink>
          </slot>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <slot name="header-right">
            <ThemeToggle />
          </slot>
          <AppToolbarUserMenu />
        </div>
      </div>
    </header>

    <template v-if="!user">
      <main class="max-w-7xl mx-auto px-4 py-8 w-full flex-1">
        <slot />
      </main>
    </template>

    <template v-else>
      <div class="flex flex-1 min-h-0 w-full overflow-hidden">
        <aside
          class="hidden lg:flex lg:flex-col shrink-0 border-r border-(--ui-border) bg-(--ui-bg-elevated) transition-[width] duration-200 ease-out overflow-hidden"
          :class="collapsed ? 'w-14' : 'w-56'"
        >
          <div class="flex flex-col flex-1 min-h-0 pt-5 pb-3">
            <div class="flex-1 overflow-y-auto px-2 min-h-0">
              <MainNavSections
                :sections="sections"
                :collapsed="collapsed"
                :is-active="navIsActive"
              />
            </div>
            <div class="border-t border-(--ui-border) px-2 pt-2 shrink-0">
              <UTooltip
                :text="collapsed ? 'Expand sidebar' : 'Collapse sidebar'"
                side="right"
              >
                <UButton
                  variant="ghost"
                  color="neutral"
                  block
                  :icon="collapsed ? 'i-lucide-panel-right-open' : 'i-lucide-panel-left-close'"
                  :class="collapsed ? 'justify-center' : ''"
                  :aria-label="collapsed ? 'Expand sidebar' : 'Collapse sidebar'"
                  @click="toggleCollapsed"
                />
              </UTooltip>
            </div>
          </div>
        </aside>

        <USlideover
          v-model:open="mobileOpen"
          side="left"
          :ui="{ content: 'max-w-xs' }"
        >
          <template #content>
            <div class="flex flex-col h-full bg-(--ui-bg-elevated)">
              <div class="px-6 py-5 border-b border-(--ui-border) flex items-center justify-between">
                <span class="text-lg font-semibold">Menu</span>
                <UButton
                  icon="i-lucide-x"
                  variant="ghost"
                  color="neutral"
                  aria-label="Close menu"
                  @click="mobileOpen = false"
                />
              </div>
              <div class="flex-1 overflow-y-auto px-3 py-4">
                <MainNavSections
                  :sections="sections"
                  :collapsed="false"
                  :is-active="navIsActive"
                />
              </div>
            </div>
          </template>
        </USlideover>

        <main class="flex-1 min-w-0 overflow-auto px-4 py-8 xl:px-8 bg-(--ui-bg)">
          <div class="max-w-7xl xl:max-w-none">
            <slot />
          </div>
        </main>
      </div>
    </template>
  </div>
</template>
