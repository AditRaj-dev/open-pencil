import { readdir, readFile, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'

import { connectorClassFor, screenClassFor, type FlowLayout } from '@open-pencil/import-web'
import type { Connect, Plugin } from 'vite'

/**
 * Dev-server endpoints for importing a code project and writing edits back.
 *
 * The browser cannot read a project directory or write to disk, so the parts
 * that touch the filesystem live here and the editor talks to them over HTTP.
 * Dev only: this exposes read and write access to the machine, which has no
 * business in a built artefact.
 */
export function importWebPlugin(): Plugin {
  return {
    name: 'open-pencil:import-web',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__op/import-project', json(importProject))
      server.middlewares.use('/__op/write', json(writeEditsHandler))
      server.middlewares.use('/__op/read', json(readSource))
      // Granular file access, so the browser can run the same scan the desktop
      // app runs in-process rather than needing a parallel server-side path.
      server.middlewares.use('/__op/read-dir', json(readDirHandler))
      server.middlewares.use('/__op/read-file', json(readFileHandler))
      server.middlewares.use('/__op/write-file', json(writeFileHandler))
    }
  }
}

/** Fields any of these endpoints may receive. All optional; each handler validates. */
interface RequestBody {
  dir?: string
  css?: string
  state?: string
  columns?: string | number
  path?: string
  contents?: string
  filePath?: string
  edits?: unknown
}

type Handler = (body: RequestBody) => Promise<unknown>

function json(handler: Handler): Connect.NextHandleFunction {
  return (req, res, next) => {
    if (req.method !== 'POST') return next()
    let raw = ''
    req.on('data', (chunk) => {
      raw += chunk
      // A request body this large is not a legitimate edit; refuse rather than
      // buffering without bound.
      if (raw.length > 8_000_000) req.destroy()
    })
    req.on('end', () => {
      void (async () => {
        res.setHeader('content-type', 'application/json')
        try {
          const body: RequestBody = raw ? JSON.parse(raw) : {}
          res.end(JSON.stringify({ ok: true, result: await handler(body) }))
        } catch (error) {
          res.statusCode = 400
          res.end(
            JSON.stringify({ ok: false, error: error instanceof Error ? error.message : String(error) })
          )
        }
      })()
    })
  }
}

async function importProject(body: RequestBody) {
  const {
    jsxToHTMLDocument,
    layoutFlow,
    promoteStateClasses,
    promoteStateCSS,
    scanProject
  } = await import('@open-pencil/import-web')

  const dir = String(body.dir ?? '')
  if (!dir) throw new Error('dir is required')
  const state = String(body.state ?? 'default')

  const io = {
    async readDir(path: string) {
      const entries = await readdir(path, { withFileTypes: true })
      return entries.map((e) => ({ name: e.name, isDirectory: e.isDirectory() }))
    },
    readFile: (path: string) => readFile(path, 'utf8'),
    join: (...parts: string[]) => join(...parts)
  }

  const root = resolve(dir)
  const scan = await scanProject(root, io)
  if (scan.screens.length === 0) throw new Error(`no screens found in ${root}`)

  const layout = layoutFlow(scan, {
    columns: body.columns ? Number(body.columns) : undefined
  })

  const bodies = new Map<string, string>()
  for (const screen of scan.screens) {
    const html = jsxToHTMLDocument(screen.roots, {})
    bodies.set(
      screen.routePath,
      html.slice(html.indexOf('<body>') + 6, html.lastIndexOf('</body>'))
    )
  }

  const rawCSS = body.css ? await readFile(resolve(String(body.css)), 'utf8') : undefined
  const css = rawCSS ? promoteStateCSS(rawCSS, state as never) : undefined
  let composed = composeFlow(layout, bodies, css)
  if (state !== 'default') composed = promoteStateClasses(composed, state as never)

  return {
    html: composed,
    framework: scan.framework,
    screens: layout.screens.map((s) => ({ route: s.routePath, x: s.x, y: s.y })),
    connectors: layout.connectors.map((c) => ({ from: c.from, to: c.to })),
    warnings: [...scan.warnings, ...layout.warnings],
    state
  }
}

async function writeEditsHandler(body: RequestBody) {
  const { writeEdits } = await import('@open-pencil/import-web')
  const edits = body.edits as Parameters<typeof writeEdits>[0]
  if (!Array.isArray(edits) || edits.length === 0) throw new Error('edits are required')

  const io = {
    read: (path: string) => readFile(path, 'utf8'),
    write: async (path: string, contents: string) => {
      await writeFile(path, contents, 'utf8')
    }
  }
  const results = await writeEdits(edits, io)
  return { written: results.map((r) => r.filePath), changed: results.length > 0 }
}

async function readDirHandler(body: RequestBody) {
  const entries = await readdir(resolve(String(body.path ?? '')), { withFileTypes: true })
  return entries.map((e) => ({ name: e.name, isDirectory: e.isDirectory() }))
}

async function readFileHandler(body: RequestBody) {
  return { text: await readFile(resolve(String(body.path ?? '')), 'utf8') }
}

async function writeFileHandler(body: RequestBody) {
  await writeFile(resolve(String(body.path ?? '')), String(body.contents ?? ''), 'utf8')
  return { written: true }
}

async function readSource(body: RequestBody) {
  const { parseWebSource } = await import('@open-pencil/import-web')
  const filePath = String(body.filePath ?? '')
  if (!filePath) throw new Error('filePath is required')
  const content = await readFile(resolve(filePath), 'utf8')
  const parsed = parseWebSource(content, filePath)
  return { filePath, roots: parsed.roots, warnings: parsed.warnings }
}

/** Same composition the CLI performs; duplicated here to keep the CLI standalone. */
function composeFlow(
  layout: { screens: Array<Record<string, never>>; connectors: unknown[]; width: number; height: number },
  bodies: Map<string, string>,
  css: string | undefined
): string {
  const l = layout

  const screens = l.screens
    .map(
      (s) => `
<div class="${screenClassFor(s.routePath)}" data-op-route="${s.routePath}"
     style="position:absolute; left:${s.x}px; top:${s.y}px; width:${s.width}px; height:${s.height}px;">
  <div class="op-screen-label">${s.title}${s.dynamic ? ' (dynamic)' : ''} — ${s.routePath}</div>
  <div class="op-screen-body">
${bodies.get(s.routePath) ?? ''}
  </div>
</div>`
    )
    .join('\n')

  const connectors = l.connectors
    .map(
      (c) => `
<div class="${connectorClassFor(c.from, c.to)}" data-op-from="${c.from}" data-op-to="${c.to}"
     style="position:absolute; left:${Math.round(c.x1)}px; top:${Math.round(c.y1)}px;
            width:${Math.round(c.length)}px; height:2px;
            transform: rotate(${c.angle.toFixed(2)}deg); transform-origin: 0 50%;"></div>`
    )
    .join('\n')

  return `<!doctype html>
<html><head><meta charset="utf-8" /><title>Project flow</title>
<style>
  body { margin:0; background:#f1f5f9; position:relative;
         width:${Math.round(l.width)}px; height:${Math.round(l.height)}px; }
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
