import { StrictMode, useState, lazy, Suspense, useCallback } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { DemoLanding } from './demos/index'

// Lazy-load heavy views so they stay in separate chunks
const Playground = lazy(() =>
  import('./playground/index').then((m) => ({ default: m.Playground })),
)
const About = lazy(() =>
  import('./about/About').then((m) => ({ default: m.About })),
)

type View = 'demos' | 'playground' | 'about'

const NAV_ITEMS: { id: View; label: string }[] = [
  { id: 'about', label: 'About' },
  { id: 'demos', label: 'Demos' },
  { id: 'playground', label: 'Playground' },
]

function App() {
  const [view, setView] = useState<View>('about')
  const [playgroundInitialSchema, setPlaygroundInitialSchema] = useState<string | null>(null)

  const handleTryExample = useCallback((schema: string) => {
    setPlaygroundInitialSchema(schema)
    setView('playground')
  }, [])

  return (
    <div>
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-6 shadow-sm">
        <strong className="text-lg font-semibold text-gray-900">Form Engine</strong>
        <nav className="flex items-center gap-1">
          {NAV_ITEMS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setView(id)}
              aria-current={view === id ? 'page' : undefined}
              className={`relative text-sm font-medium px-3 py-1.5 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 ${view === id ? 'text-indigo-600 bg-indigo-50' : 'text-gray-600 hover:text-indigo-600 hover:bg-gray-50'}`}
            >
              {label}
              {id === 'about' && view !== 'about' && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-indigo-500" />
              )}
            </button>
          ))}
        </nav>
      </header>

      <main className="bg-gray-50 min-h-[calc(100vh-57px)]">
        {view === 'about' && (
          <Suspense fallback={<div className="p-8 text-gray-500 text-sm">Loading…</div>}>
            <About onTryExample={handleTryExample} />
          </Suspense>
        )}
        {view === 'demos' && <DemoLanding />}
        {view === 'playground' && (
          <Suspense fallback={<div className="p-8 text-gray-500 text-sm">Loading playground...</div>}>
            <Playground initialSchema={playgroundInitialSchema} />
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
