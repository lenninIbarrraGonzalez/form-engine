import type { ShowIfCondition } from '../schema/types'
import type { DependencyGraph } from './dependency-graph'
import { getTransitiveDependents } from './dependency-graph'

// ---- Public types ----------------------------------------------------

export type FormValues = Record<string, unknown>
export type VisibilityMap = Record<string, boolean>

// ---- Primitive condition evaluation ---------------------------------

/**
 * Evaluates a ShowIfCondition against the provided form values.
 * Supports primitive operators and compound and/or with arbitrary nesting.
 * Pure function — no side effects.
 */
export function evaluateCondition(
  condition: ShowIfCondition,
  values: FormValues,
): boolean {
  if ('and' in condition) {
    return condition.and.every((c) => evaluateCondition(c, values))
  }

  if ('or' in condition) {
    return condition.or.some((c) => evaluateCondition(c, values))
  }

  const { field, operator, value } = condition
  const fieldValue = values[field]

  if (fieldValue === undefined) return false

  switch (operator) {
    case 'equals':
      return fieldValue === value
    case 'notEquals':
      return fieldValue !== value
    case 'greaterThan':
      return typeof fieldValue === 'number' && typeof value === 'number'
        ? fieldValue > value
        : false
    case 'lessThan':
      return typeof fieldValue === 'number' && typeof value === 'number'
        ? fieldValue < value
        : false
    case 'contains':
      return typeof fieldValue === 'string' && typeof value === 'string'
        ? fieldValue.includes(value)
        : false
    default: {
      const _exhaustive: never = operator
      return _exhaustive
    }
  }
}

// ---- Surgical VisibilityMap computation -----------------------------

/**
 * Computes a new VisibilityMap by re-evaluating ONLY the transitive dependents
 * of `changedField`. All other fields are copied from `current` unchanged.
 *
 * Pure function — the input `current` map is never mutated.
 */
export function evaluateVisibility(
  graph: DependencyGraph,
  changedField: string,
  values: FormValues,
  current: VisibilityMap,
): VisibilityMap {
  const dependents = getTransitiveDependents(graph, changedField)
  const next: VisibilityMap = { ...current }

  for (const fieldName of dependents) {
    const condition = graph.fieldConditions.get(fieldName)
    next[fieldName] = condition ? evaluateCondition(condition, values) : true
  }

  return next
}
