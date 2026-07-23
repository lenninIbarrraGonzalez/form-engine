import type { FieldError, UseFormRegister } from 'react-hook-form'
import { BaseInputField } from './BaseInputField'

interface TelFieldProps {
  name: string
  label: string
  register: UseFormRegister<Record<string, unknown>>
  error?: FieldError
}

export function TelField(props: TelFieldProps) {
  return <BaseInputField {...props} type="tel" />
}
