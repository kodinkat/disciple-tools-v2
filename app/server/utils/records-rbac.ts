import type { H3Event } from 'h3'
import type { Permission } from '~~/app/utils/permissions'
import { requirePermission } from './rbac'
import { isRecordTypeSlug } from './record-type-slugs'

export async function requireRecordVerb(
  event: H3Event,
  typeKey: string,
  verb: 'read' | 'write' | 'create' | 'delete',
) {
  if (!isRecordTypeSlug(typeKey)) {
    throw createError({
      statusCode: 404,
      statusMessage: `Unknown record type: ${typeKey}`,
    })
  }
  const perm = `records.${typeKey}.${verb}` as Permission
  return requirePermission(event, perm)
}
