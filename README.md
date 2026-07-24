# Form Engine

A declarative, JSON-driven form engine built with React and TypeScript. Define your entire form — fields, layout, conditional visibility, and validation — in a single JSON schema. The engine interprets it at runtime with zero code required from the consumer.

## Features

- **Schema-first**: one JSON document describes structure, rules, and layout
- **Conditional visibility**: `showIf` conditions with `and`/`or` composition; hidden fields are excluded from validation and submitted data
- **Three layout modes**: flat, multi-step wizard, and one-field-per-screen (Typeform-style)
- **Dynamic Zod validation**: the validation schema is rebuilt from the visibility state at submit time
- **Extensible field registry**: register custom field components at runtime
- **Accessible by contract**: every field component must wire `aria-invalid`, `aria-describedby`, and `aria-live` error regions; wizard exposes a progress indicator; keyboard navigation built in
- **Monaco playground**: live JSON editor with instant form preview and error reporting
- **168 tests across 18 suites** — Strict TDD, pure core tested independently of React

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 |
| Language | TypeScript 5.8 |
| Build | Vite 6 |
| Forms | React Hook Form 7 |
| Validation | Zod 3 |
| Styles | Tailwind CSS v4 |
| Editor | Monaco Editor (lazy-loaded) |
| Tests | Vitest + Testing Library |

## Architecture

The engine is structured as four decoupled layers:

```
JSON → [Layer 1: Meta-schema] → FormDefinition
                                      │
                              [Layer 2: Core — pure TS]
                         buildDependencyGraph → Graph
                         evaluateVisibility  → VisibilityMap
                         buildFormSchema     → ZodObject
                                      │
                              [Layer 3: Store]
                         VisibilityStore (useSyncExternalStore)
                                      │
                              [Layer 4: React]
                         FormEngine → FormRenderer → field components
```

The `VisibilityMap` (`Record<string, boolean>`) is the sole contract between the core and React. The renderer never imports Zod; the core never imports React.

### Conditional visibility

```jsonc
// Simple
{ "field": "tipoPersona", "operator": "equals", "value": "juridica" }

// Compound
{
  "and": [
    { "field": "employed", "operator": "equals", "value": true },
    { "or": [
      { "field": "income", "operator": "greaterThan", "value": 1000000 },
      { "field": "hasGuarantor", "operator": "equals", "value": true }
    ]}
  ]
}
```

Visibility is recomputed with a surgical BFS over transitive dependents of the changed field — O(affected), not O(schema).

## Getting Started

```bash
npm install
npm run dev        # development server
npm run test       # run the full test suite
npm run build      # production build
```

## Schema Reference

```jsonc
{
  "title": "Form title",
  "layout": "flat | wizard | one-field-per-screen",

  // Top-level fields (flat layout)
  "fields": [ /* FieldDefinition[] */ ],

  // Step-based fields (wizard / one-field-per-screen)
  "steps": [
    {
      "title": "Step title",
      "fields": [ /* FieldDefinition[] */ ]
    }
  ]
}
```

### FieldDefinition

```ts
interface FieldDefinition {
  name: string           // unique identifier (dot notation for nested fields)
  type: FieldType        // text | number | select | checkbox | file | group | array | tel
  label: string
  placeholder?: string
  showIf?: ShowIfCondition
  validations?: {
    required?: boolean
    min?: number
    max?: number
    minLength?: number
    maxLength?: number
    pattern?: string     // regex string
    minItems?: number    // for array fields
    maxItems?: number    // for array fields
  }
  items?: { label: string; value: string }[]  // for select
  fields?: FieldDefinition[]                   // for group / array item template
}
```

### Field Types

| Type | Description |
|---|---|
| `text` | Single-line text input |
| `number` | Numeric input with min/max validation |
| `select` | Dropdown from `items` list |
| `checkbox` | Boolean toggle |
| `tel` | Phone number input |
| `file` | File upload |
| `group` | Logical grouping of nested fields |
| `array` | Repeatable group with add/remove controls |

## Usage

```tsx
import { FormEngine } from './engine/react/FormEngine'
import schema from './my-schema.json'

function App() {
  return (
    <FormEngine
      schema={schema}
      layout="wizard"
      onSubmit={(data) => console.log(data)}
    />
  )
}
```

### Custom Field Types

```ts
import { registerField } from './engine/react/field-registry'

registerField('rating', RatingFieldComponent)
```

Custom field components receive `{ name, def }` and must implement the accessibility contract: `aria-invalid`, `aria-describedby` pointing to an error element, and an `aria-live="assertive"` error region.

## Demos

Three pre-built schemas ship with the project:

| Demo | Layout | Highlights |
|---|---|---|
| Credit Application | Wizard | Conditional NIT field, array of references, multi-step validation |
| Insurance Claim | Flat | Compound `and`/`or` conditions, file upload |
| Typeform Survey | One-field-per-screen | Enter=next, Shift+Tab=prev keyboard navigation |

## Playground

The live playground lets you edit any JSON schema and see the resulting form instantly. Validation errors in the schema are reported inline. The Monaco editor is route-split and loaded lazily to keep the main bundle lean.

## Project Structure

```
src/
├── engine/
│   ├── schema/        # types.ts, meta-schema.ts (Layer 1)
│   ├── core/          # dependency-graph, condition-evaluator, zod-builder (Layer 2)
│   ├── store/         # visibility-store (Layer 3)
│   └── react/         # FormEngine, FormRenderer, field registry, layouts, fields (Layer 4)
├── demos/             # credit-application, insurance-claim, typeform-survey
└── playground/        # Monaco editor + live pipeline
```

## License

MIT
