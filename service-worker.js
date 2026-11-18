const STATIC_CACHE = 'yangmao-assistant-static-v22';
const RUNTIME_CACHE = 'yangmao-assistant-runtime-v22';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/detail.html',
  '/about.html',
  '/editorial-policy.html',
  '/terms.html',
  '/privacy.html',
  '/disclaimer.html',
  '/contact.html',
  '/robots.txt',
  '/sitemap.xml',
  '/manifest.webmanifest',
  '/assets/styles.css',
  '/assets/theme.css?v=20261118-mobileopt2',
  '/assets/radar.css?v=20261118-mobileopt5',
  '/assets/detail-v2.css?v=20261117-radar10',
  '/assets/app.js?v=20261118-overseas2',
  '/assets/detail.js?v=20261118-seo1',
  '/assets/privacy-consent.js?v=20261118-consent1',
  '/assets/privacy-consent.css?v=20261118-consent1',
  '/assets/mobile-back.js?v=20261118-back1',
  '/assets/mobile-back.css?v=20261118-back1',
  '/assets/miniprogram-qr.jpg',
  '/assets/wechat-contact-qr.jpg',
  '/assets/logo-lijianjin.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys
        .filter((key) => ![STATIC_CACHE, RUNTIME_CACHE].includes(key))
        .map((key) => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const cloned = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, cloned));
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          return cached || caches.match('/index.html');
        })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      return fetch(request).then((response) => {
        const cloned = response.clone();
        caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, cloned));
        return response;
      });
    })
  );
});
