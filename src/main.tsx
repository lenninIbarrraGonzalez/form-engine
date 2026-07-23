import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

export function App() {
  return <div className="p-4"><h1>Form Engine MVP</h1></div>
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
