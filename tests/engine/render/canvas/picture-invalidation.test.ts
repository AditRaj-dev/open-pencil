import { expect, mock, test } from 'bun:test'

import type { SkiaRenderer } from '#core/canvas/renderer'
import { invalidateAllPictures } from '#core/canvas/renderer/state'

function deletable() {
  return { delete: mock() }
}

test('full picture invalidation resets tiled font-dependent resources', () => {
  const scenePicture = deletable()
  const backingImage = deletable()
  const nodePicture = deletable()
  const subtreePicture = deletable()
  const renderer = {
    scenePicture,
    scenePictureVersion: 1,
    scenePictureFontGeneration: 1,
    sceneBacking: { image: backingImage },
    sceneBackingBuild: null,
    nodePictureCache: new Map([['node', nodePicture]]),
    nodePictureCacheGenerations: new Map([['node', 1]]),
    effectRasterCache: new Map(),
    subtreePictureCache: new Map([['subtree', { picture: subtreePicture }]]),
    subtreePictureCachePageId: 'page',
    subtreePictureCacheSceneVersion: 1,
    subtreePictureCachePositionPreviewVersion: 1,
    subtreePictureCacheFontGeneration: 1,
    tiledScene: { invalidateStructure: mock() }
  } as SkiaRenderer

  invalidateAllPictures(renderer)

  expect(renderer.tiledScene.invalidateStructure).toHaveBeenCalledTimes(1)
  expect(scenePicture.delete).toHaveBeenCalledTimes(1)
  expect(backingImage.delete).toHaveBeenCalledTimes(1)
  expect(nodePicture.delete).toHaveBeenCalledTimes(1)
  expect(subtreePicture.delete).toHaveBeenCalledTimes(1)
})
