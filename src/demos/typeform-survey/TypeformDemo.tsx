// TypeformDemo — one-field-per-screen survey with keyboard navigation and progress bar.
import { useState } from 'react'
import { validateFormDefinition } from '../../engine/schema/meta-schema'
import { FormEngine } from '../../engine/react/FormEngine'
import surveySchemaRaw from './schema.json'

const surveySchema = validateFormDefinition(surveySchemaRaw)

export function TypeformDemo() {
  const [submitted, setSubmitted] = useState<Record<string, unknown> | null>(null)

  if (submitted) {
    return (
      <div>
        <h2>Encuesta Completada</h2>
        <pre>{JSON.stringify(submitted, null, 2)}</pre>
        <button type="button" onClick={() => setSubmitted(null)}>
          Nueva encuesta
        </button>
      </div>
    )
  }

  return (
    <div>
      <h2>Encuesta de Experiencia</h2>
      <FormEngine
        schema={surveySchema}
        layout="one-field-per-screen"
        onSubmit={(data) => setSubmitted(data)}
      />
    </div>
  )
}
