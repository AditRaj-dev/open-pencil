import { wireConnectorReroute } from '@/app/document/io/connector-reroute'
import { projectIO } from '@/app/document/io/project-io'
import { toast } from '@/app/shell/ui'

export interface ImportProjectResult {
  framework: string
  screens: Array<{ route: string; x: number; y: number }>
  connectors: Array<{ from: string; to: string }>
  warnings: string[]
  state: string
}

/** Detaches the previous document's reroute listener when a new one is imported. */
let detachReroute: (() => void) | null = null

/**
 * Import a code project as a flow of screens.
 *
 * The scan, transpile and layout all run here rather than on a server, so the
 * same path works in the packaged desktop app where there is no server at all —
 * only the filesystem access differs, and that is injected. The parser is
 * imported lazily because it carries the TypeScript compiler, which has no
 * business in the bundle of an editor session that never imports code.
 */
export async function importProjectFromDisk(options: {
  dir: string
  css?: string
  state?: string
  columns?: number
  importDOMText: (html: string, options?: { documentName?: string }) => Promise<unknown>
  getGraph?: () => unknown
}): Promise<ImportProjectResult | null> {
  const { dir, css, state = 'default', columns, importDOMText, getGraph } = options
  const { project } = projectIO()

  try {
    const {
      connectorClassFor,
      jsxToHTMLDocument,
      layoutFlow,
      promoteStateClasses,
      promoteStateCSS,
      scanProject,
      screenClassFor
    } = await import('@open-pencil/import-web')

    const scan = await scanProject(dir, project)
    if (scan.screens.length === 0) {
      toast.error(`No screens found in ${dir}. Expected a Next.js app/ or pages/ router.`)
      return null
    }

    const layout = layoutFlow(scan, { columns })

    const bodies = new Map<string, string>()
    for (const screen of scan.screens) {
      const html = jsxToHTMLDocument(screen.roots, {})
      bodies.set(screen.routePath, html.slice(html.indexOf('<body>') + 6, html.lastIndexOf('</body>')))
    }

    const rawCSS = css ? await project.readFile(css) : undefined
    // A canvas has no pointer, so a state is only visible once its rules apply
    // at rest.
    const styles = rawCSS ? promoteStateCSS(rawCSS, state as never) : undefined

    let composed = composeFlow(layout, bodies, styles, { screenClassFor, connectorClassFor })
    if (state !== 'default') composed = promoteStateClasses(composed, state as never)

    const name = /([^\\/]+)[\\/]*$/.exec(dir)?.[1] ?? 'project'
    await importDOMText(composed, {
      documentName: `${name}${state === 'default' ? '' : ` (${state})`}`
    })

    // Connectors are plain frames, so they need re-anchoring when a screen
    // moves. Attach after the import, since it replaces the graph.
    detachReroute?.()
    detachReroute = null
    const graph = getGraph?.()
    if (graph) {
      try {
        detachReroute = wireConnectorReroute(graph as never)
      } catch (error) {
        // Stale connectors are cosmetic; they must not fail the import.
        console.warn('[import-project] connector re-routing unavailable:', error)
      }
    }

    const warnings = [...scan.warnings, ...layout.warnings]
    for (const warning of warnings.slice(0, 3)) toast.warning(warning)
    toast.info(
      `Imported ${layout.screens.length} screen(s) and ${layout.connectors.length} connector(s)`
    )

    return {
      framework: scan.framework,
      screens: layout.screens.map((s) => ({ route: s.routePath, x: s.x, y: s.y })),
      connectors: layout.connectors.map((c) => ({ from: c.from, to: c.to })),
      warnings,
      state
    }
  } catch (error) {
    toast.error(`Import failed: ${error instanceof Error ? error.message : String(error)}`)
    return null
  }
}

/**
 * Write a source edit back to the user's file.
 *
 * Offsets are only valid for the file as it was parsed, so a stale edit is
 * refused rather than spliced at the wrong place; the caller's remedy is to
 * re-import, which re-reads the file.
 */
export async function writeSourceEdits(edits: readonly unknown[]): Promise<string[]> {
  const { write } = projectIO()
  const { writeEdits } = await import('@open-pencil/import-web')
  const results = await writeEdits(edits as never, write)
  return results.map((r) => r.filePath)
}

type Layout = {
  screens: Array<{
    routePath: string
    title: string
    x: number
    y: number
    width: number
    height: number
    dynamic: boolean
  }>
  connectors: Array<{ from: string; to: string; x1: number; y1: number; length: number; angle: number }>
  width: number
  height: number
}

/**
 * Lay the screens out as one absolutely positioned page.
 *
 * One document rather than one per screen, because the point of the import is
 * seeing the app as a map. Absolute positioning so the arrangement survives the
 * CSS pipeline, which would otherwise reflow the frames into a column.
 */
function composeFlow(
  layout: Layout,
  bodies: Map<string, string>,
  css: string | undefined,
  names: {
    screenClassFor: (route: string) => string
    connectorClassFor: (from: string, to: string) => string
  }
): string {
  const screens = layout.screens
    .map(
      (s) => `
<div class="${names.screenClassFor(s.routePath)}" data-op-route="${s.routePath}"
     style="position:absolute; left:${s.x}px; top:${s.y}px; width:${s.width}px; height:${s.height}px;">
  <div class="op-screen-label">${s.title}${s.dynamic ? ' (dynamic)' : ''} — ${s.routePath}</div>
  <div class="op-screen-body">
${bodies.get(s.routePath) ?? ''}
  </div>
</div>`
    )
    .join('\n')

  const connectors = layout.connectors
    .map(
      (c) => `
<div class="${names.connectorClassFor(c.from, c.to)}" data-op-from="${c.from}" data-op-to="${c.to}"
     style="position:absolute; left:${Math.round(c.x1)}px; top:${Math.round(c.y1)}px;
            width:${Math.round(c.length)}px; height:2px;
            transform: rotate(${c.angle.toFixed(2)}deg); transform-origin: 0 50%;"></div>`
    )
    .join('\n')

  return `<!doctype html>
<html><head><meta charset="utf-8" /><title>Project flow</title>
<style>
  body { margin:0; background:#f1f5f9; position:relative;
         width:${Math.round(layout.width)}px; height:${Math.round(layout.height)}px; }
  .op-screen { background:#fff; border-radius:12px; overflow:hidden;
               box-shadow:0 1px 3px #0f172a2e; }
  .op-screen-label { font:600 20px system-ui,sans-serif; color:#0f172a;
                     padding:12px 16px; background:#e2e8f0; }
  .op-connector { background:#2563eb; border-radius:1px; }
${css ?? ''}
</style></head>
<body>
${connectors}
${screens}
</body></html>`
}
