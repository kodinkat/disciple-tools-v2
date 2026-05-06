import type { ColumnType, Generated } from 'kysely'

/**
 * Consolidated Kysely schema (core + auth-jwt + activity-log blueprints merged at scaffold time).
 */

export interface UsersTable {
  id: Generated<string>
  created: ColumnType<Date, string | undefined, string>
  updated: ColumnType<Date, string | undefined, string>
  email: string
  display_name: string
  avatar: Generated<string>
  password: ColumnType<string | null, string | null | undefined, string | null>
  verified: Generated<boolean>
  roles: Generated<string[]>
  token_key: Generated<string>
  token_expires_at: ColumnType<Date | null, Date | string | null | undefined, Date | string | null>
  pending_email: string | null
  email_change_token: string | null
}

export interface PasswordResetRequestsTable {
  id: Generated<string>
  created: ColumnType<Date, Date | string | undefined, Date | string>
  expires: ColumnType<Date, Date | string, Date | string>
  user_id: string
  token: string
  used: Generated<boolean>
}

export interface ActivityLogsTable {
  id: Generated<string>
  timestamp: ColumnType<Date, Date | string | undefined, Date | string>
  event_type: string
  table_name: string | null
  record_id: string | null
  user_id: string | null
  user_agent: string | null
  metadata: Generated<Record<string, any>>
}

export interface RecordTypesTable {
  id: Generated<string>
  type_key: string
  label: string
  label_plural: string
  description: Generated<string>
  is_system: Generated<boolean>
  created_at: ColumnType<Date, Date | string | undefined, Date | string>
  updated_at: ColumnType<Date, Date | string | undefined, Date | string>
  meta: Generated<Record<string, unknown>>
}

export interface RecordTypeFieldsTable {
  id: Generated<string>
  record_type_id: string
  field_key: string
  kind: string
  label: string
  description: Generated<string>
  field_order: Generated<number>
  config: Generated<Record<string, unknown>>
}

export interface RecordsTable {
  id: Generated<string>
  record_type_id: string
  created_at: ColumnType<Date, Date | string | undefined, Date | string>
  updated_at: ColumnType<Date, Date | string | undefined, Date | string>
  created_by: string | null
  data: Generated<Record<string, unknown>>
}

export interface Database {
  users: UsersTable
  password_reset_requests: PasswordResetRequestsTable
  activity_logs: ActivityLogsTable
  record_types: RecordTypesTable
  record_type_fields: RecordTypeFieldsTable
  records: RecordsTable
}
