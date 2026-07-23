import { useRef, useState } from 'react'
import { useFieldArray, type Control, type UseFormRegister, type FieldErrors } from 'react-hook-form'
import type { FieldDefinition } from '../../schema/types'
import type { VisibilityStore } from '../../store/visibility-store'

interface ArrayFieldProps {
  name: string
  label: string
  itemFields: FieldDefinition[]
  maxItems?: number
  control: Control<Record<string, unknown>>
  register: UseFormRegister<Record<string, unknown>>
  errors: FieldErrors<Record<string, unknown>>
  store: VisibilityStore
  // Passed by FormRenderer to avoid circular import — renders a list of FieldDefinitions
  renderFields: (
    fields: FieldDefinition[],
    prefix: string,
    register: UseFormRegister<Record<string, unknown>>,
    errors: FieldErrors<Record<string, unknown>>,
    store: VisibilityStore,
    control: Control<Record<string, unknown>>,
  ) => React.ReactNode
}

export function ArrayField({
  name,
  label,
  itemFields,
  maxItems,
  control,
  register,
  errors,
  store,
  renderFields,
}: ArrayFieldProps) {
  // Cast to any: RHF's FieldPath<Record<string, unknown>> resolves to never in strict TS.
  // This is a known RHF limitation when using generic Record<string, unknown> as form values.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { fields, append, remove } = useFieldArray({ control: control as any, name })
  const listRef = useRef<HTMLDivElement>(null)
  const [announcement, setAnnouncement] = useState('')

  function handleAdd() {
    const newIndex = fields.length + 1
    append({})
    // A4: announce item addition to screen readers
    setAnnouncement(`${label} ${newIndex} added`)
    // A3/focus: move to first input in the new item after render
    requestAnimationFrame(() => {
      if (!listRef.current) return
      const items = listRef.current.querySelectorAll<HTMLElement>('[data-array-item]')
      const lastItem = items[items.length - 1]
      const firstInput = lastItem?.querySelector<HTMLElement>('input, select, textarea')
      firstInput?.focus()
    })
  }

  const atMax = maxItems !== undefined && fields.length >= maxItems

  return (
    <fieldset className="border border-gray-200 rounded-lg p-4 mb-4">
      <legend className="text-sm font-semibold text-gray-700 px-2">{label}</legend>
      {/* A4: live region for screen reader announcements */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </div>
      <div ref={listRef} className="space-y-3">
        {fields.map((field, index) => (
          <div key={field.id} data-array-item className="bg-gray-50 rounded-md p-3 border border-gray-100">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {label} {index + 1}
              </span>
              {/* A3: contextual aria-label identifies which item is being removed */}
              <button
                type="button"
                onClick={() => remove(index)}
                aria-label={`Remove ${label} ${index + 1}`}
                className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors"
              >
                Remove
              </button>
            </div>
            {renderFields(
              itemFields,
              `${name}.${index}`,
              register,
              errors,
              store,
              control,
            )}
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={handleAdd}
        disabled={atMax}
        aria-disabled={atMax}
        className={`mt-3 text-sm font-medium flex items-center gap-1 transition-colors ${atMax ? 'text-gray-300 cursor-not-allowed' : 'text-indigo-600 hover:text-indigo-800'}`}
      >
        + Add {label}
      </button>
    </fieldset>
  )
}
