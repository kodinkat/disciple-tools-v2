import { describe, expect, it } from 'vitest'
import { assertPatchAvoidsSatelliteFieldKeys } from '../../server/utils/record-patch-guards'
import type { RecordTypeFieldRow } from '../../server/utils/record-mutations'

describe('assertPatchAvoidsSatelliteFieldKeys', () => {
  it('allows data-backed fields', () => {
    expect(() =>
      assertPatchAvoidsSatelliteFieldKeys(
        { name: 'x' },
        [
          {
            field_key: 'name',
            kind: 'text'
          }
        ] as RecordTypeFieldRow[]
      )
    ).not.toThrow()
  })

  it('blocks entry-table kinds registered on the schema', () => {
    expect(() =>
      assertPatchAvoidsSatelliteFieldKeys(
        { phones: [] },
        [
          {
            field_key: 'phones',
            kind: 'communication_channel'
          }
        ] as RecordTypeFieldRow[]
      )
    ).toThrow()
  })
})
