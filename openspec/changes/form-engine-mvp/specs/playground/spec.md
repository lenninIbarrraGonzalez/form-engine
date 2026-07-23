# Playground Specification

## Purpose

Provide a split-panel UI with a Monaco JSON editor on the left and a live-rendered form on the right. Errors from meta-schema violations and dependency cycles MUST appear inline. Playground JSON is ephemeral — no persistence beyond the current browser session.

## Requirements

### Requirement: Split-Panel Layout

The playground MUST render a two-panel layout: Monaco editor (left panel) and live form preview (right panel). Both panels MUST be visible simultaneously on desktop viewport widths (≥ 1024 px).

#### Scenario: Both panels visible on desktop

- GIVEN the playground route is loaded on a ≥ 1024 px viewport
- WHEN the page renders
- THEN the Monaco editor and the form preview are both visible without scrolling

### Requirement: Live Form Update on Valid JSON

When the user edits the Monaco editor content, the playground MUST re-parse and re-validate the JSON on every change (debounced). If the JSON is valid and passes the meta-schema, the live form preview MUST update to reflect the new schema.

#### Scenario: Valid schema edit updates the live form

- GIVEN the playground displays a form with two fields
- WHEN the user adds a third field in the Monaco editor and the JSON remains valid
- THEN the live form preview renders three fields

### Requirement: Inline Meta-Schema Error Display

When the JSON does not parse or fails the Zod meta-schema validation, an inline error panel MUST appear (below the editor or overlaid) listing each issue with its `path` and `message`. The live form preview MUST NOT update while errors are present.

#### Scenario: Invalid JSON shows parse error

- GIVEN the user types `{ "fields": [` (unclosed array) in the editor
- WHEN the debounce fires
- THEN an inline error appears with a JSON parse error message
- AND the live form preview retains its last valid state

#### Scenario: Meta-schema violation shows structured issues

- GIVEN the user enters a valid JSON where a field is missing the `label` property
- WHEN the debounce fires
- THEN an inline error lists the path (e.g., `fields[0].label`) and a message indicating the missing property
- AND the live form preview retains its last valid state

### Requirement: Inline Cycle Error Display

When the schema's `showIf` graph contains a cycle, a `CyclicDependencyError` MUST be caught and displayed inline in the error panel with the cycle path. The live form preview MUST NOT attempt to render a schema with a cycle.

#### Scenario: Cycle in showIf shows cycle error

- GIVEN the user edits the schema so that field A's `showIf` references B and B's `showIf` references A
- WHEN the debounce fires and the graph is built
- THEN an inline error message displays the cycle path (e.g., "Cycle detected: A → B → A")
- AND the live form preview is not updated

### Requirement: Ephemeral JSON — No Persistence

The playground JSON editor content MUST NOT be saved to `localStorage`, `sessionStorage`, `IndexedDB`, or any other persistence mechanism. When the user refreshes or navigates away, the editor resets to the default starter schema.

#### Scenario: Refresh resets editor to default schema

- GIVEN the user has edited the playground JSON
- WHEN the browser page is refreshed
- THEN the Monaco editor displays the original default starter schema
- AND no previously edited content is restored

### Requirement: Monaco Lazy-Loading

The Monaco editor MUST be loaded lazily via dynamic import / route-level code splitting so that it is not included in the main application bundle. The playground route MUST NOT increase the initial page load bundle of any other route.

#### Scenario: Playground bundle is separate

- GIVEN `npm run build` completes
- WHEN the build output is inspected
- THEN Monaco assets appear in a separate chunk not included in the main entry bundle

### Requirement: Playground Accessibility

The playground MUST be keyboard-navigable: the user MUST be able to Tab between the editor and the form preview. Error messages in the inline error panel MUST be associated with an `aria-live="polite"` region so screen readers announce them.

#### Scenario: Error panel announced to screen readers

- GIVEN the playground is focused in the Monaco editor
- WHEN an invalid schema produces an error
- THEN the error message appears in an `aria-live="polite"` region
- AND a screen reader announces the error without requiring focus change
