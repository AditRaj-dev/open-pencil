import { describe, expect, test } from 'bun:test'

import { MAX_PROMPT_LENGTH, parseHarnessRequest } from '../src/protocol'

describe('harness sidecar protocol', () => {
  test('parses a turn request', () => {
    expect(
      parseHarnessRequest(
        JSON.stringify({
          id: 'request-1',
          method: 'session.turn',
          params: { sessionId: 'session-1', prompt: 'Inspect the document' }
        })
      )
    ).toEqual({
      id: 'request-1',
      method: 'session.turn',
      params: { sessionId: 'session-1', prompt: 'Inspect the document' }
    })
  })

  test('rejects unknown methods and oversized prompts', () => {
    expect(() =>
      parseHarnessRequest(JSON.stringify({ id: 'request-1', method: 'unknown' }))
    ).toThrow('Unknown harness method')
    expect(() =>
      parseHarnessRequest(
        JSON.stringify({
          id: 'request-1',
          method: 'session.turn',
          params: { sessionId: 'session-1', prompt: 'x'.repeat(MAX_PROMPT_LENGTH + 1) }
        })
      )
    ).toThrow('prompt exceeds')
  })
})
