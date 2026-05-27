import { describe, expect, it } from 'vitest'
import {
  buildRecordDetailPayload,
  EMPTY_DETAIL_SATELLITES
} from '../../server/utils/record-detail-payload'
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

    const detail = buildRecordDetailPayload(
      rows,
      {
        name: 'Ada',
        overall_status: 'new'
      },
      EMPTY_DETAIL_SATELLITES,
      undefined
    )

    expect(detail.layout.version).toBe(1)
    expect(detail.layout.sections[0]?.field_keys).toEqual(['name', 'overall_status'])
    expect(detail.fields).toHaveLength(2)
    expect(detail.fields[0]?.value).toBe('Ada')
    expect(detail.fields[1]?.select_options).toEqual([
      { id: 'new', label: 'New' },
      { id: 'active', label: 'Active' }
    ])
  })

  it('loads tags from satellite entries as payload array', () => {
    const rows = [
      {
        field_key: 'name',
        kind: 'text',
        label: 'Name',
        description: '',
        field_order: 10,
        config: {},
        is_system: false
      },
      {
        field_key: 'labels',
        kind: 'tags',
        label: 'Labels',
        description: '',
        field_order: 20,
        config: {},
        is_system: false
      }
    ] as RecordTypeFieldRow[]

    const detail = buildRecordDetailPayload(
      rows,
      { name: 'Bob' },
      {
        field_entries: [
          {
            id: 'e1',
            record_id: 'r1',
            field_key: 'labels',
            entry_type: 'tags',
            sort_order: 10,
            payload: { value: 'urgent' },
            created_at: new Date(),
            updated_at: new Date()
          }
        ],
        connections: []
      },
      undefined
    )

    expect(detail.fields[0]?.value).toBe('Bob')
    expect(detail.fields[1]?.value).toEqual([{ value: 'urgent' }])
  })

  it('respects meta.detail_layout for section grouping', () => {
    const rows = [
      {
        field_key: 'a',
        kind: 'text',
        label: 'A',
        description: '',
        field_order: 10,
        config: {},
        is_system: true
      },
      {
        field_key: 'b',
        kind: 'text',
        label: 'B',
        description: '',
        field_order: 20,
        config: {},
        is_system: true
      }
    ] as RecordTypeFieldRow[]

    const detail = buildRecordDetailPayload(rows, {}, EMPTY_DETAIL_SATELLITES, {
      detail_layout: {
        sections: [
          { id: 'top', title: 'Primary', field_keys: ['b', 'ghost'] }
        ]
      }
    })

    expect(detail.layout.sections).toHaveLength(2)
    expect(detail.layout.sections[0]?.id).toBe('top')
    expect(detail.layout.sections[0]?.field_keys).toEqual(['b'])
    expect(detail.layout.sections[1]?.id).toBe('_additional')
    expect(detail.layout.sections[1]?.field_keys).toEqual(['a'])
  })
})
