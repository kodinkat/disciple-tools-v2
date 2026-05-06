<script setup lang="ts">
import type { AppNavSection } from '~~/app/composables/useAppNavigation'

const props = defineProps<{
  sections: AppNavSection[]
  collapsed: boolean
  isActive: (to: string) => boolean
}>()
</script>

<template>
  <nav class="space-y-4">
    <div
      v-for="section in props.sections"
      :key="section.id"
      class="space-y-1"
    >
      <p
        v-if="section.label && !collapsed"
        class="px-3 text-[10px] font-semibold uppercase tracking-wider text-(--ui-text-muted)"
      >
        {{ section.label }}
      </p>
      <p
        v-else-if="section.label && collapsed"
        class="mx-auto h-px w-6 rounded-full bg-(--ui-border) my-2"
        :title="section.label"
      />
      <div class="space-y-0.5">
        <UTooltip
          v-for="item in section.items"
          :key="item.to"
          :text="item.label"
          :disabled="!collapsed"
        >
          <NuxtLink
            :to="item.to"
            class="flex items-center gap-3 rounded-md text-sm transition-colors"
            :class="[
              collapsed ? 'justify-center px-1 py-2.5' : 'px-3 py-2',
              isActive(item.to)
                ? 'bg-(--ui-bg-accented) text-(--ui-text) font-medium'
                : 'text-(--ui-text-muted) hover:bg-(--ui-bg-accented) hover:text-(--ui-text)'
            ]"
          >
            <UIcon
              :name="item.icon"
              class="size-5 shrink-0"
            />
            <span
              v-if="!collapsed"
              class="truncate"
            >{{ item.label }}</span>
          </NuxtLink>
        </UTooltip>
      </div>
    </div>
  </nav>
</template>
