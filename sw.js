const CACHE = 'jasvi-pwa-phase6-v1.2.2-attached';
const SHELL = [
  'index.html', 'styles.css', 'config.js', 'source-contract.js', 'source-domain.js', 'source-port-ui.js', 'app.js', 'manifest.webmanifest', 'source-provenance.json',
  'icons/icon-192.svg', 'icons/icon-512.svg', 'icons/icon-maskable.svg',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png'
];
const scope = new URL(self.registration.scope);
const shellURLs = new Set(SHELL.map(path => new URL(path, scope).href));
const indexURL = new URL('index.html', scope).href;
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll([...shellURLs])));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(key => key.startsWith('jasvi-pwa-phase6-') && key !== CACHE)
      .map(key => caches.delete(key))
  )).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== scope.origin ||
      request.headers.has('Authorization')) return;
  // Cache only the public shell, never ERP responses or unknown paths.
  const entry = request.mode === 'navigate' &&
    (url.pathname === scope.pathname || url.pathname === new URL(indexURL).pathname);
  if (!entry && !shellURLs.has(url.href)) return;
  event.respondWith(caches.open(CACHE).then(async cache => {
    const cached = await cache.match(entry ? indexURL : request);
    return cached || fetch(request);
  }));
});
