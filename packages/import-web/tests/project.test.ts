import { describe, expect, test } from 'bun:test'

import { layoutFlow } from '../src/flow'
import { scanProject, type ProjectIO } from '../src/project'

/** In-memory project tree, so these never touch disk. */
function memoryProject(files: Record<string, string>): ProjectIO {
  const norm = (p: string) => p.replace(/\\/g, '/').replace(/\/+$/, '')
  return {
    join: (...parts) => norm(parts.join('/')),
    async readFile(path) {
      const v = files[norm(path)]
      if (v === undefined) throw new Error(`no such file: ${path}`)
      return v
    },
    async readDir(path) {
      const dir = norm(path)
      const names = new Map<string, boolean>()
      for (const key of Object.keys(files)) {
        if (!key.startsWith(dir + '/')) continue
        const rest = key.slice(dir.length + 1)
        const slash = rest.indexOf('/')
        if (slash === -1) names.set(rest, false)
        else names.set(rest.slice(0, slash), true)
      }
      if (names.size === 0) throw new Error(`no such dir: ${path}`)
      return [...names].map(([name, isDirectory]) => ({ name, isDirectory }))
    }
  }
}

const page = (body: string) => `export default function P() { return (${body}) }`

describe('scanProject', () => {
  test('reads Next.js app-router routes and strips route groups', async () => {
    const io = memoryProject({
      'proj/app/page.tsx': page('<main><a href="/pricing">P</a></main>'),
      'proj/app/(marketing)/pricing/page.tsx': page('<main>Pricing</main>'),
      'proj/app/blog/[slug]/page.tsx': page('<article>Post</article>'),
      'proj/app/layout.tsx': page('<html />')
    })
    const scan = await scanProject('proj', io)

    expect(scan.framework).toBe('next-app')
    // (marketing) groups files without appearing in the URL
    expect(scan.screens.map((s) => s.routePath)).toEqual(['/', '/pricing', '/blog/[slug]'])
    // layout.tsx is not a route
    expect(scan.screens.some((s) => s.filePath.endsWith('layout.tsx'))).toBe(false)
    expect(scan.screens.find((s) => s.routePath === '/blog/[slug]')!.dynamic).toBe(true)
  })

  test('reads the pages router, skipping api and underscore files', async () => {
    const io = memoryProject({
      'proj/pages/index.tsx': page('<main>Home</main>'),
      'proj/pages/about.tsx': page('<main>About</main>'),
      'proj/pages/_app.tsx': page('<div />'),
      'proj/pages/api/hello.ts': 'export default () => {}'
    })
    const scan = await scanProject('proj', io)
    expect(scan.framework).toBe('next-pages')
    expect(scan.screens.map((s) => s.routePath).sort()).toEqual(['/', '/about'])
  })

  test('collects links from JSX href and from router calls', async () => {
    const io = memoryProject({
      'proj/app/page.tsx': `
import Link from 'next/link'
export default function P() {
  return (<main>
    <Link href="/pricing">P</Link>
    <a href="/about">A</a>
    <a href="https://example.com">external</a>
  </main>)
}`,
      'proj/app/dash/page.tsx': `
export default function D() {
  const router = useRouter()
  return <button onClick={() => router.push('/settings')}>go</button>
}`,
      'proj/app/pricing/page.tsx': page('<main>P</main>'),
      'proj/app/about/page.tsx': page('<main>A</main>'),
      'proj/app/settings/page.tsx': page('<main>S</main>')
    })
    const scan = await scanProject('proj', io)

    const home = scan.screens.find((s) => s.routePath === '/')!
    expect(home.links.sort()).toEqual(['/about', '/pricing'])
    // an external URL is not a screen link
    expect(home.links.some((l) => l.startsWith('http'))).toBe(false)

    const dash = scan.screens.find((s) => s.routePath === '/dash')!
    expect(dash.links).toEqual(['/settings'])
  })

  test('a file that does not parse is reported, not silently skipped', async () => {
    const io = memoryProject({
      'proj/app/page.tsx': page('<main>ok</main>'),
      'proj/app/broken/page.tsx': 'export default function B() { return (<div> }'
    })
    const scan = await scanProject('proj', io)
    expect(scan.screens.map((s) => s.routePath)).toEqual(['/'])
    expect(scan.warnings.some((w) => w.includes('broken'))).toBe(true)
  })

  test('sorts shallow routes first so the canvas reads like a site map', async () => {
    const io = memoryProject({
      'proj/app/a/b/c/page.tsx': page('<main>deep</main>'),
      'proj/app/page.tsx': page('<main>root</main>'),
      'proj/app/z/page.tsx': page('<main>z</main>')
    })
    const scan = await scanProject('proj', io)
    expect(scan.screens.map((s) => s.routePath)).toEqual(['/', '/z', '/a/b/c'])
  })
})

describe('layoutFlow', () => {
  const scanOf = async (files: Record<string, string>) => scanProject('proj', memoryProject(files))

  test('places screens on a grid and connects them by navigation', async () => {
    const scan = await scanOf({
      'proj/app/page.tsx': page('<main><a href="/next">n</a></main>'),
      'proj/app/next/page.tsx': page('<main>next</main>')
    })
    const layout = layoutFlow(scan, { columns: 2, screenWidth: 100, screenHeight: 100, gapX: 50, gapY: 50 })

    expect(layout.screens.map((s) => [s.x, s.y])).toEqual([
      [0, 0],
      [150, 0]
    ])
    expect(layout.connectors.length).toBe(1)
    const c = layout.connectors[0]!
    expect([c.from, c.to]).toEqual(['/', '/next'])
    // leaves the right edge of the source and lands on the left edge of the target
    expect(c.x1).toBe(100)
    expect(c.x2).toBe(150)
    expect(c.angle).toBe(0)
  })

  test('a link to a concrete path resolves to its dynamic route', async () => {
    const scan = await scanOf({
      'proj/app/page.tsx': page('<main><a href="/blog/hello-world">post</a></main>'),
      'proj/app/blog/[slug]/page.tsx': page('<article>post</article>')
    })
    const layout = layoutFlow(scan)
    expect(layout.connectors.map((c) => c.to)).toEqual(['/blog/[slug]'])
    expect(layout.warnings).toEqual([])
  })

  test('a link to a route that does not exist is reported rather than drawn', async () => {
    const scan = await scanOf({
      'proj/app/page.tsx': page('<main><a href="/nowhere">x</a></main>')
    })
    const layout = layoutFlow(scan)
    expect(layout.connectors).toEqual([])
    expect(layout.warnings[0]).toContain('/nowhere')
  })

  test('duplicate links between the same pair draw one connector', async () => {
    const scan = await scanOf({
      'proj/app/page.tsx': page('<main><a href="/x">1</a><a href="/x">2</a></main>'),
      'proj/app/x/page.tsx': page('<main>x</main>')
    })
    expect(layoutFlow(scan).connectors.length).toBe(1)
  })

  test('a self-link does not produce a connector', async () => {
    const scan = await scanOf({
      'proj/app/page.tsx': page('<main><a href="/">home</a></main>')
    })
    expect(layoutFlow(scan).connectors).toEqual([])
  })
})
