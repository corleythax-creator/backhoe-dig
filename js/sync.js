// Corley's Island: sync the saved site between devices with a sync code. One device makes a code (shown as 7Q4K-M2XP),
// another types it in, and from then on both read and write the same save: the ground, the machines and the lawn
// and any map-editor changes (the bhd_site, bhd_rigs, bhd_lawn, bhd_map and bhd_stats saves; key bindings and settings stay per device), kept in a Supabase table (for now in the fuel-model project; supabase/island_sync.sql sets it up) that the page reaches only through two database
// functions. A device pulls a newer save when it opens or comes back into view, and pushes its own changes every 15 s and
// when it is hidden. If two devices both change the site, the save that reached the server first wins and the other
// device reloads into it. Only on the Vercel site: the claude.ai artifact cannot reach the sync server.
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.
const SYNC_URL='https://wcrsomethkjlfhhuurmh.supabase.co',SYNC_KEY='sb_publishable_CmmhyRA-D2HdL37h445BIQ_0O3GEpMP';
const SYNC_KEYS=['bhd_site','bhd_rigs','bhd_lawn','bhd_map','bhd_stats'],SYNC_ABC='23456789ABCDEFGHJKMNPQRSTUVWXYZ';
const sync={code:'',base:0,last:null,busy:false,state:'',okT:0,
  on:!!SYNC_URL&&/(^|\.)vercel\.app$|^localhost$|^127\./.test(location.hostname)&&!/\/versions\//.test(location.pathname)};
function syncLs(k,v){try{if(v===undefined)return localStorage.getItem(k);if(v===null)localStorage.removeItem(k);else localStorage.setItem(k,v)}catch(e){}return null}
function syncHash(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return (h>>>0).toString(36)+':'+s.length}
function syncPayload(){const o={};for(const k of SYNC_KEYS)o[k]=syncLs(k);return JSON.stringify(o)}
function syncFmt(c){return c.slice(0,4)+'-'+c.slice(4)}
async function syncRpc(fn,body,keepalive){
  const r=await fetch(SYNC_URL+'/rest/v1/rpc/'+fn,{method:'POST',keepalive:!!keepalive,
    headers:{'Content-Type':'application/json',apikey:SYNC_KEY,Authorization:'Bearer '+SYNC_KEY},body:JSON.stringify(body)});
  if(!r.ok)throw new Error('sync '+r.status);return r.json()}
function syncSet(state){sync.state=state;syncShow()}
// the cloud save replaces this device's: written straight into storage, then the page reloads into it. The saves that
// run as the page unloads are held off so they can't write the old site back over it
function syncApply(row){window.syncHold=true;let o={};try{o=JSON.parse(row.data)}catch(e){}
  for(const k of SYNC_KEYS)if(k!=='bhd_stats'||k in o)syncLs(k,typeof o[k]==='string'?o[k]:null);
  syncLs('bhd_sync_t',String(row.t));syncLs('bhd_sync_h',syncHash(syncPayload()));location.reload()}
async function syncPull(){if(!sync.code||sync.busy)return;sync.busy=true;
  try{const t=await syncRpc('island_peek',{p_code:sync.code});
    if(t>sync.base){const rows=await syncRpc('island_get',{p_code:sync.code});if(rows&&rows[0]){syncSet('Loading the newer save…');syncApply(rows[0]);return}}
    sync.okT=Date.now();syncSet('ok')}
  catch(e){syncSet('offline')}finally{sync.busy=false}}
async function syncPush(keepalive){if(!sync.code||sync.busy||window.syncHold||(typeof bench!=='undefined'&&bench.on))return;
  const p=syncPayload();if(p===sync.last)return;
  if(keepalive&&p.length>60000)keepalive=false;
  sync.busy=true;
  try{const t=await syncRpc('island_put',{p_code:sync.code,p_data:p,p_base:sync.base},keepalive);
    if(t>0){sync.base=t;sync.last=p;sync.okT=Date.now();syncLs('bhd_sync_t',String(t));syncLs('bhd_sync_h',syncHash(p));syncSet('ok')}
    // another device saved first: its site wins
    else{sync.busy=false;sync.base=-1;await syncPull();return}}
  catch(e){syncSet('offline')}finally{sync.busy=false}}
function syncNewCode(){const b=new Uint8Array(8);crypto.getRandomValues(b);let c='';for(const x of b)c+=SYNC_ABC[x%SYNC_ABC.length];return c}
async function syncStart(){const c=syncNewCode();syncSet('Making a code…');
  try{const t=await syncRpc('island_put',{p_code:c,p_data:syncPayload(),p_base:0});if(!(t>0))throw 0;
    sync.code=c;sync.base=t;sync.last=syncPayload();syncLs('bhd_sync',c);syncLs('bhd_sync_t',String(t));syncLs('bhd_sync_h',syncHash(sync.last));sync.okT=Date.now();syncSet('ok')}
  catch(e){syncSet('Could not reach the sync server. Try again in a minute.')}}
async function syncJoin(raw){const c=raw.toUpperCase().replace(/[^0-9A-Z]/g,'');
  if(c.length!==8){syncSet('A code is 8 letters and numbers, like 7Q4K-M2XP.');return}
  syncSet('Looking for that code…');
  try{const rows=await syncRpc('island_get',{p_code:c});if(!rows||!rows[0]){syncSet('No save with that code. Check it on your other device.');return}
    syncLs('bhd_sync',c);syncApply(rows[0])}
  catch(e){syncSet('Could not reach the sync server. Try again in a minute.')}}
function syncStop(){sync.code='';sync.base=0;sync.last=null;for(const k of ['bhd_sync','bhd_sync_t','bhd_sync_h'])syncLs(k,null);syncSet('')}
// ---------- the Sync panel ----------
const syncBox=$('#syncBox');
function syncShow(){if(syncBox.hidden)return;const on=!!sync.code;
  $('#syncOff').hidden=on;$('#syncOn').hidden=!on;if(on)$('#syncCode').textContent=syncFmt(sync.code);
  const s=sync.state;$('#syncMsg').textContent=s==='ok'?(on?`Synced ${new Date(sync.okT).toLocaleTimeString([],{hour:'numeric',minute:'2-digit'})}. Changes go up every 15 seconds.`:''):
    s==='offline'?'Can\'t reach the sync server right now. Your site is still saved here and goes up when it can.':s}
function showSync(on){syncBox.hidden=!on;if(on){syncShow();if(sync.code)syncPull()}}
$('#syncBtn').hidden=!sync.on;
$('#syncBtn').onclick=()=>{showSync(true);showMenu(false)};
$('#syncDone').onclick=$('#syncDone2').onclick=()=>showSync(false);
$('#syncNew').onclick=()=>syncStart();
$('#syncJoin').onclick=()=>syncJoin($('#syncIn').value);
$('#syncIn').addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Enter')syncJoin(e.target.value)});
$('#syncIn').addEventListener('keyup',e=>e.stopPropagation());
$('#syncStop').onclick=()=>syncStop();
syncBox.addEventListener('pointerdown',e=>{if(e.target===syncBox)showSync(false)});
// ---------- start, then keep in step ----------
if(sync.on){sync.code=syncLs('bhd_sync')||'';sync.base=+syncLs('bhd_sync_t')||0;
  if(sync.code){const p=syncPayload();if(syncLs('bhd_sync_h')===syncHash(p))sync.last=p;syncPull().then(()=>syncPush())}
  setInterval(()=>{if(!document.hidden)syncPush()},15000);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)syncPush(true);else syncPull()});
  addEventListener('pagehide',()=>syncPush(true))}
