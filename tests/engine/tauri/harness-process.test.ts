import { describe, expect, test, vi } from 'bun:test'

import type { HarnessSidecarMessage } from '@open-pencil/harness'

import { spawnHarnessProcess } from '@/app/ai/harness/process'

const writes: number[][] = []
let stdoutHandler: ((value?: unknown) => void) | undefined
const sidecar = vi.fn(() => {
  const handlers = new Map<string, (value?: unknown) => void>()
  return {
    stdout: {
      on: (event: string, handler: (value?: unknown) => void) => {
        handlers.set(`out:${event}`, handler)
        if (event === 'data') stdoutHandler = handler
      }
    },
    stderr: {
      on: (event: string, handler: (value?: unknown) => void) =>
        handlers.set(`err:${event}`, handler)
    },
    on: (event: string, handler: (value?: unknown) => void) => handlers.set(event, handler),
    async spawn() {
      return {
        async write(data: number[]) {
          writes.push(data)
        },
        async kill() {
          return undefined
        }
      }
    }
  }
})

vi.mock('@tauri-apps/plugin-shell', () => ({ Command: { sidecar } }))

describe('Harness sidecar process', () => {
  test('spawns the bundled sidecar and keeps credentials in process environment', async () => {
    writes.length = 0
    const process = await spawnHarnessProcess({
      environment: { OPENPENCIL_HARNESS_API_KEY: 'secret' },
      onUnexpectedClose: () => undefined
    })
    await process.send({ id: 'one', method: 'service.shutdown' })

    expect(sidecar).toHaveBeenCalledWith('binaries/openpencil-harness', [], {
      encoding: 'raw',
      env: { OPENPENCIL_HARNESS_API_KEY: 'secret' }
    })
    expect(new TextDecoder().decode(new Uint8Array(writes[0]))).not.toContain('secret')

    const reader = process.messages.getReader()
    const encoded = new TextEncoder().encode(
      '\n' + JSON.stringify({ type: 'response', id: 'one', result: { ok: true } }) + '\n'
    )
    stdoutHandler?.(encoded.slice(0, 12))
    stdoutHandler?.(encoded.slice(12))
    expect((await reader.read()).value).toEqual({
      type: 'response',
      id: 'one',
      result: { ok: true }
    })
  })
})

const messageTypeCheck: HarnessSidecarMessage['type'] = 'response'
void messageTypeCheck
