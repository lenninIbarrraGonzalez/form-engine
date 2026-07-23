// FormEngine — root component that wires RHF, visibility store, dependency graph,
// and custom Zod resolver together into a reactive form.
import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import type { FormDefinition } from '../schema/types'
import { collectAllFields } from '../schema/collect-fields'
import { buildDependencyGraph } from '../core/dependency-graph'
import type { VisibilityMap } from '../core/condition-evaluator'
import { createVisibilityStore } from '../store/visibility-store'
import { createZodResolver } from './create-zod-resolver'
import { useVisibilitySync } from './useVisibilitySync'
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

  // Compute initial visibility: every field carrying a showIf condition starts
  // hidden (no values yet). Derived from the graph so nested/qualified field
  // names (e.g. group children) are covered, not just top-level names.
  const initialVisibility = useMemo((): VisibilityMap => {
    const map: VisibilityMap = {}
    for (const name of graph.fieldConditions.keys()) {
      map[name] = false
    }
    return map
  }, [graph])

  // Create visibility store once per schema, pre-seeded with initial state
  const store = useMemo(() => {
    const s = createVisibilityStore()
    s.setVisibility(initialVisibility)
    return s
  }, [schema, initialVisibility])

  // Custom resolver: reads the visibility snapshot at validation time and never
  // rejects (unexpected failures surface as a form-level error instead).
  const resolver = useMemo(() => createZodResolver(schema, store), [schema, store])

  const {
    register,
    handleSubmit,
    watch,
    control,
    setFocus,
    trigger,
    formState: { errors },
  } = useForm<Record<string, unknown>>({
    resolver,
    mode: 'onSubmit',
  })

  // Reactive glue: recompute visibility into the store as fields change.
  useVisibilitySync(watch, graph, store)

  const handleFormSubmit = handleSubmit(
    (data) => {
      onSubmit(data)
    },
    (fieldErrors) => {
      // Only focus the first error that is actually visible/mounted — focusing a
      // hidden field is a silent no-op that strands the user with no cue.
      const snapshot = store.getSnapshot()
      const firstVisibleError = Object.keys(fieldErrors).find(
        (key) => snapshot[key] !== false,
      )
      if (firstVisibleError) setFocus(firstVisibleError)
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
          trigger={trigger}
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
