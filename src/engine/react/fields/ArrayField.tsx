import { useRef } from 'react'
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

  function handleAdd() {
    append({})
    // Focus the first focusable input in the newly appended item after render.
    requestAnimationFrame(() => {
      if (!listRef.current) return
      const items = listRef.current.querySelectorAll<HTMLElement>('[data-array-item]')
      const lastItem = items[items.length - 1]
      const firstInput = lastItem?.querySelector<HTMLElement>('input, select, textarea')
      firstInput?.focus()
    })
  }

  return (
    <fieldset>
      <legend>{label}</legend>
      <div ref={listRef}>
        {fields.map((field, index) => (
          <div key={field.id} data-array-item>
            <strong>{label} {index + 1}</strong>
            {renderFields(
              itemFields,
              `${name}.${index}`,
              register,
              errors,
              store,
              control,
            )}
            <button type="button" onClick={() => remove(index)}>
              Remove
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={handleAdd}
        disabled={maxItems !== undefined && fields.length >= maxItems}
        aria-disabled={maxItems !== undefined && fields.length >= maxItems}
      >
        Add {label}
      </button>
    </fieldset>
  )
}
