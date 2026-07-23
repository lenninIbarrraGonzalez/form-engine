// Tests for the visibility store (Stage 5)
// RED first — visibility-store.ts does not exist yet
import { describe, it, expect, vi } from 'vitest'
import { createVisibilityStore } from './visibility-store'

describe('createVisibilityStore', () => {
  describe('getSnapshot', () => {
    it('returns an empty object as the initial snapshot', () => {
      const store = createVisibilityStore()
      const snapshot = store.getSnapshot()
      expect(snapshot).toEqual({})
    })

    it('returns the same reference when setVisibility has not been called', () => {
      const store = createVisibilityStore()
      const first = store.getSnapshot()
      const second = store.getSnapshot()
      expect(first).toBe(second)
    })

    it('returns a different reference after setVisibility is called', () => {
      const store = createVisibilityStore()
      const before = store.getSnapshot()
      store.setVisibility({ fieldA: true })
      const after = store.getSnapshot()
      expect(before).not.toBe(after)
    })

    it('returns the new map contents after setVisibility', () => {
      const store = createVisibilityStore()
      store.setVisibility({ fieldA: false, fieldB: true })
      const snapshot = store.getSnapshot()
      expect(snapshot).toEqual({ fieldA: false, fieldB: true })
    })
  })

  describe('subscribe and unsubscribe', () => {
    it('calls the subscriber when setVisibility is called', () => {
      const store = createVisibilityStore()
      const callback = vi.fn()
      store.subscribe(callback)
      store.setVisibility({ fieldA: true })
      expect(callback).toHaveBeenCalledTimes(1)
    })

    it('subscribe returns a function that unsubscribes the listener', () => {
      const store = createVisibilityStore()
      const callback = vi.fn()
      const unsubscribe = store.subscribe(callback)
      unsubscribe()
      store.setVisibility({ fieldA: false })
      expect(callback).not.toHaveBeenCalled()
    })

    it('notifies all active subscribers exactly once when setVisibility is called', () => {
      const store = createVisibilityStore()
      const callbackA = vi.fn()
      const callbackB = vi.fn()
      store.subscribe(callbackA)
      store.subscribe(callbackB)
      store.setVisibility({ fieldA: true })
      expect(callbackA).toHaveBeenCalledTimes(1)
      expect(callbackB).toHaveBeenCalledTimes(1)
    })

    it('does not notify unsubscribed listener when other subscribers remain', () => {
      const store = createVisibilityStore()
      const callbackA = vi.fn()
      const callbackB = vi.fn()
      store.subscribe(callbackA)
      const unsubscribeB = store.subscribe(callbackB)
      unsubscribeB()
      store.setVisibility({ fieldA: true })
      expect(callbackA).toHaveBeenCalledTimes(1)
      expect(callbackB).not.toHaveBeenCalled()
    })

    it('notifies subscriber every time setVisibility is called', () => {
      const store = createVisibilityStore()
      const callback = vi.fn()
      store.subscribe(callback)
      store.setVisibility({ fieldA: true })
      store.setVisibility({ fieldA: false })
      store.setVisibility({ fieldB: false })
      expect(callback).toHaveBeenCalledTimes(3)
    })
  })
})
