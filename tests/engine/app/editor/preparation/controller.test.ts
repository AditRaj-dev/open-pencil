import { describe, expect, test } from 'bun:test'

import { createEditorPreparationController } from '@/app/editor/preparation/controller'
import { createInitialAppEditorState } from '@/app/editor/session/types'

describe('editor preparation controller', () => {
  test('keeps one reactive preparation snapshot until its owner finishes', () => {
    const state = createInitialAppEditorState('page')
    const controller = createEditorPreparationController(state)
    const load = controller.begin({ kind: 'document-open', subject: 'example.fig' })
    load.update({
      phase: 'resolving-fonts',
      detail: 'Geist Regular',
      completed: 2,
      total: 7,
      unit: 'fonts'
    })

    expect(state.preparation).toEqual({
      id: load.id,
      kind: 'document-open',
      phase: 'resolving-fonts',
      subject: 'example.fig',
      detail: 'Geist Regular',
      progress: { completed: 2, total: 7, unit: 'fonts' },
      startedAt: expect.any(Number)
    })

    load.finish()
    expect(state.preparation).toBeNull()
  })

  test('aborts and ignores an obsolete preparation handle', () => {
    const state = createInitialAppEditorState('page')
    const controller = createEditorPreparationController(state)
    const first = controller.begin({ kind: 'document-open' })
    const second = controller.begin({ kind: 'page-switch', phase: 'populating-page' })

    expect(first.signal.aborted).toBe(true)
    first.update({ phase: 'layout', detail: 'obsolete' })
    first.finish()
    expect(state.preparation?.id).toBe(second.id)
    second.finish()
    expect(state.preparation).toBeNull()
  })

  test('dispose aborts the active tab-local preparation', () => {
    const state = createInitialAppEditorState('page')
    const controller = createEditorPreparationController(state)
    const load = controller.begin({ kind: 'storage-open' })

    controller.dispose()

    expect(load.signal.aborted).toBe(true)
    expect(state.preparation).toBeNull()
  })
})
