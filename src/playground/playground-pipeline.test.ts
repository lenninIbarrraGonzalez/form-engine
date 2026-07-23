// Unit tests for the playground parsing/validation pipeline.
// Tests pure logic: JSON parsing → schema validation → dependency graph.
// Does NOT test the Monaco UI — those are ephemeral and layout-only.
import { describe, it, expect } from 'vitest'
import { parseAndValidateSchema, type PlaygroundResult } from './playground-pipeline'

// ---- Fixtures --------------------------------------------------------

const VALID_SCHEMA = JSON.stringify({
  title: 'Test Form',
  fields: [
    { name: 'nombre', type: 'text', label: 'Nombre', validations: { required: true } },
    { name: 'email', type: 'text', label: 'Email' },
  ],
})

const VALID_SCHEMA_WITH_THREE_FIELDS = JSON.stringify({
  title: 'Test Form',
  fields: [
    { name: 'nombre', type: 'text', label: 'Nombre', validations: { required: true } },
    { name: 'email', type: 'text', label: 'Email' },
    { name: 'telefono', type: 'tel', label: 'Teléfono' },
  ],
})

const UNCLOSED_JSON = '{ "fields": ['

const MISSING_LABEL = JSON.stringify({
  title: 'Test Form',
  fields: [{ name: 'nombre', type: 'text' }],
})

const CYCLE_SCHEMA = JSON.stringify({
  title: 'Cycle Form',
  fields: [
    {
      name: 'fieldA',
      type: 'text',
      label: 'Field A',
      showIf: { field: 'fieldB', operator: 'equals', value: 'x' },
    },
    {
      name: 'fieldB',
      type: 'text',
      label: 'Field B',
      showIf: { field: 'fieldA', operator: 'equals', value: 'y' },
    },
  ],
})

// ---- Tests -----------------------------------------------------------

describe('parseAndValidateSchema', () => {
  it('returns success with parsed FormDefinition for valid JSON schema', () => {
    const result: PlaygroundResult = parseAndValidateSchema(VALID_SCHEMA)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.definition.title).toBe('Test Form')
      expect(result.definition.fields).toHaveLength(2)
    }
  })

  it('parses correctly for a schema with 3 fields (triangulation)', () => {
    const result: PlaygroundResult = parseAndValidateSchema(VALID_SCHEMA_WITH_THREE_FIELDS)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.definition.fields).toHaveLength(3)
    }
  })

  it('returns error with parse failure message for unclosed JSON', () => {
    const result: PlaygroundResult = parseAndValidateSchema(UNCLOSED_JSON)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errorType).toBe('parse')
      expect(result.message).toMatch(/json/i)
    }
  })

  it('returns error with schema issue path for field missing label', () => {
    const result: PlaygroundResult = parseAndValidateSchema(MISSING_LABEL)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errorType).toBe('schema')
      expect(result.issues).toBeDefined()
      expect(result.issues!.length).toBeGreaterThan(0)
      // The issue should reference the label path
      const hasLabelIssue = result.issues!.some(
        (i) => i.path.toLowerCase().includes('label') || i.message.toLowerCase().includes('label'),
      )
      expect(hasLabelIssue).toBe(true)
    }
  })

  it('returns error with cycle message for cyclic showIf schema', () => {
    const result: PlaygroundResult = parseAndValidateSchema(CYCLE_SCHEMA)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errorType).toBe('cycle')
      expect(result.message).toMatch(/cycl/i)
    }
  })
})
