import { describe, it, expect } from 'vitest'
import { evaluateCondition, evaluateVisibility } from './condition-evaluator'
import type { ShowIfCondition } from '../schema/types'
import type { FormValues, VisibilityMap } from './condition-evaluator'
import { buildDependencyGraph } from './dependency-graph'
import type { FormDefinition } from '../schema/types'

// ---- Helpers ---------------------------------------------------------

function makeForm(fields: FormDefinition['fields']): FormDefinition {
  return { title: 'Test', fields }
}

// ---- Scenario: equals match returns true ----------------------------

describe('evaluateCondition — equals', () => {
  it('returns true when field value matches', () => {
    const condition: ShowIfCondition = { field: 'type', operator: 'equals', value: 'persona' }
    const values: FormValues = { type: 'persona' }
    expect(evaluateCondition(condition, values)).toBe(true)
  })

  it('returns false when field value does not match', () => {
    const condition: ShowIfCondition = { field: 'type', operator: 'equals', value: 'juridica' }
    const values: FormValues = { type: 'persona' }
    expect(evaluateCondition(condition, values)).toBe(false)
  })
})

// ---- Scenario: greaterThan ------------------------------------------

describe('evaluateCondition — greaterThan', () => {
  it('returns true when field value is greater than threshold', () => {
    const condition: ShowIfCondition = { field: 'age', operator: 'greaterThan', value: 18 }
    const values: FormValues = { age: 20 }
    expect(evaluateCondition(condition, values)).toBe(true)
  })

  it('returns false when field value equals the threshold (not strictly greater)', () => {
    const condition: ShowIfCondition = { field: 'age', operator: 'greaterThan', value: 18 }
    const values: FormValues = { age: 18 }
    expect(evaluateCondition(condition, values)).toBe(false)
  })
})

// ---- Scenario: lessThan ---------------------------------------------

describe('evaluateCondition — lessThan', () => {
  it('returns true when field value is less than threshold', () => {
    const condition: ShowIfCondition = { field: 'score', operator: 'lessThan', value: 100 }
    const values: FormValues = { score: 50 }
    expect(evaluateCondition(condition, values)).toBe(true)
  })
})

// ---- Scenario: notEquals --------------------------------------------

describe('evaluateCondition — notEquals', () => {
  it('returns true when field value differs', () => {
    const condition: ShowIfCondition = { field: 'status', operator: 'notEquals', value: 'closed' }
    const values: FormValues = { status: 'open' }
    expect(evaluateCondition(condition, values)).toBe(true)
  })
})

// ---- Scenario: contains ---------------------------------------------

describe('evaluateCondition — contains', () => {
  it('returns true when string field contains the substring', () => {
    const condition: ShowIfCondition = { field: 'tags', operator: 'contains', value: 'vip' }
    const values: FormValues = { tags: 'premium,vip,gold' }
    expect(evaluateCondition(condition, values)).toBe(true)
  })
})

// ---- Scenario: field absent in values returns false -----------------

describe('evaluateCondition — missing field', () => {
  it('returns false when the referenced field is absent from values', () => {
    const condition: ShowIfCondition = { field: 'x', operator: 'equals', value: '1' }
    const values: FormValues = {}
    expect(evaluateCondition(condition, values)).toBe(false)
  })
})

// ---- Scenario: compound and -----------------------------------------

describe('evaluateCondition — compound and', () => {
  it('returns true when all conditions are true', () => {
    const condition: ShowIfCondition = {
      and: [
        { field: 'a', operator: 'equals', value: 1 },
        { field: 'b', operator: 'equals', value: 2 },
      ],
    }
    const values: FormValues = { a: 1, b: 2 }
    expect(evaluateCondition(condition, values)).toBe(true)
  })

  it('returns false when one condition is false', () => {
    const condition: ShowIfCondition = {
      and: [
        { field: 'a', operator: 'equals', value: 1 },
        { field: 'b', operator: 'equals', value: 2 },
      ],
    }
    const values: FormValues = { a: 1, b: 99 }
    expect(evaluateCondition(condition, values)).toBe(false)
  })
})

// ---- Scenario: nested or inside and ---------------------------------

describe('evaluateCondition — nested or inside and', () => {
  it('returns true when condA is true and condC (inside or) is true', () => {
    const condA: ShowIfCondition = { field: 'a', operator: 'equals', value: 'yes' }
    const condB: ShowIfCondition = { field: 'b', operator: 'equals', value: 'yes' }
    const condC: ShowIfCondition = { field: 'c', operator: 'equals', value: 'yes' }

    const condition: ShowIfCondition = {
      and: [condA, { or: [condB, condC] }],
    }
    const values: FormValues = { a: 'yes', b: 'no', c: 'yes' }
    expect(evaluateCondition(condition, values)).toBe(true)
  })

  it('returns false when condA is true but neither condB nor condC is true', () => {
    const condA: ShowIfCondition = { field: 'a', operator: 'equals', value: 'yes' }
    const condB: ShowIfCondition = { field: 'b', operator: 'equals', value: 'yes' }
    const condC: ShowIfCondition = { field: 'c', operator: 'equals', value: 'yes' }

    const condition: ShowIfCondition = {
      and: [condA, { or: [condB, condC] }],
    }
    const values: FormValues = { a: 'yes', b: 'no', c: 'no' }
    expect(evaluateCondition(condition, values)).toBe(false)
  })
})

// ---- Scenario: evaluateVisibility — only dependents re-evaluated ----

describe('evaluateVisibility — surgical re-evaluation', () => {
  it('re-evaluates B and C but copies D unchanged when A changes', () => {
    // A → B and A → C; D is unrelated
    const form = makeForm([
      { name: 'A', type: 'text', label: 'A' },
      {
        name: 'B',
        type: 'text',
        label: 'B',
        showIf: { field: 'A', operator: 'equals', value: 'show' },
      },
      {
        name: 'C',
        type: 'text',
        label: 'C',
        showIf: { field: 'A', operator: 'equals', value: 'show' },
      },
      { name: 'D', type: 'text', label: 'D' }, // no showIf — unrelated
    ])
    const graph = buildDependencyGraph(form)
    const current: VisibilityMap = { A: true, B: true, C: true, D: true }
    const values: FormValues = { A: 'show' }

    const result = evaluateVisibility(graph, 'A', values, current)

    // B and C were re-evaluated (A='show' → condition true → visible)
    expect(result['B']).toBe(true)
    expect(result['C']).toBe(true)
    // D was NOT in A's dependents — must be copied from current unchanged
    expect(result['D']).toBe(true)
  })

  it('sets B to false when A makes B condition false', () => {
    const form = makeForm([
      { name: 'A', type: 'text', label: 'A' },
      {
        name: 'B',
        type: 'text',
        label: 'B',
        showIf: { field: 'A', operator: 'equals', value: 'show' },
      },
    ])
    const graph = buildDependencyGraph(form)
    const current: VisibilityMap = { A: true, B: true }
    const values: FormValues = { A: 'hide' } // does NOT equal 'show'

    const result = evaluateVisibility(graph, 'A', values, current)
    expect(result['B']).toBe(false)
  })
})

// ---- Scenario: evaluateVisibility is pure (no mutation) --------------

describe('evaluateVisibility — immutability', () => {
  it('does not mutate the input current VisibilityMap', () => {
    const form = makeForm([
      { name: 'A', type: 'text', label: 'A' },
      {
        name: 'B',
        type: 'text',
        label: 'B',
        showIf: { field: 'A', operator: 'equals', value: 'show' },
      },
    ])
    const graph = buildDependencyGraph(form)
    const current: VisibilityMap = { A: true, B: true }
    const currentCopy = { ...current }

    evaluateVisibility(graph, 'A', { A: 'hide' }, current)

    // current must not have been modified
    expect(current).toEqual(currentCopy)
  })
})

// ---- Scenario: dot-notation array item visibility -------------------

describe('evaluateVisibility — dot-notation array field names', () => {
  it('computes visibility for refs.phone using country as parent', () => {
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
    const current: VisibilityMap = { country: true, 'refs.phone': true }
    const values: FormValues = { country: 'US' } // not 'CO' → phone hidden

    const result = evaluateVisibility(graph, 'country', values, current)
    expect(result['refs.phone']).toBe(false)
  })
})
