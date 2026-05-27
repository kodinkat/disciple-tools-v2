import type { Selectable } from 'kysely'
import type { RecordTypeFieldsTable } from '../database/schema'
import { fieldValueStorage, type FieldValueStorage } from './record-field-storage'

export type AdminRecordTypeFieldRow = Selectable<RecordTypeFieldsTable> & {
  value_storage: FieldValueStorage
}

export function toAdminRecordTypeFieldRow(
  row: Selectable<RecordTypeFieldsTable>
): AdminRecordTypeFieldRow {
  return {
    ...row,
    value_storage: fieldValueStorage(row.kind)
  }
}
