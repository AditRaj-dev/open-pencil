import { describe, expect, test } from 'bun:test'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { createNodeAdminAssetHandler } from '@open-pencil/cloud/runtime/node'

describe('Node admin assets', () => {
  test('serves the SPA only for join, admin, and asset paths', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'openpencil-cloud-admin-'))
    try {
      await writeFile(join(directory, 'index.html'), '<div>admin</div>')
      const handler = createNodeAdminAssetHandler(directory)
      expect(await handler(new Request('https://cloud.example.com/api/health'))).toBeNull()
      expect(
        await (await handler(new Request('https://cloud.example.com/join')))?.text()
      ).toContain('admin')
      expect(
        await (await handler(new Request('https://cloud.example.com/admin/users')))?.text()
      ).toContain('admin')
    } finally {
      await rm(directory, { recursive: true })
    }
  })
})
