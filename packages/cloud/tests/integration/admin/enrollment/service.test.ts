import { describe, expect, test } from 'bun:test'

import { createCloudTestDatabase } from '#cloud-test/helpers/database'

import {
  createEnrollmentService,
  createTransactionalEmailService,
  consumeEnrollmentRateLimit
} from '@open-pencil/cloud/server'

describe('Cloud enrollment integration', () => {
  test('deduplicates requests and applies audited reviews', async () => {
    const runtime = await createCloudTestDatabase()
    try {
      const enrollment = createEnrollmentService(runtime.database)
      await enrollment.request({ email: 'Person@Example.com', name: 'Person', reason: 'Design' })
      await enrollment.request({ email: 'person@example.com', name: 'Duplicate' })
      const [pending] = await enrollment.list('pending')
      expect(pending).toMatchObject({
        email: 'person@example.com',
        name: 'Person',
        status: 'pending'
      })
      if (!pending) throw new Error('Expected pending enrollment')
      expect(
        await enrollment.review('admin-user', pending.id, 'approved', { note: 'Early access' })
      ).toMatchObject({
        status: 'approved',
        reviewedBy: 'admin-user',
        reviewNote: 'Early access'
      })
      expect(await enrollment.isApproved('PERSON@example.com')).toBe(true)
      expect(
        await runtime.database
          .selectFrom('cloudAdminAuditEvent')
          .select('action')
          .executeTakeFirstOrThrow()
      ).toEqual({ action: 'enrollment.approved' })
    } finally {
      await runtime.close()
    }
  })

  test('reopens rejected requests, enforces transitions, and enqueues review email', async () => {
    const runtime = await createCloudTestDatabase()
    try {
      const email = createTransactionalEmailService(runtime.database, {
        encryptionSecret: 'enrollment-test-secret-at-least-32-characters',
        from: 'cloud@example.com'
      })
      const enrollment = createEnrollmentService(runtime.database, {
        appURL: 'https://cloud.example.com',
        adminRecipients: ['admin@example.com'],
        email
      })
      await enrollment.request({ email: 'person@example.com', name: 'Person', reason: 'Design' })
      let [record] = await enrollment.list()
      if (!record) throw new Error('Expected enrollment')
      expect(record.requestRevision).toBe(1)
      expect(
        await runtime.database
          .selectFrom('transactionalEmail')
          .select(({ fn }) => fn.countAll<number>().as('count'))
          .executeTakeFirstOrThrow()
      ).toEqual({ count: 2 })
      await enrollment.review('admin-user', record.id, 'rejected', {})
      await expect(enrollment.review('admin-user', record.id, 'revoked', {})).rejects.toThrow(
        'Invalid enrollment transition'
      )
      await enrollment.request({ email: 'person@example.com', reason: 'Try again' })
      ;[record] = await enrollment.list()
      expect(record).toMatchObject({ status: 'pending', requestRevision: 2, reason: 'Try again' })
      if (!record) throw new Error('Expected reopened enrollment')
      await enrollment.review('admin-user', record.id, 'approved', {})
      expect(
        await runtime.database
          .selectFrom('transactionalEmail')
          .select(({ fn }) => fn.countAll<number>().as('count'))
          .executeTakeFirstOrThrow()
      ).toEqual({ count: 6 })
    } finally {
      await runtime.close()
    }
  })

  test('persists rate limits without storing raw keys', async () => {
    const runtime = await createCloudTestDatabase()
    try {
      const options = { windowMs: 60_000, maximumRequests: 2, now: new Date('2026-01-01') }
      expect(
        await consumeEnrollmentRateLimit(
          runtime.database,
          'secret',
          'email:person@example.com',
          options
        )
      ).toBe(true)
      expect(
        await consumeEnrollmentRateLimit(
          runtime.database,
          'secret',
          'email:person@example.com',
          options
        )
      ).toBe(true)
      expect(
        await consumeEnrollmentRateLimit(
          runtime.database,
          'secret',
          'email:person@example.com',
          options
        )
      ).toBe(false)
      const row = await runtime.database
        .selectFrom('cloudEnrollmentRateLimit')
        .select('keyHash')
        .executeTakeFirstOrThrow()
      expect(row.keyHash).not.toContain('person@example.com')
    } finally {
      await runtime.close()
    }
  })
})
