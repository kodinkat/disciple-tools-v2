/** Normalize `text` / `key_select` values for PATCH diffing. */

export function scalarFieldString(value: unknown): string {
  if (value === null || value === undefined) return ''
  return String(value)
}

/**
 * Builds a PATCH `data` object with only editable keys whose draft values differ
 * from baseline (scalar string comparison).
 */
export function pickScalarFieldPatch(
  baseline: Record<string, unknown>,
  draft: Record<string, unknown>,
  keys: readonly string[]
): Record<string, unknown> {
  const patch: Record<string, unknown> = {}
  for (const key of keys) {
    const b = scalarFieldString(baseline[key])
    const d = scalarFieldString(draft[key])
    if (b !== d) {
      patch[key] = draft[key] ?? ''
    }
  }
  return patch
}
