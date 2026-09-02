import type { CloudDatabase } from '#cloud/server/db'
import { sha256 } from '@noble/hashes/sha2.js'
import { bytesToHex, utf8ToBytes } from '@noble/hashes/utils.js'
import type { Kysely } from 'kysely'

export type EnrollmentRateLimitOptions = {
  windowMs: number
  maximumRequests: number
  now?: Date
}

function keyHash(secret: string, key: string): string {
  return bytesToHex(sha256(utf8ToBytes(`${secret}:${key}`)))
}

export async function consumeEnrollmentRateLimit(
  database: Kysely<CloudDatabase>,
  secret: string,
  key: string,
  options: EnrollmentRateLimitOptions
): Promise<boolean> {
  const now = options.now ?? new Date()
  const windowStartedAt = new Date(Math.floor(now.getTime() / options.windowMs) * options.windowMs)
  return database.transaction().execute(async (transaction) => {
    const hash = keyHash(secret, key)
    const existing = await transaction
      .selectFrom('cloudEnrollmentRateLimit')
      .select(['windowStartedAt', 'requestCount'])
      .where('keyHash', '=', hash)
      .forUpdate()
      .executeTakeFirst()
    if (!existing || new Date(existing.windowStartedAt).getTime() !== windowStartedAt.getTime()) {
      await transaction
        .insertInto('cloudEnrollmentRateLimit')
        .values({ keyHash: hash, windowStartedAt, requestCount: 1 })
        .onConflict((conflict) =>
          conflict
            .column('keyHash')
            .doUpdateSet({ windowStartedAt, requestCount: 1, updatedAt: now })
        )
        .execute()
      return true
    }
    if (existing.requestCount >= options.maximumRequests) return false
    await transaction
      .updateTable('cloudEnrollmentRateLimit')
      .set({ requestCount: existing.requestCount + 1, updatedAt: now })
      .where('keyHash', '=', hash)
      .execute()
    return true
  })
}
