export default defineNuxtRouteMiddleware(() => {
  const { hasPermission } = usePermissions()

  if (!hasPermission('records.groups.read')) {
    return navigateTo('/dashboard')
  }
})
