import type {
  BackendEvent,
  BackendSession,
  HarnessBackend,
  HarnessResumeState
} from '#harness/backends/types'
import type { JSONValue } from '#harness/protocol'
import { createPi } from '@ai-sdk/harness-pi'
import type { PiAuthOptions } from '@ai-sdk/harness-pi'
import { HarnessAgent } from '@ai-sdk/harness/agent'
import type { HarnessAgentResumeSessionState, HarnessAgentSession } from '@ai-sdk/harness/agent'
import { createJustBashSandbox } from '@ai-sdk/sandbox-just-bash'
import type { TextStreamPart, ToolSet } from 'ai'

export type PiThinkingLevel = 'off' | 'minimal' | 'low' | 'medium' | 'high' | 'xhigh'

export interface PiHarnessBackendOptions {
  auth?: PiAuthOptions
  model?: string
  thinkingLevel?: PiThinkingLevel
  agentDir?: string
  mcpServers?: Record<string, unknown>
  instructions?: string
  permissionMode?: 'allow-all' | 'allow-reads' | 'allow-edits'
}

function asJSONValue(value: unknown): JSONValue {
  if (value === undefined) return null
  return structuredClone(value) as JSONValue
}

function mapPart(part: TextStreamPart<ToolSet>): BackendEvent | undefined {
  if (part.type === 'text-delta') return { type: 'text-delta', text: part.text }
  if (part.type === 'reasoning-delta') return { type: 'reasoning-delta', text: part.text }
  if (part.type === 'tool-call') {
    return {
      type: 'tool-call',
      toolCallId: part.toolCallId,
      toolName: part.toolName,
      input: asJSONValue(part.input)
    }
  }
  if (part.type === 'tool-result') {
    return {
      type: 'tool-result',
      toolCallId: part.toolCallId,
      toolName: part.toolName,
      output: asJSONValue(part.output)
    }
  }
  if (part.type === 'finish') return { type: 'finish', finishReason: part.finishReason }
  if (part.type === 'error') {
    return {
      type: 'error',
      message: part.error instanceof Error ? part.error.message : String(part.error)
    }
  }
  return undefined
}

class PiBackendSession implements BackendSession {
  readonly sessionId: string
  readonly isResume: boolean

  constructor(
    private readonly agent: HarnessAgent,
    private readonly session: HarnessAgentSession
  ) {
    this.sessionId = session.sessionId
    this.isResume = session.isResume
  }

  async *runTurn(prompt: string, signal?: AbortSignal): AsyncIterable<BackendEvent> {
    const result = await this.agent.stream({ session: this.session, prompt, abortSignal: signal })
    for await (const part of result.fullStream) {
      const event = mapPart(part)
      if (event) yield event
    }
  }

  async stop(): Promise<HarnessResumeState> {
    return (await this.session.stop()) as HarnessResumeState
  }

  async destroy(): Promise<void> {
    await this.session.destroy()
  }
}

export class PiHarnessBackend implements HarnessBackend {
  readonly id = 'pi'
  private readonly agent: HarnessAgent

  constructor(options: PiHarnessBackendOptions = {}) {
    const harness = createPi({
      ...(options.auth === undefined ? {} : { auth: options.auth }),
      ...(options.model === undefined ? {} : { model: options.model }),
      ...(options.thinkingLevel === undefined ? {} : { thinkingLevel: options.thinkingLevel }),
      ...(options.agentDir === undefined ? {} : { agentDir: options.agentDir }),
      ...(options.mcpServers === undefined ? {} : { mcpServers: options.mcpServers })
    })
    this.agent = new HarnessAgent({
      harness,
      sandbox: createJustBashSandbox({ cwd: '/workspace' }),
      sandboxConfig: { workDir: 'workspace' },
      ...(options.instructions === undefined ? {} : { instructions: options.instructions }),
      ...(options.permissionMode === undefined ? {} : { permissionMode: options.permissionMode })
    })
  }

  async createSession(options: {
    sessionId: string
    resumeState?: HarnessResumeState
    signal?: AbortSignal
  }): Promise<BackendSession> {
    const session = await this.agent.createSession({
      sessionId: options.sessionId,
      ...(options.resumeState === undefined
        ? {}
        : { resumeFrom: options.resumeState as HarnessAgentResumeSessionState }),
      ...(options.signal === undefined ? {} : { abortSignal: options.signal })
    })
    return new PiBackendSession(this.agent, session)
  }
}
