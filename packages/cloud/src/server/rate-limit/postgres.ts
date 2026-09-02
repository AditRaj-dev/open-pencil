import type { CloudDatabase } from '#cloud/server/db'
import { sha256 } from '@noble/hashes/sha2.js'
import { bytesToHex, utf8ToBytes } from '@noble/hashes/utils.js'
import type { ClientRateLimitInfo, Store } from 'hono-rate-limiter'
import type { Kysely } from 'kysely'
import { sql } from 'kysely'

export class PostgresRateLimitStore implements Store {
  readonly localKeys = false
  readonly prefix: string
  private windowMs = 60_000

  constructor(
    private readonly database: Kysely<CloudDatabase>,
    private readonly secret: string,
    namespace: string
  ) {
    this.prefix = `${namespace}:`
  }

  init(options: { windowMs: number }): void {
    this.windowMs = options.windowMs
  }

  private hash(key: string): string {
    return bytesToHex(sha256(utf8ToBytes(`${this.secret}:${this.prefix}:${key}`)))
  }

  async increment(key: string): Promise<ClientRateLimitInfo> {
    const now = new Date()
    const resetTime = new Date(
      Math.floor(now.getTime() / this.windowMs) * this.windowMs + this.windowMs
    )
    const result = await sql<{ requestCount: number; windowStartedAt: Date }>`
      insert into cloud_rate_limit (key_hash, window_started_at, request_count, updated_at)
      values (${this.hash(key)}, ${new Date(resetTime.getTime() - this.windowMs)}, 1, ${now})
      on conflict (key_hash) do update set
        request_count = case
          when cloud_rate_limit.window_started_at = excluded.window_started_at
          then cloud_rate_limit.request_count + 1
          else 1
        end,
        window_started_at = excluded.window_started_at,
        updated_at = excluded.updated_at
      returning request_count as "requestCount", window_started_at as "windowStartedAt"
    `.execute(this.database)
    const row = result.rows[0]
    if (!row) throw new Error('Rate limit increment returned no row')
    return {
      totalHits: Number(row.requestCount),
      resetTime: new Date(new Date(row.windowStartedAt).getTime() + this.windowMs)
    }
  }

  async decrement(key: string): Promise<void> {
    await this.database
      .updateTable('cloudRateLimit')
      .set((expression) => ({
        requestCount: expression.fn('greatest', [
          expression('requestCount', '-', 1),
          expression.val(0)
        ])
      }))
      .where('keyHash', '=', this.hash(key))
      .execute()
  }

  async resetKey(key: string): Promise<void> {
    await this.database.deleteFrom('cloudRateLimit').where('keyHash', '=', this.hash(key)).execute()
  }
}
