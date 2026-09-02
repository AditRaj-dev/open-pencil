import ts from 'typescript'

import { parseJSX } from './jsx'
import type { WebElement } from './types'

/** Directory access, injected so this stays platform-neutral. */
export interface ProjectIO {
  readDir(path: string): Promise<Array<{ name: string; isDirectory: boolean }>>
  readFile(path: string): Promise<string>
  join(...parts: string[]): string
}

export type Framework = 'next-app' | 'next-pages' | 'react-router' | 'unknown'

export interface RouteScreen {
  /** URL path, e.g. '/', '/pricing', '/blog/[slug]'. */
  routePath: string
  filePath: string
  /** Display name for the frame on canvas. */
  title: string
  /** Route paths this screen navigates to. */
  links: string[]
  /** True when the route contains a parameter segment. */
  dynamic: boolean
  roots: WebElement[]
}

export interface ProjectScan {
  framework: Framework
  root: string
  screens: RouteScreen[]
  warnings: string[]
}

const PAGE_FILE = /^page\.(tsx|jsx|ts|js)$/
const SOURCE_FILE = /\.(tsx|jsx)$/
const IGNORED_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', '.next', 'out', 'coverage', '.turbo'
])

/**
 * Strip Next.js route groups and turn a directory path into a URL path.
 *
 * `(marketing)/pricing` is `/pricing` — parentheses group files for layout
 * purposes without appearing in the URL, so treating them as path segments
 * would invent routes that do not exist.
 */
function segmentsToRoute(segments: readonly string[]): string {
  const kept = segments.filter((s) => s.length > 0 && !(s.startsWith('(') && s.endsWith(')')))
  return kept.length === 0 ? '/' : `/${kept.join('/')}`
}

function titleFor(routePath: string): string {
  if (routePath === '/') return 'Home'
  const last = /([^/]+)\/*$/.exec(routePath)?.[1] ?? routePath
  const cleaned = last.replace(/^\[+|\]+$/g, '').replace(/[-_]/g, ' ')
  return cleaned.replace(/^\w/, (c) => c.toUpperCase())
}

/**
 * Collect navigation targets.
 *
 * Two sources, both exact rather than guessed: `href` on parsed JSX elements
 * (covering `<Link>` and `<a>`), and string literals passed to the navigation
 * calls a router exposes. Anything computed is skipped — a link built at run
 * time has no single destination to draw.
 */
/** The plain name of whatever is being called, or '' when it is an expression. */
function calleeName(expression: ts.Expression): string {
  if (ts.isPropertyAccessExpression(expression)) return expression.name.text
  if (ts.isIdentifier(expression)) return expression.text
  return ''
}

function collectLinks(source: string, filePath: string, roots: readonly WebElement[]): string[] {
  const found = new Set<string>()

  const fromJSX = (els: readonly WebElement[]): void => {
    for (const el of els) {
      const href = el.attributes['href'] ?? el.attributes['to']
      if (typeof href === 'string' && href.startsWith('/')) found.add(href)
      fromJSX(el.children)
    }
  }
  fromJSX(roots)

  // router.push('/x'), navigate('/x'), redirect('/x')
  const sourceFile = ts.createSourceFile(
    filePath,
    source,
    ts.ScriptTarget.Latest,
    true,
    filePath.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.JSX
  )
  const NAV = new Set(['push', 'replace', 'navigate', 'redirect'])
  const visit = (node: ts.Node): void => {
    if (ts.isCallExpression(node)) {
      const name = calleeName(node.expression)
      if (NAV.has(name)) {
        const arg = node.arguments.at(0)
        if (arg && (ts.isStringLiteral(arg) || ts.isNoSubstitutionTemplateLiteral(arg))) {
          if (arg.text.startsWith('/')) found.add(arg.text)
        }
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(sourceFile)

  return [...found]
}

async function walk(
  io: ProjectIO,
  dir: string,
  onFile: (path: string, segments: string[]) => void,
  segments: string[] = [],
  depth = 0
): Promise<void> {
  if (depth > 12) return
  let entries
  try {
    entries = await io.readDir(dir)
  } catch {
    return
  }
  for (const entry of entries) {
    if (entry.name.startsWith('.') || IGNORED_DIRS.has(entry.name)) continue
    const full = io.join(dir, entry.name)
    if (entry.isDirectory) {
      await walk(io, full, onFile, [...segments, entry.name], depth + 1)
    } else {
      onFile(full, segments)
    }
  }
}

/**
 * Find the screens of a project and how they link to one another.
 *
 * Supports the two Next.js router conventions, since those encode routes in the
 * file tree and can therefore be read without executing anything. A project
 * using a runtime router (React Router's `<Route>` elements) falls back to
 * treating page-like files as screens, because its route table only exists once
 * the app runs.
 */
export async function scanProject(root: string, io: ProjectIO): Promise<ProjectScan> {
  const warnings: string[] = []
  const candidates: Array<{ filePath: string; routePath: string }> = []

  const appDir = io.join(root, 'app')
  const srcAppDir = io.join(root, 'src', 'app')
  const pagesDir = io.join(root, 'pages')
  const srcPagesDir = io.join(root, 'src', 'pages')

  let framework: Framework = 'unknown'

  const tryAppRouter = async (dir: string): Promise<boolean> => {
    let found = false
    await walk(io, dir, (filePath, segments) => {
      const name = filePath.split(/[\\/]/).pop() ?? ''
      if (!PAGE_FILE.test(name)) return
      candidates.push({ filePath, routePath: segmentsToRoute(segments) })
      found = true
    })
    return found
  }

  const tryPagesRouter = async (dir: string): Promise<boolean> => {
    let found = false
    await walk(io, dir, (filePath, segments) => {
      const name = filePath.split(/[\\/]/).pop() ?? ''
      if (!SOURCE_FILE.test(name)) return
      if (name.startsWith('_')) return // _app, _document
      if (segments[0] === 'api') return
      const base = name.replace(SOURCE_FILE, '')
      const parts = base === 'index' ? segments : [...segments, base]
      candidates.push({ filePath, routePath: segmentsToRoute(parts) })
      found = true
    })
    return found
  }

  if (await tryAppRouter(appDir)) framework = 'next-app'
  else if (await tryAppRouter(srcAppDir)) framework = 'next-app'
  else if (await tryPagesRouter(pagesDir)) framework = 'next-pages'
  else if (await tryPagesRouter(srcPagesDir)) framework = 'next-pages'

  if (framework === 'unknown') {
    // No file-based router. Treat components that look like screens as screens,
    // so the canvas still shows something useful.
    await walk(io, root, (filePath, segments) => {
      const name = filePath.split(/[\\/]/).pop() ?? ''
      if (!SOURCE_FILE.test(name)) return
      if (!/(page|screen|view)/i.test(name) && !segments.some((s) => /pages?|screens?|views?/i.test(s))) return
      candidates.push({ filePath, routePath: segmentsToRoute([...segments, name.replace(SOURCE_FILE, '')]) })
    })
    if (candidates.length > 0) {
      framework = 'react-router'
      warnings.push(
        'no file-based router found; screens were inferred from file names, and ' +
          'navigation between them can only be read from literal links'
      )
    }
  }

  const screens: RouteScreen[] = []
  for (const { filePath, routePath } of candidates) {
    let source: string
    try {
      source = await io.readFile(filePath)
    } catch (error) {
      warnings.push(`could not read ${filePath}: ${String(error)}`)
      continue
    }
    const parsed = parseJSX(source, filePath)
    const fatal = parsed.warnings.filter((w) => w.startsWith('parse error'))
    if (fatal.length > 0) {
      warnings.push(`${filePath}: ${fatal[0]}`)
      continue
    }
    if (parsed.roots.length === 0) {
      warnings.push(`${filePath} has no JSX; skipped`)
      continue
    }

    screens.push({
      routePath,
      filePath,
      title: titleFor(routePath),
      links: collectLinks(source, filePath, parsed.roots),
      dynamic: routePath.includes('['),
      roots: parsed.roots
    })
  }

  // Shallow routes first, then alphabetical, so the canvas reads like a site map
  // rather than like directory order.
  screens.sort((a, b) => {
    const da = a.routePath.split('/').length
    const db = b.routePath.split('/').length
    return da - db || a.routePath.localeCompare(b.routePath)
  })

  return { framework, root, screens, warnings }
}
