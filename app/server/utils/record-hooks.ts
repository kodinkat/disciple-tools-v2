/**
 * Lightweight hook registry aligned to v1 `DT_Posts` filter/action choke points.
 * v1 parallels (see disciple-tools-theme `dt-posts/dt-posts.php`):
 * - runPostCreateFields → `dt_post_create_fields`
 * - runPostUpdateFields → `dt_post_update_fields`
 * - runPostUpdated → `dt_post_updated` (after PATCH)
 * - runPostCreated → `dt_post_created`
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

type PostCreateFieldsFn = (
  ctx: RecordHookContextFields,
) => Promise<RecordHookContextFields | void> | RecordHookContextFields | void

type PostCreatedFn = (
  payload: RecordHookPayloadCreated,
) => Promise<void> | void

type PostUpdateFieldsFn = PostCreateFieldsFn

type PostUpdatedFn = (
  payload: RecordHookPayloadUpdated,
) => Promise<void> | void

const postCreateFieldsListeners: PostCreateFieldsFn[] = []
const postUpdateFieldsListeners: PostUpdateFieldsFn[] = []
const postCreatedListeners: PostCreatedFn[] = []
const postUpdatedListeners: PostUpdatedFn[] = []

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

/** Sequential transform — same chaining semantics as {@link runPostCreateFields}. */
export async function runPostUpdateFields(
  typeKey: string,
  fields: Record<string, unknown>,
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
  fields: Record<string, unknown>,
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
