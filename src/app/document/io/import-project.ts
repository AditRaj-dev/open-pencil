import { toast } from '@/app/shell/ui'

/**
 * Import a code project through the dev-server endpoint.
 *
 * The browser cannot read a directory, so the scan and transpile happen on the
 * server and only the composed markup crosses back. Dev only: the endpoint is
 * not present in a build.
 */
export interface ImportProjectResult {
  framework: string
  screens: Array<{ route: string; x: number; y: number }>
  connectors: Array<{ from: string; to: string }>
  warnings: string[]
  state: string
}

export async function importProjectFromDisk(options: {
  dir: string
  css?: string
  state?: string
  importDOMText: (html: string, options?: { documentName?: string }) => Promise<unknown>
}): Promise<ImportProjectResult | null> {
  const { dir, css, state = 'default', importDOMText } = options

  let payload: { ok: boolean; result?: ImportProjectResult & { html: string }; error?: string }
  try {
    const res = await fetch('/__op/import-project', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ dir, css, state })
    })
    payload = await res.json()
  } catch (error) {
    toast.error(
      `Could not reach the import service. It only runs in dev. (${
        error instanceof Error ? error.message : String(error)
      })`
    )
    return null
  }

  if (!payload.ok || !payload.result) {
    toast.error(payload.error ?? 'Import failed')
    return null
  }

  const { html, ...summary } = payload.result
  const name = dir.split(/[\/]/).filter(Boolean).pop() ?? 'project'
  await importDOMText(html, { documentName: `${name}${state === 'default' ? '' : ` (${state})`}` })

  for (const warning of summary.warnings.slice(0, 3)) toast.warning(warning)
  toast.info(
    `Imported ${summary.screens.length} screen(s) and ${summary.connectors.length} connector(s)`
  )
  return summary
}
