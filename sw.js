/* Heppekort: gemmer alle filer på telefonen, så appen virker uden net. Skift versionsnummeret ved opdatering. */
const CACHE = 'heppekort-v1';
const CORE = ['./', './index.html', './map.jpg', './leaflet.js'];
const EXTRA = ['./manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png',
  './Skovmaren2026_Halvmaren.gpx', './Skovmaren2026_Halvmaren_til-loeberen.gpx', './Skovmaren2026_Heppe-rute.gpx'];
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(CORE.map(u => new Request(u, { cache: 'reload' })));
    await Promise.allSettled(EXTRA.map(u => cache.add(new Request(u, { cache: 'reload' }))));
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k);
    await self.clients.claim();
    for (const c of await self.clients.matchAll({ type: 'window' })) c.postMessage('cached');
  })());
});
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (req.mode === 'navigate' && (url.pathname.endsWith('/') || url.pathname.endsWith('/index.html'))) {
    event.respondWith((async () => (await caches.match('./index.html')) || fetch(req))());
    return;
  }
  event.respondWith((async () => {
    const hit = await caches.match(req, { ignoreSearch: true });
    if (hit) return hit;
    const res = await fetch(req);
    if (res && res.ok) { const c = await caches.open(CACHE); c.put(req, res.clone()); }
    return res;
  })());
});
