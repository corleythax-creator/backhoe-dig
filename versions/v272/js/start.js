// Corley's Island: the start screen's first moments. Loaded without defer right after the start screen's markup, so the
// map (a picture, shots/startmap.jpg from tools/bake_startmap.js) and its names show at once and a tap on it counts
// before the game's scripts have loaded: the spot is kept (SPICK.pick) with a pin on it, and controls.js starts you
// there on foot once the world is ready (SPICK.go). Game scripts share one global scope; see CLAUDE.md.
// SPICK.box: the part of the world that always shows whole (metres: x0, x1, z0, z1), fitted into the map's box; img:
// what the picture covers (all the map there is; a wide screen sees more of it, and past its edges the frame carries on
// in the lake's blue and the woods' green, which the picture's edges fade into); shore: where the mainland begins.
// The first tap zooms in twice as close round the spot (zoom, its centre in metres), the second starts you there
const SPICK={box:[-250,250,-60,770],img:[-460.8,460.8,-60,948],shore:582,lake:'#1a4769',woods:'#284a26',pick:null,go:null,zoom:null,pins:{corley:[0,95],family:[0,212],dexter:[-200,292],jessica:[200,292],town:[0,735]}};
function startView(){const el=document.getElementById('startMap'),w=el.clientWidth||1,h=el.clientHeight||1,B=SPICK.box,Z=SPICK.zoom;
  const mpp=Math.max((B[1]-B[0])/w,(B[3]-B[2])/h)/(Z?2:1);if(!Z)return {cx:(B[0]+B[1])/2,cz:(B[2]+B[3])/2,mpp,w,h};
  // zoomed: centred on the tap, kept inside the picture where it fits
  const I=SPICK.img,fit=(c,a,b,hw)=>b-a<2*hw?(a+b)/2:Math.max(a+hw,Math.min(b-hw,c));
  return {cx:fit(Z.x,I[0],I[1],w/2*mpp),cz:fit(Z.z,I[2],I[3],h/2*mpp),mpp,w,h}}
const startPx=(V,x,z)=>[(x-V.cx)/V.mpp+V.w/2,(z-V.cz)/V.mpp+V.h/2];
// the place names (kept inside the map's edges) and the pin on the spot tapped
function startLay(){const V=startView(),I=SPICK.img,im=document.getElementById('startMapImg'),[ix,iy]=startPx(V,I[0],I[2]);
  Object.assign(im.style,{left:ix+'px',top:iy+'px',width:(I[1]-I[0])/V.mpp+'px',height:(I[3]-I[2])/V.mpp+'px'});
  // past the picture: the lake down to the shore, a strip of beach, then the woods (200 m a tile, lined up with the picture)
  const sy=startPx(V,0,SPICK.shore)[1],b=6/V.mpp,t=200/V.mpp;
  document.getElementById('startMap').style.background=`linear-gradient(${SPICK.lake} ${sy-b}px,#d8c48e ${sy-b}px,#d8c48e ${sy}px,transparent ${sy}px) no-repeat,url(shots/startwoods.jpg) ${ix}px ${iy}px/${t}px ${t}px repeat,${SPICK.woods}`;
  for(const e of document.querySelectorAll('#startIsl [data-isl]')){const [px,py]=startPx(V,...SPICK.pins[e.dataset.isl]),hw=e.offsetWidth/2+4;
    e.style.left=Math.max(hw,Math.min(Math.max(hw,V.w-hw),px))+'px';e.style.top=py+'px';e.hidden=py<0||py>V.h}
  const p=SPICK.pick,pin=document.getElementById('startPin');pin.hidden=!p;if(p){const [px,py]=startPx(V,p.x,p.z);pin.style.left=px+'px';pin.style.top=py+'px'}}
const startHint=t=>document.getElementById('startMapHint').textContent=t;
document.getElementById('startMap').addEventListener('click',e=>{const r=e.currentTarget.getBoundingClientRect(),V=startView(),
  p={x:V.cx+(e.clientX-r.left-V.w/2)*V.mpp,z:V.cz+(e.clientY-r.top-V.h/2)*V.mpp};
  if(!SPICK.zoom){SPICK.zoom=p;document.getElementById('startOut').hidden=false;startLay();startHint('Tap again where you want to start');return}
  SPICK.pick=p;startLay();if(SPICK.go)SPICK.go()});
// back out to the whole map
function startUnzoom(){SPICK.zoom=null;SPICK.pick=null;document.getElementById('startOut').hidden=true;startLay()}
document.getElementById('startOut').addEventListener('click',e=>{e.stopPropagation();startUnzoom();if(document.getElementById('startMap').classList.contains('ready'))startHint('Tap the map to zoom in')});
addEventListener('resize',startLay);startLay();
