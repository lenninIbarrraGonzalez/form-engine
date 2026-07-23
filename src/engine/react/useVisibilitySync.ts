// Subscribes to RHF's field changes and pushes recomputed visibility into the
// store. Kept out of FormEngine so the component only *coordinates* and the
// reactive glue lives in one focused, independently testable hook.
import { useEffect, useRef } from 'react'
import type { UseFormWatch } from 'react-hook-form'
import type { DependencyGraph } from '../core/dependency-graph'
import { evaluateVisibility } from '../core/condition-evaluator'
import type { VisibilityStore } from '../store/visibility-store'

export function useVisibilitySync(
  watch: UseFormWatch<Record<string, unknown>>,
  graph: DependencyGraph,
  store: VisibilityStore,
): void {
  // Refs keep the subscription callback stable so it is wired up once and
  // always reads the latest graph/store without re-subscribing every render.
  const graphRef = useRef(graph)
  graphRef.current = graph
  const storeRef = useRef(store)
  storeRef.current = store

  useEffect(() => {
    const subscription = watch((values, { name: changedField }) => {
      if (!changedField) return
      const current = storeRef.current.getSnapshot()
      const next = evaluateVisibility(
        graphRef.current,
        changedField,
        values as Record<string, unknown>,
        current,
      )
      storeRef.current.setVisibility(next)
    })
    return () => subscription.unsubscribe()
  }, [watch]) // watch is stable per useForm call; graph/store accessed via refs
}
