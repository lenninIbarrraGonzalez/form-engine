import type { FieldError, UseFormRegister } from 'react-hook-form'
import { BaseInputField } from './BaseInputField'

interface NumberFieldProps {
  name: string
  label: string
  register: UseFormRegister<Record<string, unknown>>
  error?: FieldError
}

export function NumberField(props: NumberFieldProps) {
  return <BaseInputField {...props} type="number" registerOptions={{ valueAsNumber: true }} />
}
