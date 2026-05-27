import { Kysely } from 'kysely'

/** Must match seeded UUIDs from `005_seed_contacts_and_groups`. */
const CONTACTS_TYPE_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa01'
const GROUPS_TYPE_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa02'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('record_type_fields')
    .addColumn('is_system', 'boolean', col => col.notNull().defaultTo(false))
    .execute()

  /** Flag shipped seed definitions so PATCH/DELETE stay locked (M2). */
  await db
    .updateTable('record_type_fields')
    .set({ is_system: true })
    .where('record_type_id', '=', CONTACTS_TYPE_ID)
    .where('field_key', 'in', ['name', 'nickname', 'overall_status'])
    .execute()

  await db
    .updateTable('record_type_fields')
    .set({ is_system: true })
    .where('record_type_id', '=', GROUPS_TYPE_ID)
    .where('field_key', 'in', ['name', 'group_status', 'group_type'])
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('record_type_fields')
    .dropColumn('is_system')
    .execute()
}
