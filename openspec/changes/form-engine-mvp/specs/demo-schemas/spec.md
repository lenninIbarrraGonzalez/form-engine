# Demo Schemas Specification

## Purpose

Define three interpreted schemas that run on one shared engine, exercising its full feature set: wizard layout, deep conditionals, array fields, mock file upload, one-field-per-screen layout, and keyboard navigation.

## Requirements

### Requirement: Credit Application Schema (3-Step Wizard)

The credit application MUST be defined as a JSON schema with exactly 3 steps rendered in multi-step wizard layout. It MUST include a `tipoPersona` field (values: `"natural"` / `"juridica"`) that conditionally shows/hides groups of fields via `showIf`. It MUST include a `referencias` array field with `validations: { minItems: 1, maxItems: 3 }`.

Domain field names and label values MAY use Spanish (e.g., `tipoPersona`, `referencias`, `NIT`) as they are data, not UI copy.

#### Scenario: tipoPersona conditional shows juridica fields

- GIVEN the credit application schema is loaded
- WHEN the user selects `tipoPersona = "juridica"`
- THEN fields scoped to `tipoPersona equals "juridica"` become visible
- AND fields scoped to `tipoPersona equals "natural"` become hidden

#### Scenario: references array respects maxItems

- GIVEN the `referencias` array starts with 3 items
- WHEN the form renders
- THEN the "Add" button is disabled or absent (maxItems reached)

#### Scenario: wizard step navigation

- GIVEN the credit application form on step 1
- WHEN the user completes step 1 fields and clicks "Next"
- THEN step 2 is displayed
- AND step 1 fields are no longer visible in the active step panel

### Requirement: Insurance Claim Schema (Deep Conditionals + Mock Upload)

The insurance claim MUST be defined as a JSON schema with at least two distinct subforms activated by deep conditionals (a top-level `claimType` field selecting between subforms). It MUST include a field of `type: "file"` representing a mock document upload (UI only, no actual upload).

#### Scenario: Claim type activates corresponding subform

- GIVEN the insurance claim schema is loaded
- WHEN the user selects `claimType = "theft"`
- THEN the theft-specific fields become visible
- AND the accident-specific fields remain hidden

#### Scenario: File field renders file input UI

- GIVEN the insurance claim schema contains a `type: "file"` field
- WHEN the form renders
- THEN a file input control is rendered
- AND no network request is made (mock only)

### Requirement: Typeform Survey Schema (One-Field-Per-Screen)

The Typeform survey MUST be defined as a JSON schema rendered in `"one-field-per-screen"` layout mode. At most one field (or logically grouped question) MUST be visible at a time. Keyboard navigation MUST advance to the next field when Enter is pressed. A progress bar MUST display the ratio of answered fields to total fields.

#### Scenario: Only one field visible at a time

- GIVEN the Typeform survey is rendered in `"one-field-per-screen"` mode
- WHEN the form first renders
- THEN exactly one field (or question group) is visible
- AND all other fields are not rendered in the DOM

#### Scenario: Enter key advances to next field

- GIVEN the first field is visible and has a value entered
- WHEN the user presses Enter
- THEN the next field becomes visible and receives focus
- AND the previous field is removed from view

#### Scenario: Progress bar reflects answered count

- GIVEN a survey with 5 questions and 2 answered
- WHEN the current state is rendered
- THEN the progress bar shows 40% (or `2/5`) completion

### Requirement: Layout Mode Abstraction

The `FormEngine` / `FormRenderer` MUST accept a `layout` prop with at least three values: `"flat"` (default, all fields rendered), `"wizard"` (multi-step), `"one-field-per-screen"`. The engine core MUST NOT contain layout-specific logic; layout is a renderer concern only.

#### Scenario: Same schema renders in flat and wizard mode

- GIVEN the credit application schema
- WHEN rendered with `layout="flat"`
- THEN all fields from all steps are rendered simultaneously without step navigation controls

#### Scenario: Same schema renders in one-field-per-screen mode

- GIVEN a simple survey schema
- WHEN rendered with `layout="one-field-per-screen"`
- THEN only the current question is visible and keyboard navigation applies
