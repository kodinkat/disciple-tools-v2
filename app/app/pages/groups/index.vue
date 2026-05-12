<script setup lang="ts">
definePageMeta({
  middleware: ['auth', 'groups']
})
</script>

<template>
  <RecordTypeHub
    type-key="groups"
    title="Groups"
  />
</template>
