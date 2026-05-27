// Sync bootstrap only: async checkAuth was leaving the root in Suspense and triggered vue
// currentRenderingInstance / renderSlot (.ce) failures in Safari + some Nuxt 4+Vite setups.
export default defineNuxtPlugin(() => {
  const { restoreFromCache, checkAuth, setAuthReady } = useAuth()

  restoreFromCache()
  setAuthReady(true)
  void checkAuth()
})
