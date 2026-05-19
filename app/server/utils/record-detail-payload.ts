import type { RecordTypeFieldRow } from './record-mutations'
import {
  RECORD_DETAIL_LAYOUT_VERSION,
  type DetailFieldViewModel,
  type RecordDetailPayload
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

export function buildRecordDetailPayload(
  fieldRows: RecordTypeFieldRow[],
  data: Record<string, unknown>
): RecordDetailPayload {
  const sorted = [...fieldRows].sort((a, b) => a.field_order - b.field_order)

  const fields: DetailFieldViewModel[] = sorted.map((row) => {
    const config = row.config as Record<string, unknown>
    const base: DetailFieldViewModel = {
      field_key: row.field_key,
      kind: row.kind,
      label: row.label,
      description: row.description,
      field_order: row.field_order,
      config,
      value: data[row.field_key]
    }

    if (row.kind === 'key_select') {
      return {
        ...base,
        select_options: mapKeySelectOptions(config)
      }
    }

    return base
  })

  return {
    layout: {
      version: RECORD_DETAIL_LAYOUT_VERSION,
      sections: [
        {
          id: 'primary',
          title: 'Details',
          field_keys: sorted.map(r => r.field_key)
        }
      ]
    },
    fields
  }
}
