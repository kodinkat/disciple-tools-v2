import { describe, expect, it } from 'vitest'
import {
  sanitizeDetailLayoutForPersist
} from '../../server/utils/record-type-detail-layout'
import type { RecordTypeFieldRow } from '../../server/utils/record-mutations'

describe('sanitizeDetailLayoutForPersist', () => {
  it('strips unknown keys and dedupes duplicates without remainder section', () => {
    const rows = [
      {
        field_key: 'first',
        field_order: 10
      },
      {
        field_key: 'second',
        field_order: 20
      }
    ] as RecordTypeFieldRow[]

    const cleaned = sanitizeDetailLayoutForPersist(
      {
        sections: [
          { id: 's1', title: 'One', field_keys: ['second', 'bogus', 'second'] },
          { id: 's2', field_keys: ['first'] }
        ]
      },
      rows
    )

    expect(cleaned).toEqual({
      sections: [
        { id: 's1', title: 'One', field_keys: ['second'] },
        { id: 's2', title: null, field_keys: ['first'] }
      ]
    })
  })
})
