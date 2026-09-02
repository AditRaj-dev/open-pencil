import { describe, expect, test } from 'bun:test'

import { applyEdits, editClassName, editText, WriteBackError } from '../src/edit'
import { joinGeometry, type MeasuredElement } from '../src/geometry'
import { parseHtml } from '../src/html'
import { jsxToHtml } from '../src/to-html'
import { parseJsx } from '../src/jsx'
import { parseWebSource } from '../src/parse'
import { toSceneNodes } from '../src/to-scene'
import { writeEdits, type FileIO } from '../src/write'

/** In-memory disk, so writes are observable and nothing touches the project. */
function memoryIO(files: Record<string, string>): FileIO & { files: Record<string, string> } {
  const store = { ...files }
  return {
    files: store,
    async read(p) {
      const v = store[p]
      if (v === undefined) throw new Error(`no such file: ${p}`)
      return v
    },
    async write(p, contents) {
      store[p] = contents
    }
  }
}

const measured = (
  tagName: string,
  x: number,
  y: number,
  width: number,
  height: number,
  children: MeasuredElement[] = []
): MeasuredElement => ({ tagName, x, y, width, height, children })

describe('editText', () => {
  test('replaces the text between the tags and nothing else', () => {
    const src = `const A = () => <button className="b">Buy now</button>`
    const { nodes } = toSceneNodes(parseJsx(src, 'A.tsx'), { filePath: 'A.tsx' })
    const out = applyEdits(src, [editText(nodes[0]!.source.web!, 'Get started')])
    expect(out).toBe(`const A = () => <button className="b">Get started</button>`)
  })

  test('refuses a self-closing element, which has no text', () => {
    const src = `const A = () => <img src="a.png" />`
    const { nodes } = toSceneNodes(parseJsx(src, 'A.tsx'), { filePath: 'A.tsx' })
    expect(() => editText(nodes[0]!.source.web!, 'x')).toThrow(WriteBackError)
  })

  test('a text edit and a class edit on the same element compose', () => {
    const src = `const A = () => <p className="old">before</p>`
    const { nodes } = toSceneNodes(parseJsx(src, 'A.tsx'), { filePath: 'A.tsx' })
    const web = nodes[0]!.source.web!
    const out = applyEdits(src, [editClassName(web, 'new'), editText(web, 'after')])
    expect(out).toBe(`const A = () => <p className="new">after</p>`)
  })
})

describe('joinGeometry', () => {
  test('fills geometry from the rendered tree', () => {
    const src = `const A = () => (<div className="page"><span>hi</span></div>)`
    const { nodes, byId } = toSceneNodes(parseJsx(src, 'A.tsx'), { filePath: 'A.tsx' })
    const rendered = [measured('div', 10, 20, 400, 300, [measured('span', 18, 28, 40, 16)])]

    const { matched, unmatched } = joinGeometry(nodes, byId, rendered)
    expect(unmatched).toEqual([])
    expect(matched.length).toBe(2)

    const root = nodes.find((n) => n.parentId === null)!
    expect([root.x, root.y, root.width, root.height]).toEqual([10, 20, 400, 300])
    const child = nodes.find((n) => n.id === root.childIds[0])!
    expect([child.x, child.y, child.width, child.height]).toEqual([18, 28, 40, 16])
  })

  test('a dynamic subtree is reported unmatched rather than aligned by guesswork', () => {
    // The DOM has three <li>; the source has one inside a .map(). Pairing them
    // positionally would attach the wrong source range to two of them.
    const src = `const A = () => (<ul>{items.map(i => <li key={i}>{i}</li>)}</ul>)`
    const { nodes, byId } = toSceneNodes(parseJsx(src, 'A.tsx'), { filePath: 'A.tsx' })
    const rendered = [
      measured('ul', 0, 0, 200, 90, [
        measured('li', 0, 0, 200, 30),
        measured('li', 0, 30, 200, 30),
        measured('li', 0, 60, 200, 30)
      ])
    ]

    const { matched, unmatched, warnings } = joinGeometry(nodes, byId, rendered)
    const ul = nodes.find((n) => n.parentId === null)!
    expect(matched).toContain(ul.id)
    expect(ul.height).toBe(90)
    // whatever sits under the dynamic node keeps zero geometry
    for (const id of ul.childIds) expect(unmatched).toContain(id)
    expect(warnings.length).toBe(1)
  })

  test('a tag mismatch stops the pairing instead of sliding everything along', () => {
    const src = `const A = () => (<div><span>a</span></div>)`
    const { nodes, byId } = toSceneNodes(parseJsx(src, 'A.tsx'), { filePath: 'A.tsx' })
    const rendered = [measured('section', 0, 0, 10, 10)]
    const { matched, unmatched } = joinGeometry(nodes, byId, rendered)
    expect(matched).toEqual([])
    expect(unmatched.length).toBe(2)
  })

  test('a component matches positionally, since its rendered tag is unknown from source', () => {
    const src = `const A = () => (<div><PricingCard /></div>)`
    const { nodes, byId } = toSceneNodes(parseJsx(src, 'A.tsx'), { filePath: 'A.tsx' })
    const rendered = [measured('div', 0, 0, 100, 100, [measured('article', 5, 5, 90, 90)])]
    const { unmatched } = joinGeometry(nodes, byId, rendered)
    expect(unmatched).toEqual([])
    const card = nodes.find((n) => n.source.web!.tagName === 'PricingCard')!
    expect(card.width).toBe(90)
  })
})

describe('writeEdits', () => {
  test('writes the spliced file to disk', async () => {
    const src = `const A = () => <div className="a">hi</div>`
    const io = memoryIO({ 'A.tsx': src })
    const { nodes } = toSceneNodes(parseJsx(src, 'A.tsx'), { filePath: 'A.tsx' })

    const results = await writeEdits([editClassName(nodes[0]!.source.web!, 'b')], io)
    expect(results.length).toBe(1)
    expect(io.files['A.tsx']).toBe(`const A = () => <div className="b">hi</div>`)
    // and it still parses to the new value
    expect(parseWebSource(io.files['A.tsx']!, 'A.tsx').roots[0]!.span.className).toBe('b')
  })

  test('a no-op edit does not rewrite the file', async () => {
    const src = `const A = () => <div className="a">hi</div>`
    const io = memoryIO({ 'A.tsx': src })
    const { nodes } = toSceneNodes(parseJsx(src, 'A.tsx'), { filePath: 'A.tsx' })
    const results = await writeEdits([editClassName(nodes[0]!.source.web!, 'a')], io)
    expect(results).toEqual([])
  })

  test('an edit that breaks the file is refused and nothing is written', async () => {
    const src = `const A = () => <div className="a">hi</div>`
    const io = memoryIO({ 'A.tsx': src })
    // A deliberately wrong range: swallows the closing brace and quote.
    const bad = { filePath: 'A.tsx', start: 16, end: 30, text: '<<<', label: 'corrupt' }

    await expect(writeEdits([bad], io)).rejects.toThrow(WriteBackError)
    expect(io.files['A.tsx']).toBe(src)
  })

  test('an edit that drops an element is refused', async () => {
    const src = `const A = () => (<div><span>x</span></div>)`
    const io = memoryIO({ 'A.tsx': src })
    const spanStart = src.indexOf('<span>')
    const spanEnd = src.indexOf('</span>') + '</span>'.length
    const removal = { filePath: 'A.tsx', start: spanStart, end: spanEnd, text: '', label: 'drop' }

    await expect(writeEdits([removal], io)).rejects.toThrow(/element count/)
    expect(io.files['A.tsx']).toBe(src)
  })

  test('a failure part-way through rolls back the files already written', async () => {
    const good = `const A = () => <div className="a">hi</div>`
    const io = memoryIO({ 'A.tsx': good, 'B.tsx': good })
    const { nodes } = toSceneNodes(parseJsx(good, 'A.tsx'), { filePath: 'A.tsx' })
    const ok = editClassName(nodes[0]!.source.web!, 'b')
    const broken = { filePath: 'B.tsx', start: 16, end: 30, text: '<<<', label: 'corrupt' }

    await expect(writeEdits([ok, broken], io)).rejects.toThrow(WriteBackError)
    expect(io.files['A.tsx']).toBe(good)
    expect(io.files['B.tsx']).toBe(good)
  })

  test('verification can be disabled for a caller that knows better', async () => {
    const src = `const A = () => <div className="a">hi</div>`
    const io = memoryIO({ 'A.tsx': src })
    const bad = { filePath: 'A.tsx', start: 16, end: 30, text: '<<<', label: 'unchecked' }
    await writeEdits([bad], io, { verify: false })
    expect(io.files['A.tsx']).not.toBe(src)
  })
})

describe('props vs children being dynamic', () => {
  test('a list row can be restyled even though its content is an expression', () => {
    // The common real case: restyle every row of a mapped list. The children
    // are unknown, the props are not, so the class edit is safe.
    const src = `const A = () => <ul>{items.map(i => <li className="row">{i}</li>)}</ul>`
    const { nodes } = toSceneNodes(parseJsx(src, 'A.tsx'), { filePath: 'A.tsx' })
    const li = nodes.find((n) => n.source.web!.tagName === 'li')!

    expect(li.source.web!.childrenDynamic).toBe(true)
    expect(li.source.web!.propsDynamic).toBe(false)

    const out = applyEdits(src, [editClassName(li.source.web!, 'row active')])
    expect(out).toBe(
      `const A = () => <ul>{items.map(i => <li className="row active">{i}</li>)}</ul>`
    )
  })

  test('but its text still cannot be replaced, because that would delete code', () => {
    const src = `const A = () => <ul>{items.map(i => <li className="row">{i}</li>)}</ul>`
    const { nodes } = toSceneNodes(parseJsx(src, 'A.tsx'), { filePath: 'A.tsx' })
    const li = nodes.find((n) => n.source.web!.tagName === 'li')!
    expect(() => editText(li.source.web!, 'static')).toThrow(WriteBackError)
  })

  test('a spread still blocks a class rewrite', () => {
    const src = `const A = () => <div {...rest} className="a">hi</div>`
    const { nodes } = toSceneNodes(parseJsx(src, 'A.tsx'), { filePath: 'A.tsx' })
    expect(() => editClassName(nodes[0]!.source.web!, 'b')).toThrow(WriteBackError)
  })
})

describe('stale offsets', () => {
  test('an edit built from an outdated parse is refused, not applied blindly', async () => {
    // Two edits from ONE parse: the first shifts the file, so the second points
    // at the wrong place. This is the realistic failure when a caller edits
    // twice without re-parsing.
    const src = `const A = () => (<div className="aaa"><span className="bbb">x</span></div>)`
    const io = memoryIO({ 'A.tsx': src })
    const { nodes } = toSceneNodes(parseJsx(src, 'A.tsx'), { filePath: 'A.tsx' })

    await writeEdits([editClassName(nodes[0]!.source.web!, 'MUCH-LONGER-CLASS')], io)

    // nodes[1] still holds offsets from the original text
    await expect(
      writeEdits([editClassName(nodes[1]!.source.web!, 'ccc')], io)
    ).rejects.toThrow(/re-parse/)

    // and the file keeps the first edit, uncorrupted
    expect(io.files['A.tsx']).toBe(
      `const A = () => (<div className="MUCH-LONGER-CLASS"><span className="bbb">x</span></div>)`
    )
  })

  test('re-parsing after the first edit makes the second succeed', async () => {
    const src = `const A = () => (<div className="aaa"><span className="bbb">x</span></div>)`
    const io = memoryIO({ 'A.tsx': src })
    const first = toSceneNodes(parseJsx(src, 'A.tsx'), { filePath: 'A.tsx' })
    await writeEdits([editClassName(first.nodes[0]!.source.web!, 'MUCH-LONGER-CLASS')], io)

    const reparsed = toSceneNodes(parseJsx(io.files['A.tsx']!, 'A.tsx'), { filePath: 'A.tsx' })
    await writeEdits([editClassName(reparsed.nodes[1]!.source.web!, 'ccc')], io)

    expect(io.files['A.tsx']).toBe(
      `const A = () => (<div className="MUCH-LONGER-CLASS"><span className="ccc">x</span></div>)`
    )
  })
})

describe('jsxToHtml', () => {
  test('renders static markup and carries source ranges', () => {
    const src = `const A = () => (
  <div className="page" id="root">
    <h1 className="title">Hello</h1>
    <img src="a.png" />
  </div>
)`
    const { roots } = parseJsx(src, 'A.tsx')
    const html = jsxToHtml(roots)

    // className became class, and the source range rides along
    expect(html).toContain('class="page"')
    expect(html).toContain('id="root"')
    expect(html).toMatch(/data-op-src="\d+:\d+"/)
    expect(html).toContain('>Hello</h1>')
    // void elements self-close rather than emitting a bogus closing tag
    expect(html).toContain('<img')
    expect(html).not.toContain('</img>')

    // and the range points at the real bytes
    const m = html.match(/data-op-src="(\d+):(\d+)"/)!
    expect(src.slice(Number(m[1]), Number(m[2])).startsWith('<div')).toBe(true)
  })

  test('drops expression props and React-internal ones', () => {
    const src = `const A = () => <li className="row" key={k} onClick={go}>x</li>`
    const html = jsxToHtml(parseJsx(src, 'A.tsx').roots)
    expect(html).toContain('class="row"')
    expect(html).not.toContain('key=')
    expect(html).not.toContain('onClick')
  })

  test('a component keeps its name and children instead of disappearing', () => {
    const src = `const A = () => <div><Card title="Pro"><b>x</b></Card></div>`
    const html = jsxToHtml(parseJsx(src, 'A.tsx').roots)
    expect(html).toContain('data-op-component="Card"')
    expect(html).toContain('title="Pro"')
    expect(html).toContain('<b')
  })

  test('round-trips through parseHtml, so the DOM pipeline can consume it', () => {
    const src = `const A = () => (<div className="wrap"><span className="in">hi</span></div>)`
    const html = jsxToHtml(parseJsx(src, 'A.tsx').roots)
    const reparsed = parseHtml(html, 'out.html')
    expect(reparsed.roots[0]!.span.className).toBe('wrap')
    expect(reparsed.roots[0]!.children[0]!.text).toBe('hi')
  })
})
