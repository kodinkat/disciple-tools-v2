<script setup lang="ts">
const config = useRuntimeConfig()
const { isLoggedIn, authReady } = useAuth()

watch(
  () => [authReady.value, isLoggedIn.value] as const,
  async ([ready, logged]) => {
    if (ready && logged) {
      await navigateTo('/dashboard')
    }
  },
  { immediate: true }
)
</script>

<template>
  <div
    v-if="!authReady"
    class="flex justify-center items-center min-h-[40vh]"
  >
    <div
      class="size-8 animate-spin rounded-full border-2 border-(--ui-border) border-t-(--ui-text-muted)"
      aria-hidden="true"
    />
  </div>
  <div
    v-else-if="!isLoggedIn"
    class="space-y-10 text-center py-16 px-4"
  >
    <h1 class="text-4xl font-bold text-(--ui-text)">
      {{ config.public.appName }}
    </h1>
    <p class="text-(--ui-text-muted) max-w-lg mx-auto">
      Sign in or create an account to continue.
    </p>
    <div class="flex flex-wrap justify-center gap-3">
      <NuxtLink
        to="/login"
        class="inline-flex items-center justify-center rounded-md bg-(--ui-primary) px-4 py-2.5 text-sm font-medium text-(--ui-primary-foreground) hover:opacity-90 min-h-11"
      >
        Log in
      </NuxtLink>
      <NuxtLink
        to="/register"
        class="inline-flex items-center justify-center rounded-md border border-(--ui-border) bg-(--ui-bg) px-4 py-2.5 text-sm font-medium text-(--ui-text) hover:bg-(--ui-bg-elevated) min-h-11"
      >
        Register
      </NuxtLink>
    </div>
  </div>
</template>
