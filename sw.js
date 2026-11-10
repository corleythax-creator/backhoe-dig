// Keeps the game's files on the device (registered by js/start.js), so a second visit opens without downloading the
// models, pictures, sounds and code again. data/files.json (tools/swfiles.py, made on every release) lists each file
// with a fingerprint of its contents: a listed file is served from the device while its fingerprint is unchanged and
// downloaded again when a release changes it. The page itself (index.html) and data/effort.js always come from the
// network (the device copy is used only when there is no network), so a new version is seen as soon as it is out.
// Exact-version three.js files from the CDN are kept too. Everything else (saves, sync, fonts) is left alone.
// To switch it off for everyone, replace this file with one that unregisters itself; ?sw=0 does it for one device.
const BASE=new URL('./',self.location).pathname,FILES='bhd-files',META='bhd-meta';
let man=null,manP=null;
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
const wait=(p,ms)=>Promise.race([p,new Promise((_,no)=>setTimeout(()=>no(new Error('slow')),ms))]);
// the list: fresh from the network when the page loads (kept for offline), otherwise the last one kept
async function loadMan(fresh){
  const m=await caches.open(META);
  if(fresh)try{const r=await wait(fetch(BASE+'data/files.json',{cache:'no-store'}),5000);
    if(r.ok){const j=await r.clone().json();if(j&&j.f){await m.put(BASE+'data/files.json',r);man=j;prune(j);return j}}}catch(e){}
  if(man)return man;
  const r=await m.match(BASE+'data/files.json');if(r)try{man=await r.json();return man}catch(e){}
  return fresh?null:loadMan(true)}
// drop the kept files a release changed or removed
async function prune(j){try{const c=await caches.open(FILES);for(const q of await c.keys()){const u=new URL(q.url);
  if(u.origin!==self.location.origin)continue;const rel=decodeURIComponent(u.pathname).slice(BASE.length);
  if(j.f[rel]!==u.searchParams.get('h'))await c.delete(q)}}catch(e){}}
async function kept(req,key,fresh){const c=await caches.open(FILES),hit=await c.match(key);if(hit)return hit;
  const r=await fetch(fresh?req.url:req,fresh?{cache:'reload'}:undefined);
  if(r.ok&&r.status===200)c.put(key,r.clone()).catch(()=>{});return r}
self.addEventListener('fetch',e=>{const req=e.request;if(req.method!=='GET'||req.headers.has('range'))return;
  const u=new URL(req.url);
  if(u.origin===self.location.origin){
    if(!u.pathname.startsWith(BASE))return;const rel=decodeURIComponent(u.pathname).slice(BASE.length);
    if(req.mode==='navigate'){if(rel!==''&&rel!=='index.html')return;
      manP=loadMan(true);// fetched alongside the page, before it asks for its files
      e.respondWith(fetch(req).then(r=>{if(r.ok){const k=r.clone();caches.open(META).then(c=>c.put(BASE+'index.html',k)).catch(()=>{})}return r},
        ()=>caches.open(META).then(c=>c.match(BASE+'index.html')).then(r=>r||Response.error())));return}
    if(u.search)return;
    if(man&&!man.f[rel])return;// not a game file: straight to the network
    e.respondWith((async()=>{let m=null;try{m=await(manP||(manP=loadMan(false)))}catch(x){}
      const h=m&&m.f[rel];if(!h)return fetch(req);
      try{return await kept(req,u.origin+u.pathname+'?h='+h,true)}catch(x){return fetch(req)}})());
    return}
  // three.js and its add-ons at an exact version never change
  if(u.hostname==='cdn.jsdelivr.net'&&/@\d/.test(u.pathname))e.respondWith(kept(req,req.url,false).catch(()=>fetch(req)))});
