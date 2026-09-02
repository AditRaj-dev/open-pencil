import type { SceneNode } from '@open-pencil/scene-graph'

import type { WebElement } from './types'

/** A measured element from the rendered page, in document coordinates. */
export interface MeasuredElement {
  tagName: string
  x: number
  y: number
  width: number
  height: number
  children: MeasuredElement[]
}

export interface JoinResult {
  /** Node ids that received real geometry. */
  matched: string[]
  /** Node ids left at zero size because no rendered element corresponded. */
  unmatched: string[]
  warnings: string[]
}

/**
 * Fill source-derived nodes with the geometry of the rendered page.
 *
 * Source states what exists and how it nests; only the running page knows where
 * anything lands. These are joined structurally — walking both trees together,
 * matching by tag name in order — because source offers no identity the DOM
 * also carries. There is no `data-*` hook to key on unless the build inserts
 * one.
 *
 * The honest limit: structural matching holds exactly while the rendered tree
 * mirrors the written tree. A `{cond && <X/>}` or a `.map()` makes the DOM
 * diverge from source, which is precisely what `dynamic` marks. Those subtrees
 * are reported as unmatched rather than aligned by guesswork, because a wrong
 * alignment would attach one element's geometry to another element's source
 * range — and an edit would then rewrite the wrong line.
 */
export function joinGeometry(
  nodes: readonly SceneNode[],
  byId: ReadonlyMap<string, WebElement>,
  rendered: readonly MeasuredElement[]
): JoinResult {
  const nodeById = new Map(nodes.map((n) => [n.id, n]))
  const matched: string[] = []
  const unmatched: string[] = []
  const warnings: string[] = []

  const roots = nodes.filter((n) => n.parentId === null)

  const walk = (nodeIds: readonly string[], measured: readonly MeasuredElement[]): void => {
    // Pair positionally, but only while the tags agree. The first mismatch
    // means the trees have diverged and every later pairing would be arbitrary.
    let i = 0
    for (const id of nodeIds) {
      const node = nodeById.get(id)
      const el = byId.get(id)
      if (!node || !el) continue

      const candidate = measured[i]
      const tagsAgree = candidate.tagName.toLowerCase() === el.tagName.toLowerCase()

      // A component renders to markup whose root tag is unknown from source, so
      // accept the positional candidate for it rather than requiring a name match.
      const acceptable = tagsAgree || el.isComponent

      if (!acceptable) {
        markUnmatched(id)
        continue
      }

      node.x = candidate.x
      node.y = candidate.y
      node.width = candidate.width
      node.height = candidate.height
      matched.push(id)

      if (el.dynamic) {
        // Children below a dynamic node cannot be trusted to line up even
        // though this node did.
        for (const childId of node.childIds) markUnmatched(childId)
      } else {
        walk(node.childIds, candidate.children)
      }
      i++
    }
  }

  const markUnmatched = (id: string): void => {
    unmatched.push(id)
    const node = nodeById.get(id)
    if (node) for (const childId of node.childIds) markUnmatched(childId)
  }

  walk(
    roots.map((n) => n.id),
    rendered
  )

  if (unmatched.length > 0) {
    warnings.push(
      `${unmatched.length} node(s) had no corresponding rendered element and keep zero geometry; ` +
        `usually a conditional or list that makes the DOM differ from the source`
    )
  }

  return { matched, unmatched, warnings }
}
