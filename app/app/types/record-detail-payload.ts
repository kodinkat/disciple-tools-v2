/** Shared types for `GET /api/records/:typeKey/:id` → `detail` (Phase 04). */

export const RECORD_DETAIL_LAYOUT_VERSION = 1 as const

export type RecordDetailLayout = Readonly<{
  version: typeof RECORD_DETAIL_LAYOUT_VERSION
  sections: ReadonlyArray<Readonly<{
    id: string
    title: string | null
    field_keys: readonly string[]
  }>>
}>

export type DetailFieldViewModel = Readonly<{
  field_key: string
  kind: string
  label: string
  description: string | null
  field_order: number
  config: Record<string, unknown>
  value: unknown
  /** `key_select`: options shaped for `dt-single-select` (`id` + `label`). */
  select_options?: ReadonlyArray<Readonly<{ id: string, label: string }>>
}>

export type RecordDetailPayload = Readonly<{
  layout: RecordDetailLayout
  fields: DetailFieldViewModel[]
}>
