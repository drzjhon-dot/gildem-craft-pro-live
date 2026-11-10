const CACHE='gildem-nova-9.0.0';
const ASSETS=['./','./index.html','./styles.css','./src/app.mjs','./src/catalog.mjs','./src/engine.mjs','./src/market.mjs','./src/store.mjs','./src/ui.mjs','./assets/crest.svg'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('gildem-nova-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{const u=new URL(event.request.url);if(event.request.method!=='GET'||u.origin!==location.origin||u.pathname.includes('/.netlify/'))return;event.respondWith(fetch(event.request).catch(()=>caches.match(event.request)));});
