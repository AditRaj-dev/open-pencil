import type { CloudAuthAdapter } from '#cloud/server/auth'
import type { CloudDatabase } from '#cloud/server/db'
import type { Kysely } from 'kysely'

export function createAdminUserService(database: Kysely<CloudDatabase>, auth: CloudAuthAdapter) {
  async function audit(actorId: string, action: string, userId: string): Promise<void> {
    await database
      .insertInto('cloudAdminAuditEvent')
      .values({
        id: crypto.randomUUID(),
        actorUserId: actorId,
        action,
        subjectType: 'user',
        subjectId: userId,
        metadata: {}
      })
      .execute()
  }

  return {
    list(headers: Headers, query?: { searchValue?: string; limit?: number; offset?: number }) {
      return auth.listUsers(headers, query)
    },
    async ban(headers: Headers, actorId: string, userId: string, reason?: string): Promise<void> {
      await auth.banUser(headers, userId, reason)
      await audit(actorId, 'user.banned', userId)
    },
    async unban(headers: Headers, actorId: string, userId: string): Promise<void> {
      await auth.unbanUser(headers, userId)
      await audit(actorId, 'user.unbanned', userId)
    },
    async revokeSessions(headers: Headers, actorId: string, userId: string): Promise<void> {
      await auth.revokeUserSessions(headers, userId)
      await audit(actorId, 'user.sessions-revoked', userId)
    },
    async setAdmin(
      headers: Headers,
      actorId: string,
      userId: string,
      enabled: boolean
    ): Promise<void> {
      await auth.setRole(headers, userId, enabled ? 'admin' : 'user')
      await audit(actorId, enabled ? 'user.admin-granted' : 'user.admin-revoked', userId)
    }
  }
}

export type AdminUserService = ReturnType<typeof createAdminUserService>
