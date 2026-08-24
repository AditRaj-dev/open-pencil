import type { Editor } from '@open-pencil/core/editor'
import { computeAllLayouts } from '@open-pencil/core/layout'
import type { SceneGraph, SceneNode } from '@open-pencil/scene-graph'

import type { DocumentLoadSession } from '@/app/document/loading/session'

export async function applyImportedDocument(
  editor: Editor,
  imported: SceneGraph,
  load?: DocumentLoadSession
) {
  const firstPage = imported.getPages()[0] as SceneNode | undefined
  load?.update({ phase: 'layout', detail: firstPage?.name ?? null })
  if (firstPage) computeAllLayouts(imported, firstPage.id)
  editor.replaceGraph(imported)
  editor.undo.clear()
  editor.clearSelection()
  const pageId = firstPage?.id ?? editor.graph.rootId
  load?.update({ phase: 'populating-page', detail: firstPage?.name ?? null })
  await editor.switchPage(pageId, {
    preserveLoading: load !== undefined,
    onProgress: (progress) => load?.update(progress)
  })
}
