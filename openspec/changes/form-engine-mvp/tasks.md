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

- [ ] 0.1 Run `git init` in `/home/satanas/Documentos/formengine`; create `.gitignore` (node_modules, dist, .env).
- [ ] 0.2 Scaffold Vite + React + TypeScript project: `npm create vite@latest . -- --template react-ts`; verify `package.json`.
- [ ] 0.3 Install Tailwind CSS v3 + PostCSS: `npm install -D tailwindcss postcss autoprefixer`; run `npx tailwindcss init -p`; configure `tailwind.config.js` with `src/**` content glob.
- [ ] 0.4 Install Vitest + @testing-library/react + @testing-library/jest-dom: configure `vitest.config.ts` with jsdom environment and `setupFiles` for jest-dom matchers.
- [ ] 0.5 Create folder structure: `src/engine/{schema,core,store,react/{fields,layouts}}/`, `src/demos/`, `src/playground/`.
- [ ] 0.6 Write smoke test `src/engine/smoke.test.ts`: assert `1 + 1 === 2` — RED then GREEN; run `npm run test` and confirm green suite.
- [ ] 0.7 Commit: `chore: scaffold vite + ts + tailwind + vitest`.

---

## Stage 1 — Dependency Graph Core (~160 lines)

**RED tests first, then implementation.**

- [ ] 1.1 Create `src/engine/core/dependency-graph.test.ts`. Write RED tests:
  - Simple edge A → B recorded.
  - Compound `and`/`or` refs all become edges (A→C, B→C).
  - Array item dot-notation edge (`country → refs.phone`).
  - Self-cycle throws `CyclicDependencyError` with field name in message.
  - Indirect cycle A→B→C→A throws `CyclicDependencyError` with path in message.
  - Acyclic graph accepted and returned.
  - Topo order: A before B before C in `A→B→C` graph.
  - `getTransitiveDependents("A")` returns `[B, C]` for `A→B→C`.
- [ ] 1.2 Create `src/engine/core/dependency-graph.ts`: export `buildDependencyGraph`, `getTopologicalOrder`, `getTransitiveDependents`, `CyclicDependencyError`. Make all RED tests GREEN.
- [ ] 1.3 Confirm `npm run test -- src/engine/core/dependency-graph` green.
- [ ] 1.4 Commit: `feat(core): dependency graph with cycle detection`.

---

## Stage 2 — Condition Evaluator Core (~160 lines)

**RED tests first.**

- [ ] 2.1 Create `src/engine/core/condition-evaluator.test.ts`. Write RED tests:
  - `equals` match returns `true`; no-match returns `false`.
  - `greaterThan` comparison returns `true`.
  - Field absent in values returns `false`.
  - Compound `and` — all true → `true`; one false → `false`.
  - Nested `or` inside `and` evaluated correctly.
  - `evaluateVisibility`: only transitive dependents of changed field are re-evaluated; unrelated field D copied unchanged.
  - `evaluateVisibility`: newly hidden field returns `false` in returned map.
  - `evaluateVisibility` is pure: input `current` map not mutated.
  - Dot-notation array item visibility: `referencias.0.telefono` computed per index.
- [ ] 2.2 Create `src/engine/core/condition-evaluator.ts`: export `evaluateCondition`, `evaluateVisibility`. Make all RED tests GREEN.
- [ ] 2.3 Confirm `npm run test -- src/engine/core/condition-evaluator` green.
- [ ] 2.4 Commit: `feat(core): condition evaluator with visibility map`.

---

## Stage 3 — Dynamic Zod Builder Core (~120 lines)

**RED tests first.**

- [ ] 3.1 Create `src/engine/core/zod-builder.test.ts`. Write RED tests:
  - Visible `text` field with `required: true` maps to `z.string().min(1)`.
  - `pattern` constraint maps to `z.string().regex(...)`.
  - `number` with `min`/`max` maps to `z.number().min().max()`.
  - Hidden field (`visibility[name] = false`) excluded from schema — parse with `undefined` SUCCEEDS.
  - Visible required field — parse with `""` FAILS.
  - Visible array field with `minItems: 1` — parse with `[]` FAILS.
  - Hidden array field with `minItems: 1` — parse with `[]` SUCCEEDS.
  - `buildZodSchema` import graph has no `react`, `react-hook-form`, or store imports (static assertion via `import.meta` or comment-enforced lint rule).
- [ ] 3.2 Create `src/engine/core/zod-builder.ts`: export `buildZodField`, `buildZodObject`, `buildZodSchema(definition, visibilityMap)`. No React imports allowed. Make all RED tests GREEN.
- [ ] 3.3 Confirm `npm run test -- src/engine/core/zod-builder` green.
- [ ] 3.4 Commit: `feat(core): dynamic zod builder respecting visibility`.

---

## Stage 4 — Meta-Schema (~120 lines)

**RED tests first.**

- [ ] 4.1 Create `src/engine/schema/types.ts`: export `FormDefinition`, `FieldDefinition`, `StepDefinition`, `ShowIfCondition`, `ValidationDef` TypeScript types. Supported field types: `text | number | select | checkbox | file | group | array | tel`.
- [ ] 4.2 Create `src/engine/schema/meta-schema.test.ts`. Write RED tests:
  - Valid JSON passes `validateFormDefinition` and returns typed `FormDefinition`.
  - Missing `label` property throws `FormDefinitionError` with issue path.
  - Malformed / non-object input throws `FormDefinitionError` with top-level message.
  - Valid compound `showIf` (`and` with two conditions) accepted.
  - Invalid operator (`"isLike"`) throws `FormDefinitionError` identifying the bad operator.
  - Array field with `validations: { minItems: 1, maxItems: 3 }` accepted.
- [ ] 4.3 Create `src/engine/schema/meta-schema.ts`: export `validateFormDefinition`, `FormDefinitionError` (with `issues: { path: string; message: string }[]`). Make all RED tests GREEN.
- [ ] 4.4 Confirm `npm run test -- src/engine/schema` green.
- [ ] 4.5 Commit: `feat(schema): runtime meta-schema validation`.

---

## Stage 5 — Visibility Store (~100 lines)

**RED tests first.**

- [ ] 5.1 Create `src/engine/store/visibility-store.test.ts`. Write RED tests:
  - `subscribe` returns unsubscribe; after calling it, `setVisibility` does NOT invoke the callback.
  - `setVisibility` notifies all active subscribers exactly once.
  - `getSnapshot` returns same reference between writes (referential stability).
  - `getSnapshot` returns different reference after `setVisibility`.
  - `useFieldVisibility("A")` returns `true` when A absent from map.
  - `useFieldVisibility("B")` returns `false` when `VisibilityMap = { B: false }`.
  - Unaffected field wrapper does NOT re-render when only B's visibility changes (render-count spy).
- [ ] 5.2 Create `src/engine/store/visibility-store.ts`: export `VisibilityStore` interface and `createVisibilityStore()` factory implementing `subscribe / getSnapshot / setVisibility`.
- [ ] 5.3 Create `src/engine/react/useFieldVisibility.ts`: `useSyncExternalStore` hook returning `boolean`; defaults to `true` for missing keys.
- [ ] 5.4 Confirm `npm run test -- src/engine/store` green (RTL for hook tests).
- [ ] 5.5 Commit: `feat(store): visibility store for useSyncExternalStore`.

---

## Stage 6 — React Layer (~400 lines)

**RED tests first (RTL integration).**

- [ ] 6.1 Create `src/engine/react/fields/`: implement `TextField`, `NumberField`, `SelectField`, `CheckboxField`, `FileField`, `TelField`, `ArrayField` (with `useFieldArray`, add/remove, keyboard-accessible controls, focus-to-new-item on add). Each component MUST wire `<label htmlFor>`, `aria-invalid`, `aria-describedby`, `aria-live="polite"` error region.
- [ ] 6.2 Create `src/engine/react/field-registry.ts`: `FieldRegistry` object + `registerField(type, component)` extension point. Register all built-in types.
- [ ] 6.3 Create `src/engine/react/FormRenderer.tsx`: recursive dispatch by registry; handles `group` (recursive) and `array` (item template recursion); renders fallback error boundary for unknown types.
- [ ] 6.4 Create `src/engine/react/FormEngine.tsx`: wire `useForm` (RHF) + `useMemo(buildDependencyGraph, [schema])` + `createVisibilityStore()` + custom zodResolver reading `store.getSnapshot()` at validate time. Field `onChange` calls `evaluateVisibility` → `store.setVisibility`. On failed submit, focus first invalid field (`setFocus`).
- [ ] 6.5 Create `src/engine/react/layouts/WizardLayout.tsx`: step navigation, progress indicator, wraps `FormRenderer` per step.
- [ ] 6.6 Create `src/engine/react/layouts/TypeformLayout.tsx`: one-field-per-screen, Enter=next, Shift+Tab=prev, focus active field on step change, wraps `FormRenderer`.
- [ ] 6.7 Create `src/engine/react/FormEngine.integration.test.tsx`. Write RED tests:
  - Changing `tipoPersona` to `"juridica"` shows juridica fields, hides natural fields.
  - Submit with hidden required field B (A = "no") succeeds without B error.
  - Array add increases item count; array remove decreases item count; focus moves to first input of new item.
  - Submit invalid visible field shows error with `aria-invalid="true"` and `aria-describedby`.
  - Label `htmlFor` matches input `id` for a visible text field.
  - Error region has `aria-live`.
  - TypeformLayout: Enter key advances to next field and moves focus.
- [ ] 6.8 Make all integration RED tests GREEN.
- [ ] 6.9 Confirm full `npm run test` suite green.
- [ ] 6.10 Commit: `feat(react): recursive renderer + form engine with rhf`.

---

## Stage 7 — Demo Schemas (~200 lines)

- [ ] 7.1 Create `src/demos/credit-application/schema.json`: 3-step wizard; `tipoPersona` select (natural/juridica) with conditional `showIf` groups; `referencias` array (`minItems: 1, maxItems: 3`); `NIT` field shown only for juridica.
- [ ] 7.2 Create `src/demos/credit-application/CreditDemo.tsx`: renders with `<FormEngine schema={creditSchema} layout="wizard" />`.
- [ ] 7.3 Create `src/demos/insurance-claim/schema.json`: `claimType` select (theft/accident); two subforms gated by deep `showIf`; one `type: "file"` field (mock, no upload).
- [ ] 7.4 Create `src/demos/insurance-claim/InsuranceDemo.tsx`: renders with `<FormEngine schema={insuranceSchema} layout="flat" />`.
- [ ] 7.5 Create `src/demos/typeform-survey/schema.json`: 5-question survey, no `showIf` required; suitable for one-field-per-screen.
- [ ] 7.6 Create `src/demos/typeform-survey/TypeformDemo.tsx`: renders with `<FormEngine schema={surveySchema} layout="one-field-per-screen" />`, includes progress bar.
- [ ] 7.7 Create demo smoke tests in `src/demos/*.test.tsx`: tipoPersona toggle shows/hides juridica fields; claimType toggle shows theft fields; TypeformLayout renders exactly one field on mount; progress bar shows `0/5` initially.
- [ ] 7.8 Confirm `npm run test -- src/demos` green.
- [ ] 7.9 Commit: `feat(demos): credit, insurance, typeform survey`.

---

## Stage 8 — Playground (~160 lines)

- [ ] 8.1 Create `src/playground/PlaygroundPage.tsx`: split-panel layout (Monaco left, live form right); desktop ≥ 1024 px both panels visible without scroll.
- [ ] 8.2 Lazy-load Monaco via `React.lazy(() => import('./MonacoEditor'))` + `Suspense`; isolate to playground route chunk.
- [ ] 8.3 Create `src/playground/MonacoEditor.tsx`: JSON language mode, debounced `onChange` (300 ms), controlled by `defaultStarterSchema` string constant.
- [ ] 8.4 Wire debounced onChange to `validateFormDefinition` → `buildDependencyGraph`. On success: update live form. On `FormDefinitionError` or `CyclicDependencyError`: display inline error panel (path + message list) in `aria-live="polite"` region; retain last valid form.
- [ ] 8.5 Ensure no `localStorage`, `sessionStorage`, or `IndexedDB` writes anywhere in playground code; refresh resets to `defaultStarterSchema`.
- [ ] 8.6 Create `src/playground/Playground.test.tsx`. Tests:
  - Valid edit updates live form (new field appears).
  - Unclosed JSON shows parse error in inline panel; live form unchanged.
  - Field missing `label` shows structured issue with path.
  - Cycle in `showIf` shows `CyclicDependencyError` message; live form not updated.
  - Error panel element has `aria-live="polite"`.
- [ ] 8.7 Confirm `npm run test -- src/playground` green.
- [ ] 8.8 Commit: `feat(playground): monaco editor with live render`.

---

## Stage 9 — Build and Deploy (~40 lines)

- [ ] 9.1 Run `npm run build`; verify zero TypeScript errors and zero Vite build errors.
- [ ] 9.2 Inspect build output: confirm Monaco assets in separate chunk not in main entry bundle.
- [ ] 9.3 Connect repo to Vercel (or Netlify); set build command `npm run build`, output dir `dist`.
- [ ] 9.4 Deploy preview URL; smoke-test credit demo, insurance demo, Typeform survey, and playground in browser.
- [ ] 9.5 Confirm `npm run test` full suite still green after build verification.
- [ ] 9.6 Commit: `chore: production build and deploy`.

---

## Parallelism Notes

- Stages 0–3 are strictly sequential (each depends on prior types/contracts).
- Stage 4 (meta-schema) can start in parallel with Stage 3 once `types.ts` (4.1) is done.
- Stage 5 (store) has no dependency on Stages 3–4; it can proceed after Stage 2 types are defined.
- Stage 6 depends on Stages 3, 4, and 5 all being complete.
- Stages 7, 8 are independent of each other but both depend on Stage 6.
- Stage 9 depends on Stages 7 and 8.
