const STORAGE_KEY = 'disciple-tools-v2-context-sidebar-collapsed'

/**
 * Persists main-app left sidebar collapsed state (desktop only).
 */
export function useContextualSidebar() {
  const collapsed = ref(false)

  onMounted(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored === '1') collapsed.value = true
    } catch {
      /* private mode / denied */
    }
    watch(collapsed, (v) => {
      try {
        localStorage.setItem(STORAGE_KEY, v ? '1' : '0')
      } catch {
        /* ignore */
      }
    })
  })

  function toggleCollapsed() {
    collapsed.value = !collapsed.value
  }

  return { collapsed, toggleCollapsed }
}
