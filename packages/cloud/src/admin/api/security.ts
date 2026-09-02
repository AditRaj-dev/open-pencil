import type { Context, Next } from 'hono'
import { bodyLimit } from 'hono/body-limit'

export const boundedEnrollmentBody = bodyLimit({
  maxSize: 2048,
  onError: (context) => context.json({ error: { code: 'invalid_request' as const } }, 413)
})

export function requireTrustedMutationOrigin(trustedOrigins: ReadonlySet<string>) {
  return async (context: Context, next: Next) => {
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(context.req.method)) return next()
    const origin = context.req.header('origin')
    if (!origin || !trustedOrigins.has(origin)) {
      return context.json({ error: { code: 'forbidden' as const } }, 403)
    }
    return next()
  }
}
