import { readBody } from 'h3'
import { requireRecordVerb } from '../../../utils/records-rbac'
import { db } from '../../../utils/database'
import {
  assertRequiredFields,
  assertUuid,
  getRecordTypeByKey,
  loadFieldsForType,
} from '../../../utils/record-mutations'
import { runPostUpdateFields, runPostUpdated } from '../../../utils/record-hooks'
import { logUpdate } from '../../../utils/activity-logger'

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
  await requireRecordVerb(event, typeKey, 'write')

  const typeRow = await getRecordTypeByKey(typeKey)
  if (!typeRow) {
    throw createError({ statusCode: 404, statusMessage: 'Record type not found' })
  }

  const existing = await db
    .selectFrom('records')
    .select(['id', 'data'])
    .where('id', '=', id)
    .where('record_type_id', '=', typeRow.id)
    .executeTakeFirst()

  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Record not found' })
  }

  const body = await readBody(event)
  const patch = body?.data
  if (!patch || typeof patch !== 'object' || Array.isArray(patch)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Request body must include an object `data`',
    })
  }

  const fieldRows = await loadFieldsForType(typeRow.id)
  const previousData = { ...(existing.data as Record<string, unknown>) }
  const merged: Record<string, unknown> = { ...previousData, ...patch }
  const data = await runPostUpdateFields(typeKey, merged)
  assertRequiredFields(fieldRows, data)

  const now = new Date().toISOString()
  const upd = await db
    .updateTable('records')
    .set({
      data: data as Record<string, unknown>,
      updated_at: now,
    })
    .where('id', '=', id)
    .where('record_type_id', '=', typeRow.id)
    .executeTakeFirst()

  if (Number(upd.numUpdatedRows ?? 0) === 0) {
    throw createError({ statusCode: 404, statusMessage: 'Record not found' })
  }

  logUpdate('records', id, event, { type_key: typeKey })

  await runPostUpdated({
    typeKey,
    recordId: id,
    data,
    previousData,
  })

  return {
    record: {
      id,
      type_key: typeKey,
      updated_at: now,
      data,
    },
  }
})
