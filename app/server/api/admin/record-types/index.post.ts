import { readBody } from 'h3'
import { db } from '../../../utils/database'
import { requirePermission } from '../../../utils/rbac'
import { parseAdminRecordTypeKey } from '../../../utils/admin-record-field-validation'

/**
 * Creates a non-system record type (`is_system = false`).
 * Requires `admin.access`.
 */
export default defineEventHandler(async (event) => {
  await requirePermission(event, 'admin.access')

  const body = await readBody(event)
  const typeParsed = parseAdminRecordTypeKey(body?.type_key)
  if (!typeParsed.ok) {
    throw createError({ statusCode: 400, statusMessage: typeParsed.message })
  }
  const { type_key } = typeParsed

  const label = typeof body?.label === 'string' ? body.label.trim() : ''
  const label_plural = typeof body?.label_plural === 'string'
    ? body.label_plural.trim()
    : ''

  if (label.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'label is required' })
  }
  if (label_plural.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'label_plural is required'
    })
  }

  const description
    = typeof body?.description === 'string' ? body.description.trim() : ''

  const existing = await db
    .selectFrom('record_types')
    .select(['id'])
    .where('type_key', '=', type_key)
    .executeTakeFirst()

  if (existing) {
    throw createError({
      statusCode: 409,
      statusMessage: 'A record type with this type_key already exists'
    })
  }

  const now = new Date().toISOString()
  const row = await db
    .insertInto('record_types')
    .values({
      type_key,
      label,
      label_plural,
      description,
      is_system: false,
      created_at: now,
      updated_at: now,
      meta: {}
    })
    .returningAll()
    .executeTakeFirstOrThrow()

  return { record_type: row }
})
