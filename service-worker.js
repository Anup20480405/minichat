/* MiniChat v3.2 - network-first app shell, offline fallback for previously opened pages. */
const CACHE_NAME="minichat-pwa-3.2.0";
const APP_FILES=["./","./index.html","./manifest.webmanifest","./icons/icon-192.png","./icons/icon-512.png","./icons/icon-180.png","./splash/splash-1170x2532.png","./splash/splash-1290x2796.png"];
self.addEventListener("install",event=>{
  event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(APP_FILES)).then(()=>self.skipWaiting()));
});
self.addEventListener("activate",event=>{
  event.waitUntil(Promise.all([caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith("minichat-pwa-")&&key!==CACHE_NAME).map(key=>caches.delete(key)))),self.clients.claim()]));
});
self.addEventListener("message",event=>{if(event.data?.type==="SKIP_WAITING")self.skipWaiting();});
self.addEventListener("fetch",event=>{
  const req=event.request;
  if(req.method!=="GET")return;
  const url=new URL(req.url);
  if(url.origin!==self.location.origin)return; // Firebase requests must go to the network.
  if(url.pathname.endsWith("/version.json"))return; // Always check version live.
  event.respondWith((async()=>{
    try{
      const res=await fetch(req,{cache:"no-store"});
      if(res.ok){const cache=await caches.open(CACHE_NAME);await cache.put(req,res.clone());}
      return res;
    }catch(err){
      const hit=await caches.match(req,{ignoreSearch:true});
      if(hit)return hit;
      if(req.mode==="navigate"){
        const shell=await caches.match(new URL("./index.html",self.registration.scope));
        if(shell)return shell;
      }
      throw err;
    }
  })());
});
