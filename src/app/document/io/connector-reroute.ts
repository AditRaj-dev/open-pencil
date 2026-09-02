import {
  connectorSlugsFromName,
  recomputeConnectors,
  screenSlugFromName
} from '@open-pencil/import-web'
import type { SceneGraph, SceneNode } from '@open-pencil/scene-graph'

/**
 * Keep flow connectors attached to their screens when a screen is moved.
 *
 * `CONNECTOR` exists in the node types but has no renderer, so a connector is
 * an ordinary thin frame. Nothing re-anchors it, which means dragging a screen
 * leaves the lines behind. This listens for screen moves and rewrites the
 * connector geometry to match.
 *
 * Identity travels in the node name, because the DOM import carries an
 * element's class through as the name and drops `data-*` attributes — so
 * `op-route_pricing` and `op-link_root__pricing` are how a node says what it is.
 */
export function wireConnectorReroute(graph: SceneGraph): () => void {
  const isScreen = (node: SceneNode | undefined): boolean =>
    !!node && screenSlugFromName(node.name ?? '') !== null

  const allNodes = (): SceneNode[] => {
    const g = graph as unknown as {
      getAllNodes?: () => Iterable<SceneNode>
      nodes?: Map<string, SceneNode> | Record<string, SceneNode>
    }
    if (typeof g.getAllNodes === 'function') return Array.from(g.getAllNodes())
    // `nodes` is a Map on the real graph; the object form is only a fallback.
    if (g.nodes instanceof Map) return Array.from(g.nodes.values())
    return Object.values(g.nodes ?? {})
  }

  /** Guards against reacting to our own writes and looping. */
  let applying = false

  const reroute = (): void => {
    if (applying) return

    const nodes = allNodes()
    const screens = []
    const connectors = []

    for (const node of nodes) {
      const screenSlug = screenSlugFromName(node.name ?? '')
      if (screenSlug) {
        screens.push({
          routePath: screenSlug,
          x: node.x,
          y: node.y,
          width: node.width,
          height: node.height
        })
        continue
      }
      const link = connectorSlugsFromName(node.name ?? '')
      if (link) connectors.push({ node, from: link.from, to: link.to })
    }

    if (screens.length === 0 || connectors.length === 0) return

    const next = recomputeConnectors(
      screens,
      connectors.map((c) => ({ from: c.from, to: c.to }))
    )

    applying = true
    try {
      for (let i = 0; i < connectors.length; i++) {
        const target = connectors[i]!
        const geometry = next[i]
        if (!geometry) continue

        if (geometry.dangling) {
          // The screen it pointed at is gone. Hide it rather than drawing a
          // line to the origin, which would look like a stray mark.
          updateNode(graph, target.node, { width: 0 })
          continue
        }

        const changed =
          Math.round(target.node.x) !== Math.round(geometry.x1) ||
          Math.round(target.node.y) !== Math.round(geometry.y1) ||
          Math.round(target.node.width) !== Math.round(geometry.length) ||
          Math.round(target.node.rotation) !== Math.round(geometry.angle)
        if (!changed) continue

        updateNode(graph, target.node, {
          x: geometry.x1,
          y: geometry.y1,
          width: Math.max(1, geometry.length),
          rotation: geometry.angle
        })
      }
    } finally {
      applying = false
    }
  }

  // `previewUpdated` fires while a frame is being dragged, `updated` when the
  // move commits. Both are handled so the line follows the frame rather than
  // snapping into place after the pointer is released.
  const unbind = graph.onNodeEvents({
    updated: (id: string) => {
      if (isScreen(graph.getNode?.(id))) reroute()
    },
    previewUpdated: (id: string) => {
      if (isScreen(graph.getNode?.(id))) reroute()
    },
    deleted: () => reroute()
  })

  // Run once so connectors are correct even if the document was moved before
  // this was attached.
  reroute()

  return unbind
}

function updateNode(graph: SceneGraph, node: SceneNode, changes: Partial<SceneNode>): void {
  const api = graph as unknown as {
    updateNode?: (id: string, changes: Partial<SceneNode>) => void
    setNodeProps?: (id: string, changes: Partial<SceneNode>) => void
  }
  if (typeof api.updateNode === 'function') {
    api.updateNode(node.id, changes)
    return
  }
  if (typeof api.setNodeProps === 'function') {
    api.setNodeProps(node.id, changes)
    return
  }
  // Last resort: mutate in place. Loses the change event, but a connector that
  // is visually correct beats one that is stale.
  Object.assign(node, changes)
}
