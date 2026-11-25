const CACHE = 'travelpalau-guide-v6';
const scope = new URL(self.registration.scope);
const core = [
  'index.html', 'en.html', 'styles.css?v=trip-priorities', 'navigation.js?v=trip-mobile',
  'language.js?v=travel-access', 'palau-map.png',
  'assets/rock-islands.webp', 'assets/scenic-flight.webp', 'assets/milky-way.webp',
  'assets/jellyfish-lake.webp', 'assets/long-beach.webp', 'assets/big-drop-off.webp',
  'assets/german-channel.webp', 'assets/kayangel.webp', 'assets/nikko-bay.webp',
  'assets/ngardmau-waterfall.webp', 'assets/etpison-museum.jpg', 'assets/chandelier-cave.jpg',
  'assets/blue-corner.jpg', 'assets/blue-holes.jpg', 'assets/reef-shark.jpg', 'assets/giant-clam.jpg'
];
const coreUrls = new Set(core.map(path => new URL(path, scope).href));

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE)
    .then(cache => cache.addAll([...coreUrls].map(url => new Request(url, { cache: 'reload' }))))
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys
    .filter(key => key.startsWith('travelpalau-guide-') && key !== CACHE)
    .map(key => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== scope.origin || !url.pathname.startsWith(scope.pathname)) return;

  if (request.mode === 'navigate') {
    const path = url.pathname.slice(scope.pathname.length);
    if (!['', 'index.html', 'en.html'].includes(path)) return;
    const fallback = new URL(path || 'index.html', scope);
    event.respondWith(fetch(request).catch(async () => {
      const cache = await caches.open(CACHE);
      return await cache.match(fallback.href) || Response.error();
    }));
  } else if (coreUrls.has(url.href)) {
    event.respondWith(caches.open(CACHE).then(async cache => {
      return await cache.match(request) || fetch(request);
    }));
  }
});
