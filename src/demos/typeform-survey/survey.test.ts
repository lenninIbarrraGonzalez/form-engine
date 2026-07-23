// Integration tests for the Typeform Survey demo schema.
// Uses pure engine functions only — no React rendering.
import { describe, it, expect } from 'vitest'
import { validateFormDefinition } from '../../engine/schema/meta-schema'
import { buildDependencyGraph } from '../../engine/core/dependency-graph'
import { evaluateCondition } from '../../engine/core/condition-evaluator'
import surveySchema from './schema.json'

describe('Typeform Survey schema', () => {
  it('parses correctly through validateFormDefinition', () => {
    const definition = validateFormDefinition(surveySchema)
    expect(definition.title).toBe('Encuesta de Experiencia')
    expect(definition.fields).toHaveLength(5)
  })

  it('has all required fields', () => {
    const definition = validateFormDefinition(surveySchema)
    const names = definition.fields!.map((f) => f.name)
    expect(names).toContain('nombre')
    expect(names).toContain('email')
    expect(names).toContain('nivelExperiencia')
    expect(names).toContain('lenguajeFavorito')
    expect(names).toContain('comentarios')
  })

  it('dependency graph builds without cycles', () => {
    const definition = validateFormDefinition(surveySchema)
    expect(() => buildDependencyGraph(definition)).not.toThrow()
  })

  it('lenguajeFavorito has showIf targeting nivelExperiencia', () => {
    const definition = validateFormDefinition(surveySchema)
    const graph = buildDependencyGraph(definition)
    const dependents = graph.edges.get('nivelExperiencia')
    expect(dependents).toBeDefined()
    expect(dependents!.has('lenguajeFavorito')).toBe(true)
  })

  it('lenguajeFavorito is hidden when nivelExperiencia=Junior', () => {
    const definition = validateFormDefinition(surveySchema)
    const field = definition.fields!.find((f) => f.name === 'lenguajeFavorito')!
    expect(field.showIf).toBeDefined()
    const visible = evaluateCondition(field.showIf!, { nivelExperiencia: 'Junior' })
    expect(visible).toBe(false)
  })

  it('lenguajeFavorito is visible when nivelExperiencia=Mid', () => {
    const definition = validateFormDefinition(surveySchema)
    const field = definition.fields!.find((f) => f.name === 'lenguajeFavorito')!
    const visible = evaluateCondition(field.showIf!, { nivelExperiencia: 'Mid' })
    expect(visible).toBe(true)
  })

  it('lenguajeFavorito is visible when nivelExperiencia=Senior', () => {
    const definition = validateFormDefinition(surveySchema)
    const field = definition.fields!.find((f) => f.name === 'lenguajeFavorito')!
    const visible = evaluateCondition(field.showIf!, { nivelExperiencia: 'Senior' })
    expect(visible).toBe(true)
  })

  it('nivelExperiencia has select items for Junior/Mid/Senior', () => {
    const definition = validateFormDefinition(surveySchema)
    const field = definition.fields!.find((f) => f.name === 'nivelExperiencia')!
    const values = field.items!.map((i) => i.value)
    expect(values).toContain('Junior')
    expect(values).toContain('Mid')
    expect(values).toContain('Senior')
  })
})
