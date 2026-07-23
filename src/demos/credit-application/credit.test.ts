// Integration tests for the Credit Application demo schema.
// Uses pure engine functions only — no React rendering.
import { describe, it, expect } from 'vitest'
import { validateFormDefinition } from '../../engine/schema/meta-schema'
import { buildDependencyGraph } from '../../engine/core/dependency-graph'
import { evaluateCondition } from '../../engine/core/condition-evaluator'
import creditSchema from './schema.json'

describe('Credit Application schema', () => {
  it('parses correctly through validateFormDefinition', () => {
    const definition = validateFormDefinition(creditSchema)
    expect(definition.title).toBe('Solicitud de Crédito')
    expect(definition.steps).toHaveLength(3)
  })

  it('has 3 steps with the expected titles', () => {
    const definition = validateFormDefinition(creditSchema)
    expect(definition.steps![0].title).toBe('Información del Titular')
    expect(definition.steps![1].title).toBe('Información Financiera')
    expect(definition.steps![2].title).toBe('Referencias')
  })

  it('dependency graph builds without cycles', () => {
    const definition = validateFormDefinition(creditSchema)
    expect(() => buildDependencyGraph(definition)).not.toThrow()
  })

  it('dependency graph records nit → tipoPersona edge', () => {
    const definition = validateFormDefinition(creditSchema)
    const graph = buildDependencyGraph(definition)
    // tipoPersona has nit as a dependent
    const dependents = graph.edges.get('tipoPersona')
    expect(dependents).toBeDefined()
    expect(dependents!.has('nit')).toBe(true)
  })

  it('showIf condition evaluates correctly: nit visible when tipoPersona=juridica', () => {
    const definition = validateFormDefinition(creditSchema)
    const nitField = definition.steps![0].fields.find((f) => f.name === 'nit')!
    expect(nitField.showIf).toBeDefined()
    const visible = evaluateCondition(nitField.showIf!, { tipoPersona: 'juridica' })
    expect(visible).toBe(true)
  })

  it('showIf condition evaluates correctly: nit hidden when tipoPersona=natural', () => {
    const definition = validateFormDefinition(creditSchema)
    const nitField = definition.steps![0].fields.find((f) => f.name === 'nit')!
    const visible = evaluateCondition(nitField.showIf!, { tipoPersona: 'natural' })
    expect(visible).toBe(false)
  })

  it('referencias array field has minItems:1 and maxItems:3', () => {
    const definition = validateFormDefinition(creditSchema)
    const refsField = definition.steps![2].fields.find((f) => f.name === 'referencias')!
    expect(refsField.validations?.minItems).toBe(1)
    expect(refsField.validations?.maxItems).toBe(3)
  })

  it('referencias array has nombre and telefono item fields', () => {
    const definition = validateFormDefinition(creditSchema)
    const refsField = definition.steps![2].fields.find((f) => f.name === 'referencias')!
    const itemNames = refsField.fields!.map((f) => f.name)
    expect(itemNames).toContain('nombre')
    expect(itemNames).toContain('telefono')
  })
})
