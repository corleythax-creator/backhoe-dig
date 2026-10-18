// Corley's Island: the map editor (☰ menu, or G). Shape the ground (raise, lower, flatten, smooth), paint dirt or grass or a material
// from the library (concrete, steel, brick and more; materials.js), lay out and grade roads, and place, move, turn, resize, copy, query and remove trees and boulders; the machines can be
// moved and turned too. Edits are layers over the generated mesa (ED_H, ED_P, ED_M, ROADS and the asset list, terrain.js and
// scenery.js), saved on this device
// as you go; the map can be copied out as text and loaded back. While it is open the game stands still.
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.
const ed={tool:'raise',size:15*FT,str:5,kind:'pine',mat:10,square:false,x:0,z:10,yaw:0,pitch:0.95,dist:45,
  stroke:null,flatH:0,road:null,rpt:-1,drawing:false,roadSnap:null,bx:0,bz:0,hover:false,pend:null,refT:0,sel:null,drag:null,snap:null,changed:false,saveT:0,undo:[],redo:[]};
const ED_TOOLS={look:'Look',raise:'Raise',lower:'Lower',flatten:'Flatten',smooth:'Smooth',dirt:'Dirt',grass:'Grass',select:'Select',add:'Add',query:'Query',roads:'Roads',paint:'Paint'};
const ED_BRUSH=['raise','lower','flatten','smooth','dirt','grass','paint'];
const ED_KINDS={pine:'Pine tree',leafy:'Leafy tree',rock:'Boulder'};
// the machines and the walker can be picked and moved: their state, scene object and pick radius
const ED_MACH=[{name:'Excavator',o:()=>st,m:()=>machine,r:2.6},{name:'Dump truck',o:()=>tr,m:()=>truck,r:3.6},{name:'Mower',o:()=>mw,m:()=>mower,r:1.2},{name:'You, on foot',o:()=>wk,m:()=>walker,r:0.8}];
const edFt=m=>m/FT,edFmt=(m,d)=>(m/FT).toFixed(d===undefined?1:d);

// brush and selection rings drawn over the ground
function edRing(color){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(65*3),3));
  const l=new THREE.Line(g,new THREE.LineBasicMaterial({color,depthTest:false,transparent:true,opacity:0.95,fog:false,toneMapped:false}));l.renderOrder=20;l.frustumCulled=false;l.visible=false;scene.add(l);return l}
const edBrushRing=edRing(0xffd23f),edSelRing=edRing(0xf07a22);
function edRingAt(l,x,z,r,sq){const p=l.geometry.attributes.position.array;
  for(let i=0;i<=64;i++){const a=i/64*Math.PI*2,c=Math.cos(a),s=Math.sin(a),k=sq?1/Math.max(Math.abs(c),Math.abs(s)):1,px=x+c*r*k,pz=z+s*r*k;p[i*3]=px;p[i*3+1]=hAt(px,pz)+0.15;p[i*3+2]=pz}
  l.geometry.attributes.position.needsUpdate=true;l.visible=true}

// ---------- open and close ----------
function editorOpen(){if(edOn||bench.on)return;edOn=true;mapAssets=assets;
  document.body.classList.add('editing');$('#editor').hidden=false;showMenu(false);help.hidden=true;toggleMap(false);clearKeys();
  const fv=mode==='truck'?tr:mode==='mow'?mw:mode==='walk'?wk:st;ed.x=fv.x;ed.z=fv.z;
  ed.yaw=Math.atan2(camera.position.x-fv.x,camera.position.z-fv.z);ed.dist=45;ed.pitch=0.95;
  edTool(ed.tool);edInfo(null);toast('Map editor. The game is paused while you edit.','',2600)}
function editorClose(){if(!edOn)return;edStrokeEnd();edRoadFinish();edOn=false;document.body.classList.remove('editing');$('#editor').hidden=true;
  edBrushRing.visible=edSelRing.visible=false;ed.sel=null;ed.road=null;ed.rpt=-1;edRoadsDraw();clearKeys();firstCam=true;last=performance.now();
  if(ed.changed){edSave();mapBg=null;mapDirty=true;ed.changed=false}}
$('#edDone').onclick=editorClose;
$('#editBtn').onclick=editorOpen;

// ---------- tools ----------
function edTool(t){if(t!=='roads'){edRoadFinish();ed.road=null;ed.rpt=-1}ed.tool=t;ed.sel=t==='select'?ed.sel:null;edSelRing.visible=!!ed.sel;
  document.querySelectorAll('.edtools button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.t===t));
  document.querySelectorAll('#edOpts [data-for]').forEach(el=>el.hidden=!el.dataset.for.split(' ').includes(t));
  if(t!=='query'&&t!=='select')edInfo(null);edBrushRing.visible=false;if(t==='roads')edRoadCard();edRoadsDraw()}
document.querySelectorAll('.edtools button').forEach(b=>b.onclick=()=>edTool(b.dataset.t));
document.querySelectorAll('.edkind button').forEach(b=>b.onclick=()=>{ed.kind=b.dataset.k;document.querySelectorAll('.edkind button').forEach(c=>c.setAttribute('aria-pressed',c===b))});
// the material library: every texture by kind, plus Natural ground, which clears a material
(function(){const N=MAT_LIST.length,sw=m=>m?`<i style="background-size:${N*100}% 100%;background-position:${(m-1)/(N-1)*100}% 0"></i>`:'<i class="nat"></i>';
  const btn=m=>`<button class="edmat" data-m="${m}" aria-pressed="${m===ed.mat}">${sw(m)}<span>${m?MAT_LIST[m-1].n:'Natural ground'}</span></button>`;
  let h=`<h3>Material library <small>${N} textures</small></h3>`;
  MAT_CATS.forEach((c,ci)=>{const ms=ci?[]:[0];MAT_LIST.forEach((d,i)=>{if(d.cat===ci)ms.push(i+1)});h+=`<h4>${c}</h4><div class="edmatgrid">${ms.map(btn).join('')}</div>`});
  const box=$('#edMats');box.innerHTML=h;
  box.querySelectorAll('.edmat').forEach(b=>b.onclick=()=>{ed.mat=+b.dataset.m;box.querySelectorAll('.edmat').forEach(c=>c.setAttribute('aria-pressed',c===b));edMatLabel()})})();
document.querySelectorAll('.edshape button').forEach(b=>b.onclick=()=>{ed.square=b.dataset.s==='sq';document.querySelectorAll('.edshape button').forEach(c=>c.setAttribute('aria-pressed',c===b))});
function edMatLabel(){const d=MAT_LIST[ed.mat-1];$('#edMatV').textContent=d?`${d.n} (one tile is ${d.ft} ft)`:'Natural ground (clears materials)'}
edMatLabel();
const edSizeIn=$('#edSize'),edStrIn=$('#edStr');
function edSliders(){$('#edSizeV').textContent=`${Math.round(edFt(ed.size))} ft`;$('#edStrV').textContent=ed.str}
edSizeIn.oninput=()=>{ed.size=+edSizeIn.value*FT;edSliders()};edStrIn.oninput=()=>{ed.str=+edStrIn.value;edSliders()};
edSizeIn.value=Math.round(edFt(ed.size));edStrIn.value=ed.str;edSliders();

// ---------- picking the ground ----------
const edRay=new THREE.Raycaster(),edNdc=new THREE.Vector2();
// where a screen point meets the ground: march along the ray, then halve the step to the crossing
function edPick(cx,cy){const r=canvas.getBoundingClientRect();edNdc.set((cx-r.left)/r.width*2-1,-(cy-r.top)/r.height*2+1);
  edRay.setFromCamera(edNdc,camera);const o=edRay.ray.origin,d=edRay.ray.direction;let t0=0,t=0;
  for(let n=0;n<2000&&t<900;n++){const s=Math.max(0.3,t*0.01);t0=t;t+=s;if(o.y+d.y*t<hAt(o.x+d.x*t,o.z+d.z*t))break;if(n===1999||t>=900)return null}
  for(let n=0;n<12;n++){const m=(t0+t)/2;if(o.y+d.y*m<hAt(o.x+d.x*m,o.z+d.z*m))t=m;else t0=m}
  return {x:o.x+d.x*t,z:o.z+d.z*t}}
// the nearest tree, boulder or machine to a ground point, if one is under it
function edHit(x,z){let best=null,bd=1;
  for(const a of assets){const r=(a.t==='rock'?1.0:1.6)*a.s,d=Math.hypot(a.x-x,a.z-z)/r;if(d<bd){bd=d;best={a}}}
  for(const m of ED_MACH){if(!m.m().visible)continue;const o=m.o(),d=Math.hypot(o.x-x,o.z-z)/m.r;if(d<bd){bd=d;best={m}}}
  return best}

// ---------- reshaping and painting ----------
const edGrow=(r,a,b,c,d)=>r?[Math.min(r[0],a),Math.max(r[1],b),Math.min(r[2],c),Math.max(r[3],d)]:[a,b,c,d];
function edStrokeStart(x,z){ed.stroke={h:ED_H.slice(),p:ED_P.slice(),m:ED_M.slice(),ij:null};ed.bx=x;ed.bz=z;ed.flatH=baseHeight(x,z)}
// one frame of the brush: a soft round brush, strongest in the middle
function edBrush(dt){const R=ed.size,cx=ed.bx,cz=ed.bz,t=ed.tool,k=ed.str/10;
  const i0=Math.max(3,Math.floor((cx-R-ED_X0)/ED_C)),i1=Math.min(ED_NX-4,Math.ceil((cx+R-ED_X0)/ED_C)),j0=Math.max(3,Math.floor((cz-R-ED_Z0)/ED_C)),j1=Math.min(ED_NZ-4,Math.ceil((cz+R-ED_Z0)/ED_C));
  if(i0>i1||j0>j1)return;
  // painting turns ruts into what is painted, except Mud, and Dirt on ground that is already wet (mud.js)
  if((t==='paint'&&ed.mat!==MUD_ID||t==='grass'||t==='dirt')&&rutErase(cx,cz,R,t==='paint'&&ed.square,t==='dirt'?(x,z)=>soakAt(x,z)>0.3:null)){
    ed.pend=edGrow(ed.pend,cx-R-0.6,cx+R+0.6,cz-R-0.6,cz+R+0.6);ed.changed=true}
  let hs=null,W=0;
  if(t==='smooth'||t==='flatten'){W=i1-i0+3;hs=new Float32Array(W*(j1-j0+3));
    for(let j=j0-1;j<=j1+1;j++)for(let i=i0-1;i<=i1+1;i++)hs[(j-j0+1)*W+i-i0+1]=baseHeight(ED_X0+i*ED_C,ED_Z0+j*ED_C)}
  // materials go down whole cells, hard edged, inside the ring (or the square, lined up north-south, for slabs and plates)
  if(t==='paint'){let n=0;for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){const q=j*ED_NX+i,dx=ED_X0+i*ED_C-cx,dz=ED_Z0+j*ED_C-cz;
      if(ED_M[q]!==ed.mat&&(ed.square?Math.max(Math.abs(dx),Math.abs(dz)):Math.hypot(dx,dz))<=R){ED_M[q]=ed.mat;n++}}
    if(!n)return;matU.tMatId.value.needsUpdate=true}
  else for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){const x=ED_X0+i*ED_C,z=ED_Z0+j*ED_C,d=Math.hypot(x-cx,z-cz);if(d>R)continue;
    const f=0.5*(1+Math.cos(Math.PI*d/R)),q=j*ED_NX+i;
    if(t==='raise')ED_H[q]+=1.5*k*dt*f;
    else if(t==='lower')ED_H[q]-=1.5*k*dt*f;
    else if(t==='flatten')ED_H[q]+=(ed.flatH-hs[(j-j0+1)*W+i-i0+1])*Math.min(1,dt*6*k)*f;
    else if(t==='smooth'){const c=(j-j0+1)*W+i-i0+1,avg=(hs[c-1]+hs[c+1]+hs[c-W]+hs[c+W]+hs[c-W-1]+hs[c-W+1]+hs[c+W-1]+hs[c+W+1])/8;ED_H[q]+=(avg-hs[c])*Math.min(1,dt*10*k)*f}
    else if(t==='dirt')ED_P[q]=Math.min(1,ED_P[q]+2*k*dt*f);
    else if(t==='grass')ED_P[q]=Math.max(-1,ED_P[q]-2*k*dt*f);
    ED_H[q]=Math.max(-60,Math.min(60,ED_H[q]))}
  ed.stroke.ij=edGrow(ed.stroke.ij,i0,i1,j0,j1);
  ed.pend=edGrow(ed.pend,ED_X0+i0*ED_C-0.6,ED_X0+i1*ED_C+0.6,ED_Z0+j0*ED_C-0.6,ED_Z0+j1*ED_C+0.6);ed.changed=true}
// everything built from the ground over an area (metres) follows the edit: the dig grid (dug holes keep their depth;
// undug ground stays exactly at grade, so the site save skips it), the 0.5 m ground, steep-ground stops, grass tufts,
// the tall grass and the trees and boulders on it
function edRefresh(r,full){if(!r)return;const [x0,x1,z0,z1]=r;
  const i0=Math.max(0,Math.floor((x0+S/2)/CELL)),i1=Math.min(N,Math.ceil((x1+S/2)/CELL)),j0=Math.max(0,Math.floor((z0+S/2)/CELL)),j1=Math.min(N,Math.ceil((z1+S/2)/CELL));
  if(i0<=i1&&j0<=j1){for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){const k=j*V+i,b=baseHeight(i*CELL-S/2,j*CELL-S/2);H[k]=H[k]===H0[k]?b:H[k]+b-H0[k];H0[k]=b;digBase(k)}
    touch(i0,i1,j0,j1);updateTufts(i0-1,i1+1,j0-1,j1+1);lawnTerrain();updateTerrain();winOn=false;blkTerrainMoved()}
  midUpdate(x0,x1,z0,z1);mudEdRefresh(x0,x1,z0,z1);rainEdRefresh(x0,x1,z0,z1);wallBuild(x0,x1,z0,z1);tuftsRefresh(x0,x1,z0,z1);
  if(assets.some(a=>a.x>x0-2&&a.x<x1+2&&a.z>z0-2&&a.z<z1+2)){assetsBuild();shpTreesRefresh()}
  if(full&&(x0<-S/2+1||x1>S/2-1||z0<-S/2+1||z1>S/2-1||x0<MID[0]+1||x1>MID[1]-1||z0<MID[2]+1||z1>MID[3]-1))buildSkirts()}
function edStrokeEnd(){const s=ed.stroke;if(!s)return;ed.stroke=null;edRefresh(ed.pend,true);ed.pend=null;
  if(!s.ij)return;const [i0,i1,j0,j1]=s.ij,w=i1-i0+1,h=new Float32Array(w*(j1-j0+1)),p=new Float32Array(h.length),m=new Uint8Array(h.length);
  for(let j=j0;j<=j1;j++){const a=j*ED_NX+i0,b=j*ED_NX+i1+1,o=(j-j0)*w;h.set(s.h.subarray(a,b),o);p.set(s.p.subarray(a,b),o);m.set(s.m.subarray(a,b),o)}
  edPush({g:[i0,i1,j0,j1],h,p,m});edQueueSave();matTexUpdate()}

// ---------- undo ----------
function edPush(u){ed.undo.push(u);if(ed.undo.length>30)ed.undo.shift();ed.redo.length=0;edUndoBtns()}
function edUndoBtns(){$('#edUndo').disabled=!ed.undo.length;$('#edRedo').disabled=!ed.redo.length}
// swaps the saved state with the current one, so the same entry undoes and redoes
function edSwap(u){
  if(u.g){const [i0,i1,j0,j1]=u.g,w=i1-i0+1;
    for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){const q=j*ED_NX+i,o=(j-j0)*w+i-i0,a=ED_H[q],b=ED_P[q],c=ED_M[q];ED_H[q]=u.h[o];ED_P[q]=u.p[o];ED_M[q]=u.m[o];u.h[o]=a;u.p[o]=b;u.m[o]=c}
    matU.tMatId.value.needsUpdate=true;matTexUpdate();
    edRefresh([ED_X0+i0*ED_C-0.6,ED_X0+i1*ED_C+0.6,ED_Z0+j0*ED_C-0.6,ED_Z0+j1*ED_C+0.6],true)}
  else if(u.roads){const now=edRoadsSnap();edRoadsSet(u.roads);u.roads=now;ed.road=null;ed.rpt=-1;edRoadCard();edRoadsDraw();edRefresh(u.rect,true)}
  else{const now=JSON.stringify(assets);assets.length=0;assets.push(...JSON.parse(u.a));u.a=now;ed.sel=null;edSelRing.visible=false;edInfo(null);assetsBuild();shpTreesRefresh()}
  ed.changed=true;edQueueSave()}
function edUndo(){const u=ed.undo.pop();if(!u)return;edStrokeEnd();edSwap(u);ed.redo.push(u);edUndoBtns()}
function edRedo(){const u=ed.redo.pop();if(!u)return;edSwap(u);ed.undo.push(u);edUndoBtns()}
$('#edUndo').onclick=edUndo;$('#edRedo').onclick=edRedo;
const edAssetsSnap=()=>JSON.stringify(assets);
function edAssetsChanged(before){edPush({a:before});assetsBuild();shpTreesRefresh();ed.changed=true;edQueueSave()}

// ---------- the info card: what is at a spot, or the selected tree, boulder or machine ----------
function edWhere(x,z){const e=x,s=z-(TRENCH_Z0+TRENCH_Z1)/2;
  return `${edFmt(Math.abs(e),0)} ft ${e<0?'west':'east'}, ${edFmt(Math.abs(s),0)} ft ${s<0?'north':'south'} of the trench`}
function edQuery(x,z){const g=baseHeight(x,z),h=hAt(x,z),r=mesaR(x,z);
  const sx=(baseHeight(x+0.5,z)-baseHeight(x-0.5,z)),sz=(baseHeight(x,z+0.5)-baseHeight(x,z-0.5)),sl=Math.hypot(sx,sz);
  const top=r<EDGE||famR(x,z)<FAM_R||jesR(x,z)<JES_R||dexR(x,z)<DEX_R,deck=deckAt(x,z)>g;
  const surf=deck?'Bridge deck':paintAt(x,z)?MAT_LIST[paintAt(x,z)-1].n:g<WATER?'Lake':roadAmt(x,z)>0.5?'Road':sl>0.9?'Rock face':yardAt(x,z)>0.5?'Dirt yard':top?'Grass':'Meadow below the cliffs';
  const drive=!landIn(x,z,1,0)?'No, off the island':wallAt(x,z)?'No, too steep':'Yes';
  const dh=edSample(ED_H,x,z),dp=edSample(ED_P,x,z),mine=[];
  if(Math.abs(dh)>0.02)mine.push(`${dh>0?'raised':'lowered'} ${edFmt(Math.abs(dh))} ft`);if(dp>0.05)mine.push('painted dirt');if(dp<-0.05)mine.push('painted grass');
  const mt=paintAt(x,z);if(mt)mine.push(MAT_LIST[mt-1].n.toLowerCase());
  const rows=[['Spot',edWhere(x,z)],['Ground',`${g>=0?'+':'−'}${edFmt(Math.abs(g))} ft (mesa top is 0)`],['Slope',`${Math.round(sl*100)}% · ${Math.round(Math.atan(sl)*57.3)}°`],
    ['Surface',surf],['Driveable',drive]];
  if(h<g-0.04)rows.push(['Dug',`${edFmt(g-h)} ft below the ground`]);else if(h>g+0.04)rows.push(['Dumped',`${edFmt(h-g)} ft of dirt`]);
  if(mine.length)rows.push(['Your edits',mine.join(', ')]);
  const hit=edHit(x,z);if(hit)rows.push(['Here',hit.a?edAssetName(hit.a):hit.m.name]);
  edInfo(`<h3>Ground here</h3><dl>${rows.map(([a,b])=>`<dt>${a}</dt><dd>${b}</dd>`).join('')}</dl>`)}
function edAssetName(a){return a.t==='rock'?`Boulder, ${edFmt(1.6*a.s,0)} ft across`:`${ED_KINDS[a.t]}, ${edFmt((a.t==='pine'?5.9:4.7)*a.s,0)} ft tall`}
function edInfo(html){const el=$('#edInfo');el.hidden=!html;if(html)el.innerHTML=html}
function edSelect(hit){ed.sel=hit;if(!hit){edSelRing.visible=false;edInfo(null);return}
  const o=hit.a||hit.m.o(),title=hit.a?edAssetName(hit.a):hit.m.name,yaw=hit.a?hit.a.yaw:o.yaw||0;
  edInfo(`<h3>${title}</h3><dl><dt>Spot</dt><dd>${edWhere(o.x,o.z)}</dd><dt>Ground</dt><dd>${baseHeight(o.x,o.z)>=0?'+':'−'}${edFmt(Math.abs(baseHeight(o.x,o.z)))} ft</dd></dl>
    <div class="edopt"><label for="edSelTurn">Turn</label><input id="edSelTurn" type="range" min="0" max="359" step="1" value="${Math.round(((yaw*57.3)%360+360)%360)}"><output id="edSelTurnV"></output></div>
    ${hit.a?`<div class="edopt"><label for="edSelSize">Size</label><input id="edSelSize" type="range" min="30" max="300" step="5" value="${Math.round(hit.a.s*100)}"><output id="edSelSizeV"></output></div>
    <div class="row"><button id="edSelCopy" class="sm">Copy</button><button id="edSelDel" class="sm danger">Delete</button></div>`:'<p class="hint">Drag it to move it.</p>'}`);
  const tv=$('#edSelTurn'),sv=$('#edSelSize');const lab=()=>{$('#edSelTurnV').textContent=tv.value+'°';if(sv)$('#edSelSizeV').textContent=sv.value+'%'};lab();
  let snap=null;const begin=()=>{if(hit.a&&!snap)snap=edAssetsSnap()},commit=()=>{if(snap){edAssetsChanged(snap);snap=null}};
  tv.oninput=()=>{begin();lab();const y=+tv.value/57.3;if(hit.a){hit.a.yaw=y;assetsBuild();shpTreesRefresh()}else{o.yaw=y;if(o===wk)wk.view=y;hit.m.m().rotation.y=y}};
  tv.onchange=commit;
  if(sv){sv.oninput=()=>{begin();lab();hit.a.s=+sv.value/100;assetsBuild();shpTreesRefresh();edRingSel()};sv.onchange=()=>{commit();$('#edInfo h3').textContent=edAssetName(hit.a)};
    $('#edSelCopy').onclick=()=>{const b=edAssetsSnap(),a=Object.assign({},hit.a,{x:hit.a.x+2.5*hit.a.s,z:hit.a.z+1.5*hit.a.s});assets.push(a);edAssetsChanged(b);edSelect({a})};
    $('#edSelDel').onclick=edDelete}
  edRingSel()}
function edRingSel(){const s=ed.sel;if(!s){edSelRing.visible=false;return}const o=s.a||s.m.o();edRingAt(edSelRing,o.x,o.z,s.a?(s.a.t==='rock'?1.0:1.6)*s.a.s:s.m.r)}
function edDelete(){const s=ed.sel;if(!s||!s.a)return;const b=edAssetsSnap(),i=assets.indexOf(s.a);if(i<0)return;assets.splice(i,1);edAssetsChanged(b);edSelect(null)}
// moves a machine (or the walker) to a spot on the mesa and sets it down on the ground there
function edPlaceMachine(m,x,z){const o=m.o();[x,z]=landClamp(x,z,4,2);
  o.x=x;o.z=z;if(o===tr)tr.v=0;const y=surfAt(x,z);o.y=y;m.m().position.set(x,y,z)}

// ---------- roads ----------
// Roads tool: tap a road to pick it, drag its points (dots) to move them, tap the picked road between points to add one,
// or lay a new road point by point. Its card sets the width, grass up the middle, grading (cut and filled to a height
// at each point, like the ramp; otherwise it follows the ground), the picked point's height, and deletes
const edRoadsSnap=()=>JSON.stringify(ROADS);
function edRoadsSet(json){ROADS.length=0;ROADS.push(...JSON.parse(json));roadsBuild();ed.roadsEdited=true}
// the area a road (or the points i0..i1 of it) reaches, with its banks
function edRoadBox(r,i0,i1){let x0=1e9,x1=-1e9,z0=1e9,z1=-1e9;const m=r.w/2+3.2;
  for(let i=Math.max(0,i0===undefined?0:i0);i<=Math.min(r.pts.length-1,i1===undefined?1e9:i1);i++){const q=r.pts[i];x0=Math.min(x0,q[0]);x1=Math.max(x1,q[0]);z0=Math.min(z0,q[1]);z1=Math.max(z1,q[1])}
  return x0>x1?null:[x0-m,x1+m,z0-m,z1+m]}
const edUnion=(a,b)=>!a?b:!b?a:[Math.min(a[0],b[0]),Math.max(a[1],b[1]),Math.min(a[2],b[2]),Math.max(a[3],b[3])];
// a change to roads: rebuild the lookup, redraw, and bring the ground over the area up to date (now, or a few times a second while dragging)
function edRoadsChanged(rect,now){roadsBuild();ed.roadsEdited=true;ed.changed=true;edRoadsDraw();
  if(now)edRefresh(rect,true);else ed.pend=edUnion(ed.pend,rect)}
function edRoadCommit(rect){edPush({roads:ed.roadSnap,rect});ed.roadSnap=null;edQueueSave()}
// handles: every road point as a dot, the picked road's brighter, the picked point biggest, and the picked road's line
const edDotTex=(function(){const c=document.createElement('canvas');c.width=c.height=32;const g=c.getContext('2d');
  g.beginPath();g.arc(16,16,11,0,7);g.fillStyle='#fff';g.fill();g.lineWidth=5;g.strokeStyle='rgba(20,23,19,.9)';g.stroke();return new THREE.CanvasTexture(c)})();
function edDots(color,size,cap){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(cap*3),3));g.setDrawRange(0,0);
  const p=new THREE.Points(g,new THREE.PointsMaterial({color,size,sizeAttenuation:false,map:edDotTex,transparent:true,alphaTest:0.3,depthTest:false,fog:false,toneMapped:false}));
  p.renderOrder=22;p.frustumCulled=false;p.visible=false;p.userData.px=size;scene.add(p);return p}
const edAllDots=edDots(0xe8ece4,13,1500),edRoadDots=edDots(0xf07a22,19,256),edPtDot=edDots(0xffd23f,27,1);
const edRoadLine=(function(){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(6000*3),3));g.setDrawRange(0,0);
  const l=new THREE.Line(g,new THREE.LineBasicMaterial({color:0xf07a22,depthTest:false,transparent:true,fog:false,toneMapped:false}));l.renderOrder=21;l.frustumCulled=false;l.visible=false;scene.add(l);return l})();
function edDotsSet(P,list){const a=P.geometry.attributes.position,n=Math.min(list.length,a.count);
  for(let i=0;i<n;i++){const q=list[i];a.array[i*3]=q[0];a.array[i*3+1]=hAt(q[0],q[1])+0.3;a.array[i*3+2]=q[1]}
  a.needsUpdate=true;P.geometry.setDrawRange(0,n);P.material.size=P.userData.px*renderer.getPixelRatio();P.visible=n>0}
function edRoadsDraw(){const on=edOn&&ed.tool==='roads',r=on?ed.road:null;
  edDotsSet(edAllDots,on?ROADS.flatMap(o=>o===r?[]:o.pts):[]);edDotsSet(edRoadDots,r?r.pts:[]);edDotsSet(edPtDot,r&&ed.rpt>=0?[r.pts[ed.rpt]]:[]);
  const a=edRoadLine.geometry.attributes.position;let n=0;
  if(r)for(let i=0;i<r.pts.length-1;i++){const p=r.pts[i],q=r.pts[i+1],L=Math.hypot(q[0]-p[0],q[1]-p[1]),k=Math.max(1,Math.ceil(L));
    for(let j=(i?1:0);j<=k&&n<a.count;j++){const x=p[0]+(q[0]-p[0])*j/k,z=p[1]+(q[1]-p[1])*j/k;a.array[n*3]=x;a.array[n*3+1]=hAt(x,z)+0.25;a.array[n*3+2]=z;n++}}
  a.needsUpdate=true;edRoadLine.geometry.setDrawRange(0,n);edRoadLine.visible=n>1}
// the road point under a screen spot (within about a fingertip), then the road under a ground spot
const edV=new THREE.Vector3();
function edRoadPtAt(cx,cy){const rc=canvas.getBoundingClientRect();let best=null,bd=26*26;
  for(const r of ROADS)r.pts.forEach((q,i)=>{edV.set(q[0],hAt(q[0],q[1])+0.3,q[1]).project(camera);if(edV.z>1)return;
    const sx=(edV.x+1)/2*rc.width+rc.left,sy=(1-edV.y)/2*rc.height+rc.top,d=(sx-cx)**2+(sy-cy)**2;
    if(d<bd||(d===bd&&r===ed.road)){bd=d;best={r,i}}});return best}
function edRoadSegAt(x,z,only){let best=null,bd=1e9;
  for(const r of only?[only]:ROADS)for(let i=0;i<r.pts.length-1;i++){const a=r.pts[i],b=r.pts[i+1],[d,t]=edSegD(x,z,a,b);
    if(d<r.w/2+1.2&&d<bd){bd=d;best={r,i,t}}}return best}
function edSegD(x,z,a,b){const dx=b[0]-a[0],dz=b[1]-a[1],L2=dx*dx+dz*dz||1;let t=((x-a[0])*dx+(z-a[1])*dz)/L2;t=Math.max(0,Math.min(1,t));return [Math.hypot(x-a[0]-dx*t,z-a[1]-dz*t),t]}
const edGraded=r=>r.pts.every(q=>q.length>2);
const edClampXZ=(x,z)=>[clamp(x,ED_X0+3,ED_X0+(ED_NX-4)*ED_C),clamp(z,ED_Z0+3,ED_Z0+(ED_NZ-4)*ED_C)];
function edRoadDown(p,cx,cy){
  if(ed.drawing){const r=ed.road,[x,z]=edClampXZ(p.x,p.z);r.pts.push(edGraded(r)&&r.pts.length?[x,z,baseHeight(x,z)]:[x,z]);ed.rpt=r.pts.length-1;
    edRoadsChanged(edRoadBox(r,ed.rpt-1,ed.rpt),true);edRoadCard();ed.drag={road:r,i:ed.rpt,moved:false,drawing:true};return}
  const hp=edRoadPtAt(cx,cy);
  if(hp){ed.road=hp.r;ed.rpt=hp.i;ed.roadSnap=edRoadsSnap();ed.drag={road:hp.r,i:hp.i,moved:false,box:edRoadBox(hp.r,hp.i-1,hp.i+1)};edRoadCard();edRoadsDraw();return}
  // tapping the picked road between its points adds a point there, ready to drag
  const sg=ed.road&&edRoadSegAt(p.x,p.z,ed.road);
  if(sg){const r=sg.r,a=r.pts[sg.i],b=r.pts[sg.i+1],[x,z]=edClampXZ(p.x,p.z);ed.roadSnap=edRoadsSnap();
    r.pts.splice(sg.i+1,0,edGraded(r)?[x,z,a[2]+(b[2]-a[2])*sg.t]:[x,z]);ed.rpt=sg.i+1;
    ed.drag={road:r,i:ed.rpt,moved:true,box:edRoadBox(r,sg.i,sg.i+2)};edRoadsChanged(ed.drag.box,false);edRoadCard();return}
  const any=edRoadSegAt(p.x,p.z);
  if(any){ed.road=any.r;ed.rpt=-1;edRoadCard();edRoadsDraw();return}
  ed.road=null;ed.rpt=-1;edRoadCard();edRoadsDraw();edMouse={pan:true,x:cx,y:cy}}
function edRoadDrag(d,p){const r=d.road,q=r.pts[d.i],old=edRoadBox(r,d.i-1,d.i+1),[x,z]=edClampXZ(p.x,p.z);
  q[0]=x;q[1]=z;d.moved=true;d.box=edUnion(d.box,edUnion(old,edRoadBox(r,d.i-1,d.i+1)));edRoadsChanged(edUnion(old,edRoadBox(r,d.i-1,d.i+1)),false)}
function edRoadUp(d){if(d.drawing){edRefresh(ed.pend,true);ed.pend=null;return}
  if(d.moved){edRefresh(ed.pend,true);ed.pend=null;edRoadCommit(d.box)}else ed.roadSnap=null;edRoadCard()}
function edRoadNew(){edRoadFinish();ed.roadSnap=edRoadsSnap();const r={w:3.6,mid:1,pts:[]};ROADS.push(r);ed.road=r;ed.rpt=-1;ed.drawing=true;
  edRoadCard();toast('Tap the ground to lay the road, point by point. Tap Finish when it is done.','',3600)}
function edRoadFinish(){if(!ed.drawing)return;ed.drawing=false;const r=ed.road;
  if(!r||r.pts.length<2){const i=ROADS.indexOf(r);if(i>=0)ROADS.splice(i,1);ed.road=null;ed.rpt=-1;edRoadsChanged(r&&edRoadBox(r),true);ed.roadSnap=null}
  else edRoadCommit(edRoadBox(r));edRoadCard();edRoadsDraw()}
function edRoadDelete(whole){const r=ed.road;if(!r||ed.drawing&&!whole)return;const box=edRoadBox(r);
  // deleting a road still being laid just drops it: nothing was committed yet
  if(ed.drawing){ROADS.splice(ROADS.indexOf(r),1);ed.drawing=false;ed.road=null;ed.rpt=-1;ed.roadSnap=null;edRoadsChanged(box,true);edRoadCard();return}
  ed.roadSnap=edRoadsSnap();
  if(!whole&&ed.rpt>=0&&r.pts.length>2){r.pts.splice(ed.rpt,1);ed.rpt=Math.min(ed.rpt,r.pts.length-1)}
  else{ROADS.splice(ROADS.indexOf(r),1);ed.road=null;ed.rpt=-1;ed.drawing=false}
  edRoadsChanged(box,true);edRoadCommit(box);edRoadCard()}
// the picked road's card
function edRoadCard(){const ob=$('#edRoadNew'),fb=$('#edRoadFin');if(ob){ob.hidden=ed.drawing;fb.hidden=!ed.drawing}
  if(ed.tool!=='roads')return;const r=ed.road;if(!r){edInfo(null);return}
  let L=0,steep=0;for(let i=0;i<r.pts.length-1;i++){const a=r.pts[i],b=r.pts[i+1],l=Math.hypot(b[0]-a[0],b[1]-a[1]);L+=l;if(a.length>2&&b.length>2&&l>0.1)steep=Math.max(steep,Math.abs(b[2]-a[2])/l)}
  const g=edGraded(r),q=ed.rpt>=0?r.pts[ed.rpt]:null;
  edInfo(`<h3>${ed.drawing?'New road':g?'Graded road (cut and filled to each point\u2019s height)':r.mid?'Road (follows the ground)':'Track (follows the ground)'}</h3><dl><dt>Length</dt><dd id="edRdLen">${edFmt(L,0)} ft · ${r.pts.length} points</dd>${g?`<dt>Steepest</dt><dd>${Math.round(steep*100)}%</dd>`:''}</dl>
    <div class="edopt"><label for="edRdW">Width</label><input id="edRdW" type="range" min="6" max="26" step="1" value="${Math.round(edFt(r.w))}"><output id="edRdWV">${Math.round(edFt(r.w))} ft</output></div>
    <div class="row"><button id="edRdMid" class="sm" aria-pressed="${!!r.mid}">Grass up the middle</button><button id="edRdGrade" class="sm" aria-pressed="${g}">Graded</button></div>
    ${g&&q?`<div class="edopt"><label for="edRdH">Point height</label><input id="edRdH" type="range" min="-80" max="40" step="0.5" value="${edFt(q[2]).toFixed(1)}"><output id="edRdHV">${edFt(q[2]).toFixed(1)} ft</output></div>`:''}
    <div class="row">${q&&r.pts.length>2?'<button id="edRdDelPt" class="sm danger">Delete point</button>':''}<button id="edRdDel" class="sm danger">Delete road</button></div>`);
  const box=()=>edRoadBox(r);
  const w=$('#edRdW');w.oninput=()=>{if(!ed.roadSnap)ed.roadSnap=edRoadsSnap();const b0=box();r.w=+w.value*FT;$('#edRdWV').textContent=w.value+' ft';roadsBuild();ed.roadsEdited=true;edRoadsDraw();ed.wBox=edUnion(ed.wBox,edUnion(b0,box()))};
  w.onchange=()=>{edRoadsChanged(ed.wBox,true);edRoadCommit(ed.wBox);ed.wBox=null};
  $('#edRdMid').onclick=()=>{ed.roadSnap=edRoadsSnap();r.mid=r.mid?0:1;edRoadsChanged(box(),true);edRoadCommit(box());edRoadCard()};
  // grading takes each point's height from the ground there now; ungrading lets the road follow the ground again
  $('#edRdGrade').onclick=()=>{ed.roadSnap=edRoadsSnap();if(g)r.pts.forEach(p=>p.length=2);else r.pts.forEach(p=>{p[2]=baseHeight(p[0],p[1])});edRoadsChanged(box(),true);edRoadCommit(box());edRoadCard()};
  const h=$('#edRdH');if(h){h.oninput=()=>{if(!ed.roadSnap)ed.roadSnap=edRoadsSnap();q[2]=+h.value*FT;$('#edRdHV').textContent=(+h.value).toFixed(1)+' ft';edRoadsChanged(edRoadBox(r,ed.rpt-1,ed.rpt+1),false)};
    h.onchange=()=>{edRefresh(ed.pend,true);ed.pend=null;edRoadCommit(edRoadBox(r,ed.rpt-1,ed.rpt+1));edRoadCard()}}
  const dp=$('#edRdDelPt');if(dp)dp.onclick=()=>edRoadDelete(false);
  $('#edRdDel').onclick=()=>edRoadDelete(true)}
$('#edRoadNew').onclick=edRoadNew;$('#edRoadFin').onclick=edRoadFinish;

// ---------- pointer: tools, and look around with two fingers, the right mouse button or the Look tool ----------
const edPtrs=new Map();let edGest=null,edMouse=null;
function edPan(dx,dy){const s=ed.dist*0.0019*(720/Math.max(320,innerHeight)),c=Math.cos(ed.yaw),n=Math.sin(ed.yaw);
  ed.x=clamp(ed.x+(-c*dx-n*dy)*s,-120,120);ed.z=clamp(ed.z+(n*dx-c*dy)*s,-120,350)}
function edDown(x,y){const p=edPick(x,y),t=ed.tool;
  if(t==='look'||!p){edMouse={pan:true,x,y};return}
  if(ED_BRUSH.includes(t)){edStrokeStart(p.x,p.z);edRingAt(edBrushRing,p.x,p.z,ed.size,ed.square&&ed.tool==='paint');return}
  if(t==='roads'){edRoadDown(p,x,y);return}
  if(t==='query'){edQuery(p.x,p.z);edRingAt(edBrushRing,p.x,p.z,0.5);ed.drag={query:true};return}
  if(t==='add'){const b=edAssetsSnap(),a={t:ed.kind,x:p.x,z:p.z,yaw:Math.random()*6.28,s:ed.kind==='rock'?0.7+Math.random()*0.6:0.85+Math.random()*0.4,c:Math.floor(Math.random()*6)};
    assets.push(a);assetsBuild();shpTreesRefresh();ed.drag={a,dx:0,dz:0,snap:b,added:true};edSelect({a});ed.changed=true;return}
  if(t==='select'){const hit=edHit(p.x,p.z);if(!hit){edSelect(null);edMouse={pan:true,x,y};return}
    edSelect(hit);const o=hit.a||hit.m.o();ed.drag={a:hit.a,m:hit.m,dx:o.x-p.x,dz:o.z-p.z,snap:hit.a?edAssetsSnap():null,moved:false}}}
function edMove(x,y){
  if(edMouse){if(edMouse.pan)edPan(x-edMouse.x,y-edMouse.y);else{ed.yaw-=(x-edMouse.x)*0.006;ed.pitch=clamp(ed.pitch+(y-edMouse.y)*0.005,0.25,1.45)}edMouse.x=x;edMouse.y=y;return}
  const p=edPick(x,y);if(!p)return;
  if(ed.stroke){ed.bx=p.x;ed.bz=p.z;edRingAt(edBrushRing,p.x,p.z,ed.size,ed.square&&ed.tool==='paint');return}
  const d=ed.drag;
  if(d&&d.query){edQuery(p.x,p.z);edRingAt(edBrushRing,p.x,p.z,0.5);return}
  if(d&&d.road){edRoadDrag(d,p);return}
  if(d&&d.a){d.a.x=clamp(p.x+d.dx,-118,118);d.a.z=clamp(p.z+d.dz,-118,118);d.moved=true;assetsBuild();shpTreesRefresh();edRingSel();return}
  if(d&&d.m){edPlaceMachine(d.m,p.x+d.dx,p.z+d.dz);d.moved=true;edRingSel();return}
  if(ED_BRUSH.includes(ed.tool)){edRingAt(edBrushRing,p.x,p.z,ed.size,ed.square&&ed.tool==='paint')}}
function edUp(){edMouse=null;edStrokeEnd();const d=ed.drag;ed.drag=null;
  if(d&&d.road){edRoadUp(d);return}
  if(d&&d.a&&(d.moved||d.added)){edPush({a:d.snap});ed.changed=true;edQueueSave();edSelect({a:d.a})}
  else if(d&&d.m&&d.moved)edSelect({m:d.m})}
function edGestStart(){const [a,b]=[...edPtrs.values()];
  edGest={d:Math.hypot(a.x-b.x,a.y-b.y)||1,ang:Math.atan2(b.y-a.y,b.x-a.x),mx:(a.x+b.x)/2,my:(a.y+b.y)/2,dist:ed.dist,yaw:ed.yaw}}
canvas.addEventListener('pointerdown',e=>{if(!edOn)return;canvas.setPointerCapture(e.pointerId);edPtrs.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(edPtrs.size===2){edUp();edGestStart();return}if(edPtrs.size>2)return;
  if(e.pointerType==='mouse'&&e.button===2){edMouse={pan:false,x:e.clientX,y:e.clientY};return}
  if(e.pointerType==='mouse'&&e.button===1){edMouse={pan:true,x:e.clientX,y:e.clientY};return}
  edDown(e.clientX,e.clientY)});
canvas.addEventListener('pointermove',e=>{if(!edOn)return;const p=edPtrs.get(e.pointerId);
  if(p){p.x=e.clientX;p.y=e.clientY}
  if(edGest&&edPtrs.size===2){const [a,b]=[...edPtrs.values()],d=Math.hypot(a.x-b.x,a.y-b.y)||1,ang=Math.atan2(b.y-a.y,b.x-a.x),mx=(a.x+b.x)/2,my=(a.y+b.y)/2;
    ed.dist=clamp(edGest.dist*edGest.d/d,8,220);ed.yaw=edGest.yaw+(ang-edGest.ang);edPan(mx-edGest.mx,my-edGest.my);edGest.mx=mx;edGest.my=my;return}
  if(p||e.pointerType==='mouse')edMove(e.clientX,e.clientY)});
const edEnd=e=>{if(!edOn)return;if(!edPtrs.delete(e.pointerId))return;if(edGest){if(edPtrs.size<2)edGest=null;return}edUp()};
canvas.addEventListener('pointerup',edEnd);canvas.addEventListener('pointercancel',edEnd);
canvas.addEventListener('pointerleave',e=>{if(edOn&&e.pointerType==='mouse'&&!edPtrs.size)edBrushRing.visible=false});
canvas.addEventListener('contextmenu',e=>{if(edOn)e.preventDefault()});
canvas.addEventListener('wheel',e=>{if(!edOn)return;e.preventDefault();ed.dist=clamp(ed.dist*Math.exp(e.deltaY*0.0012),8,220)},{passive:false});

// ---------- keys (fixed, not in the Keys panel): G opens and closes unless a game action has G; WASD or arrows pan, Q E turn, R F zoom, Delete removes, Ctrl+Z undo ----------
addEventListener('keydown',e=>{const tg=e.target&&e.target.tagName;if(tg==='TEXTAREA'||tg==='INPUT')return;
  if(!edOn){if(e.code==='KeyG'&&!e.repeat&&!e.ctrlKey&&!e.metaKey&&!keyActs('KeyG').length&&keysBox.hidden)editorOpen();return}
  const c=e.code,mod=e.ctrlKey||e.metaKey;
  if(mod&&c==='KeyZ'){e.preventDefault();e.shiftKey?edRedo():edUndo();return}
  if(mod&&c==='KeyY'){e.preventDefault();edRedo();return}
  if(e.repeat)return;
  if(c==='KeyG'||c==='Escape')editorClose();
  else if(c==='Delete'||c==='Backspace'){if(ed.tool==='roads')edRoadDelete(ed.rpt<0);else edDelete()}
  else if(c==='Enter'&&ed.drawing)edRoadFinish();
  else{const i=['Digit1','Digit2','Digit3','Digit4','Digit5','Digit6','Digit7','Digit8','Digit9','Digit0'].indexOf(c);if(i>=0)edTool(Object.keys(ED_TOOLS)[i])}});

// ---------- saving, copying and loading ----------
function edQueueSave(){clearTimeout(ed.saveT);ed.saveT=setTimeout(edSave,800)}
function edSave(){clearTimeout(ed.saveT);mapAssets=assets;if(ed.roadsEdited)mapRoads=ROADS;try{localStorage.setItem('bhd_map',mapEncode())}catch(e){toast('Could not save the map on this device (storage is full or blocked).','bad',4000)}}
$('#edFileBtn').onclick=()=>{const f=$('#edFile'),on=f.hidden;f.hidden=!on;$('#edFileBtn').setAttribute('aria-expanded',on);$('#edPasteBox').hidden=true;$('#edCopyBox').hidden=true};
$('#edCopy').onclick=()=>{edSave();const t=mapEncode(),box=$('#edCopyBox');
  const show=()=>{box.value=t;box.hidden=false;box.focus();box.select();toast('Select all of the text and copy it.','',3000)};
  try{navigator.clipboard.writeText(t).then(()=>toast(`Map copied (${Math.round(t.length/1024)} KB of text). Paste it anywhere to keep it.`,'good',3500),show)}catch(e){show()}};
$('#edPasteBtn').onclick=()=>{$('#edPasteBox').hidden=false;$('#edCopyBox').hidden=true;$('#edPaste').focus()};
$('#edLoad').onclick=()=>{const t=$('#edPaste').value.trim();
  try{mapDecode(t)}catch(e){toast('That is not a Corley\'s Island map. Copy one with Copy map first.','bad',3500);return}
  try{localStorage.setItem('bhd_map',t)}catch(e){toast('Could not save the map on this device.','bad');return}
  location.reload()};
let edResetArm=0;
$('#edReset').onclick=()=>{const b=$('#edReset');
  if(edResetArm&&performance.now()-edResetArm<2500){try{localStorage.removeItem('bhd_map')}catch(e){}location.reload();return}
  edResetArm=performance.now();b.textContent='Tap again';setTimeout(()=>{edResetArm=0;b.textContent='Start over'},2500)};

// ---------- each frame while the editor is open (main.js hands it the frame) ----------
const edLook=new THREE.Vector3();
function editorFrame(dt,now){
  // keys move the view
  const ek=(a,b)=>(keys[a]?1:0)-(keys[b]?1:0),kx=ek('KeyD','KeyA')+ek('ArrowRight','ArrowLeft'),kz=ek('KeyS','KeyW')+ek('ArrowDown','ArrowUp');
  if(kx||kz)edPan(-kx*dt*700,-kz*dt*700);
  ed.yaw+=ek('KeyQ','KeyE')*dt*1.6;ed.dist=clamp(ed.dist*Math.exp(ek('KeyF','KeyR')*dt*1.5),8,220);
  // the brush works while held; the ground catches up a few times a second, and fully when the stroke ends
  if(ed.stroke)edBrush(dt);
  if(ed.pend&&(ed.stroke||(ed.drag&&ed.drag.road))&&now-ed.refT>110){ed.refT=now;edRefresh(ed.pend,false);ed.pend=null}
  if(ed.sel&&ed.sel.m)edRingSel();
  // puddles and mud tiles keep up with the edits (painted Mud fills ruts, painting over them dries them)
  waterTick(dt);mudTick(dt);
  const fy=hAt(ed.x,ed.z);edLook.set(ed.x,fy,ed.z);
  camera.position.set(ed.x+Math.sin(ed.yaw)*Math.cos(ed.pitch)*ed.dist,fy+Math.sin(ed.pitch)*ed.dist,ed.z+Math.cos(ed.yaw)*Math.cos(ed.pitch)*ed.dist);
  camera.position.y=Math.max(camera.position.y,hAt(camera.position.x,camera.position.z)+2);camera.lookAt(edLook);
  sky.position.copy(camera.position);
  sun.position.set(ed.x,fy,ed.z).addScaledVector(SUN_DIR,25);sun.target.position.set(ed.x,fy,ed.z);
  timeU.value=now/1000;updateSound(dt);
  shadowProxyTick();lawnLod();tuftLod();renderer.render(scene,camera)}
