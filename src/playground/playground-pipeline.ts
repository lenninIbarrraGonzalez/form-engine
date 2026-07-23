// Playground parsing/validation pipeline — pure function.
// JSON string → parse → validateFormDefinition → buildDependencyGraph → result.
// No React, no side effects. Testable in isolation.
import type { FormDefinition } from '../engine/schema/types'
import type { FormDefinitionIssue } from '../engine/schema/meta-schema'
import { validateFormDefinition, FormDefinitionError } from '../engine/schema/meta-schema'
import { buildDependencyGraph, CyclicDependencyError } from '../engine/core/dependency-graph'

// ---- Result types ----------------------------------------------------

export type PlaygroundResult =
  | { ok: true; definition: FormDefinition }
  | { ok: false; errorType: 'parse'; message: string; issues?: undefined }
  | { ok: false; errorType: 'schema'; message: string; issues: FormDefinitionIssue[] }
  | { ok: false; errorType: 'cycle'; message: string; issues?: undefined }

// ---- Pure pipeline ---------------------------------------------------

/**
 * Parses a raw JSON string, validates it against the FormDefinition meta-schema,
 * and builds a dependency graph to catch cycles.
 *
 * Returns a discriminated union: { ok: true, definition } | { ok: false, errorType, message }.
 * Never throws — all errors are captured and returned as the result type.
 */
export function parseAndValidateSchema(jsonText: string): PlaygroundResult {
  // Step 1: JSON parse
  let raw: unknown
  try {
    raw = JSON.parse(jsonText)
  } catch (err) {
    const message = err instanceof Error ? `JSON parse error: ${err.message}` : 'Invalid JSON'
    return { ok: false, errorType: 'parse', message }
  }

  // Step 2: Meta-schema validation
  let definition: FormDefinition
  try {
    definition = validateFormDefinition(raw)
  } catch (err) {
    if (err instanceof FormDefinitionError) {
      return {
        ok: false,
        errorType: 'schema',
        message: err.message,
        issues: err.issues,
      }
    }
    const message = err instanceof Error ? err.message : 'Schema validation error'
    return { ok: false, errorType: 'schema', message, issues: [] }
  }

  // Step 3: Dependency graph (catches cycles)
  try {
    buildDependencyGraph(definition)
  } catch (err) {
    if (err instanceof CyclicDependencyError) {
      return { ok: false, errorType: 'cycle', message: err.message }
    }
    const message = err instanceof Error ? err.message : 'Dependency graph error'
    return { ok: false, errorType: 'cycle', message }
  }

  return { ok: true, definition }
}
