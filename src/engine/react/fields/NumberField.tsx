import type { FieldError, UseFormRegister } from 'react-hook-form'

interface NumberFieldProps {
  name: string
  label: string
  register: UseFormRegister<Record<string, unknown>>
  error?: FieldError
}

export function NumberField({ name, label, register, error }: NumberFieldProps) {
  const errorId = error ? `${name}-error` : undefined

  return (
    <div>
      <label htmlFor={name}>{label}</label>
      <input
        id={name}
        type="number"
        {...register(name, { valueAsNumber: true })}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={errorId}
      />
      {error && (
        <span id={errorId} role="alert">
          {error.message}
        </span>
      )}
    </div>
  )
}
