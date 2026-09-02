import { readdir, readFile, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'

import { defineCommand } from 'citty'

import { BUILTIN_IO_FORMATS, IORegistry } from '@open-pencil/core/io'
import {
  createHeadlessCSSRuntime,
  htmlToDesignDocument,
  htmlToSceneGraph
} from '@open-pencil/dom-css'
import {
  jsxToHtmlDocument,
  layoutFlow,
  promoteStateClasses,
  promoteStateCss,
  scanProject,
  UI_STATES,
  type ProjectIO,
  type UIState
} from '@open-pencil/import-web'

import { fmtList, ok, printError } from '#cli/format'

const ioRegistry = new IORegistry(BUILTIN_IO_FORMATS)

const io: ProjectIO = {
  async readDir(path) {
    const entries = await readdir(path, { withFileTypes: true })
    return entries.map((e) => ({ name: e.name, isDirectory: e.isDirectory() }))
  },
  readFile: (path) => readFile(path, 'utf8'),
  join: (...parts) => join(...parts)
}

/**
 * Render every screen into one HTML document, positioned as the flow laid them
 * out, with connectors drawn between them.
 *
 * A single document rather than one per screen: the point of the import is
 * seeing the app as a map, and that only works if the screens share a canvas.
 * Absolute positioning is used so the arrangement survives the CSS pipeline —
 * a flow layout would otherwise re-flow the frames into a column.
 */
function composeFlowHTML(
  layout: ReturnType<typeof layoutFlow>,
  bodies: Map<string, string>,
  css: string | undefined
): string {
  const screens = layout.screens
    .map((s) => {
      const body = bodies.get(s.routePath) ?? ''
      const label = `${s.title}${s.dynamic ? ' (dynamic)' : ''} — ${s.routePath}`
      return `
<div class="op-screen" data-op-route="${s.routePath}"
     style="position:absolute; left:${s.x}px; top:${s.y}px; width:${s.width}px; height:${s.height}px;">
  <div class="op-screen-label">${label}</div>
  <div class="op-screen-body">
${body}
  </div>
</div>`
    })
    .join('\n')

  const connectors = layout.connectors
    .map(
      (c) => `
<div class="op-connector" data-op-from="${c.from}" data-op-to="${c.to}"
     style="position:absolute; left:${Math.round(c.x1)}px; top:${Math.round(c.y1)}px;
            width:${Math.round(c.length)}px; height:2px;
            transform: rotate(${c.angle.toFixed(2)}deg); transform-origin: 0 50%;"></div>`
    )
    .join('\n')

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Project flow</title>
<style>
  body { margin: 0; background: #f1f5f9; position: relative;
         width: ${Math.round(layout.width)}px; height: ${Math.round(layout.height)}px; }
  .op-screen { background: #ffffff; border-radius: 12px; overflow: hidden;
               box-shadow: 0 1px 3px rgba(15,23,42,0.18); }
  .op-screen-label { font: 600 20px system-ui, sans-serif; color: #0f172a;
                     padding: 12px 16px; background: #e2e8f0; }
  .op-screen-body { padding: 0; }
  .op-connector { background: #2563eb; border-radius: 1px; }
${css ?? ''}
</style>
</head>
<body>
${connectors}
${screens}
</body>
</html>`
}

export default defineCommand({
  meta: {
    name: 'import-project',
    description: 'Import a React project folder as screens laid out with navigation connectors'
  },
  args: {
    dir: { type: 'positional', description: 'Project root', required: true },
    output: { type: 'string', alias: 'o', description: 'Output file' },
    format: { type: 'string', alias: 'f', default: 'fig', description: 'fig, json or html' },
    css: { type: 'string', description: 'Stylesheet to apply to every screen' },
    state: {
      type: 'string',
      default: 'default',
      description: `Interaction state to render: ${UI_STATES.join(', ')}`
    },
    columns: { type: 'string', description: 'Screens per row' },
    screenWidth: { type: 'string', default: '1440' },
    screenHeight: { type: 'string', default: '900' },
    json: { type: 'boolean', description: 'Print a machine-readable summary' }
  },
  async run({ args }) {
    try {
      const root = resolve(args.dir as string)
      const scan = await scanProject(root, io)

      if (scan.screens.length === 0) {
        printError(
          `no screens found in ${root}. Looked for a Next.js app/ or pages/ router, ` +
            `then for files named like screens.`
        )
        return
      }

      const layout = layoutFlow(scan, {
        columns: args.columns ? Number(args.columns) : undefined,
        screenWidth: Number(args.screenWidth),
        screenHeight: Number(args.screenHeight)
      })

      // Each screen's markup, transpiled but not yet styled.
      const bodies = new Map<string, string>()
      for (const screen of scan.screens) {
        const html = jsxToHtmlDocument(screen.roots, {})
        const body = html.slice(html.indexOf('<body>') + 6, html.lastIndexOf('</body>'))
        bodies.set(screen.routePath, body)
      }

      const state = String(args.state) as UIState
      if (!UI_STATES.includes(state)) {
        printError(`unknown state "${state}"; expected one of ${UI_STATES.join(', ')}`)
        return
      }

      const rawCss = args.css ? await readFile(resolve(args.css as string), 'utf8') : undefined
      // A canvas has no pointer, so a state is only visible if its rules are
      // made to apply at rest.
      const cssText = rawCss ? promoteStateCss(rawCss, state) : undefined
      let composed = composeFlowHTML(layout, bodies, cssText)
      if (state !== 'default') composed = promoteStateClasses(composed, state)

      // The same DOM/CSS pipeline the HTML import uses, so the screens get real
      // computed geometry rather than the nominal frame sizes.
      const runtime = createHeadlessCSSRuntime()
      const format = String(args.format).toLowerCase()
      const projectName = root.split(/[\\/]/).filter(Boolean).pop() ?? 'project'
      const outPath = resolve((args.output as string) ?? `${projectName}-flow.${format}`)

      if (format === 'html') {
        // The composed page itself, for feeding straight into the editor's
        // DOM import at run time rather than through a file.
        await writeFile(outPath, composed, 'utf8')
      } else if (format === 'json') {
        const document = await htmlToDesignDocument(composed, { runtime, pageName: 'Flow' })
        await writeFile(outPath, `${JSON.stringify(document, null, 2)}\n`)
      } else {
        // .fig is what the editor opens natively.
        const graph = await htmlToSceneGraph(composed, { runtime, pageName: 'Flow' })
        const result = await ioRegistry.writeDocument('fig', graph)
        await writeFile(outPath, result.data as Uint8Array)
      }

      const warnings = [...scan.warnings, ...layout.warnings]
      if (args.json) {
        process.stdout.write(
          JSON.stringify(
            {
              framework: scan.framework,
              screens: layout.screens.map((s) => ({ route: s.routePath, x: s.x, y: s.y })),
              connectors: layout.connectors.map((c) => ({ from: c.from, to: c.to })),
              warnings
            },
            null,
            2
          ) + '\n'
        )
        return
      }

      ok(`Imported ${scan.screens.length} screen(s) from ${root} → ${outPath}`)
      fmtList([
        `framework: ${scan.framework}`,
        `state: ${state}`,
        `screens: ${layout.screens.map((s) => s.routePath).join(', ')}`,
        `connectors: ${
          layout.connectors.length === 0
            ? 'none'
            : layout.connectors.map((c) => `${c.from} → ${c.to}`).join(', ')
        }`,
        ...warnings.map((w) => `warning: ${w}`)
      ])
    } catch (error) {
      printError(error instanceof Error ? error.message : String(error))
    }
  }
})
