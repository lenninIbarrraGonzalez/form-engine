import type { FieldError, UseFormRegister } from 'react-hook-form'
import { BaseInputField } from './BaseInputField'

interface TextFieldProps {
  name: string
  label: string
  placeholder?: string
  register: UseFormRegister<Record<string, unknown>>
  error?: FieldError
}

export function TextField(props: TextFieldProps) {
  return <BaseInputField {...props} type="text" />
}
