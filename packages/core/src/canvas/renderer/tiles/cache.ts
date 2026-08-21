import type { Image as CKImage } from 'canvaskit-wasm'

import { tileKeyString, type TileKey } from './geometry'
import type { RenderedTile } from './render'

export interface CachedTile {
  key: TileKey
  image: CKImage
  contentGeneration: number
  lastUsed: number
  bytes: number
}

const DEFAULT_MAX_TILE_BYTES = 128 * 1024 * 1024

export class TileImageCache {
  private readonly entries = new Map<string, CachedTile>()
  private bytes = 0
  private clock = 0

  constructor(private readonly maxBytes = DEFAULT_MAX_TILE_BYTES) {}

  get(key: TileKey): CachedTile | null {
    const id = tileKeyString(key)
    const entry = this.entries.get(id)
    if (!entry) return null
    entry.lastUsed = ++this.clock
    this.entries.delete(id)
    this.entries.set(id, entry)
    return entry
  }

  install(tile: RenderedTile, contentGeneration: number): CachedTile {
    const id = tileKeyString(tile.key)
    this.delete(id)
    const entry: CachedTile = {
      key: tile.key,
      image: tile.image,
      contentGeneration,
      lastUsed: ++this.clock,
      bytes: tile.image.width() * tile.image.height() * 4
    }
    this.entries.set(id, entry)
    this.bytes += entry.bytes
    this.evict()
    return entry
  }

  markStale(contentGeneration: number): void {
    for (const entry of this.entries.values()) {
      if (entry.contentGeneration >= contentGeneration)
        entry.contentGeneration = contentGeneration - 1
    }
  }

  clear(): void {
    for (const entry of this.entries.values()) entry.image.delete()
    this.entries.clear()
    this.bytes = 0
  }

  size(): number {
    return this.entries.size
  }

  byteSize(): number {
    return this.bytes
  }

  private delete(id: string): void {
    const entry = this.entries.get(id)
    if (!entry) return
    entry.image.delete()
    this.bytes -= entry.bytes
    this.entries.delete(id)
  }

  private evict(): void {
    while (this.bytes > this.maxBytes) {
      const oldest = this.entries.keys().next().value
      if (typeof oldest !== 'string') break
      this.delete(oldest)
    }
  }
}
