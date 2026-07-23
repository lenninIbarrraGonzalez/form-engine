import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { FieldError, UseFormRegister } from 'react-hook-form'
import { BaseInputField } from './BaseInputField'

const noopRegister = vi.fn(() => ({
  name: 'x',
  onChange: vi.fn(),
  onBlur: vi.fn(),
  ref: vi.fn(),
})) as unknown as UseFormRegister<Record<string, unknown>>

describe('BaseInputField', () => {
  it('renders an input of the given type wired to its label', () => {
    render(<BaseInputField name="phone" label="Phone" type="tel" register={noopRegister} />)
    const input = screen.getByLabelText('Phone')
    expect(input.tagName).toBe('INPUT')
    expect(input).toHaveAttribute('type', 'tel')
    expect(input).toHaveAttribute('aria-invalid', 'false')
  })

  it('exposes the error message via role=alert and aria-describedby when invalid', () => {
    const error: FieldError = { type: 'required', message: 'Required' }
    render(<BaseInputField name="phone" label="Phone" type="tel" register={noopRegister} error={error} />)
    expect(screen.getByLabelText('Phone')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByRole('alert')).toHaveTextContent('Required')
  })
})
