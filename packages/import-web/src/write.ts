import { applyEdits, WriteBackError, type SourceEdit } from './edit'
import { parseWebSource } from './parse'

/** File IO, injected so this is testable and so the host owns the actual disk. */
export interface FileIO {
  read(filePath: string): Promise<string>
  write(filePath: string, contents: string): Promise<void>
}

export interface WriteOptions {
  /**
   * Re-parse the result and refuse the write if it no longer parses, or if the
   * element count changed. Defaults to true, and should stay on: an edit is
   * driven by offsets, and offsets are exactly the thing that goes wrong.
   */
  verify?: boolean
}

export interface WriteResult {
  filePath: string
  before: string
  after: string
  edits: SourceEdit[]
}

/**
 * Apply edits to files on disk, one transaction per file.
 *
 * Read, splice, verify, write. The verification is the point: a wrong offset
 * silently produces a file that still looks plausible but no longer parses, or
 * that quietly lost an element. Catching that before the write means the worst
 * case is a refused edit rather than a corrupted component.
 *
 * Rolls back every file it already wrote if a later one fails, so a
 * multi-file edit does not leave the project half-changed.
 */
export async function writeEdits(
  edits: readonly SourceEdit[],
  io: FileIO,
  options: WriteOptions = {}
): Promise<WriteResult[]> {
  const verify = options.verify ?? true
  if (edits.length === 0) return []

  const byFile = new Map<string, SourceEdit[]>()
  for (const edit of edits) {
    const list = byFile.get(edit.filePath)
    if (list) list.push(edit)
    else byFile.set(edit.filePath, [edit])
  }

  const results: WriteResult[] = []
  const written: WriteResult[] = []

  try {
    for (const [filePath, fileEdits] of byFile) {
      const before = await io.read(filePath)
      const after = applyEdits(before, fileEdits)

      if (after === before) continue // nothing to do; do not touch mtime

      if (verify) assertStillSound(filePath, before, after)

      await io.write(filePath, after)
      const result = { filePath, before, after, edits: fileEdits }
      results.push(result)
      written.push(result)
    }
  } catch (error) {
    // Put back everything already written, so a failure midway leaves the tree
    // as it was rather than partially edited.
    for (const done of written.reverse()) {
      try {
        await io.write(done.filePath, done.before)
      } catch {
        throw new WriteBackError(
          `${String(error)} — and rollback of ${done.filePath} also failed; ` +
            `that file may be left modified`
        )
      }
    }
    throw error
  }

  return results
}

/**
 * A rewritten file must still parse, and must still contain the same number of
 * elements. Those two checks catch the realistic failure: an offset landing
 * mid-token, which either breaks the syntax or swallows a tag.
 */
function assertStillSound(filePath: string, before: string, after: string): void {
  let parsedAfter
  try {
    parsedAfter = parseWebSource(after, filePath)
  } catch (error) {
    throw new WriteBackError(`edit made ${filePath} unparseable: ${String(error)}`)
  }

  const fatal = parsedAfter.warnings.filter((w) => w.startsWith('parse error'))
  if (fatal.length > 0) {
    throw new WriteBackError(`edit made ${filePath} unparseable: ${fatal[0]}`)
  }

  const beforeCount = countElements(parseWebSource(before, filePath).roots)
  const afterCount = countElements(parsedAfter.roots)
  if (beforeCount !== afterCount) {
    throw new WriteBackError(
      `edit changed the element count of ${filePath} from ${beforeCount} to ${afterCount}; ` +
        `an offset was almost certainly wrong`
    )
  }
}

function countElements(elements: readonly { children: readonly unknown[] }[]): number {
  let n = 0
  for (const el of elements) {
    n += 1 + countElements(el.children as readonly { children: readonly unknown[] }[])
  }
  return n
}
