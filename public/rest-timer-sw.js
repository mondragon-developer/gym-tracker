// Loaded into the generated service worker (workbox importScripts in
// vite.config.js). Tapping the end-of-rest notification brings the app
// forward; RestTimer then shows the full-screen alert, or restores it from
// its saved end time if the phone had discarded the page.
self.addEventListener('notificationclick', (event) => {
  if (event.notification.tag !== 'rest-timer') return;
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
      const open = windows.find((w) => 'focus' in w);
      return open ? open.focus() : self.clients.openWindow('/');
    })
  );
});

// Server push from supabase/functions/rest-timer-push. Every push must show
// a notification: iOS drops the subscription of a site that receives pushes
// without showing one.
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = {};
  }
  event.waitUntil(
    self.registration.showNotification(data.title || "Let's go!", {
      body: data.body || '',
      tag: data.tag || 'rest-timer',
      renotify: true,
      requireInteraction: true,
      vibrate: [400, 150, 400, 150, 400],
      icon: '/pwa-icon.jpeg'
    })
  );
});
