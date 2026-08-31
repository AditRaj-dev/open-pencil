import type { SceneGraph, SceneNode } from '@open-pencil/scene-graph'

export type FigSourceEdit =
  | { type: 'set-property'; sourceId: string; fields: Partial<SceneNode> }
  | { type: 'create-node'; nodeId: string; parentSourceId: string | null; index: number }
  | { type: 'delete-node'; sourceId: string }
  | {
      type: 'reparent-node'
      sourceId: string
      parentSourceId: string | null
      index: number
    }
  | { type: 'reorder-node'; sourceId: string; parentSourceId: string | null; index: number }

export interface FigSourceEditJournal {
  readonly edits: readonly FigSourceEdit[]
  stop(): void
}

function sourceId(node: SceneNode | undefined): string | null {
  return node?.source.id ?? null
}

function sourceIdsAtStart(graph: SceneGraph): Map<string, string> {
  return new Map(
    [...graph.getAllNodes()].flatMap((node) => {
      const id = sourceId(node)
      return id ? [[node.id, id] as [string, string]] : []
    })
  )
}

function childIndex(graph: SceneGraph, nodeId: string, parentId: string | null): number {
  if (!parentId) return -1
  return graph.getNode(parentId)?.childIds.indexOf(nodeId) ?? -1
}

export function installFigSourceEditJournal(graph: SceneGraph): FigSourceEditJournal {
  const edits: FigSourceEdit[] = []
  const sourceIds = sourceIdsAtStart(graph)

  const stopCreated = graph.onNodeEvents({
    created: (node) => {
      edits.push({
        type: 'create-node',
        nodeId: node.id,
        parentSourceId: sourceId(graph.getNode(node.parentId ?? '')),
        index: childIndex(graph, node.id, node.parentId)
      })
    },
    updated: (id, fields) => {
      const node = graph.getNode(id)
      const idFromSource = sourceIds.get(id) ?? sourceId(node)
      if (idFromSource) edits.push({ type: 'set-property', sourceId: idFromSource, fields })
    },
    deleted: (id) => {
      edits.push({ type: 'delete-node', sourceId: sourceIds.get(id) ?? id })
    },
    reparented: (id, _oldParentId, newParentId) => {
      const node = graph.getNode(id)
      const idFromSource = sourceId(node)
      if (idFromSource) {
        edits.push({
          type: 'reparent-node',
          sourceId: sourceIds.get(id) ?? idFromSource,
          parentSourceId: sourceIds.get(newParentId) ?? sourceId(graph.getNode(newParentId)),
          index: childIndex(graph, id, newParentId)
        })
      }
    },
    reordered: (id, parentId, index) => {
      const node = graph.getNode(id)
      const idFromSource = sourceIds.get(id) ?? sourceId(node)
      if (idFromSource) {
        edits.push({
          type: 'reorder-node',
          sourceId: sourceIds.get(id) ?? idFromSource,
          parentSourceId: sourceIds.get(parentId) ?? sourceId(graph.getNode(parentId)),
          index
        })
      }
    }
  })
  return {
    edits,
    stop() {
      stopCreated()
    }
  }
}
