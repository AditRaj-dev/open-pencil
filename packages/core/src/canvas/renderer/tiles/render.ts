import type { Image as CKImage } from 'canvaskit-wasm'

import type { SceneGraph } from '@open-pencil/scene-graph'

import type { SkiaRenderer } from '#core/canvas/renderer'
import {
  deleteRecordedRenderChunks,
  drawRenderChunkDirect,
  recordRenderChunk,
  type RenderChunk,
  type RenderChunkIndex
} from '#core/canvas/renderer/chunks'

import { TILE_DEVICE_SIZE, type TileKey, tileWorldBounds } from './geometry'

export interface RenderedTile {
  key: TileKey
  image: CKImage
  chunkCount: number
  estimatedCost: number
  renderMs: number
}

export function renderTile(
  renderer: SkiaRenderer,
  graph: SceneGraph,
  index: RenderChunkIndex,
  key: TileKey
): RenderedTile {
  const startedAt = performance.now()
  const bounds = tileWorldBounds(key)
  const chunks = index.search(bounds)
  const surface = renderer.surface.makeSurface({
    width: TILE_DEVICE_SIZE,
    height: TILE_DEVICE_SIZE,
    colorType: renderer.ck.ColorType.RGBA_8888,
    alphaType: renderer.ck.AlphaType.Premul,
    colorSpace: renderer.ck.ColorSpace.SRGB
  })
  const canvas = surface.getCanvas()
  canvas.clear(renderer.ck.TRANSPARENT)
  canvas.scale(key.level, key.level)
  canvas.translate(-bounds.minX, -bounds.minY)

  const recorded = new Map<string, ReturnType<typeof recordRenderChunk>>()
  try {
    for (const chunk of chunks) {
      if (chunk.interruptible) {
        const picture = recordRenderChunk(renderer, graph, chunk)
        recorded.set(chunk.id, picture)
        canvas.drawPicture(picture.picture)
      } else {
        drawRenderChunkDirect(renderer, canvas, graph, chunk)
      }
    }
    surface.flush()
    const image = surface.makeImageSnapshot()
    return {
      key,
      image,
      chunkCount: chunks.length,
      estimatedCost: chunks.reduce((total, chunk) => total + chunk.estimatedCost, 0),
      renderMs: performance.now() - startedAt
    }
  } finally {
    deleteRecordedRenderChunks([...recorded.values()])
    surface.delete()
  }
}

export function deleteRenderedTile(tile: RenderedTile): void {
  tile.image.delete()
}

export function tileChunks(index: RenderChunkIndex, key: TileKey): RenderChunk[] {
  return index.search(tileWorldBounds(key))
}
