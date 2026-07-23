// Landing page for the form engine demos.
// Uses simple state toggle — no extra router dependency.
import { useState } from 'react'
import { CreditDemo } from './credit-application/CreditDemo'
import { InsuranceDemo } from './insurance-claim/InsuranceDemo'
import { TypeformDemo } from './typeform-survey/TypeformDemo'

type DemoId = 'credit' | 'insurance' | 'typeform' | null

const DEMOS: { id: DemoId; label: string }[] = [
  { id: 'credit', label: 'Solicitud de Crédito' },
  { id: 'insurance', label: 'Reclamación de Seguro' },
  { id: 'typeform', label: 'Encuesta Typeform' },
]

function DemoContent({ id }: { id: DemoId }) {
  switch (id) {
    case 'credit':
      return <CreditDemo />
    case 'insurance':
      return <InsuranceDemo />
    case 'typeform':
      return <TypeformDemo />
    default:
      return null
  }
}

export function DemoLanding() {
  const [activeDemo, setActiveDemo] = useState<DemoId>(null)

  return (
    <div>
      <header>
        <h1>Form Engine Demos</h1>
        <nav aria-label="Demo navigation">
          {DEMOS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveDemo(id)}
              aria-current={activeDemo === id ? 'page' : undefined}
            >
              {label}
            </button>
          ))}
        </nav>
      </header>

      <main>
        {activeDemo === null ? (
          <p>Select a demo above to get started.</p>
        ) : (
          <DemoContent id={activeDemo} />
        )}
      </main>
    </div>
  )
}
