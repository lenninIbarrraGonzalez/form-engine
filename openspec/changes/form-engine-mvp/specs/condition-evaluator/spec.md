# Condition Evaluator Specification

## Purpose

Evaluate `showIf` conditions against live form values and compute a `VisibilityMap` that records which fields are currently visible. Evaluation is surgical: only transitive dependents of the changed field are re-evaluated.

## Requirements

### Requirement: Primitive Condition Evaluation

The system MUST expose an `evaluateCondition(condition: ShowIfCondition, values: FormValues): boolean` pure function supporting operators: `equals`, `notEquals`, `greaterThan`, `lessThan`, `contains`.

#### Scenario: equals match returns true

- GIVEN `condition = { field: "type", operator: "equals", value: "persona" }` and `values = { type: "persona" }`
- WHEN `evaluateCondition` is called
- THEN it returns `true`

#### Scenario: greaterThan comparison

- GIVEN `condition = { field: "age", operator: "greaterThan", value: 18 }` and `values = { age: 20 }`
- WHEN `evaluateCondition` is called
- THEN it returns `true`

#### Scenario: Field not present in values

- GIVEN a condition referencing field `"x"` and `values` does not contain `"x"`
- WHEN `evaluateCondition` is called
- THEN it returns `false`

### Requirement: Compound Condition Evaluation

`evaluateCondition` MUST support compound conditions: `{ and: [...] }` (all children must be true) and `{ or: [...] }` (at least one child must be true). Nesting to arbitrary depth MUST be supported.

#### Scenario: and — all true returns true

- GIVEN `condition = { and: [{ field: "a", operator: "equals", value: 1 }, { field: "b", operator: "equals", value: 2 }] }` and both values match
- WHEN `evaluateCondition` is called
- THEN it returns `true`

#### Scenario: and — one false returns false

- GIVEN the same compound `and` condition but `values.b = 99`
- WHEN `evaluateCondition` is called
- THEN it returns `false`

#### Scenario: Nested or inside and

- GIVEN `condition = { and: [condA, { or: [condB, condC] }] }` where `condA` is true and `condC` is true
- WHEN `evaluateCondition` is called
- THEN it returns `true`

### Requirement: Surgical VisibilityMap Computation

The system MUST expose an `evaluateVisibility(graph: DependencyGraph, changedField: string, values: FormValues, current: VisibilityMap): VisibilityMap` function.

It MUST recompute visibility ONLY for `changedField` and its transitive dependents (using `getTransitiveDependents`). Fields not in that set MUST retain their current visibility without re-evaluation.

The function MUST be pure: it returns a new `VisibilityMap` object (immutable update); the input `current` map is not mutated.

#### Scenario: Only dependents are re-evaluated

- GIVEN a graph where A affects B and C, but D is unrelated to A
- WHEN `evaluateVisibility` is called with `changedField: "A"`
- THEN the returned map re-evaluates B and C
- AND D's visibility entry is copied from `current` unchanged

#### Scenario: Newly hidden field returns false in VisibilityMap

- GIVEN field B is visible (`current.B = true`) and A's new value makes B's `showIf` false
- WHEN `evaluateVisibility` is called with `changedField: "A"`
- THEN the returned map has `B = false`

### Requirement: Nested Array Field Visibility

Visibility evaluation MUST support dot-notation field names for items inside array fields (e.g., `referencias.0.telefono`).

#### Scenario: Array item field visibility computed by index

- GIVEN an array `referencias` with items containing field `telefono` conditionally shown
- WHEN a referenced parent field changes value
- THEN `evaluateVisibility` computes visibility for `referencias.0.telefono`, `referencias.1.telefono`, etc., for each current item index
