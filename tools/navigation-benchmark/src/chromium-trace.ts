import { writeFile } from 'node:fs/promises'
import { gzipSync } from 'node:zlib'

import type { Page } from '@playwright/test'

const TRACE_CATEGORIES = [
  'devtools.timeline',
  'disabled-by-default-devtools.timeline',
  'blink.user_timing',
  'latencyInfo',
  'input',
  'toplevel',
  'cc',
  'gpu',
  'v8',
  'disabled-by-default-v8.cpu_profiler'
]

export interface ChromiumTraceCapture {
  stop: (path: string) => Promise<void>
}

export async function startChromiumTrace(page: Page): Promise<ChromiumTraceCapture> {
  const session = await page.context().newCDPSession(page)
  const chunks: string[] = []
  session.on('Tracing.dataCollected', ({ value }) => chunks.push(...value.map(JSON.stringify)))
  await session.send('Tracing.start', {
    categories: TRACE_CATEGORIES.join(','),
    transferMode: 'ReportEvents',
    options: 'sampling-frequency=10000'
  })

  return {
    async stop(path) {
      const complete = new Promise<void>((resolve) => {
        session.once('Tracing.tracingComplete', () => resolve())
      })
      await session.send('Tracing.end')
      await complete
      const trace = `{"traceEvents":[${chunks.join(',')}],"displayTimeUnit":"ms"}`
      await writeFile(path, gzipSync(trace))
      await session.detach()
    }
  }
}
