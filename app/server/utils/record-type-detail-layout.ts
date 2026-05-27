import { createError } from 'h3'
import type { RecordDetailLayout } from '../../app/types/record-detail-payload'
import { RECORD_DETAIL_LAYOUT_VERSION } from '../../app/types/record-detail-payload'
import type { RecordTypeFieldRow } from './record-mutations'

const DEFAULT_SECTION_TITLE = 'Details'

/** Stored under `record_types.meta.detail_layout` (optional). `tiles` accepted as legacy alias only. */
export type DetailLayoutMetaInput = Readonly<{
  sections?: ReadonlyArray<
    Readonly<{
      id?: unknown
      title?: unknown
      field_keys?: unknown
    }>
  >
}>

export function coerceDetailLayoutFromRecordTypeMeta(
  meta: Record<string, unknown> | undefined | null
): DetailLayoutMetaInput | null {
  const raw = meta?.detail_layout ?? meta?.tiles
  if (!raw || typeof raw !== 'object' || raw === null) {
    return null
  }
  if (!Array.isArray((raw as { sections?: unknown }).sections)) {
    return null
  }
  return raw as DetailLayoutMetaInput
}

type SectionBuilt = Readonly<{
  id: string
  title: string | null
  field_keys: readonly string[]
}>

/**
 * Applies section ordering from meta: keeps only registry keys; first section wins duplicates.
 * @param appendRemainder — READ path injects leftovers as `_additional`; PERSIST skips that.
 */
function materializeSections(
  sortedFieldRows: readonly RecordTypeFieldRow[],
  fromMeta: DetailLayoutMetaInput | null,
  appendRemainder: boolean
): SectionBuilt[] {
  const orderedKeys = sortedFieldRows.map(r => r.field_key)
  const allowed = new Set(orderedKeys)

  if (
    !fromMeta?.sections
    || !Array.isArray(fromMeta.sections)
    || fromMeta.sections.length === 0
  ) {
    return [
      {
        id: 'primary',
        title: DEFAULT_SECTION_TITLE,
        field_keys: [...orderedKeys]
      }
    ]
  }

  const consumed = new Set<string>()
  const out: SectionBuilt[] = []

  for (let i = 0; i < fromMeta.sections.length; i++) {
    const raw = fromMeta.sections[i]
    if (!raw || typeof raw !== 'object') {
      continue
    }

    let id = typeof raw.id === 'string' && raw.id.trim().length ? raw.id.trim() : `section-${i}`
    if (out.some(s => s.id === id)) {
      id = `${id}-${i}`
    }

    const title
      = raw.title === null || typeof raw.title === 'string' ? raw.title : null

    const keysSrc = raw.field_keys
    const keysOut: string[] = []
    if (Array.isArray(keysSrc)) {
      for (const k of keysSrc) {
        if (typeof k !== 'string') {
          continue
        }
        const key = k.trim()
        if (!allowed.has(key) || consumed.has(key)) {
          continue
        }
        consumed.add(key)
        keysOut.push(key)
      }
    }

    if (keysOut.length > 0 || typeof raw.field_keys !== 'undefined') {
      if (keysOut.length > 0) {
        out.push({ id, title: title ?? null, field_keys: keysOut })
      }
    }
  }

  const remainder = orderedKeys.filter(k => !consumed.has(k))
  if (appendRemainder && remainder.length > 0) {
    out.push({
      id: '_additional',
      title: 'Additional fields',
      field_keys: remainder
    })
  }

  if (out.length === 0) {
    return [
      {
        id: 'primary',
        title: DEFAULT_SECTION_TITLE,
        field_keys: [...orderedKeys]
      }
    ]
  }

  return out
}

/** Normalises sections used by record detail reads (remainder appended virtually). */
export function buildRecordDetailSections(
  sortedFieldRows: readonly RecordTypeFieldRow[],
  meta: Record<string, unknown> | undefined | null
): RecordDetailLayout['sections'] {
  return materializeSections(sortedFieldRows, coerceDetailLayoutFromRecordTypeMeta(meta), true)
}

/**
 * Validates a client/admin `detail_layout` body and returns the shape we persist in **`meta`**.
 * Omits **`_additional`** — orphan fields still render via **`buildRecordDetailSections`** on read.
 */
export function sanitizeDetailLayoutForPersist(
  layoutBody: Record<string, unknown>,
  sortedFieldRows: RecordTypeFieldRow[]
): Record<string, unknown> {
  if (!Array.isArray(layoutBody?.sections)) {
    throw createError({
      statusCode: 400,
      statusMessage: '`detail_layout.sections` must be an array'
    })
  }
  const pseudoMeta: DetailLayoutMetaInput = { sections: layoutBody.sections }
  const sections = materializeSections(sortedFieldRows, pseudoMeta, false)
  return { sections }
}

export function buildStaticRecordDetailLayoutKernel(
  sections: RecordDetailLayout['sections']
): RecordDetailLayout {
  return {
    version: RECORD_DETAIL_LAYOUT_VERSION,
    sections
  }
}
