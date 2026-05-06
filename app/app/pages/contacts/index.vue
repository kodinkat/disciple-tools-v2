<script setup lang="ts">
definePageMeta({
  middleware: ['auth', 'contacts']
})
</script>

<template>
  <div class="space-y-3">
    <h1 class="text-3xl font-bold">
      Contacts
    </h1>
    <p class="text-(--ui-text-muted) max-w-2xl">
      Record hubs will list contact records once listing UI lands (Phase&nbsp;03). Creation and editing are already available via
      <code class="text-xs bg-(--ui-bg-muted) px-1.5 py-0.5 rounded">POST</code>
      /
      <code class="text-xs bg-(--ui-bg-muted) px-1.5 py-0.5 rounded">PATCH</code>
      APIs.
    </p>
  </div>
</template>
