// Offline-cache voor Schijfduel. Nieuwe cache-naam, zodat telefoons die nog het
// vorige spel (Rondel, cache 'rondel-v…') hadden, het oude weggooien.
const CACHE = 'schijfduel-v1';
const ASSETS = [
  './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png',
  './schijfduel/board.json', './schijfduel/vinyls.json',
  './schijfduel/proto/index.html', './schijfduel/proto/style.css', './schijfduel/proto/game.js',
  './schijfduel/proto/ai.js', './schijfduel/proto/voortgang.js', './schijfduel/proto/render.js', './schijfduel/proto/app.js',
  './art/skeleton.png', './art/apprentice.png', './art/lupine.png', './art/warden.png',
  './art/puca.png', './art/anzu.png', './art/peri.png', './art/morrigan.png'
];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS))); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => { e.respondWith(caches.match(e.request).then(r => r || fetch(e.request))); });
