# Proposal: Form Engine MVP (portfolio, 100% frontend)

## Intent

Build a portfolio demo of a **declarative form engine**: an interpreter that turns a
JSON schema into a live form (fields, validation, conditionals, steps). Forms become
DATA, not hand-written JSX — change the JSON, change the form, no code changes. Value =
demonstrating deep architectural understanding of how a form engine works internally.
No backend, no persistence; deployable to Vercel/Netlify.

## Scope

### In Scope
- Stack: Vite + React + TypeScript + Vitest + Tailwind.
- Layer 1 — schema-as-contract: TS types + Zod meta-schema validating the JSON form definition at runtime.
- Layer 2 — pure engine core (NO React): dependency graph (cycle detection + topological order), condition evaluator (compound `and`/`or`, surgical re-eval → `VisibilityMap`), dynamic Zod builder that skips hidden fields.
- Layer 3 — own reactive store via `useSyncExternalStore` for **visibility only**.
- Layer 4 — React layer: extensible field-registry (type→component), recursive `FormRenderer`, `FormEngine` wiring RHF for values + Zod resolver reading the visibility snapshot.
- Reactivity via dependency graph, NOT global `watch()`. RHF owns VALUES; own store owns VISIBILITY.
- 3 demo schemas: credit application (3-step wizard, `tipoPersona` conditionals, references array), insurance claim (deep conditionals, mock doc upload), Typeform survey (one-field-per-screen, keyboard nav, progress bar).
- Playground: Monaco JSON editor left, live form right; inline errors for meta-schema violations and dependency cycles.

### Out of Scope
- Backend, auth, database, schema-persistence server.
- Visual drag-and-drop schema builder (JSON is edited as text).
- Save/load of user-authored schemas beyond the in-app playground session.

## Capabilities

### New Capabilities
- `schema-contract`: TS types + runtime Zod meta-schema validating form-definition JSON.
- `dependency-graph`: build graph from `showIf`, cycle detection, topological order.
- `condition-evaluator`: compound condition eval + surgical `VisibilityMap` computation.
- `dynamic-validation`: runtime Zod builder honoring visibility (hidden fields not validated).
- `visibility-store`: `useSyncExternalStore` contract notifying only affected fields.
- `form-renderer`: field-registry + recursive renderer + RHF wiring (`FormEngine`).
- `demo-schemas`: three interpreted schemas over one engine, incl. layout modes.
- `playground`: Monaco live-edit with inline meta-schema/cycle errors.

### Modified Capabilities
- None (greenfield).

## Approach

A form engine is an **interpreter**: parse JSON → validate (meta-schema) → compile to internal
graph → execute (render + validate + evaluate rules). Four layers decoupled by clean contracts;
the `VisibilityMap` is the single contract coupling dynamic Zod + condition evaluator. Reactive
flow: RHF change → `evaluateVisibility(graph, changedField)` → `VisibilityMap` → `visibility-store.setVisibility`
→ only affected field wrappers re-render via `useSyncExternalStore`. On submit, resolver rebuilds
Zod from current visibility, ignoring hidden fields. Strict TDD: core is pure and tested first
(~80% of tests). Delivered as 10 stages (0–9), each closing with tests + a conventional commit.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/engine/schema/` | New | `types.ts`, `meta-schema.ts` |
| `src/engine/core/` | New | `dependency-graph`, `condition-evaluator`, `zod-builder` (+ tests) |
| `src/engine/store/` | New | `visibility-store.ts` |
| `src/engine/react/` | New | `field-registry`, `FormEngine`, `FormRenderer`, `useFieldVisibility`, `fields/*` |
| `src/demos/` | New | 3 schemas + demo shells |
| `src/playground/` | New | Monaco editor + live render |
| root config | New | Vite, TS, Tailwind, Vitest, `git init` |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Core/React coupling leaks (renderer knows Zod) | Med | Enforce `VisibilityMap` as sole cross-contract; keep core React-free |
| Cycle detection misses nested `and`/`or` refs | Med | TDD edge cases first: compound refs, nested arrays, self-cycles |
| Hidden field still validates on submit | Med | Test "hidden field NOT validated" explicitly in `zod-builder` |
| Monaco bundle bloats build | Low | Lazy-load editor; keep playground route-split |

## Rollback Plan

Greenfield repo with staged conventional commits. Revert to the previous stage's commit;
each stage is autonomous and leaves a green test suite (stages 1–6). No data migration, no
external state — rollback is purely `git revert`/reset to the last good stage.

## Dependencies

- npm packages: react, react-hook-form, zod, @monaco-editor/react, tailwindcss, vitest, @testing-library/react.
- Node + Vite toolchain; Vercel/Netlify for deploy (Stage 9).

## Success Criteria

- [ ] `npm run test` green; core covers graph/conditionals/dynamic-Zod incl. hidden-field-not-validated and cycle-rejected.
- [ ] Changing `tipoPersona` shows/hides fields; references array add/remove works.
- [ ] Credit wizard (multi-step) and Typeform (keyboard nav) run on the same engine.
- [ ] Playground: edit `showIf` → live mutation; cycle → inline error; invalid JSON → meta-schema error.
- [ ] `npm run build` clean; deployed to Vercel/Netlify.

## Proposal question round

The approved plan resolves intent, scope, non-goals, and architecture. Optional confirmations
before spec (skip = accept assumptions as written):
1. Schema persistence: assumed **no localStorage save** of user-edited playground JSON (ephemeral session only). Confirm or request lightweight localStorage draft.
2. Accessibility depth: assumed **basic a11y** (labels, keyboard nav in Typeform) but no formal WCAG audit as a success criterion. Confirm scope.
3. i18n: assumed **English UI copy** with Spanish demo domain terms (`tipoPersona`, `referencias`) kept as-is. Confirm.
