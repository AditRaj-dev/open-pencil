import type { ProjectScan, RouteScreen } from './project'

export interface ScreenBox {
  routePath: string
  title: string
  filePath: string
  x: number
  y: number
  width: number
  height: number
  dynamic: boolean
}

export interface Connector {
  from: string
  to: string
  /** Start and end points, in the same space as the boxes. */
  x1: number
  y1: number
  x2: number
  y2: number
  /** Length and angle, for renderers that place a LINE by rotation. */
  length: number
  angle: number
  /** True when the target route was not found among the screens. */
  dangling: boolean
}

export interface FlowLayout {
  screens: ScreenBox[]
  connectors: Connector[]
  width: number
  height: number
  warnings: string[]
}

export interface FlowOptions {
  screenWidth?: number
  screenHeight?: number
  gapX?: number
  gapY?: number
  /** Screens per row. Defaults to a roughly square arrangement. */
  columns?: number
}

/**
 * Match a link against the known routes.
 *
 * A dynamic route never matches literally: `/blog/[slug]` is written in the
 * file tree, while a link says `/blog/hello`. Comparing segment by segment and
 * letting a parameter segment absorb anything is what connects the two.
 */
function resolveRoute(link: string, screens: readonly RouteScreen[]): RouteScreen | undefined {
  const clean = link.split(/[?#]/)[0] ?? link
  const exact = screens.find((s) => s.routePath === clean)
  if (exact) return exact

  const parts = clean.split('/').filter(Boolean)
  return screens.find((s) => {
    const rp = s.routePath.split('/').filter(Boolean)
    if (rp.length !== parts.length) return false
    return rp.every((seg, i) => (seg.startsWith('[') && seg.endsWith(']')) || seg === parts[i])
  })
}

/**
 * Place screens on a canvas and connect them by navigation.
 *
 * Ordering comes from the route table — shallow routes first, then
 * alphabetical — so the arrangement reads like a site map. A grid is used
 * rather than a force-directed graph because the position of a screen should be
 * stable across imports: re-importing a project after an edit must not shuffle
 * everything the user has become familiar with.
 *
 * Connectors run edge to edge rather than centre to centre, so the line touches
 * the frames instead of disappearing underneath them.
 */
export function layoutFlow(scan: ProjectScan, options: FlowOptions = {}): FlowLayout {
  const screenWidth = options.screenWidth ?? 1440
  const screenHeight = options.screenHeight ?? 900
  const gapX = options.gapX ?? 320
  const gapY = options.gapY ?? 260
  const warnings: string[] = []

  const count = scan.screens.length
  const columns = options.columns ?? Math.max(1, Math.ceil(Math.sqrt(count)))

  const boxes = new Map<string, ScreenBox>()
  const screens: ScreenBox[] = scan.screens.map((screen, i) => {
    const col = i % columns
    const row = Math.floor(i / columns)
    const box: ScreenBox = {
      routePath: screen.routePath,
      title: screen.title,
      filePath: screen.filePath,
      x: col * (screenWidth + gapX),
      y: row * (screenHeight + gapY),
      width: screenWidth,
      height: screenHeight,
      dynamic: screen.dynamic
    }
    boxes.set(screen.routePath, box)
    return box
  })

  const connectors: Connector[] = []
  const seen = new Set<string>()

  for (const screen of scan.screens) {
    const from = boxes.get(screen.routePath)
    if (!from) continue

    for (const link of screen.links) {
      const target = resolveRoute(link, scan.screens)
      if (!target) {
        warnings.push(`${screen.routePath} links to ${link}, which is not a screen in this project`)
        continue
      }
      if (target.routePath === screen.routePath) continue // self-link

      const key = `${screen.routePath}->${target.routePath}`
      if (seen.has(key)) continue
      seen.add(key)

      const to = boxes.get(target.routePath)
      if (!to) continue

      // Leave from the side facing the target, so the line does not cross the
      // frame it starts from.
      const goingRight = to.x >= from.x
      const x1 = goingRight ? from.x + from.width : from.x
      const y1 = from.y + from.height / 2
      const x2 = goingRight ? to.x : to.x + to.width
      const y2 = to.y + to.height / 2

      const dx = x2 - x1
      const dy = y2 - y1
      connectors.push({
        from: screen.routePath,
        to: target.routePath,
        x1,
        y1,
        x2,
        y2,
        length: Math.hypot(dx, dy),
        angle: (Math.atan2(dy, dx) * 180) / Math.PI,
        dangling: false
      })
    }
  }

  const rows = Math.ceil(count / columns)
  return {
    screens,
    connectors,
    width: columns * screenWidth + (columns - 1) * gapX,
    height: rows * screenHeight + (rows - 1) * gapY,
    warnings: [...warnings]
  }
}

/**
 * Recompute connector geometry for the current screen positions.
 *
 * Connectors are plain positioned lines, because `CONNECTOR` exists in the node
 * types but has no renderer — so they do not re-route themselves when a frame
 * moves. Calling this after a move and writing the results back restores the
 * link; it is separated out as a pure function so the caller can hook whatever
 * move event its editor exposes without this module knowing about any of it.
 */
export function recomputeConnectors(
  screens: readonly Pick<ScreenBox, 'routePath' | 'x' | 'y' | 'width' | 'height'>[],
  connectors: readonly Pick<Connector, 'from' | 'to'>[]
): Connector[] {
  const byRoute = new Map(screens.map((s) => [s.routePath, s]))
  const out: Connector[] = []

  for (const link of connectors) {
    const from = byRoute.get(link.from)
    const to = byRoute.get(link.to)
    if (!from || !to) {
      // The screen was removed; report it rather than drawing to nowhere.
      out.push({
        from: link.from,
        to: link.to,
        x1: 0, y1: 0, x2: 0, y2: 0,
        length: 0, angle: 0,
        dangling: true
      })
      continue
    }

    const goingRight = to.x >= from.x
    const x1 = goingRight ? from.x + from.width : from.x
    const y1 = from.y + from.height / 2
    const x2 = goingRight ? to.x : to.x + to.width
    const y2 = to.y + to.height / 2
    const dx = x2 - x1
    const dy = y2 - y1

    out.push({
      from: link.from,
      to: link.to,
      x1, y1, x2, y2,
      length: Math.hypot(dx, dy),
      angle: (Math.atan2(dy, dx) * 180) / Math.PI,
      dangling: false
    })
  }
  return out
}

/**
 * Encode a route into something usable as a CSS class.
 *
 * Identity has to survive into the scene graph, and the DOM import carries an
 * element's class through as the node name while dropping `data-*` attributes.
 * So the class is the only channel available for saying which screen a frame is
 * and which screens a connector joins.
 */
export function routeSlug(routePath: string): string {
  if (routePath === '/') return 'root'
  return routePath.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'root'
}

export function screenClassFor(routePath: string): string {
  return `op-screen op-route_${routeSlug(routePath)}`
}

export function connectorClassFor(from: string, to: string): string {
  return `op-connector op-link_${routeSlug(from)}__${routeSlug(to)}`
}

/** Read a screen's route slug back out of a node name. */
export function screenSlugFromName(name: string): string | null {
  const match = /op-route_([A-Za-z0-9-]+)/.exec(name)
  return match?.[1] ?? null
}

/** Read a connector's endpoints back out of a node name. */
export function connectorSlugsFromName(name: string): { from: string; to: string } | null {
  const match = /op-link_([A-Za-z0-9-]+)__([A-Za-z0-9-]+)/.exec(name)
  if (!match) return null
  const [, from, to] = match
  return from && to ? { from, to } : null
}
