import { describe, expect, it } from 'vitest'
import { pickScalarFieldPatch, scalarFieldString } from '../../app/utils/record-field-patch'

describe('scalarFieldString', () => {
  it('stringifies primitives and ignores null-ish', () => {
    expect(scalarFieldString(null)).toBe('')
    expect(scalarFieldString(undefined)).toBe('')
    expect(scalarFieldString('a')).toBe('a')
    expect(scalarFieldString(42)).toBe('42')
  })
})

describe('pickScalarFieldPatch', () => {
  it('returns empty when drafts match baseline', () => {
    expect(
      pickScalarFieldPatch(
        { name: 'A', stage: 'x' },
        { name: 'A', stage: 'x' },
        ['name', 'stage']
      )
    ).toEqual({})
  })

  it('includes keys that differ after normalization', () => {
    expect(
      pickScalarFieldPatch(
        { name: 'Old', unused: 'u' },
        { name: 'New', unused: 'u' },
        ['name']
      )
    ).toEqual({ name: 'New' })
  })

  it('treats null and empty string as equal', () => {
    expect(pickScalarFieldPatch({ note: null }, { note: '' }, ['note'])).toEqual({})
  })

  it('emits change when clearing a value vs baseline', () => {
    expect(
      pickScalarFieldPatch({ nick: 'x' }, { nick: '' }, ['nick'])
    ).toEqual({ nick: '' })
  })
})
