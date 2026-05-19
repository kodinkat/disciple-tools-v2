<script setup lang="ts">
definePageMeta({
  middleware: ['auth', 'contacts']
})

const route = useRoute()
const recordId = computed(() => String(route.params.id ?? ''))
</script>

<template>
  <RecordDetail
    type-key="contacts"
    :record-id="recordId"
    list-href="/contacts"
    title-noun="contacts"
  />
</template>
