// Shared helper: flattens a FormDefinition into its top-level field list,
// merging loose `fields` with every step's `fields`. Used by the dependency
// graph, the Zod builder, and FormEngine so the flattening rule lives in one place.
import type { FieldDefinition, FormDefinition } from './types'

export function collectAllFields(definition: FormDefinition): FieldDefinition[] {
  return [
    ...(definition.fields ?? []),
    ...(definition.steps?.flatMap((step) => step.fields) ?? []),
  ]
}
