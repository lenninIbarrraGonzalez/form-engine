# Visibility Store Specification

## Purpose

Provide a reactive store for the `VisibilityMap` that satisfies the `useSyncExternalStore` contract. Only field wrappers whose visibility changed are re-rendered; unaffected components do not re-render.

## Requirements

### Requirement: useSyncExternalStore Contract

The store MUST expose exactly three functions: `subscribe(callback: () => void): () => void`, `getSnapshot(): VisibilityMap`, and `setVisibility(map: VisibilityMap): void`.

`subscribe` MUST return an unsubscribe function. `getSnapshot` MUST return the same reference if the map has not changed (referential stability). `setVisibility` MUST replace the stored map and call all subscribers.

#### Scenario: Subscribe and unsubscribe

- GIVEN a subscriber callback registered via `subscribe`
- WHEN `unsubscribe()` is called
- THEN subsequent calls to `setVisibility` do NOT invoke that callback

#### Scenario: setVisibility notifies all active subscribers

- GIVEN two callbacks subscribed to the store
- WHEN `setVisibility` is called with a new map
- THEN both callbacks are invoked exactly once

### Requirement: Snapshot Referential Stability

`getSnapshot` MUST return the same object reference when `setVisibility` has not been called since the last `getSnapshot`. Returning a new object on every call would cause React to schedule infinite re-renders.

#### Scenario: Snapshot is stable between writes

- GIVEN `getSnapshot` is called twice without an intervening `setVisibility`
- WHEN the results are compared with `===`
- THEN they are the same reference

#### Scenario: Snapshot changes after write

- GIVEN `getSnapshot` is called before and after `setVisibility(newMap)`
- WHEN the results are compared with `===`
- THEN they are different references

### Requirement: Per-Field Visibility Hook

The system MUST expose a `useFieldVisibility(fieldName: string): boolean` hook that subscribes to the store via `useSyncExternalStore` and returns the current visibility for a single field.

The hook MUST return `true` for any field name not present in the `VisibilityMap` (fields without a `showIf` are always visible).

#### Scenario: Field not in map is visible by default

- GIVEN a store with `VisibilityMap = { B: false }`
- WHEN `useFieldVisibility("A")` is called (A has no entry)
- THEN it returns `true`

#### Scenario: Hidden field hook returns false

- GIVEN a store with `VisibilityMap = { B: false }`
- WHEN `useFieldVisibility("B")` is called
- THEN it returns `false`

### Requirement: Selective Re-Render Isolation

Only the component(s) that wrap the specific field(s) whose visibility changed MUST re-render on a `setVisibility` call. Components wrapping fields whose visibility did not change MUST NOT re-render.

This is a behavioral constraint verified through render-count testing (e.g., `vi.fn()` spy on render or `React.memo` + `renderCount`).

#### Scenario: Unaffected field wrapper does not re-render

- GIVEN fields A and B rendered in a form, both initially visible
- WHEN `setVisibility` is called changing only B's visibility to false
- THEN the wrapper component for A does NOT re-render
- AND the wrapper component for B re-renders exactly once
