# Schema Contract Specification

## Purpose

Define the TypeScript types and runtime Zod meta-schema that validate a form-definition JSON document before it is interpreted by the engine. Rejection produces structured, human-readable error messages.

## Requirements

### Requirement: FormDefinition Types

The system MUST export TypeScript types (`FormDefinition`, `FieldDefinition`, `StepDefinition`, `ShowIfCondition`) that fully describe a valid form-definition document.

Every field MUST carry: `name` (unique string), `type` (union of supported field types), `label` (string). Optional properties: `showIf`, `validations`, `fields` (for groups/arrays), `items` (for select).

#### Scenario: Valid field types are accepted

- GIVEN a `FieldDefinition` with `type` equal to one of `text | number | select | checkbox | file | group | array`
- WHEN the TypeScript compiler checks the type
- THEN no type error is emitted

#### Scenario: Unknown field type is rejected at compile time

- GIVEN a `FieldDefinition` with `type: "unsupported"`
- WHEN the TypeScript compiler checks the type
- THEN a type error is emitted identifying the invalid field type

### Requirement: Runtime Meta-Schema Validation

The system MUST expose a `validateFormDefinition(json: unknown): FormDefinition` function that parses and validates a raw JSON value against the Zod meta-schema at runtime.

On success it MUST return a typed `FormDefinition`. On failure it MUST throw a `FormDefinitionError` with a `issues` array where each entry contains a human-readable `path` and `message`.

#### Scenario: Valid JSON passes validation

- GIVEN a well-formed JSON object matching the meta-schema
- WHEN `validateFormDefinition` is called with that object
- THEN it returns a typed `FormDefinition` with no errors thrown

#### Scenario: Missing required field property is rejected

- GIVEN a JSON object where a field entry is missing the `label` property
- WHEN `validateFormDefinition` is called
- THEN a `FormDefinitionError` is thrown
- AND the `issues` array contains an entry with `path` pointing to the offending field and a message indicating which property is missing

#### Scenario: Malformed JSON string is rejected

- GIVEN a raw string that is not valid JSON
- WHEN the caller passes the parsed result to `validateFormDefinition`
- THEN a `FormDefinitionError` is thrown with a clear top-level parse error message

### Requirement: ShowIf Condition Schema

The meta-schema MUST validate `showIf` entries as either a single condition object `{ field, operator, value }` or a compound object `{ and: [...] } | { or: [...] }` with arbitrary nesting depth.

Supported operators MUST include: `equals`, `notEquals`, `greaterThan`, `lessThan`, `contains`.

#### Scenario: Valid compound showIf is accepted

- GIVEN a field with `showIf: { and: [{ field: "a", operator: "equals", value: "x" }, { field: "b", operator: "greaterThan", value: 0 }] }`
- WHEN `validateFormDefinition` is called
- THEN no error is thrown and the condition is preserved as typed

#### Scenario: Invalid operator is rejected

- GIVEN a field with `showIf: { field: "a", operator: "isLike", value: "x" }`
- WHEN `validateFormDefinition` is called
- THEN a `FormDefinitionError` is thrown with an issue identifying the invalid operator

### Requirement: Validation Rules Schema

The meta-schema MUST validate the `validations` property of a field as an object supporting: `required` (boolean), `min` (number), `max` (number), `minLength` (number), `maxLength` (number), `pattern` (string regex), `minItems` (number for array fields), `maxItems` (number for array fields), `optional` (boolean).

#### Scenario: Array-specific rules accepted on array field

- GIVEN an array field with `validations: { minItems: 1, maxItems: 3 }`
- WHEN `validateFormDefinition` is called
- THEN no error is thrown
