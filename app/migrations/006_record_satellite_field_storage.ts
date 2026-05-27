import { Kysely, sql } from 'kysely'

/**
 * Multi-valued / relational field payloads live outside `records.data`
 * (see docs/adr/0003-satellite-storage-for-complex-field-values.md).
 */
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('record_field_entries')
    .ifNotExists()
    .addColumn('id', 'uuid', col => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('record_id', 'uuid', col =>
      col.notNull().references('records.id').onDelete('cascade'),
    )
    .addColumn('field_key', 'text', col => col.notNull())
    .addColumn('entry_type', 'text', col => col.notNull())
    .addColumn('sort_order', 'integer', col => col.notNull().defaultTo(0))
    .addColumn('payload', 'jsonb', col => col.notNull().defaultTo(sql`'{}'::jsonb`))
    .addColumn('created_at', 'timestamptz', col => col.notNull().defaultTo(sql`now()`))
    .addColumn('updated_at', 'timestamptz', col => col.notNull().defaultTo(sql`now()`))
    .execute()

  await db.schema
    .createIndex('record_field_entries_record_field_idx')
    .ifNotExists()
    .on('record_field_entries')
    .columns(['record_id', 'field_key'])
    .execute()

  await db.schema
    .createTable('record_connections')
    .ifNotExists()
    .addColumn('id', 'uuid', col => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('record_id', 'uuid', col =>
      col.notNull().references('records.id').onDelete('cascade'),
    )
    .addColumn('field_key', 'text', col => col.notNull())
    .addColumn('connected_record_id', 'uuid', col =>
      col.notNull().references('records.id').onDelete('cascade'),
    )
    .addColumn('sort_order', 'integer', col => col.notNull().defaultTo(0))
    .addColumn('meta', 'jsonb', col => col.notNull().defaultTo(sql`'{}'::jsonb`))
    .addColumn('created_at', 'timestamptz', col => col.notNull().defaultTo(sql`now()`))
    .addColumn('updated_at', 'timestamptz', col => col.notNull().defaultTo(sql`now()`))
    .execute()

  await db.schema
    .createIndex('record_connections_source_field_idx')
    .ifNotExists()
    .on('record_connections')
    .columns(['record_id', 'field_key'])
    .execute()

  await db.schema
    .createIndex('record_connections_target_idx')
    .ifNotExists()
    .on('record_connections')
    .column('connected_record_id')
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('record_connections').ifExists().execute()
  await db.schema.dropTable('record_field_entries').ifExists().execute()
}
