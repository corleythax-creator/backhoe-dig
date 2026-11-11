// Corley's Island: the start screen's first moments. Loaded without defer right after the start screen's markup, so the
// map (a picture, shots/startmap.jpg from tools/bake_startmap.js) and its names show at once and a tap on it counts
// before the game's scripts have loaded: the spot is kept (SPICK.pick) with a pin on it, and controls.js starts you
// there on foot once the world is ready (SPICK.go). Game scripts share one global scope; see CLAUDE.md.
// SPICK.box: the part of the world that always shows whole (metres: x0, x1, z0, z1), fitted into the map's box; img:
// what the picture covers (all the map there is; a wide screen sees more of it, and past its edges the frame carries on
// in the lake's blue and the woods' green, which the picture's edges fade into); shore: where the mainland begins.
// The first tap zooms in twice as close round the spot (zoom, its centre in metres), the second starts you there.
// det: the close-up pictures shown over it once zoomed (shots/startdet/d<i>_<j>.jpg from tools/bake_startdetail.js):
// the picture's area cut into n[0] by n[1] tiles at k pixels a metre, each loaded the first time it comes into view
const SPICK={box:[-250,250,-60,945],img:[-460.8,460.8,-60,948],shore:582,lake:'#1a4769',woods:'#284a26',pick:null,go:null,zoom:null,det:{n:[8,8],k:5},pins:{corley:[0,95],family:[0,212],dexter:[-200,292],jessica:[200,292],town:[0,735],harbor:[-60,598],hills:[-130,880]}};
function startView(){const el=document.getElementById('startMap'),w=el.clientWidth||1,h=el.clientHeight||1,B=SPICK.box,Z=SPICK.zoom;
  const mpp=Math.max((B[1]-B[0])/w,(B[3]-B[2])/h)/(Z?2:1);if(!Z)return {cx:(B[0]+B[1])/2,cz:(B[2]+B[3])/2,mpp,w,h};
  // zoomed: centred on the tap, kept inside the picture where it fits
  const I=SPICK.img,fit=(c,a,b,hw)=>b-a<2*hw?(a+b)/2:Math.max(a+hw,Math.min(b-hw,c));
  return {cx:fit(Z.x,I[0],I[1],w/2*mpp),cz:fit(Z.z,I[2],I[3],h/2*mpp),mpp,w,h}}
const startPx=(V,x,z)=>[(x-V.cx)/V.mpp+V.w/2,(z-V.cz)/V.mpp+V.h/2];
function startDetLay(V){const box=document.getElementById('startDet');box.hidden=!SPICK.zoom;if(!SPICK.zoom)return;
  const D=SPICK.det,I=SPICK.img,tx=(I[1]-I[0])/D.n[0],tz=(I[3]-I[2])/D.n[1],el=D.el||(D.el={});
  for(let j=0;j<D.n[1];j++)for(let i=0;i<D.n[0];i++){const [x0,y0]=startPx(V,I[0]+i*tx,I[2]+j*tz),[x1,y1]=startPx(V,I[0]+(i+1)*tx,I[2]+(j+1)*tz),k=i+'_'+j;
    if(x1<0||y1<0||x0>V.w||y0>V.h){if(el[k])el[k].hidden=true;continue}
    let t=el[k];if(!t){t=el[k]=new Image();t.alt='';t.onload=()=>t.classList.add('on');t.src=`shots/startdet/d${k}.jpg`;box.appendChild(t)}
    t.hidden=false;Object.assign(t.style,{left:x0+'px',top:y0+'px',width:x1-x0+0.5+'px',height:y1-y0+0.5+'px'})}}
// the place names (kept inside the map's edges) and the pin on the spot tapped
function startLay(){const V=startView(),I=SPICK.img,im=document.getElementById('startMapImg'),[ix,iy]=startPx(V,I[0],I[2]);
  Object.assign(im.style,{left:ix+'px',top:iy+'px',width:(I[1]-I[0])/V.mpp+'px',height:(I[3]-I[2])/V.mpp+'px'});
  startDetLay(V);
  // past the picture: the lake down to the shore, a strip of beach, then the woods (200 m a tile, lined up with the picture)
  const sy=startPx(V,0,SPICK.shore)[1],b=6/V.mpp,t=200/V.mpp;
  document.getElementById('startMap').style.background=`linear-gradient(${SPICK.lake} ${sy-b}px,#d8c48e ${sy-b}px,#d8c48e ${sy}px,transparent ${sy}px) no-repeat,url(shots/startwoods.jpg) ${ix}px ${iy}px/${t}px ${t}px repeat,${SPICK.woods}`;
  for(const e of document.querySelectorAll('#startIsl [data-isl]')){const [px,py]=startPx(V,...SPICK.pins[e.dataset.isl]),hw=e.offsetWidth/2+4;
    e.style.left=Math.max(hw,Math.min(Math.max(hw,V.w-hw),px))+'px';e.style.top=py+'px';e.hidden=py<0||py>V.h}
  const p=SPICK.pick,pin=document.getElementById('startPin');pin.hidden=!p;if(p){const [px,py]=startPx(V,p.x,p.z);pin.style.left=px+'px';pin.style.top=py+'px'}}
const startHint=t=>document.getElementById('startMapHint').textContent=t;
document.getElementById('startMap').addEventListener('click',e=>{if(!LOADP.done)return;const r=e.currentTarget.getBoundingClientRect(),V=startView(),
  p={x:V.cx+(e.clientX-r.left-V.w/2)*V.mpp,z:V.cz+(e.clientY-r.top-V.h/2)*V.mpp};
  if(!SPICK.zoom){SPICK.zoom=p;document.getElementById('startOut').hidden=false;startLay();startHint('Tap again where you want to start');return}
  SPICK.pick=p;startLay();if(SPICK.go)SPICK.go()});
// back out to the whole map
function startUnzoom(){SPICK.zoom=null;SPICK.pick=null;document.getElementById('startOut').hidden=true;startLay()}
document.getElementById('startOut').addEventListener('click',e=>{e.stopPropagation();startUnzoom();if(document.getElementById('startMap').classList.contains('ready'))startHint('Tap the map to zoom in')});
addEventListener('resize',startLay);startLay();
// the loading cover (#startLoad): a percent and a bar over the map, and the map and Carry on wait for it, so nothing is
// tapped while the game is still busy loading and the first minutes in the world don't stutter. It counts three things:
// the game's scripts as each one loads (up to 45%), every picture and model the loaders fetch (the loading managers,
// counted from core.js and terrain.js with loadCount; up to 75%), then the shaders and texture uploads done behind the
// cover (warmFrac, main.js; up to 100%), and the structures' pictures (brBusy, bridges.js). It is done when all three are, or after LOADP.cap seconds whatever is left
const LOADP={js:0,mgr:[],warm:false,done:false,shown:0,cap:60};
document.addEventListener('load',e=>{if(e.target.tagName==='SCRIPT'&&e.target.defer){LOADP.js++;PF_BOOT.js.push([e.target.getAttribute('src'),performance.now()])}},true);
// for the Profiler (☰ → Dev, js/prof.js): when each game script finished running, and every stretch the page's main
// thread was held up 50 ms or more (the browser's long tasks), from the start
const PF_BOOT={js:[],long:[],done:0,steps:{}};
try{new PerformanceObserver(l=>{for(const e of l.getEntries())if(PF_BOOT.long.length<4000)PF_BOOT.long.push([e.startTime,e.duration])}).observe({type:'longtask',buffered:true})}catch(e){}
// a script that didn't arrive (a phone's connection dropping a file) leaves the game half built and failing later
// ("Can't find variable"), so the page loads again by itself, twice at most a session, before it gives up and carries on
document.addEventListener('error',e=>{if(e.target.tagName!=='SCRIPT'||!e.target.defer)return;let n=0;try{n=+sessionStorage.getItem('bhd_jsRetry')||0}catch(x){}
  if(n<2){try{sessionStorage.setItem('bhd_jsRetry',n+1)}catch(x){}LOADP.err='A file did not download, loading again…';setTimeout(()=>location.reload(),300);return}
  LOADP.js++;if(!LOADP.err)LOADP.err='A game file did not download ('+(e.target.getAttribute('src')||'')+'): pull down to load again'},true);
// a page error shows on the cover (so it can be reported) and lets you in a few seconds later, rather than hanging
addEventListener('error',e=>{if(e.message&&!/ResizeObserver/.test(e.message)&&!LOADP.err){LOADP.err=e.message;LOADP.errT=performance.now()}});
function loadTick(){try{loadStep()}catch(e){if(!LOADP.err){LOADP.err=String(e&&e.message||e);LOADP.errT=performance.now()}loadStep(true)}}
function loadStep(bad){if(LOADP.done)return;if(bad){loadEnd();return}const jsN=document.querySelectorAll('script[defer]').length||1,js=Math.min(1,LOADP.js/jsN);
  const game=js>=1&&typeof tpGo==='function'&&typeof warmIdle==='function',now=performance.now();
  // the files to wait for: those asked for by 2 s after the scripts ran (things fetched later, as they come into use, load
  // on in the background rather than holding the cover up)
  if(game&&!LOADP.gameT)LOADP.gameT=now;let al=0,at=0;for(const [l,t] of LOADP.mgr){al+=l;at+=t}
  if(LOADP.gameT&&now-LOADP.gameT>2000&&LOADP.goal===undefined)LOADP.goal=at;if(LOADP.goal!==undefined)at=LOADP.goal;al=Math.min(al,at);
  const a=at?al/at:0,w=typeof warmFrac==='function'?warmFrac():0;
  const done=LOADP.goal!==undefined&&al>=at&&LOADP.warm&&(typeof warmCover==='function'?warmCover():warmIdle())&&(typeof brBusy!=='function'||!brBusy())||now>LOADP.cap*1000||LOADP.err&&now-LOADP.errT>4000;
  const p=done?100:Math.min(99,45*js+30*a*(game?1:.8)+25*w);LOADP.shown=done?100:Math.max(LOADP.shown,LOADP.shown+(p-LOADP.shown)*.35);// counts up smoothly, never back
  const pct=Math.floor(LOADP.shown),L=document.getElementById('startLoad');
  document.getElementById('startLoadPct').textContent=pct+'%';document.getElementById('startLoadFill').style.width=LOADP.shown+'%';L.setAttribute('aria-valuenow',pct);
  const sec=now>8000?` · ${Math.round(now/1000)} s`:'';
  document.getElementById('startLoadWhat').textContent=LOADP.err?'Hit a problem: '+LOADP.err.slice(0,120):(!game?'Loading the game':al<at?`Loading pictures and models: ${al} of ${at}`:'Getting the island ready')+sec;
  try{loadSteps(js,jsN,al,at,done)}catch(e){}
  if(done)loadEnd()}
// the steps under the bar (#startLoadSteps), so you can see what the wait is: the game's code, its files (how many came
// from this device, kept by sw.js, and how much was downloaded), then the getting ready done on this computer: pictures
// sent to the graphics card, shaders built, the places looked over, the bridges' and docks' pictures. Each step's time
// to finish goes in PF_BOOT.steps for the Profiler's Loading report
function loadFiles(){let dev=0,net=0,b=0;try{for(const e of performance.getEntriesByType('resource')){if(!e.decodedBodySize)continue;
  if(e.transferSize===0||e.deliveryType==='cache'){dev++}else{net++;b+=e.transferSize}}}catch(x){}return {dev,net,b}}
// the pictures and models asked for at the start are in, and the bridges' and docks' pictures made (main.js warmAllTick
// builds the shaders only then)
function loadPicsIn(){let al=0,at=0;for(const [l,t] of LOADP.mgr){al+=l;at+=t}if(LOADP.goal!==undefined)at=Math.min(at,LOADP.goal);
  return LOADP.goal!==undefined&&al>=at&&(typeof brBusy!=='function'||!brBusy())}
function loadSteps(js,jsN,al,at,done){const W=typeof warmAll!=='undefined'?warmAll:null,F=loadFiles(),now=performance.now(),S=PF_BOOT.steps,rows=[];
  const row=(id,name,ok,txt)=>{if(ok&&S[id]===undefined)S[id]=Math.round(now);rows.push([name,ok,txt])};
  row('code','Game code',js>=1,`${Math.min(LOADP.js,jsN)} of ${jsN}`);
  row('files','Files',LOADP.goal!==undefined&&al>=at,(F.dev?`${F.dev} from this device`:'')+(F.dev&&F.net?' · ':'')+(F.net?`${F.net} downloaded, ${(F.b/1048576).toFixed(1)} MB`:'')||'…');
  const q=W&&W.q?W.up.size:0,q0=W&&W.q0||0;
  row('tex','Pictures to the graphics card',!!(W&&W.q&&!W.q.length),q0?`${Math.min(q,q0)} of ${q0}`:'…');
  row('shaders','Shaders',!!(W&&(W.pend===0&&W.still>=1||W.c1&&now-W.c1>WARM_SETTLE)),W&&W.mats?`${W.mats} materials${W.pend?', building':''}`:'…');
  const n=typeof WARM_AT!=='undefined'?WARM_AT.length:0,a=W&&W.at?n-W.at.length:0;
  row('places','Places looked over',!!(W&&W.at&&!W.at.length),n?`${a} of ${n}`:'…');
  const bq=typeof brQ!=='undefined'?brQ.length:0;row('bridges',"Bridges' and docks' pictures",typeof brBusy==='function'&&!brBusy()&&LOADP.warm,bq?`${bq} left`:'');
  let cur=done?-1:rows.findIndex(r=>!r[1]);
  const ul=document.getElementById('startLoadSteps'),h=rows.map(([nm,ok,t],i)=>`<li class="${ok?'ok':i===cur?'now':''}"><b>${nm}</b><span>${t}</span></li>`).join('');
  if(ul.dataset.h!==h){ul.dataset.h=h;ul.innerHTML=h}}
function loadEnd(){const L=document.getElementById('startLoad');LOADP.done=true;PF_BOOT.done=performance.now();try{sessionStorage.removeItem('bhd_jsRetry')}catch(x){}L.classList.add('gone');setTimeout(()=>L.hidden=true,450);document.getElementById('startResume').disabled=false;clearInterval(LOADP.iv)}
LOADP.iv=setInterval(loadTick,150);
// in a background tab the browser stops drawing frames (and the warming in the frame loop with them) and slows timers to
// once a second, so loading sat still until you came back. While the tab is hidden the loading work is pumped here
// instead, in slices of about 25 ms passed along with postMessage (not slowed in the background): the shaders and
// texture uploads (warmAllTick, gpuWarmTick, main.js), the structures' pictures (brTexOne, bridges.js) and the cover
const loadBg={ch:new MessageChannel(),on:false,t:0};
loadBg.ch.port1.onmessage=()=>{if(LOADP.done||!document.hidden){loadBg.on=false;return}const t0=performance.now();
  try{if(typeof warmAllTick==='function')warmAllTick();if(typeof gpuWarmTick==='function')gpuWarmTick();
    if(typeof brQ!=='undefined')while(brQ.length&&performance.now()-t0<25)brTexOne()}catch(e){}
  if(t0-loadBg.t>150){loadBg.t=t0;loadTick()}
  loadBg.ch.port2.postMessage(0)};
function loadBgGo(){if(document.hidden&&!LOADP.done&&!loadBg.on){loadBg.on=true;loadBg.ch.port2.postMessage(0)}}
document.addEventListener('visibilitychange',loadBgGo);loadBgGo();
// keep the game's files on the device (sw.js), so the next visit opens without downloading them again. Not for old
// versions (versions/) or local test servers (?sw=1 turns it on there); ?sw=0 switches it off on this device and
// empties what it kept
function swGo(){try{const sw=navigator.serviceWorker,q=new URLSearchParams(location.search).get('sw');if(!sw)return;
  if(q==='0'){sw.getRegistrations().then(rs=>rs.forEach(r=>r.unregister()));if(self.caches)caches.keys().then(ks=>ks.forEach(k=>/^bhd-/.test(k)&&caches.delete(k)));return}
  if(/\/versions\//.test(location.pathname)||q!=='1'&&/^(localhost|127\.|play\.test)/.test(location.hostname))return;
  sw.register('sw.js').catch(()=>{})}catch(e){}}
addEventListener('load',swGo);
