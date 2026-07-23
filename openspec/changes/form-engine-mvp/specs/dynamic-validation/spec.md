# Dynamic Validation Specification

## Purpose

Build a Zod validation schema at runtime from the `FormDefinition` and a `VisibilityMap`. Hidden fields MUST be excluded from the schema so they are never validated on submit. This is the sole cross-boundary contract between the engine core and the React layer.

## Requirements

### Requirement: Zod Schema Construction from FormDefinition

The system MUST expose a `buildZodSchema(definition: FormDefinition, visibility: VisibilityMap): ZodObject` pure function that maps each visible field's `validations` to a corresponding Zod validator.

Supported validation mappings:
- `required: true` → `.min(1)` on string, non-optional
- `min` / `max` → `.min()` / `.max()` on number
- `minLength` / `maxLength` → `.min()` / `.max()` on string
- `pattern` → `.regex()`
- `optional: true` → `.optional()`

#### Scenario: Required string field maps to non-optional Zod string with min(1)

- GIVEN a visible field `name` with `validations: { required: true }` and `type: "text"`
- WHEN `buildZodSchema` is called with that field visible
- THEN the returned schema's `name` key is a non-optional `z.string().min(1)`

#### Scenario: Pattern constraint maps to regex

- GIVEN a visible field `nit` with `validations: { pattern: "^[0-9]{9}$" }`
- WHEN `buildZodSchema` is called
- THEN the `nit` key uses `z.string().regex(/^[0-9]{9}$/)` (or equivalent)

### Requirement: Hidden Fields Excluded from Validation (PRIMARY EDGE CASE)

Fields with `visibility[field.name] === false` MUST be excluded from the built Zod schema entirely. A hidden field MUST NOT produce a validation error on form submit, even if its `validations` object contains `required: true`.

#### Scenario: Hidden field is not validated on submit

- GIVEN field `companyName` is hidden (`visibility["companyName"] = false`) and has `validations: { required: true }`
- WHEN `buildZodSchema` is called and the resulting schema is used to parse `{ companyName: undefined }`
- THEN the parse SUCCEEDS with no error for `companyName`

#### Scenario: Visible required field is validated on submit

- GIVEN field `firstName` is visible (`visibility["firstName"] = true`) and has `validations: { required: true }`
- WHEN the schema is used to parse `{ firstName: "" }`
- THEN the parse FAILS with an error on `firstName`

### Requirement: Array Field Validation

For fields of `type: "array"`, the system MUST apply `minItems` and `maxItems` constraints as array-level Zod validations (`.min()` / `.max()` on `z.array(...)`). Hidden array fields follow the same exclusion rule.

#### Scenario: minItems enforced on visible array field

- GIVEN array field `referencias` is visible with `validations: { minItems: 1, maxItems: 3 }`
- WHEN `buildZodSchema` is called and the schema is used to parse `{ referencias: [] }`
- THEN the parse FAILS with an error indicating minimum 1 item required

#### Scenario: Hidden array field with minItems is not validated

- GIVEN array field `referencias` is hidden (`visibility["referencias"] = false`) with `validations: { minItems: 1 }`
- WHEN the schema is used to parse `{ referencias: [] }`
- THEN the parse SUCCEEDS with no error for `referencias`

### Requirement: VisibilityMap as Sole Coupling Contract

`buildZodSchema` MUST NOT import or reference any React module, RHF module, or store module. It accepts `FormDefinition` and `VisibilityMap` and returns a Zod schema — nothing else. This enforces the clean boundary between the engine core and the React layer.

#### Scenario: buildZodSchema has no React dependency

- GIVEN the source file for `buildZodSchema`
- WHEN its import graph is inspected
- THEN no import resolves to `react`, `react-hook-form`, or any store module
