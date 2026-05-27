import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('record_types')
    .ifNotExists()
    .addColumn('id', 'uuid', col => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('type_key', 'text', col => col.notNull().unique())
    .addColumn('label', 'text', col => col.notNull())
    .addColumn('label_plural', 'text', col => col.notNull())
    .addColumn('description', 'text', col => col.notNull().defaultTo(''))
    .addColumn('is_system', 'boolean', col => col.notNull().defaultTo(true))
    .addColumn('created_at', 'timestamptz', col => col.notNull().defaultTo(sql`now()`))
    .addColumn('updated_at', 'timestamptz', col => col.notNull().defaultTo(sql`now()`))
    .addColumn('meta', 'jsonb', col => col.notNull().defaultTo(sql`'{}'::jsonb`))
    .execute()

  await db.schema
    .createTable('record_type_fields')
    .ifNotExists()
    .addColumn('id', 'uuid', col => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('record_type_id', 'uuid', col =>
      col.notNull().references('record_types.id').onDelete('cascade'),
    )
    .addColumn('field_key', 'text', col => col.notNull())
    .addColumn('kind', 'text', col => col.notNull())
    .addColumn('label', 'text', col => col.notNull())
    .addColumn('description', 'text', col => col.notNull().defaultTo(''))
    .addColumn('field_order', 'integer', col => col.notNull().defaultTo(0))
    .addColumn('config', 'jsonb', col => col.notNull().defaultTo(sql`'{}'::jsonb`))
    .execute()

  await db.schema
    .createIndex('record_type_fields_type_key_unique')
    .ifNotExists()
    .on('record_type_fields')
    .columns(['record_type_id', 'field_key'])
    .unique()
    .execute()

  await db.schema
    .createIndex('record_type_fields_type_order')
    .ifNotExists()
    .on('record_type_fields')
    .columns(['record_type_id', 'field_order'])
    .execute()

  await db.schema
    .createTable('records')
    .ifNotExists()
    .addColumn('id', 'uuid', col => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('record_type_id', 'uuid', col =>
      col.notNull().references('record_types.id').onDelete('restrict'),
    )
    .addColumn('created_at', 'timestamptz', col => col.notNull().defaultTo(sql`now()`))
    .addColumn('updated_at', 'timestamptz', col => col.notNull().defaultTo(sql`now()`))
    .addColumn('created_by', 'uuid', col => col.references('users.id').onDelete('set null'))
    .addColumn('data', 'jsonb', col => col.notNull().defaultTo(sql`'{}'::jsonb`))
    .execute()

  await db.schema
    .createIndex('records_type_idx')
    .ifNotExists()
    .on('records')
    .column('record_type_id')
    .execute()

  await db.schema
    .createIndex('records_updated_idx')
    .ifNotExists()
    .on('records')
    .expression(sql`updated_at DESC`)
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('records').ifExists().execute()
  await db.schema.dropTable('record_type_fields').ifExists().execute()
  await db.schema.dropTable('record_types').ifExists().execute()
}
