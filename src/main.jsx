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

// The PWA service worker updates itself in the background, but the page
// that was already open keeps running the old bundle until it reloads. When
// a new worker takes control, ask the app to reload: useWorkoutPlan listens
// for gym:app-update-ready, flushes any unsaved edit first and reloads only
// once nothing is pending. If no listener claims the event (sign-in screen,
// error screen), reload right away.
if (typeof navigator !== 'undefined' && navigator.serviceWorker) {
  let hadController = Boolean(navigator.serviceWorker.controller);
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController) {
      hadController = true;
      return;
    }
    const request = new CustomEvent('gym:app-update-ready', { cancelable: true });
    const claimed = !window.dispatchEvent(request);
    if (!claimed) window.location.reload();
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
