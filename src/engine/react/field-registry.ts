// Field registry: maps field type strings to React component constructors.
// Supports extension via registerField() for custom field types.
import type { FieldType } from '../schema/types'

// ---- Public types ----------------------------------------------------

export type FieldComponent = React.ComponentType<Record<string, unknown>>

const registry = new Map<string, FieldComponent>()

/**
 * Register a component for a given field type.
 * Call this before FormEngine is rendered if adding custom types.
 */
export function registerField(type: string, component: FieldComponent): void {
  registry.set(type, component)
}

/**
 * Retrieve the component registered for a field type.
 * Returns undefined if the type was never registered.
 */
export function getField(type: FieldType | string): FieldComponent | undefined {
  return registry.get(type)
}

/**
 * Returns the full registry map (used by FormRenderer for lookup).
 */
export function getRegistry(): ReadonlyMap<string, FieldComponent> {
  return registry
}
