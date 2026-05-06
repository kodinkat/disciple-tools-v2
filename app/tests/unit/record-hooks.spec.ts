import { describe, it, expect } from 'vitest'
import { runPostCreateFields, runPostUpdateFields } from '../../server/utils/record-hooks'

describe('record-hooks', () => {
  it('runPostCreateFields returns input when no listeners registered', async () => {
    expect(await runPostCreateFields('contacts', { x: 1 })).toEqual({ x: 1 })
  })

  it('runPostUpdateFields returns input when no listeners registered', async () => {
    expect(await runPostUpdateFields('groups', { name: 'G' })).toEqual({ name: 'G' })
  })
})
