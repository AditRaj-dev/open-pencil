import type { Editor, EditorState } from '@open-pencil/core/editor'
import { computeAllLayouts } from '@open-pencil/core/layout'

import { yieldToUI } from '@/app/document/io/browser'
import { readFigDocument } from '@/app/document/io/fig'
import { applyImportedDocument } from '@/app/document/io/imported-document'
import { readReloadSource } from '@/app/document/io/reload-source'
import { captureReloadState, restoreReloadState } from '@/app/document/io/reload-state'
import { beginDocumentLoad } from '@/app/document/loading/session'
import type { DocumentLoadingState } from '@/app/document/loading/session'
import { notificationMessages } from '@/app/i18n/notifications'
import { toast } from '@/app/shell/ui'

type OpenDocumentState = EditorState &
  DocumentLoadingState & {
    documentName: string
  }

type ReloadDocumentState = EditorState & { documentName: string }

type OpenFigFileOptions = {
  editor: Editor
  state: OpenDocumentState
  setDocumentSource: (
    fileName: string,
    sourceFormat: string,
    handle?: FileSystemFileHandle,
    path?: string
  ) => void
  fitCurrentPageToViewport: () => Promise<void>
}

type ReloadActionsOptions = {
  editor: Editor
  state: ReloadDocumentState
  getFilePath: () => string | null
  getFileHandle: () => FileSystemFileHandle | null
  setSavedVersion: (version: number) => void
}

export function createOpenActions({
  editor,
  state,
  setDocumentSource,
  fitCurrentPageToViewport
}: OpenFigFileOptions) {
  async function openFigFile(file: File, handle?: FileSystemFileHandle, path?: string) {
    const load = beginDocumentLoad(state)
    try {
      load.update({ phase: 'reading', detail: file.name })
      await yieldToUI()
      load.update({ phase: 'decoding', detail: file.name })
      const imported = await readFigDocument(file, editor)
      await yieldToUI()
      load.update({ phase: 'materializing', detail: file.name })
      await applyImportedDocument(editor, imported, load)
      state.documentName = file.name.replace(/\.fig$/i, '')
      setDocumentSource(file.name, 'fig', handle, path)
      await fitCurrentPageToViewport()
      load.update({ phase: 'preparing-render', detail: state.documentName })
      editor.requestRender()
    } catch (e) {
      console.error('Failed to open .fig file:', e)
      toast.error(
        notificationMessages.get().openFileFailed({
          name: file.name,
          error: e instanceof Error ? e.message : String(e)
        })
      )
    } finally {
      load.finish()
    }
  }

  return { openFigFile }
}

export function createReloadActions({
  editor,
  state,
  getFilePath,
  getFileHandle,
  setSavedVersion
}: ReloadActionsOptions) {
  async function reloadFromDisk() {
    const snapshot = captureReloadState(state)
    const filePath = getFilePath()
    const fileHandle = getFileHandle()

    const imported = await readReloadSource({
      documentName: state.documentName,
      filePath,
      fileHandle
    })
    if (!imported) return
    const pageId = imported.getNode(snapshot.pageId) ? snapshot.pageId : imported.getPages()[0]?.id
    if (pageId) computeAllLayouts(imported, pageId)
    editor.replaceGraph(imported)

    editor.undo.clear()
    restoreReloadState(editor, state, snapshot)
    editor.requestRender()
    setSavedVersion(state.sceneVersion)
  }

  return { reloadFromDisk }
}
