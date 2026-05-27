import { describe, expect, it } from 'vitest'
import {
  CONNECTION_FIELD_KIND,
  fieldValueStorage,
  fieldValuesLiveInConnectionTable,
  fieldValuesLiveInEntryTable,
  fieldValuesLiveInRecordData,
  KNOWN_FIELD_KINDS
} from '../../server/utils/record-field-storage'

describe('KNOWN_FIELD_KINDS', () => {
  it('covers satellite, scalars, and connection', () => {
    expect(KNOWN_FIELD_KINDS.has('tags')).toBe(true)
    expect(KNOWN_FIELD_KINDS.has(CONNECTION_FIELD_KIND)).toBe(true)
    expect(KNOWN_FIELD_KINDS.has('textarea')).toBe(true)
    expect(KNOWN_FIELD_KINDS.has('bogus')).toBe(false)
  })
})

describe('record-field-storage (ADR 0003 routing)', () => {
  it('routes scalar and multi_select kinds to records.data', () => {
    expect(fieldValuesLiveInRecordData('text')).toBe(true)
    expect(fieldValuesLiveInRecordData('key_select')).toBe(true)
    expect(fieldValuesLiveInRecordData('multi_select')).toBe(true)
  })

  it('routes satellite entry kinds away from records.data', () => {
    expect(fieldValuesLiveInRecordData('communication_channel')).toBe(false)
    expect(fieldValuesLiveInEntryTable('communication_channel')).toBe(true)
    expect(fieldValuesLiveInEntryTable('tags')).toBe(true)
  })

  it('routes connection kind to record_connections', () => {
    expect(fieldValuesLiveInRecordData(CONNECTION_FIELD_KIND)).toBe(false)
    expect(fieldValuesLiveInConnectionTable(CONNECTION_FIELD_KIND)).toBe(true)
  })
})

describe('fieldValueStorage', () => {
  it('maps kinds to buckets', () => {
    expect(fieldValueStorage('text')).toBe('data')
    expect(fieldValueStorage('communication_channel')).toBe('entries')
    expect(fieldValueStorage('connection')).toBe('connections')
    expect(fieldValueStorage('unknown_future_kind')).toBe('data')
  })
})
