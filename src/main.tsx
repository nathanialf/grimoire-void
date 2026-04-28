import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/global.css'
import { App } from './App'

// Filter the THREE.Clock deprecation warning emitted from R3F's internal
// frameloop. R3F still uses Clock until it migrates to Timer; this is a
// noise-only warning we can't fix from our side.
const _origWarn = console.warn.bind(console)
console.warn = (...args: unknown[]) => {
  const first = args[0]
  if (typeof first === 'string' && first.includes('THREE.Clock: This module has been deprecated')) {
    return
  }
  _origWarn(...args)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
