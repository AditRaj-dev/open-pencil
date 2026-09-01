import { createNodeAdminAssetHandler, createNodeCloudApplication } from '@open-pencil/cloud/runtime/node'
import { handle } from 'hono/vercel'

const { app } = createNodeCloudApplication()
const adminAssets = createNodeAdminAssetHandler(
  new URL('../../../dist/admin', import.meta.url).pathname
)
const api = handle(app)

async function handler(request: Request): Promise<Response> {
  return (await adminAssets(request)) ?? api(request)
}

export const GET = handler
export const POST = handler
export const DELETE = handler
export const OPTIONS = handler
