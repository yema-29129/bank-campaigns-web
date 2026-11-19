const STATIC_CACHE = 'yangmao-assistant-static-v41';
const RUNTIME_CACHE = 'yangmao-assistant-runtime-v41';
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
  '/cooperation.html',
  '/robots.txt',
  '/sitemap.xml',
  '/manifest.webmanifest',
  '/assets/styles.css',
  '/assets/styles.css?v=20261118-price1',
  '/activities/styles.css?v=20261119-topiccards1',
  '/assets/theme.css?v=20261118-contactfix1',
  '/assets/radar.css?v=20261120-sharedmenu',
  '/assets/site-topic-menu.css?v=1',
  '/assets/site-topic-menu.js?v=1',
  '/assets/detail-v2.css?v=20261117-radar10',
  '/assets/app.js?v=20261120-sharedmenu',
  '/assets/detail.js?v=20261120-topicdetails1',
  '/assets/black-friday-pricing.js?v=20261118-price1',
  '/assets/privacy-consent.js?v=20261118-consent1',
  '/assets/privacy-consent.css?v=20261118-consent1',
  '/assets/mobile-back.js?v=20261118-back1',
  '/assets/mobile-back.css?v=20261118-back1',
  '/assets/contact.js?v=20261118-contactfix1',
  '/assets/topic-card-links.js?v=20261119-topiccards1',
  '/assets/group-wechat-qr.webp?v=20261118-contactfix1',
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

  const isWebsiteOfferSource =
    url.pathname === '/activities/overseas-catalog.json' ||
    url.pathname === '/activities/topics/black-friday-2026.html' ||
    url.pathname === '/activities/topics/travel-card-offers.html' ||
    url.pathname === '/activities/topics/dining-vouchers.html';
  if (request.mode === 'navigate' || isWebsiteOfferSource) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const cloned = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, cloned));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          return cached || (request.mode === 'navigate' ? caches.match('/index.html') : Response.error());
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
