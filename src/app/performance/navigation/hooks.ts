import type { EditorStore } from '@/app/editor/session/create'
import type { NavigationRecording, NavigationRecorder } from '@/app/performance/navigation/recorder'
import { startNavigationRecorder } from '@/app/performance/navigation/recorder'

export interface NavigationBenchmarkHooks {
  startRecording: (name: string) => void
  stopRecording: () => NavigationRecording
}

let recorder: NavigationRecorder | null = null

export function createNavigationBenchmarkHooks(store: EditorStore): NavigationBenchmarkHooks {
  return {
    startRecording(name) {
      if (recorder) throw new Error('A navigation recording is already active')
      const canvas = document.querySelector<HTMLCanvasElement>('[data-test-id="canvas-element"]')
      if (!canvas) throw new Error('Canvas element not found')
      recorder = startNavigationRecorder(canvas, name, {
        panX: store.state.panX,
        panY: store.state.panY,
        zoom: store.state.zoom
      })
    },
    stopRecording() {
      if (!recorder) throw new Error('No navigation recording is active')
      const result = recorder.stop()
      recorder = null
      return result
    }
  }
}
