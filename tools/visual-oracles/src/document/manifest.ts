import { readFileSync } from 'node:fs'

export interface VisualOracleTarget {
  page: string
  node: string
  figmaNodeId: string
  openPencilNodeId?: string
  scale?: number
  fuzz?: string
  maximumDifferentPercent?: number
  expectedWidth?: number
  expectedHeight?: number
  minimumPageRoots?: number
}

export interface VisualOracleManifest {
  document: string
  appURL: string
  output?: string
  targets: VisualOracleTarget[]
}

export function readVisualOracleManifest(path: string): VisualOracleManifest {
  const parsed: unknown = JSON.parse(readFileSync(path, 'utf8'))
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Visual oracle manifest must be an object')
  }
  const manifest = parsed as Partial<VisualOracleManifest>
  if (!manifest.document || !manifest.appURL || !Array.isArray(manifest.targets)) {
    throw new Error('Visual oracle manifest requires document, appURL, and targets')
  }
  for (const target of manifest.targets) {
    if (!target.page || !target.node || !target.figmaNodeId) {
      throw new Error('Every visual oracle target requires page, node, and figmaNodeId')
    }
  }
  return manifest as VisualOracleManifest
}
