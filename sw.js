/* Pixel Isometric app-shell service worker. */
const CACHE = 'pixel-isometric-v3';
const APP_SHELL = [
  './',
  './index.html',
  './desert-builder.html',
  './jungle-builder.html',
  './snow-builder.html',
  './temperate-builder.html',
  './tile-editor.html',
  './site.webmanifest',
  './favicon.ico',
  './favicon.svg',
  './favicon-96x96.png',
  './apple-touch-icon.png',
  './web-app-manifest-192x192.png',
  './web-app-manifest-512x512.png',
  './css/scene-studio.css?v=3',
  './css/desert-builder.css?v=3',
  './css/world-builder.css?v=3',
  './js/register-sw.js',
  './js/scene-studio/app.js?v=3',
  './js/scene-studio/config.js',
  './js/scene-studio/structures.js',
  './js/scene-studio/textures.js',
  './js/scene-studio/tile-editor.js',
  './js/desert-builder/app.js?v=3',
  './js/world-builder/app.js?v=3',
  './js/world-builder/themes.js',
  './fonts/inter-normal.woff2',
  './fonts/press-start-2p-400.woff2'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

async function networkFirst(request) {
  const cache = await caches.open(CACHE);
  try {
    const response = await fetch(request);
    if (response && response.ok) cache.put(request, response.clone());
    return response;
  } catch (_) {
    return (await cache.match(request)) || (await cache.match('./index.html'));
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then(response => {
      if (response && response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);
  return cached || network || new Response('Offline', {
    status: 503,
    statusText: 'Offline',
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  });
}

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    request.mode === 'navigate'
      ? networkFirst(request)
      : staleWhileRevalidate(request)
  );
});
