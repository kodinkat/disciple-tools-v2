import type { RecordTypeFieldRow } from './record-mutations'
import {
  fieldValuesLiveInConnectionTable,
  fieldValuesLiveInEntryTable
} from './record-field-storage'
import {
  type RecordConnectionRow,
  type RecordFieldEntryRow,
  connectionsForFieldSorted,
  connectionFieldValue,
  entriesForFieldSorted,
  fieldEntryValue
} from './record-satellite-assembly'
import {
  buildRecordDetailSections,
  buildStaticRecordDetailLayoutKernel
} from './record-type-detail-layout'
import type {
  DetailFieldViewModel,
  RecordDetailPayload
} from '../../app/types/record-detail-payload'

export {
  RECORD_DETAIL_LAYOUT_VERSION,
  type DetailFieldViewModel,
  type RecordDetailLayout,
  type RecordDetailPayload
} from '../../app/types/record-detail-payload'

function mapKeySelectOptions(config: Record<string, unknown>) {
  const raw = config.options
  if (!Array.isArray(raw)) return []
  const out: Array<{ id: string, label: string }> = []
  for (const o of raw) {
    if (
      o !== null
      && typeof o === 'object'
      && 'key' in o
      && 'label' in o
      && typeof (o as { key: unknown }).key === 'string'
      && typeof (o as { label: unknown }).label === 'string'
    ) {
      out.push({
        id: (o as { key: string }).key,
        label: (o as { label: string }).label
      })
    }
  }
  return out
}

export type DetailSatellites = Readonly<{
  field_entries: RecordFieldEntryRow[]
  connections: RecordConnectionRow[]
}>

/** Empty satellite collections when callers only need layout from registry `data`. */
export const EMPTY_DETAIL_SATELLITES: DetailSatellites = Object.freeze({
  field_entries: [],
  connections: []
})

export function buildRecordDetailPayload(
  fieldRows: RecordTypeFieldRow[],
  data: Record<string, unknown>,
  satellites: DetailSatellites = EMPTY_DETAIL_SATELLITES,
  recordTypeMeta: Record<string, unknown> | null | undefined = undefined
): RecordDetailPayload {
  const sorted = [...fieldRows].sort((a, b) => a.field_order - b.field_order)
  const sections = buildRecordDetailSections(sorted, recordTypeMeta)
  const layout = buildStaticRecordDetailLayoutKernel(sections)

  const fields: DetailFieldViewModel[] = sorted.map((row) => {
    const config = row.config as Record<string, unknown>
    let value: unknown

    if (fieldValuesLiveInConnectionTable(row.kind)) {
      const relevant = connectionsForFieldSorted(row.field_key, satellites.connections)
      value = connectionFieldValue(relevant)
    } else if (fieldValuesLiveInEntryTable(row.kind)) {
      const relevant = entriesForFieldSorted(
        row.field_key,
        row.kind,
        satellites.field_entries
      )
      value = fieldEntryValue(relevant)
    } else {
      value = data[row.field_key]
    }

    const base: DetailFieldViewModel = {
      field_key: row.field_key,
      kind: row.kind,
      label: row.label,
      description: row.description,
      field_order: row.field_order,
      config,
      value
    }

    if (row.kind === 'key_select') {
      return {
        ...base,
        select_options: mapKeySelectOptions(config)
      }
    }

    return base
  })

  return { layout, fields }
}
