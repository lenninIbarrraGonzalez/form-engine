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

export function Playground() {
  // Ephemeral: no localStorage, no persistence — resets on refresh
  const [editorText, setEditorText] = useState(DEFAULT_SCHEMA_STRING)
  const debouncedText = useDebounce(editorText, 300)

  const [result, setResult] = useState<PlaygroundResult>(() =>
    parseAndValidateSchema(DEFAULT_SCHEMA_STRING),
  )
  const [validDefinition, setValidDefinition] = useState<FormDefinition | null>(() => {
    const r = parseAndValidateSchema(DEFAULT_SCHEMA_STRING)
    return r.ok ? r.definition : null
  })

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
    <div style={{ display: 'flex', height: '100vh', gap: '0' }}>
      {/* Left panel — Monaco editor */}
      <div style={{ flex: '0 0 50%', display: 'flex', flexDirection: 'column', borderRight: '1px solid #e5e7eb' }}>
        <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #e5e7eb', fontWeight: 600 }}>
          Schema Editor
        </div>
        <div style={{ flex: 1 }}>
          <Suspense fallback={<div style={{ padding: '1rem' }}>Loading editor...</div>}>
            <MonacoEditor value={editorText} onChange={handleEditorChange} />
          </Suspense>
        </div>
        {/* Inline error panel */}
        {hasError && (
          <div
            aria-live="polite"
            role="status"
            style={{
              padding: '0.75rem 1rem',
              background: '#fef2f2',
              borderTop: '1px solid #fecaca',
              maxHeight: '8rem',
              overflowY: 'auto',
            }}
          >
            <p style={{ fontWeight: 600, color: '#dc2626', marginBottom: '0.25rem' }}>
              {result.errorType === 'parse' && 'JSON Syntax Error'}
              {result.errorType === 'schema' && 'Schema Validation Error'}
              {result.errorType === 'cycle' && 'Dependency Cycle Detected'}
            </p>
            <p style={{ color: '#7f1d1d', fontSize: '0.875rem' }}>{errorMessage}</p>
            {errorIssues && errorIssues.length > 0 && (
              <ul style={{ marginTop: '0.25rem', paddingLeft: '1rem', fontSize: '0.8rem', color: '#7f1d1d' }}>
                {errorIssues.map((issue, i) => (
                  <li key={i}>
                    <code>{issue.path}</code>: {issue.message}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Right panel — live form preview */}
      <div style={{ flex: '1', overflowY: 'auto', padding: '1rem' }}>
        <div style={{ marginBottom: '0.75rem', fontWeight: 600, borderBottom: '1px solid #e5e7eb', paddingBottom: '0.75rem' }}>
          Live Preview
        </div>
        {validDefinition ? (
          <FormEngine
            key={JSON.stringify(validDefinition)}
            schema={validDefinition}
            onSubmit={(data) => console.log('Playground submit:', data)}
          />
        ) : (
          <p style={{ color: '#6b7280' }}>Enter a valid schema to preview the form.</p>
        )}
      </div>
    </div>
  )
}
