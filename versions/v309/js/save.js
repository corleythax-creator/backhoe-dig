// Corley's Island: the job site is saved in this browser, so a reload picks up where you left off. Two saves:
// the ground (bhd_site: every grid vertex that differs from the untouched mesa, with the colour of dumped dirt, ruts and
// groundwater) and the machines (bhd_rigs: excavator, dump truck and its load, trench box, the coupler's attachments, blocks, the worker on foot or the machine he is in).
// The lawn has its own save in mower.js. Reset writes a fresh site. Loose clods, dust and flying dirt are not kept.
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.
const SITE_KEY='bhd_site',RIG_KEY='bhd_rigs';
const site={dirty:false,saveT:0,rigT:0,rigSig:'',lastD:null};
const ST_KEYS=['x','z','y','yaw','pitch','roll','swing','a1','a2','a3','load','loadC','loadMix','loadWet','stuck','strikes','exposed','done','seenSand','seenRock','grime','mud','pack','packC','caves','sink'];
// Dexter's skid steer (skid.js)
const SK_KEYS=['x','z','yaw','a','c','load','loadC','loadMix','loadWet','stuck'];
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
  // unchanged ground is not written again, so an idle device does not look changed to the sync; mt: the mud tiles
  // (mud.js), wx: the wet soil and the weather (rain.js, left out of the comparison since it carries the time), sm: how
  // wet dug ground got before it dried (water.js)
  // pd: dug ground the editor painted without levelling it (paintD, mm): the gap since the last one (varint) and the height
  const pb=new Uint8Array(V*V*5);let po=0,pl=-1;for(let k=0;k<V*V;k++)if(paintD[k]){let g=k-pl;pl=k;while(g>=128){pb[po++]=(g&127)|128;g>>>=7}pb[po++]=g;
    const m=Math.round(Math.max(-32,Math.min(32,paintD[k]))*1000)&0xffff;pb[po++]=m&255;pb[po++]=m>>8}
  const pd=po?siteB64(pb.subarray(0,po)):'';
  // rp: ground the dozer's ripper broke up (ripD, mm under the undug ground), in the same form
  let rp='';{let ro=0,rl=-1;for(let k=0;k<V*V;k++)if(ripD[k]>0.0005){let g=k-rl;rl=k;while(g>=128){pb[ro++]=(g&127)|128;g>>>=7}pb[ro++]=g;
    const m=Math.round(Math.min(32,ripD[k])*1000)&0xffff;pb[ro++]=m&255;pb[ro++]=m>>8}if(ro)rp=siteB64(pb.subarray(0,ro))}
  // go: where the grid sits (its west and north edges); ts: dug tiles stored outside it (digtiles.js)
  const go=[GX0,GZ0],ts=tileStoreSave();
  const d=siteB64(buf.subarray(0,o)),mt=mtSave(),wx=rainSave(),sm=smSave(),cr=craneSave(),sig=d+JSON.stringify(mt)+wx.w+wx.r+wx.want+pd+rp+sm+cr.n+'.'+(cr.t/30|0)+go+JSON.stringify(ts)+treeFalls.length;if(sig===site.lastD)return;site.lastD=sig;
  const tf=treeFallSave(),rec={v:1,V,n:ks.length,t:Date.now(),d,mt,wx,pd,rp,sm,cr,go,ts,tf};if(siteWrite(rec))return;
  // too big for this browser's storage: the grid goes in the compact tile form (dc) instead, else the player is told
  rec.d='';rec.n=0;rec.dc=gridEnc();if(siteWrite(rec))return;
  site.lastD=null;siteFull(JSON.stringify(rec).length)}
function siteWrite(r){try{localStorage.setItem(SITE_KEY,JSON.stringify(r));return true}catch(e){return false}}
function siteFull(n){const now=performance.now();if(now-(site.fullT||-1e9)<60000)return;site.fullT=now;toast(say('saveFull',{mb:(n/1048576).toFixed(1)}),'bad',6000)}
function siteLoad(){let d=null;try{d=JSON.parse(localStorage.getItem(SITE_KEY))}catch(e){}
  if(!d||d.v!==1||d.V!==V||typeof d.d!=='string')return false;site.lastD=d.d+JSON.stringify(d.mt||[])+(d.wx?d.wx.w+d.wx.r+d.wx.want:'')+(d.pd||'')+(d.sm||'');let buf;try{buf=siteUnB64(d.d)}catch(e){return false}
  // the stored tiles first, then the grid where it was (saves from before the tiles sit on the trench)
  tileStoreLoad(d.ts);{const go=Array.isArray(d.go)&&d.go.length===2&&d.go.every(v=>isFinite(v)&&v%TILE===0)?d.go:[-TILE,-TILE];if(go[0]!==GX0||go[1]!==GZ0)digMoveTo(go[0],go[1],true);else farSync()}
  const dv=new DataView(buf.buffer);let o=0,k=-1,any=false,i0=N+1,i1=-1,j0=N+1,j1=-1;
  try{for(let c=0;c<d.n;c++){let g=0,sh=0,b;do{b=buf[o++];g|=(b&127)<<sh;sh+=7}while(b&128);k+=g;if(k>=V*V)break;
    H[k]=H0[k]+dv.getFloat32(o,true);o+=4;for(let q=0;q<3;q++)spoilC[k*3+q]=buf[o++]/255;
    comp[k]=buf[o++]/255;mudA[k]=buf[o++]/255;if(buf[o++]){Wt[k]=dv.getFloat32(o,true);o+=4;waterAny=waterSeen=true}
    if(H[k]!==H0[k]){const i=k%V,j=(k/V)|0;i0=Math.min(i0,i);i1=Math.max(i1,i);j0=Math.min(j0,j);j1=Math.max(j1,j);any=true}}}
  catch(e){H.set(H0);return false}
  mtLoad(d.mt);craneLoad(d.cr);
  paintD.fill(0);if(typeof d.pd==='string'&&d.pd){try{const pb=siteUnB64(d.pd);let po=0,k=-1;while(po<pb.length){let g=0,sh=0,b;do{b=pb[po++];g|=(b&127)<<sh;sh+=7}while(b&128);k+=g;
    const m=pb[po]|pb[po+1]<<8;po+=2;if(k<V*V)paintD[k]=(m<<16>>16)/1000}}catch(e){paintD.fill(0)}}
  ripD.fill(0);if(typeof d.rp==='string'&&d.rp){try{const pb=siteUnB64(d.rp);let po=0,k=-1;while(po<pb.length){let g=0,sh=0,b;do{b=pb[po++];g|=(b&127)<<sh;sh+=7}while(b&128);k+=g;
    const m=pb[po]|pb[po+1]<<8;po+=2;if(k<V*V)ripD[k]=m/1000}}catch(e){ripD.fill(0)}}
  // the dug area's bounds, which water and cave-ins scan
  if(any){const mg=3*GRID_K;cI0=Math.max(0,i0-mg);cI1=Math.min(N,i1+mg);cJ0=Math.max(0,j0-mg);cJ1=Math.min(N,j1+mg)}
  rainLoad(d.wx);mtRefill();smLoad(d.sm);gridDec(d.dc);treeFallLoad(d.tf);
  dI0=0;dI1=N;dJ0=0;dJ1=N;winOn=true;st.dirty=true;return true}
// machines: small, so saved whenever any of them has moved
function sitePick(o,keys){const r={};for(const k of keys){const v=o[k];r[k]=Array.isArray(v)?v.map(x=>+x.toFixed(4)):typeof v==='number'?+v.toFixed(4):v}return r}
function rigSave(){if(window.syncHold)return;site.rigT=performance.now();site.rigSig=rigSig();const now=performance.now();
  const S0=sitePick(st,ST_KEYS);S0.el=st.startT?Math.round(((st.done?st.doneT:now)-st.startT)/1000):0;
  try{localStorage.setItem(RIG_KEY,JSON.stringify({v:1,home:1,tw:twSave(),t:Date.now(),st:S0,tr:sitePick(tr,TR_KEYS),
    tb:sitePick(TB,['x','z','y','ty','yaw','hooked','seated']),cp:cplSave(),gn:gunSave(),sk:sitePick(sk,SK_KEYS),bt:boats.map(b=>[+b.x.toFixed(3),+b.z.toFixed(3),+b.yaw.toFixed(4)]),bk:[+bk.x.toFixed(3),+bk.z.toFixed(3),+bk.yaw.toFixed(4)],hv:hvs.map(h=>[h.x,h.z,h.yaw,h.ty,h.a,h.c,h.rip].map(v=>+v.toFixed(4))),bh:bhSave(),wk:Object.assign(sitePick(wk,['x','z','yaw']),{in:wk.inside,gn:gun.eq?1:0,tm:[trim.on?1:0,+trim.line.toFixed(4),+trim.spool.toFixed(3)]}),pk:pbSave(),
    blocks:blocks.map(b=>({x:b.x,z:b.z,y:+b.y.toFixed(4),w:b.w,d:b.d,h:b.h,m:b.m,c:b.c.map(x=>+x.toFixed(3))}))}))}catch(e){}}
function rigLoad(){let d=null;try{d=JSON.parse(localStorage.getItem(RIG_KEY))}catch(e){}
  if(!d||d.v!==1)return;const ok=v=>typeof v==='number'?isFinite(v):typeof v==='boolean'||Array.isArray(v)&&v.every(isFinite);
  const put=(dst,src,keys)=>{if(src)for(const k of keys)if(ok(src[k])&&(!Array.isArray(dst[k])||src[k].length===dst[k].length))dst[k]=Array.isArray(src[k])?[...src[k]]:src[k]};
  put(st,d.st,ST_KEYS);put(tr,d.tr,TR_KEYS);put(sk,d.sk,SK_KEYS);if(d.sk){sk.y=surfAt(sk.x,sk.z);skidPose()}
  if(d.st&&d.st.el>0){const now=performance.now();st.startT=now-d.st.el*1000;if(st.done)st.doneT=now}
  // blocks: w by d by h of material m (older saves held plain concrete cubes of side s)
  const bOk=v=>isFinite(v)&&v>=FT/12*0.9&&v<=BLK_FT*FT*1.01;
  if(Array.isArray(d.blocks))for(const b of d.blocks.slice(0,BLK_MAX)){const w=b.w??b.s,dd=b.d??b.s,h=b.h??b.s,m=b.m|0;
    if([b.x,b.z,b.y].every(isFinite)&&[w,dd,h].every(bOk)&&(m===0||matIdOk(m))&&Array.isArray(b.c))blocks.push({x:b.x,z:b.z,y:b.y,w,d:dd,h,m,vy:0,c:b.c})}
  if(blocks.length)blkWake=1.5;
  put(TB,d.tb,['x','z','y','ty','yaw','hooked','seated']);cplLoad(d.cp);
  if(TB.hooked)chain.visible=true;else{TB.ty=boxRest();TB.y=Math.max(TB.y,TB.ty);boxMask()}
  // home:1 marks saves made once every machine had its own home island (twins.js); an older save keeps the work, but
  // the machines go back to their homes, each on its own island, and the worker steps out
  const home=d.home===1;
  if(!home){Object.assign(st,{x:START.x,z:START.z,yaw:START.yaw,swing:START.swing,a1:START.a1,a2:START.a2,a3:START.a3,stuck:0,sink:0});st.y=surfAt(st.x,st.z);
    Object.assign(tr,{x:TR_START.x,z:TR_START.z,yaw:TR_START.yaw,pitch:0,roll:0,bed:0,stuck:0,sink:0});tr.y=surfAt(tr.x,tr.z);
    Object.assign(sk,{x:SK_START.x,z:SK_START.z,yaw:SK_START.yaw,stuck:0});sk.y=surfAt(sk.x,sk.z);skidPose();
    if(TB.hooked){TB.hooked=false;chain.visible=false;TB.ty=boxRest();TB.y=Math.max(TB.y,TB.ty);boxMask()}}
  else twLoad(d.tw);
  if(d.wk&&[d.wk.x,d.wk.z,d.wk.yaw].every(isFinite)){trimLoad(d.wk.tm);gunEquip(d.wk.gn!==0,1);Object.assign(wk,{x:d.wk.x,z:d.wk.z,yaw:d.wk.yaw,view:d.wk.yaw});wk.y=wkFloor(wk.x,wk.z,0,1e9);wk.inside=['ex','truck','mow','skid','bike',...boats.map((b,i)=>'boat'+i),...hvs.map((h,i)=>'hv'+i)].includes(d.wk.in)&&home?d.wk.in:null;if(wk.inside&&WK_RIDES[wk.inside].pick)WK_RIDES[wk.inside].pick()}
  if(home&&Array.isArray(d.bk)&&d.bk.length===3&&d.bk.every(isFinite)){Object.assign(bk,{x:d.bk[0],z:d.bk[1],yaw:d.bk[2],v:0,vy:0,air:false});bk.y=surfAt(bk.x,bk.z);bikePose()}
  // Dexter's heavy machines (heavy.js): where each is, the semi's trailer and the blade or arms and bucket
  if(home&&Array.isArray(d.hv))d.hv.forEach((p,i)=>{const h=hvs[i];if(h&&Array.isArray(p)&&p.length>=6&&p.every(isFinite)){
    Object.assign(h,{x:p[0],z:p[1],yaw:p[2],ty:p[3],a:clamp(p[4],...(h.K.track?HV_BLIM:HV_ALIM)),c:clamp(p[5],...HV_CLIM),rip:clamp(p[6]||0,0,1),v:0,w:0});hvGround(h,1);hvPose(h)}});
  // Corley's backhoe (backhoe.js): the hoe, outriggers, seat and both buckets' loads
  if(home)bhLoad(d.bh);
  if(home)pbLoad(d.pk);
  if(home)gunLoad(d.gn);
  if(home&&Array.isArray(d.bt))d.bt.forEach((p,i)=>{if(boats[i]&&Array.isArray(p)&&p.length===3&&p.every(isFinite))Object.assign(boats[i],{x:p[0],z:p[1],yaw:p[2],v:0})});
  site.rigSig=rigSig()}
function rigSig(){return [TWINS.reduce((a,t)=>a+t.p.x+t.p.z*3,0),st.x,st.z,st.yaw,st.swing,st.a1,st.a2,st.a3,st.load,tr.x,tr.z,tr.yaw,tr.bed,tr.load,tr.hauled,TB.x,TB.z,TB.y,sk.x,sk.z,sk.yaw,sk.a,sk.c,sk.load,bk.x,bk.z,bk.yaw,hvs.reduce((a,h)=>a+h.x+h.z*3+h.yaw*7+h.ty*11+h.a*13+h.c*17+h.rip*19,0),bhSig(),wk.x,wk.z,wk.inside?1:0,(trim.on?1:0)+trim.line*10+trim.spool,boats.reduce((a,b)=>a+b.x+b.z*3+b.yaw*7,0),cplSig(),blocks.length,blocks.reduce((a,b)=>a+b.x+b.z*3+b.y*7+b.m,0),pbSig()]
  .map(v=>Math.round(v*100)).join(',')}
// the ground is written at most every 4 s while it changes, the machines every 2 s while they move, both when the page is hidden
function siteTick(){if(bench.on)return;const now=performance.now();
  if(waterMoved)site.dirty=true;
  if(site.dirty&&now-site.saveT>4000)siteSave();
  if(now-site.rigT>2000){const s=rigSig();if(s!==site.rigSig){site.rigSig=s;rigSave()}else site.rigT=now}}
// on the way out: the rigs only if they moved (or the trench clock runs), so an idle device doesn't look changed to the
// sync and reload the other one; a map edit still waiting to save goes first
function siteSaveAll(){if(bench.on)return;try{if(ed.pend)edSave()}catch(e){}siteSave();if(rigSig()!==site.rigSig||st.startT&&!st.done)rigSave()}
addEventListener('pagehide',siteSaveAll);
document.addEventListener('visibilitychange',()=>{if(document.hidden)siteSaveAll()});
siteLoad();rigLoad();
// back from a game at the Family Island's pavilion (famPlay, family.js): straight back on foot beside the table, no start card
try{const g=sessionStorage.getItem('bhd_table');if(g){sessionStorage.removeItem('bhd_table');if(!wk.inside){startIn('walk');toast(say('fromTable',{game:g}),'',2800)}}}catch(e){}
