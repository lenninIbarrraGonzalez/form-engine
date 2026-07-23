// CreditDemo — 3-step credit application wizard.
import { useState } from 'react'
import { validateFormDefinition } from '../../engine/schema/meta-schema'
import { FormEngine } from '../../engine/react/FormEngine'
import creditSchemaRaw from './schema.json'

const creditSchema = validateFormDefinition(creditSchemaRaw)

export function CreditDemo() {
  const [submitted, setSubmitted] = useState<Record<string, unknown> | null>(null)

  if (submitted) {
    return (
      <div>
        <h2>Solicitud Enviada</h2>
        <pre>{JSON.stringify(submitted, null, 2)}</pre>
        <button type="button" onClick={() => setSubmitted(null)}>
          Nueva solicitud
        </button>
      </div>
    )
  }

  return (
    <div>
      <h2>Solicitud de Crédito</h2>
      <FormEngine
        schema={creditSchema}
        layout="wizard"
        onSubmit={(data) => setSubmitted(data)}
      />
    </div>
  )
}
