# Form Renderer Specification

## Purpose

Provide an extensible field-registry, a recursive `FormRenderer` component for nested groups and arrays, and a `FormEngine` component wiring React Hook Form (RHF) for values with the Zod resolver reading from the visibility store. Accessibility is a formal success criterion (WCAG).

## Requirements

### Requirement: Field Registry

The system MUST maintain a `FieldRegistry` as a plain object mapping `FieldDefinition.type` (string) to a React component. The registry MUST support runtime registration of new field types via a `registerField(type: string, component: FieldComponent): void` function without requiring modification of existing code.

Built-in registrations MUST include: `text`, `number`, `select`, `checkbox`, `file`.

#### Scenario: Registered type renders correct component

- GIVEN `registerField("color-picker", ColorPickerComponent)` has been called
- WHEN `FormRenderer` encounters a field with `type: "color-picker"`
- THEN it renders `ColorPickerComponent` for that field

#### Scenario: Unknown type renders a fallback error boundary

- GIVEN a field with `type: "unknown-widget"` not in the registry
- WHEN `FormRenderer` renders it
- THEN a visible error element is rendered indicating the unknown type (no crash)

### Requirement: Recursive FormRenderer

`FormRenderer` MUST accept a `fields: FieldDefinition[]` prop and render each field by looking it up in the registry. For fields with `type: "group"` or `type: "array"`, it MUST recurse into nested `fields` (groups) or item templates (arrays).

Array fields MUST render dynamic add/remove controls allowing the user to add items up to `maxItems` and remove items down to `minItems` (if specified); the controls MUST be keyboard-accessible.

#### Scenario: Group fields render recursively

- GIVEN a form definition with a group field containing two child text fields
- WHEN `FormRenderer` renders the group
- THEN both child fields are rendered inside the group container

#### Scenario: Array field renders add/remove controls

- GIVEN an array field `referencias` with `validations: { minItems: 1, maxItems: 3 }`
- WHEN the form renders with one existing item
- THEN an "Add" button is present
- AND a "Remove" button is present on the existing item
- AND both buttons are reachable and activatable via keyboard (Tab + Enter/Space)

### Requirement: FormEngine RHF Wiring

`FormEngine` MUST integrate RHF via `useForm` with a Zod resolver built from `buildZodSchema(definition, visibilitySnapshot)`. On every RHF field change, `FormEngine` MUST call `evaluateVisibility` and update the visibility store. On submit, `FormEngine` MUST rebuild the Zod schema from the latest visibility snapshot before validation.

RHF MUST own form values. The visibility store MUST own visibility state. These two stores MUST NOT be merged.

#### Scenario: Field change triggers visibility update

- GIVEN a form where field B is hidden when field A equals "no"
- WHEN the user sets A to "no"
- THEN `evaluateVisibility` is called with `changedField: "A"`
- AND the visibility store is updated with B set to false
- AND the B field wrapper unmounts or hides

#### Scenario: Submit validates only visible fields

- GIVEN field B is hidden when A equals "no" and A is currently "no"
- WHEN the user submits the form
- THEN validation does NOT produce an error for B regardless of B's validation rules

### Requirement: Dot-Notation Field Names

RHF field names MUST use dot-notation for nested and array fields (e.g., `referencias.0.telefono`, `address.city`). The engine MUST derive these names automatically from the `FormDefinition` structure.

#### Scenario: Array item field registered with correct dot-notation name

- GIVEN an array field `referencias` with item field `telefono`
- WHEN the second item is added
- THEN RHF registers the field under name `referencias.1.telefono`

### Requirement: Accessibility — Associated Labels and ARIA Attributes

Every rendered field MUST have a `<label>` element associated to its input via matching `htmlFor`/`id` attributes. Fields with validation errors MUST have `aria-invalid="true"` and `aria-describedby` pointing to their error message element. Error message elements MUST have a unique `id` matching the `aria-describedby` reference.

#### Scenario: Label is associated to input

- GIVEN a visible text field `firstName` with label "First Name"
- WHEN the form renders
- THEN the input element has `id="firstName"` and a `<label htmlFor="firstName">` is present

#### Scenario: Error state sets aria-invalid and aria-describedby

- GIVEN field `firstName` has a required validation error
- WHEN the form renders the error state
- THEN the input has `aria-invalid="true"`
- AND `aria-describedby` references the id of the error message element

### Requirement: Accessibility — Error Announcement (aria-live)

Validation error messages MUST be rendered inside or adjacent to an `aria-live="polite"` region so screen readers announce new errors without requiring focus movement.

#### Scenario: New error is announced to screen readers

- GIVEN a form with no current errors
- WHEN the user submits with a required field empty
- THEN the error message appears inside an element with `aria-live="polite"` (or `aria-live="assertive"` on submit)
- AND no explicit focus move is required for screen reader announcement

### Requirement: Accessibility — Full Keyboard Navigation

All interactive controls (inputs, selects, checkboxes, add/remove array items, step navigation buttons, submit) MUST be reachable and operable via keyboard alone. Focus MUST remain managed: after adding an array item, focus MUST move to the first input of the new item.

#### Scenario: Add array item moves focus

- GIVEN an array field with an "Add" button
- WHEN the user activates "Add" via Enter/Space
- THEN a new item row is rendered
- AND focus moves to the first input field of the new item row
