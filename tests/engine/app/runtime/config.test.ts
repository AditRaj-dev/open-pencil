import { describe, expect, test } from 'bun:test'

import { parseAppRuntimeConfig } from '@/app/runtime/config'

describe('app runtime configuration', () => {
  test('parses supported development and presentation flags once', () => {
    expect(
      parseAppRuntimeConfig('?test&navigation-benchmark&no-chrome&no-rulers&renderer=tiled')
    ).toEqual({
      test: true,
      navigationBenchmark: true,
      showChrome: false,
      showRulers: false,
      sceneRenderer: 'tiled'
    })
  })

  test('uses production-safe defaults for absent or unknown values', () => {
    expect(parseAppRuntimeConfig('?renderer=unknown')).toEqual({
      test: false,
      navigationBenchmark: false,
      showChrome: true,
      showRulers: true,
      sceneRenderer: 'existing'
    })
  })
})
