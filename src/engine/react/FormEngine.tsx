// FormEngine — root component that wires RHF, visibility store, dependency graph,
// and custom Zod resolver together into a reactive form.
import { useMemo, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import type { FormDefinition } from '../schema/types'
import { buildDependencyGraph } from '../core/dependency-graph'
import { evaluateVisibility, type VisibilityMap } from '../core/condition-evaluator'
import { buildZodSchema } from '../core/zod-builder'
import { createVisibilityStore } from '../store/visibility-store'
import { FormRenderer } from './FormRenderer'
import { WizardLayout } from './layouts/WizardLayout'
import { TypeformLayout } from './layouts/TypeformLayout'

// ---- Types -----------------------------------------------------------

export type LayoutMode = 'flat' | 'wizard' | 'one-field-per-screen'

interface FormEngineProps {
  schema: FormDefinition
  onSubmit: (data: Record<string, unknown>) => void
  layout?: LayoutMode
}

// ---- Component -------------------------------------------------------

export function FormEngine({ schema, onSubmit, layout = 'flat' }: FormEngineProps) {
  // Build dependency graph once per schema (memoized)
  const graph = useMemo(() => buildDependencyGraph(schema), [schema])

  // Compute initial visibility map: evaluate all fields that have showIf
  // against an empty values object so conditional fields start hidden.
  const initialVisibility = useMemo((): VisibilityMap => {
    const allFields = [
      ...(schema.fields ?? []),
      ...(schema.steps?.flatMap((s) => s.fields) ?? []),
    ]
    const map: VisibilityMap = {}
    for (const field of allFields) {
      if (field.showIf !== undefined) {
        // With no values, all conditions evaluate to false → hidden
        map[field.name] = false
      }
    }
    return map
  }, [schema])

  // Create visibility store once per schema, pre-seeded with initial state
  const store = useMemo(() => {
    const s = createVisibilityStore()
    s.setVisibility(initialVisibility)
    return s
  }, [schema, initialVisibility])

  // Custom resolver: reads visibility snapshot at validation time
  const resolver = useMemo(
    () =>
      async (values: Record<string, unknown>) => {
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
      },
    [schema, store],
  )

  const {
    register,
    handleSubmit,
    watch,
    control,
    setFocus,
    formState: { errors },
  } = useForm<Record<string, unknown>>({
    resolver,
    mode: 'onSubmit',
  })

  // Watch all field changes and update visibility store
  useEffect(() => {
    const subscription = watch((values, { name: changedField }) => {
      if (!changedField) return
      const current = store.getSnapshot()
      const next = evaluateVisibility(graph, changedField, values as Record<string, unknown>, current)
      store.setVisibility(next)
    })
    return () => subscription.unsubscribe()
  }, [watch, graph, store])

  // Collect all fields across steps and flat fields
  const allFields = useMemo(
    () => [
      ...(schema.fields ?? []),
      ...(schema.steps?.flatMap((s) => s.fields) ?? []),
    ],
    [schema],
  )

  const handleFormSubmit = handleSubmit(
    (data) => {
      onSubmit(data)
    },
    (fieldErrors) => {
      // Focus first invalid field for accessibility
      const firstErrorKey = Object.keys(fieldErrors)[0]
      if (firstErrorKey) {
        setFocus(firstErrorKey)
      }
    },
  )

  function renderBody() {
    if (layout === 'wizard' && schema.steps && schema.steps.length > 0) {
      return (
        <WizardLayout
          steps={schema.steps}
          register={register}
          errors={errors}
          store={store}
          control={control}
        />
      )
    }

    if (layout === 'one-field-per-screen') {
      return (
        <TypeformLayout
          fields={allFields}
          register={register}
          errors={errors}
          store={store}
          control={control}
        />
      )
    }

    // Default: flat layout — all fields rendered together
    return (
      <FormRenderer
        fields={allFields}
        register={register}
        errors={errors}
        store={store}
        control={control}
      />
    )
  }

  return (
    <form onSubmit={handleFormSubmit} noValidate className="space-y-2">
      {renderBody()}
      <button
        type="submit"
        className="mt-6 w-full bg-indigo-600 text-white font-medium py-2.5 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
      >
        Submit
      </button>
    </form>
  )
}
