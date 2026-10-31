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
// cover (warmFrac, main.js; up to 100%). It is done when all three are, or after LOADP.cap seconds whatever is left
const LOADP={js:0,mgr:[],warm:false,done:false,shown:0,cap:60};
document.addEventListener('load',e=>{if(e.target.tagName==='SCRIPT'&&e.target.defer)LOADP.js++},true);
document.addEventListener('error',e=>{if(e.target.tagName==='SCRIPT'&&e.target.defer)LOADP.js++},true);
function loadTick(){if(LOADP.done)return;const jsN=document.querySelectorAll('script[defer]').length||1,js=Math.min(1,LOADP.js/jsN);
  const game=js>=1&&typeof tpGo==='function'&&typeof warmIdle==='function',now=performance.now();
  // the files to wait for: those asked for by 2 s after the scripts ran (things fetched later, as they come into use, load
  // on in the background rather than holding the cover up)
  if(game&&!LOADP.gameT)LOADP.gameT=now;let al=0,at=0;for(const [l,t] of LOADP.mgr){al+=l;at+=t}
  if(LOADP.gameT&&now-LOADP.gameT>2000&&LOADP.goal===undefined)LOADP.goal=at;if(LOADP.goal!==undefined)at=LOADP.goal;al=Math.min(al,at);
  const a=at?al/at:0,w=typeof warmFrac==='function'?warmFrac():0;
  const done=LOADP.goal!==undefined&&al>=at&&LOADP.warm&&warmIdle()||now>LOADP.cap*1000;
  const p=done?100:Math.min(99,45*js+30*a*(game?1:.8)+25*w);LOADP.shown=Math.max(LOADP.shown,p);
  const pct=Math.floor(LOADP.shown),L=document.getElementById('startLoad');
  document.getElementById('startLoadPct').textContent=pct+'%';document.getElementById('startLoadFill').style.width=LOADP.shown+'%';L.setAttribute('aria-valuenow',pct);
  document.getElementById('startLoadWhat').textContent=!game?'Loading the game':al<at?`Loading pictures and models: ${al} of ${at}`:'Getting the island ready';
  if(!done)return;LOADP.done=true;L.classList.add('gone');setTimeout(()=>L.hidden=true,450);document.getElementById('startResume').disabled=false;clearInterval(LOADP.iv)}
LOADP.iv=setInterval(loadTick,150);
