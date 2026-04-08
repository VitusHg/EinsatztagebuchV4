const CACHE = 'einsatz-v1';
const ASSETS = ['/', '/index.html', '/styles.css', '/data.js', '/app.js', '/manifest.json', '/lights_on.svg', '/lights_off.svg'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
});

self.addEventListener('fetch', (e) => {
  e.respondWith(caches.match(e.request).then((r) => r || fetch(e.request)));
});
