// Integration tests for the Insurance Claim demo schema.
// Uses pure engine functions only — no React rendering.
import { describe, it, expect } from 'vitest'
import { validateFormDefinition } from '../../engine/schema/meta-schema'
import { buildDependencyGraph } from '../../engine/core/dependency-graph'
import { evaluateCondition } from '../../engine/core/condition-evaluator'
import insuranceSchema from './schema.json'

describe('Insurance Claim schema', () => {
  it('parses correctly through validateFormDefinition', () => {
    const definition = validateFormDefinition(insuranceSchema)
    expect(definition.title).toBe('Reclamación de Seguro')
    expect(definition.fields).toBeDefined()
    expect(definition.fields!.length).toBeGreaterThan(0)
  })

  it('has all required top-level fields', () => {
    const definition = validateFormDefinition(insuranceSchema)
    const names = definition.fields!.map((f) => f.name)
    expect(names).toContain('tipoSiniestro')
    expect(names).toContain('poliza')
    expect(names).toContain('fechaSiniestro')
    expect(names).toContain('placaVehiculo')
    expect(names).toContain('danoEstimado')
    expect(names).toContain('beneficiario')
    expect(names).toContain('documentos')
  })

  it('dependency graph builds without cycles', () => {
    const definition = validateFormDefinition(insuranceSchema)
    expect(() => buildDependencyGraph(definition)).not.toThrow()
  })

  it('compound OR showIf for danoEstimado: visible when tipoSiniestro=Vehiculo', () => {
    const definition = validateFormDefinition(insuranceSchema)
    const field = definition.fields!.find((f) => f.name === 'danoEstimado')!
    expect(field.showIf).toBeDefined()
    const visible = evaluateCondition(field.showIf!, { tipoSiniestro: 'Vehiculo' })
    expect(visible).toBe(true)
  })

  it('compound OR showIf for danoEstimado: visible when tipoSiniestro=Hogar', () => {
    const definition = validateFormDefinition(insuranceSchema)
    const field = definition.fields!.find((f) => f.name === 'danoEstimado')!
    const visible = evaluateCondition(field.showIf!, { tipoSiniestro: 'Hogar' })
    expect(visible).toBe(true)
  })

  it('compound OR showIf for danoEstimado: hidden when tipoSiniestro=Vida', () => {
    const definition = validateFormDefinition(insuranceSchema)
    const field = definition.fields!.find((f) => f.name === 'danoEstimado')!
    const visible = evaluateCondition(field.showIf!, { tipoSiniestro: 'Vida' })
    expect(visible).toBe(false)
  })

  it('placaVehiculo only visible for tipoSiniestro=Vehiculo', () => {
    const definition = validateFormDefinition(insuranceSchema)
    const field = definition.fields!.find((f) => f.name === 'placaVehiculo')!
    expect(evaluateCondition(field.showIf!, { tipoSiniestro: 'Vehiculo' })).toBe(true)
    expect(evaluateCondition(field.showIf!, { tipoSiniestro: 'Hogar' })).toBe(false)
    expect(evaluateCondition(field.showIf!, { tipoSiniestro: 'Vida' })).toBe(false)
  })

  it('beneficiario only visible for tipoSiniestro=Vida', () => {
    const definition = validateFormDefinition(insuranceSchema)
    const field = definition.fields!.find((f) => f.name === 'beneficiario')!
    expect(evaluateCondition(field.showIf!, { tipoSiniestro: 'Vida' })).toBe(true)
    expect(evaluateCondition(field.showIf!, { tipoSiniestro: 'Vehiculo' })).toBe(false)
  })

  it('documentos array has minItems:1 and contains tipo and descripcionDoc fields', () => {
    const definition = validateFormDefinition(insuranceSchema)
    const docField = definition.fields!.find((f) => f.name === 'documentos')!
    expect(docField.validations?.minItems).toBe(1)
    const itemNames = docField.fields!.map((f) => f.name)
    expect(itemNames).toContain('tipo')
    expect(itemNames).toContain('descripcionDoc')
  })
})
