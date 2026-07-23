// InsuranceDemo — single-page insurance claim form with deep conditionals.
import { useState } from 'react'
import { validateFormDefinition } from '../../engine/schema/meta-schema'
import { FormEngine } from '../../engine/react/FormEngine'
import insuranceSchemaRaw from './schema.json'

const insuranceSchema = validateFormDefinition(insuranceSchemaRaw)

export function InsuranceDemo() {
  const [submitted, setSubmitted] = useState<Record<string, unknown> | null>(null)

  if (submitted) {
    return (
      <div>
        <h2>Reclamación Enviada</h2>
        <pre>{JSON.stringify(submitted, null, 2)}</pre>
        <button type="button" onClick={() => setSubmitted(null)}>
          Nueva reclamación
        </button>
      </div>
    )
  }

  return (
    <div>
      <h2>Reclamación de Seguro</h2>
      <FormEngine
        schema={insuranceSchema}
        layout="flat"
        onSubmit={(data) => setSubmitted(data)}
      />
    </div>
  )
}
