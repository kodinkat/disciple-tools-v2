import { createError } from 'h3'
import type { Selectable } from 'kysely'
import {
  fieldValuesLiveInConnectionTable,
  fieldValuesLiveInEntryTable
} from './record-field-storage'
import { db } from './database'
import type { RecordTypeFieldsTable } from '../database/schema'

/** Row shape returned from selects (distinct from insert `Generated` columns). */
export type RecordTypeFieldRow = Selectable<RecordTypeFieldsTable>

export async function getRecordTypeByKey(typeKey: string) {
  return db
    .selectFrom('record_types')
    .selectAll()
    .where('type_key', '=', typeKey)
    .executeTakeFirst()
}

export async function loadFieldsForType(recordTypeId: string): Promise<RecordTypeFieldRow[]> {
  return db
    .selectFrom('record_type_fields')
    .selectAll()
    .where('record_type_id', '=', recordTypeId)
    .orderBy('field_order', 'asc')
    .execute()
}

export function applyKeySelectDefaults(
  rows: RecordTypeFieldRow[],
  data: Record<string, unknown>
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...data }
  for (const row of rows) {
    if (row.kind !== 'key_select') {
      continue
    }
    const cfg = row.config as { default_key?: string }
    if (out[row.field_key] === undefined && cfg.default_key !== undefined) {
      out[row.field_key] = cfg.default_key
    }
  }
  return out
}

export function assertRequiredFields(
  rows: RecordTypeFieldRow[],
  data: Record<string, unknown>
) {
  for (const row of rows) {
    if (
      fieldValuesLiveInEntryTable(row.kind)
      || fieldValuesLiveInConnectionTable(row.kind)
    ) {
      /** ADR 0003: authoritative values live outside `records.data` until PATCH sub-resources ship. */
      continue
    }
    const cfg = row.config as { required?: boolean }
    if (!cfg?.required) {
      continue
    }
    const v = data[row.field_key]
    if (
      v === undefined
      || v === null
      || (typeof v === 'string' && v.trim() === '')
    ) {
      throw createError({
        statusCode: 400,
        statusMessage: `Missing required field: ${row.field_key}`
      })
    }
  }
}

const UUID_RE
  = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function assertUuid(id: string, label = 'id') {
  if (!UUID_RE.test(id)) {
    throw createError({
      statusCode: 400,
      statusMessage: `Invalid ${label}`
    })
  }
}
