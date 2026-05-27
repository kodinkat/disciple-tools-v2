import { requirePermission } from '../../utils/rbac'
import { db } from '../../utils/database'
import { KNOWN_FIELD_KINDS } from '../../utils/record-field-storage'
import { toAdminRecordTypeFieldRow } from '../../utils/admin-record-type-field-response'

/**
 * Full record type + field schema registry for admin.
 * Requires `admin.access`; enriches fields with `value_storage` per ADR 0003.
 */
export default defineEventHandler(async (event) => {
  await requirePermission(event, 'admin.access')

  const record_types = await db
    .selectFrom('record_types')
    .select([
      'id',
      'type_key',
      'label',
      'label_plural',
      'description',
      'is_system',
      'created_at',
      'updated_at',
      'meta'
    ])
    .orderBy('type_key', 'asc')
    .execute()

  const fieldRows = await db
    .selectFrom('record_type_fields')
    .selectAll()
    .orderBy('record_type_id', 'asc')
    .orderBy('field_order', 'asc')
    .execute()

  const record_type_fields = fieldRows.map(toAdminRecordTypeFieldRow)

  return {
    record_types,
    record_type_fields,
    allowed_field_kinds: [...KNOWN_FIELD_KINDS].sort()
  }
})
