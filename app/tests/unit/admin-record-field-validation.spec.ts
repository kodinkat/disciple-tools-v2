import { describe, expect, it } from 'vitest'
import {
  normalizeAdminFieldConfig,
  parseAdminFieldKey,
  parseAdminRecordTypeKey
} from '../../server/utils/admin-record-field-validation'

describe('parseAdminFieldKey', () => {
  it('accepts lowercase snake keys', () => {
    expect(parseAdminFieldKey(' cohort_name')).toEqual({
      ok: true,
      field_key: 'cohort_name'
    })
  })

  it('rejects upper case and dashed keys', () => {
    expect(parseAdminFieldKey('BAD').ok).toBe(false)
    expect(parseAdminFieldKey('a').ok).toBe(false)
    expect(parseAdminFieldKey('bad-key').ok).toBe(false)
  })
})

describe('parseAdminRecordTypeKey', () => {
  it('accepts hyphenated lowercase type keys', () => {
    expect(parseAdminRecordTypeKey('  My-Type ')).toEqual({
      ok: true,
      type_key: 'my-type'
    })
  })

  it('rejects bogus type keys', () => {
    expect(parseAdminRecordTypeKey('_bad').ok).toBe(false)
  })
})

describe('normalizeAdminFieldConfig', () => {
  it('normalises scalar kinds with allowed keys only', () => {
    expect(
      normalizeAdminFieldConfig('text', {
        required: true,
        placeholder: 'Name'
      })
    ).toEqual({
      ok: true,
      config: { required: true, placeholder: 'Name' }
    })
  })

  it('requires key_select options entries', () => {
    const missing = normalizeAdminFieldConfig('key_select', {})
    expect(missing.ok).toBe(false)
    if (!missing.ok) expect(missing.message.toLowerCase()).toContain('options')

    expect(normalizeAdminFieldConfig('key_select', { options: [] }).ok).toBe(false)
    const multi = normalizeAdminFieldConfig('key_select', {
      options: [{ key: 'a', label: 'A' }]
    })
    expect(multi).toEqual({
      ok: true,
      config: { options: [{ key: 'a', label: 'A' }] }
    })
  })

  it('rejects duplicate option keys', () => {
    expect(
      normalizeAdminFieldConfig('key_select', {
        options: [
          { key: 'x', label: 'One' },
          { key: 'x', label: 'Two' }
        ]
      }).ok
    ).toBe(false)
  })

  it('rejects stray config keys', () => {
    expect(
      normalizeAdminFieldConfig('text', {
        hello: true
      }).ok
    ).toBe(false)
  })
})
