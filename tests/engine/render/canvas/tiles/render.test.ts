import { beforeAll, describe, expect, test } from 'bun:test'

import { SceneGraph } from '@open-pencil/scene-graph'

import { initCanvasKit } from '#cli/headless'
import { SkiaRenderer } from '#core/canvas'
import { RenderChunkIndex, RenderChunkPictureCache } from '#core/canvas/renderer/chunks'
import {
  deleteRenderedTile,
  renderTile,
  TILE_DEVICE_SIZE,
  TileSurfacePool,
  tileKeysForWorldBounds,
  tileWorldBounds
} from '#core/canvas/renderer/tiles'

import { expectDefined } from '#tests/helpers/assert'

let ck: Awaited<ReturnType<typeof initCanvasKit>>

beforeAll(async () => {
  ck = await initCanvasKit()
})

function color(r: number, g: number, b: number) {
  return [{ type: 'SOLID' as const, color: { r, g, b, a: 1 }, opacity: 1, visible: true }]
}

function pixels(image: ReturnType<typeof ck.MakeImageFromEncoded>, width: number, height: number) {
  if (!image) throw new Error('Expected image')
  return expectDefined(
    image.readPixels(0, 0, {
      width,
      height,
      colorType: ck.ColorType.RGBA_8888,
      alphaType: ck.AlphaType.Unpremul,
      colorSpace: ck.ColorSpace.SRGB
    }),
    'tile pixels'
  )
}

function differenceRatio(a: Uint8Array, b: Uint8Array, tolerance = 8) {
  let different = 0
  for (let index = 0; index < a.length; index++) {
    if (Math.abs(a[index] - b[index]) > tolerance) different++
  }
  return different / a.length
}

describe('tile rendering', () => {
  test('composes multiple queried tiles to match direct scene rendering', () => {
    const graph = new SceneGraph()
    const page = expectDefined(graph.getPages()[0], 'page')
    const clip = graph.createNode('FRAME', page.id, {
      x: 40,
      y: 30,
      width: 260,
      height: 180,
      clipsContent: true,
      cornerRadius: 20,
      fills: color(0.95, 0.95, 0.98)
    })
    const frame = graph.createNode('FRAME', clip.id, { width: 360, height: 160, fills: [] })
    for (let index = 0; index < 48; index++) {
      graph.createNode(index % 2 === 0 ? 'RECTANGLE' : 'ELLIPSE', frame.id, {
        x: (index % 12) * 28,
        y: Math.floor(index / 12) * 36,
        width: 32,
        height: 32,
        fills: color((index % 3) * 0.35, 0.3, 0.85 - (index % 2) * 0.3)
      })
    }

    const directSurface = expectDefined(ck.MakeSurface(320, 240), 'direct surface')
    const tiledSurface = expectDefined(ck.MakeSurface(320, 240), 'tiled surface')
    const tileFactorySurface = expectDefined(ck.MakeSurface(320, 240), 'tile factory surface')
    const direct = new SkiaRenderer(ck, directSurface)
    const tiled = new SkiaRenderer(ck, tiledSurface)
    const tileFactory = new SkiaRenderer(ck, tileFactorySurface)
    const { index } = RenderChunkIndex.build(graph, page.id)
    const level = 1
    const keys = tileKeysForWorldBounds(page.id, level, {
      minX: 0,
      minY: 0,
      maxX: 320,
      maxY: 240
    })
    const pictureCache = new RenderChunkPictureCache()
    const surfacePool = new TileSurfacePool()
    try {
      direct.surface.getCanvas().clear(ck.WHITE)
      direct.renderSceneToCanvas(direct.surface.getCanvas(), graph, page.id)
      direct.surface.flush()
      const directImage = direct.surface.makeImageSnapshot()

      const tiledCanvas = tiled.surface.getCanvas()
      tiledCanvas.clear(ck.WHITE)
      const rendered = keys.map((key) =>
        renderTile(tileFactory, graph, index, key, pictureCache, surfacePool)
      )
      for (const tile of rendered) {
        const bounds = tileWorldBounds(tile.key)
        tiledCanvas.drawImageRectOptions(
          tile.image,
          ck.LTRBRect(0, 0, TILE_DEVICE_SIZE, TILE_DEVICE_SIZE),
          ck.LTRBRect(bounds.minX, bounds.minY, bounds.maxX, bounds.maxY),
          ck.FilterMode.Nearest,
          ck.MipmapMode.None,
          null
        )
      }
      tiled.surface.flush()
      const tiledImage = tiled.surface.makeImageSnapshot()

      expect(
        differenceRatio(pixels(directImage, 320, 240), pixels(tiledImage, 320, 240))
      ).toBeLessThan(0.01)
      expect(rendered.every((tile) => tile.chunkCount < index.size())).toBe(true)
      expect(rendered.every((tile) => tile.image.width() === TILE_DEVICE_SIZE)).toBe(true)

      directImage.delete()
      tiledImage.delete()
      for (const tile of rendered) deleteRenderedTile(tile)
    } finally {
      surfacePool.clear()
      pictureCache.clear()
      index.dispose()
      direct.destroy()
      tiled.destroy()
      tileFactory.destroy()
    }
  })
})
