/** v1-aligned system record slugs seeded in migration `005_seed_contacts_and_groups`. */
export const RECORD_TYPE_SLUGS = ['contacts', 'groups'] as const

export type RecordTypeSlug = (typeof RECORD_TYPE_SLUGS)[number]

export function isRecordTypeSlug(value: string): value is RecordTypeSlug {
  return (RECORD_TYPE_SLUGS as readonly string[]).includes(value)
}
