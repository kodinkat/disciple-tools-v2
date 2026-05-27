import { createError } from 'h3'
import type { RecordTypeFieldRow } from './record-mutations'
import {
  fieldValuesLiveInConnectionTable,
  fieldValuesLiveInEntryTable
} from './record-field-storage'

/**
 * PATCH `data[field_key]` is only supported for scalar / `records.data`-backed kinds (ADR 0003).
 */
export function assertPatchAvoidsSatelliteFieldKeys(
  patch: Record<string, unknown>,
  fieldRows: RecordTypeFieldRow[]
) {
  const byKey = new Map(fieldRows.map(r => [r.field_key, r]))
  for (const key of Object.keys(patch)) {
    const row = byKey.get(key)
    if (!row) {
      continue
    }
    if (
      fieldValuesLiveInEntryTable(row.kind)
      || fieldValuesLiveInConnectionTable(row.kind)
    ) {
      throw createError({
        statusCode: 400,
        statusMessage:
          `Field "${key}" is stored outside records.data (${row.kind}); use satellite PATCH routes when shipped`
      })
    }
  }
}
