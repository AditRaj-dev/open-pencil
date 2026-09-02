import ts from 'typescript'

import type { ParseResult, WebElement, WebSpan } from './types'

/**
 * Parse a .jsx/.tsx file into a source-exact element tree.
 *
 * Uses the TypeScript compiler's own JSX parser rather than pattern matching.
 * A regex over tags cannot survive real code: multi-line tags, a `>` inside a
 * prop expression (`onClick={() => n > 1}`), comments, strings containing
 * angle brackets, or generics. Those are not edge cases in React source, they
 * are Tuesday — and a wrong span means a write-back corrupts the file.
 */
export function parseJsx(source: string, filePath: string): ParseResult {
  const scriptKind = filePath.endsWith('.tsx')
    ? ts.ScriptKind.TSX
    : filePath.endsWith('.ts')
      ? ts.ScriptKind.TS
      : ts.ScriptKind.JSX

  const sourceFile = ts.createSourceFile(
    filePath,
    source,
    ts.ScriptTarget.Latest,
    /* setParentNodes */ true,
    scriptKind
  )

  const warnings: string[] = []
  const components: string[] = []
  const roots: WebElement[] = []

  // Report the parser's own syntax errors rather than silently emitting a
  // partial tree — a caller must not write back to a file we misread.
  const diagnostics = (sourceFile as unknown as { parseDiagnostics?: ts.Diagnostic[] })
    .parseDiagnostics
  if (diagnostics?.length) {
    for (const d of diagnostics.slice(0, 5)) {
      warnings.push(
        `parse error at ${d.start ?? 0}: ${ts.flattenDiagnosticMessageText(d.messageText, ' ')}`
      )
    }
  }

  const lineCol = (pos: number) => {
    const { line, character } = sourceFile.getLineAndCharacterOfPosition(pos)
    return { line: line + 1, column: character + 1 }
  }

  /** The opening element carries the tag name and attributes. */
  const openingOf = (
    node: ts.JsxElement | ts.JsxSelfClosingElement | ts.JsxFragment
  ): ts.JsxOpeningElement | ts.JsxSelfClosingElement | ts.JsxOpeningFragment =>
    ts.isJsxElement(node) ? node.openingElement : ts.isJsxFragment(node) ? node.openingFragment : node

  const tagNameOf = (node: ts.Node): string => {
    if (ts.isJsxFragment(node)) return 'Fragment'
    const opening = openingOf(node as ts.JsxElement)
    if (ts.isJsxOpeningFragment(opening)) return 'Fragment'
    return opening.tagName.getText(sourceFile)
  }

  /**
   * Read statically-known attributes. A spread or an expression value cannot be
   * resolved without evaluating the component, so it is recorded as null and
   * the element is marked dynamic rather than guessed at.
   */
  const readAttributes = (
    node: ts.JsxElement | ts.JsxSelfClosingElement | ts.JsxFragment
  ): { attributes: Record<string, string | null>; dynamic: boolean; classNameNode: ts.Node | null } => {
    const attributes: Record<string, string | null> = {}
    let dynamic = false
    let classNameNode: ts.Node | null = null

    const opening = openingOf(node)
    if (ts.isJsxOpeningFragment(opening)) return { attributes, dynamic, classNameNode }

    for (const prop of opening.attributes.properties) {
      if (ts.isJsxSpreadAttribute(prop)) {
        dynamic = true
        continue
      }
      const name = prop.name.getText(sourceFile)

      if (prop.initializer === undefined) {
        attributes[name] = 'true' // bare boolean prop
        continue
      }
      if (ts.isStringLiteral(prop.initializer)) {
        attributes[name] = prop.initializer.text
        if (name === 'className' || name === 'class') classNameNode = prop.initializer
        continue
      }
      // {"..."} is still static; anything else depends on runtime values.
      if (ts.isJsxExpression(prop.initializer) && prop.initializer.expression) {
        const expr = prop.initializer.expression
        if (ts.isStringLiteral(expr) || ts.isNoSubstitutionTemplateLiteral(expr)) {
          attributes[name] = expr.text
          if (name === 'className' || name === 'class') classNameNode = expr
          continue
        }
      }
      attributes[name] = null
      dynamic = true
    }

    return { attributes, dynamic, classNameNode }
  }

  const spanOf = (
    node: ts.JsxElement | ts.JsxSelfClosingElement | ts.JsxFragment,
    classNameNode: ts.Node | null
  ): WebSpan => {
    const start = node.getStart(sourceFile)
    const end = node.getEnd()
    const opening = openingOf(node)
    const tagEnd = ts.isJsxOpeningFragment(opening) ? start : opening.getEnd()
    const s = lineCol(start)
    const e = lineCol(end)

    return {
      filePath,
      start,
      end,
      tagEnd,
      startLine: s.line,
      startColumn: s.column,
      endLine: e.line,
      endColumn: e.column,
      className:
        classNameNode && (ts.isStringLiteral(classNameNode) ||
          ts.isNoSubstitutionTemplateLiteral(classNameNode))
          ? classNameNode.text
          : null,
      // The literal's own range, quotes excluded, so a class rewrite is a
      // surgical splice rather than a re-print of the whole tag.
      classNameRange: classNameNode
        ? { start: classNameNode.getStart(sourceFile) + 1, end: classNameNode.getEnd() - 1 }
        : null
    }
  }

  const convert = (
    node: ts.JsxElement | ts.JsxSelfClosingElement | ts.JsxFragment
  ): WebElement => {
    const { attributes, dynamic, classNameNode } = readAttributes(node)
    const tagName = tagNameOf(node)
    const children: WebElement[] = []
    let text: string | null = null
    let childDynamic = false

    if (ts.isJsxElement(node) || ts.isJsxFragment(node)) {
      const staticText: string[] = []
      for (const child of node.children) {
        if (ts.isJsxText(child)) {
          const t = child.text.trim()
          if (t) staticText.push(t)
          continue
        }
        if (ts.isJsxElement(child) || ts.isJsxSelfClosingElement(child) || ts.isJsxFragment(child)) {
          children.push(convert(child))
          continue
        }
        if (ts.isJsxExpression(child)) {
          // {someVar}, {list.map(...)}, {cond && <X/>} — the rendered shape is
          // not knowable from source alone.
          childDynamic = true
          continue
        }
      }
      if (children.length === 0 && staticText.length > 0) text = staticText.join(' ')
    }

    return {
      tagName,
      // React's rule: capitalised or dotted names are components, the rest are
      // intrinsic elements.
      isComponent: /^[A-Z]/.test(tagName) || tagName.includes('.'),
      attributes,
      text,
      children,
      span: spanOf(node, classNameNode),
      dynamic: dynamic || childDynamic
    }
  }

  /** Collect only the outermost JSX; `convert` walks the rest. */
  const visit = (node: ts.Node): void => {
    if (ts.isFunctionDeclaration(node) && node.name && /^[A-Z]/.test(node.name.text)) {
      components.push(node.name.text)
    }
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && /^[A-Z]/.test(node.name.text)) {
      const init = node.initializer
      if (init && (ts.isArrowFunction(init) || ts.isFunctionExpression(init))) {
        components.push(node.name.text)
      }
    }

    if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node) || ts.isJsxFragment(node)) {
      roots.push(convert(node))
      return // children are handled by convert
    }
    ts.forEachChild(node, visit)
  }

  visit(sourceFile)

  const dynamicCount = countDynamic(roots)
  if (dynamicCount > 0) {
    warnings.push(
      `${dynamicCount} element(s) depend on runtime values; they are inspectable but not safe to rewrite`
    )
  }

  return { roots, components, warnings }
}

function countDynamic(elements: WebElement[]): number {
  let n = 0
  for (const el of elements) {
    if (el.dynamic) n++
    n += countDynamic(el.children)
  }
  return n
}
