export type JSONPrimitive = null | boolean | number | string
export type JSONValue = JSONPrimitive | JSONValue[] | { [key: string]: JSONValue }

export interface HarnessTurnInput {
  sessionId: string
  prompt: string
}

export type HarnessRequest =
  | { id: string; method: 'session.create'; params: { sessionId: string } }
  | { id: string; method: 'session.turn'; params: HarnessTurnInput }
  | { id: string; method: 'session.stop'; params: { sessionId: string } }
  | { id: string; method: 'session.destroy'; params: { sessionId: string } }
  | { id: string; method: 'service.shutdown'; params?: Record<string, never> }

export type HarnessTurnEvent =
  | { type: 'text-delta'; text: string }
  | { type: 'reasoning-delta'; text: string }
  | { type: 'tool-call'; toolCallId: string; toolName: string; input: JSONValue }
  | { type: 'tool-result'; toolCallId: string; toolName: string; output: JSONValue }
  | { type: 'finish'; finishReason: string }
  | { type: 'error'; message: string }

export type HarnessSidecarMessage =
  | { type: 'response'; id: string; result?: JSONValue; error?: string }
  | { type: 'turn.event'; id: string; event: HarnessTurnEvent }

export const MAX_PROTOCOL_LINE_BYTES = 1024 * 1024
export const MAX_PROMPT_LENGTH = 256 * 1024

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function requireString(record: Record<string, unknown>, key: string): string {
  const value = record[key]
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`Expected non-empty string at ${key}`)
  }
  return value
}

function parseSessionParams(value: unknown): { sessionId: string } {
  if (!isRecord(value)) throw new Error('Expected request params')
  return { sessionId: requireString(value, 'sessionId') }
}

export function parseHarnessRequest(line: string): HarnessRequest {
  if (Buffer.byteLength(line, 'utf8') > MAX_PROTOCOL_LINE_BYTES) {
    throw new Error('Harness request exceeds the protocol size limit')
  }

  const parsed: unknown = JSON.parse(line)
  if (!isRecord(parsed)) throw new Error('Expected a request object')
  const id = requireString(parsed, 'id')
  const method = requireString(parsed, 'method')

  if (method === 'session.create' || method === 'session.stop' || method === 'session.destroy') {
    return { id, method, params: parseSessionParams(parsed.params) }
  }
  if (method === 'session.turn') {
    if (!isRecord(parsed.params)) throw new Error('Expected request params')
    const sessionId = requireString(parsed.params, 'sessionId')
    const prompt = requireString(parsed.params, 'prompt')
    if (prompt.length > MAX_PROMPT_LENGTH) throw new Error('Harness prompt exceeds the size limit')
    return { id, method, params: { sessionId, prompt } }
  }
  if (method === 'service.shutdown') return { id, method, params: {} }
  throw new Error(`Unknown harness method: ${method}`)
}
