// Builds a React Hook Form compatible resolver that validates against a Zod
// schema derived from the current visibility snapshot. Extracted from FormEngine
// so the validation contract can be unit-tested without React.
import type { Resolver } from 'react-hook-form'
import type { FormDefinition } from '../schema/types'
import type { VisibilityStore } from '../store/visibility-store'
import { buildZodSchema } from '../core/zod-builder'

type FormValues = Record<string, unknown>

/**
 * Creates an async resolver bound to a schema and a visibility store.
 * The store snapshot is read at validation time so hidden fields are excluded.
 * Never rejects: any unexpected failure is surfaced as a single form-level error
 * so the form stays interactive instead of hanging on an unhandled rejection.
 */
export function createZodResolver(
  schema: FormDefinition,
  store: VisibilityStore,
): Resolver<FormValues> {
  return async (values) => {
    try {
      const snapshot = store.getSnapshot()
      const zodSchema = buildZodSchema(schema, snapshot)
      const result = await zodSchema.safeParseAsync(values)

      if (result.success) {
        return { values: result.data, errors: {} }
      }

      const errors: Record<string, { type: string; message: string }> = {}
      for (const issue of result.error.issues) {
        const path = issue.path.join('.')
        if (!errors[path]) {
          errors[path] = { type: issue.code, message: issue.message }
        }
      }
      return { values: {}, errors }
    } catch {
      return {
        values: {},
        errors: {
          root: {
            type: 'resolver_error',
            message: 'Validation failed unexpectedly. Please review your input and try again.',
          },
        },
      }
    }
  }
}
