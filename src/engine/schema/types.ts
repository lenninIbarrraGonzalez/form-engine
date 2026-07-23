// Core TypeScript types for the form engine schema contract.
// No Zod here — runtime validation lives in meta-schema.ts.

export const FIELD_TYPES = ['text', 'number', 'select', 'checkbox', 'file', 'group', 'array', 'tel'] as const
export const OPERATORS = ['equals', 'notEquals', 'greaterThan', 'lessThan', 'contains'] as const

export type FieldType = typeof FIELD_TYPES[number]
export type Operator = typeof OPERATORS[number]

export type PrimitiveCondition = {
  field: string
  operator: Operator
  value: unknown
}

export type ShowIfCondition =
  | PrimitiveCondition
  | { and: ShowIfCondition[] }
  | { or: ShowIfCondition[] }

export interface ValidationDef {
  required?: boolean
  optional?: boolean
  min?: number
  max?: number
  minLength?: number
  maxLength?: number
  pattern?: string
  minItems?: number
  maxItems?: number
}

export interface SelectItem {
  label: string
  value: string
}

export interface FieldDefinition {
  name: string
  type: FieldType
  label: string
  showIf?: ShowIfCondition
  validations?: ValidationDef
  fields?: FieldDefinition[]  // for group / array item template
  items?: SelectItem[]         // for select
}

export interface StepDefinition {
  title: string
  fields: FieldDefinition[]
}

export interface FormDefinition {
  title: string
  steps?: StepDefinition[]
  fields?: FieldDefinition[]
}
