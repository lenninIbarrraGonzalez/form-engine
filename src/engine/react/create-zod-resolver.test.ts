import { describe, it, expect } from 'vitest'
import { createZodResolver } from './create-zod-resolver'
import { createVisibilityStore } from '../store/visibility-store'
import type { FormDefinition } from '../schema/types'
import type { VisibilityStore } from '../store/visibility-store'

const schema: FormDefinition = {
  title: 'T',
  fields: [{ name: 'name', type: 'text', label: 'Name', validations: { required: true } }],
}

describe('createZodResolver', () => {
  it('returns values and no errors when input is valid', async () => {
    const resolver = createZodResolver(schema, createVisibilityStore())
    const result = await resolver({ name: 'Ada' })
    expect(result.errors).toEqual({})
    expect(result.values).toEqual({ name: 'Ada' })
  })

  it('returns a keyed error for an invalid field', async () => {
    const resolver = createZodResolver(schema, createVisibilityStore())
    const result = await resolver({ name: '' })
    expect(result.errors.name).toBeDefined()
  })

  it('never rejects — surfaces a form-level error when the schema build throws', async () => {
    // A store whose getSnapshot throws simulates an unexpected internal failure.
    const brokenStore: VisibilityStore = {
      subscribe: () => () => {},
      getSnapshot: () => {
        throw new Error('boom')
      },
      setVisibility: () => {},
    }
    const resolver = createZodResolver(schema, brokenStore)
    const result = await resolver({ name: 'x' })
    expect(result.errors.root).toBeDefined()
    expect(result.errors.root.type).toBe('resolver_error')
  })
})
