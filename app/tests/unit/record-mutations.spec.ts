import { describe, it, expect } from 'vitest'
import type { RecordTypeFieldRow } from '../../server/utils/record-mutations'
import {
  applyKeySelectDefaults,
  assertRequiredFields,
  assertUuid
} from '../../server/utils/record-mutations'

function field(
  overrides: Partial<RecordTypeFieldRow> & Pick<RecordTypeFieldRow, 'field_key' | 'kind'>
): RecordTypeFieldRow {
  return {
    id: '00000000-0000-4000-8000-000000000001',
    record_type_id: '00000000-0000-4000-8000-000000000002',
    label: '',
    description: '',
    field_order: 0,
    config: {},
    ...overrides
  }
}

describe('applyKeySelectDefaults', () => {
  it('sets default_key for key_select when value is undefined', () => {
    const rows = [
      field({
        field_key: 'overall_status',
        kind: 'key_select',
        config: { default_key: 'new' }
      })
    ]
    expect(applyKeySelectDefaults(rows, {})).toEqual({
      overall_status: 'new'
    })
  })

  it('does not overwrite an explicit value', () => {
    const rows = [
      field({
        field_key: 'overall_status',
        kind: 'key_select',
        config: { default_key: 'new' }
      })
    ]
    expect(applyKeySelectDefaults(rows, { overall_status: 'active' })).toEqual({
      overall_status: 'active'
    })
  })

  it('ignores non-key_select fields', () => {
    const rows = [field({ field_key: 'name', kind: 'text', config: {} })]
    expect(applyKeySelectDefaults(rows, {})).toEqual({})
  })
})

describe('assertRequiredFields', () => {
  it('allows row when required field present', () => {
    const rows = [
      field({
        field_key: 'name',
        kind: 'text',
        config: { required: true }
      })
    ]
    expect(() =>
      assertRequiredFields(rows, { name: 'Ada' })
    ).not.toThrow()
  })

  it('throws 400 when required string empty', () => {
    const rows = [
      field({
        field_key: 'name',
        kind: 'text',
        config: { required: true }
      })
    ]
    try {
      assertRequiredFields(rows, { name: '  ' })
      expect.fail('expected throw')
    } catch (e: unknown) {
      expect(e).toMatchObject({
        statusCode: 400,
        statusMessage: 'Missing required field: name'
      })
    }
  })
})

describe('assertUuid', () => {
  it('allows valid lowercase v4-ish uuid', () => {
    expect(() =>
      assertUuid('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa01')
    ).not.toThrow()
  })

  it('throws 400 when invalid', () => {
    try {
      assertUuid('nope')
      expect.fail('expected throw')
    } catch (e: unknown) {
      expect(e).toMatchObject({
        statusCode: 400,
        statusMessage: 'Invalid id'
      })
    }
  })
})
