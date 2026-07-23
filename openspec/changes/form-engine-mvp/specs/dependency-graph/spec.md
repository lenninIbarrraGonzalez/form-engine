# Dependency Graph Specification

## Purpose

Build a directed graph from `showIf` references across a `FormDefinition` so the engine can detect cycles and compute a topological traversal order for condition evaluation.

## Requirements

### Requirement: Graph Construction from ShowIf

The system MUST expose a `buildDependencyGraph(definition: FormDefinition): DependencyGraph` function that inspects every `showIf` in every field (including nested groups and array item fields) and records an edge from each referenced field to the dependent field.

Compound `and`/`or` conditions MUST have all referenced fields extracted as graph edges.

#### Scenario: Simple dependency edge is recorded

- GIVEN a form where field `B` has `showIf: { field: "A", operator: "equals", value: "x" }`
- WHEN `buildDependencyGraph` is called
- THEN the returned graph contains an edge A → B

#### Scenario: Compound and/or references all become edges

- GIVEN a field `C` with `showIf: { and: [{ field: "A", ... }, { field: "B", ... }] }`
- WHEN `buildDependencyGraph` is called
- THEN the graph contains edges A → C and B → C

#### Scenario: Fields inside an array item schema are included

- GIVEN an array field `refs` whose item template contains a field `phone` with `showIf: { field: "country", ... }`
- WHEN `buildDependencyGraph` is called
- THEN an edge country → refs.phone is recorded using dot-notation

### Requirement: Cycle Detection and Rejection

The system MUST detect directed cycles in the dependency graph. If any cycle exists, `buildDependencyGraph` MUST throw a `CyclicDependencyError` identifying the cycle path.

This is a primary high-value edge case. The error MUST be thrown at graph-build time, not at render or evaluation time.

#### Scenario: Direct self-cycle is rejected (PRIMARY EDGE CASE)

- GIVEN a field `A` with `showIf: { field: "A", operator: "equals", value: "x" }`
- WHEN `buildDependencyGraph` is called
- THEN a `CyclicDependencyError` is thrown
- AND the error message includes the field name `A` indicating the self-reference

#### Scenario: Indirect cycle is rejected

- GIVEN fields where A depends on B, B depends on C, and C depends on A
- WHEN `buildDependencyGraph` is called
- THEN a `CyclicDependencyError` is thrown
- AND the error message includes the cycle path `A → B → C → A` (or equivalent ordered representation)

#### Scenario: Acyclic graph is accepted

- GIVEN a form with fields A → B → C (no back-edges)
- WHEN `buildDependencyGraph` is called
- THEN no error is thrown and a valid graph is returned

### Requirement: Topological Order

The system MUST expose a `getTopologicalOrder(graph: DependencyGraph): string[]` function returning field names in topological order (dependencies before dependents).

#### Scenario: Root fields appear before dependents

- GIVEN a graph with edges A → B → C
- WHEN `getTopologicalOrder` is called
- THEN the returned array positions A before B and B before C

### Requirement: Transitive Dependents Lookup

The system MUST expose a `getTransitiveDependents(graph: DependencyGraph, fieldName: string): string[]` function returning all fields that transitively depend on the given field.

#### Scenario: Direct and indirect dependents are returned

- GIVEN edges A → B → C
- WHEN `getTransitiveDependents(graph, "A")` is called
- THEN the result contains both `B` and `C`
