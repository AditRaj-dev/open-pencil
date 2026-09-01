import type { CloudDatabase } from '#cloud/server/db'
import type { Kysely } from 'kysely'

export function createAdminEmailService(database: Kysely<CloudDatabase>) {
  return {
    async list(limit = 100) {
      return database
        .selectFrom('transactionalEmail')
        .select([
          'id',
          'kind',
          'recipientEmailNormalized',
          'status',
          'attemptCount',
          'nextAttemptAt',
          'transport',
          'transportMessageId',
          'lastErrorCode',
          'createdAt',
          'acceptedAt'
        ])
        .orderBy('createdAt', 'desc')
        .limit(Math.min(Math.max(limit, 1), 500))
        .execute()
    },
    async retry(actorId: string, messageId: string): Promise<void> {
      await database.transaction().execute(async (transaction) => {
        const result = await transaction
          .updateTable('transactionalEmail')
          .set({ status: 'pending', nextAttemptAt: new Date(), lastErrorCode: null })
          .where('id', '=', messageId)
          .where('payloadEncrypted', 'is not', null)
          .executeTakeFirst()
        if (Number(result.numUpdatedRows) === 0) throw new Error('Email message cannot be retried')
        await transaction
          .insertInto('cloudAdminAuditEvent')
          .values({
            id: crypto.randomUUID(),
            actorUserId: actorId,
            action: 'email.retry-requested',
            subjectType: 'transactional-email',
            subjectId: messageId,
            metadata: {}
          })
          .execute()
      })
    }
  }
}

export type AdminEmailService = ReturnType<typeof createAdminEmailService>
