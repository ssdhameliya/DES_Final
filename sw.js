const CACHE='jasvi-pwa-shell-v1.0.0-uat.2';
const BASE=new URL('./',self.location.href).pathname;
const asset=p=>new URL(p,self.location.href).pathname;
const SHELL=['./','index.html','styles.css','config.js','app.js','manifest.webmanifest','icons/icon-192.svg','icons/icon-512.svg','icons/apple-touch-icon.png','icons/icon-maskable.svg'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(e.request.method!=='GET'||u.origin!==self.location.origin)return;
  e.respondWith(fetch(e.request).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return r}).catch(()=>caches.match(e.request).then(r=>r||caches.match(asset('index.html')))));
});
