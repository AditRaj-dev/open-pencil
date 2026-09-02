import { createDefaultNode } from '@open-pencil/scene-graph/node-defaults'
import type { NodeType, SceneNode } from '@open-pencil/scene-graph'

import type { ImportOptions, ParseResult, WebElement } from './types'

export interface SceneImport {
  /** Flat node list, parents before children, ready to insert into a graph. */
  nodes: SceneNode[]
  /** Ids of the top-level nodes. */
  rootIds: string[]
  /** node id -> source span, the index a write-back walks. */
  byId: Map<string, WebElement>
  warnings: string[]
}

/**
 * A text leaf becomes TEXT; everything else is a FRAME.
 *
 * Deliberately coarse. Guessing RECTANGLE vs ELLIPSE from CSS would be
 * inventing design intent that the source does not state, and a wrong guess is
 * worse than a plain frame — the geometry is filled in later from the live DOM,
 * which is the only thing that actually knows how the element renders.
 */
function nodeTypeFor(el: WebElement): NodeType {
  return el.text !== null && el.children.length === 0 ? 'TEXT' : 'FRAME'
}

function displayName(el: WebElement): string {
  if (el.text) return el.text.length > 32 ? `${el.text.slice(0, 32)}…` : el.text
  const cls = el.span.className?.split(/\s+/)[0]
  return cls ? `${el.tagName}.${cls}` : el.tagName
}

/**
 * Convert a parse result into scene nodes that remember where they came from.
 *
 * Geometry is left at zero: source says what exists and how it nests, not where
 * it lands on screen. Positions come from measuring the rendered page, so
 * filling in numbers here would only be fiction that later has to be corrected.
 */
export function toSceneNodes(result: ParseResult, options: ImportOptions): SceneImport {
  let counter = 0
  const generateId = options.generateId ?? (() => `web-${counter++}`)

  const nodes: SceneNode[] = []
  const rootIds: string[] = []
  const byId = new Map<string, WebElement>()

  const isJSXFile = /\.[jt]sx$/.test(options.filePath)

  const build = (el: WebElement, parentId: string | null): string => {
    const node = createDefaultNode(generateId, nodeTypeFor(el), {
      name: displayName(el),
      parentId,
      width: 0,
      height: 0
    })

    node.source.format = isJSXFile ? 'jsx' : 'html'
    node.source.id = `${el.span.filePath}:${el.span.start}`
    node.source.web = {
      filePath: el.span.filePath,
      tagName: el.tagName,
      isComponent: el.isComponent,
      start: el.span.start,
      end: el.span.end,
      tagEnd: el.span.tagEnd,
      closingTagStart: el.span.closingTagStart,
      startLine: el.span.startLine,
      startColumn: el.span.startColumn,
      endLine: el.span.endLine,
      endColumn: el.span.endColumn,
      className: el.span.className,
      classNameRange: el.span.classNameRange,
      attributes: el.attributes,
      propsDynamic: el.propsDynamic,
      childrenDynamic: el.childrenDynamic,
      dynamic: el.dynamic
    }

    if (el.text !== null) node.text = el.text

    nodes.push(node)
    byId.set(node.id, el)

    for (const child of el.children) {
      node.childIds.push(build(child, node.id))
    }
    return node.id
  }

  for (const root of result.roots) rootIds.push(build(root, null))

  return { nodes, rootIds, byId, warnings: result.warnings }
}
