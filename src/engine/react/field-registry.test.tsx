import { describe, it, expect } from 'vitest'
import { registerField, getField, type FieldComponent } from './field-registry'

const CustomWidget: FieldComponent = ({ label }) => <div>{label}</div>

describe('field-registry', () => {
  it('registers and retrieves a custom field type', () => {
    registerField('custom-widget', CustomWidget)
    expect(getField('custom-widget')).toBe(CustomWidget)
  })

  it('returns undefined for an unregistered type', () => {
    expect(getField('never-registered')).toBeUndefined()
  })

  it('refuses to override a built-in field type', () => {
    expect(() => registerField('text', CustomWidget)).toThrow()
    expect(() => registerField('select', CustomWidget)).toThrow()
    expect(() => registerField('array', CustomWidget)).toThrow()
  })
})
