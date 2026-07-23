import type { FieldError, UseFormRegister } from 'react-hook-form'

interface TelFieldProps {
  name: string
  label: string
  register: UseFormRegister<Record<string, unknown>>
  error?: FieldError
}

export function TelField({ name, label, register, error }: TelFieldProps) {
  const errorId = error ? `${name}-error` : undefined

  return (
    <div>
      <label htmlFor={name}>{label}</label>
      <input
        id={name}
        type="tel"
        {...register(name)}
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
