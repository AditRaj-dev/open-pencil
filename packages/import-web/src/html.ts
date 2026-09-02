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
  endTag?: { startOffset: number; endOffset: number }
  attrs?: Record<string, { startOffset: number; endOffset: number } | undefined>
}

interface P5Node {
  nodeName: string
  tagName?: string
  value?: string
  attrs?: Array<{ name: string; value: string }>
  childNodes?: P5Node[]
  sourceCodeLocation?: P5Location | null
}

// '#text' matters: parse5 reports whitespace between tags as text nodes, and
// letting them through would add phantom elements that shift the structural
// match against the DOM.
const SKIP = new Set([
  '#text',
  '#comment',
  '#documentType',
  'script',
  'style',
  'head',
  'meta',
  'link',
  'title'
])

/**
 * Parse HTML into the same element tree the JSX parser produces.
 *
 * HTML has no dynamic constructs, so every node here is statically known and
 * `dynamic` is always false — which makes HTML the safe case for write-back.
 */
/**
 * Positional fields with defaults, for a node parse5 gave no location.
 *
 * Extracted so `spanOf` stays a straight assembly rather than a chain of
 * fallbacks.
 */
function offsetsOf(
  loc: P5Location | null | undefined
): Omit<WebSpan, 'filePath' | 'className' | 'classNameRange'> {
  // One guard rather than a fallback per field: parse5 either located the node
  // or it did not.
  if (!loc) {
    return {
      start: 0,
      end: 0,
      tagEnd: 0,
      closingTagStart: null,
      startLine: 1,
      startColumn: 1,
      endLine: 1,
      endColumn: 1
    }
  }
  return {
    start: loc.startOffset,
    end: loc.endOffset,
    tagEnd: loc.startTag?.endOffset ?? loc.startOffset,
    // Absent for void elements (<img>, <br>) and unclosed tags.
    closingTagStart: loc.endTag?.startOffset ?? null,
    startLine: loc.startLine,
    startColumn: loc.startCol,
    endLine: loc.endLine,
    endColumn: loc.endCol
  }
}

/**
 * Narrow parse5's attribute range to the class VALUE.
 *
 * parse5 reports the span of the whole `class="..."` attribute; a rewrite must
 * replace only what is between the quotes, or it would eat the attribute name.
 */
function classRangeOf(
  loc: P5Location | null | undefined,
  className: string | null
): { start: number; end: number } | null {
  if (!loc?.attrs || className === null) return null
  const classAttr = 'class' in loc.attrs ? loc.attrs['class'] : undefined
  if (!classAttr) return null
  return {
    start: classAttr.endOffset - className.length - 1,
    end: classAttr.endOffset - 1
  }
}

export function parseHTML(source: string, filePath: string): ParseResult {
  // parse5's Document already matches the subset this module reads.
  const doc: P5Node = parse(source, { sourceCodeLocationInfo: true })
  const warnings: string[] = []
  const roots: WebElement[] = []

  const spanOf = (node: P5Node): WebSpan => {
    const className = node.attrs?.find((a) => a.name === 'class')?.value ?? null
    return {
      filePath,
      ...offsetsOf(node.sourceCodeLocation),
      className,
      classNameRange: classRangeOf(node.sourceCodeLocation, className)
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
      propsDynamic: false,
      childrenDynamic: false,
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
