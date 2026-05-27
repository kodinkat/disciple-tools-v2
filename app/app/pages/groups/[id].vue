<script setup lang="ts">
definePageMeta({
  middleware: ['auth', 'groups']
})

const route = useRoute()
const recordId = computed(() => String(route.params.id ?? ''))
</script>

<template>
  <RecordDetail
    type-key="groups"
    :record-id="recordId"
    list-href="/groups"
    title-noun="groups"
  />
</template>
