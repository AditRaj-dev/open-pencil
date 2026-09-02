import type { WebElement } from './types'

/** Attribute carrying a source range, so scene nodes can be traced back. */
export const SOURCE_ATTR = 'data-op-src'

const VOID_TAGS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr'
])

/** JSX prop names that differ from their HTML attribute. */
const PROP_TO_ATTR: Record<string, string> = {
  className: 'class',
  htmlFor: 'for',
  tabIndex: 'tabindex',
  readOnly: 'readonly',
  maxLength: 'maxlength',
  autoComplete: 'autocomplete',
  autoFocus: 'autofocus'
}

function escapeAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
}

function escapeText(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/**
 * Render a parsed JSX tree as static HTML.
 *
 * This exists so JSX can reuse the DOM/CSS import pipeline rather than growing
 * a second one. That pipeline already resolves cascade, computes layout through
 * a headless CSS runtime, and produces geometry — none of which is worth
 * reimplementing for a different input syntax.
 *
 * Each element carries its source range in `data-op-src`, which survives into
 * the scene graph as an ordinary attribute. That is what lets a node in the
 * editor be traced back to the exact bytes it was written as.
 *
 * What this is not: a renderer. Components are emitted as their own tag with
 * their children, and expression values are dropped, because neither can be
 * resolved without running the code. The result is the static skeleton of the
 * markup, which is what a design surface needs.
 */
export function jsxToHTML(elements: readonly WebElement[]): string {
  const render = (el: WebElement, depth: number): string => {
    const pad = '  '.repeat(depth)

    // A component has no HTML equivalent. Emit a div carrying its name so the
    // structure and any static children survive, rather than dropping it.
    const tag = el.isComponent ? 'div' : el.tagName.toLowerCase()

    const attrs: string[] = []
    for (const [name, value] of Object.entries(el.attributes)) {
      if (value === null) continue // expression: not knowable statically
      if (name === 'key' || name === 'ref') continue // React-internal
      const attr = PROP_TO_ATTR[name] ?? name
      if (!/^[a-zA-Z_:][-a-zA-Z0-9_:.]*$/.test(attr)) continue
      attrs.push(`${attr}="${escapeAttr(value)}"`)
    }
    if (el.isComponent) attrs.push(`data-op-component="${escapeAttr(el.tagName)}"`)
    attrs.push(`${SOURCE_ATTR}="${el.span.start}:${el.span.end}"`)

    const open = `${pad}<${tag}${attrs.length ? ' ' + attrs.join(' ') : ''}>`

    if (VOID_TAGS.has(tag)) return `${pad}<${tag}${attrs.length ? ' ' + attrs.join(' ') : ''} />`
    if (el.children.length === 0) {
      return `${open}${el.text ? escapeText(el.text) : ''}</${tag}>`
    }

    const inner = el.children.map((c) => render(c, depth + 1)).join('\n')
    return `${open}\n${inner}\n${pad}</${tag}>`
  }

  return elements.map((el) => render(el, 0)).join('\n')
}

/** Wrap rendered markup in a document, optionally with stylesheets inlined. */
export function jsxToHTMLDocument(
  elements: readonly WebElement[],
  options: { css?: string; title?: string } = {}
): string {
  const style = options.css ? `<style>\n${options.css}\n</style>` : ''
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>${escapeText(options.title ?? 'Imported')}</title>
${style}
</head>
<body>
${jsxToHTML(elements)}
</body>
</html>`
}

/** Read a `data-op-src` value back into a range. */
export function parseSourceAttr(value: string | null | undefined): { start: number; end: number } | null {
  if (!value) return null
  const parts = value.split(':')
  const start = Number(parts[0])
  const end = Number(parts[1])
  if (!Number.isFinite(start) || !Number.isFinite(end)) return null
  return { start, end }
}
