import type {
  BeginEditorPreparation,
  EditorPreparationHandle,
  EditorPreparationUpdate
} from '@/app/editor/preparation/types'
import type { AppEditorState } from '@/app/editor/session/types'

export interface EditorPreparationController {
  begin(options: BeginEditorPreparation): EditorPreparationHandle
  dispose(): void
}

export function createEditorPreparationController(
  state: AppEditorState
): EditorPreparationController {
  let nextId = 0
  let activeAbort: AbortController | null = null

  const isActive = (id: number) => state.preparation?.id === id

  return {
    begin(options) {
      activeAbort?.abort()
      const abort = new AbortController()
      activeAbort = abort
      const id = ++nextId
      state.preparation = {
        id,
        kind: options.kind,
        phase: options.phase ?? 'reading',
        subject: options.subject ?? null,
        detail: null,
        progress: null,
        startedAt: performance.now()
      }

      const finish = () => {
        if (!isActive(id)) return
        state.preparation = null
        if (activeAbort === abort) activeAbort = null
      }

      return {
        id,
        signal: abort.signal,
        update(update: EditorPreparationUpdate) {
          if (!isActive(id) || abort.signal.aborted) return
          const hasProgress =
            update.completed !== undefined &&
            update.completed !== null &&
            update.total !== undefined &&
            update.total !== null &&
            update.total > 0
          const current = state.preparation
          if (!current) return
          state.preparation = {
            ...current,
            phase: update.phase,
            detail: update.detail ?? null,
            progress: hasProgress
              ? {
                  completed: update.completed ?? 0,
                  total: update.total ?? 0,
                  unit: update.unit ?? 'fonts'
                }
              : null
          }
        },
        finish,
        cancel() {
          if (!isActive(id)) return
          abort.abort()
          finish()
        }
      }
    },
    dispose() {
      activeAbort?.abort()
      activeAbort = null
      state.preparation = null
    }
  }
}
