import { describe, expect, it } from 'vitest'
import { buildRecordDetailPayload } from '../../server/utils/record-detail-payload'
import type { RecordTypeFieldRow } from '../../server/utils/record-mutations'

describe('buildRecordDetailPayload', () => {
  it('orders fields and maps key_select options for dt-single-select', () => {
    const rows = [
      {
        field_key: 'name',
        kind: 'text',
        label: 'Name',
        description: null,
        field_order: 10,
        config: { required: true }
      },
      {
        field_key: 'overall_status',
        kind: 'key_select',
        label: 'Status',
        description: null,
        field_order: 30,
        config: {
          options: [
            { key: 'new', label: 'New' },
            { key: 'active', label: 'Active' }
          ]
        }
      }
    ] as RecordTypeFieldRow[]

    const detail = buildRecordDetailPayload(rows, {
      name: 'Ada',
      overall_status: 'new'
    })

    expect(detail.layout.version).toBe(1)
    expect(detail.layout.sections[0]?.field_keys).toEqual(['name', 'overall_status'])
    expect(detail.fields).toHaveLength(2)
    expect(detail.fields[0]?.value).toBe('Ada')
    expect(detail.fields[1]?.select_options).toEqual([
      { id: 'new', label: 'New' },
      { id: 'active', label: 'Active' }
    ])
  })
})
