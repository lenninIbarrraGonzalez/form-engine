import { StrictMode, useState, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { DemoLanding } from './demos/index'

// Lazy-load Playground so Monaco stays in a separate chunk
const Playground = lazy(() =>
  import('./playground/index').then((m) => ({ default: m.Playground })),
)

type View = 'demos' | 'playground'

function App() {
  const [view, setView] = useState<View>('demos')

  return (
    <div>
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-6 shadow-sm">
        <strong className="text-lg font-semibold text-gray-900">Form Engine MVP</strong>
        <nav className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setView('demos')}
            aria-current={view === 'demos' ? 'page' : undefined}
            className={`text-sm font-medium px-3 py-1.5 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 ${view === 'demos' ? 'text-indigo-600 bg-indigo-50' : 'text-gray-600 hover:text-indigo-600 hover:bg-gray-50'}`}
          >
            Demos
          </button>
          <button
            type="button"
            onClick={() => setView('playground')}
            aria-current={view === 'playground' ? 'page' : undefined}
            className={`text-sm font-medium px-3 py-1.5 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 ${view === 'playground' ? 'text-indigo-600 bg-indigo-50' : 'text-gray-600 hover:text-indigo-600 hover:bg-gray-50'}`}
          >
            Playground
          </button>
        </nav>
      </header>

      <main className="bg-gray-50 min-h-[calc(100vh-57px)]">
        {view === 'demos' && <DemoLanding />}
        {view === 'playground' && (
          <Suspense fallback={<div className="p-8 text-gray-500 text-sm">Loading playground...</div>}>
            <Playground />
          </Suspense>
        )}
      </main>
    </div>
  )
}

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Form Engine failed to mount: no element with id "root" was found in the document.')
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
