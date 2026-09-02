import { staticEntitlementsTOMLSchema } from '#cloud/server/policy/static'
import { parse as parseTOML } from 'smol-toml'
import * as v from 'valibot'

import type { CloudEnvironment } from './environment'
import { parseCloudServerConfig, type CloudServerConfig } from './schema'

const websocketURLSchema = v.pipe(
  v.string(),
  v.url(),
  v.check((value) => ['ws:', 'wss:'].includes(new URL(value).protocol), 'Expected WS or WSS URL')
)

const secretReferenceSchema = v.object({ from_env: v.pipe(v.string(), v.trim(), v.minLength(1)) })
const deploymentConfigSchema = v.object({
  schema_version: v.literal(1),
  deployment: v.object({
    mode: v.picklist(['official', 'self-hosted']),
    public_url: v.pipe(v.string(), v.url()),
    app_url: v.optional(v.pipe(v.string(), v.url())),
    trusted_origins: v.optional(v.array(v.pipe(v.string(), v.url())), [])
  }),
  database: v.object({ url: secretReferenceSchema }),
  authentication: v.object({
    secret: secretReferenceSchema,
    enrollment_mode: v.optional(v.picklist(['open', 'approval', 'closed']), 'open'),
    admin_notification_emails: v.optional(v.array(v.pipe(v.string(), v.email())), []),
    admin_user_ids: v.optional(v.array(v.string()), [])
  }),
  object_storage: v.object({
    endpoint: v.pipe(v.string(), v.url()),
    region: v.string(),
    bucket: v.string(),
    access_key_id: secretReferenceSchema,
    secret_access_key: secretReferenceSchema,
    force_path_style: v.optional(v.boolean(), true),
    checksum_verification: v.optional(v.picklist(['native', 'metadata']), 'native')
  }),
  collaboration: v.optional(
    v.object({ public_url: websocketURLSchema, port: v.optional(v.number(), 1234) })
  ),
  entitlements: v.optional(
    v.variant('source', [
      v.object({ source: v.literal('static'), ...staticEntitlementsTOMLSchema.entries }),
      v.object({ source: v.literal('database') })
    ])
  ),
  email: v.optional(
    v.variant('transport', [
      v.object({ transport: v.literal('none') }),
      v.object({
        transport: v.literal('smtp'),
        from: v.string(),
        host: v.string(),
        port: v.number(),
        secure: v.optional(v.boolean()),
        user: v.optional(secretReferenceSchema),
        password: v.optional(secretReferenceSchema)
      }),
      v.object({ transport: v.literal('cloudflare'), from: v.string() })
    ])
  ),
  technical_limits: v.optional(
    v.object({
      maximum_upload_bytes: v.optional(v.number()),
      maximum_collaboration_message_bytes: v.optional(v.number()),
      maximum_connections_per_room: v.optional(v.number())
    })
  )
})

function secret(environment: CloudEnvironment, reference: { from_env: string }): string {
  const value = environment[reference.from_env]
  if (!value) throw new Error(`Required secret binding is unavailable: ${reference.from_env}`)
  return value
}

type DeploymentConfig = v.InferOutput<typeof deploymentConfigSchema>

function emailConfig(config: DeploymentConfig, environment: CloudEnvironment) {
  if (!config.email || config.email.transport === 'none') {
    return { emailTransport: config.email?.transport }
  }
  if (config.email.transport === 'cloudflare') {
    return { emailTransport: 'cloudflare' as const, emailFrom: config.email.from }
  }
  return {
    emailTransport: 'smtp' as const,
    emailFrom: config.email.from,
    smtpHost: config.email.host,
    smtpPort: config.email.port,
    smtpSecure: config.email.secure,
    smtpUser: config.email.user ? secret(environment, config.email.user) : undefined,
    smtpPassword: config.email.password ? secret(environment, config.email.password) : undefined
  }
}

function entitlementConfig(config: DeploymentConfig) {
  if (config.entitlements?.source !== 'static') return undefined
  return {
    documents: {
      maximumFileBytes: config.entitlements.documents?.maximum_file_bytes,
      revisionHistory: config.entitlements.documents?.revision_history
    },
    storage: { maximumBytes: config.entitlements.storage?.maximum_bytes },
    sharing: {
      capabilityLinks: config.entitlements.sharing?.capability_links,
      anonymousView: config.entitlements.sharing?.anonymous_view,
      anonymousEdit: config.entitlements.sharing?.anonymous_edit,
      guestPresence: config.entitlements.sharing?.guest_presence
    },
    collaboration: {
      enabled: config.entitlements.collaboration?.enabled,
      maximumParticipants: config.entitlements.collaboration?.maximum_participants
    }
  }
}

function technicalLimits(config: DeploymentConfig) {
  if (!config.technical_limits) return undefined
  return {
    maximumUploadBytes: config.technical_limits.maximum_upload_bytes,
    maximumCollaborationMessageBytes: config.technical_limits.maximum_collaboration_message_bytes,
    maximumConnectionsPerRoom: config.technical_limits.maximum_connections_per_room
  }
}

export function parseCloudDeploymentTOML(
  source: string,
  environment: CloudEnvironment
): CloudServerConfig {
  const config = v.parse(deploymentConfigSchema, parseTOML(source))
  return parseCloudServerConfig({
    deployment: config.deployment.mode,
    publicURL: config.deployment.public_url,
    appURL: config.deployment.app_url,
    trustedOrigins: config.deployment.trusted_origins,
    databaseURL: secret(environment, config.database.url),
    authSecret: secret(environment, config.authentication.secret),
    enrollmentMode: config.authentication.enrollment_mode,
    enrollmentAdminNotificationEmails: config.authentication.admin_notification_emails,
    deploymentAdminUserIds: config.authentication.admin_user_ids,
    s3Endpoint: config.object_storage.endpoint,
    s3Region: config.object_storage.region,
    s3Bucket: config.object_storage.bucket,
    s3AccessKeyId: secret(environment, config.object_storage.access_key_id),
    s3SecretAccessKey: secret(environment, config.object_storage.secret_access_key),
    s3ForcePathStyle: config.object_storage.force_path_style,
    s3ChecksumVerification: config.object_storage.checksum_verification,
    collaborationURL: config.collaboration?.public_url,
    collaborationPort: config.collaboration?.port,
    staticEntitlements: entitlementConfig(config),
    ...emailConfig(config, environment),
    technicalLimits: technicalLimits(config)
  })
}
