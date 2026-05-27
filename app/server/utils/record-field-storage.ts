/**
 * Where field values are persisted (ADR 0003 + ADR 0001).
 * Use these guards when reading/writing records and building detail payloads.
 */

/** Stored in `records.data[field_key]` (JSONB document). */
export const FIELD_KIND_IN_RECORD_DATA = new Set<string>([
  'text',
  'textarea',
  'number',
  'boolean',
  'date',
  'key_select',
  'user_select',
  'multi_select'
])

/**
 * One row per value in `record_field_entries` (`entry_type` column).
 * Shapes validated per-kind when services land.
 */
export const FIELD_ENTRY_TYPES = new Set<string>([
  'communication_channel',
  'link',
  'location',
  'location_meta',
  'tags'
])

/** Relational `connection` fields use `record_connections`. */
export const CONNECTION_FIELD_KIND = 'connection' as const

/** Kinds admins may assign in M2 (`POST /api/admin/record-type-fields`). */
export const KNOWN_FIELD_KINDS = new Set<string>([
  ...FIELD_KIND_IN_RECORD_DATA,
  ...FIELD_ENTRY_TYPES,
  CONNECTION_FIELD_KIND
])

export function fieldValuesLiveInRecordData(kind: string): boolean {
  return FIELD_KIND_IN_RECORD_DATA.has(kind)
}

export function fieldValuesLiveInEntryTable(kind: string): boolean {
  return FIELD_ENTRY_TYPES.has(kind)
}

export function fieldValuesLiveInConnectionTable(kind: string): boolean {
  return kind === CONNECTION_FIELD_KIND
}

/** Canonical DB bucket for authoritative field instance values (ADR 0003). */
export type FieldValueStorage = 'data' | 'entries' | 'connections'

export function fieldValueStorage(kind: string): FieldValueStorage {
  if (fieldValuesLiveInConnectionTable(kind)) return 'connections'
  if (fieldValuesLiveInEntryTable(kind)) return 'entries'
  if (fieldValuesLiveInRecordData(kind)) return 'data'
  return 'data'
}
