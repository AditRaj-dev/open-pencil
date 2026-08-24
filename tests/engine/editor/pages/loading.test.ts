import { expect, test } from 'bun:test'

import { SceneGraph } from '@open-pencil/scene-graph'

import { createEditor } from '#core/editor'

test('core page preparation only reports progress and never owns app suspension', async () => {
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
  const switching = editor.switchPage(page.id, {
    onProgress: (next) => progress.push(next)
  })
  await Promise.resolve()

  expect(progress.some((entry) => entry.phase === 'resolving-fonts')).toBe(true)
  release?.()
  await switching
  expect(progress).toContainEqual(
    expect.objectContaining({ phase: 'resolving-fonts', completed: 1, total: 1 })
  )
})

test('page viewport cleanup remains independent from app preparation state', () => {
  const editor = createEditor()

  expect(() => editor.clearPageViewports()).not.toThrow()
})
