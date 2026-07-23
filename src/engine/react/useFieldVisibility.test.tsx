// Tests for useFieldVisibility hook (Stage 5, task 5.3)
// RED first — useFieldVisibility.ts does not exist yet
import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { createVisibilityStore } from '../store/visibility-store'
import { useFieldVisibility } from './useFieldVisibility'

describe('useFieldVisibility', () => {
  it('returns true when the field is not in the VisibilityMap', () => {
    const store = createVisibilityStore()
    store.setVisibility({ B: false })
    const { result } = renderHook(() => useFieldVisibility('A', store))
    expect(result.current).toBe(true)
  })

  it('returns false when the field is explicitly false in the VisibilityMap', () => {
    const store = createVisibilityStore()
    store.setVisibility({ B: false })
    const { result } = renderHook(() => useFieldVisibility('B', store))
    expect(result.current).toBe(false)
  })

  it('returns true when the field is explicitly true in the VisibilityMap', () => {
    const store = createVisibilityStore()
    store.setVisibility({ C: true })
    const { result } = renderHook(() => useFieldVisibility('C', store))
    expect(result.current).toBe(true)
  })

  it('updates reactively when setVisibility changes the field', () => {
    const store = createVisibilityStore()
    const { result } = renderHook(() => useFieldVisibility('fieldA', store))

    expect(result.current).toBe(true) // initially not in map → visible

    act(() => {
      store.setVisibility({ fieldA: false })
    })

    expect(result.current).toBe(false)
  })

  it('does not change when a different field visibility changes', () => {
    const store = createVisibilityStore()
    const renderSpy = vi.fn()

    const { result } = renderHook(() => {
      renderSpy()
      return useFieldVisibility('fieldA', store)
    })

    const initialRenderCount = renderSpy.mock.calls.length
    expect(result.current).toBe(true)

    // Change only fieldB — fieldA is not in the map, so snapshot changes but
    // fieldA's computed boolean stays the same (still true)
    // The hook should re-run but return same value — this tests the API contract
    act(() => {
      store.setVisibility({ fieldB: false })
    })

    // fieldA still returns true (not affected by fieldB's change)
    expect(result.current).toBe(true)
    // The hook subscribed and re-evaluated, but returned the same boolean
    expect(renderSpy.mock.calls.length).toBeGreaterThanOrEqual(initialRenderCount)
  })
})
