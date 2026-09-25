import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './theme/tokens.css'
import './index.css'
import App from './App.jsx'
import { registerSW } from 'virtual:pwa-register'

// A phone that keeps the app open (or installed as a PWA) only asks for a
// new build on a fresh load or once a day. Checking again whenever the app
// comes back to the foreground, and every 30 minutes meanwhile, gets every
// device onto the latest deploy within minutes; the controllerchange
// handler below then reloads once the new worker takes over.
const UPDATE_CHECK_MS = 30 * 60 * 1000;
registerSW({
  immediate: true,
  onRegisteredSW(_url, registration) {
    if (!registration) return;
    const check = () => registration.update().catch(() => {});
    setInterval(check, UPDATE_CHECK_MS);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') check();
    });
  }
});

// Every deploy renames the hashed chunks. A tab (or installed PWA) still
// running the previous bundle then fails to lazy-load a modal because the
// old chunk is gone from the server and from the service worker cache.
// Reloading once picks up the current index.html and its chunks. The guard
// is a timestamp, not a flag, so a tab that stays open across several
// deploys can recover each time while a reload that did not help (chunk
// still missing right after reloading) does not loop.
const PRELOAD_RELOAD_WINDOW_MS = 60 * 1000;
window.addEventListener('vite:preloadError', (event) => {
  const key = 'gymAppPreloadReload';
  let recentlyTried = false;
  try {
    const last = Number(sessionStorage.getItem(key));
    recentlyTried = last > 0 && Date.now() - last < PRELOAD_RELOAD_WINDOW_MS;
    sessionStorage.setItem(key, String(Date.now()));
  } catch {
    // Storage unavailable: still worth one reload attempt.
  }
  if (recentlyTried) return;
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
