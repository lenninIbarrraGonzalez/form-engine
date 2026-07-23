// Shared presentational input used by the text, tel, and number fields.
// They differ only by the HTML input `type` and optional register options,
// so the label/input/error markup and accessibility wiring live here once.
import type { FieldError, RegisterOptions, UseFormRegister } from 'react-hook-form'

interface BaseInputFieldProps {
  name: string
  label: string
  type: string
  register: UseFormRegister<Record<string, unknown>>
  error?: FieldError
  registerOptions?: RegisterOptions<Record<string, unknown>>
}

export function BaseInputField({
  name,
  label,
  type,
  register,
  error,
  registerOptions,
}: BaseInputFieldProps) {
  const errorId = error ? `${name}-error` : undefined

  return (
    <div className="mb-4">
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <input
        id={name}
        type={type}
        {...register(name, registerOptions)}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={errorId}
        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 aria-[invalid=true]:border-red-400 aria-[invalid=true]:ring-1 aria-[invalid=true]:ring-red-300 transition-colors"
      />
      {error && (
        <span id={errorId} role="alert" className="block text-xs text-red-600 mt-1">
          {error.message}
        </span>
      )}
    </div>
  )
}
