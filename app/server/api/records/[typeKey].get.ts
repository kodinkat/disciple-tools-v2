import { getQuery } from 'h3'
import { requireRecordVerb } from '../../utils/records-rbac'
import { db } from '../../utils/database'
import { getRecordTypeByKey, loadFieldsForType } from '../../utils/record-mutations'
import {
  applyRecordListPredicates,
  applyRecordSort,
  coerceRecordEqualityFilters,
  parseRecordListQuery,
  parseRecordSort,
  sanitizeListingBounds
} from '../../utils/record-list-query'
import { runAfterList, runBeforeList } from '../../utils/record-hooks'

function flattenQuery(raw: Record<string, unknown>): Record<string, unknown> {
  const o: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(raw)) {
    o[k] = Array.isArray(v) ? v[0] : v
  }
  return o
}

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

  const fields = await loadFieldsForType(typeRow.id)

  const searchParams = flattenQuery(
    getQuery(event) as Record<string, unknown>
  )

  const parsed = parseRecordListQuery(searchParams)
  const equalityFromRequest = coerceRecordEqualityFilters(fields, parsed.filtersParsed)
  const equalityRecord = Object.fromEntries(equalityFromRequest.entries())

  const beforeOut = await runBeforeList({
    typeKey,
    recordTypeId: typeRow.id,
    fieldKeys: fields.map(f => f.field_key),
    limit: parsed.limit,
    offset: parsed.offset,
    sortRaw: parsed.sortRaw,
    qSearch: parsed.qSearch,
    equalityFilters: equalityRecord
  })

  const { limit: listLimit, offset: listOffset, qSearch: listQSearch } = sanitizeListingBounds({
    limit: beforeOut.limit,
    offset: beforeOut.offset,
    qSearch: beforeOut.qSearch
  })

  const sort = parseRecordSort(beforeOut.sortRaw)
  const equalityMap = coerceRecordEqualityFilters(fields, beforeOut.equalityFilters)

  const baseFiltered = () =>
    applyRecordListPredicates(
      db
        .selectFrom('records')
        .where('record_type_id', '=', typeRow.id),
      equalityMap,
      listQSearch
    )

  const rows = await applyRecordSort(baseFiltered(), sort)
    .select([
      'records.id',
      'records.record_type_id',
      'records.created_at',
      'records.updated_at',
      'records.created_by',
      'records.data'
    ])
    .limit(listLimit)
    .offset(listOffset)
    .execute()

  const totalRow = await baseFiltered()
    .select(eb => eb.fn.count<number>('records.id').as('count'))
    .executeTakeFirst()

  const pagination = {
    limit: listLimit,
    offset: listOffset,
    total: Number(totalRow?.count ?? 0)
  }

  const records = rows.map((r) => {
    const created = r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at)
    const updated = r.updated_at instanceof Date ? r.updated_at.toISOString() : String(r.updated_at)
    return {
      id: r.id,
      type_key: typeKey,
      created_at: created,
      updated_at: updated,
      created_by: r.created_by,
      data: r.data
    }
  })

  const { records: rowsOut, pagination: paginationOut } = await runAfterList({
    typeKey,
    records,
    pagination
  })

  return {
    type_key: typeKey,
    records: rowsOut,
    pagination: paginationOut
  }
})
