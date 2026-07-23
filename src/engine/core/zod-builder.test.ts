import { describe, it, expect } from 'vitest'
import { buildZodSchema } from './zod-builder'
import type { FormDefinition, FieldDefinition } from '../schema/types'
import type { VisibilityMap } from './condition-evaluator'

// ---- Helpers ---------------------------------------------------------

function makeForm(fields: FieldDefinition[]): FormDefinition {
  return { title: 'Test', fields }
}

// ---- Scenario: required text field maps to z.string().min(1) --------

describe('buildZodSchema — required text field', () => {
  it('fails parse with empty string when field is visible and required', () => {
    const definition = makeForm([
      { name: 'firstName', type: 'text', label: 'First name', validations: { required: true } },
    ])
    const visibility: VisibilityMap = { firstName: true }
    const schema = buildZodSchema(definition, visibility)
    const result = schema.safeParse({ firstName: '' })
    expect(result.success).toBe(false)
  })

  it('passes parse with a non-empty string when field is visible and required', () => {
    const definition = makeForm([
      { name: 'firstName', type: 'text', label: 'First name', validations: { required: true } },
    ])
    const visibility: VisibilityMap = { firstName: true }
    const schema = buildZodSchema(definition, visibility)
    const result = schema.safeParse({ firstName: 'Ana' })
    expect(result.success).toBe(true)
  })
})

// ---- Scenario: pattern constraint maps to regex ---------------------

describe('buildZodSchema — pattern constraint', () => {
  it('fails parse when value does not match the pattern', () => {
    const definition = makeForm([
      {
        name: 'nit',
        type: 'text',
        label: 'NIT',
        validations: { pattern: '^[0-9]{9}$' },
      },
    ])
    const visibility: VisibilityMap = { nit: true }
    const schema = buildZodSchema(definition, visibility)
    const result = schema.safeParse({ nit: 'abc' })
    expect(result.success).toBe(false)
  })

  it('passes parse when value matches the pattern', () => {
    const definition = makeForm([
      {
        name: 'nit',
        type: 'text',
        label: 'NIT',
        validations: { pattern: '^[0-9]{9}$' },
      },
    ])
    const visibility: VisibilityMap = { nit: true }
    const schema = buildZodSchema(definition, visibility)
    const result = schema.safeParse({ nit: '123456789' })
    expect(result.success).toBe(true)
  })
})

// ---- Scenario: number with min/max ----------------------------------

describe('buildZodSchema — number field with min/max', () => {
  it('fails parse when number is below min', () => {
    const definition = makeForm([
      { name: 'age', type: 'number', label: 'Age', validations: { min: 18, max: 99 } },
    ])
    const visibility: VisibilityMap = { age: true }
    const schema = buildZodSchema(definition, visibility)
    const result = schema.safeParse({ age: 10 })
    expect(result.success).toBe(false)
  })

  it('passes parse when number is within range', () => {
    const definition = makeForm([
      { name: 'age', type: 'number', label: 'Age', validations: { min: 18, max: 99 } },
    ])
    const visibility: VisibilityMap = { age: true }
    const schema = buildZodSchema(definition, visibility)
    const result = schema.safeParse({ age: 25 })
    expect(result.success).toBe(true)
  })
})

// ---- KEY EDGE CASE: hidden field is NOT included in schema ----------

describe('buildZodSchema — hidden field excluded from validation', () => {
  it('succeeds parse when hidden required field is undefined', () => {
    const definition = makeForm([
      {
        name: 'companyName',
        type: 'text',
        label: 'Company',
        validations: { required: true },
      },
    ])
    const visibility: VisibilityMap = { companyName: false }
    const schema = buildZodSchema(definition, visibility)
    // Hidden field — companyName absent from payload — must not produce validation error
    const result = schema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('fails parse when visible required field is empty', () => {
    const definition = makeForm([
      {
        name: 'fullName',
        type: 'text',
        label: 'Full name',
        validations: { required: true },
      },
    ])
    const visibility: VisibilityMap = { fullName: true }
    const schema = buildZodSchema(definition, visibility)
    const result = schema.safeParse({ fullName: '' })
    expect(result.success).toBe(false)
  })
})

// ---- Scenario: visible array field with minItems ---------------------

describe('buildZodSchema — array field with minItems/maxItems', () => {
  it('fails parse when visible array has fewer items than minItems', () => {
    const definition = makeForm([
      {
        name: 'referencias',
        type: 'array',
        label: 'Referencias',
        validations: { minItems: 1, maxItems: 3 },
      },
    ])
    const visibility: VisibilityMap = { referencias: true }
    const schema = buildZodSchema(definition, visibility)
    const result = schema.safeParse({ referencias: [] })
    expect(result.success).toBe(false)
  })

  it('passes parse when visible array meets minItems', () => {
    const definition = makeForm([
      {
        name: 'referencias',
        type: 'array',
        label: 'Referencias',
        validations: { minItems: 1, maxItems: 3 },
      },
    ])
    const visibility: VisibilityMap = { referencias: true }
    const schema = buildZodSchema(definition, visibility)
    const result = schema.safeParse({ referencias: [{ name: 'ref1' }] })
    expect(result.success).toBe(true)
  })
})

// ---- Scenario: hidden array field with minItems NOT validated --------

describe('buildZodSchema — hidden array field excluded', () => {
  it('succeeds parse with empty array when array field is hidden', () => {
    const definition = makeForm([
      {
        name: 'referencias',
        type: 'array',
        label: 'Referencias',
        validations: { minItems: 1 },
      },
    ])
    const visibility: VisibilityMap = { referencias: false }
    const schema = buildZodSchema(definition, visibility)
    const result = schema.safeParse({})
    expect(result.success).toBe(true)
  })
})

// ---- Scenario: field absent from visibilityMap is treated as visible -

describe('buildZodSchema — undefined visibility defaults to visible', () => {
  it('validates a required field that is absent from the visibility map', () => {
    const definition = makeForm([
      {
        name: 'email',
        type: 'text',
        label: 'Email',
        validations: { required: true },
      },
    ])
    // email NOT in visibility map → treated as visible (undefined !== false)
    const visibility: VisibilityMap = {}
    const schema = buildZodSchema(definition, visibility)
    const result = schema.safeParse({ email: '' })
    expect(result.success).toBe(false)
  })
})

// ---- B1: Checkbox required must fail when unchecked -----------------

describe('buildZodSchema — checkbox field', () => {
  it('fails parse when checkbox is required and value is false', () => {
    const definition = makeForm([
      { name: 'terms', type: 'checkbox', label: 'Terms', validations: { required: true } },
    ])
    const schema = buildZodSchema(definition, { terms: true })
    // required checkbox: false is a boolean but does not satisfy the constraint
    const result = schema.safeParse({ terms: false })
    expect(result.success).toBe(false)
  })

  it('passes parse when checkbox is required and value is true', () => {
    const definition = makeForm([
      { name: 'terms', type: 'checkbox', label: 'Terms', validations: { required: true } },
    ])
    const schema = buildZodSchema(definition, { terms: true })
    const result = schema.safeParse({ terms: true })
    expect(result.success).toBe(true)
  })

  it('passes parse when checkbox is optional and value is false', () => {
    const definition = makeForm([
      { name: 'newsletter', type: 'checkbox', label: 'Newsletter', validations: { optional: true } },
    ])
    const schema = buildZodSchema(definition, { newsletter: true })
    const result = schema.safeParse({ newsletter: false })
    expect(result.success).toBe(true)
  })
})

// ---- B2: Number required must reject NaN / undefined ----------------

describe('buildZodSchema — number required', () => {
  it('fails parse when number field is required and value is NaN', () => {
    const definition = makeForm([
      { name: 'age', type: 'number', label: 'Age', validations: { required: true } },
    ])
    const schema = buildZodSchema(definition, { age: true })
    const result = schema.safeParse({ age: NaN })
    expect(result.success).toBe(false)
  })

  it('passes parse when number field is required and value is a valid number', () => {
    const definition = makeForm([
      { name: 'age', type: 'number', label: 'Age', validations: { required: true } },
    ])
    const schema = buildZodSchema(definition, { age: true })
    const result = schema.safeParse({ age: 25 })
    expect(result.success).toBe(true)
  })
})

// ---- Scenario: required wins over optional (mutually exclusive flags) -

describe('buildZodSchema — required takes precedence over optional', () => {
  it('rejects a missing number when both required and optional are set', () => {
    const form = makeForm([
      { name: 'age', type: 'number', label: 'Age', validations: { required: true, optional: true } },
    ])
    const schema = buildZodSchema(form, {})
    expect(schema.safeParse({}).success).toBe(false)
  })

  it('accepts a present number when required', () => {
    const form = makeForm([
      { name: 'age', type: 'number', label: 'Age', validations: { required: true } },
    ])
    const schema = buildZodSchema(form, {})
    expect(schema.safeParse({ age: 25 }).success).toBe(true)
  })

  it('rejects a missing text when both required and optional are set', () => {
    const form = makeForm([
      { name: 'name', type: 'text', label: 'Name', validations: { required: true, optional: true } },
    ])
    const schema = buildZodSchema(form, {})
    expect(schema.safeParse({}).success).toBe(false)
  })
})
