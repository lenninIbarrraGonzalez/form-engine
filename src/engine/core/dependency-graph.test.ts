import { describe, it, expect } from 'vitest'
import {
  buildDependencyGraph,
  getTopologicalOrder,
  getTransitiveDependents,
  CyclicDependencyError,
} from './dependency-graph'
import type { FormDefinition } from '../schema/types'

// --- Helpers ----------------------------------------------------------

function makeForm(fields: FormDefinition['fields']): FormDefinition {
  return { title: 'Test', fields }
}

// --- Scenario: Simple dependency edge is recorded --------------------

describe('buildDependencyGraph — simple edge', () => {
  it('records edge A → B when B has showIf referencing A', () => {
    const form = makeForm([
      { name: 'A', type: 'text', label: 'A' },
      {
        name: 'B',
        type: 'text',
        label: 'B',
        showIf: { field: 'A', operator: 'equals', value: 'x' },
      },
    ])
    const graph = buildDependencyGraph(form)
    // A's dependents must include B
    expect(graph.edges.get('A')).toContain('B')
    // B's reverse edge must include A
    expect(graph.reverse.get('B')).toContain('A')
  })
})

// --- Scenario: Compound and/or references all become edges -----------

describe('buildDependencyGraph — compound showIf', () => {
  it('records edges A→C and B→C for an "and" compound condition', () => {
    const form = makeForm([
      { name: 'A', type: 'text', label: 'A' },
      { name: 'B', type: 'text', label: 'B' },
      {
        name: 'C',
        type: 'text',
        label: 'C',
        showIf: {
          and: [
            { field: 'A', operator: 'equals', value: '1' },
            { field: 'B', operator: 'equals', value: '2' },
          ],
        },
      },
    ])
    const graph = buildDependencyGraph(form)
    expect(graph.edges.get('A')).toContain('C')
    expect(graph.edges.get('B')).toContain('C')
  })

  it('records edges for an "or" compound condition', () => {
    const form = makeForm([
      { name: 'X', type: 'text', label: 'X' },
      { name: 'Y', type: 'text', label: 'Y' },
      {
        name: 'Z',
        type: 'text',
        label: 'Z',
        showIf: {
          or: [
            { field: 'X', operator: 'equals', value: '1' },
            { field: 'Y', operator: 'equals', value: '2' },
          ],
        },
      },
    ])
    const graph = buildDependencyGraph(form)
    expect(graph.edges.get('X')).toContain('Z')
    expect(graph.edges.get('Y')).toContain('Z')
  })
})

// --- Scenario: Array item dot-notation edge --------------------------

describe('buildDependencyGraph — array item fields', () => {
  it('records edge country → refs.phone for nested array field', () => {
    const form = makeForm([
      { name: 'country', type: 'text', label: 'Country' },
      {
        name: 'refs',
        type: 'array',
        label: 'Refs',
        fields: [
          {
            name: 'phone',
            type: 'tel',
            label: 'Phone',
            showIf: { field: 'country', operator: 'equals', value: 'CO' },
          },
        ],
      },
    ])
    const graph = buildDependencyGraph(form)
    expect(graph.edges.get('country')).toContain('refs.phone')
  })
})

// --- Scenario: Self-cycle is rejected --------------------------------

describe('buildDependencyGraph — cycle detection', () => {
  it('throws CyclicDependencyError for a self-referencing field', () => {
    const form = makeForm([
      {
        name: 'A',
        type: 'text',
        label: 'A',
        showIf: { field: 'A', operator: 'equals', value: 'x' },
      },
    ])
    expect(() => buildDependencyGraph(form)).toThrow(CyclicDependencyError)
  })

  it('error message for self-cycle includes the field name', () => {
    const form = makeForm([
      {
        name: 'loop',
        type: 'text',
        label: 'Loop',
        showIf: { field: 'loop', operator: 'equals', value: 'x' },
      },
    ])
    expect(() => buildDependencyGraph(form)).toThrowError(/loop/)
  })

  it('throws CyclicDependencyError for indirect cycle A→B→C→A', () => {
    const form = makeForm([
      {
        name: 'A',
        type: 'text',
        label: 'A',
        showIf: { field: 'C', operator: 'equals', value: '1' },
      },
      {
        name: 'B',
        type: 'text',
        label: 'B',
        showIf: { field: 'A', operator: 'equals', value: '1' },
      },
      {
        name: 'C',
        type: 'text',
        label: 'C',
        showIf: { field: 'B', operator: 'equals', value: '1' },
      },
    ])
    expect(() => buildDependencyGraph(form)).toThrow(CyclicDependencyError)
  })
})

// --- Scenario: Acyclic graph is accepted ----------------------------

describe('buildDependencyGraph — acyclic graph', () => {
  it('returns a graph without throwing for A→B→C', () => {
    const form = makeForm([
      { name: 'A', type: 'text', label: 'A' },
      {
        name: 'B',
        type: 'text',
        label: 'B',
        showIf: { field: 'A', operator: 'equals', value: '1' },
      },
      {
        name: 'C',
        type: 'text',
        label: 'C',
        showIf: { field: 'B', operator: 'equals', value: '1' },
      },
    ])
    expect(() => buildDependencyGraph(form)).not.toThrow()
    const graph = buildDependencyGraph(form)
    expect(graph.edges.get('A')).toContain('B')
    expect(graph.edges.get('B')).toContain('C')
  })
})

// --- Scenario: Topological order ------------------------------------

describe('getTopologicalOrder — root fields appear before dependents', () => {
  it('places A before B before C in A→B→C graph', () => {
    const form = makeForm([
      { name: 'A', type: 'text', label: 'A' },
      {
        name: 'B',
        type: 'text',
        label: 'B',
        showIf: { field: 'A', operator: 'equals', value: '1' },
      },
      {
        name: 'C',
        type: 'text',
        label: 'C',
        showIf: { field: 'B', operator: 'equals', value: '1' },
      },
    ])
    const graph = buildDependencyGraph(form)
    const order = getTopologicalOrder(graph)
    const posA = order.indexOf('A')
    const posB = order.indexOf('B')
    const posC = order.indexOf('C')
    expect(posA).toBeLessThan(posB)
    expect(posB).toBeLessThan(posC)
  })
})

// --- Scenario: Phantom field reference is rejected -------------------

describe('buildDependencyGraph — phantom field reference', () => {
  it('throws when showIf references a field that does not exist in the form', () => {
    const form = makeForm([
      {
        name: 'B',
        type: 'text',
        label: 'B',
        showIf: { field: 'nonExistent', operator: 'equals', value: 'x' },
      },
    ])
    expect(() => buildDependencyGraph(form)).toThrow(/nonExistent/)
  })

  it('does not throw when all referenced fields exist', () => {
    const form = makeForm([
      { name: 'A', type: 'text', label: 'A' },
      {
        name: 'B',
        type: 'text',
        label: 'B',
        showIf: { field: 'A', operator: 'equals', value: 'x' },
      },
    ])
    expect(() => buildDependencyGraph(form)).not.toThrow()
  })
})

// --- Scenario: Transitive dependents --------------------------------

describe('getTransitiveDependents', () => {
  it('returns B and C when starting from A in A→B→C graph', () => {
    const form = makeForm([
      { name: 'A', type: 'text', label: 'A' },
      {
        name: 'B',
        type: 'text',
        label: 'B',
        showIf: { field: 'A', operator: 'equals', value: '1' },
      },
      {
        name: 'C',
        type: 'text',
        label: 'C',
        showIf: { field: 'B', operator: 'equals', value: '1' },
      },
    ])
    const graph = buildDependencyGraph(form)
    const dependents = getTransitiveDependents(graph, 'A')
    expect(dependents).toContain('B')
    expect(dependents).toContain('C')
    expect(dependents).not.toContain('A')
  })

  it('returns empty array for a field with no dependents', () => {
    const form = makeForm([
      { name: 'Solo', type: 'text', label: 'Solo' },
    ])
    const graph = buildDependencyGraph(form)
    const dependents = getTransitiveDependents(graph, 'Solo')
    expect(dependents).toHaveLength(0)
  })
})
