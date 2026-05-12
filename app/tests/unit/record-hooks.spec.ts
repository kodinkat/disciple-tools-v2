import { describe, it, expect, beforeEach } from 'vitest'
import {
  registerRecordAfterList,
  registerRecordBeforeList,
  resetRecordHooksForTests,
  runAfterList,
  runBeforeList,
  runPostCreateFields,
  runPostUpdateFields
} from '../../server/utils/record-hooks'

beforeEach(() => {
  resetRecordHooksForTests()
})

describe('record-hooks', () => {
  it('runPostCreateFields returns input when no listeners registered', async () => {
    expect(await runPostCreateFields('contacts', { x: 1 })).toEqual({ x: 1 })
  })

  it('runPostUpdateFields returns input when no listeners registered', async () => {
    expect(await runPostUpdateFields('groups', { name: 'G' })).toEqual({ name: 'G' })
  })

  describe('listing hooks', () => {
    const baseCtx = {
      typeKey: 'contacts',
      recordTypeId: 'rtype-1',
      fieldKeys: ['name'] as const,
      limit: 50,
      offset: 0,
      sortRaw: '-updated_at',
      qSearch: null as string | null,
      equalityFilters: {} as Record<string, string>
    }

    it('runBeforeList returns parsed list state when no listeners registered', async () => {
      const out = await runBeforeList(baseCtx)
      expect(out).toEqual({
        limit: 50,
        offset: 0,
        sortRaw: '-updated_at',
        qSearch: null,
        equalityFilters: {}
      })
    })

    it('runBeforeList applies listener transforms', async () => {
      registerRecordBeforeList(ctx => ({
        limit: Math.min(ctx.limit, 10),
        equalityFilters: { ...ctx.equalityFilters, name: 'pat' }
      }))
      const out = await runBeforeList(baseCtx)
      expect(out.limit).toBe(10)
      expect(out.equalityFilters.name).toBe('pat')
    })

    it('runAfterList returns input when no listeners registered', async () => {
      const payload = {
        typeKey: 'contacts',
        records: [
          {
            id: '1',
            type_key: 'contacts',
            created_at: '2020-01-01',
            updated_at: '2020-01-01',
            created_by: null,
            data: { name: 'Ada' }
          }
        ],
        pagination: { limit: 25, offset: 0, total: 1 }
      }
      const out = await runAfterList(payload)
      expect(out.records).toEqual(payload.records)
      expect(out.pagination).toEqual(payload.pagination)
    })

    it('runAfterList merges listener results', async () => {
      registerRecordAfterList(({ records }) => ({
        records: records.map(r => ({
          ...r,
          data: { ...r.data, flagged: true }
        })),
        pagination: { total: 5 }
      }))
      const payload = {
        typeKey: 'contacts',
        records: [
          {
            id: '1',
            type_key: 'contacts',
            created_at: '2020-01-01',
            updated_at: '2020-01-01',
            created_by: null,
            data: {}
          }
        ],
        pagination: { limit: 25, offset: 0, total: 1 }
      }
      const out = await runAfterList(payload)
      expect(out.records[0]?.data.flagged).toBe(true)
      expect(out.pagination.total).toBe(5)
      expect(out.pagination.limit).toBe(25)
    })
  })
})
