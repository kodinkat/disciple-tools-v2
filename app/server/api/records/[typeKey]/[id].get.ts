import { requireRecordVerb } from '../../../utils/records-rbac'
import { db } from '../../../utils/database'
import {
  assertUuid,
  getRecordTypeByKey,
  loadFieldsForType
} from '../../../utils/record-mutations'
import { buildRecordDetailPayload } from '../../../utils/record-detail-payload'

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

  await requireRecordVerb(event, typeKey, 'read')

  const typeRow = await getRecordTypeByKey(typeKey)
  if (!typeRow) {
    throw createError({ statusCode: 404, statusMessage: 'Record type not found' })
  }

  const row = await db
    .selectFrom('records')
    .select(['id', 'record_type_id', 'created_at', 'updated_at', 'created_by', 'data'])
    .where('id', '=', id)
    .where('record_type_id', '=', typeRow.id)
    .executeTakeFirst()

  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'Record not found' })
  }

  const data = row.data as Record<string, unknown>

  const fieldRows = await loadFieldsForType(typeRow.id)
  const detail = buildRecordDetailPayload(fieldRows, data)

  return {
    record: {
      id: row.id,
      type_key: typeKey,
      created_at: row.created_at,
      updated_at: row.updated_at,
      created_by: row.created_by,
      data
    },
    detail
  }
})
