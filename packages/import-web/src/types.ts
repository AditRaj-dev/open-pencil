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
   * True when the element's shape depends on runtime values — a `{cond && ...}`
   * child, a spread prop, or a mapped list. Such nodes can be shown and
   * inspected, but writing back to them is unsafe without more analysis.
   */
  dynamic: boolean
}

export interface WebSpan {
  filePath: string
  start: number
  end: number
  /** End of the opening tag, so attribute edits do not touch children. */
  tagEnd: number
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
