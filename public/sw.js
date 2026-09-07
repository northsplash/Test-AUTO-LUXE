const CACHE = 'north-splash-site-v11-careers';
const SHELL = ['/', '/index.html', '/manifest.webmanifest', '/ns-auto-luxe-full-logo.png', '/icon-192.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

function looksLikeHtml(response) {
  return (response.headers.get('content-type') || '').includes('text/html');
}

function missingAsset() {
  return new Response('/* missing asset */', {
    status: 404,
    headers: { 'Content-Type': 'application/javascript; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  if (req.mode === 'navigate' || req.destination === 'document') {
    event.respondWith(
      fetch(req)
        .then((r) => {
          if (r.ok && looksLikeHtml(r)) {
            const copy = r.clone();
            caches.open(CACHE).then((c) => c.put('/index.html', copy));
          }
          return r;
        })
        .catch(() => caches.match('/index.html').then((cached) => cached || new Response('Offline', { status: 503 })))
    );
    return;
  }

  if (['script', 'style', 'worker'].includes(req.destination) || url.pathname.startsWith('/assets/')) {
    event.respondWith(
      fetch(req)
        .then((r) => {
          if (!r.ok || looksLikeHtml(r)) return missingAsset();
          const copy = r.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
          return r;
        })
        .catch(() => caches.match(req).then((cached) => (cached && !looksLikeHtml(cached) ? cached : missingAsset())))
    );
  }
});
