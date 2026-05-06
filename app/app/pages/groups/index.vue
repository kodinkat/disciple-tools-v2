<script setup lang="ts">
definePageMeta({
  middleware: ['auth', 'groups']
})
</script>

<template>
  <div class="space-y-3">
    <h1 class="text-3xl font-bold">
      Groups
    </h1>
    <p class="text-(--ui-text-muted) max-w-2xl">
      Group listing and filters will mirror v1 workflows in a later milestone. Backend routes are available under
      <code class="text-xs bg-(--ui-bg-muted) px-1.5 py-0.5 rounded">/api/records/groups</code>.
    </p>
  </div>
</template>
