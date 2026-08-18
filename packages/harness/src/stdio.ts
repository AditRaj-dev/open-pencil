#!/usr/bin/env node

import { homedir } from 'node:os'
import { join } from 'node:path'
import { createInterface } from 'node:readline'

import { PiHarnessBackend } from '#harness/backends/pi'
import type { HarnessSidecarMessage } from '#harness/protocol'
import { parseHarnessRequest } from '#harness/protocol'
import { HarnessSessionService } from '#harness/service'
import { FileResumeStateStore } from '#harness/session-store'

const stateRoot =
  process.env.OPENPENCIL_HARNESS_STATE_DIR ?? join(homedir(), '.open-pencil', 'harness-sessions')
const service = new HarnessSessionService(
  new PiHarnessBackend({
    ...(process.env.OPENPENCIL_HARNESS_MODEL
      ? { model: process.env.OPENPENCIL_HARNESS_MODEL }
      : {}),
    ...(process.env.OPENPENCIL_HARNESS_AGENT_DIR
      ? { agentDir: process.env.OPENPENCIL_HARNESS_AGENT_DIR }
      : {}),
    permissionMode: 'allow-edits'
  }),
  new FileResumeStateStore(stateRoot)
)

function emit(message: HarnessSidecarMessage): void {
  process.stdout.write(`${JSON.stringify(message)}\n`)
}

function messageFor(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

async function dispatch(line: string): Promise<boolean> {
  let requestId = 'unknown'
  try {
    const request = parseHarnessRequest(line)
    requestId = request.id
    if (request.method === 'session.create') {
      const result = await service.createSession(request.params.sessionId)
      emit({
        type: 'response',
        id: request.id,
        result: { isResume: result.isResume }
      })
      return true
    }
    if (request.method === 'session.turn') {
      for await (const event of service.runTurn(request.params.sessionId, request.params.prompt)) {
        emit({ type: 'turn.event', id: request.id, event })
      }
      emit({ type: 'response', id: request.id, result: { completed: true } })
      return true
    }
    if (request.method === 'session.stop') {
      await service.stopSession(request.params.sessionId)
      emit({ type: 'response', id: request.id, result: { stopped: true } })
      return true
    }
    if (request.method === 'session.destroy') {
      await service.destroySession(request.params.sessionId)
      emit({ type: 'response', id: request.id, result: { destroyed: true } })
      return true
    }
    await service.shutdown()
    emit({ type: 'response', id: request.id, result: { shutdown: true } })
    return false
  } catch (error) {
    emit({ type: 'response', id: requestId, error: messageFor(error) })
    return true
  }
}

const input = createInterface({ input: process.stdin, crlfDelay: Infinity })
let queue = Promise.resolve(true)
input.on('line', (line) => {
  queue = queue.then(async (keepRunning) => {
    if (!keepRunning) return false
    const next = await dispatch(line)
    if (!next) input.close()
    return next
  })
})
input.on('close', () => {
  void queue.finally(() => process.exit(0))
})
process.on('SIGTERM', () => input.close())
process.on('SIGINT', () => input.close())
