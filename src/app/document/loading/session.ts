export type DocumentLoadPhase =
  | 'reading'
  | 'decoding'
  | 'materializing'
  | 'populating-page'
  | 'resolving-fonts'
  | 'resolving-fallbacks'
  | 'layout'
  | 'preparing-render'

export interface DocumentLoadProgress {
  phase: DocumentLoadPhase
  detail: string | null
  completed: number | null
  total: number | null
}

export interface DocumentLoadingState {
  loading: boolean
  documentLoadProgress: DocumentLoadProgress | null
}

export interface DocumentLoadSession {
  update(progress: Partial<DocumentLoadProgress> & Pick<DocumentLoadProgress, 'phase'>): void
  finish(): void
}

let nextSessionId = 0
const activeSessionIds = new WeakMap<DocumentLoadingState, number>()

export function beginDocumentLoad(
  state: DocumentLoadingState,
  phase: DocumentLoadPhase = 'reading'
): DocumentLoadSession {
  const id = ++nextSessionId
  activeSessionIds.set(state, id)
  state.loading = true
  state.documentLoadProgress = { phase, detail: null, completed: null, total: null }

  return {
    update(progress) {
      if (activeSessionIds.get(state) !== id) return
      state.documentLoadProgress = {
        phase: progress.phase,
        detail: progress.detail ?? null,
        completed: progress.completed ?? null,
        total: progress.total ?? null
      }
    },
    finish() {
      if (activeSessionIds.get(state) !== id) return
      activeSessionIds.delete(state)
      state.documentLoadProgress = null
      state.loading = false
    }
  }
}
