import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import type { UseFormWatch } from 'react-hook-form'
import { useVisibilitySync } from './useVisibilitySync'
import { buildDependencyGraph } from '../core/dependency-graph'
import { createVisibilityStore } from '../store/visibility-store'
import type { FormDefinition } from '../schema/types'

type WatchCb = (values: Record<string, unknown>, meta: { name?: string }) => void

// Minimal stand-in for RHF's watch: records callbacks and lets tests emit events.
function makeWatch() {
  const callbacks: WatchCb[] = []
  const watch = ((cb: WatchCb) => {
    callbacks.push(cb)
    return { unsubscribe: () => {} }
  }) as unknown as UseFormWatch<Record<string, unknown>>
  return {
    watch,
    emit: (values: Record<string, unknown>, meta: { name?: string }) =>
      callbacks.forEach((cb) => cb(values, meta)),
  }
}

const schema: FormDefinition = {
  title: 'T',
  fields: [
    { name: 'A', type: 'text', label: 'A' },
    { name: 'B', type: 'text', label: 'B', showIf: { field: 'A', operator: 'equals', value: 'show' } },
  ],
}

describe('useVisibilitySync', () => {
  it('recomputes visibility in the store when a watched field changes', () => {
    const graph = buildDependencyGraph(schema)
    const store = createVisibilityStore()
    store.setVisibility({ B: false })
    const { watch, emit } = makeWatch()

    renderHook(() => useVisibilitySync(watch, graph, store))

    emit({ A: 'show' }, { name: 'A' })
    expect(store.getSnapshot().B).toBe(true)

    emit({ A: 'hide' }, { name: 'A' })
    expect(store.getSnapshot().B).toBe(false)
  })

  it('ignores watch events that carry no changed field name', () => {
    const graph = buildDependencyGraph(schema)
    const store = createVisibilityStore()
    store.setVisibility({ B: false })
    const { watch, emit } = makeWatch()

    renderHook(() => useVisibilitySync(watch, graph, store))

    emit({ A: 'show' }, {})
    expect(store.getSnapshot().B).toBe(false)
  })
})
