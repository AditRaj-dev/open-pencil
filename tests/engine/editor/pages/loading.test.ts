import { expect, test } from 'bun:test'

import { SceneGraph } from '@open-pencil/scene-graph'

import { createEditor } from '#core/editor'

test('outer loading ownership spans page font resolution', async () => {
  const graph = new SceneGraph()
  const page = graph.getPages()[0]
  if (!page) throw new Error('Expected default page')
  graph.createNode('TEXT', page.id, {
    text: 'Loading',
    fontFamily: 'Loader Test',
    fontWeight: 400
  })
  const progress: Array<{ phase: string; completed?: number; total?: number }> = []
  let release: (() => void) | null = null
  const fontReady = new Promise<void>((resolve) => {
    release = resolve
  })
  const editor = createEditor({
    graph,
    skipInitialGraphSetup: true,
    loadFont: async () => {
      await fontReady
      return null
    }
  })
  editor.state.loading = true

  const switching = editor.switchPage(page.id, {
    preserveLoading: true,
    onProgress: (next) => progress.push(next)
  })
  await Promise.resolve()

  expect(editor.state.loading).toBe(true)
  expect(progress.some((entry) => entry.phase === 'resolving-fonts')).toBe(true)
  release?.()
  await switching
  expect(editor.state.loading).toBe(true)
  expect(progress).toContainEqual(
    expect.objectContaining({ phase: 'resolving-fonts', completed: 1, total: 1 })
  )
})

test('page viewport cleanup cannot dismiss an outer document load', () => {
  const editor = createEditor()
  editor.state.loading = true

  editor.clearPageViewports()

  expect(editor.state.loading).toBe(true)
})
