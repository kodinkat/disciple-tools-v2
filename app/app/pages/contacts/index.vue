<script setup lang="ts">
definePageMeta({
  middleware: ['auth', 'contacts']
})
</script>

<template>
  <RecordTypeHub
    type-key="contacts"
    title="Contacts"
  />
</template>
