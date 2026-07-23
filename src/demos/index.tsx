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
      <header className="px-6 py-8 bg-white border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Form Engine Demos</h1>
        <nav aria-label="Demo navigation" className="flex gap-2 flex-wrap">
          {DEMOS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveDemo(id)}
              aria-current={activeDemo === id ? 'page' : undefined}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${activeDemo === id ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {label}
            </button>
          ))}
        </nav>
      </header>

      <main className="px-6 py-8 max-w-2xl">
        {activeDemo === null ? (
          <p className="text-gray-500 text-sm">Select a demo above to get started.</p>
        ) : (
          <DemoContent id={activeDemo} />
        )}
      </main>
    </div>
  )
}
