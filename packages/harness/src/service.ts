import type { BackendEvent, BackendSession, HarnessBackend } from './backends/types'
import type { HarnessSessionConfiguration } from './protocol'
import type { ResumeStateStore } from './session-store'

export class HarnessSessionService {
  private readonly sessions = new Map<string, BackendSession>()

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
    yield* session.runTurn(prompt, signal)
  }

  async stopSession(sessionId: string): Promise<void> {
    const session = this.requireSession(sessionId)
    try {
      const state = await session.stop()
      await this.store.save(sessionId, state)
    } finally {
      this.sessions.delete(sessionId)
    }
  }

  async destroySession(sessionId: string): Promise<void> {
    const session = this.requireSession(sessionId)
    try {
      await session.destroy()
      await this.store.remove(sessionId)
    } finally {
      this.sessions.delete(sessionId)
    }
  }

  async shutdown(): Promise<void> {
    const sessions = [...this.sessions.entries()]
    this.sessions.clear()
    await Promise.allSettled(
      sessions.map(async ([sessionId, session]) => {
        const state = await session.stop()
        await this.store.save(sessionId, state)
      })
    )
  }

  private requireSession(sessionId: string): BackendSession {
    const session = this.sessions.get(sessionId)
    if (!session) throw new Error(`Harness session is not active: ${sessionId}`)
    return session
  }
}
