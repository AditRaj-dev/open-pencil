import { describe, expect, test } from 'bun:test'

import { createCloudTestDatabase } from '#cloud-test/helpers/database'

import { createEnrollmentService } from '@open-pencil/cloud/server'

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
})
