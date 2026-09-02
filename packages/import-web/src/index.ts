export { parseJsx } from './jsx'
export { parseHtml } from './html'
export { toSceneNodes, type SceneImport } from './to-scene'
export {
  editClassName,
  editText,
  applyEdits,
  WriteBackError,
  type SourceEdit
} from './edit'
export type { WebElement, WebSpan, ParseResult, ImportOptions } from './types'

import { parseHtml } from './html'
import { parseJsx } from './jsx'
import type { ParseResult } from './types'

/** Pick the parser from the file extension. */
export function parseWebSource(source: string, filePath: string): ParseResult {
  if (/\.html?$/i.test(filePath)) return parseHtml(source, filePath)
  if (/\.[jt]sx?$/i.test(filePath)) return parseJsx(source, filePath)
  throw new Error(`no parser for ${filePath}; expected .html, .jsx, .tsx, .js or .ts`)
}
