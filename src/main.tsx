import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import ErrorBoundary from './components/ErrorBoundary.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)

// Dismiss the native boot loader (see index.html) once React has mounted.
// Minimum display keeps the game-tile animation from flashing; ?loader=1 keeps it (debug).
declare global { interface Window { __bootStart?: number; __bootKeep?: boolean; __bootShow?: boolean } }
const bootEl = document.getElementById('boot-loader')
if (bootEl && !bootEl.hidden && !window.__bootKeep) {
  const start = window.__bootStart || Date.now()
  // ~1.8s minimum: the tile animation (staggered to 540ms) needs room to play
  // out before the game screen appears. At the old 900ms the loader flashed by.
  const wait = Math.max(0, 1800 - (Date.now() - start))
  window.setTimeout(() => {
    bootEl.classList.add('boot-out')
    window.setTimeout(() => bootEl.remove(), 320)
  }, wait)
}
