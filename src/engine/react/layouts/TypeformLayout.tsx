// TypeformLayout — one-field-per-screen layout strategy over FormRenderer.
// Enter = advance to next field, Shift+Tab = go back.
// Moves focus to the active field on step change.
import { useState, useEffect, useRef } from 'react'
import type { Control, FieldErrors, UseFormRegister } from 'react-hook-form'
import type { FieldDefinition } from '../../schema/types'
import type { VisibilityStore } from '../../store/visibility-store'
import { renderFields } from '../FormRenderer'

interface TypeformLayoutProps {
  fields: FieldDefinition[]
  register: UseFormRegister<Record<string, unknown>>
  errors: FieldErrors<Record<string, unknown>>
  store: VisibilityStore
  control: Control<Record<string, unknown>>
}

export function TypeformLayout({
  fields,
  register,
  errors,
  store,
  control,
}: TypeformLayoutProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const activeField = fields[activeIndex]

  // Move focus to first focusable element in the active field container on step change
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const focusable = container.querySelector<HTMLElement>(
      'input, select, textarea, button',
    )
    focusable?.focus()
  }, [activeIndex])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (activeIndex < fields.length - 1) setActiveIndex((i) => i + 1)
    } else if (e.key === 'Tab' && e.shiftKey) {
      e.preventDefault()
      if (activeIndex > 0) setActiveIndex((i) => i - 1)
    }
  }

  return (
    <div onKeyDown={handleKeyDown} ref={containerRef}>
      <div aria-label="Progress">
        {activeIndex + 1}/{fields.length}
      </div>
      <div key={activeField.name}>
        {renderFields([activeField], '', register, errors, store, control)}
      </div>
      <div>
        {activeIndex > 0 && (
          <button type="button" onClick={() => setActiveIndex((i) => i - 1)}>
            Back
          </button>
        )}
        {activeIndex < fields.length - 1 && (
          <button type="button" onClick={() => setActiveIndex((i) => i + 1)}>
            Next
          </button>
        )}
      </div>
    </div>
  )
}
