// Framework-agnostic visibility store.
// Implements the useSyncExternalStore contract (subscribe / getSnapshot / setVisibility).
// No React imports — this file is pure TypeScript and must stay React-free.
import type { VisibilityMap } from '../core/condition-evaluator'

// ---- Public interface -------------------------------------------------

export interface VisibilityStore {
  /** Register a listener. Returns an unsubscribe function. */
  subscribe(callback: () => void): () => void
  /**
   * Returns the current VisibilityMap.
   * Referentially stable between writes — same object reference if setVisibility
   * has not been called since the last getSnapshot().
   */
  getSnapshot(): VisibilityMap
  /**
   * Replace the stored map and notify all active subscribers.
   * Always produces a new object reference so React detects the change.
   */
  setVisibility(next: VisibilityMap): void
}

// ---- Factory ----------------------------------------------------------

/**
 * Creates a fresh, isolated VisibilityStore instance.
 * Each FormEngine instance should create its own store.
 */
export function createVisibilityStore(): VisibilityStore {
  let snapshot: VisibilityMap = {}
  const listeners = new Set<() => void>()

  function subscribe(callback: () => void): () => void {
    listeners.add(callback)
    return () => {
      listeners.delete(callback)
    }
  }

  function getSnapshot(): VisibilityMap {
    return snapshot
  }

  function setVisibility(next: VisibilityMap): void {
    // Always assign a new reference so useSyncExternalStore can detect changes
    snapshot = { ...next }
    for (const listener of listeners) {
      listener()
    }
  }

  return { subscribe, getSnapshot, setVisibility }
}
