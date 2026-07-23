// useFieldVisibility — subscribes to the visibility store via useSyncExternalStore
// and returns a boolean indicating whether the given field should be visible.
import { useSyncExternalStore } from 'react'
import type { VisibilityStore } from '../store/visibility-store'

/**
 * Returns true if the field should be rendered/validated, false if hidden.
 * Fields not present in the VisibilityMap default to true (always visible).
 *
 * @param fieldName - The field's `name` from the schema definition.
 * @param store - The VisibilityStore created by the parent FormEngine.
 */
export function useFieldVisibility(
  fieldName: string,
  store: VisibilityStore,
): boolean {
  const map = useSyncExternalStore(store.subscribe, store.getSnapshot)
  return map[fieldName] !== false
}
