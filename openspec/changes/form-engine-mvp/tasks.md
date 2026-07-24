# Tasks: Form Engine MVP

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~1 800–2 400 (10 stages × avg 180–240 lines) |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (Stages 0–3 core) → PR 2 (Stages 4–6 React layer) → PR 3 (Stages 7–9 demos + playground + deploy) |
| Delivery strategy | single-pr-default (single-PR if ≤ 400 lines; flagged over budget — chain required) |
| Chain strategy | stacked-to-main |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Scaffold + core engine (Stages 0–3) | PR 1 | `npm run test -- src/engine/core` | `npm run dev` smoke page | Revert all `src/engine/` and config files; no UI dep |
| 2 | React layer + schema (Stages 4–6) | PR 2 | `npm run test -- src/engine` | RTL integration suite | Revert `src/engine/react/` and `meta-schema.ts`; core untouched |
| 3 | Demos + playground + deploy (Stages 7–9) | PR 3 | `npm run test -- src/demos src/playground` | Full `npm run dev`, Vercel preview URL | Revert `src/demos/` and `src/playground/`; engine untouched |

---

## Stage 0 — Scaffold (~80 lines)

- [x] 0.1 Run `git init` in `/home/satanas/Documentos/formengine`; create `.gitignore` (node_modules, dist, .env).
- [x] 0.2 Scaffold Vite + React + TypeScript project: `npm create vite@latest . -- --template react-ts`; verify `package.json`.
- [x] 0.3 Install Tailwind CSS v4 via @tailwindcss/vite plugin; configure `src/index.css` with `@import "tailwindcss"`.
- [x] 0.4 Install Vitest + @testing-library/react + @testing-library/jest-dom: configure `vitest.config.ts` with jsdom environment and `setupFiles` for jest-dom matchers.
- [x] 0.5 Create folder structure: `src/engine/{schema,core,store,react/{fields,layouts}}/`, `src/demos/`, `src/playground/`.
- [x] 0.6 Write smoke test `src/engine/smoke.test.ts`: RED then GREEN; run `npm run test` and confirm green suite.
- [x] 0.7 Commit: `chore: scaffold vite + ts + tailwind + vitest`.

---

## Stage 1 — Dependency Graph Core (~160 lines)

**RED tests first, then implementation.**

- [x] 1.1 Create `src/engine/core/dependency-graph.test.ts`. Write RED tests:
  - Simple edge A → B recorded.
  - Compound `and`/`or` refs all become edges (A→C, B→C).
  - Array item dot-notation edge (`country → refs.phone`).
  - Self-cycle throws `CyclicDependencyError` with field name in message.
  - Indirect cycle A→B→C→A throws `CyclicDependencyError` with path in message.
  - Acyclic graph accepted and returned.
  - Topo order: A before B before C in `A→B→C` graph.
  - `getTransitiveDependents("A")` returns `[B, C]` for `A→B→C`.
- [x] 1.2 Create `src/engine/core/dependency-graph.ts`: export `buildDependencyGraph`, `getTopologicalOrder`, `getTransitiveDependents`, `CyclicDependencyError`. Make all RED tests GREEN. (Also added `fieldConditions` to DependencyGraph interface to support Stage 2.)
- [x] 1.3 Confirm `npm run test -- src/engine/core/dependency-graph` green. (11/11 passing)
- [x] 1.4 Commit: `feat(core): dependency graph with cycle detection`.

---

## Stage 2 — Condition Evaluator Core (~160 lines)

**RED tests first.**

- [x] 2.1 Create `src/engine/core/condition-evaluator.test.ts`. Write RED tests:
  - `equals` match returns `true`; no-match returns `false`.
  - `greaterThan` comparison returns `true`.
  - Field absent in values returns `false`.
  - Compound `and` — all true → `true`; one false → `false`.
  - Nested `or` inside `and` evaluated correctly.
  - `evaluateVisibility`: only transitive dependents of changed field are re-evaluated; unrelated field D copied unchanged.
  - `evaluateVisibility`: newly hidden field returns `false` in returned map.
  - `evaluateVisibility` is pure: input `current` map not mutated.
  - Dot-notation array item visibility: `refs.phone` computed via graph.
- [x] 2.2 Create `src/engine/core/condition-evaluator.ts`: export `evaluateCondition`, `evaluateVisibility`. Make all RED tests GREEN.
- [x] 2.3 Confirm `npm run test -- src/engine/core/condition-evaluator` green. (16/16 passing)
- [x] 2.4 Commit: `feat(core): condition evaluator with visibility map`.

---

## Stage 3 — Dynamic Zod Builder Core (~120 lines)

**RED tests first.**

- [x] 3.1 Create `src/engine/core/zod-builder.test.ts`. Write RED tests:
  - Visible `text` field with `required: true` maps to `z.string().min(1)`.
  - `pattern` constraint maps to `z.string().regex(...)`.
  - `number` with `min`/`max` maps to `z.number().min().max()`.
  - Hidden field (`visibility[name] = false`) excluded from schema — parse with `undefined` SUCCEEDS.
  - Visible required field — parse with `""` FAILS.
  - Visible array field with `minItems: 1` — parse with `[]` FAILS.
  - Hidden array field with `minItems: 1` — parse with `[]` SUCCEEDS.
  - `buildZodSchema` enforced no React/RHF imports via comment contract at file top.
- [x] 3.2 Create `src/engine/core/zod-builder.ts`: export `buildZodField`, `buildZodObject`, `buildZodSchema(definition, visibilityMap)`. No React imports. Make all RED tests GREEN.
- [x] 3.3 Confirm `npm run test -- src/engine/core/zod-builder` green. (12/12 passing)
- [x] 3.4 Commit: `feat(core): dynamic zod builder respecting visibility`.

---

## Stage 4 — Meta-Schema (~120 lines)

**RED tests first.**

- [x] 4.1 Create `src/engine/schema/types.ts`: export `FormDefinition`, `FieldDefinition`, `StepDefinition`, `ShowIfCondition`, `ValidationDef` TypeScript types. Supported field types: `text | number | select | checkbox | file | group | array | tel`.
- [x] 4.2 Create `src/engine/schema/meta-schema.test.ts`. Write RED tests:
  - Valid JSON passes `validateFormDefinition` and returns typed `FormDefinition`.
  - Missing `label` property throws `FormDefinitionError` with issue path.
  - Malformed / non-object input throws `FormDefinitionError` with top-level message.
  - Valid compound `showIf` (`and` with two conditions) accepted.
  - Invalid operator (`"isLike"`) throws `FormDefinitionError` identifying the bad operator.
  - Array field with `validations: { minItems: 1, maxItems: 3 }` accepted.
- [x] 4.3 Create `src/engine/schema/meta-schema.ts`: export `validateFormDefinition`, `FormDefinitionError` (with `issues: { path: string; message: string }[]`). Make all RED tests GREEN.
- [x] 4.4 Confirm `npm run test -- src/engine/schema` green. (16/16 passing)
- [x] 4.5 Commit: `feat(schema): runtime meta-schema validation`.

---

## Stage 5 — Visibility Store (~100 lines)

**RED tests first.**

- [x] 5.1 Create `src/engine/store/visibility-store.test.ts`. Write RED tests:
  - `subscribe` returns unsubscribe; after calling it, `setVisibility` does NOT invoke the callback.
  - `setVisibility` notifies all active subscribers exactly once.
  - `getSnapshot` returns same reference between writes (referential stability).
  - `getSnapshot` returns different reference after `setVisibility`.
  - `useFieldVisibility("A")` returns `true` when A absent from map.
  - `useFieldVisibility("B")` returns `false` when `VisibilityMap = { B: false }`.
  - Unaffected field wrapper does NOT re-render when only B's visibility changes (render-count spy).
- [x] 5.2 Create `src/engine/store/visibility-store.ts`: export `VisibilityStore` interface and `createVisibilityStore()` factory implementing `subscribe / getSnapshot / setVisibility`.
- [x] 5.3 Create `src/engine/react/useFieldVisibility.ts`: `useSyncExternalStore` hook returning `boolean`; defaults to `true` for missing keys.
- [x] 5.4 Confirm `npm run test -- src/engine/store` green (RTL for hook tests). (9+5=14 passing across store + hook)
- [x] 5.5 Commit: `feat(store): visibility store for useSyncExternalStore`.

---

## Stage 6 — React Layer (~400 lines)

**RED tests first (RTL integration).**

- [x] 6.1 Create `src/engine/react/fields/`: implement `TextField`, `NumberField`, `SelectField`, `TelField`, `ArrayField` (with `useFieldArray`, add/remove). `CheckboxField` and `FileField` handled as native fallbacks in FormRenderer. Each MUST wire `<label htmlFor>`, `aria-invalid`, `aria-describedby`, error region.
- [x] 6.2 Create `src/engine/react/field-registry.ts`: `registerField(type, component)` + `getField(type)` extension point.
- [x] 6.3 Create `src/engine/react/FormRenderer.tsx`: recursive dispatch by field type; handles `group` (recursive) and `array` (item template via renderFields prop); fallback for unknown types.
- [x] 6.4 Create `src/engine/react/FormEngine.tsx`: wire `useForm` (RHF) + `useMemo(buildDependencyGraph, [schema])` + `createVisibilityStore()` + custom resolver reading `store.getSnapshot()` at validate time. `watch` subscription calls `evaluateVisibility` → `store.setVisibility`. On failed submit, focus first invalid field (`setFocus`). Initial visibility pre-seeded to hide all showIf fields with empty values.
- [x] 6.5 Create `src/engine/react/layouts/WizardLayout.tsx`: step navigation, progress indicator, wraps `FormRenderer` per step.
- [x] 6.6 Create `src/engine/react/layouts/TypeformLayout.tsx`: one-field-per-screen, Enter=next, Shift+Tab=prev, focus active field on step change.
- [x] 6.7 Create `src/engine/react/FormEngine.test.tsx` (named test.tsx not integration.test.tsx). Write RED tests covering all required scenarios.
- [x] 6.8 Make all integration RED tests GREEN. (14/14 passing)
- [x] 6.9 Confirm full `npm run test` suite green. (84/84 passing)
- [x] 6.10 Commit: `feat(react): recursive renderer + form engine with rhf`.

---

## Stage 7 — Demo Schemas (~200 lines)

- [x] 7.1 Create `src/demos/credit-application/schema.json`: 3-step wizard; `tipoPersona` select (natural/juridica) with conditional `showIf` groups; `referencias` array (`minItems: 1, maxItems: 3`); `NIT` field shown only for juridica.
- [x] 7.2 Create `src/demos/credit-application/CreditDemo.tsx`: renders with `<FormEngine schema={creditSchema} layout="wizard" />`.
- [x] 7.3 Create `src/demos/insurance-claim/schema.json`: tipoSiniestro select (Vehiculo/Hogar/Vida); deep showIf conditionals; compound OR for danoEstimado; documentos array.
- [x] 7.4 Create `src/demos/insurance-claim/InsuranceDemo.tsx`: renders with `<FormEngine schema={insuranceSchema} layout="flat" />`.
- [x] 7.5 Create `src/demos/typeform-survey/schema.json`: 5-question survey with showIf for lenguajeFavorito; suitable for one-field-per-screen.
- [x] 7.6 Create `src/demos/typeform-survey/TypeformDemo.tsx`: renders with `<FormEngine schema={surveySchema} layout="one-field-per-screen" />`.
- [x] 7.7 Create demo schema tests: credit.test.ts, insurance.test.ts, survey.test.ts — pure engine tests (validateFormDefinition, buildDependencyGraph, evaluateCondition). Added layout prop to FormEngine + 4 integration tests in FormEngine.test.tsx.
- [x] 7.8 Confirm `npm run test -- src/demos` green. (25/25)
- [x] 7.9 Commit: `feat(demos): credit, insurance, typeform survey`.

---

## Stage 8 — Playground (~160 lines)

- [x] 8.1 Create `src/playground/Playground.tsx`: split-panel layout (Monaco left, live form right).
- [x] 8.2 Lazy-load Monaco via `React.lazy(() => import('./MonacoEditor'))` + `Suspense`; isolate to playground route chunk.
- [x] 8.3 Create `src/playground/MonacoEditor.tsx`: JSON language mode, debounced onChange (300 ms via useDebounce hook in Playground), default starter = credit.json.
- [x] 8.4 Wire debounced onChange via playground-pipeline.ts → parseAndValidateSchema. On error: inline panel with aria-live="polite"; retain last valid form.
- [x] 8.5 No localStorage/sessionStorage/IndexedDB — ephemeral state only (useState with default).
- [x] 8.6 Create `src/playground/playground-pipeline.test.ts`: 5 unit tests — valid schema, triangulation with 3 fields, parse error, schema error (missing label path), cycle error.
- [x] 8.7 Confirm `npm run test -- src/playground` green. (5/5)
- [x] 8.8 Commit: `feat(playground): monaco editor with live render`.

---

## Stage 9 — Build and Deploy (~40 lines)

- [x] 9.1 Run `npm run build`; zero TS errors and zero Vite build errors after fixing ArrayField useFieldArray cast + FormRenderer FieldError cast + meta-schema ShowIfConditionInput type.
- [x] 9.2 Monaco assets in separate chunk: `dist/assets/MonacoEditor-BI4vr2O5.js` (not in main bundle).
- [ ] 9.3 Connect repo to Vercel (or Netlify); set build command `npm run build`, output dir `dist`. (manual — skipped; no deploy credentials)
- [ ] 9.4 Deploy preview URL; smoke-test in browser. (manual — skipped)
- [x] 9.5 Full suite green after build: 12 test files, 118 tests passing.
- [x] 9.6 Commit: `chore: production build and deploy config`.

---

## Parallelism Notes

- Stages 0–3 are strictly sequential (each depends on prior types/contracts).
- Stage 4 (meta-schema) can start in parallel with Stage 3 once `types.ts` (4.1) is done.
- Stage 5 (store) has no dependency on Stages 3–4; it can proceed after Stage 2 types are defined.
- Stage 6 depends on Stages 3, 4, and 5 all being complete.
- Stages 7, 8 are independent of each other but both depend on Stage 6.
- Stage 9 depends on Stages 7 and 8.
