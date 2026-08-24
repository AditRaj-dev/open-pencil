import type { EditorStore } from '@/app/editor/session/create'
import type { NavigationRecording, NavigationRecorder } from '@/app/performance/navigation/recorder'
import { startNavigationRecorder } from '@/app/performance/navigation/recorder'

export interface NavigationBenchmarkHooks {
  startRecording: (name: string) => void
  waitForSettlement: (timeoutMs?: number) => Promise<void>
  waitForTiledBackgroundSettlement: (timeoutMs?: number) => Promise<void>
  stopRecording: () => NavigationRecording
}

let recorder: NavigationRecorder | null = null

function settlementRenderers(store: EditorStore) {
  return store.canvasRenderers.filter(
    (renderer) => renderer.tracksSceneSettlement && renderer.pageId !== null
  )
}

async function waitForRendererState(
  store: EditorStore,
  label: string,
  settled: (renderers: ReturnType<typeof settlementRenderers>) => boolean,
  timeoutMs: number
): Promise<void> {
  const startedAt = performance.now()
  await new Promise<void>((resolve, reject) => {
    const check = () => {
      const renderers = settlementRenderers(store)
      if (store.state.navigation.phase === 'idle' && renderers.length > 0 && settled(renderers)) {
        resolve()
        return
      }
      if (performance.now() - startedAt >= timeoutMs) {
        const state = renderers.map((renderer) => ({
          tiled: renderer.tiledSceneEnabled,
          covered: renderer.tiledSceneCovered,
          pending: renderer.tiledScenePending,
          backingCrisp: !renderer.sceneBackingNeedsCrispRender
        }))
        reject(
          new Error(
            `${label} did not settle within ${timeoutMs} ms: ${JSON.stringify({
              navigationPhase: store.state.navigation.phase,
              renderers: state
            })}`
          )
        )
        return
      }
      requestAnimationFrame(check)
    }
    requestAnimationFrame(check)
  })
}

export function createNavigationBenchmarkHooks(store: EditorStore): NavigationBenchmarkHooks {
  return {
    startRecording(name) {
      if (recorder) throw new Error('A navigation recording is already active')
      const canvas = document.querySelector<HTMLCanvasElement>('[data-test-id="canvas-element"]')
      if (!canvas) throw new Error('Canvas element not found')
      recorder = startNavigationRecorder(
        canvas,
        name,
        {
          panX: store.state.panX,
          panY: store.state.panY,
          zoom: store.state.zoom
        },
        store.canvasRenderers.some(
          (renderer) => renderer.tracksSceneSettlement && renderer.tiledSceneEnabled
        )
          ? 'tiled'
          : 'existing'
      )
    },
    async waitForSettlement(timeoutMs = 30_000) {
      await waitForRendererState(
        store,
        'Navigation renderer',
        (renderers) => renderers.every((renderer) => !renderer.sceneBackingNeedsCrispRender),
        timeoutMs
      )
    },
    async waitForTiledBackgroundSettlement(timeoutMs = 30_000) {
      await waitForRendererState(
        store,
        'Tiled background renderer',
        (renderers) =>
          renderers.every(
            (renderer) =>
              !renderer.tiledSceneEnabled ||
              (renderer.tiledSceneCovered && !renderer.tiledScenePending)
          ),
        timeoutMs
      )
    },
    stopRecording() {
      if (!recorder) throw new Error('No navigation recording is active')
      const result = recorder.stop()
      recorder = null
      return result
    }
  }
}
