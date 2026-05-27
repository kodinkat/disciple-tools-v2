import { readBody } from 'h3'
import { db } from '../../../utils/database'
import {
  assertUuid,
  loadFieldsForType
} from '../../../utils/record-mutations'
import { requirePermission } from '../../../utils/rbac'
import { sanitizeDetailLayoutForPersist } from '../../../utils/record-type-detail-layout'

/**
 * Update **`record_types.meta`** subsets (M4). Currently **`detail_layout`** for record detail shells.
 *
 * **`detail_layout: null`** removes the overlay; omission leaves meta unchanged for that branch.
 *
 * Requires `admin.access`.
 */
export default defineEventHandler(async (event) => {
  await requirePermission(event, 'admin.access')

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'record type id is required' })
  }
  assertUuid(id, 'record type id')

  const existing = await db
    .selectFrom('record_types')
    .select(['id', 'meta'])
    .where('id', '=', id)
    .executeTakeFirst()

  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Record type not found' })
  }

  const body = await readBody(event) as Record<string, unknown>
  const nextMeta: Record<string, unknown> = {
    ...(existing.meta as Record<string, unknown>)
  }

  if (Object.prototype.hasOwnProperty.call(body ?? {}, 'detail_layout')) {
    if (body?.detail_layout === null) {
      delete nextMeta.detail_layout
    } else if (
      typeof body?.detail_layout === 'object'
      && body?.detail_layout !== null
      && !Array.isArray(body.detail_layout)
    ) {
      const fieldRows = await loadFieldsForType(id)
      const sortedFields = [...fieldRows].sort((a, b) => a.field_order - b.field_order)

      nextMeta.detail_layout = sanitizeDetailLayoutForPersist(
        body.detail_layout as Record<string, unknown>,
        sortedFields
      )
    } else {
      throw createError({
        statusCode: 400,
        statusMessage: '`detail_layout` must be null or an object with `sections`'
      })
    }
  }

  const now = new Date().toISOString()
  const row = await db
    .updateTable('record_types')
    .set({
      meta: nextMeta as never,
      updated_at: now
    })
    .where('id', '=', id)
    .returningAll()
    .executeTakeFirst()

  return { record_type: row }
})
