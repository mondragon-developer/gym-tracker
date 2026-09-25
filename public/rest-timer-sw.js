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
