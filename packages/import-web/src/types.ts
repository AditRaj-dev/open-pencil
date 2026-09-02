import type { SceneNode, WebSourcePayload } from '@open-pencil/scene-graph'

/** A parsed element before it becomes a SceneNode. Tree-shaped, source-exact. */
export interface WebElement {
  tagName: string
  isComponent: boolean
  /** Static attributes as written; an expression value is recorded as null. */
  attributes: Record<string, string | null>
  /** Literal text content when the element has exactly one static text child. */
  text: string | null
  children: WebElement[]
  span: WebSpan
  /**
   * True when the element's PROPS are not fully knowable — a spread, or a
   * computed className. Blocks attribute rewrites.
   */
  propsDynamic: boolean
  /**
   * True when the element's CHILDREN are not knowable — an expression child, a
   * mapped list, a conditional. Blocks text rewrites and geometry alignment.
   */
  childrenDynamic: boolean
  /**
   * Either kind. Kept because geometry matching cares only that something below
   * or within this element may differ from source.
   */
  dynamic: boolean
}

export interface WebSpan {
  filePath: string
  start: number
  end: number
  /** End of the opening tag, so attribute edits do not touch children. */
  tagEnd: number
  /**
   * Offset where the closing tag begins, so the text between the tags can be
   * replaced without re-printing either. Null for self-closing elements and
   * voids, which have no text to replace.
   */
  closingTagStart: number | null
  startLine: number
  startColumn: number
  endLine: number
  endColumn: number
  className: string | null
  classNameRange: { start: number; end: number } | null
}

export interface ParseResult {
  /** Root-level elements, in source order. */
  roots: WebElement[]
  /** Component names declared in the file, for JSX. */
  components: string[]
  /** Non-fatal problems: unparsed regions, dynamic subtrees, etc. */
  warnings: string[]
}

export interface ImportOptions {
  filePath: string
  /** Generates ids for produced nodes. Defaults to a deterministic counter. */
  generateId?: () => string
}

export type { SceneNode, WebSourcePayload }
