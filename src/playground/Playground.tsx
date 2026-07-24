// Playground — split-panel layout: Monaco editor (left) + live FormEngine (right).
// Monaco is lazy-loaded so it lives in a separate Vite chunk.
import { useState, useCallback, useEffect, lazy, Suspense } from 'react'
import type { FormDefinition } from '../engine/schema/types'
import { FormEngine } from '../engine/react/FormEngine'
import { parseAndValidateSchema, type PlaygroundResult } from './playground-pipeline'
import creditSchemaRaw from '../demos/credit-application/schema.json'

// Lazy-load Monaco to keep it out of the main bundle
const MonacoEditor = lazy(() =>
  import('./MonacoEditor').then((m) => ({ default: m.MonacoEditor })),
)

// ---- Default starter schema ------------------------------------------

const DEFAULT_SCHEMA_STRING = JSON.stringify(creditSchemaRaw, null, 2)

// Parse the starter schema once at module load — reused by both initial states
// so the pipeline (parse → validate → build graph) doesn't run twice on mount.
const DEFAULT_RESULT = parseAndValidateSchema(DEFAULT_SCHEMA_STRING)

// ---- Debounce hook ---------------------------------------------------

function useDebounce<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(id)
  }, [value, delayMs])
  return debounced
}

// ---- Component -------------------------------------------------------

interface PlaygroundProps {
  initialSchema?: string | null
}

export function Playground({ initialSchema }: PlaygroundProps) {
  // Ephemeral: no localStorage, no persistence — resets on refresh
  const [editorText, setEditorText] = useState(initialSchema ?? DEFAULT_SCHEMA_STRING)
  const debouncedText = useDebounce(editorText, 300)

  const [result, setResult] = useState<PlaygroundResult>(DEFAULT_RESULT)
  const [validDefinition, setValidDefinition] = useState<FormDefinition | null>(
    DEFAULT_RESULT.ok ? DEFAULT_RESULT.definition : null,
  )
  const [submitted, setSubmitted] = useState<Record<string, unknown> | null>(null)

  // Re-parse whenever debounced text changes
  useEffect(() => {
    const r = parseAndValidateSchema(debouncedText)
    setResult(r)
    if (r.ok) {
      setValidDefinition(r.definition)
    }
    // On error: retain last valid definition (live form unchanged)
  }, [debouncedText])

  const handleEditorChange = useCallback((value: string) => {
    setEditorText(value)
  }, [])

  const hasError = !result.ok
  const errorMessage = hasError ? result.message : null
  const errorIssues = hasError && result.errorType === 'schema' ? result.issues : null

  return (
    <div className="flex h-screen">
      {/* Left panel — Monaco editor */}
      <div className="flex flex-col w-1/2 border-r border-gray-200">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 text-sm font-semibold text-gray-700">
          Schema Editor
        </div>
        <div className="flex-1 min-h-0">
          <Suspense fallback={<div className="p-4 text-sm text-gray-500">Loading editor...</div>}>
            <MonacoEditor value={editorText} onChange={handleEditorChange} />
          </Suspense>
        </div>
        {/* Inline error panel */}
        {hasError && (
          <div
            aria-live="polite"
            role="status"
            className="px-4 py-3 bg-red-50 border-t border-red-200 max-h-32 overflow-y-auto"
          >
            <p className="font-semibold text-red-600 mb-1 text-sm">
              {result.errorType === 'parse' && 'JSON Syntax Error'}
              {result.errorType === 'schema' && 'Schema Validation Error'}
              {result.errorType === 'cycle' && 'Dependency Cycle Detected'}
            </p>
            <p className="text-red-900 text-sm">{errorMessage}</p>
            {errorIssues && errorIssues.length > 0 && (
              <ul className="mt-1 pl-4 text-xs text-red-900 list-disc">
                {errorIssues.map((issue, i) => (
                  <li key={i}>
                    <code className="font-mono">{issue.path}</code>: {issue.message}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Right panel — live form preview */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="text-sm font-semibold text-gray-700 pb-3 mb-4 border-b border-gray-200">
          Live Preview
        </div>
        {validDefinition ? (
          <>
            <FormEngine
              key={JSON.stringify(validDefinition)}
              schema={validDefinition}
              onSubmit={(data) => setSubmitted(data)}
            />
            {submitted && (
              <div
                aria-live="polite"
                role="status"
                className="mt-6 rounded-md border border-green-200 bg-green-50 px-4 py-3"
              >
                <p className="text-sm font-semibold text-green-700 mb-1">Form submitted</p>
                <pre className="text-xs text-green-900 overflow-x-auto">
                  {JSON.stringify(submitted, null, 2)}
                </pre>
              </div>
            )}
          </>
        ) : (
          <p className="text-gray-400 text-sm">Enter a valid schema to preview the form.</p>
        )}
      </div>
    </div>
  )
}
