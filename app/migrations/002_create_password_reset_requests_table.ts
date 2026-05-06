import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('password_reset_requests')
    .ifNotExists()
    .addColumn('id', 'uuid', col => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('created', 'timestamptz', col => col.notNull().defaultTo(sql`now()`))
    .addColumn('expires', 'timestamptz', col => col.notNull())
    .addColumn('user_id', 'uuid', col =>
      col
        .notNull()
        .references('users.id')
        .onDelete('cascade'),
    )
    .addColumn('token', 'text', col => col.notNull().unique())
    .addColumn('used', 'boolean', col => col.notNull().defaultTo(false))
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('password_reset_requests').ifExists().execute()
}
