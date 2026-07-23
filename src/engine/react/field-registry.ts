// Field registry: maps field type strings to React component constructors.
// Supports extension via registerField() for custom field types.
import type { FieldError, UseFormRegister } from 'react-hook-form'
import { FIELD_TYPES, type FieldType } from '../schema/types'

// ---- Public types ----------------------------------------------------

export interface FieldComponentProps {
  name: string
  label: string
  register: UseFormRegister<Record<string, unknown>>
  error?: FieldError
}

export type FieldComponent = React.ComponentType<FieldComponentProps>

const registry = new Map<string, FieldComponent>()

const BUILT_IN_TYPES = new Set<string>(FIELD_TYPES)

/**
 * Register a component for a custom field type.
 * Call this before FormEngine is rendered if adding custom types.
 * Throws if `type` collides with a built-in type — built-ins are owned by the
 * engine and shadowing them silently would produce confusing, hard-to-trace bugs.
 */
export function registerField(type: string, component: FieldComponent): void {
  if (BUILT_IN_TYPES.has(type)) {
    throw new Error(`Cannot override built-in field type "${type}". Choose a distinct custom type name.`)
  }
  registry.set(type, component)
}

/**
 * Retrieve the component registered for a field type.
 * Returns undefined if the type was never registered.
 */
export function getField(type: FieldType | string): FieldComponent | undefined {
  return registry.get(type)
}
