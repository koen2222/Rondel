const CACHE = 'rondel-v27';
const ASSETS = [
  './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png',
  './art/apprentice.png', './art/archer.png', './art/boar.png', './art/cleric.png', './art/commander.png', './art/ghoul.png', './art/hellhound.png', './art/imp.png', './art/lupine.png', './art/necromancer.png', './art/pitlord.png', './art/runesmith.png', './art/scout.png', './art/skeleton.png', './art/squire.png', './art/warden.png', './art/weaver.png', './art/wyrmling.png'
];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS))); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => { e.respondWith(caches.match(e.request).then(r => r || fetch(e.request))); });
