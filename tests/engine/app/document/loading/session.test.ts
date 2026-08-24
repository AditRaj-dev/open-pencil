import { describe, expect, test } from 'bun:test'

import { beginDocumentLoad, type DocumentLoadingState } from '@/app/document/loading/session'

function state(): DocumentLoadingState {
  return { loading: false, documentLoadProgress: null }
}

describe('document loading sessions', () => {
  test('keeps the active load visible until its owner finishes', () => {
    const target = state()
    const load = beginDocumentLoad(target)
    load.update({ phase: 'resolving-fonts', detail: 'Geist Regular', completed: 2, total: 7 })

    expect(target).toEqual({
      loading: true,
      documentLoadProgress: {
        phase: 'resolving-fonts',
        detail: 'Geist Regular',
        completed: 2,
        total: 7
      }
    })

    load.finish()
    expect(target).toEqual({ loading: false, documentLoadProgress: null })
  })

  test('ignores obsolete load progress and completion', () => {
    const target = state()
    const first = beginDocumentLoad(target, 'reading')
    const second = beginDocumentLoad(target, 'decoding')

    first.update({ phase: 'layout', detail: 'obsolete' })
    first.finish()

    expect(target.loading).toBe(true)
    expect(target.documentLoadProgress?.phase).toBe('decoding')
    second.finish()
    expect(target.loading).toBe(false)
  })
})
