import { boundedEnrollmentBody, requireTrustedMutationOrigin } from '#cloud/admin/api/security'
import type { AdminAuditService } from '#cloud/admin/audit/service'
import {
  enrollmentStatusSchema,
  parseEnrollmentRequest,
  parseEnrollmentReview,
  parseUserMutation,
  parseUserRoleMutation
} from '#cloud/admin/contracts'
import type { AdminEmailService } from '#cloud/admin/email/service'
import { consumeEnrollmentRateLimit } from '#cloud/admin/enrollment/rate-limit'
import type { EnrollmentMode, EnrollmentService } from '#cloud/admin/enrollment/service'
import type { AdminOperationsService } from '#cloud/admin/operations/service'
import type { AdminUserService } from '#cloud/admin/users/service'
import type { CloudAPIEnvironment } from '#cloud/server/api'
import type { CloudDatabase } from '#cloud/server/db'
import { validatedJSON } from '#cloud/server/validation'
import { Hono } from 'hono'
import type { Kysely } from 'kysely'
import * as v from 'valibot'

export type CloudAdminServices = {
  email: AdminEmailService
  enrollment: EnrollmentService
  users: AdminUserService
  audit: AdminAuditService
  operations: AdminOperationsService
}

export function createPublicEnrollmentRoutes(
  enrollment: EnrollmentService,
  options: {
    mode: EnrollmentMode
    database: Kysely<CloudDatabase>
    secret: string
    windowMs: number
    maximumRequests: number
    ipHeaders: string[]
  }
) {
  return new Hono().post(
    '/enrollment/request',
    boundedEnrollmentBody,
    validatedJSON(parseEnrollmentRequest),
    async (context) => {
      if (options.mode === 'closed') return context.json({ accepted: true as const }, 202)
      const input = context.req.valid('json')
      const forwarded = options.ipHeaders.map((header) => context.req.header(header)).find(Boolean)
      const limits = [
        consumeEnrollmentRateLimit(
          options.database,
          options.secret,
          `email:${input.email.toLowerCase()}`,
          {
            windowMs: options.windowMs,
            maximumRequests: Math.max(2, Math.floor(options.maximumRequests / 2))
          }
        )
      ]
      if (forwarded) {
        limits.push(
          consumeEnrollmentRateLimit(options.database, options.secret, `ip:${forwarded}`, {
            windowMs: options.windowMs,
            maximumRequests: options.maximumRequests
          })
        )
      }
      if ((await Promise.all(limits)).every(Boolean)) await enrollment.request(input)
      return context.json({ accepted: true as const }, 202)
    }
  )
}

export function createCloudAdminRoutes(
  services: CloudAdminServices,
  trustedOrigins: ReadonlySet<string>
) {
  return new Hono<CloudAPIEnvironment>()
    .use('*', requireTrustedMutationOrigin(trustedOrigins))
    .use('*', async (context, next) => {
      const actor = context.get('actor')
      if (actor.deploymentRole !== 'admin')
        return context.json({ error: { code: 'forbidden' as const } }, 403)
      return next()
    })
    .get('/enrollments', async (context) => {
      const statusValue = context.req.query('status')
      const status = statusValue ? v.parse(enrollmentStatusSchema, statusValue) : undefined
      return context.json({ enrollments: await services.enrollment.list(status) })
    })
    .post('/enrollments/:id/approve', validatedJSON(parseEnrollmentReview), async (context) =>
      context.json({
        enrollment: await services.enrollment.review(
          context.get('actor').userId,
          context.req.param('id'),
          'approved',
          context.req.valid('json')
        )
      })
    )
    .post('/enrollments/:id/reject', validatedJSON(parseEnrollmentReview), async (context) =>
      context.json({
        enrollment: await services.enrollment.review(
          context.get('actor').userId,
          context.req.param('id'),
          'rejected',
          context.req.valid('json')
        )
      })
    )
    .post('/enrollments/:id/revoke', validatedJSON(parseEnrollmentReview), async (context) =>
      context.json({
        enrollment: await services.enrollment.review(
          context.get('actor').userId,
          context.req.param('id'),
          'revoked',
          context.req.valid('json')
        )
      })
    )
    .get('/users', async (context) =>
      context.json(
        await services.users.list(context.req.raw.headers, {
          searchValue: context.req.query('search'),
          limit: Number(context.req.query('limit') ?? 100),
          offset: Number(context.req.query('offset') ?? 0)
        })
      )
    )
    .post('/users/ban', validatedJSON(parseUserMutation), async (context) => {
      const input = context.req.valid('json')
      await services.users.ban(
        context.req.raw.headers,
        context.get('actor').userId,
        input.userId,
        input.reason
      )
      return context.json({ ok: true as const })
    })
    .post('/users/unban', validatedJSON(parseUserMutation), async (context) => {
      const input = context.req.valid('json')
      await services.users.unban(context.req.raw.headers, context.get('actor').userId, input.userId)
      return context.json({ ok: true as const })
    })
    .post('/users/revoke-sessions', validatedJSON(parseUserMutation), async (context) => {
      const input = context.req.valid('json')
      await services.users.revokeSessions(
        context.req.raw.headers,
        context.get('actor').userId,
        input.userId
      )
      return context.json({ ok: true as const })
    })
    .post('/users/set-admin', validatedJSON(parseUserRoleMutation), async (context) => {
      const input = context.req.valid('json')
      await services.users.setAdmin(
        context.req.raw.headers,
        context.get('actor').userId,
        input.userId,
        input.enabled
      )
      return context.json({ ok: true as const })
    })
    .get('/email', async (context) =>
      context.json({
        messages: await services.email.list(Number(context.req.query('limit') ?? 100))
      })
    )
    .post('/email/:id/retry', async (context) => {
      await services.email.retry(context.get('actor').userId, context.req.param('id'))
      return context.json({ ok: true as const })
    })
    .get('/audit', async (context) =>
      context.json({ events: await services.audit.list(Number(context.req.query('limit') ?? 100)) })
    )
    .get('/operations', async (context) => context.json(await services.operations.summary()))
}
