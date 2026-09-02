import type { Kysely } from 'kysely'
import { Migrator, type Migration, type MigrationProvider } from 'kysely/migration'

import * as foundation from './migrations/001_foundation'
import * as cleanupClaims from './migrations/002_upload_cleanup_claims'
import * as documentCleanupClaims from './migrations/003_document_cleanup_claims'
import * as documentSharing from './migrations/004_document_sharing'
import * as documentCollaborationEpoch from './migrations/005_document_collaboration_epoch'
import * as invitationContinuation from './migrations/006_invitation_continuation'
import * as collaborationState from './migrations/007_collaboration_state'
import * as storageReservations from './migrations/008_storage_reservations'
import * as workspaceEntitlements from './migrations/009_workspace_entitlements'
import * as uploadFinalization from './migrations/010_upload_finalization'
import * as uploadFinalizationLease from './migrations/011_upload_finalization_lease'
import * as transactionalEmail from './migrations/012_transactional_email'
import * as adminEnrollment from './migrations/013_admin_enrollment'
import * as enrollmentEmailKinds from './migrations/014_enrollment_email_kinds'
import * as enrollmentRateLimit from './migrations/015_enrollment_rate_limit'
import type { CloudDatabase } from './schema'

const migrations: Record<string, Migration> = {
  '001_foundation': foundation,
  '002_upload_cleanup_claims': cleanupClaims,
  '003_document_cleanup_claims': documentCleanupClaims,
  '004_document_sharing': documentSharing,
  '005_document_collaboration_epoch': documentCollaborationEpoch,
  '006_invitation_continuation': invitationContinuation,
  '007_collaboration_state': collaborationState,
  '008_storage_reservations': storageReservations,
  '009_workspace_entitlements': workspaceEntitlements,
  '010_upload_finalization': uploadFinalization,
  '011_upload_finalization_lease': uploadFinalizationLease,
  '012_transactional_email': transactionalEmail,
  '013_admin_enrollment': adminEnrollment,
  '014_enrollment_email_kinds': enrollmentEmailKinds,
  '015_enrollment_rate_limit': enrollmentRateLimit
}

class CloudMigrationProvider implements MigrationProvider {
  async getMigrations(): Promise<Record<string, Migration>> {
    return migrations
  }
}

export async function migrateCloudDatabase(
  database: Kysely<CloudDatabase>,
  runAuthMigrations?: () => Promise<void>
): Promise<void> {
  const migrator = new Migrator({
    db: database,
    provider: new CloudMigrationProvider()
  })
  const result = await migrator.migrateToLatest()
  const failed = result.results?.find((migration) => migration.status === 'Error')
  if (result.error || failed) {
    throw new AggregateError(
      [result.error, failed ? new Error(`Migration failed: ${failed.migrationName}`) : null].filter(
        (error): error is Error => error instanceof Error
      ),
      'OpenPencil Cloud database migration failed'
    )
  }
  await runAuthMigrations?.()
}
