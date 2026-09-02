import { type Kysely, sql } from 'kysely'

export async function up(database: Kysely<unknown>): Promise<void> {
  await database.schema
    .alterTable('transactional_email')
    .dropConstraint('transactional_email_kind_check')
    .execute()
  await database.schema
    .alterTable('transactional_email')
    .addCheckConstraint(
      'transactional_email_kind_check',
      sql`kind in ('document-invitation', 'enrollment-requested', 'admin-enrollment-notification', 'enrollment-approved', 'enrollment-rejected', 'enrollment-revoked')`
    )
    .execute()
}

export async function down(database: Kysely<unknown>): Promise<void> {
  await database.schema
    .alterTable('transactional_email')
    .dropConstraint('transactional_email_kind_check')
    .execute()
  await database.schema
    .alterTable('transactional_email')
    .addCheckConstraint('transactional_email_kind_check', sql`kind in ('document-invitation')`)
    .execute()
}
