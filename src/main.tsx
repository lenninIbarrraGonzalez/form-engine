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
      <header style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #e5e7eb', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <strong>Form Engine MVP</strong>
        <button
          type="button"
          onClick={() => setView('demos')}
          aria-current={view === 'demos' ? 'page' : undefined}
        >
          Demos
        </button>
        <button
          type="button"
          onClick={() => setView('playground')}
          aria-current={view === 'playground' ? 'page' : undefined}
        >
          Playground
        </button>
      </header>

      <main style={{ minHeight: 'calc(100vh - 49px)' }}>
        {view === 'demos' && <DemoLanding />}
        {view === 'playground' && (
          <Suspense fallback={<div style={{ padding: '2rem' }}>Loading playground...</div>}>
            <Playground />
          </Suspense>
        )}
      </main>
    </div>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
