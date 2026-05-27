import { Migrator } from 'kysely'
import type { Migration, MigrationProvider } from 'kysely'
import { db } from '../utils/database'

type MigrationSpec = {
  readonly name: string
  readonly loader: () => Promise<{ up: Migration['up'], down: Migration['down'] }>
}

/**
 * Kysely FileMigrationProvider uses Node's native dynamic import(), which
 * cannot load `.ts` in dev. Declare each migration here so Vite/Rollup
 * bundle them as normal JS chunks (same pattern holds for production builds).
 *
 * Migration names MUST sort lexically in execution order.
 * Adding a migration that sorts *before* an already-applied name will fail;
 * reorder or reset the DB in early development when that happens.
 */
const MIGRATION_SPECS: MigrationSpec[] = [
  {
    name: '001_create_users_table',
    loader: () => import('../../migrations/001_create_users_table')
  },
  {
    name: '002_create_password_reset_requests_table',
    loader: () => import('../../migrations/002_create_password_reset_requests_table')
  },
  {
    name: '003_create_activity_logs_table',
    loader: () => import('../../migrations/003_create_activity_logs_table')
  },
  {
    name: '004_create_record_storage_tables',
    loader: () => import('../../migrations/004_create_record_storage_tables')
  },
  {
    name: '005_seed_contacts_and_groups',
    loader: () => import('../../migrations/005_seed_contacts_and_groups')
  },
  {
    name: '006_record_satellite_field_storage',
    loader: () => import('../../migrations/006_record_satellite_field_storage')
  },
  {
    name: '007_record_type_fields_is_system',
    loader: () => import('../../migrations/007_record_type_fields_is_system')
  }
]

function createBundledMigrationProvider(): MigrationProvider {
  let cached: Record<string, Migration> | undefined

  return {
    async getMigrations() {
      if (cached) {
        return cached
      }

      cached = {}
      for (const { name, loader } of MIGRATION_SPECS) {
        const mod = await loader()
        if (typeof mod.up !== 'function' || typeof mod.down !== 'function') {
          throw new Error(`Migration ${name} must export async up() and down() functions`)
        }
        cached[name] = { up: mod.up, down: mod.down }
      }
      return cached
    }
  }
}

export default defineNitroPlugin(async () => {
  const databaseUrl = useRuntimeConfig().databaseUrl || process.env.DATABASE_URL
  if (!databaseUrl) {
    console.warn('DATABASE_URL not set, skipping migrations')
    return
  }

  const migrator = new Migrator({
    db,
    provider: createBundledMigrationProvider()
  })

  const all = await migrator.getMigrations()
  const pending = all.filter(m => !m.executedAt)

  if (pending.length === 0) {
    console.log('Migrations already up-to-date')
    return
  }

  console.log(`Running ${pending.length} pending migration(s)...`)
  for (const m of pending) {
    console.log(`  Migration: ${m.name}`)
  }

  const { error, results } = await migrator.migrateToLatest()

  results?.forEach((r) => {
    if (r.status === 'Success') console.log(`✓ ${r.migrationName}`)
    if (r.status === 'Error') console.error(`✗ ${r.migrationName}`)
  })

  if (error) {
    console.error('Migration failed:', error)
    throw error
  }

  console.log('Migrations complete')
})
