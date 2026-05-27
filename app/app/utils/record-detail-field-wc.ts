import type { DetailFieldViewModel } from '~/types/record-detail-payload'

export type DtOption = { id: string, label: string }

/** Kinds Phase 04 save path merges into `record.data` via `pickScalarFieldPatch`. */
export const DETAIL_SCALAR_EDITOR_KINDS = new Set(['text', 'key_select'])

export function configOptions(field: DetailFieldViewModel): DtOption[] {
  const raw = field.config.options
  if (!Array.isArray(raw)) return []
  const out: DtOption[] = []
  for (const o of raw) {
    if (
      o !== null
      && typeof o === 'object'
      && 'key' in o
      && 'label' in o
      && typeof (o as { key: unknown }).key === 'string'
      && typeof (o as { label: unknown }).label === 'string'
    ) {
      out.push({ id: (o as { key: string }).key, label: (o as { label: string }).label })
    }
  }
  return out
}

/** `multi_select` / `tags` satellite strings or option keys → chip strings for `dt-multi-select` / `dt-tags`. */
export function multiSelectChipValues(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  const out: string[] = []
  for (const v of raw) {
    if (typeof v === 'string' && v.length) out.push(v)
    else if (v !== null && typeof v === 'object' && 'value' in v && typeof (v as { value: unknown }).value === 'string') {
      const s = (v as { value: string }).value.trim()
      if (s.length) out.push(s)
    }
  }
  return out
}

function asRecordPayloads(raw: unknown): Record<string, unknown>[] {
  if (!Array.isArray(raw)) return []
  return raw.filter((x): x is Record<string, unknown> => x !== null && typeof x === 'object' && !Array.isArray(x))
}

/** Shapes `{ key?, value?, ... }` rows for `dt-multi-text` (communication_channel, links, coarse locations). */
export function payloadsToMultiTextRows(raw: unknown, kind: string): Record<string, unknown>[] {
  return asRecordPayloads(raw).map((p, index) => {
    const row: Record<string, unknown> = { ...p }
    if (kind === 'link') {
      row.key = typeof p.type === 'string' && p.type ? p.type : 'link'
      row.value = String(p.value ?? '')
    } else if (kind === 'communication_channel') {
      row.key = typeof p.key === 'string' && p.key ? p.key : 'main'
      row.value = String(p.value ?? '')
    } else {
      row.key = typeof p.grid_meta_id === 'string' ? p.grid_meta_id : typeof p.label === 'string' ? p.label : 'point'
      const label = typeof p.label === 'string' ? p.label : ''
      const lat = typeof p.lat === 'number' ? String(p.lat) : typeof p.lat === 'string' ? p.lat : ''
      const lng = typeof p.lng === 'number' ? String(p.lng) : typeof p.lng === 'string' ? p.lng : ''
      const bits = [label, lat && lng ? `${lat}, ${lng}` : lat || lng].filter(Boolean)
      row.value = bits.join(bits.length > 1 ? ' — ' : '') || JSON.stringify(p)
    }
    row.tempKey = `vwc-${kind}-${index}`
    row.id = row.tempKey
    return row
  })
}

/** `dt-users-connection` / similar tags-style components expect `{ id, label }[]`. */
export function usersConnectionObjects(raw: unknown): Array<{ id: string, label: string }> {
  const ids: string[] = []
  if (Array.isArray(raw)) {
    for (const x of raw) {
      if (typeof x === 'string' && x.trim()) ids.push(x.trim())
    }
  } else if (typeof raw === 'string' && raw.trim()) {
    ids.push(raw.trim())
  }
  return ids.map((id) => {
    const label = id.length > 24 ? `${id.slice(0, 12)}…${id.slice(-6)}` : id
    return { id, label }
  })
}

export function connectionChipItems(raw: unknown): DtOption[] {
  if (!Array.isArray(raw)) return []
  return raw.map((id, index) => {
    if (typeof id === 'string' && id.length) {
      return { id, label: id.length > 12 ? `${id.slice(0, 8)}…` : id }
    }
    return { id: `unknown-${index}`, label: '(invalid id)' }
  })
}

/** `records.data` scalar shapes for booleans/dates coming from PostgreSQL/json. */
export function booleanChecked(raw: unknown): boolean {
  if (raw === true || raw === 1 || raw === '1') return true
  if (typeof raw === 'string') return raw.toLowerCase() === 'true'
  return false
}

export function dateIsoString(raw: unknown): string {
  if (raw === null || raw === undefined || raw === '') return ''
  if (typeof raw === 'string') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw.trim())) return raw.trim()
    const d = new Date(raw)
    if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10)
    return ''
  }
  const d = new Date(raw as Date)
  if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10)
  return ''
}
