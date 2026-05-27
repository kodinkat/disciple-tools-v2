import { randomUUID } from 'crypto'
import { readBody } from 'h3'
import { requireRecordVerb } from '../../utils/records-rbac'
import { db } from '../../utils/database'
import {
  assertRequiredFields,
  applyKeySelectDefaults,
  getRecordTypeByKey,
  loadFieldsForType,
} from '../../utils/record-mutations'
import { runPostCreateFields, runPostCreated } from '../../utils/record-hooks'
import { logCreate } from '../../utils/activity-logger'

export default defineEventHandler(async (event) => {
  const typeKey = getRouterParam(event, 'typeKey')
  if (!typeKey) {
    throw createError({ statusCode: 400, statusMessage: 'typeKey is required' })
  }

  const auth = await requireRecordVerb(event, typeKey, 'create')

  const typeRow = await getRecordTypeByKey(typeKey)
  if (!typeRow) {
    throw createError({ statusCode: 404, statusMessage: 'Record type not found' })
  }

  const body = await readBody(event)
  const raw = body?.data
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Request body must include an object `data`',
    })
  }

  const fieldRows = await loadFieldsForType(typeRow.id)
  let data = applyKeySelectDefaults(fieldRows, raw as Record<string, unknown>)
  data = await runPostCreateFields(typeKey, data)
  assertRequiredFields(fieldRows, data)

  const id = randomUUID()
  const now = new Date().toISOString()

  await db
    .insertInto('records')
    .values({
      id,
      record_type_id: typeRow.id,
      created_at: now,
      updated_at: now,
      created_by: auth.userId,
      data: data as Record<string, unknown>,
    })
    .execute()

  await runPostCreated({ typeKey, recordId: id, data })

  logCreate('records', id, event, { type_key: typeKey })

  return {
    record: {
      id,
      type_key: typeKey,
      created_at: now,
      updated_at: now,
      created_by: auth.userId,
      data,
    },
  }
})
