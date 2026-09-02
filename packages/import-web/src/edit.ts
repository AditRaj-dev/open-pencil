import type { WebSourcePayload } from '@open-pencil/scene-graph'

/** A byte-range replacement in one file. */
export interface SourceEdit {
  filePath: string
  start: number
  end: number
  text: string
  /** Human-readable reason, for history and diffs. */
  label: string
  /**
   * Text expected to be present at `start` when the edit is applied.
   *
   * Offsets are only valid for the file as it was parsed. Any earlier write
   * shifts everything after it, so an edit built from a stale parse points at
   * the wrong place — and a splice there silently corrupts the file. Checking
   * this anchor first turns that into a refusal.
   */
  anchor?: string
}

export class WriteBackError extends Error {
  // Named explicitly so it survives minification and reads correctly in logs.
  override readonly name = 'WriteBackError'
}

/**
 * Rewrite an element's class list.
 *
 * Two cases, and the difference matters. When a literal class attribute exists
 * we replace just its value, so formatting, ordering of other attributes and
 * the rest of the tag survive untouched. When there is none we insert one right
 * after the tag name, which is the only place guaranteed to be inside the
 * opening tag regardless of how the attributes are laid out.
 */
export function editClassName(web: WebSourcePayload, classes: string): SourceEdit {
  // Only a spread or computed prop can defeat an attribute rewrite. An element
  // whose CHILDREN are dynamic — a list row rendering `{item}` — is still
  // perfectly safe to restyle, and that is the common case.
  if (web.propsDynamic) {
    throw new WriteBackError(
      `<${web.tagName}> at ${web.filePath}:${web.startLine} has a spread or computed prop; ` +
        `rewriting its class could be overridden at run time`
    )
  }

  if (web.classNameRange) {
    return {
      filePath: web.filePath,
      start: web.classNameRange.start,
      end: web.classNameRange.end,
      text: classes,
      // The class value we parsed must still be sitting here.
      anchor: web.className ?? undefined,
      label: `set class on <${web.tagName}>`
    }
  }

  const attr = /\.[jt]sx$/.test(web.filePath) ? 'className' : 'class'
  const insertAt = web.start + 1 + web.tagName.length
  return {
    filePath: web.filePath,
    start: insertAt,
    end: insertAt,
    text: ` ${attr}="${classes}"`,
    label: `add ${attr} to <${web.tagName}>`
  }
}

/**
 * Replace an element's text content.
 *
 * Only valid for an element whose children are a single static text run — the
 * parser records that as `text`. Anything else and the range between the tags
 * contains markup or expressions we would be destroying.
 */
export function editText(web: WebSourcePayload, text: string): SourceEdit {
  if (web.childrenDynamic) {
    throw new WriteBackError(
      `<${web.tagName}> at ${web.filePath}:${web.startLine} renders expression children; ` +
        `replacing its text would delete code`
    )
  }

  if (web.closingTagStart === null) {
    throw new WriteBackError(
      `<${web.tagName}> is self-closing or void; it has no text to replace`
    )
  }
  if (web.closingTagStart <= web.tagEnd) {
    throw new WriteBackError(`<${web.tagName}> has a malformed tag range; refusing to edit`)
  }

  return {
    filePath: web.filePath,
    start: web.tagEnd,
    end: web.closingTagStart,
    text,
    label: `set text of <${web.tagName}>`
  }
}

/**
 * Apply edits to a file's text.
 *
 * Applied last-first so each splice leaves earlier offsets valid — patching
 * forward would invalidate every subsequent range by the length delta. Throws
 * on overlapping edits rather than silently producing scrambled output.
 */
export function applyEdits(source: string, edits: readonly SourceEdit[]): string {
  if (edits.length === 0) return source

  const ordered = [...edits].sort((a, b) => b.start - a.start || b.end - a.end)

  // Compare each edit with the one that follows it in descending order; the
  // final entry has no successor, hence the length - 1 bound.
  for (let i = 0; i < ordered.length - 1; i += 1) {
    const later = ordered[i]
    const earlier = ordered[i + 1]
    if (earlier.end > later.start) {
      throw new WriteBackError(
        `overlapping edits: "${earlier.label}" [${earlier.start},${earlier.end}) ` +
          `overlaps "${later.label}" [${later.start},${later.end})`
      )
    }
  }

  let out = source
  for (const edit of ordered) {
    if (edit.start < 0 || edit.end > out.length || edit.start > edit.end) {
      throw new WriteBackError(
        `edit "${edit.label}" range [${edit.start},${edit.end}) is outside the file`
      )
    }
    if (edit.anchor !== undefined && !out.startsWith(edit.anchor, edit.start)) {
      throw new WriteBackError(
        `edit "${edit.label}" expected ${JSON.stringify(edit.anchor)} at ${edit.start} but found ` +
          `${JSON.stringify(out.slice(edit.start, edit.start + edit.anchor.length))}; ` +
          `the file changed since it was parsed — re-parse before editing`
      )
    }
    out = out.slice(0, edit.start) + edit.text + out.slice(edit.end)
  }
  return out
}
