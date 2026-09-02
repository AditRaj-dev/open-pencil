import { parseHtml } from './html'
import { parseJsx } from './jsx'
import type { ParseResult } from './types'

/**
 * Pick the parser from the file extension.
 *
 * Lives apart from the barrel so `write.ts` can verify its output without
 * importing the package's own entry point back into itself.
 */
export function parseWebSource(source: string, filePath: string): ParseResult {
  if (/\.html?$/i.test(filePath)) return parseHtml(source, filePath)
  if (/\.[jt]sx?$/i.test(filePath)) return parseJsx(source, filePath)
  throw new Error(`no parser for ${filePath}; expected .html, .jsx, .tsx, .js or .ts`)
}
