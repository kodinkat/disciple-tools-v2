import { createError } from 'h3'
import { sql, type SelectQueryBuilder, type SqlBool } from 'kysely'
import type { Database } from '../database/schema'
import type { RecordTypeFieldRow } from './record-mutations'

const MAX_LIMIT = 100
const DEFAULT_LIMIT = 50
const MAX_Q_LEN = 200

/** Keys must align with seeded `record_type_fields.field_key` pattern. */
export const RECORD_FILTER_FIELD_KEY_RE = /^[a-z][a-z0-9_]*$/i

export type ParsedRecordSort
  = | { kind: 'column', column: 'updated_at' | 'created_at', direction: 'asc' | 'desc' }
    | { kind: 'json_text', path: string, direction: 'asc' | 'desc' }

/** Escape `%`, `_`, and `\` for use in Postgres `ILIKE ... ESCAPE '\'`. */
export function escapeIlikePattern(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_')
}

export function parseRecordListQuery(searchParams: Record<string, unknown>): {
  limit: number
  offset: number
  sortRaw: string
  qSearch: string | null
  filtersParsed: unknown
} {
  const limitRaw = Number(searchParams.limit ?? DEFAULT_LIMIT)
  const offsetRaw = Number(searchParams.offset ?? 0)
  const limit = Math.min(
    Number.isFinite(limitRaw) ? limitRaw : DEFAULT_LIMIT,
    MAX_LIMIT
  )
  const limitFinal = Math.max(limit, 1)
  const offset = Math.max(Number.isFinite(offsetRaw) ? offsetRaw : 0, 0)

  const sortRaw
    = typeof searchParams.sort === 'string' && searchParams.sort.trim()
      ? searchParams.sort.trim()
      : '-updated_at'

  let qSearch: string | null = null
  if (typeof searchParams.q === 'string') {
    const t = searchParams.q.trim().slice(0, MAX_Q_LEN)
    qSearch = t.length ? t : null
  }

  let filtersParsed: unknown = undefined
  const fraw = searchParams.filters
  if (fraw !== undefined && fraw !== '') {
    if (typeof fraw !== 'string') {
      throw createError({
        statusCode: 400,
        statusMessage: 'filters must be a URL-encoded JSON string'
      })
    }
    try {
      filtersParsed = JSON.parse(fraw) as unknown
    } catch {
      throw createError({
        statusCode: 400,
        statusMessage: 'filters must be valid JSON'
      })
    }
  }

  return { limit: limitFinal, offset, sortRaw, qSearch, filtersParsed }
}

export function parseRecordSort(sortRaw: string): ParsedRecordSort {
  let direction: 'asc' | 'desc' = 'asc'
  let key = sortRaw.trim()
  if (key.startsWith('-')) {
    direction = 'desc'
    key = key.slice(1)
  }

  if (key === 'updated_at' || key === 'created_at') {
    return { kind: 'column', column: key, direction }
  }

  if (key === 'name') {
    return { kind: 'json_text', path: 'name', direction }
  }

  throw createError({
    statusCode: 400,
    statusMessage:
      `Invalid sort: "${sortRaw}". Use updated_at, created_at, or name — optional leading "-".`
  })
}

/** Equality filters on JSONB `records.data`; values are strings only (Phase 3 contract). */
export function coerceRecordEqualityFilters(
  fields: RecordTypeFieldRow[],
  filtersParsed: unknown
): Map<string, string> {
  if (filtersParsed === undefined || filtersParsed === null) {
    return new Map()
  }

  if (typeof filtersParsed !== 'object' || Array.isArray(filtersParsed)) {
    throw createError({ statusCode: 400, statusMessage: 'filters must be a JSON object' })
  }

  const allowed = new Set(fields.map(f => f.field_key))
  const entries = filtersParsed as Record<string, unknown>
  const map = new Map<string, string>()

  for (const [k, v] of Object.entries(entries)) {
    if (!allowed.has(k)) {
      throw createError({
        statusCode: 400,
        statusMessage: `Unknown filter field for this type: ${k}`
      })
    }

    if (!RECORD_FILTER_FIELD_KEY_RE.test(k)) {
      throw createError({
        statusCode: 400,
        statusMessage: `Invalid filter field key: ${k}`
      })
    }

    if (typeof v !== 'string' || v.trim() === '') {
      throw createError({
        statusCode: 400,
        statusMessage: `Filter "${k}" must be a non-empty string`
      })
    }

    map.set(k, v)
  }

  return map
}

type RecordsFilterQB = SelectQueryBuilder<Database, 'records', Record<string, never>>

/** Apply predicates shared by rows + total count queries. */
export function applyRecordListPredicates(
  qb: RecordsFilterQB,
  equality: Map<string, string>,
  qSearch: string | null
): RecordsFilterQB {
  let qout = qb

  for (const [fieldKey, value] of equality) {
    qout = qout.where(sql`records.data->>${sql.lit(fieldKey)}`, '=', value)
  }

  if (qSearch !== null && qSearch.length > 0) {
    const like = `%${escapeIlikePattern(qSearch)}%`
    qout = qout.where(
      sql<SqlBool>`records.data->>${sql.lit('name')} ILIKE ${like} ESCAPE '\\'`
    )
  }

  return qout
}

export function applyRecordSort(
  qb: RecordsFilterQB,
  sort: ParsedRecordSort
): RecordsFilterQB {
  if (sort.kind === 'column') {
    return qb.orderBy(sort.column, sort.direction)
  }

  return qb.orderBy(sql`records.data->>${sql.lit(sort.path)}`, sort.direction)
}

/** Re-apply paging / search bounds after optional `record-hooks` `beforeList` transforms (same rules as query parsing). */
export function sanitizeListingBounds(input: {
  limit: unknown
  offset: unknown
  qSearch: string | null | undefined
}): { limit: number, offset: number, qSearch: string | null } {
  const limitRaw = Number(input.limit)
  const offsetRaw = Number(input.offset)
  const limit = Math.min(
    Math.max(Number.isFinite(limitRaw) ? limitRaw : DEFAULT_LIMIT, 1),
    MAX_LIMIT
  )
  const offset = Math.max(Number.isFinite(offsetRaw) ? offsetRaw : 0, 0)

  let qSearch: string | null = null
  if (typeof input.qSearch === 'string') {
    const t = input.qSearch.trim().slice(0, MAX_Q_LEN)
    qSearch = t.length ? t : null
  }

  return { limit, offset, qSearch }
}

export { DEFAULT_LIMIT as RECORD_LIST_DEFAULT_LIMIT, MAX_LIMIT as RECORD_LIST_MAX_LIMIT }
