import { parse } from 'parse5'

import type { ParseResult, WebElement, WebSpan } from './types'

/** parse5 exposes positions only when sourceCodeLocationInfo is requested. */
interface P5Location {
  startOffset: number
  endOffset: number
  startLine: number
  startCol: number
  endLine: number
  endCol: number
  startTag?: { startOffset: number; endOffset: number }
  attrs?: Record<string, { startOffset: number; endOffset: number }>
}

interface P5Node {
  nodeName: string
  tagName?: string
  value?: string
  attrs?: Array<{ name: string; value: string }>
  childNodes?: P5Node[]
  sourceCodeLocation?: P5Location | null
}

const SKIP = new Set(['#comment', '#documentType', 'script', 'style', 'head', 'meta', 'link', 'title'])

/**
 * Parse HTML into the same element tree the JSX parser produces.
 *
 * HTML has no dynamic constructs, so every node here is statically known and
 * `dynamic` is always false — which makes HTML the safe case for write-back.
 */
export function parseHtml(source: string, filePath: string): ParseResult {
  const doc = parse(source, { sourceCodeLocationInfo: true }) as unknown as P5Node
  const warnings: string[] = []
  const roots: WebElement[] = []

  const spanOf = (node: P5Node): WebSpan => {
    const loc = node.sourceCodeLocation
    const classAttr = loc?.attrs?.['class']
    const className = node.attrs?.find((a) => a.name === 'class')?.value ?? null

    return {
      filePath,
      start: loc?.startOffset ?? 0,
      end: loc?.endOffset ?? 0,
      tagEnd: loc?.startTag?.endOffset ?? loc?.startOffset ?? 0,
      startLine: loc?.startLine ?? 1,
      startColumn: loc?.startCol ?? 1,
      endLine: loc?.endLine ?? 1,
      endColumn: loc?.endCol ?? 1,
      className,
      // parse5 gives the whole `class="..."` attribute range; narrow it to the
      // value so a rewrite replaces only the classes.
      classNameRange:
        classAttr && className !== null
          ? {
              start: classAttr.endOffset - className.length - 1,
              end: classAttr.endOffset - 1
            }
          : null
    }
  }

  const convert = (node: P5Node): WebElement | null => {
    const tagName = node.tagName ?? node.nodeName
    if (SKIP.has(tagName)) return null

    const attributes: Record<string, string | null> = {}
    for (const a of node.attrs ?? []) attributes[a.name] = a.value

    const children: WebElement[] = []
    const staticText: string[] = []

    for (const child of node.childNodes ?? []) {
      if (child.nodeName === '#text') {
        const t = (child.value ?? '').trim()
        if (t) staticText.push(t)
        continue
      }
      const converted = convert(child)
      if (converted) children.push(converted)
    }

    return {
      tagName,
      isComponent: false, // HTML has no component references
      attributes,
      text: children.length === 0 && staticText.length > 0 ? staticText.join(' ') : null,
      children,
      span: spanOf(node),
      dynamic: false
    }
  }

  const walkTop = (node: P5Node): void => {
    // Descend past html/body wrappers the parser inserts, so the caller gets
    // the elements actually written in the file.
    if (node.nodeName === '#document' || node.nodeName === 'html' || node.nodeName === 'body') {
      for (const child of node.childNodes ?? []) walkTop(child)
      return
    }
    const converted = convert(node)
    if (converted) roots.push(converted)
  }

  walkTop(doc)

  if (roots.length === 0) warnings.push('no elements found; the document may be empty or script-only')

  return { roots, components: [], warnings }
}
