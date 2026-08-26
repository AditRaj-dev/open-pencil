import { populateAndApplyOverrides } from '@open-pencil/fig/instance-overrides'
import type { InstanceNodeChange } from '@open-pencil/fig/instance-overrides'
import {
  applyStyleRefsToFields,
  ENABLED_LIBRARIES_PLUGIN_KEY,
  getOpenPencilPluginValue,
  guidToString,
  importCanvasGuides,
  nodeChangeToProps,
  shouldImportTextAsAutoSize,
  sortChildren,
  resolveVariableConsumptionEntry,
  setVariableColorResolver
} from '@open-pencil/fig/node-change'
import type { NodeChange, VariableDataValuesEntry, Color, GUID } from '@open-pencil/kiwi/fig/codec'
import { SceneGraph } from '@open-pencil/scene-graph'
import type {
  ComponentPropertyDefinition,
  VariableType,
  VariableValue
} from '@open-pencil/scene-graph'

import { BLACK } from '#core/constants'
import { getLazyFigImportContext, setLazyFigImportContext } from '#core/kiwi/fig/lazy-import'

type AssetRef = { key: string; version?: string }
type AliasRef = { guid?: GUID; assetRef?: AssetRef }

function applyImportedCanvasMetadata(
  page: ReturnType<SceneGraph['addPage']>,
  canvasNc: NodeChange
) {
  page.source.format = 'fig'
  page.source.orderKey = canvasNc.parentIndex?.position ?? null
  if (canvasNc.backgroundColor)
    page.source.fig.rawNodeFields.backgroundColor = structuredClone(canvasNc.backgroundColor)
  if (canvasNc.backgroundPaints)
    page.source.fig.rawNodeFields.backgroundPaints = structuredClone(canvasNc.backgroundPaints)
  if (canvasNc.guides) {
    page.guides = importCanvasGuides(canvasNc.guides)
    page.source.fig.rawNodeFields.guides = structuredClone(canvasNc.guides)
  }
  page.source.fig.rawNodeFields.strokeJoin = canvasNc.strokeJoin
  page.source.fig.rawNodeFields.strokeWeight = canvasNc.strokeWeight
  if (canvasNc.pageType) page.source.fig.rawNodeFields.pageType = canvasNc.pageType
}

function applyImportedDocumentMetadata(graph: SceneGraph, docNc: NodeChange | undefined) {
  const rootNode = graph.getNode(graph.rootId)
  if (!docNc || !rootNode) return
  rootNode.source.format = 'fig'
  rootNode.pluginData = docNc.pluginData
    ? docNc.pluginData.map((entry) => ({
        pluginId: entry.pluginID,
        key: entry.key,
        value: entry.value
      }))
    : []
  rootNode.source.fig.rawNodeFields.strokeJoin = docNc.strokeJoin
  rootNode.source.fig.rawNodeFields.strokeWeight = docNc.strokeWeight
  const bindings = getOpenPencilPluginValue(docNc, ENABLED_LIBRARIES_PLUGIN_KEY)
  if (!bindings) return
  try {
    const parsed = JSON.parse(bindings) as unknown
    if (!Array.isArray(parsed)) return
    for (const entry of parsed) {
      if (!entry || typeof entry !== 'object' || Array.isArray(entry)) continue
      const value = entry as { libraryId?: unknown; revisionId?: unknown; enabled?: unknown }
      if (typeof value.libraryId !== 'string' || typeof value.revisionId !== 'string') continue
      graph.enabledLibraries.set(value.libraryId, {
        libraryId: value.libraryId,
        revisionId: value.revisionId,
        enabled: value.enabled === true
      })
    }
  } catch (error) {
    console.warn('Ignored malformed OpenPencil library metadata', error)
  }
}

function assetRefKey(assetRef: AssetRef): string {
  return assetRef.version ? `${assetRef.key}@${assetRef.version}` : assetRef.key
}

function buildAssetRefMap(changeMap: Map<string, NodeChange>): Map<string, string> {
  const refs = new Map<string, string>()
  for (const [id, nc] of changeMap) {
    if (typeof nc.key !== 'string') continue
    if (typeof nc.version !== 'string' || !refs.has(nc.key)) refs.set(nc.key, id)
    if (typeof nc.version === 'string')
      refs.set(assetRefKey({ key: nc.key, version: nc.version }), id)
    if (typeof nc.userFacingVersion === 'string') {
      refs.set(assetRefKey({ key: nc.key, version: nc.userFacingVersion }), id)
    }
  }
  return refs
}

function resolveAliasId(alias: AliasRef, assetRefs: Map<string, string>): string | undefined {
  if (alias.guid) return guidToString(alias.guid)
  if (!alias.assetRef) return undefined
  return assetRefs.get(assetRefKey(alias.assetRef)) ?? assetRefs.get(alias.assetRef.key)
}

function buildVariableColorResolver(
  changeMap: Map<string, NodeChange>,
  assetRefs: Map<string, string>
): (alias: AliasRef) => Color | null {
  // Collect variable data: GUID → entries
  const varEntries = new Map<string, VariableDataValuesEntry[]>()
  const varSetId = new Map<string, string>()
  for (const [id, nc] of changeMap) {
    if (nc.type !== 'VARIABLE') continue
    varEntries.set(id, nc.variableDataValues?.entries ?? [])
    const setGuid = nc.variableSetID?.guid ? guidToString(nc.variableSetID.guid) : undefined
    const parentGuid = nc.parentIndex?.guid ? guidToString(nc.parentIndex.guid) : undefined
    if (setGuid) varSetId.set(id, setGuid)
    else if (parentGuid) varSetId.set(id, parentGuid)
  }

  // Collection default modes
  const defaultModes = new Map<string, string>()
  for (const [id, nc] of changeMap) {
    if (nc.type !== 'VARIABLE_SET') continue
    const modes = nc.variableSetModes ?? []
    if (modes.length > 0) defaultModes.set(id, guidToString(modes[0].id))
  }

  function resolveById(
    id: string,
    preferredModeId: string | undefined,
    depth: number
  ): Color | null {
    if (depth > 10) return null
    const entries = varEntries.get(id)
    if (!entries?.length) return null

    const setId = varSetId.get(id)
    const defaultMode = setId ? defaultModes.get(setId) : undefined
    let entry = preferredModeId
      ? entries.find((e) => guidToString(e.modeID) === preferredModeId)
      : undefined
    if (!entry && defaultMode) entry = entries.find((e) => guidToString(e.modeID) === defaultMode)
    if (!entry) entry = entries[0]

    const val = entry.variableData.value
    if (!val) return null
    if (val.colorValue) return val.colorValue
    if (val.alias) {
      const aliasId = resolveAliasId(val.alias, assetRefs)
      if (aliasId) return resolveById(aliasId, guidToString(entry.modeID), depth + 1)
    }
    return null
  }

  return function resolve(alias: AliasRef): Color | null {
    const id = resolveAliasId(alias, assetRefs)
    return id ? resolveById(id, undefined, 0) : null
  }
}

interface ChangeMaps {
  changeMap: Map<string, NodeChange>
  parentMap: Map<string, string>
  childrenMap: Map<string, string[]>
}

function buildChangeMaps(nodeChanges: NodeChange[]): ChangeMaps {
  const changeMap = new Map<string, NodeChange>()
  const parentMap = new Map<string, string>()
  const childrenMap = new Map<string, string[]>()

  for (const nc of nodeChanges) {
    if (!nc.guid) continue
    if (nc.phase === 'REMOVED') continue
    const id = guidToString(nc.guid)
    changeMap.set(id, nc)

    if (nc.parentIndex?.guid) {
      const pid = guidToString(nc.parentIndex.guid)
      parentMap.set(id, pid)
      let siblings = childrenMap.get(pid)
      if (!siblings) {
        siblings = []
        childrenMap.set(pid, siblings)
      }
      siblings.push(id)
    }
  }

  for (const [parentId, children] of childrenMap) {
    const parentNc = changeMap.get(parentId)
    if (parentNc) sortChildren(children, parentNc, changeMap)
  }

  return { changeMap, parentMap, childrenMap }
}

function resolveVariableType(resolvedType: string | undefined): VariableType {
  if (resolvedType === 'COLOR') return 'COLOR'
  if (resolvedType === 'BOOLEAN') return 'BOOLEAN'
  if (resolvedType === 'STRING') return 'STRING'
  return 'FLOAT'
}

function resolveVariableValue(
  entry: VariableDataValuesEntry,
  assetRefs: Map<string, string>
): VariableValue | undefined {
  const vd = entry.variableData
  if (!vd.value) return undefined

  const dt = vd.dataType ?? vd.resolvedDataType
  if (dt === 'COLOR' && vd.value.colorValue) {
    const c = vd.value.colorValue
    return { r: c.r, g: c.g, b: c.b, a: c.a }
  }
  if (dt === 'BOOLEAN') return vd.value.boolValue ?? false
  if (dt === 'STRING') return vd.value.textValue ?? ''
  if (dt === 'ALIAS' && vd.value.alias) {
    const aliasId = resolveAliasId(vd.value.alias, assetRefs)
    if (aliasId) return { aliasId }
    return undefined
  }
  return vd.value.floatValue ?? 0
}

function resolveDefaultValue(type: VariableType): VariableValue {
  if (type === 'BOOLEAN') return false
  if (type === 'STRING') return ''
  if (type === 'COLOR') return { ...BLACK }
  return 0
}

function importCollections(changeMap: Map<string, NodeChange>, graph: SceneGraph): void {
  for (const [id, nc] of changeMap) {
    if (nc.type !== 'VARIABLE_SET') continue

    const modes = (nc.variableSetModes ?? []).map((m) => {
      const modeId = guidToString(m.id)
      return { modeId, name: m.name }
    })
    if (modes.length === 0) modes.push({ modeId: 'default', name: 'Default' })

    graph.addCollection({
      id,
      name: nc.name ?? 'Variables',
      modes,
      defaultModeId: modes[0].modeId,
      variableIds: []
    })
  }
}

function resolveVariableCollectionId(
  nc: NodeChange,
  id: string,
  parentMap: Map<string, string>,
  assetRefs: Map<string, string>
): string {
  if (nc.variableSetID?.guid) return guidToString(nc.variableSetID.guid)
  const assetRef = nc.variableSetID?.assetRef
  if (assetRef) return assetRefs.get(assetRefKey(assetRef)) ?? assetRefs.get(assetRef.key) ?? ''
  return parentMap.get(id) ?? ''
}

function addFallbackCollection(
  changeMap: Map<string, NodeChange>,
  graph: SceneGraph,
  collectionId: string
): void {
  if (graph.variableCollections.has(collectionId)) return
  const parentNc = changeMap.get(collectionId)
  graph.addCollection({
    id: collectionId,
    name: parentNc?.name ?? 'Variables',
    modes: [{ modeId: 'default', name: 'Default' }],
    defaultModeId: 'default',
    variableIds: []
  })
}

function importVariableEntries(
  changeMap: Map<string, NodeChange>,
  parentMap: Map<string, string>,
  graph: SceneGraph,
  assetRefs: Map<string, string>
): void {
  for (const [id, nc] of changeMap) {
    if (nc.type !== 'VARIABLE') continue

    const collectionId = resolveVariableCollectionId(nc, id, parentMap, assetRefs)
    addFallbackCollection(changeMap, graph, collectionId)

    const type = resolveVariableType(nc.variableResolvedType)
    const valuesByMode: Record<string, VariableValue> = {}

    if (nc.variableDataValues?.entries) {
      for (const entry of nc.variableDataValues.entries) {
        const val = resolveVariableValue(entry, assetRefs)
        if (val !== undefined) {
          valuesByMode[guidToString(entry.modeID)] = val
        }
      }
    }

    if (Object.keys(valuesByMode).length === 0) {
      const col = graph.variableCollections.get(collectionId)
      const defaultMode = col?.defaultModeId ?? 'default'
      valuesByMode[defaultMode] = resolveDefaultValue(type)
    }

    graph.addVariable({
      id,
      name: nc.name ?? 'Variable',
      type,
      collectionId,
      valuesByMode,
      description: '',
      hiddenFromPublishing: false,
      key: typeof nc.key === 'string' ? nc.key : undefined,
      version: typeof nc.version === 'string' ? nc.version : undefined
    })
  }
}

function importCanvasPage(
  graph: SceneGraph,
  canvasId: string,
  canvasNc: NodeChange,
  childrenMap: Map<string, string[]>,
  created: Set<string>,
  canvasIdToPageId: Map<string, string>,
  createSceneNode: (ncId: string, graphParentId: string) => void,
  materialize: boolean
): void {
  const page = graph.addPage(canvasNc.name ?? 'Page')
  page.source.id = canvasId
  applyImportedCanvasMetadata(page, canvasNc)
  canvasIdToPageId.set(canvasId, page.id)
  if (canvasNc.internalOnly) page.internalOnly = true
  created.add(canvasId)
  if (!materialize) return
  for (const childId of childrenMap.get(canvasId) ?? []) createSceneNode(childId, page.id)
}

function importPages(
  graph: SceneGraph,
  changeMap: Map<string, NodeChange>,
  parentMap: Map<string, string>,
  childrenMap: Map<string, string[]>,
  created: Set<string>,
  canvasIdToPageId: Map<string, string>,
  createSceneNode: (ncId: string, graphParentId: string) => void,
  materializeOnlyFirstPage = false
): void {
  let docId: string | null = null
  for (const [id, nc] of changeMap) {
    if (nc.type === 'DOCUMENT' || id === '0:0') {
      docId = id
      break
    }
  }

  if (docId) {
    applyImportedDocumentMetadata(graph, changeMap.get(docId))

    let materializedPage = false
    for (const canvasId of childrenMap.get(docId) ?? []) {
      const canvasNc = changeMap.get(canvasId)
      if (!canvasNc) continue
      if (canvasNc.type === 'CANVAS') {
        const shouldMaterialize: boolean =
          !materializeOnlyFirstPage || (!materializedPage && !canvasNc.internalOnly)
        if (shouldMaterialize) materializedPage = true
        importCanvasPage(
          graph,
          canvasId,
          canvasNc,
          childrenMap,
          created,
          canvasIdToPageId,
          createSceneNode,
          shouldMaterialize
        )
      } else {
        createSceneNode(canvasId, graph.getPages()[0]?.id ?? graph.rootId)
      }
    }
  } else {
    const roots: string[] = []
    for (const [id] of changeMap) {
      const pid = parentMap.get(id)
      if (!pid || !changeMap.has(pid)) roots.push(id)
    }
    const page = graph.getPages()[0] ?? graph.addPage('Page 1')
    for (const rootId of roots) {
      createSceneNode(rootId, page.id)
    }
  }
}

function importVariableBindings(
  changeMap: Map<string, NodeChange>,
  guidToNodeId: Map<string, string>,
  graph: SceneGraph
): void {
  for (const [ncId, nc] of changeMap) {
    if (!nc.variableConsumptionMap?.entries?.length) continue
    const nodeId = guidToNodeId.get(ncId)
    if (!nodeId) continue
    for (const entry of nc.variableConsumptionMap.entries) {
      const binding = resolveVariableConsumptionEntry(entry)
      if (binding) graph.bindVariable(nodeId, binding.field, binding.variableId)
    }
  }
}

function remapComponentIds(graph: SceneGraph, guidToNodeId: Map<string, string>): void {
  graph.preserveSourceMetadataDuring(() => {
    for (const node of graph.getAllNodes()) {
      if (node.type !== 'INSTANCE' || !node.componentId) continue
      const remapped = guidToNodeId.get(node.componentId)
      if (remapped) graph.updateNode(node.id, { componentId: remapped })
    }
  })
}

/**
 * INSTANCE_SWAP definitions/assignments store a target node's GUID (matching
 * how it was exported), not this import's freshly-assigned node ID — remap
 * them the same way remapComponentIds fixes up instance.componentId.
 */
function remapInstanceSwapPropertyValues(
  graph: SceneGraph,
  guidToNodeId: Map<string, string>
): void {
  const defsById = new Map<string, ComponentPropertyDefinition>()
  for (const node of graph.getAllNodes()) {
    for (const def of node.componentPropertyDefinitions) {
      if (!defsById.has(def.id)) defsById.set(def.id, def)
    }
  }

  graph.preserveSourceMetadataDuring(() => {
    for (const node of graph.getAllNodes()) {
      if (node.componentPropertyDefinitions.length > 0) {
        const defs = node.componentPropertyDefinitions.map((def) => {
          if (def.type !== 'INSTANCE_SWAP') return def
          const remappedDefault = def.defaultValue ? guidToNodeId.get(def.defaultValue) : undefined
          if (!remappedDefault) return def
          return { ...def, defaultValue: remappedDefault }
        })
        const changed = defs.some((def, i) => def !== node.componentPropertyDefinitions[i])
        if (changed) graph.updateNode(node.id, { componentPropertyDefinitions: defs })
      }

      if (Object.keys(node.componentPropertyAssignments).length > 0) {
        let changed = false
        const assignments = { ...node.componentPropertyAssignments }
        for (const [propId, value] of Object.entries(assignments)) {
          if (defsById.get(propId)?.type !== 'INSTANCE_SWAP') continue
          const remapped = guidToNodeId.get(value)
          if (remapped) {
            assignments[propId] = remapped
            changed = true
          }
        }
        if (changed) graph.updateNode(node.id, { componentPropertyAssignments: assignments })
      }
    }
  })
}

function applyVariantPropSpecs(graph: SceneGraph): void {
  for (const node of graph.getAllNodes()) {
    if (node.type !== 'COMPONENT' || node.variantPropSpecs.length === 0 || !node.parentId) continue
    const parent = graph.getNode(node.parentId)
    if (parent?.type !== 'COMPONENT_SET') continue
    const defs = new Map(parent.componentPropertyDefinitions.map((def) => [def.id, def.name]))
    const values: Record<string, string> = {}
    for (const spec of node.variantPropSpecs)
      values[defs.get(spec.propDefId) ?? spec.propDefId] = spec.value
    graph.updateNode(node.id, { componentPropertyValues: values })
  }
}

function parseDocumentColorSpace(nodeChanges: NodeChange[]): 'srgb' | 'display-p3' {
  const documentNode = nodeChanges.find((nc) => nc.type === 'DOCUMENT')
  return documentNode?.documentColorProfile === 'DISPLAY_P3' ? 'display-p3' : 'srgb'
}

function referencedComponentSourceIds(nc: NodeChange): string[] {
  const ids = new Set<string>()
  const symbolData = nc.symbolData as
    | {
        symbolID?: GUID
        symbolOverrides?: Array<{ overriddenSymbolID?: GUID }>
      }
    | undefined
  if (symbolData?.symbolID) ids.add(guidToString(symbolData.symbolID))
  for (const override of symbolData?.symbolOverrides ?? []) {
    if (override.overriddenSymbolID) ids.add(guidToString(override.overriddenSymbolID))
  }
  for (const assignment of (nc.componentPropAssignments ?? []) as Array<{
    value?: { guidValue?: GUID }
    varValue?: { value?: { symbolIdValue?: { guid?: GUID } } }
  }>) {
    const guid = assignment.value?.guidValue ?? assignment.varValue?.value?.symbolIdValue?.guid
    if (guid) ids.add(guidToString(guid))
  }
  return [...ids]
}

function applyStyleRefs(
  changeMap: Map<string, NodeChange>,
  assetRefs: ReadonlyMap<string, string>
): void {
  for (const nc of changeMap.values()) applyStyleRefsToFields(changeMap, nc, assetRefs)
}

export interface FigImportOptions {
  populate?: 'all' | 'first-page' | 'none'
}

function rememberLazyFigImportContext(
  graph: SceneGraph,
  changeMap: Map<string, NodeChange>,
  guidToNodeId: Map<string, string>,
  blobs: Uint8Array[],
  populatedRootIds: string[],
  parentMap: Map<string, string>,
  childrenMap: Map<string, string[]>,
  canvasIdToPageId: Map<string, string>,
  materializedSourceIds: Set<string>,
  materializeRoots: (rootIds: Iterable<string>) => void
): void {
  setLazyFigImportContext(graph, {
    changeMap: changeMap as Map<string, InstanceNodeChange>,
    guidToNodeId,
    blobs,
    populatedRootIds: new Set(populatedRootIds),
    parentMap,
    childrenMap,
    canvasIdToPageId,
    materializedSourceIds,
    materializeRoots
  })
}

function sourceDependencyClosure(
  changeMap: Map<string, NodeChange>,
  parentMap: Map<string, string>,
  childrenMap: Map<string, string[]>,
  rootIds: Iterable<string>
): Set<string> {
  const included = new Set<string>()
  const scanQueue: string[] = []

  function includeSubtree(rootId: string): void {
    const pending = [rootId]
    const traversed = new Set<string>()
    for (const id of pending) {
      if (traversed.has(id) || !changeMap.has(id)) continue
      traversed.add(id)
      if (!included.has(id)) {
        included.add(id)
        scanQueue.push(id)
      }
      pending.push(...(childrenMap.get(id) ?? []))
    }
  }

  function includeAncestors(id: string): void {
    const ancestors: string[] = []
    let current: string | undefined = id
    while (current && changeMap.has(current)) {
      ancestors.push(current)
      const parent = parentMap.get(current)
      if (!parent || changeMap.get(parent)?.type === 'DOCUMENT') break
      current = parent
    }
    for (const ancestor of ancestors.reverse()) {
      if (!included.has(ancestor)) {
        included.add(ancestor)
        scanQueue.push(ancestor)
      }
    }
  }

  for (const rootId of rootIds) includeSubtree(rootId)
  for (const sourceId of scanQueue) {
    const change = changeMap.get(sourceId)
    if (!change) continue
    for (const dependencyId of referencedComponentSourceIds(change)) {
      includeAncestors(dependencyId)
      includeSubtree(dependencyId)
    }
  }
  return included
}

function initialSourceDependencyClosure(
  changeMap: Map<string, NodeChange>,
  childrenMap: Map<string, string[]>,
  parentMap: Map<string, string>
): Set<string> {
  const documentId = [...changeMap].find(([, change]) => change.type === 'DOCUMENT')?.[0] ?? '0:0'
  const firstCanvasId = (childrenMap.get(documentId) ?? []).find((id) => {
    const change = changeMap.get(id)
    return change?.type === 'CANVAS' && !change.internalOnly
  })
  return sourceDependencyClosure(
    changeMap,
    parentMap,
    childrenMap,
    firstCanvasId ? [firstCanvasId] : []
  )
}

function materializedComponentPageIds(graph: SceneGraph): Set<string> {
  const pageIds = new Set<string>()
  for (const node of graph.getAllNodes()) {
    if (node.type !== 'COMPONENT' && node.type !== 'COMPONENT_SET') continue
    let current = node.parentId ? graph.getNode(node.parentId) : undefined
    while (current?.parentId && current.type !== 'CANVAS') {
      current = graph.getNode(current.parentId)
    }
    if (current?.type === 'CANVAS') pageIds.add(current.id)
  }
  return pageIds
}

export function restoreLazyFigImportMaterializer(graph: SceneGraph): void {
  const context = getLazyFigImportContext(graph)
  if (!context) return
  context.materializeRoots = createLazyMaterializer(graph, context)
}

function createLazyMaterializer(
  graph: SceneGraph,
  context: NonNullable<ReturnType<typeof getLazyFigImportContext>>
): (rootIds: Iterable<string>) => void {
  const changeMap = context.changeMap as Map<string, NodeChange>
  const { guidToNodeId, blobs, parentMap, childrenMap, canvasIdToPageId } = context
  const created = context.materializedSourceIds
  function createSourceNode(sourceId: string, graphParentId: string): void {
    if (created.has(sourceId)) return
    const change = changeMap.get(sourceId)
    if (!change) return
    created.add(sourceId)
    const { nodeType, ...props } = nodeChangeToProps(change, blobs)
    if (nodeType === 'DOCUMENT' || nodeType === 'VARIABLE' || change.type === 'VARIABLE_SET') return
    if (shouldImportTextAsAutoSize(change, changeMap.get(parentMap.get(sourceId) ?? ''))) {
      props.textAutoResize = 'WIDTH_AND_HEIGHT'
    }
    const node = graph.createNode(nodeType, graphParentId, props)
    guidToNodeId.set(sourceId, node.id)
    for (const childSourceId of childrenMap.get(sourceId) ?? []) {
      createSourceNode(childSourceId, node.id)
    }
  }
  return (rootIds) => {
    const sourceRoots = [...rootIds]
      .map((id) => graph.getNode(id)?.source.id)
      .filter((id): id is string => id !== null && id !== undefined)
    const closure = sourceDependencyClosure(changeMap, parentMap, childrenMap, sourceRoots)
    for (const sourceId of closure) {
      if (created.has(sourceId)) continue
      const parentSourceId = parentMap.get(sourceId)
      if (!parentSourceId) continue
      const graphParentId = canvasIdToPageId.get(parentSourceId) ?? guidToNodeId.get(parentSourceId)
      if (graphParentId) createSourceNode(sourceId, graphParentId)
    }
    remapComponentIds(graph, guidToNodeId)
    remapInstanceSwapPropertyValues(graph, guidToNodeId)
    applyVariantPropSpecs(graph)
  }
}

export function importNodeChanges(
  nodeChanges: NodeChange[],
  blobs: Uint8Array[] = [],
  images?: Map<string, Uint8Array>,
  options: FigImportOptions = {}
): SceneGraph {
  const graph = new SceneGraph()
  graph.documentColorSpace = parseDocumentColorSpace(nodeChanges)

  if (images) {
    for (const [hash, data] of images) {
      graph.images.set(hash, data)
    }
  }

  for (const page of graph.getPages(true)) {
    graph.deleteNode(page.id)
  }

  const { changeMap, parentMap, childrenMap } = buildChangeMaps(nodeChanges)
  const assetRefs = buildAssetRefMap(changeMap)
  applyStyleRefs(changeMap, assetRefs)
  setVariableColorResolver(buildVariableColorResolver(changeMap, assetRefs))

  const canvasIdToPageId = new Map<string, string>()
  const created = new Set<string>()
  const guidToNodeId = new Map<string, string>()
  const getChildren = (ncId: string): string[] => childrenMap.get(ncId) ?? []

  function createSceneNode(ncId: string, graphParentId: string) {
    if (created.has(ncId)) return
    created.add(ncId)

    const nc = changeMap.get(ncId)
    if (!nc) return

    const { nodeType, ...props } = nodeChangeToProps(nc, blobs)
    if (props.sharedStyleType) props.internalOnly = true
    if (nodeType === 'DOCUMENT' || nodeType === 'VARIABLE' || nc.type === 'VARIABLE_SET') return
    if (shouldImportTextAsAutoSize(nc, changeMap.get(parentMap.get(ncId) ?? ''))) {
      props.textAutoResize = 'WIDTH_AND_HEIGHT'
    }

    const parentId = canvasIdToPageId.get(graphParentId) ?? graphParentId
    const node = graph.createNode(nodeType, parentId, props)
    guidToNodeId.set(ncId, node.id)

    for (const childId of getChildren(ncId)) {
      createSceneNode(childId, node.id)
    }
  }

  importPages(
    graph,
    changeMap,
    parentMap,
    childrenMap,
    created,
    canvasIdToPageId,
    createSceneNode,
    options.populate === 'first-page'
  )

  const initialSourceIds =
    options.populate === 'first-page'
      ? initialSourceDependencyClosure(changeMap, childrenMap, parentMap)
      : null
  if (initialSourceIds) {
    for (const sourceId of initialSourceIds) {
      if (created.has(sourceId)) continue
      const parentSourceId = parentMap.get(sourceId)
      if (!parentSourceId) continue
      const graphParentId = canvasIdToPageId.get(parentSourceId) ?? guidToNodeId.get(parentSourceId)
      if (graphParentId) createSceneNode(sourceId, graphParentId)
    }
  }

  importCollections(changeMap, graph)
  importVariableEntries(changeMap, parentMap, graph, assetRefs)
  importVariableBindings(changeMap, guidToNodeId, graph)
  remapComponentIds(graph, guidToNodeId)
  remapInstanceSwapPropertyValues(graph, guidToNodeId)
  applyVariantPropSpecs(graph)

  const firstPageId = graph.getPages()[0]?.id
  const dependencyPageIds =
    options.populate === 'first-page' ? materializedComponentPageIds(graph) : new Set<string>()
  const activeRootIds =
    options.populate === 'first-page' && firstPageId
      ? [firstPageId, ...dependencyPageIds]
      : undefined

  if (options.populate !== 'none') {
    graph.preserveSourceMetadataDuring(() => {
      populateAndApplyOverrides(
        graph,
        changeMap as Map<string, InstanceNodeChange>,
        guidToNodeId,
        blobs,
        activeRootIds
      )
    })
  }

  const initiallyPopulatedRootIds = firstPageId ? [firstPageId] : []
  if (activeRootIds) {
    const materializeRoots = createLazyMaterializer(graph, {
      changeMap: changeMap as Map<string, InstanceNodeChange>,
      guidToNodeId,
      blobs,
      populatedRootIds: new Set(initiallyPopulatedRootIds),
      parentMap,
      childrenMap,
      canvasIdToPageId,
      materializedSourceIds: created
    })
    rememberLazyFigImportContext(
      graph,
      changeMap,
      guidToNodeId,
      blobs,
      initiallyPopulatedRootIds,
      parentMap,
      childrenMap,
      canvasIdToPageId,
      created,
      materializeRoots
    )
  }

  setVariableColorResolver(null)

  if (graph.getPages(true).length === 0) {
    graph.addPage('Page 1')
  }

  return graph
}
