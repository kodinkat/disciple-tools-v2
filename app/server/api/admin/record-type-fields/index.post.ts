import { readBody } from 'h3'
import { db } from '../../../utils/database'
import { assertUuid } from '../../../utils/record-mutations'
import { requirePermission } from '../../../utils/rbac'
import {
  normalizeAdminFieldConfig,
  parseAdminFieldKey
} from '../../../utils/admin-record-field-validation'
import { KNOWN_FIELD_KINDS } from '../../../utils/record-field-storage'
import { toAdminRecordTypeFieldRow } from '../../../utils/admin-record-type-field-response'

/**
 * Adds a non-system field row (`record_type_fields.is_system = false`).
 * Seeded fields remain locked (PATCH/DELETE only on custom definitions).
 *
 * Requires `admin.access`.
 */
export default defineEventHandler(async (event) => {
  await requirePermission(event, 'admin.access')

  const body = await readBody(event)
  const rtIdRaw = body?.record_type_id
  if (typeof rtIdRaw !== 'string') {
    throw createError({
      statusCode: 400,
      statusMessage: '`record_type_id` is required'
    })
  }
  assertUuid(rtIdRaw.trim(), 'record_type_id')

  const fk = parseAdminFieldKey(body?.field_key)
  if (!fk.ok) {
    throw createError({ statusCode: 400, statusMessage: fk.message })
  }

  const kind = typeof body?.kind === 'string' ? body.kind.trim() : ''
  if (!KNOWN_FIELD_KINDS.has(kind)) {
    throw createError({
      statusCode: 400,
      statusMessage:
        `Unknown field kind '${kind}'. Allowed: ${[...KNOWN_FIELD_KINDS].sort().join(', ')}`
    })
  }

  const label = typeof body?.label === 'string' ? body.label.trim() : ''
  if (label.length === 0) {
    throw createError({ statusCode: 400, statusMessage: '`label` is required' })
  }

  const description
    = typeof body?.description === 'string' ? body.description.trim() : ''

  let field_order: number
  if (body.field_order !== undefined && body.field_order !== null) {
    const n = Number(body.field_order)
    if (!Number.isInteger(n)) {
      throw createError({
        statusCode: 400,
        statusMessage: '`field_order` must be an integer'
      })
    }
    field_order = n
  } else {
    const agg = await db
      .selectFrom('record_type_fields')
      .where('record_type_id', '=', rtIdRaw.trim())
      .select(e => e.fn.max('field_order').as('max_ord'))
      .executeTakeFirst()
    const maxOrd = agg?.max_ord == null ? 0 : Number(agg.max_ord)
    field_order = maxOrd + 10
  }

  const configResult = normalizeAdminFieldConfig(kind, body?.config)
  if (!configResult.ok) {
    throw createError({ statusCode: 400, statusMessage: configResult.message })
  }

  const typeRow = await db
    .selectFrom('record_types')
    .select(['id'])
    .where('id', '=', rtIdRaw.trim())
    .executeTakeFirst()

  if (!typeRow) {
    throw createError({ statusCode: 404, statusMessage: 'Record type not found' })
  }

  const dupKey = await db
    .selectFrom('record_type_fields')
    .select('id')
    .where('record_type_id', '=', rtIdRaw.trim())
    .where('field_key', '=', fk.field_key)
    .executeTakeFirst()

  if (dupKey) {
    throw createError({
      statusCode: 409,
      statusMessage: 'A field with this field_key already exists on this record type'
    })
  }

  const row = await db
    .insertInto('record_type_fields')
    .values({
      record_type_id: rtIdRaw.trim(),
      field_key: fk.field_key,
      kind,
      label,
      description,
      field_order,
      config: configResult.config,
      is_system: false
    })
    .returningAll()
    .executeTakeFirstOrThrow()

  return {
    record_type_field: toAdminRecordTypeFieldRow(row)
  }
})
