import type { Canvas, Picture } from 'canvaskit-wasm'

import type { SceneGraph, SceneNode } from '@open-pencil/scene-graph'
import { getWorldMatrix } from '@open-pencil/scene-graph/coordinate'
import Matrix from '@open-pencil/scene-graph/matrix'

import type { SkiaRenderer } from '#core/canvas/renderer'
import { makeSmoothRRectPath, nodeHasRadius, nodeHasSmoothCorners } from '#core/canvas/shapes'

import type { RenderChunk } from './index'

export interface RecordedRenderChunk {
  chunk: RenderChunk
  picture: Picture
}

function clipAncestor(r: SkiaRenderer, canvas: Canvas, graph: SceneGraph, node: SceneNode): void {
  canvas.concat(getWorldMatrix(node, graph))
  if (nodeHasSmoothCorners(node)) {
    const path = makeSmoothRRectPath(r, node)
    canvas.clipPath(path, r.ck.ClipOp.Intersect, true)
    path.delete()
  } else if (nodeHasRadius(node)) {
    canvas.clipRRect(r.makeRRect(node), r.ck.ClipOp.Intersect, true)
  } else {
    canvas.clipRect(r.ck.LTRBRect(0, 0, node.width, node.height), r.ck.ClipOp.Intersect, true)
  }
  const inverse = Matrix.invert(getWorldMatrix(node, graph))
  if (inverse) canvas.concat(inverse)
}

function drawChunkContent(
  renderer: SkiaRenderer,
  canvas: Canvas,
  graph: SceneGraph,
  chunk: RenderChunk
): void {
  canvas.save()
  for (const ancestorId of chunk.context.ancestorClipIds) {
    const ancestor = graph.getNode(ancestorId)
    if (ancestor) clipAncestor(renderer, canvas, graph, ancestor)
  }
  canvas.concat(chunk.context.parentTransform)
  if (chunk.kind === 'self') renderer.renderNodeSelf(canvas, graph, chunk.nodeId)
  else renderer.renderNode(canvas, graph, chunk.nodeId, {}, 0, 0, true)
  canvas.restore()
}

export function drawRenderChunkDirect(
  renderer: SkiaRenderer,
  canvas: Canvas,
  graph: SceneGraph,
  chunk: RenderChunk
): void {
  const previousViewport = renderer.worldViewport
  renderer.worldViewport = {
    x: chunk.minX,
    y: chunk.minY,
    w: chunk.maxX - chunk.minX,
    h: chunk.maxY - chunk.minY
  }
  try {
    drawChunkContent(renderer, canvas, graph, chunk)
  } finally {
    renderer.worldViewport = previousViewport
  }
}

export function recordRenderChunk(
  renderer: SkiaRenderer,
  graph: SceneGraph,
  chunk: RenderChunk
): RecordedRenderChunk {
  if (!chunk.interruptible) {
    throw new Error(`Atomic render chunk ${chunk.id} must be drawn into its destination surface`)
  }
  const recorder = new renderer.ck.PictureRecorder()
  const canvas = recorder.beginRecording(
    renderer.ck.LTRBRect(chunk.minX, chunk.minY, chunk.maxX, chunk.maxY)
  )
  const previousViewport = renderer.worldViewport
  renderer.worldViewport = {
    x: chunk.minX,
    y: chunk.minY,
    w: chunk.maxX - chunk.minX,
    h: chunk.maxY - chunk.minY
  }
  try {
    drawChunkContent(renderer, canvas, graph, chunk)
  } finally {
    renderer.worldViewport = previousViewport
  }
  const picture = recorder.finishRecordingAsPicture()
  recorder.delete()
  return { chunk, picture }
}

export function drawRecordedRenderChunks(canvas: Canvas, chunks: RecordedRenderChunk[]): void {
  for (const recorded of chunks) canvas.drawPicture(recorded.picture)
}

export function deleteRecordedRenderChunks(chunks: RecordedRenderChunk[]): void {
  for (const recorded of chunks) recorded.picture.delete()
}
