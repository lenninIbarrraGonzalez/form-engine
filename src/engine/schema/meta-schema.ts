// Runtime meta-schema validation using Zod.
// Validates a raw JSON value against the FormDefinition shape and returns a typed object.
// Throws FormDefinitionError with human-readable issues on any validation failure.
import { z } from 'zod'
import { FIELD_TYPES, OPERATORS } from './types'
import type { FormDefinition } from './types'

// ---- Error type --------------------------------------------------------

export interface FormDefinitionIssue {
  path: string
  message: string
}

export class FormDefinitionError extends Error {
  readonly issues: FormDefinitionIssue[]

  constructor(issues: FormDefinitionIssue[]) {
    const summary = issues.map((i) => `[${i.path}] ${i.message}`).join('; ')
    super(`FormDefinition validation failed: ${summary}`)
    this.name = 'FormDefinitionError'
    this.issues = issues
    Object.setPrototypeOf(this, FormDefinitionError.prototype)
  }
}

// ---- Operator schema --------------------------------------------------

const OperatorSchema = z.enum(OPERATORS, {
  errorMap: (issue, ctx) => {
    if (issue.code === z.ZodIssueCode.invalid_enum_value) {
      return {
        message: `Invalid operator "${ctx.data}". Allowed operators: ${OPERATORS.join(', ')}`,
      }
    }
    return { message: ctx.defaultError }
  },
})

// ---- ShowIf condition schema (recursive, lazy) -------------------------

type ShowIfConditionInput =
  | { field: string; operator: string; value?: unknown }
  | { and: ShowIfConditionInput[] }
  | { or: ShowIfConditionInput[] }

const ShowIfConditionSchema: z.ZodType<ShowIfConditionInput> = z.lazy(() =>
  z.union([
    // Compound: and
    z.object({
      and: z.array(ShowIfConditionSchema),
    }),
    // Compound: or
    z.object({
      or: z.array(ShowIfConditionSchema),
    }),
    // Primitive condition
    z.object({
      field: z.string(),
      operator: OperatorSchema,
      value: z.unknown(),
    }),
  ]),
)

// ---- Regex pattern safety --------------------------------------------

// Conservative ReDoS heuristic: reject a quantified group whose body itself
// contains a quantifier (e.g. `(a+)+`, `(a*)*`, `(.+)+`). These constructs are
// the classic source of catastrophic backtracking. It is intentionally strict
// rather than exhaustive — better to reject a rare safe pattern than ship a DoS.
const NESTED_QUANTIFIER = /\([^)]*[+*][^)]*\)[+*]/

function isSafePattern(pattern: string): boolean {
  if (NESTED_QUANTIFIER.test(pattern)) return false
  try {
    new RegExp(pattern)
    return true
  } catch {
    return false
  }
}

// ---- Validation rules schema ------------------------------------------

const ValidationDefSchema = z
  .object({
    required: z.boolean().optional(),
    optional: z.boolean().optional(),
    min: z.number().optional(),
    max: z.number().optional(),
    minLength: z.number().optional(),
    maxLength: z.number().optional(),
    pattern: z
      .string()
      .max(200, 'pattern must be at most 200 characters')
      .refine(isSafePattern, 'pattern must be a safe, compilable regular expression')
      .optional(),
    minItems: z.number().optional(),
    maxItems: z.number().optional(),
  })
  .refine((v) => !(v.required === true && v.optional === true), {
    message: 'A field cannot be both required and optional',
    path: ['required'],
  })

// ---- Field type schema ------------------------------------------------

const FieldTypeSchema = z.enum(FIELD_TYPES, {
  errorMap: (issue, ctx) => {
    if (issue.code === z.ZodIssueCode.invalid_enum_value) {
      return {
        message: `Unknown field type "${ctx.data}". Supported types: ${FIELD_TYPES.join(', ')}`,
      }
    }
    return { message: ctx.defaultError }
  },
})

// ---- SelectItem schema -----------------------------------------------

const SelectItemSchema = z.object({
  label: z.string(),
  value: z.string(),
})

// ---- FieldDefinition schema (recursive for group/array) ---------------

type FieldDefinitionInput = {
  name: string
  type: string
  label: string
  placeholder?: string
  showIf?: ShowIfConditionInput
  validations?: z.infer<typeof ValidationDefSchema>
  fields?: FieldDefinitionInput[]
  items?: z.infer<typeof SelectItemSchema>[]
}

const FieldDefinitionSchema: z.ZodType<FieldDefinitionInput> = z.lazy(() =>
  z.object({
    name: z.string({
      required_error: 'Field name is required',
      invalid_type_error: 'Field name must be a string',
    }),
    type: FieldTypeSchema,
    label: z.string({
      required_error: 'Field label is required',
      invalid_type_error: 'Field label must be a string',
    }),
    placeholder: z.string().optional(),
    showIf: ShowIfConditionSchema.optional(),
    validations: ValidationDefSchema.optional(),
    fields: z.array(FieldDefinitionSchema).optional(),
    items: z.array(SelectItemSchema).optional(),
  }),
)

// ---- Step schema -------------------------------------------------------

const StepDefinitionSchema = z.object({
  title: z.string(),
  fields: z.array(FieldDefinitionSchema),
})

// ---- FormDefinition schema --------------------------------------------

const FormDefinitionSchema = z.object({
  title: z.string({
    required_error: 'Form definition must have a title',
    invalid_type_error: 'Form title must be a string',
  }),
  steps: z.array(StepDefinitionSchema).optional(),
  fields: z.array(FieldDefinitionSchema).optional(),
})

// ---- Issue formatting -------------------------------------------------

function formatZodIssues(issues: z.ZodIssue[]): FormDefinitionIssue[] {
  return issues.map((issue) => ({
    path: issue.path.length > 0 ? issue.path.join('.') : '<root>',
    message: issue.message,
  }))
}

// ---- Public API -------------------------------------------------------

/**
 * Validates raw JSON against the FormDefinition meta-schema.
 * Returns a typed FormDefinition on success.
 * Throws FormDefinitionError with structured, human-readable issues on failure.
 */
export function validateFormDefinition(json: unknown): FormDefinition {
  const result = FormDefinitionSchema.safeParse(json)
  if (!result.success) {
    throw new FormDefinitionError(formatZodIssues(result.error.issues))
  }
  // Safe cast — Zod-validated shape matches our TypeScript types
  return result.data as FormDefinition
}
