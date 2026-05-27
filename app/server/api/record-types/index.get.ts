import { requireAuth } from '../../utils/auth'
import { db } from '../../utils/database'

/**
 * List record type definitions (schema registry). Auth required; not a secret but
 * avoids anonymous scraping while Phase 02 stabilises.
 */
export default defineEventHandler(async (event) => {
  requireAuth(event)

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
      'meta',
    ])
    .orderBy('type_key', 'asc')
    .execute()

  const fields = await db
    .selectFrom('record_type_fields')
    .selectAll()
    .orderBy('record_type_id', 'asc')
    .orderBy('field_order', 'asc')
    .execute()

  return { record_types, record_type_fields: fields }
})
