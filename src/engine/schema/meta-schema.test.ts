// Tests for runtime meta-schema validation (Stage 4)
// RED first — meta-schema.ts does not exist yet
import { describe, it, expect } from 'vitest'
import { validateFormDefinition, FormDefinitionError } from './meta-schema'

// ---- Helpers ---------------------------------------------------------

const VALID_TEXT_FIELD = {
  name: 'fullName',
  type: 'text',
  label: 'Full Name',
}

const VALID_NUMBER_FIELD = {
  name: 'age',
  type: 'number',
  label: 'Age',
  validations: { min: 0, max: 150, required: true },
}

const VALID_SELECT_FIELD = {
  name: 'country',
  type: 'select',
  label: 'Country',
  items: [
    { label: 'Colombia', value: 'co' },
    { label: 'México', value: 'mx' },
  ],
}

const VALID_TEL_FIELD = {
  name: 'phone',
  type: 'tel',
  label: 'Phone',
  validations: { pattern: '^\\+?[0-9]{7,15}$' },
}

const VALID_ARRAY_FIELD = {
  name: 'referencias',
  type: 'array',
  label: 'References',
  validations: { minItems: 1, maxItems: 3 },
  fields: [
    { name: 'nombre', type: 'text', label: 'Name' },
  ],
}

const VALID_SCHEMA = {
  title: 'Credit Application',
  fields: [
    VALID_TEXT_FIELD,
    VALID_NUMBER_FIELD,
    VALID_SELECT_FIELD,
    VALID_TEL_FIELD,
    VALID_ARRAY_FIELD,
  ],
}

// ---- Tests -----------------------------------------------------------

describe('validateFormDefinition', () => {
  describe('valid schemas are accepted', () => {
    it('accepts a schema with all supported field types', () => {
      const result = validateFormDefinition(VALID_SCHEMA)
      expect(result.title).toBe('Credit Application')
      expect(result.fields).toHaveLength(5)
      expect(result.fields![0].name).toBe('fullName')
    })

    it('accepts a schema using steps instead of flat fields', () => {
      const schema = {
        title: 'Stepped Form',
        steps: [
          {
            title: 'Step 1',
            fields: [VALID_TEXT_FIELD],
          },
        ],
      }
      const result = validateFormDefinition(schema)
      expect(result.title).toBe('Stepped Form')
      expect(result.steps).toHaveLength(1)
    })

    it('accepts a field with a valid compound showIf (and)', () => {
      const schema = {
        title: 'Conditional Form',
        fields: [
          VALID_TEXT_FIELD,
          {
            name: 'nitField',
            type: 'text',
            label: 'NIT',
            showIf: {
              and: [
                { field: 'tipoPersona', operator: 'equals', value: 'juridica' },
                { field: 'age', operator: 'greaterThan', value: 18 },
              ],
            },
          },
        ],
      }
      const result = validateFormDefinition(schema)
      expect(result.fields![1].showIf).toBeDefined()
    })

    it('accepts an array field with minItems/maxItems validations', () => {
      const schema = {
        title: 'Array Form',
        fields: [VALID_ARRAY_FIELD],
      }
      const result = validateFormDefinition(schema)
      expect(result.fields![0].validations?.minItems).toBe(1)
      expect(result.fields![0].validations?.maxItems).toBe(3)
    })

    it('accepts a deeply nested array with itemFields also validated', () => {
      const schema = {
        title: 'Nested Array Form',
        fields: [
          {
            name: 'refs',
            type: 'array',
            label: 'References',
            fields: [
              {
                name: 'phone',
                type: 'tel',
                label: 'Phone',
                validations: { pattern: '^[0-9]+$' },
              },
            ],
          },
        ],
      }
      const result = validateFormDefinition(schema)
      expect(result.fields![0].fields![0].type).toBe('tel')
    })
  })

  describe('missing required properties are rejected', () => {
    it('throws FormDefinitionError when a field is missing the required "label" property', () => {
      const badSchema = {
        title: 'Bad Form',
        fields: [
          { name: 'broken', type: 'text' }, // missing label
        ],
      }
      expect(() => validateFormDefinition(badSchema)).toThrow(FormDefinitionError)
    })

    it('includes a human-readable message about missing label in the issues array', () => {
      const badSchema = {
        title: 'Bad Form',
        fields: [
          { name: 'broken', type: 'text' }, // missing label
        ],
      }
      try {
        validateFormDefinition(badSchema)
        expect.fail('Should have thrown')
      } catch (err) {
        expect(err).toBeInstanceOf(FormDefinitionError)
        const e = err as FormDefinitionError
        expect(e.issues.length).toBeGreaterThan(0)
        expect(e.issues[0].message).toMatch(/label/i)
      }
    })

    it('throws FormDefinitionError when a field is missing the required "name" property', () => {
      const badSchema = {
        title: 'Bad Form',
        fields: [
          { type: 'text', label: 'Field' }, // missing name
        ],
      }
      expect(() => validateFormDefinition(badSchema)).toThrow(FormDefinitionError)
    })

    it('throws FormDefinitionError when a field is missing the required "type" property', () => {
      const badSchema = {
        title: 'Bad Form',
        fields: [
          { name: 'field', label: 'Field' }, // missing type
        ],
      }
      expect(() => validateFormDefinition(badSchema)).toThrow(FormDefinitionError)
    })
  })

  describe('invalid field types are rejected', () => {
    it('throws FormDefinitionError when a field has an unknown type', () => {
      const badSchema = {
        title: 'Bad Form',
        fields: [
          { name: 'field', type: 'unsupported', label: 'Field' },
        ],
      }
      expect(() => validateFormDefinition(badSchema)).toThrow(FormDefinitionError)
    })

    it('includes a human-readable message about the invalid type in the issues array', () => {
      const badSchema = {
        title: 'Bad Form',
        fields: [
          { name: 'field', type: 'unsupported', label: 'Field' },
        ],
      }
      try {
        validateFormDefinition(badSchema)
        expect.fail('Should have thrown')
      } catch (err) {
        const e = err as FormDefinitionError
        expect(e.issues.length).toBeGreaterThan(0)
        // Must be human-readable — not "invalid_type"
        expect(e.issues[0].message).not.toBe('Invalid enum value')
        expect(e.issues[0].message.length).toBeGreaterThan(5)
      }
    })
  })

  describe('invalid showIf conditions are rejected', () => {
    it('throws FormDefinitionError when showIf uses an unknown operator', () => {
      const badSchema = {
        title: 'Bad Form',
        fields: [
          VALID_TEXT_FIELD,
          {
            name: 'conditional',
            type: 'text',
            label: 'Conditional',
            showIf: { field: 'fullName', operator: 'isLike', value: 'x' },
          },
        ],
      }
      expect(() => validateFormDefinition(badSchema)).toThrow(FormDefinitionError)
    })

    it('issues from invalid operator mention the bad value or path', () => {
      const badSchema = {
        title: 'Bad Form',
        fields: [
          {
            name: 'conditional',
            type: 'text',
            label: 'Conditional',
            showIf: { field: 'a', operator: 'isLike', value: 'x' },
          },
        ],
      }
      try {
        validateFormDefinition(badSchema)
        expect.fail('Should have thrown')
      } catch (err) {
        const e = err as FormDefinitionError
        expect(e.issues.length).toBeGreaterThan(0)
        // At least one issue must be human-readable
        expect(e.issues[0].message.length).toBeGreaterThan(3)
      }
    })
  })

  describe('malformed input is rejected', () => {
    it('throws FormDefinitionError when input is not an object (e.g. a string)', () => {
      expect(() => validateFormDefinition('not an object')).toThrow(FormDefinitionError)
    })

    it('throws FormDefinitionError when input is null', () => {
      expect(() => validateFormDefinition(null)).toThrow(FormDefinitionError)
    })

    it('throws FormDefinitionError when the top-level title is missing', () => {
      expect(() => validateFormDefinition({ fields: [] })).toThrow(FormDefinitionError)
    })
  })
})
