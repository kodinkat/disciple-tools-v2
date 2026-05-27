import { readBody } from 'h3'
import type { Updateable } from 'kysely'
import { db } from '../../../utils/database'
import type { RecordTypeFieldsTable } from '../../../database/schema'
import { assertUuid } from '../../../utils/record-mutations'
import { requirePermission } from '../../../utils/rbac'
import { normalizeAdminFieldConfig } from '../../../utils/admin-record-field-validation'
import { toAdminRecordTypeFieldRow } from '../../../utils/admin-record-type-field-response'

/** Mutates labels / order / config only (`kind` & `field_key` are immutable after create). */
export default defineEventHandler(async (event) => {
  await requirePermission(event, 'admin.access')

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'field id is required' })
  }
  assertUuid(id, 'field id')

  const row = await db
    .selectFrom('record_type_fields')
    .selectAll()
    .where('id', '=', id)
    .executeTakeFirst()

  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'Field not found' })
  }

  if (row.is_system) {
    throw createError({
      statusCode: 403,
      statusMessage: 'System field definitions cannot be modified via the admin schema API'
    })
  }

  const body = await readBody(event)
  const patch: Updateable<RecordTypeFieldsTable> = {}

  if (body.label !== undefined) {
    if (typeof body.label !== 'string' || body.label.trim() === '') {
      throw createError({
        statusCode: 400,
        statusMessage: '`label` must be a non-empty string'
      })
    }
    patch.label = body.label.trim()
  }

  if (body.description !== undefined) {
    if (typeof body.description !== 'string') {
      throw createError({
        statusCode: 400,
        statusMessage: '`description` must be a string'
      })
    }
    patch.description = body.description.trim()
  }

  if (body.field_order !== undefined) {
    const n = Number(body.field_order)
    if (!Number.isInteger(n)) {
      throw createError({
        statusCode: 400,
        statusMessage: '`field_order` must be an integer'
      })
    }
    patch.field_order = n
  }

  if (body.config !== undefined) {
    const res = normalizeAdminFieldConfig(row.kind, body.config)
    if (!res.ok) {
      throw createError({ statusCode: 400, statusMessage: res.message })
    }
    patch.config = res.config
  }

  if (body.kind !== undefined || body.field_key !== undefined) {
    throw createError({
      statusCode: 400,
      statusMessage:
        '`kind` and `field_key` cannot be changed; delete and recreate if needed.'
    })
  }

  if (Object.keys(patch).length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'No recognised fields to update'
    })
  }

  await db.updateTable('record_type_fields').set(patch).where('id', '=', id).executeTakeFirst()

  const updated = await db
    .selectFrom('record_type_fields')
    .selectAll()
    .where('id', '=', id)
    .executeTakeFirstOrThrow()

  return {
    record_type_field: toAdminRecordTypeFieldRow(updated)
  }
})
