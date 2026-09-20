import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Every deploy renames the hashed chunks. A tab (or installed PWA) still
// running the previous bundle then fails to lazy-load a modal because the
// old chunk is gone from the server and from the service worker cache.
// Reloading once picks up the current index.html and its chunks.
window.addEventListener('vite:preloadError', (event) => {
  const key = 'gymAppPreloadReload';
  let alreadyTried = false;
  try {
    alreadyTried = sessionStorage.getItem(key) === '1';
    sessionStorage.setItem(key, '1');
  } catch {
    // Storage unavailable: still worth one reload attempt.
  }
  if (alreadyTried) return;
  event.preventDefault();
  window.location.reload();
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
