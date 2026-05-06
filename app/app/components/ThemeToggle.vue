<script setup lang="ts">
const { theme, toggleTheme } = useTheme()
</script>

<template>
  <button
    type="button"
    class="inline-flex items-center justify-center rounded-md p-2 text-(--ui-text) hover:bg-(--ui-bg-elevated) focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
    :aria-label="theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'"
    title="Toggle theme"
    @click="toggleTheme"
  >
    <svg
      v-if="theme === 'light'"
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="size-5"
      aria-hidden="true"
    >
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
    <svg
      v-else
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="size-5"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="4"
      />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </svg>
  </button>
</template>
