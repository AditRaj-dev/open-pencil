import * as v from 'valibot'

export const enrollmentStatusSchema = v.picklist(['pending', 'approved', 'rejected', 'revoked'])
export const enrollmentRequestSchema = v.object({
  email: v.pipe(v.string(), v.trim(), v.email(), v.maxLength(320)),
  name: v.optional(v.pipe(v.string(), v.trim(), v.maxLength(120))),
  reason: v.optional(v.pipe(v.string(), v.trim(), v.maxLength(1000)))
})
export const enrollmentReviewSchema = v.object({
  note: v.optional(v.pipe(v.string(), v.trim(), v.maxLength(1000)))
})
export const userMutationSchema = v.object({
  userId: v.pipe(v.string(), v.trim(), v.minLength(1)),
  reason: v.optional(v.pipe(v.string(), v.trim(), v.maxLength(500)))
})

export const parseEnrollmentRequest = (input: unknown) => v.parse(enrollmentRequestSchema, input)
export const parseEnrollmentReview = (input: unknown) => v.parse(enrollmentReviewSchema, input)
export const parseUserMutation = (input: unknown) => v.parse(userMutationSchema, input)
