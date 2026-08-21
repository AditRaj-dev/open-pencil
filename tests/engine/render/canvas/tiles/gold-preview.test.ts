import { beforeAll, expect, setDefaultTimeout, test } from 'bun:test'
import { readFileSync } from 'node:fs'

import { initCodec, parseFigFile } from '@open-pencil/core'

import { initCanvasKit } from '#cli/headless'
import { SkiaRenderer } from '#core/canvas'
import { RenderChunkIndex } from '#core/canvas/renderer/chunks'
import { deleteRenderedTile, renderTile, tileLevel } from '#core/canvas/renderer/tiles'

import { expectDefined } from '#tests/helpers/assert'
import { repoPath } from '#tests/helpers/paths'
import { HEAVY_TEST_TIMEOUT_MS } from '#tests/helpers/test-utils'

setDefaultTimeout(HEAVY_TEST_TIMEOUT_MS)

let graph: Awaited<ReturnType<typeof parseFigFile>>
let ck: Awaited<ReturnType<typeof initCanvasKit>>

beforeAll(async () => {
  ck = await initCanvasKit()
  await initCodec()
  const bytes = readFileSync(repoPath('tests/fixtures/gold-preview.fig'))
  graph = await parseFigFile(bytes.buffer as ArrayBuffer, { populate: 'all' })
}, 60_000)

test('renders one gold-preview tile from a selective chunk query', () => {
  const page = expectDefined(graph.getPages()[0], 'gold-preview page')
  const root = expectDefined(graph.getChildren(page.id)[0], 'gold-preview root')
  const { index } = RenderChunkIndex.build(graph, page.id)
  const surface = expectDefined(ck.MakeSurface(320, 240), 'tile benchmark surface')
  const renderer = new SkiaRenderer(ck, surface)
  try {
    const level = tileLevel(1)
    const worldSize = 256 / level
    const key = {
      pageId: page.id,
      level,
      x: Math.floor(root.x / worldSize),
      y: Math.floor(root.y / worldSize)
    }
    const tile = renderTile(renderer, graph, index, key)
    console.debug(
      JSON.stringify({
        indexChunks: index.size(),
        tileChunks: tile.chunkCount,
        estimatedCost: tile.estimatedCost,
        renderMs: tile.renderMs
      })
    )

    expect(tile.chunkCount).toBeLessThan(index.size())
    expect(tile.renderMs).toBeLessThan(50)
    deleteRenderedTile(tile)
  } finally {
    index.dispose()
    renderer.destroy()
  }
})
