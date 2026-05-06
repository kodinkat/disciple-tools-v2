import { requireRecordVerb } from '../../../utils/records-rbac'
import { db } from '../../../utils/database'
import { assertUuid, getRecordTypeByKey } from '../../../utils/record-mutations'
import { logDelete } from '../../../utils/activity-logger'

export default defineEventHandler(async (event) => {
  const typeKey = getRouterParam(event, 'typeKey')
  const id = getRouterParam(event, 'id')
  if (!typeKey) {
    throw createError({ statusCode: 400, statusMessage: 'typeKey is required' })
  }
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'id is required' })
  }

  assertUuid(id)
  await requireRecordVerb(event, typeKey, 'delete')

  const typeRow = await getRecordTypeByKey(typeKey)
  if (!typeRow) {
    throw createError({ statusCode: 404, statusMessage: 'Record type not found' })
  }

  const del = await db
    .deleteFrom('records')
    .where('id', '=', id)
    .where('record_type_id', '=', typeRow.id)
    .executeTakeFirst()

  if (Number(del.numDeletedRows ?? 0) === 0) {
    throw createError({ statusCode: 404, statusMessage: 'Record not found' })
  }

  logDelete('records', id, event, { type_key: typeKey })

  return { ok: true, id, type_key: typeKey }
})
