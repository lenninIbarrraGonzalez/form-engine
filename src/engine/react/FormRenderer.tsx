// FormRenderer — iterates FieldDefinitions and dispatches each to its registered component.
// Wraps each field in a visibility gate via useFieldVisibility.
// Handles 'array' and 'group' types with recursive rendering.
import type { Control, FieldError, FieldErrors, UseFormRegister } from 'react-hook-form'
import type { FieldDefinition } from '../schema/types'
import type { VisibilityStore } from '../store/visibility-store'
import { useFieldVisibility } from './useFieldVisibility'
import { getField } from './field-registry'
import { TextField } from './fields/TextField'
import { NumberField } from './fields/NumberField'
import { SelectField } from './fields/SelectField'
import { TelField } from './fields/TelField'
import { ArrayField } from './fields/ArrayField'

// ---- Types -----------------------------------------------------------

interface FieldWrapperProps {
  field: FieldDefinition
  prefix: string
  register: UseFormRegister<Record<string, unknown>>
  errors: FieldErrors<Record<string, unknown>>
  store: VisibilityStore
  control: Control<Record<string, unknown>>
}

// ---- Helper: resolve dot-notation error path -------------------------

function getNestedError(
  errors: FieldErrors<Record<string, unknown>>,
  path: string,
): FieldErrors<Record<string, unknown>>[string] | undefined {
  const parts = path.split('.')
  let current: FieldErrors<Record<string, unknown>> | undefined = errors
  for (const part of parts) {
    if (current == null) return undefined
    const next = current[part]
    // FieldErrors values can be nested FieldErrors or a FieldError leaf
    current = next as FieldErrors<Record<string, unknown>> | undefined
  }
  return current as FieldErrors<Record<string, unknown>>[string] | undefined
}

// ---- Inner renderFields (passed as prop to ArrayField) ---------------

export function renderFields(
  fields: FieldDefinition[],
  prefix: string,
  register: UseFormRegister<Record<string, unknown>>,
  errors: FieldErrors<Record<string, unknown>>,
  store: VisibilityStore,
  control: Control<Record<string, unknown>>,
): React.ReactNode {
  return fields.map((field) => (
    <FieldWrapper
      key={field.name}
      field={field}
      prefix={prefix}
      register={register}
      errors={errors}
      store={store}
      control={control}
    />
  ))
}

// ---- FieldWrapper — gates visibility and dispatches to components ----

function FieldWrapper({
  field,
  prefix,
  register,
  errors,
  store,
  control,
}: FieldWrapperProps) {
  const qualifiedName = prefix ? `${prefix}.${field.name}` : field.name
  const visible = useFieldVisibility(qualifiedName, store)

  if (!visible) return null

  // Cast via unknown: getNestedError returns FieldErrors[string] (Merge<FieldError, FieldErrorsImpl>)
  // but field components only use .message and .type, which are present on both shapes.
  const error = getNestedError(errors, qualifiedName) as FieldError | undefined

  switch (field.type) {
    case 'text':
      return (
        <TextField
          key={qualifiedName}
          name={qualifiedName}
          label={field.label}
          register={register}
          error={error}
        />
      )

    case 'number':
      return (
        <NumberField
          key={qualifiedName}
          name={qualifiedName}
          label={field.label}
          register={register}
          error={error}
        />
      )

    case 'select':
      return (
        <SelectField
          key={qualifiedName}
          name={qualifiedName}
          label={field.label}
          items={field.items}
          register={register}
          error={error}
        />
      )

    case 'tel':
      return (
        <TelField
          key={qualifiedName}
          name={qualifiedName}
          label={field.label}
          register={register}
          error={error}
        />
      )

    case 'array':
      return (
        <ArrayField
          key={qualifiedName}
          name={qualifiedName}
          label={field.label}
          itemFields={field.fields ?? []}
          maxItems={field.validations?.maxItems}
          control={control}
          register={register}
          errors={errors}
          store={store}
          renderFields={renderFields}
        />
      )

    case 'group':
      return (
        <fieldset key={qualifiedName}>
          <legend>{field.label}</legend>
          {renderFields(field.fields ?? [], qualifiedName, register, errors, store, control)}
        </fieldset>
      )

    case 'checkbox':
    case 'file':
      // Native input fallback for checkbox and file types.
      return (
        <div key={qualifiedName} className="mb-4">
          <label htmlFor={qualifiedName} className="block text-sm font-medium text-gray-700 mb-1">
            {field.label}
          </label>
          <input
            id={qualifiedName}
            type={field.type}
            {...register(qualifiedName)}
            aria-invalid={error ? 'true' : 'false'}
            className="text-sm text-gray-700"
          />
          {error && (
            <span id={`${qualifiedName}-error`} role="alert" className="block text-xs text-red-600 mt-1">
              {error.message}
            </span>
          )}
        </div>
      )

    default: {
      const CustomComponent = getField(field.type)
      if (CustomComponent) {
        return (
          <CustomComponent
            key={qualifiedName}
            name={qualifiedName}
            label={field.label}
            register={register}
            error={error}
          />
        )
      }
      // Not a live-region alert — this is a static render fallback, not an
      // event the user must be interrupted for. Keep it visible but non-assertive.
      return (
        <div key={qualifiedName} className="text-xs text-red-600">
          Unknown field type: {(field as FieldDefinition).type}
        </div>
      )
    }
  }
}

// ---- FormRenderer ----------------------------------------------------

interface FormRendererProps {
  fields: FieldDefinition[]
  register: UseFormRegister<Record<string, unknown>>
  errors: FieldErrors<Record<string, unknown>>
  store: VisibilityStore
  control: Control<Record<string, unknown>>
}

export function FormRenderer({ fields, register, errors, store, control }: FormRendererProps) {
  return (
    <>
      {renderFields(fields, '', register, errors, store, control)}
    </>
  )
}
