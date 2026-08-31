import { describe, expect, test } from 'bun:test'

import { SceneGraph } from '@open-pencil/scene-graph'

import { installFigSourceEditJournal } from '../src/source-session/journal'

describe('FIG source edit journal', () => {
  test('records source-backed property and structural edits', () => {
    const graph = new SceneGraph()
    const page = graph.getPages()[0]
    const first = graph.createNode('FRAME', page.id, { name: 'First' })
    const second = graph.createNode('FRAME', page.id, { name: 'Second' })
    first.source.id = 'source-first'
    second.source.id = 'source-second'

    const journal = installFigSourceEditJournal(graph)
    graph.updateNode(first.id, { name: 'Updated' })
    graph.reorderChild(first.id, page.id, 1)
    graph.reparentNode(second.id, first.id)
    journal.stop()

    expect(journal.edits).toContainEqual({
      type: 'set-property',
      sourceId: 'source-first',
      fields: expect.objectContaining({ name: 'Updated' })
    })
    expect(journal.edits).toContainEqual({
      type: 'reorder-node',
      sourceId: 'source-first',
      parentSourceId: null,
      index: 1
    })
    expect(journal.edits).toContainEqual({
      type: 'reparent-node',
      sourceId: 'source-second',
      parentSourceId: 'source-first',
      index: 0
    })
  })

  test('records created and deleted source nodes', () => {
    const graph = new SceneGraph()
    const page = graph.getPages()[0]
    const parent = graph.createNode('FRAME', page.id, { name: 'Parent' })
    parent.source.id = 'source-parent'
    const journal = installFigSourceEditJournal(graph)
    const child = graph.createNode('RECTANGLE', parent.id, { name: 'Child' })
    child.source.id = 'source-child'
    graph.deleteNode(child.id)
    journal.stop()

    expect(journal.edits).toContainEqual(
      expect.objectContaining({ type: 'create-node', nodeId: child.id })
    )
    expect(journal.edits).toContainEqual({ type: 'delete-node', sourceId: child.id })
  })
})
