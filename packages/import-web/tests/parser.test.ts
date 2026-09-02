import { describe, expect, test } from 'bun:test'

import { applyEdits, editClassName, WriteBackError } from '../src/edit'
import { parseHtml } from '../src/html'
import { parseJsx } from '../src/jsx'
import { toSceneNodes } from '../src/to-scene'
import type { WebElement } from '../src/types'

const find = (els: WebElement[], tag: string): WebElement | undefined => {
  for (const el of els) {
    if (el.tagName === tag) return el
    const hit = find(el.children, tag)
    if (hit) return hit
  }
  return undefined
}

describe('cases a regex parser gets wrong', () => {
  test('a multi-line tag gets a correct span', () => {
    const src = `export const A = () => (
  <div
    className="card"
    id="x"
  >
    hello
  </div>
)`
    const div = find(parseJsx(src, 'A.tsx').roots, 'div')!
    expect(div.span.startLine).toBe(2)
    // The closing </div> is on line 7; a regex parser reports line 2, which is
    // the whole point of this case.
    expect(div.span.endLine).toBe(7)
    const text = src.slice(div.span.start, div.span.end)
    expect(text.startsWith('<div')).toBe(true)
    expect(text.endsWith('</div>')).toBe(true)
  })

  test('a > inside a prop expression does not end the tag', () => {
    const src = `const A = () => <button onClick={() => count > 1 && next()}>Go</button>`
    const btn = find(parseJsx(src, 'A.tsx').roots, 'button')!
    expect(btn.text).toBe('Go')
    expect(src.slice(btn.span.start, btn.span.end).endsWith('</button>')).toBe(true)
    expect(btn.attributes['onClick']).toBe(null)
    expect(btn.dynamic).toBe(true)
  })

  test('a generic call is not mistaken for a tag', () => {
    const src = `const f = useMemo<Record<string, number>>(() => ({}), []);
const A = () => <span className="only">x</span>`
    const { roots } = parseJsx(src, 'A.tsx')
    expect(roots.length).toBe(1)
    expect(roots[0]!.tagName).toBe('span')
  })

  test('angle brackets inside strings and comments are ignored', () => {
    const src = `// <div fake="1">
const msg = "<section>not markup</section>";
const A = () => <p>real</p>`
    const { roots } = parseJsx(src, 'A.tsx')
    expect(roots.length).toBe(1)
    expect(roots[0]!.tagName).toBe('p')
  })
})

describe('structure', () => {
  test('nesting, components and intrinsics are distinguished', () => {
    const src = `const A = () => (
  <div className="wrap">
    <PricingCard title="Pro" />
    <span>text</span>
  </div>
)`
    const { roots, components } = parseJsx(src, 'A.tsx')
    const wrap = roots[0]!
    expect(wrap.children.length).toBe(2)
    expect(wrap.children[0]!.tagName).toBe('PricingCard')
    expect(wrap.children[0]!.isComponent).toBe(true)
    expect(wrap.children[1]!.isComponent).toBe(false)
    expect(wrap.children[0]!.attributes['title']).toBe('Pro')
    expect(components).toEqual(['A'])
  })

  test('dynamic children mark the parent, and spreads mark the element', () => {
    const listSrc = `const A = () => <ul>{items.map(i => <li key={i}>{i}</li>)}</ul>`
    expect(find(parseJsx(listSrc, 'A.tsx').roots, 'ul')!.dynamic).toBe(true)

    const spreadSrc = `const A = () => <div {...rest} className="c">x</div>`
    expect(find(parseJsx(spreadSrc, 'A.tsx').roots, 'div')!.dynamic).toBe(true)
  })

  test('className range covers the value only', () => {
    const src = `const A = () => <div className="a b">x</div>`
    const div = find(parseJsx(src, 'A.tsx').roots, 'div')!
    expect(div.span.className).toBe('a b')
    const range = div.span.classNameRange!
    expect(src.slice(range.start, range.end)).toBe('a b')
  })
})

describe('html', () => {
  test('parses with spans and is never dynamic', () => {
    const src = `<div class="page">\n  <p>hi</p>\n</div>`
    const div = parseHtml(src, 'page.html').roots[0]!
    expect(div.tagName).toBe('div')
    expect(div.span.className).toBe('page')
    const range = div.span.classNameRange!
    expect(src.slice(range.start, range.end)).toBe('page')
    expect(div.dynamic).toBe(false)
    expect(div.children[0]!.text).toBe('hi')
  })

  test('skips script and style', () => {
    const src = `<div><script>var a = 1</script><style>.x{}</style><b>keep</b></div>`
    const div = parseHtml(src, 'p.html').roots[0]!
    expect(div.children.map((c) => c.tagName)).toEqual(['b'])
  })
})

describe('scene nodes', () => {
  test('carry their source span and nesting', () => {
    const src = `const A = () => (<div className="wrap"><span>hi</span></div>)`
    const { nodes, rootIds } = toSceneNodes(parseJsx(src, 'A.tsx'), { filePath: 'A.tsx' })

    expect(rootIds.length).toBe(1)
    const root = nodes.find((n) => n.id === rootIds[0])!
    expect(root.source.format).toBe('jsx')
    expect(root.source.web!.tagName).toBe('div')
    expect(root.type).toBe('FRAME')

    const child = nodes.find((n) => n.id === root.childIds[0])!
    expect(child.type).toBe('TEXT')
    expect(child.text).toBe('hi')
    const web = child.source.web!
    expect(src.slice(web.start, web.end)).toBe('<span>hi</span>')
  })
})

describe('write-back', () => {
  test('rewriting a class replaces only the value', () => {
    const src = `const A = () => <div id="k" className="a b" data-x="1">hi</div>`
    const { nodes } = toSceneNodes(parseJsx(src, 'A.tsx'), { filePath: 'A.tsx' })
    const out = applyEdits(src, [editClassName(nodes[0]!.source.web!, 'a c')])
    expect(out).toBe(`const A = () => <div id="k" className="a c" data-x="1">hi</div>`)
  })

  test('a missing class attribute is inserted after the tag name', () => {
    const src = `const A = () => <div id="k">hi</div>`
    const { nodes } = toSceneNodes(parseJsx(src, 'A.tsx'), { filePath: 'A.tsx' })
    const out = applyEdits(src, [editClassName(nodes[0]!.source.web!, 'new')])
    expect(out).toBe(`const A = () => <div className="new" id="k">hi</div>`)
    // and the result must still parse back to the same class
    expect(parseJsx(out, 'A.tsx').roots[0]!.span.className).toBe('new')
  })

  test('html uses class, not className', () => {
    const src = `<div id="k">hi</div>`
    const { nodes } = toSceneNodes(parseHtml(src, 'p.html'), { filePath: 'p.html' })
    const out = applyEdits(src, [editClassName(nodes[0]!.source.web!, 'z')])
    expect(out).toBe(`<div class="z" id="k">hi</div>`)
  })

  test('a dynamic element refuses to be rewritten', () => {
    const src = `const A = () => <div {...rest} className="a">hi</div>`
    const { nodes } = toSceneNodes(parseJsx(src, 'A.tsx'), { filePath: 'A.tsx' })
    expect(() => editClassName(nodes[0]!.source.web!, 'b')).toThrow(WriteBackError)
  })

  test('multiple edits apply last-first and stay correct', () => {
    const src = `const A = () => (<div className="one"><span className="two">x</span></div>)`
    const { nodes } = toSceneNodes(parseJsx(src, 'A.tsx'), { filePath: 'A.tsx' })
    const out = applyEdits(src, [
      editClassName(nodes[0]!.source.web!, 'ONE-LONGER'),
      editClassName(nodes[1]!.source.web!, 'TWO')
    ])
    expect(out).toBe(
      `const A = () => (<div className="ONE-LONGER"><span className="TWO">x</span></div>)`
    )
  })

  test('overlapping edits are refused rather than scrambling the file', () => {
    expect(() =>
      applyEdits('abcdefgh', [
        { filePath: 'f', start: 0, end: 4, text: 'X', label: 'a' },
        { filePath: 'f', start: 2, end: 6, text: 'Y', label: 'b' }
      ])
    ).toThrow(WriteBackError)
  })

  test('an out-of-range edit is refused', () => {
    expect(() =>
      applyEdits('short', [{ filePath: 'f', start: 0, end: 999, text: 'x', label: 'a' }])
    ).toThrow(WriteBackError)
  })
})
