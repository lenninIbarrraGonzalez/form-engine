import type { FieldError, UseFormRegister } from 'react-hook-form'
import type { SelectItem } from '../../schema/types'

interface SelectFieldProps {
  name: string
  label: string
  items?: SelectItem[]
  register: UseFormRegister<Record<string, unknown>>
  error?: FieldError
}

export function SelectField({ name, label, items = [], register, error }: SelectFieldProps) {
  const errorId = error ? `${name}-error` : undefined

  return (
    <div>
      <label htmlFor={name}>{label}</label>
      <select
        id={name}
        {...register(name)}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={errorId}
      >
        <option value="">-- Select --</option>
        {items.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
      {error && (
        <span id={errorId} role="alert">
          {error.message}
        </span>
      )}
    </div>
  )
}
