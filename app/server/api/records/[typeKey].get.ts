import { getQuery } from 'h3'
import { requireRecordVerb } from '../../utils/records-rbac'
import { db } from '../../utils/database'
import { getRecordTypeByKey } from '../../utils/record-mutations'

export default defineEventHandler(async (event) => {
  const typeKey = getRouterParam(event, 'typeKey')
  if (!typeKey) {
    throw createError({ statusCode: 400, statusMessage: 'typeKey is required' })
  }

  await requireRecordVerb(event, typeKey, 'read')

  const typeRow = await getRecordTypeByKey(typeKey)
  if (!typeRow) {
    throw createError({ statusCode: 404, statusMessage: 'Record type not found' })
  }

  const q = getQuery(event)
  const limitRaw = Number(q.limit ?? 50)
  const offsetRaw = Number(q.offset ?? 0)
  const limit = Math.min(Number.isFinite(limitRaw) ? limitRaw : 50, 100)
  const offset = Math.max(Number.isFinite(offsetRaw) ? offsetRaw : 0, 0)

  const rows = await db
    .selectFrom('records')
    .select(['id', 'record_type_id', 'created_at', 'updated_at', 'created_by', 'data'])
    .where('record_type_id', '=', typeRow.id)
    .orderBy('updated_at', 'desc')
    .limit(limit)
    .offset(offset)
    .execute()

  const totalRow = await db
    .selectFrom('records')
    .select(eb => eb.fn.count<string>('id').as('count'))
    .where('record_type_id', '=', typeRow.id)
    .executeTakeFirst()

  return {
    type_key: typeKey,
    records: rows.map(r => ({
      id: r.id,
      type_key: typeKey,
      created_at: r.created_at,
      updated_at: r.updated_at,
      created_by: r.created_by,
      data: r.data,
    })),
    pagination: {
      limit,
      offset,
      total: Number(totalRow?.count ?? 0),
    },
  }
})
