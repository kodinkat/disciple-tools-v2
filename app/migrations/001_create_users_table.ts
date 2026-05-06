import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('users')
    .ifNotExists()
    .addColumn('id', 'uuid', col => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('created', 'timestamptz', col => col.notNull().defaultTo(sql`now()`))
    .addColumn('updated', 'timestamptz', col => col.notNull().defaultTo(sql`now()`))
    .addColumn('email', 'text', col => col.unique().notNull())
    .addColumn('display_name', 'text', col => col.notNull())
    .addColumn('avatar', 'text', col => col.notNull().defaultTo(''))
    .addColumn('password', 'text')
    .addColumn('verified', 'boolean', col => col.notNull().defaultTo(false))
    .addColumn('roles', sql`text[]`, col => col.notNull().defaultTo(sql`ARRAY['member']::text[]`))
    .addColumn('token_key', 'text', col => col.notNull().defaultTo(sql`gen_random_uuid()::text`))
    .addColumn('token_expires_at', 'timestamptz')
    .addColumn('pending_email', 'text')
    .addColumn('email_change_token', 'text')
    .execute()

  await db.schema
    .createIndex('users_token_key_unique')
    .ifNotExists()
    .on('users')
    .column('token_key')
    .unique()
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropIndex('users_token_key_unique').ifExists().execute()
  await db.schema.dropTable('users').ifExists().execute()
}
