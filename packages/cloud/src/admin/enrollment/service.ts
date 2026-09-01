import type { CloudDatabase } from '#cloud/server/db'
import { type Kysely, sql } from 'kysely'

export type EnrollmentStatus = 'pending' | 'approved' | 'rejected' | 'revoked'
export type EnrollmentMode = 'open' | 'approval' | 'closed'

export type EnrollmentRequestInput = {
  email: string
  name?: string
  reason?: string
}

export type EnrollmentReviewInput = {
  note?: string
}

export type EnrollmentRecord = {
  id: string
  email: string
  name: string | null
  reason: string | null
  status: EnrollmentStatus
  requestedAt: string
  reviewedAt: string | null
  reviewedBy: string | null
  reviewNote: string | null
  approvedUserId: string | null
}

function dateString(value: Date | string | null): string | null {
  return value ? new Date(value).toISOString() : null
}

function enrollmentRecord(row: {
  id: string
  emailNormalized: string
  name: string | null
  reason: string | null
  status: EnrollmentStatus
  requestedAt: Date | string
  reviewedAt: Date | string | null
  reviewedBy: string | null
  reviewNote: string | null
  approvedUserId: string | null
}): EnrollmentRecord {
  return {
    id: row.id,
    email: row.emailNormalized,
    name: row.name,
    reason: row.reason,
    status: row.status,
    requestedAt: dateString(row.requestedAt) ?? '',
    reviewedAt: dateString(row.reviewedAt),
    reviewedBy: row.reviewedBy,
    reviewNote: row.reviewNote,
    approvedUserId: row.approvedUserId
  }
}

export function normalizeEnrollmentEmail(value: string): string {
  return value.trim().toLowerCase()
}

export function createEnrollmentService(database: Kysely<CloudDatabase>) {
  return {
    async request(input: EnrollmentRequestInput): Promise<void> {
      const emailNormalized = normalizeEnrollmentEmail(input.email)
      await database
        .insertInto('cloudEnrollment')
        .values({
          id: crypto.randomUUID(),
          emailNormalized,
          name: input.name?.trim() || null,
          reason: input.reason?.trim() || null,
          status: 'pending',
          reviewedAt: null,
          reviewedBy: null,
          reviewNote: null,
          approvedUserId: null
        })
        .onConflict((conflict) => conflict.column('emailNormalized').doNothing())
        .execute()
    },

    async isApproved(email: string): Promise<boolean> {
      const row = await database
        .selectFrom('cloudEnrollment')
        .select('id')
        .where('emailNormalized', '=', normalizeEnrollmentEmail(email))
        .where('status', '=', 'approved')
        .executeTakeFirst()
      return Boolean(row)
    },

    async list(status?: EnrollmentStatus): Promise<EnrollmentRecord[]> {
      let query = database.selectFrom('cloudEnrollment').selectAll()
      if (status) query = query.where('status', '=', status)
      return (await query.orderBy('requestedAt', 'desc').execute()).map(enrollmentRecord)
    },

    async review(
      actorId: string,
      enrollmentId: string,
      status: Exclude<EnrollmentStatus, 'pending'>,
      input: EnrollmentReviewInput
    ): Promise<EnrollmentRecord> {
      return database.transaction().execute(async (transaction) => {
        const now = new Date()
        const row = await transaction
          .updateTable('cloudEnrollment')
          .set({
            status,
            reviewedAt: now,
            reviewedBy: actorId,
            reviewNote: input.note?.trim() || null
          })
          .where('id', '=', enrollmentId)
          .returningAll()
          .executeTakeFirstOrThrow()
        await transaction
          .insertInto('cloudAdminAuditEvent')
          .values({
            id: crypto.randomUUID(),
            actorUserId: actorId,
            action: `enrollment.${status}`,
            subjectType: 'enrollment',
            subjectId: enrollmentId,
            metadata: { email: row.emailNormalized },
            createdAt: now
          })
          .execute()
        return enrollmentRecord(row)
      })
    },

    async bindApprovedUser(email: string, userId: string): Promise<void> {
      await database
        .updateTable('cloudEnrollment')
        .set({ approvedUserId: userId })
        .where('emailNormalized', '=', normalizeEnrollmentEmail(email))
        .where('status', '=', 'approved')
        .execute()
    },

    async pendingCount(): Promise<number> {
      const row = await database
        .selectFrom('cloudEnrollment')
        .select(sql<number>`count(*)`.as('count'))
        .where('status', '=', 'pending')
        .executeTakeFirstOrThrow()
      return Number(row.count)
    }
  }
}

export type EnrollmentService = ReturnType<typeof createEnrollmentService>
