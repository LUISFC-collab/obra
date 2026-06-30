/* Service worker — Parte de obra (Water Transition II)
   Hace que la app se guarde en el teléfono y abra SIN conexión (sin el dinosaurio),
   pero SIEMPRE trae la versión más nueva cuando hay internet (no se queda pegada).
   - Con internet: baja del servidor sin usar la caché del navegador (cache:'reload').
   - Sin internet: abre la versión guardada.
   - Las llamadas a Supabase (otra dirección) NO se interceptan. */
const CACHE = 'obra-v2';
const SHELL = ['./', './index.html', './config.js', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL).catch(() => {})));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;                 // POST/PATCH/DELETE (Supabase) -> red normal
  let url;
  try { url = new URL(req.url); } catch (_) { return; }
  if (url.origin !== self.location.origin) return;  // Supabase u otros orígenes -> red normal
  // Caparazón propio: SIEMPRE intenta la red fresca (sin caché del navegador) para traer
  // actualizaciones; si no hay internet, usa la copia guardada.
  e.respondWith(
    fetch(req, { cache: 'reload' })
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(req).then((r) => r || caches.match('./index.html')))
  );
});
