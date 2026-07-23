import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FormErrorBoundary } from './FormErrorBoundary'

// Suppress React's expected console.error noise for error boundary tests
let consoleErrorSpy: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  consoleErrorSpy.mockRestore()
})

function BrokenComponent(): never {
  throw new Error('render failed intentionally')
}

describe('FormErrorBoundary', () => {
  it('renders children when nothing throws', () => {
    render(
      <FormErrorBoundary>
        <div data-testid="child">ok</div>
      </FormErrorBoundary>,
    )
    expect(screen.getByTestId('child')).toBeInTheDocument()
  })

  it('renders fallback UI when a child throws during render', () => {
    render(
      <FormErrorBoundary>
        <BrokenComponent />
      </FormErrorBoundary>,
    )
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('fallback UI contains a descriptive message', () => {
    render(
      <FormErrorBoundary>
        <BrokenComponent />
      </FormErrorBoundary>,
    )
    expect(screen.getByRole('alert').textContent).toMatch(/something went wrong/i)
  })

  it('invokes onError with the thrown error for observability', () => {
    const onError = vi.fn()
    render(
      <FormErrorBoundary onError={onError}>
        <BrokenComponent />
      </FormErrorBoundary>,
    )
    expect(onError).toHaveBeenCalledTimes(1)
    expect(onError.mock.calls[0][0]).toBeInstanceOf(Error)
  })

  it('logs the error so production failures are not silent', () => {
    render(
      <FormErrorBoundary>
        <BrokenComponent />
      </FormErrorBoundary>,
    )
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '[FormErrorBoundary]',
      expect.any(Error),
      expect.anything(),
    )
  })
})
