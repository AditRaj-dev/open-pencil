import { afterEach, describe, expect, test } from 'bun:test'
import { rmSync, writeFileSync } from 'node:fs'

import { readVisualOracleManifest } from '#visual/manifest'

const path = '/tmp/open-pencil-visual-oracle-manifest-test.json'

afterEach(() => rmSync(path, { force: true }))

describe('document visual oracle manifest', () => {
  test('reads document targets and visual thresholds', () => {
    writeFileSync(
      path,
      JSON.stringify({
        document: '/tmp/design.fig',
        appURL: 'http://localhost:1420/',
        targets: [
          {
            page: 'Foundations',
            node: 'Effects',
            figmaNodeId: '1:2',
            expectedWidth: 2080,
            minimumPageRoots: 6
          }
        ]
      })
    )

    expect(readVisualOracleManifest(path).targets[0]).toMatchObject({
      page: 'Foundations',
      expectedWidth: 2080,
      minimumPageRoots: 6
    })
  })

  test('rejects targets without an exact Figma node', () => {
    writeFileSync(
      path,
      JSON.stringify({
        document: '/tmp/design.fig',
        appURL: 'http://localhost:1420/',
        targets: [{ page: 'Foundations', node: 'Effects' }]
      })
    )

    expect(() => readVisualOracleManifest(path)).toThrow('figmaNodeId')
  })
})
