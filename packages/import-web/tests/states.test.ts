import { describe, expect, test } from 'bun:test'

import { applyEdits, WriteBackError } from '../src/edit'
import { parseJSX } from '../src/jsx'
import {
  detectStates,
  editStateClasses,
  promoteStateClasses,
  promoteStateCSS
} from '../src/states'
import { toSceneNodes } from '../src/to-scene'

const webOf = (src: string) =>
  toSceneNodes(parseJSX(src, 'A.tsx'), { filePath: 'A.tsx' }).nodes[0]!.source.web!

describe('detectStates', () => {
  test('finds states from utility variants', () => {
    const states = detectStates('bg-blue-600 hover:bg-blue-700 focus:ring-2', undefined)
    expect(states.map((s) => s.state)).toEqual(['hover', 'focus'])
    expect(states[0]!.classes).toEqual(['hover:bg-blue-700'])
  })

  test('reads a state out of a stacked variant', () => {
    const states = detectStates('md:hover:bg-x', undefined)
    expect(states.map((s) => s.state)).toEqual(['hover'])
  })

  test('finds states from stylesheet rules', () => {
    const css = `.btn { color: blue } .btn:hover { color: red } .btn:disabled { opacity: .5 }`
    const states = detectStates('btn', css)
    expect(states.map((s) => s.state).sort()).toEqual(['disabled', 'hover'])
    expect(states.find((s) => s.state === 'hover')!.selectors).toEqual(['.btn:hover'])
  })

  test('an element with no states gets none, rather than an empty hover tab', () => {
    expect(detectStates('plain', '.other:hover { color: red }')).toEqual([])
  })
})

describe('promoteStateCSS', () => {
  const css = `.btn { color: blue; }
.btn:hover { color: red; }
.btn:active { color: green; }`

  test('makes the chosen state apply at rest', () => {
    const out = promoteStateCSS(css, 'hover')
    expect(out).toContain('color: red')
    // the pseudo-class itself is gone, so it applies without a pointer
    expect(out).not.toContain(':hover')
    // and the other state is not showing at the same time
    expect(out).not.toContain('color: green')
  })

  test('default strips every state rule', () => {
    const out = promoteStateCSS(css, 'default')
    expect(out).toContain('color: blue')
    expect(out).not.toContain('color: red')
    expect(out).not.toContain('color: green')
  })

  test('the promoted rule comes last, so it wins the cascade', () => {
    const out = promoteStateCSS(css, 'hover')
    expect(out.indexOf('color: red')).toBeGreaterThan(out.indexOf('color: blue'))
  })
})

describe('promoteStateClasses', () => {
  test('unprefixes the chosen state and drops the others', () => {
    const html = `<button class="bg-blue-600 hover:bg-blue-700 active:bg-blue-900">x</button>`
    const out = promoteStateClasses(html, 'hover')
    expect(out).toContain('bg-blue-700')
    expect(out).not.toContain('hover:')
    expect(out).not.toContain('active:')
    // the resting classes survive
    expect(out).toContain('bg-blue-600')
  })

  test('default drops every state utility', () => {
    const html = `<a class="text-sm hover:underline">x</a>`
    expect(promoteStateClasses(html, 'default')).toBe(`<a class="text-sm">x</a>`)
  })

  test('a responsive variant survives state promotion', () => {
    const html = `<div class="md:hover:flex">x</div>`
    expect(promoteStateClasses(html, 'hover')).toBe(`<div class="md:flex">x</div>`)
  })
})

describe('editStateClasses', () => {
  test('editing hover leaves the resting classes alone', () => {
    const src = `const A = () => <button className="bg-blue-600 px-4 hover:bg-blue-700">x</button>`
    const web = webOf(src)
    const out = applyEdits(src, [editStateClasses(web, 'hover', ['bg-red-500'])])
    // resting classes intact, hover replaced and re-prefixed
    expect(out).toBe(
      `const A = () => <button className="bg-blue-600 px-4 hover:bg-red-500">x</button>`
    )
  })

  test('editing the default state leaves the hover classes alone', () => {
    const src = `const A = () => <button className="bg-blue-600 hover:bg-blue-700">x</button>`
    const web = webOf(src)
    const out = applyEdits(src, [editStateClasses(web, 'default', ['bg-green-500'])])
    expect(out).toBe(
      `const A = () => <button className="bg-green-500 hover:bg-blue-700">x</button>`
    )
  })

  test('an already-prefixed utility is not double-prefixed', () => {
    const src = `const A = () => <button className="a">x</button>`
    const out = applyEdits(src, [editStateClasses(webOf(src), 'hover', ['hover:bg-x'])])
    expect(out).toContain('hover:bg-x')
    expect(out).not.toContain('hover:hover:')
  })

  test('adding a state to an element with no class attribute inserts one', () => {
    const src = `const A = () => <button>x</button>`
    const out = applyEdits(src, [editStateClasses(webOf(src), 'hover', ['bg-x'])])
    expect(out).toBe(`const A = () => <button className="hover:bg-x">x</button>`)
  })

  test('a dynamic className is refused', () => {
    const src = `const A = () => <button {...rest} className="a">x</button>`
    expect(() => editStateClasses(webOf(src), 'hover', ['b'])).toThrow(WriteBackError)
  })

  test('round-trips: the written classes parse back and detect as that state', () => {
    const src = `const A = () => <button className="px-4">x</button>`
    const out = applyEdits(src, [editStateClasses(webOf(src), 'focus', ['ring-2'])])
    const reparsed = parseJSX(out, 'A.tsx').roots[0]!
    expect(detectStates(reparsed.span.className, undefined).map((s) => s.state)).toEqual(['focus'])
  })
})
