import type { Selectable } from 'kysely'
import type { RecordConnectionsTable, RecordFieldEntriesTable } from '../database/schema'

/** Rows from `record_field_entries` scoped to one `records.id`. */
export type RecordFieldEntryRow = Selectable<RecordFieldEntriesTable>

/** Rows from `record_connections` scoped to one source `records.id`. */
export type RecordConnectionRow = Selectable<RecordConnectionsTable>

function bySortOrder(a: { sort_order: number }, b: { sort_order: number }): number {
  return a.sort_order - b.sort_order
}

export function entriesForFieldSorted(
  fieldKey: string,
  fieldKind: string,
  rows: RecordFieldEntryRow[]
): RecordFieldEntryRow[] {
  return rows
    .filter(r => r.field_key === fieldKey && r.entry_type === fieldKind)
    .sort(bySortOrder)
}

export function connectionsForFieldSorted(
  fieldKey: string,
  rows: RecordConnectionRow[]
): RecordConnectionRow[] {
  return rows.filter(r => r.field_key === fieldKey).sort(bySortOrder)
}

/**
 * Value shape surfaced on `detail.fields[].value` for `record_field_entries` kinds (ADR 0003).
 * Sorted array of row payloads (`jsonb`).
 */
export function fieldEntryValue(entries: RecordFieldEntryRow[]): unknown[] {
  return entries.map(r => ({ ...r.payload }))
}

/** Connection ids in display order (`sort_order`). */
export function connectionFieldValue(rows: RecordConnectionRow[]): string[] {
  return rows.map(r => r.connected_record_id)
}
