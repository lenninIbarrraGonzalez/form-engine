// eslint-disable-next-line @typescript-eslint/no-explicit-any
import { useFieldArray, type Control, type UseFormRegister, type FieldErrors } from 'react-hook-form'
import type { FieldDefinition } from '../../schema/types'
import type { VisibilityStore } from '../../store/visibility-store'

interface ArrayFieldProps {
  name: string
  label: string
  itemFields: FieldDefinition[]
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

  return (
    <fieldset>
      <legend>{label}</legend>
      {fields.map((field, index) => (
        <div key={field.id}>
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
      <button type="button" onClick={() => append({})}>
        Add {label}
      </button>
    </fieldset>
  )
}
