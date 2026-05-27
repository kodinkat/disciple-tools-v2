export default defineNuxtRouteMiddleware(() => {
  const { hasPermission } = usePermissions()

  if (!hasPermission('records.contacts.read')) {
    return navigateTo('/dashboard')
  }
})
