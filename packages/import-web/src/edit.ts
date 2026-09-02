import type { WebSourcePayload } from '@open-pencil/scene-graph'

/** A byte-range replacement in one file. */
export interface SourceEdit {
  filePath: string
  start: number
  end: number
  text: string
  /** Human-readable reason, for history and diffs. */
  label: string
}

export class WriteBackError extends Error {}

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
  assertWritable(web)

  if (web.classNameRange) {
    return {
      filePath: web.filePath,
      start: web.classNameRange.start,
      end: web.classNameRange.end,
      text: classes,
      label: `set class on <${web.tagName}>`
    }
  }

  const attr = web.filePath.match(/\.[jt]sx$/) ? 'className' : 'class'
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
export function editText(web: WebSourcePayload, text: string, closingTagStart: number): SourceEdit {
  assertWritable(web)

  if (closingTagStart <= web.tagEnd) {
    throw new WriteBackError(
      `<${web.tagName}> has no separate closing tag; cannot replace its text`
    )
  }

  return {
    filePath: web.filePath,
    start: web.tagEnd,
    end: closingTagStart,
    text,
    label: `set text of <${web.tagName}>`
  }
}

function assertWritable(web: WebSourcePayload): void {
  if (web.dynamic) {
    throw new WriteBackError(
      `<${web.tagName}> at ${web.filePath}:${web.startLine} depends on runtime values; ` +
        `rewriting it from source alone would change behaviour`
    )
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

  for (let i = 0; i < ordered.length - 1; i++) {
    const later = ordered[i]!
    const earlier = ordered[i + 1]!
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
    out = out.slice(0, edit.start) + edit.text + out.slice(edit.end)
  }
  return out
}
