import { Kysely, sql } from 'kysely'

/** Stable IDs so seeds are explicit; matches ADR 0001 seed pattern. */
export const CONTACTS_TYPE_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa01'
export const GROUPS_TYPE_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa02'

export async function up(db: Kysely<any>): Promise<void> {
  const now = new Date().toISOString()

  await db
    .insertInto('record_types')
    .values({
      id: CONTACTS_TYPE_ID,
      type_key: 'contacts',
      label: 'Contact',
      label_plural: 'Contacts',
      description: 'Default contact functionality (v1: contacts_base module).',
      is_system: true,
      created_at: now,
      updated_at: now,
      meta: sql`'{}'::jsonb`,
    })
    .onConflict(oc => oc.column('type_key').doNothing())
    .execute()

  await db
    .insertInto('record_types')
    .values({
      id: GROUPS_TYPE_ID,
      type_key: 'groups',
      label: 'Group',
      label_plural: 'Groups',
      description: 'Track church health and generational growth (v1: groups_base module).',
      is_system: true,
      created_at: now,
      updated_at: now,
      meta: sql`'{}'::jsonb`,
    })
    .onConflict(oc => oc.column('type_key').doNothing())
    .execute()

  const contactFields = [
    {
      field_key: 'name',
      kind: 'text',
      label: 'Name',
      description: 'Display name for the contact (v1 post title / name).',
      field_order: 10,
      config: { required: true, v1_field: 'name' },
    },
    {
      field_key: 'nickname',
      kind: 'text',
      label: 'Nickname',
      description: '',
      field_order: 20,
      config: { v1_field: 'nickname' },
    },
    {
      field_key: 'overall_status',
      kind: 'key_select',
      label: 'Contact status',
      description: 'Lifecycle status (v1 overall_status).',
      field_order: 30,
      config: {
        v1_field: 'overall_status',
        options: [
          { key: 'new', label: 'New' },
          { key: 'active', label: 'Active' },
          { key: 'paused', label: 'Paused' },
          { key: 'closed', label: 'Archived' },
        ],
        default_key: 'new',
      },
    },
  ]

  const groupFields = [
    {
      field_key: 'name',
      kind: 'text',
      label: 'Group name',
      description: 'Display name (v1 post title).',
      field_order: 10,
      config: { required: true, v1_field: 'name' },
    },
    {
      field_key: 'group_status',
      kind: 'key_select',
      label: 'Group status',
      description: 'Whether the group is meeting (v1 group_status).',
      field_order: 20,
      config: {
        v1_field: 'group_status',
        options: [
          { key: 'active', label: 'Active' },
          { key: 'inactive', label: 'Inactive' },
        ],
        default_key: 'active',
      },
    },
    {
      field_key: 'group_type',
      kind: 'key_select',
      label: 'Group type',
      description: 'Pre-group, group, church, or team (v1 group_type).',
      field_order: 30,
      config: {
        v1_field: 'group_type',
        options: [
          { key: 'pre-group', label: 'Pre-Group' },
          { key: 'group', label: 'Group' },
          { key: 'church', label: 'Church' },
          { key: 'team', label: 'Team' },
        ],
        default_key: 'group',
      },
    },
  ]

  for (const f of contactFields) {
    await db
      .insertInto('record_type_fields')
      .values({
        record_type_id: CONTACTS_TYPE_ID,
        field_key: f.field_key,
        kind: f.kind,
        label: f.label,
        description: f.description,
        field_order: f.field_order,
        config: sql`${JSON.stringify(f.config)}::jsonb`,
      })
      .onConflict(oc => oc.columns(['record_type_id', 'field_key']).doNothing())
      .execute()
  }

  for (const f of groupFields) {
    await db
      .insertInto('record_type_fields')
      .values({
        record_type_id: GROUPS_TYPE_ID,
        field_key: f.field_key,
        kind: f.kind,
        label: f.label,
        description: f.description,
        field_order: f.field_order,
        config: sql`${JSON.stringify(f.config)}::jsonb`,
      })
      .onConflict(oc => oc.columns(['record_type_id', 'field_key']).doNothing())
      .execute()
  }
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.deleteFrom('records').where('record_type_id', 'in', [CONTACTS_TYPE_ID, GROUPS_TYPE_ID]).execute()
  await db.deleteFrom('record_type_fields').where('record_type_id', 'in', [CONTACTS_TYPE_ID, GROUPS_TYPE_ID]).execute()
  await db.deleteFrom('record_types').where('id', 'in', [CONTACTS_TYPE_ID, GROUPS_TYPE_ID]).execute()
}
