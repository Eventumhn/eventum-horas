// Guarda la pantalla de inicio para que la app abra rápido.
// Los datos siempre vienen en vivo desde el servidor de Google.
const CACHE = 'eventum-horas-v6';
const ARCHIVOS = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-maskable-512.png', './apple-touch-icon.png', './favicon.png', './sinconexion.js?v=2', './notificaciones.js?v=1'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  // Primero la red (para recibir actualizaciones); si no hay conexión, la copia guardada.
  e.respondWith(
    fetch(e.request).then(r => {
      const copia = r.clone();
      caches.open(CACHE).then(c => c.put(e.request, copia));
      return r;
    }).catch(() => caches.match(e.request).then(r => r || caches.match('./index.html')))
  );
});

// Notificaciones: solicitud respondida (colaborador) o solicitud nueva (administrador)
self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (x) { d = { body: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(d.title || 'Eventum', {
    body: d.body || 'Tienes una novedad en Eventum.',
    icon: 'icon-192.png', badge: 'favicon.png', tag: d.tag || 'eventum', renotify: true, data: { url: './' }
  }));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cs => {
    for (const c of cs) { if ('focus' in c) return c.focus(); }
    return self.clients.openWindow('./');
  }));
});
