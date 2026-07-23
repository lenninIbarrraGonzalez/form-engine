// FormEngine — root component that wires RHF, visibility store, dependency graph,
// and custom Zod resolver together into a reactive form.
import { useMemo, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import type { FormDefinition } from '../schema/types'
import { collectAllFields } from '../schema/collect-fields'
import { buildDependencyGraph } from '../core/dependency-graph'
import { evaluateVisibility, type VisibilityMap } from '../core/condition-evaluator'
import { buildZodSchema } from '../core/zod-builder'
import { createVisibilityStore } from '../store/visibility-store'
import { FormRenderer } from './FormRenderer'
import { WizardLayout } from './layouts/WizardLayout'
import { TypeformLayout } from './layouts/TypeformLayout'
import { FormErrorBoundary } from './FormErrorBoundary'

// ---- Types -----------------------------------------------------------

export type LayoutMode = 'flat' | 'wizard' | 'one-field-per-screen'

interface FormEngineProps {
  schema: FormDefinition
  onSubmit: (data: Record<string, unknown>) => void
  layout?: LayoutMode
}

// ---- Component -------------------------------------------------------

export function FormEngine({ schema, onSubmit, layout = 'flat' }: FormEngineProps) {
  // D6: single allFields memo — reused by initialVisibility, store, and body rendering
  const allFields = useMemo(() => collectAllFields(schema), [schema])

  // Build dependency graph once per schema (memoized)
  const graph = useMemo(() => buildDependencyGraph(schema), [schema])

  // Compute initial visibility: fields with showIf start hidden (no values yet)
  const initialVisibility = useMemo((): VisibilityMap => {
    const map: VisibilityMap = {}
    for (const field of allFields) {
      if (field.showIf !== undefined) map[field.name] = false
    }
    return map
  }, [allFields])

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

  // D2: refs keep the callback stable so the subscription is set up once
  // and always reads the latest graph/store without re-subscribing on every render.
  const graphRef = useRef(graph)
  graphRef.current = graph
  const storeRef = useRef(store)
  storeRef.current = store

  useEffect(() => {
    const subscription = watch((values, { name: changedField }) => {
      if (!changedField) return
      const current = storeRef.current.getSnapshot()
      const next = evaluateVisibility(graphRef.current, changedField, values as Record<string, unknown>, current)
      storeRef.current.setVisibility(next)
    })
    return () => subscription.unsubscribe()
  }, [watch]) // watch is stable per useForm call; graph/store accessed via refs

  const handleFormSubmit = handleSubmit(
    (data) => {
      onSubmit(data)
    },
    (fieldErrors) => {
      const firstErrorKey = Object.keys(fieldErrors)[0]
      if (firstErrorKey) setFocus(firstErrorKey)
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

  const errorCount = Object.keys(errors).length

  return (
    <FormErrorBoundary>
      <form onSubmit={handleFormSubmit} noValidate className="space-y-2">
        {/* A1: polite live region announces total error count after submit */}
        <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
          {errorCount > 0
            ? `${errorCount} ${errorCount === 1 ? 'error' : 'errors'} found. Please review the form.`
            : ''}
        </div>
        {renderBody()}
        <button
          type="submit"
          className="mt-6 w-full bg-indigo-600 text-white font-medium py-2.5 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
        >
          Submit
        </button>
      </form>
    </FormErrorBoundary>
  )
}
