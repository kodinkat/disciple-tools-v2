/**
 * Validates admin CRUD payloads for record_type_fields (M2 subset of v1 field settings).
 */

const FIELD_KEY_RE = /^[a-z][a-z0-9_]*$/

const DISALLOWED_KEYS = new Set(['__proto__', 'prototype', 'constructor'])

export type FieldKeyResult = { ok: true, field_key: string } | { ok: false, message: string }

export function parseAdminFieldKey(raw: unknown): FieldKeyResult {
  if (typeof raw !== 'string') {
    return { ok: false, message: 'field_key must be a string' }
  }
  const key = raw.trim()
  if (key.length < 2 || key.length > 64) {
    return {
      ok: false,
      message: 'field_key must be between 2 and 64 characters'
    }
  }
  if (!FIELD_KEY_RE.test(key)) {
    return {
      ok: false,
      message: 'field_key must start with a letter and contain only lowercase letters, digits, and underscores'
    }
  }
  if (DISALLOWED_KEYS.has(key)) {
    return { ok: false, message: 'field_key uses a reserved name' }
  }
  return { ok: true, field_key: key }
}

const RECORD_TYPE_KEY_RE = /^[a-z][a-z0-9_-]*$/

export type TypeKeyResult = { ok: true, type_key: string } | { ok: false, message: string }

export function parseAdminRecordTypeKey(raw: unknown): TypeKeyResult {
  if (typeof raw !== 'string') {
    return { ok: false, message: 'type_key must be a string' }
  }
  const key = raw.trim().toLowerCase()
  if (key.length < 2 || key.length > 48) {
    return {
      ok: false,
      message: 'type_key must be between 2 and 48 characters'
    }
  }
  if (!RECORD_TYPE_KEY_RE.test(key)) {
    return {
      ok: false,
      message: 'type_key must start with a letter and contain only lowercase letters, digits, underscores, and hyphens'
    }
  }
  return { ok: true, type_key: key }
}

export type ConfigResult
  = | { ok: true, config: Record<string, unknown> }
    | { ok: false, message: string }

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function expectBoolean(
  value: unknown,
  field: string,
  out: Record<string, unknown>
): string | undefined {
  if (value === undefined) return undefined
  if (typeof value !== 'boolean') {
    return `\`${field}\` must be a boolean`
  }
  out[field] = value
  return undefined
}

function expectString(
  value: unknown,
  field: string,
  out: Record<string, unknown>
): string | undefined {
  if (value === undefined) return undefined
  if (typeof value !== 'string') {
    return `\`${field}\` must be a string`
  }
  out[field] = value
  return undefined
}

function parseSelectOptions(
  rawOptions: unknown
): { ok: true, options: { key: string, label: string }[] } | { ok: false, message: string } {
  if (rawOptions === undefined) {
    return {
      ok: false,
      message:
        'Missing `options`: set `"options": [{ "key": "value_key", "label": "Shown label" }]` with at least one entry'
    }
  }
  if (!Array.isArray(rawOptions)) {
    return {
      ok: false,
      message:
        '`options` must be an array of `{ "key": string, "label": string }` objects'
    }
  }
  const options: { key: string, label: string }[] = []
  for (const entry of rawOptions) {
    if (!isPlainObject(entry)) {
      return { ok: false, message: 'Each option must be an object with key and label' }
    }
    const k = entry.key
    const label = entry.label
    if (typeof k !== 'string' || k.trim() === '') {
      return { ok: false, message: 'Each option.key must be a non-empty string' }
    }
    if (typeof label !== 'string' || label.trim() === '') {
      return { ok: false, message: 'Each option.label must be a non-empty string' }
    }
    options.push({ key: k.trim(), label: label.trim() })
  }
  if (options.length === 0) {
    return { ok: false, message: '`options` must include at least one entry' }
  }
  const seen = new Set<string>()
  for (const o of options) {
    if (seen.has(o.key)) {
      return { ok: false, message: `Duplicate option key: ${o.key}` }
    }
    seen.add(o.key)
  }
  return { ok: true, options }
}

function keysExcept(obj: Record<string, unknown>, allow: readonly string[]): string[] {
  const s = new Set(allow)
  return Object.keys(obj).filter(k => !s.has(k))
}

function finishConfig(
  out: Record<string, unknown>,
  raw: Record<string, unknown>,
  allow: readonly string[]
): ConfigResult {
  const extra = keysExcept(raw, allow)
  if (extra.length > 0) {
    return {
      ok: false,
      message: `Unknown config keys: ${extra.sort().join(', ')}`
    }
  }
  return { ok: true, config: out }
}

/**
 * Validates and normalizes `config` JSON for the given kind.
 * Allowed keys mirror a minimal v1-compatible subset ([dt-posts-field-settings.md](disciple-tools-theme)).
 */
export function normalizeAdminFieldConfig(kind: string, raw: unknown): ConfigResult {
  if (raw === undefined || raw === null) {
    return { ok: true, config: {} }
  }
  if (!isPlainObject(raw)) {
    return { ok: false, message: '`config` must be a plain object' }
  }

  const out: Record<string, unknown> = {}

  switch (kind) {
    case 'text':
    case 'textarea': {
      const err
        = expectBoolean(raw.required, 'required', out)
          ?? expectBoolean(raw.private, 'private', out)
          ?? expectString(raw.placeholder, 'placeholder', out)
          ?? expectString(raw.v1_field, 'v1_field', out)
      if (err) return { ok: false, message: err }
      return finishConfig(out, raw, ['required', 'private', 'placeholder', 'v1_field'])
    }

    case 'number': {
      if (raw.min !== undefined) {
        const n = raw.min
        if (typeof n !== 'number' || Number.isNaN(n)) {
          return { ok: false, message: '`min` must be a number' }
        }
        out.min = n
      }
      if (raw.max !== undefined) {
        const n = raw.max
        if (typeof n !== 'number' || Number.isNaN(n)) {
          return { ok: false, message: '`max` must be a number' }
        }
        out.max = n
      }

      const err
        = expectBoolean(raw.required, 'required', out)
          ?? expectString(raw.v1_field, 'v1_field', out)
      if (err) return { ok: false, message: err }

      if (typeof out.min === 'number' && typeof out.max === 'number' && out.min > out.max) {
        return { ok: false, message: '`min` cannot be greater than `max`' }
      }

      return finishConfig(out, raw, ['required', 'v1_field', 'min', 'max'])
    }

    case 'boolean':
    case 'date': {
      const err
        = expectBoolean(raw.required, 'required', out)
          ?? expectString(raw.v1_field, 'v1_field', out)
      if (err) return { ok: false, message: err }
      return finishConfig(out, raw, ['required', 'v1_field'])
    }

    case 'user_select': {
      const err
        = expectBoolean(raw.required, 'required', out)
          ?? expectBoolean(raw.private, 'private', out)
          ?? expectBoolean(raw.multi, 'multi', out)
          ?? expectString(raw.v1_field, 'v1_field', out)
      if (err) return { ok: false, message: err }
      return finishConfig(out, raw, ['required', 'private', 'multi', 'v1_field'])
    }

    case 'key_select': {
      const parsed = parseSelectOptions(raw.options)
      if (!parsed.ok) return parsed
      out.options = parsed.options

      const err
        = expectBoolean(raw.required, 'required', out)
          ?? expectBoolean(raw.private, 'private', out)
          ?? expectString(raw.default_key, 'default_key', out)
          ?? expectString(raw.v1_field, 'v1_field', out)
      if (err) return { ok: false, message: err }

      return finishConfig(out, raw, [
        'required',
        'private',
        'default_key',
        'options',
        'v1_field'
      ])
    }

    case 'multi_select': {
      if (raw.default_keys !== undefined) {
        if (!Array.isArray(raw.default_keys) || raw.default_keys.some(dk => typeof dk !== 'string')) {
          return { ok: false, message: '`default_keys` must be an array of strings' }
        }
        out.default_keys = [...raw.default_keys]
      }

      const parsed = parseSelectOptions(raw.options)
      if (!parsed.ok) return parsed
      out.options = parsed.options

      const err
        = expectBoolean(raw.required, 'required', out)
          ?? expectBoolean(raw.private, 'private', out)
          ?? expectString(raw.v1_field, 'v1_field', out)
      if (err) return { ok: false, message: err }

      return finishConfig(out, raw, ['required', 'private', 'v1_field', 'default_keys', 'options'])
    }

    case 'communication_channel':
    case 'link':
    case 'location':
    case 'location_meta':
    case 'tags': {
      const err
        = expectBoolean(raw.required, 'required', out)
          ?? expectBoolean(raw.private, 'private', out)
          ?? expectString(raw.v1_field, 'v1_field', out)
      if (err) return { ok: false, message: err }
      return finishConfig(out, raw, ['required', 'private', 'v1_field'])
    }

    case 'connection': {
      const err
        = expectBoolean(raw.required, 'required', out)
          ?? expectBoolean(raw.bidirectional, 'bidirectional', out)
          ?? expectString(raw.p2p_direction, 'p2p_direction', out)
          ?? expectString(raw.v1_field, 'v1_field', out)
      if (err) return { ok: false, message: err }
      if (raw.allowed_types !== undefined) {
        if (
          !Array.isArray(raw.allowed_types)
          || raw.allowed_types.some((t: unknown) => typeof t !== 'string')
        ) {
          return { ok: false, message: '`allowed_types` must be an array of record type_keys' }
        }
        out.allowed_types = [...raw.allowed_types]
      }
      return finishConfig(out, raw, ['required', 'bidirectional', 'p2p_direction', 'allowed_types', 'v1_field'])
    }

    default:
      return {
        ok: false,
        message: `No config rules defined for kind: ${kind}`
      }
  }
}
