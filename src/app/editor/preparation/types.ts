export type EditorPreparationKind =
  | 'document-open'
  | 'document-reload'
  | 'recovery-restore'
  | 'storage-open'
  | 'page-switch'
  | 'font-retry'
  | 'dom-import'

export type EditorPreparationPhase =
  | 'reading'
  | 'decoding'
  | 'materializing'
  | 'populating-page'
  | 'resolving-fonts'
  | 'resolving-fallbacks'
  | 'layout'
  | 'preparing-render'

export interface EditorPreparationProgress {
  completed: number
  total: number
  unit: 'bytes' | 'nodes' | 'fonts' | 'pages'
}

export interface EditorPreparation {
  id: number
  kind: EditorPreparationKind
  phase: EditorPreparationPhase
  subject: string | null
  detail: string | null
  progress: EditorPreparationProgress | null
  startedAt: number
}

export interface BeginEditorPreparation {
  kind: EditorPreparationKind
  phase?: EditorPreparationPhase
  subject?: string | null
}

export interface EditorPreparationUpdate {
  phase: EditorPreparationPhase
  detail?: string | null
  completed?: number | null
  total?: number | null
  unit?: EditorPreparationProgress['unit']
}

export interface EditorPreparationHandle {
  readonly id: number
  readonly signal: AbortSignal
  update(update: EditorPreparationUpdate): void
  finish(): void
  cancel(): void
}
