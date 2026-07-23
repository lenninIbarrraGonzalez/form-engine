# Design: Form Engine MVP

## Technical Approach

A form engine as an **interpreter**: parse JSON → validate (meta-schema, Layer 1) → compile to a dependency graph and evaluate rules (pure core, Layer 2) → publish visibility through a framework-agnostic store (Layer 3) → render + validate with React/RHF (Layer 4). The `VisibilityMap` is the single contract coupling condition evaluation and dynamic Zod; the renderer never imports Zod. Aligns with the `schema-contract` spec (`FormDefinition`, `validateFormDefinition`, compound `showIf`). Strict TDD: Layers 1–3 are pure and tested before Layer 4.

## Architecture Decisions

| Decision | Options | Choice + Rationale |
|---|---|---|
| Cross-layer contract | shared Zod state / event bus / VisibilityMap | **VisibilityMap** (`Record<fieldName, boolean>`). One serializable value both zod-builder and renderer consume; keeps core React-free. |
| Values vs visibility ownership | RHF watch-all / own store for both / split | **Split**: RHF owns values, own store owns visibility. Avoids global `watch()` re-renders. |
| Re-evaluation scope | full recompute / topological subset | **Surgical BFS over transitive dependents** of the changed field using precomputed reverse edges. O(affected), not O(schema). |
| Resolver reads visibility | rebuild on every change / read snapshot at validate time | **Custom RHF resolver** calls `store.getSnapshot()` at validation time, then `buildFormSchema(schema, snapshot)`. Hidden fields absent from the Zod object → not validated. |
| Field-change observation | global watch / granular subscribe | RHF `useWatch`/field `onChange` feeds `changedField` name to evaluator — granular, no global subscription. |
| Graph lifecycle | rebuild per render / memoize | `useMemo(buildDependencyGraph, [schema])`; cycles throw at build → surfaced as inline error. |
| Layout modes | separate renderers / strategy over FormRenderer | **Layout strategy** wraps one `FormRenderer`: `WizardLayout` (steps) and `TypeformLayout` (one-field-per-screen) both consume the same registry + visibility. |
| Monaco | eager import / lazy + route-split | **`React.lazy` + Suspense**, playground route-split. Keeps main bundle lean. |

## Data Flow

    JSON ─validateFormDefinition─▶ FormDefinition
                                     │ useMemo
                              buildDependencyGraph ─▶ Graph (edges + reverse + topo order)
                                     │
    RHF field onChange(name,val) ─▶ evaluateVisibility(graph, changedField, values) ─▶ VisibilityMap
                                     │
                              visibility-store.setVisibility (notify only affected)
                                     │ useSyncExternalStore
                        useFieldVisibility(name) ─▶ wrapper re-renders (hide/show)
                                     │
    submit ─▶ zodResolver reads store.getSnapshot() ─▶ buildFormSchema(schema, snapshot) ─▶ validate

## File Changes

| File | Action | Description |
|---|---|---|
| `src/engine/schema/types.ts` | Create | `FormDefinition`, `FieldDefinition`, `StepDefinition`, `ShowIfCondition`, `ValidationDef` |
| `src/engine/schema/meta-schema.ts` | Create | Zod meta-schema + `validateFormDefinition`, `FormDefinitionError` |
| `src/engine/core/dependency-graph.ts` | Create | `buildDependencyGraph` (parse showIf incl. and/or), cycle detection, topo order, reverse edges |
| `src/engine/core/condition-evaluator.ts` | Create | `evaluateCondition`, `evaluateVisibility` (surgical BFS) |
| `src/engine/core/zod-builder.ts` | Create | `buildZodField`, `buildZodObject`, `buildFormSchema(schema, visibilityMap)` |
| `src/engine/store/visibility-store.ts` | Create | `subscribe/getSnapshot/setVisibility`, per-field listeners |
| `src/engine/react/field-registry.ts` | Create | `type→component` map, `registerField` extension point |
| `src/engine/react/FormEngine.tsx` | Create | wires `useForm` + memoized graph + store + custom resolver |
| `src/engine/react/FormRenderer.tsx` | Create | recursive dispatch by registry, RHF dot-notation registration |
| `src/engine/react/useFieldVisibility.ts` | Create | `useSyncExternalStore` subscription per field |
| `src/engine/react/layouts/{Wizard,Typeform}Layout.tsx` | Create | layout strategies over FormRenderer |
| `src/engine/react/fields/*.tsx` | Create | Text, Select, Number, Array (`useFieldArray`), Tel, Checkbox, File |
| `src/demos/*`, `src/playground/*` | Create | 3 schemas + Monaco playground (lazy) |
| root configs | Create | Vite, TS, Tailwind, Vitest, `git init` |

## Interfaces / Contracts

    type VisibilityMap = Record<string, boolean>; // sole core↔React↔Zod contract

    interface VisibilityStore {
      subscribe(field: string, cb: () => void): () => void;
      getSnapshot(): VisibilityMap;
      setVisibility(next: VisibilityMap): void; // diff → notify only changed fields
    }

    interface Graph {
      edges: Map<string, Set<string>>;      // dependency → dependents
      reverse: Map<string, Set<string>>;    // dependent → dependencies
      topoOrder: string[];                  // throws GraphCycleError on cycle
    }

    interface FieldComponentProps { // a11y in the contract
      name: string; def: FieldDefinition;
      // component MUST wire: <label htmlFor>, aria-invalid, aria-describedby→error id,
      // role="alert"/aria-live="assertive" error region, and expose ref for focus mgmt
    }

## Accessibility Contract

Every field component MUST: associate `<label htmlFor>`; set `aria-invalid` from RHF error; link `aria-describedby` to an error element id; render errors in an `aria-live="assertive"` region. `FormEngine` focuses the first invalid field on failed submit. `TypeformLayout` supports Enter=next / Shift+Tab=prev keyboard nav and moves focus to the active field on step change; wizard exposes a progress indicator. A11y lives in the field-component contract, not per-demo.

## Testing Strategy

| Layer | What to Test | Approach |
|---|---|---|
| Unit (core) | graph build, cycle rejection (self + nested and/or refs), topo order, `evaluateCondition` compound, surgical `evaluateVisibility`, dynamic Zod skips hidden fields | Vitest, RED-first |
| Unit (store) | diff notifies only affected fields, snapshot stability | Vitest |
| Integration | change `tipoPersona` shows/hides; hidden field NOT validated on submit; array add/remove; wizard + Typeform on one engine | @testing-library/react |
| A11y | label association, aria-invalid, focus-on-error, Typeform keyboard nav | RTL + jest-dom |

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary. 100% frontend, in-browser interpreter.

## Migration / Rollout

No migration. Greenfield; staged conventional commits (Etapa 0–9), each leaving a green suite. Rollback = `git revert`/reset to last good stage.

## Open Questions

- [ ] Playground JSON persistence: proposal assumes ephemeral (no localStorage). Confirm or add draft persistence.
- [ ] A11y depth: basic a11y assumed, no formal WCAG audit gate. Confirm scope.
