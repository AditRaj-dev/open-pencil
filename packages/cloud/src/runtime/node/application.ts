import { createNodeCloudDatabase } from '#cloud/runtime/node/database'
import { createNodeTransactionalEmailRuntime } from '#cloud/runtime/node/email-runtime'
import { createS3ObjectStore } from '#cloud/runtime/s3/objects'
import {
  cloudServerConfigFromEnvironment,
  createBetterAuthAdapter,
  createCloudApp,
  type CloudApp,
  type CloudEnvironment,
  type CloudServerConfig,
  type ObjectStore
} from '#cloud/server'

export type NodeCloudApplicationOptions = {
  environment?: CloudEnvironment
  databaseURL?: string
}

export function createNodeCloudApplication(options: NodeCloudApplicationOptions = {}): {
  app: CloudApp
  config: CloudServerConfig
  database: ReturnType<typeof createNodeCloudDatabase>
  objects: ObjectStore
  email: ReturnType<typeof createNodeTransactionalEmailRuntime>['email']
} {
  const environment = options.environment ?? process.env
  const config = cloudServerConfigFromEnvironment(environment)
  const database = createNodeCloudDatabase({
    connectionString: options.databaseURL ?? config.databaseURL
  })
  const auth = createBetterAuthAdapter(config, database)
  const objects = createS3ObjectStore(config)
  const { email, invitationOutbox } = createNodeTransactionalEmailRuntime(config, database)
  const app = createCloudApp({
    config,
    database,
    auth,
    objects,
    invitationOutbox,
    transactionalEmail: email
  })
  return { app, config, database, objects, email }
}
