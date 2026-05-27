import { db } from '../../../utils/database'
import { assertUuid } from '../../../utils/record-mutations'
import { requirePermission } from '../../../utils/rbac'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'admin.access')

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'field id is required' })
  }
  assertUuid(id, 'field id')

  const row = await db
    .selectFrom('record_type_fields')
    .select(['id', 'is_system'])
    .where('id', '=', id)
    .executeTakeFirst()

  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'Field not found' })
  }

  if (row.is_system) {
    throw createError({
      statusCode: 403,
      statusMessage: 'System field definitions cannot be deleted'
    })
  }

  const deleted = await db
    .deleteFrom('record_type_fields')
    .where('id', '=', id)
    .executeTakeFirst()

  const n = Number(deleted.numDeletedRows ?? 0)
  if (n === 0) {
    throw createError({ statusCode: 404, statusMessage: 'Field not found' })
  }

  setResponseStatus(event, 204)
  return null
})
