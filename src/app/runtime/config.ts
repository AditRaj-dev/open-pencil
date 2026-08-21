import { IS_BROWSER } from '@/constants'

export type SceneRendererMode = 'existing' | 'tiled'

export interface AppRuntimeConfig {
  test: boolean
  navigationBenchmark: boolean
  showChrome: boolean
  showRulers: boolean
  sceneRenderer: SceneRendererMode
}

export function parseAppRuntimeConfig(search: string): AppRuntimeConfig {
  const params = new URLSearchParams(search)
  return {
    test: params.has('test'),
    navigationBenchmark: params.has('navigation-benchmark'),
    showChrome: !params.has('no-chrome'),
    showRulers: !params.has('no-rulers'),
    sceneRenderer: params.get('renderer') === 'tiled' ? 'tiled' : 'existing'
  }
}

export const appRuntimeConfig = parseAppRuntimeConfig(IS_BROWSER ? window.location.search : '')
