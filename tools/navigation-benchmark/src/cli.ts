import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import { chromium } from '@playwright/test'

import { startChromiumTrace } from './chromium-trace'
import { compareNavigationMetrics } from './compare'
import { computeNavigationMetrics } from './metrics'
import { readRecording } from './recording'
import { replay, type ReplayMode } from './replay'
import { setupScenario, type NavigationScenario } from './scenario'
import type { NavigationMetrics, NavigationRecordingFile } from './types'

function argument(name: string, fallback?: string): string {
  const index = process.argv.indexOf(name)
  const value = index === -1 ? fallback : process.argv[index + 1]
  if (!value) throw new Error(`Missing ${name}`)
  return value
}

const command = process.argv[2]
if (command === 'compare') {
  const baseline = JSON.parse(await readFile(argument('--baseline'), 'utf8')) as NavigationMetrics
  const candidate = JSON.parse(await readFile(argument('--candidate'), 'utf8')) as NavigationMetrics
  const comparison = compareNavigationMetrics(baseline, candidate)
  const comparisonOutput = process.argv.includes('--output') ? argument('--output') : null
  if (comparisonOutput) await writeFile(comparisonOutput, JSON.stringify(comparison, null, 2))
  console.log(JSON.stringify(comparison, null, 2))
  process.exit(0)
}
if (command !== 'run') {
  console.log(
    'Usage: bun tools/navigation-benchmark/src/cli.ts run --url URL --gesture FILE [--mode cdp|dom] [--scenario light|large-flat|raster-stress|current-document] [--no-trace] [--cpu-profile] [--software-gpu] [--output DIR]\n       bun tools/navigation-benchmark/src/cli.ts compare --baseline METRICS --candidate METRICS [--output FILE]'
  )
  process.exit(command ? 1 : 0)
}

const url = argument('--url')
const gesturePath = argument('--gesture')
const mode = argument('--mode', 'cdp') as ReplayMode
const scenario = argument('--scenario', 'light') as NavigationScenario
const traceEnabled = !process.argv.includes('--no-trace')
const cpuProfile = process.argv.includes('--cpu-profile')
const softwareGpu = process.argv.includes('--software-gpu')
const output = resolve(argument('--output', 'artifacts/navigation-benchmark'))
if (mode !== 'cdp' && mode !== 'dom') throw new Error(`Unsupported replay mode: ${mode}`)
if (!['light', 'large-flat', 'raster-stress', 'current-document'].includes(scenario)) {
  throw new Error(`Unsupported scenario: ${scenario}`)
}

await mkdir(output, { recursive: true })
const input = await readRecording(gesturePath)
function hardwareGpuArgs(): string[] {
  const base = ['--ignore-gpu-blocklist', '--enable-gpu']
  return process.platform === 'darwin' ? [...base, '--use-angle=metal'] : base
}

const browser = await chromium.launch({
  headless: true,
  args: softwareGpu ? ['--enable-unsafe-swiftshader'] : hardwareGpuArgs()
})
const context = await browser.newContext({
  viewport: { width: 1280, height: 800 },
  deviceScaleFactor: 2
})
const page = await context.newPage()

try {
  await page.goto(
    `${url}${url.includes('?') ? '&' : '?'}test&no-chrome&no-rulers&navigation-benchmark`
  )
  const glInfo = await page.evaluate(() => {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl2')
    if (!gl) return { renderer: 'unavailable', vendor: 'unavailable' }
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
    return {
      renderer: String(
        gl.getParameter(debugInfo?.UNMASKED_RENDERER_WEBGL ?? gl.RENDERER) ?? 'unknown'
      ),
      vendor: String(gl.getParameter(debugInfo?.UNMASKED_VENDOR_WEBGL ?? gl.VENDOR) ?? 'unknown')
    }
  })
  if (!softwareGpu && /SwiftShader/i.test(glInfo.renderer)) {
    throw new Error(`Hardware GPU benchmark requested but Chromium uses ${glInfo.renderer}`)
  }
  await page.locator('[data-test-id="canvas-element"][data-ready="1"]').waitFor({ timeout: 30_000 })
  await setupScenario(page, scenario)
  await page.waitForTimeout(750)
  await page.evaluate((viewport) => {
    const store = window.openPencil?.getStore?.()
    if (!store) throw new Error('OpenPencil store not available')
    store.state.panX = viewport.panX
    store.state.panY = viewport.panY
    store.state.zoom = viewport.zoom
    store.requestRepaint()
  }, input.initialViewport)
  await page.waitForTimeout(500)
  await page.evaluate(
    (name) => window.openPencil?.test?.navigation?.startRecording(name),
    input.name
  )

  const trace = traceEnabled ? await startChromiumTrace(page, { cpuProfile }) : null
  await replay(page, input, mode)
  await page.waitForTimeout(750)
  await trace?.stop(resolve(output, 'trace.json.gz'))

  const recording = await page.evaluate(
    () => window.openPencil?.test?.navigation?.stopRecording() as NavigationRecordingFile
  )
  const metrics = computeNavigationMetrics(recording)
  const environment = {
    url,
    mode,
    scenario,
    traceEnabled,
    cpuProfile,
    softwareGpu,
    glInfo,
    gesturePath: resolve(gesturePath),
    browserVersion: await browser.version(),
    platform: process.platform,
    arch: process.arch,
    bunVersion: Bun.version,
    recordedAt: new Date().toISOString()
  }
  await Promise.all([
    writeFile(resolve(output, 'recording.json'), JSON.stringify(recording, null, 2)),
    writeFile(resolve(output, 'metrics.json'), JSON.stringify(metrics, null, 2)),
    writeFile(resolve(output, 'environment.json'), JSON.stringify(environment, null, 2))
  ])
  console.log(JSON.stringify(metrics, null, 2))
} finally {
  await context.close()
  await browser.close()
}
