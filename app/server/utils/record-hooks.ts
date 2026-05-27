/**
 * Lightweight hook registry aligned to v1 `DT_Posts` filter/action choke points.
 * v1 parallels (see disciple-tools-theme `dt-posts/dt-posts.php`):
 * - runPostCreateFields → `dt_post_create_fields`
 * - runPostUpdateFields → `dt_post_update_fields`
 * - runPostUpdated → `dt_post_updated` (after PATCH)
 * - runPostCreated → `dt_post_created`
 * - Listing (`GET /api/records/:typeKey`): {@link runBeforeList} / {@link runAfterList} (Phase 03)
 */
export type RecordHookContextFields = Readonly<{
  typeKey: string
  fields: Record<string, unknown>
}>

export type RecordHookPayloadCreated = Readonly<{
  typeKey: string
  recordId: string
  data: Record<string, unknown>
}>

export type RecordHookPayloadUpdated = Readonly<{
  typeKey: string
  recordId: string
  data: Record<string, unknown>
  previousData: Record<string, unknown>
}>

type MaybeProm<T> = T | Promise<T>

type PostCreateFieldsFn = (
  ctx: RecordHookContextFields
) => MaybeProm<RecordHookContextFields | undefined>

type PostCreatedFn = (
  payload: RecordHookPayloadCreated
) => MaybeProm<void>

type PostUpdateFieldsFn = PostCreateFieldsFn

type PostUpdatedFn = (
  payload: RecordHookPayloadUpdated
) => MaybeProm<void>

/** List pipeline (Phase 3) — filter-style; runs after URL parse + filter coercion, before query execution. */
export type RecordHookContextListBefore = Readonly<{
  typeKey: string
  recordTypeId: string
  fieldKeys: readonly string[]
  limit: number
  offset: number
  sortRaw: string
  qSearch: string | null
  equalityFilters: Record<string, string>
}>

export type RecordHookResultListBefore = Readonly<{
  limit?: number
  offset?: number
  sortRaw?: string
  qSearch?: string | null
  equalityFilters?: Record<string, string>
}>

type BeforeListFn = (
  ctx: RecordHookContextListBefore
) => MaybeProm<RecordHookResultListBefore | undefined>

/** Response row shape for `afterList` (matches `GET /api/records/:typeKey` list items). */
export type RecordHookListRow = Readonly<{
  id: string
  type_key: string
  created_at: string
  updated_at: string
  created_by: string | null
  data: Record<string, unknown>
}>

export type RecordHookPayloadListAfter = Readonly<{
  typeKey: string
  records: RecordHookListRow[]
  pagination: Readonly<{
    limit: number
    offset: number
    total: number
  }>
}>

export type RecordHookResultListAfter = Readonly<{
  records?: RecordHookListRow[]
  pagination?: Readonly<{
    limit?: number
    offset?: number
    total?: number
  }>
}>

type AfterListFn = (
  payload: RecordHookPayloadListAfter
) => MaybeProm<RecordHookResultListAfter | undefined>

const postCreateFieldsListeners: PostCreateFieldsFn[] = []
const postUpdateFieldsListeners: PostUpdateFieldsFn[] = []
const postCreatedListeners: PostCreatedFn[] = []
const postUpdatedListeners: PostUpdatedFn[] = []
const beforeListListeners: BeforeListFn[] = []
const afterListListeners: AfterListFn[] = []

export function registerRecordPostCreateFields(fn: PostCreateFieldsFn): void {
  postCreateFieldsListeners.push(fn)
}

export function registerRecordPostUpdateFields(fn: PostUpdateFieldsFn): void {
  postUpdateFieldsListeners.push(fn)
}

export function registerRecordPostCreated(fn: PostCreatedFn): void {
  postCreatedListeners.push(fn)
}

export function registerRecordPostUpdated(fn: PostUpdatedFn): void {
  postUpdatedListeners.push(fn)
}

export function registerRecordBeforeList(fn: BeforeListFn): void {
  beforeListListeners.push(fn)
}

export function registerRecordAfterList(fn: AfterListFn): void {
  afterListListeners.push(fn)
}

/**
 * Clears all record hook listeners. Intended for Vitest isolation only.
 */
export function resetRecordHooksForTests(): void {
  postCreateFieldsListeners.length = 0
  postUpdateFieldsListeners.length = 0
  postCreatedListeners.length = 0
  postUpdatedListeners.length = 0
  beforeListListeners.length = 0
  afterListListeners.length = 0
}

/** Sequential transform — same chaining semantics as {@link runPostCreateFields}. */
export async function runPostUpdateFields(
  typeKey: string,
  fields: Record<string, unknown>
): Promise<Record<string, unknown>> {
  let merged: Record<string, unknown> = { ...fields }
  const ctxBase = (): RecordHookContextFields => ({ typeKey, fields: { ...merged } })
  for (const fn of postUpdateFieldsListeners) {
    const ctx = ctxBase()
    const next = await fn(ctx)
    if (next?.fields && typeof next.fields === 'object') merged = { ...next.fields }
  }
  return merged
}

export async function runPostUpdated(payload: RecordHookPayloadUpdated): Promise<void> {
  for (const fn of postUpdatedListeners) await fn(payload)
}

/** Sequential transform — last writer wins merged object (v1-style filter chain). */
export async function runPostCreateFields(
  typeKey: string,
  fields: Record<string, unknown>
): Promise<Record<string, unknown>> {
  let merged: Record<string, unknown> = { ...fields }
  const ctxBase = (): RecordHookContextFields => ({ typeKey, fields: { ...merged } })
  for (const fn of postCreateFieldsListeners) {
    const ctx = ctxBase()
    const next = await fn(ctx)
    if (next?.fields && typeof next.fields === 'object') merged = { ...next.fields }
  }
  return merged
}

export async function runPostCreated(payload: RecordHookPayloadCreated): Promise<void> {
  for (const fn of postCreatedListeners) await fn(payload)
}

export async function runBeforeList(initial: RecordHookContextListBefore): Promise<{
  limit: number
  offset: number
  sortRaw: string
  qSearch: string | null
  equalityFilters: Record<string, string>
}> {
  let limit = initial.limit
  let offset = initial.offset
  let sortRaw = initial.sortRaw
  let qSearch = initial.qSearch
  let equalityFilters = { ...initial.equalityFilters }

  for (const fn of beforeListListeners) {
    const snapshot: RecordHookContextListBefore = Object.freeze({
      typeKey: initial.typeKey,
      recordTypeId: initial.recordTypeId,
      fieldKeys: initial.fieldKeys,
      limit,
      offset,
      sortRaw,
      qSearch,
      equalityFilters: { ...equalityFilters }
    })
    const next = await fn(snapshot)
    if (!next || typeof next !== 'object') continue
    if (typeof next.limit === 'number' && Number.isFinite(next.limit)) limit = next.limit
    if (typeof next.offset === 'number' && Number.isFinite(next.offset)) offset = next.offset
    if (typeof next.sortRaw === 'string') sortRaw = next.sortRaw
    if (Object.prototype.hasOwnProperty.call(next, 'qSearch')) qSearch = next.qSearch ?? null
    if (next.equalityFilters && typeof next.equalityFilters === 'object')
      equalityFilters = { ...equalityFilters, ...next.equalityFilters }
  }

  return { limit, offset, sortRaw, qSearch, equalityFilters }
}

export async function runAfterList(payload: RecordHookPayloadListAfter): Promise<{
  records: RecordHookListRow[]
  pagination: { limit: number, offset: number, total: number }
}> {
  let records = payload.records.slice()
  let pagination = { ...payload.pagination }
  const typeKey = payload.typeKey

  for (const fn of afterListListeners) {
    const snap: RecordHookPayloadListAfter = Object.freeze({
      typeKey,
      records,
      pagination: { ...pagination }
    })
    const next = await fn(snap)
    if (!next || typeof next !== 'object') continue
    if (Array.isArray(next.records)) records = next.records.slice()
    if (next.pagination && typeof next.pagination === 'object')
      pagination = { ...pagination, ...next.pagination }
  }

  return { records, pagination }
}
