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

  const progressPct = ((activeIndex + 1) / fields.length) * 100

  return (
    <div onKeyDown={handleKeyDown} ref={containerRef} className="relative">
      {/* Fixed progress bar at top */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-gray-200 z-10">
        <div
          className="h-1 bg-indigo-600 transition-all duration-300"
          style={{ width: `${progressPct}%` }}
          aria-label="Progress"
        />
      </div>

      <div className="min-h-[60vh] flex flex-col justify-center max-w-lg mx-auto px-4 py-16">
        <p className="text-sm text-gray-400 mb-6 text-center">
          {activeIndex + 1} / {fields.length}
        </p>

        <div key={activeField.name}>
          {renderFields([activeField], '', register, errors, store, control)}
        </div>

        <p className="text-xs text-gray-400 mt-4">
          Press <kbd className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-xs font-mono">Enter ↵</kbd> to continue
        </p>

        <div className="flex gap-3 mt-6">
          {activeIndex > 0 && (
            <button
              type="button"
              onClick={() => setActiveIndex((i) => i - 1)}
              className="px-4 py-2 rounded-full text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
            >
              Back
            </button>
          )}
          {activeIndex < fields.length - 1 && (
            <button
              type="button"
              onClick={() => setActiveIndex((i) => i + 1)}
              className="px-4 py-2 rounded-full text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
