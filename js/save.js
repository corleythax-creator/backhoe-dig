// Corley's Island: the job site is saved in this browser, so a reload picks up where you left off. Two saves:
// the ground (bhd_site: every grid vertex that differs from the untouched mesa, with the colour of dumped dirt, ruts and
// groundwater) and the machines (bhd_rigs: excavator, dump truck and its load, trench box, blocks, the worker on foot or the machine he is in).
// The lawn has its own save in mower.js. Reset writes a fresh site. Loose clods, dust and flying dirt are not kept.
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.
const SITE_KEY='bhd_site',RIG_KEY='bhd_rigs';
const site={dirty:false,saveT:0,rigT:0,rigSig:'',lastD:null};
const ST_KEYS=['x','z','y','yaw','pitch','roll','swing','a1','a2','a3','load','loadC','loadMix','loadWet','stuck','strikes','exposed','done','seenSand','seenRock','grime','mud','caves','sink'];
const TR_KEYS=['x','z','y','yaw','pitch','roll','bed','load','hauled','loadC','loadMix','loadWet','stuck','mud','sink','gear','loadedOnce','fullWarned','haulWarned','bedWarned'];
function siteB64(u8){let s='';for(let k=0;k<u8.length;k+=4096)s+=String.fromCharCode.apply(null,u8.subarray(k,k+4096));return btoa(s)}
function siteUnB64(s){const b=atob(s),u=new Uint8Array(b.length);for(let k=0;k<b.length;k++)u[k]=b.charCodeAt(k);return u}
// ground: for each changed vertex, the gap since the last one (varint), height above or below the original (float),
// dumped-dirt colour, compaction and mud (bytes), then a flag and the water surface where there is standing water
function siteSave(){if(window.syncHold)return;site.dirty=false;site.saveT=performance.now();
  const ks=[];for(let k=0;k<V*V;k++)if(H[k]!==H0[k]||comp[k]>0||Wt[k]>-1e8||mudA[k]>0)ks.push(k);
  const buf=new Uint8Array(ks.length*20+16),dv=new DataView(buf.buffer);let o=0,last=-1;
  for(const k of ks){let g=k-last;last=k;while(g>=128){buf[o++]=(g&127)|128;g>>>=7}buf[o++]=g;
    dv.setFloat32(o,H[k]-H0[k],true);o+=4;
    for(let q=0;q<3;q++)buf[o++]=Math.round(Math.min(1,Math.max(0,spoilC[k*3+q]))*255);
    buf[o++]=Math.round(Math.min(1,comp[k])*255);buf[o++]=Math.round(Math.min(1,Math.max(0,mudA[k]))*255);
    if(Wt[k]>-1e8){buf[o++]=1;dv.setFloat32(o,Wt[k],true);o+=4}else buf[o++]=0}
  // unchanged ground is not written again, so an idle device does not look changed to the sync; mt: the mud tiles (mud.js)
  const d=siteB64(buf.subarray(0,o)),mt=mtSave(),sig=d+JSON.stringify(mt);if(sig===site.lastD)return;site.lastD=sig;
  try{localStorage.setItem(SITE_KEY,JSON.stringify({v:1,V,n:ks.length,t:Date.now(),d,mt}))}catch(e){}}
function siteLoad(){let d=null;try{d=JSON.parse(localStorage.getItem(SITE_KEY))}catch(e){}
  if(!d||d.v!==1||d.V!==V||typeof d.d!=='string')return false;site.lastD=d.d+JSON.stringify(d.mt||[]);let buf;try{buf=siteUnB64(d.d)}catch(e){return false}
  const dv=new DataView(buf.buffer);let o=0,k=-1,any=false,i0=N+1,i1=-1,j0=N+1,j1=-1;
  try{for(let c=0;c<d.n;c++){let g=0,sh=0,b;do{b=buf[o++];g|=(b&127)<<sh;sh+=7}while(b&128);k+=g;if(k>=V*V)break;
    H[k]=H0[k]+dv.getFloat32(o,true);o+=4;for(let q=0;q<3;q++)spoilC[k*3+q]=buf[o++]/255;
    comp[k]=buf[o++]/255;mudA[k]=buf[o++]/255;if(buf[o++]){Wt[k]=dv.getFloat32(o,true);o+=4;waterAny=waterSeen=true}
    if(H[k]!==H0[k]){const i=k%V,j=(k/V)|0;i0=Math.min(i0,i);i1=Math.max(i1,i);j0=Math.min(j0,j);j1=Math.max(j1,j);any=true}}}
  catch(e){H.set(H0);return false}
  mtLoad(d.mt);
  // the dug area's bounds, which water and cave-ins scan
  if(any){const mg=3*GRID_K;cI0=Math.max(0,i0-mg);cI1=Math.min(N,i1+mg);cJ0=Math.max(0,j0-mg);cJ1=Math.min(N,j1+mg)}
  dI0=0;dI1=N;dJ0=0;dJ1=N;winOn=true;st.dirty=true;return true}
// machines: small, so saved whenever any of them has moved
function sitePick(o,keys){const r={};for(const k of keys){const v=o[k];r[k]=Array.isArray(v)?v.map(x=>+x.toFixed(4)):typeof v==='number'?+v.toFixed(4):v}return r}
function rigSave(){if(window.syncHold)return;site.rigT=performance.now();site.rigSig=rigSig();const now=performance.now();
  const S0=sitePick(st,ST_KEYS);S0.el=st.startT?Math.round(((st.done?st.doneT:now)-st.startT)/1000):0;
  try{localStorage.setItem(RIG_KEY,JSON.stringify({v:1,t:Date.now(),st:S0,tr:sitePick(tr,TR_KEYS),
    tb:sitePick(TB,['x','z','y','ty','yaw','hooked','seated']),wk:Object.assign(sitePick(wk,['x','z','yaw']),{in:wk.inside}),
    blocks:blocks.map(b=>({x:b.x,z:b.z,y:+b.y.toFixed(4),s:b.s,n:b.n,c:b.c.map(x=>+x.toFixed(3))}))}))}catch(e){}}
function rigLoad(){let d=null;try{d=JSON.parse(localStorage.getItem(RIG_KEY))}catch(e){}
  if(!d||d.v!==1)return;const ok=v=>typeof v==='number'?isFinite(v):typeof v==='boolean'||Array.isArray(v)&&v.every(isFinite);
  const put=(dst,src,keys)=>{if(src)for(const k of keys)if(ok(src[k])&&(!Array.isArray(dst[k])||src[k].length===dst[k].length))dst[k]=Array.isArray(src[k])?[...src[k]]:src[k]};
  put(st,d.st,ST_KEYS);put(tr,d.tr,TR_KEYS);
  if(d.st&&d.st.el>0){const now=performance.now();st.startT=now-d.st.el*1000;if(st.done)st.doneT=now}
  if(Array.isArray(d.blocks))for(const b of d.blocks.slice(0,BLK_MAX))if([b.x,b.z,b.y,b.s].every(isFinite)&&b.n>=1&&b.n<=3&&Array.isArray(b.c))
    blocks.push({x:b.x,z:b.z,y:b.y,s:b.s,n:b.n,vy:0,c:b.c});
  if(blocks.length)blkWake=1.5;
  put(TB,d.tb,['x','z','y','ty','yaw','hooked','seated']);
  if(TB.hooked)chain.visible=true;else{TB.ty=boxRest();TB.y=Math.max(TB.y,TB.ty);boxMask()}
  if(d.wk&&[d.wk.x,d.wk.z,d.wk.yaw].every(isFinite)){Object.assign(wk,{x:d.wk.x,z:d.wk.z,yaw:d.wk.yaw,view:d.wk.yaw});wk.y=wkFloor(wk.x,wk.z,0,1e9);wk.inside=['ex','truck','mow'].includes(d.wk.in)?d.wk.in:null}
  site.rigSig=rigSig()}
function rigSig(){return [st.x,st.z,st.yaw,st.swing,st.a1,st.a2,st.a3,st.load,tr.x,tr.z,tr.yaw,tr.bed,tr.load,tr.hauled,TB.x,TB.z,TB.y,wk.x,wk.z,wk.inside?1:0,blocks.length]
  .map(v=>Math.round(v*100)).join(',')}
// the ground is written at most every 4 s while it changes, the machines every 2 s while they move, both when the page is hidden
function siteTick(){if(bench.on)return;const now=performance.now();
  if(waterMoved)site.dirty=true;
  if(site.dirty&&now-site.saveT>4000)siteSave();
  if(now-site.rigT>2000){const s=rigSig();if(s!==site.rigSig){site.rigSig=s;rigSave()}else site.rigT=now}}
function siteSaveAll(){if(bench.on)return;siteSave();rigSave()}
addEventListener('pagehide',siteSaveAll);
document.addEventListener('visibilitychange',()=>{if(document.hidden)siteSaveAll()});
siteLoad();rigLoad();
