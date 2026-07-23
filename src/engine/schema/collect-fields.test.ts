import { describe, it, expect } from 'vitest'
import { collectAllFields } from './collect-fields'
import type { FormDefinition } from './types'

describe('collectAllFields', () => {
  it('returns loose fields when there are no steps', () => {
    const def: FormDefinition = {
      title: 'T',
      fields: [{ name: 'a', type: 'text', label: 'A' }],
    }
    expect(collectAllFields(def).map((f) => f.name)).toEqual(['a'])
  })

  it('merges loose fields with every step field, in order', () => {
    const def: FormDefinition = {
      title: 'T',
      fields: [{ name: 'a', type: 'text', label: 'A' }],
      steps: [
        { title: 'S1', fields: [{ name: 'b', type: 'text', label: 'B' }] },
        { title: 'S2', fields: [{ name: 'c', type: 'text', label: 'C' }] },
      ],
    }
    expect(collectAllFields(def).map((f) => f.name)).toEqual(['a', 'b', 'c'])
  })

  it('returns an empty array when neither fields nor steps are present', () => {
    expect(collectAllFields({ title: 'T' })).toEqual([])
  })
})
