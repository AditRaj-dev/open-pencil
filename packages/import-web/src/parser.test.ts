import { test } from 'node:test'
import { strict as assert } from 'node:assert'

import { applyEdits, editClassName, WriteBackError } from './edit'
import { parseHtml } from './html'
import { parseJsx } from './jsx'
import { toSceneNodes } from './to-scene'
import type { WebElement } from './types'

const find = (els: WebElement[], tag: string): WebElement | undefined => {
  for (const el of els) {
    if (el.tagName === tag) return el
    const hit = find(el.children, tag)
    if (hit) return hit
  }
  return undefined
}

// --- the cases a regex parser gets wrong ------------------------------------

test('a multi-line tag gets a correct span', () => {
  const src = `export const A = () => (
  <div
    className="card"
    id="x"
  >
    hello
  </div>
)`
  const { roots } = parseJsx(src, 'A.tsx')
  const div = find(roots, 'div')!
  assert.equal(div.span.startLine, 2)
  // The closing </div> is on line 7 of the fixture; a regex parser would
  // report line 2, which is the whole point of this case.
  assert.equal(div.span.endLine, 7, 'end must be the closing tag, not the opening line')
  assert.equal(src.slice(div.span.start, div.span.end).startsWith('<div'), true)
  assert.equal(src.slice(div.span.start, div.span.end).endsWith('</div>'), true)
})

test('a > inside a prop expression does not end the tag', () => {
  const src = `const A = () => <button onClick={() => count > 1 && next()}>Go</button>`
  const { roots } = parseJsx(src, 'A.tsx')
  const btn = find(roots, 'button')!
  assert.equal(btn.text, 'Go', 'text must be read past the > in the expression')
  assert.equal(src.slice(btn.span.start, btn.span.end).endsWith('</button>'), true)
  assert.equal(btn.attributes['onClick'], null, 'an expression prop is not statically known')
  assert.equal(btn.dynamic, true)
})

test('a generic call is not mistaken for a tag', () => {
  const src = `const f = useMemo<Record<string, number>>(() => ({}), []);
const A = () => <span className="only">x</span>`
  const { roots } = parseJsx(src, 'A.tsx')
  assert.equal(roots.length, 1, 'only the real JSX element is a root')
  assert.equal(roots[0]!.tagName, 'span')
})

test('angle brackets inside strings and comments are ignored', () => {
  const src = `// <div fake="1">
const msg = "<section>not markup</section>";
const A = () => <p>real</p>`
  const { roots } = parseJsx(src, 'A.tsx')
  assert.equal(roots.length, 1)
  assert.equal(roots[0]!.tagName, 'p')
})

// --- structure ---------------------------------------------------------------

test('nesting, components and intrinsics are distinguished', () => {
  const src = `const A = () => (
  <div className="wrap">
    <PricingCard title="Pro" />
    <span>text</span>
  </div>
)`
  const { roots, components } = parseJsx(src, 'A.tsx')
  const wrap = roots[0]!
  assert.equal(wrap.children.length, 2)
  assert.equal(wrap.children[0]!.tagName, 'PricingCard')
  assert.equal(wrap.children[0]!.isComponent, true)
  assert.equal(wrap.children[1]!.isComponent, false)
  assert.equal(wrap.children[0]!.attributes['title'], 'Pro')
  assert.deepEqual(components, ['A'])
})

test('dynamic children mark the parent, and spreads mark the element', () => {
  const listSrc = `const A = () => <ul>{items.map(i => <li key={i}>{i}</li>)}</ul>`
  const ul = find(parseJsx(listSrc, 'A.tsx').roots, 'ul')!
  assert.equal(ul.dynamic, true, 'a mapped list is not statically known')

  const spreadSrc = `const A = () => <div {...rest} className="c">x</div>`
  const div = find(parseJsx(spreadSrc, 'A.tsx').roots, 'div')!
  assert.equal(div.dynamic, true, 'a spread can set anything')
})

test('className range covers the value only', () => {
  const src = `const A = () => <div className="a b">x</div>`
  const div = find(parseJsx(src, 'A.tsx').roots, 'div')!
  assert.equal(div.span.className, 'a b')
  const { start, end } = div.span.classNameRange!
  assert.equal(src.slice(start, end), 'a b', 'range must exclude the quotes')
})

// --- html --------------------------------------------------------------------

test('html parses with spans and is never dynamic', () => {
  const src = `<div class="page">\n  <p>hi</p>\n</div>`
  const { roots } = parseHtml(src, 'page.html')
  const div = roots[0]!
  assert.equal(div.tagName, 'div')
  assert.equal(div.span.className, 'page')
  assert.equal(src.slice(div.span.classNameRange!.start, div.span.classNameRange!.end), 'page')
  assert.equal(div.dynamic, false)
  assert.equal(div.children[0]!.text, 'hi')
})

test('html skips script and style', () => {
  const src = `<div><script>var a = 1</script><style>.x{}</style><b>keep</b></div>`
  const div = parseHtml(src, 'p.html').roots[0]!
  assert.deepEqual(div.children.map((c) => c.tagName), ['b'])
})

// --- scene nodes -------------------------------------------------------------

test('scene nodes carry their source span and nesting', () => {
  const src = `const A = () => (<div className="wrap"><span>hi</span></div>)`
  const parsed = parseJsx(src, 'A.tsx')
  const { nodes, rootIds } = toSceneNodes(parsed, { filePath: 'A.tsx' })

  assert.equal(rootIds.length, 1)
  const root = nodes.find((n) => n.id === rootIds[0])!
  assert.equal(root.source.format, 'jsx')
  assert.equal(root.source.web!.tagName, 'div')
  assert.equal(root.type, 'FRAME')

  const child = nodes.find((n) => n.id === root.childIds[0])!
  assert.equal(child.type, 'TEXT', 'a static text leaf becomes TEXT')
  assert.equal(child.text, 'hi')
  assert.equal(src.slice(child.source.web!.start, child.source.web!.end), '<span>hi</span>')
})

// --- write-back --------------------------------------------------------------

test('rewriting a class replaces only the value', () => {
  const src = `const A = () => <div id="k" className="a b" data-x="1">hi</div>`
  const parsed = parseJsx(src, 'A.tsx')
  const { nodes } = toSceneNodes(parsed, { filePath: 'A.tsx' })
  const web = nodes[0]!.source.web!

  const out = applyEdits(src, [editClassName(web, 'a c')])
  assert.equal(out, `const A = () => <div id="k" className="a c" data-x="1">hi</div>`)
})

test('a missing class attribute is inserted after the tag name', () => {
  const src = `const A = () => <div id="k">hi</div>`
  const { nodes } = toSceneNodes(parseJsx(src, 'A.tsx'), { filePath: 'A.tsx' })
  const out = applyEdits(src, [editClassName(nodes[0]!.source.web!, 'new')])
  assert.equal(out, `const A = () => <div className="new" id="k">hi</div>`)
  // and the result must still parse back to the same class
  assert.equal(parseJsx(out, 'A.tsx').roots[0]!.span.className, 'new')
})

test('html uses class, not className', () => {
  const src = `<div id="k">hi</div>`
  const { nodes } = toSceneNodes(parseHtml(src, 'p.html'), { filePath: 'p.html' })
  const out = applyEdits(src, [editClassName(nodes[0]!.source.web!, 'z')])
  assert.equal(out, `<div class="z" id="k">hi</div>`)
})

test('a dynamic element refuses to be rewritten', () => {
  const src = `const A = () => <div {...rest} className="a">hi</div>`
  const { nodes } = toSceneNodes(parseJsx(src, 'A.tsx'), { filePath: 'A.tsx' })
  assert.throws(() => editClassName(nodes[0]!.source.web!, 'b'), WriteBackError)
})

test('multiple edits apply last-first and stay correct', () => {
  const src = `const A = () => (<div className="one"><span className="two">x</span></div>)`
  const { nodes } = toSceneNodes(parseJsx(src, 'A.tsx'), { filePath: 'A.tsx' })
  const outer = nodes[0]!.source.web!
  const inner = nodes[1]!.source.web!

  const out = applyEdits(src, [editClassName(outer, 'ONE-LONGER'), editClassName(inner, 'TWO')])
  assert.equal(out, `const A = () => (<div className="ONE-LONGER"><span className="TWO">x</span></div>)`)
})

test('overlapping edits are refused rather than scrambling the file', () => {
  assert.throws(
    () =>
      applyEdits('abcdefgh', [
        { filePath: 'f', start: 0, end: 4, text: 'X', label: 'a' },
        { filePath: 'f', start: 2, end: 6, text: 'Y', label: 'b' }
      ]),
    WriteBackError
  )
})

test('an out-of-range edit is refused', () => {
  assert.throws(
    () => applyEdits('short', [{ filePath: 'f', start: 0, end: 999, text: 'x', label: 'a' }]),
    WriteBackError
  )
})
