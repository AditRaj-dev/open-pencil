import type { BackendEvent, BackendSession, HarnessBackend } from './backends/types'
import type { HarnessSessionConfiguration } from './protocol'
import type { ResumeStateStore } from './session-store'

export class HarnessSessionService {
  private readonly sessions = new Map<string, BackendSession>()
  private readonly turns = new Map<string, AbortController>()

  constructor(
    private readonly backend: HarnessBackend,
    private readonly store: ResumeStateStore
  ) {}

  async createSession(
    sessionId: string,
    configuration?: HarnessSessionConfiguration,
    signal?: AbortSignal
  ): Promise<{ isResume: boolean }> {
    if (this.sessions.has(sessionId))
      throw new Error(`Harness session already active: ${sessionId}`)
    const resumeState = await this.store.load(sessionId)
    if (resumeState && resumeState.harnessId !== this.backend.id) {
      throw new Error(`Harness state belongs to ${resumeState.harnessId}, not ${this.backend.id}`)
    }
    const session = await this.backend.createSession({
      sessionId,
      resumeState,
      configuration,
      signal
    })
    this.sessions.set(sessionId, session)
    return { isResume: session.isResume }
  }

  async *runTurn(
    sessionId: string,
    prompt: string,
    signal?: AbortSignal
  ): AsyncIterable<BackendEvent> {
    const session = this.requireSession(sessionId)
    const controller = new AbortController()
    this.turns.set(sessionId, controller)
    signal?.addEventListener('abort', () => controller.abort(), { once: true })
    try {
      yield* session.runTurn(prompt, controller.signal)
    } finally {
      this.turns.delete(sessionId)
    }
  }

  cancelTurn(sessionId: string): void {
    this.requireSession(sessionId)
    this.turns.get(sessionId)?.abort()
  }

  async stopSession(sessionId: string): Promise<void> {
    const session = this.requireSession(sessionId)
    const state = await session.stop()
    await this.store.save(sessionId, state)
    this.sessions.delete(sessionId)
  }

  async destroySession(sessionId: string): Promise<void> {
    const session = this.requireSession(sessionId)
    await session.destroy()
    await this.store.remove(sessionId)
    this.sessions.delete(sessionId)
  }

  async shutdown(): Promise<void> {
    const sessions = [...this.sessions.entries()]
    const results = await Promise.allSettled(
      sessions.map(async ([sessionId, session]) => {
        const state = await session.stop()
        await this.store.save(sessionId, state)
        this.sessions.delete(sessionId)
      })
    )
    const errors = results
      .filter((result) => result.status === 'rejected')
      .map((result) => result.reason)
    if (errors.length) throw new AggregateError(errors, 'Harness shutdown failed')
  }

  private requireSession(sessionId: string): BackendSession {
    const session = this.sessions.get(sessionId)
    if (!session) throw new Error(`Harness session is not active: ${sessionId}`)
    return session
  }
}
