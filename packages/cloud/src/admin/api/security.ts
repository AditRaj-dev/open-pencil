import type { Context, Next } from 'hono'

const MAXIMUM_ENROLLMENT_BODY_BYTES = 2048

export async function boundedEnrollmentBody(context: Context, next: Next) {
  const contentLength = Number(context.req.header('content-length') ?? 0)
  if (Number.isFinite(contentLength) && contentLength > MAXIMUM_ENROLLMENT_BODY_BYTES) {
    return context.json({ error: { code: 'invalid_request' as const } }, 413)
  }
  return next()
}

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
