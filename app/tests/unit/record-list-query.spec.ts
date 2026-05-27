import { describe, expect, it } from 'vitest'
import {
  coerceRecordEqualityFilters,
  escapeIlikePattern,
  parseRecordListQuery,
  parseRecordSort,
  sanitizeListingBounds
} from '../../server/utils/record-list-query'
import type { RecordTypeFieldRow } from '../../server/utils/record-mutations'

describe('record-list-query', () => {
  it('parseRecordListQuery defaults sort and respects limit', () => {
    const p = parseRecordListQuery({})
    expect(p.sortRaw).toBe('-updated_at')
    expect(p.limit).toBe(50)
  })

  it('parseRecordSort parses name desc', () => {
    const s = parseRecordSort('-name')
    expect(s).toEqual({ kind: 'json_text', path: 'name', direction: 'desc' })
  })

  it('coerceRecordEqualityFilters rejects unknown key', () => {
    const fields = [{ field_key: 'overall_status' }] as RecordTypeFieldRow[]
    expect(() =>
      coerceRecordEqualityFilters(fields, {
        overall_status: 'active',
        bad: 'x'
      })
    ).toThrow()
  })

  it('escapeIlikePattern escapes wildcards', () => {
    expect(escapeIlikePattern('%a_b\\')).toBe('\\%a\\_b\\\\')
  })

  it('sanitizeListingBounds clamps limit offset and trims qSearch', () => {
    expect(
      sanitizeListingBounds({
        limit: 999999,
        offset: -40,
        qSearch: '  hello '
      })
    ).toEqual({ limit: 100, offset: 0, qSearch: 'hello' })
  })
})
