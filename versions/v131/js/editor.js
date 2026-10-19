// Corley's Island: the map editor (☰ menu, or G). Shape the ground (raise, lower, flatten, smooth), paint dirt or grass or a material
// from the library (concrete, steel, brick and more; materials.js), lay out and grade roads, and place, move, turn, resize, copy, query and remove trees and boulders; the machines can be
// moved and turned too. Edits are layers over the generated mesa (ED_H, ED_P, ED_M, ROADS and the asset list, terrain.js and
// scenery.js), saved on this device
// as you go; the map can be copied out as text and loaded back. While it is open the game stands still.
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.
const ed={tool:'raise',group:'shape',gtool:{shape:'raise',paint:'paint',things:'select',roads:'roads',inspect:'query'},size:15*FT,str:5,kind:'pine',mat:10,square:false,soft:false,keep:false,feather:0.5,x:0,z:10,yaw:0,pitch:0.95,dist:45,
  stroke:null,flatH:0,road:null,rpt:-1,drawing:false,roadSnap:null,bx:0,bz:0,hover:false,pend:null,refT:0,sel:[],drag:null,snap:null,changed:false,saveT:0,undo:[],redo:[],
  look:false,pane:'',drawer:true,boxMode:false,box:null,lp:null,fly:null,home:null,grp:false,listF:'all',open:{},statT:0,listT:0};
const ED_TOOLS={raise:'Raise',lower:'Lower',flatten:'Flatten',smooth:'Smooth',dirt:'Worked dirt',grass:'Grass',select:'Select',add:'Add',query:'Query',roads:'Roads',paint:'Paint'};
// the left bar's groups: their tools (picked in the bottom bar, or for Paint by the library's swatches), and whether the
// drawer beside the bar has a part for them (the material library, the things to add and the On the map list, the roads)
const ED_GROUPS={shape:{tools:['raise','lower','flatten','smooth']},paint:{tools:['paint','dirt','grass'],pane:1},things:{tools:['select','add'],pane:1},roads:{tools:['roads'],pane:1},inspect:{tools:['query']}};
const ED_KIND_CATS=['Trees and rocks','Buildings','Fencing','Site gear','Yard'];
// the editor's icons (24 px, drawn with lines), put in front of the words of every part with a data-ic
const ED_ICONS={done:'M15 5l-7 7 7 7',undo:'M9 14L4 9l5-5M4 9h10a6 6 0 010 12h-3',redo:'M15 14l5-5-5-5M20 9H10a6 6 0 000 12h3',
  look:'M12 3v18M3 12h18M9 6l3-3 3 3M9 18l3 3 3-3M6 9l-3 3 3 3M18 9l3 3-3 3',zin:'M10.5 4a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM15.5 15.5L21 21M7.5 10.5h6M10.5 7.5v6',
  zout:'M10.5 4a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM15.5 15.5L21 21M7.5 10.5h6',north:'M12 3l5 17-5-4-5 4z',home:'M3 11l9-8 9 8M5 9v11h5v-6h4v6h5V9',
  panel:'M3 4h18v16H3zM9 4v16',shape:'M2 20l7-12 4 6 3-4 6 10z',paint:'M18 3l3 3-8 8-3-3zM10 11c-3 0-5 2-5 4.5S4 19 2 19.5C5 22 11 21 12 17c.4-1.6-.4-3.4-2-6z',
  things:'M12 2l6 9h-3l4 6H5l4-6H6zM12 17v5',roads:'M8 3L4 21M16 3l4 18M12 4v3M12 10v3M12 16v3',inspect:'M10 3a7 7 0 100 14 7 7 0 000-14zM15 15l6 6',
  map:'M3 6h6l2 2h10v11H3z',box:'M4 4h3M10 4h4M17 4h3v3M20 10v4M20 17v3h-3M14 20h-4M7 20H4v-3M4 14v-4M4 7V4',
  copy:'M8 8h12v12H8zM4 16V4h12',trash:'M4 6h16M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7M14 10v7'};
function edIcons(root){root.querySelectorAll('[data-ic]').forEach(b=>{if(b.querySelector('svg'))return;
  b.insertAdjacentHTML('afterbegin',`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${ED_ICONS[b.dataset.ic]}"/></svg>`)})}
edIcons($('#editor'));
const ED_BRUSH=['raise','lower','flatten','smooth','dirt','grass','paint'];
const ED_KINDS={pine:'Pine tree',leafy:'Leafy tree',rock:'Boulder'};
// the machines and the walker can be picked and moved: their state, scene object and pick radius
const ED_MACH=[{name:'Excavator',o:()=>st,m:()=>machine,r:2.6},{name:'Dump truck',o:()=>tr,m:()=>truck,r:3.6},{name:'Mower',o:()=>mw,m:()=>mower,r:1.2},{name:'Skid steer',o:()=>sk,m:()=>skid,r:1.6},{name:'You, on foot',o:()=>wk,m:()=>walker,r:0.8}];
const edFt=m=>m/FT,edFmt=(m,d)=>(m/FT).toFixed(d===undefined?1:d);

// brush and selection rings drawn over the ground
function edRing(color){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(65*3),3));
  const l=new THREE.Line(g,new THREE.LineBasicMaterial({color,depthTest:false,transparent:true,opacity:0.95,fog:false,toneMapped:false}));l.renderOrder=20;l.frustumCulled=false;l.visible=false;scene.add(l);return l}
const edBrushRing=edRing(0xffd23f),edSoftRing=edRing(0xfff2b0);edSoftRing.material.opacity=0.6;
// the brush ring, and for soft-edged paint a second ring where the fade starts
function edBrushAt(x,z){const p=ed.tool==='paint',sq=ed.square&&p;edRingAt(edBrushRing,x,z,ed.size,sq);
  if(p&&ed.soft)edRingAt(edSoftRing,x,z,ed.size*(1-ed.feather),sq);else edSoftRing.visible=false}
function edRingAt(l,x,z,r,sq){const p=l.geometry.attributes.position.array;
  for(let i=0;i<=64;i++){const a=i/64*Math.PI*2,c=Math.cos(a),s=Math.sin(a),k=sq?1/Math.max(Math.abs(c),Math.abs(s)):1,px=x+c*r*k,pz=z+s*r*k;p[i*3]=px;p[i*3+1]=hAt(px,pz)+0.15;p[i*3+2]=pz}
  l.geometry.attributes.position.needsUpdate=true;l.visible=true}

// ---------- open and close ----------
function editorOpen(){if(edOn||bench.on)return;edOn=true;mapAssets=assets;
  document.body.classList.add('editing');$('#editor').hidden=false;showMenu(false);help.hidden=true;toggleMap(false);clearKeys();
  const fv=mode==='truck'?tr:mode==='mow'?mw:mode==='skid'?sk:mode==='walk'?wk:st;ed.x=fv.x;ed.z=fv.z;
  ed.yaw=Math.atan2(camera.position.x-fv.x,camera.position.z-fv.z);ed.dist=45;ed.pitch=0.95;
  ed.home={x:ed.x,z:ed.z,yaw:ed.yaw,dist:ed.dist,pitch:ed.pitch};ed.drawer=!edNarrow();ed.pane=ED_GROUPS[ed.group].pane?ed.group:'';
  edTool(ed.tool);edCard(null);edSelSet([]);toast('Map editor. The game is paused while you edit.','',2600)}
function editorClose(){if(!edOn)return;edStrokeEnd();edRoadFinish();edOn=false;document.body.classList.remove('editing');$('#editor').hidden=true;
  edBrushRing.visible=edSelRings.visible=edSoftRing.visible=false;ed.sel=[];ed.box=null;ed.lp=null;$('#edBox').hidden=true;ed.road=null;ed.rpt=-1;edRoadsDraw();clearKeys();firstCam=true;last=performance.now();
  if(ed.changed){edSave();mapReset();mapDirty=true;ed.changed=false}}
$('#edDone').onclick=editorClose;
$('#editBtn').onclick=editorOpen;

// ---------- tools: the left bar picks a group, the bottom bar its tool and options, the drawer its library or list ----------
const edNarrow=()=>innerWidth<900||innerHeight<500;
function edTool(t){if(t!=='roads'){edRoadFinish();ed.road=null;ed.rpt=-1}ed.tool=t;
  const g=Object.keys(ED_GROUPS).find(k=>ED_GROUPS[k].tools.includes(t));if(g){ed.group=g;ed.gtool[g]=t}
  $('#edOpts').hidden=false;edSubDraw();
  document.querySelectorAll('#edOpts [data-for]').forEach(el=>el.hidden=!el.dataset.for.split(' ').includes(t));
  $('#edSoftOpt').hidden=!(t==='paint'&&ed.soft);
  if(t!=='query')edCard(null);edBrushRing.visible=edSoftRing.visible=false;if(t==='roads')edRoadCard();edRoadsDraw();
  edMatMark();edKindMark();edPaneSync();edTipSet()}
// tapping the picked group again folds the drawer away (or the bottom bar's options, for a group without a drawer part)
function edGroup(g){const G=ED_GROUPS[g];
  if(g===ed.group&&ed.pane!=='map'){if(G.pane)ed.drawer=!ed.drawer;else{const o=$('#edOpts');o.hidden=!o.hidden}edPaneSync();return}
  ed.pane=G.pane?g:'';if(G.pane&&edNarrow())ed.drawer=true;edTool(ed.gtool[g])}
function edMapPane(){if(ed.pane==='map'&&ed.drawer)ed.pane=ED_GROUPS[ed.group].pane?ed.group:'';else{ed.pane='map';ed.drawer=true}edPaneSync()}
function edPaneSync(){const d=$('#edDrawer'),on=ed.drawer&&!!ed.pane;d.hidden=!on;
  d.querySelectorAll('.edsec').forEach(s=>s.hidden=s.dataset.g!==ed.pane);$('#edPanelBtn').setAttribute('aria-pressed',on);
  document.querySelectorAll('#edRail button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.g==='map'?on&&ed.pane==='map':b.dataset.g===ed.group));
  if(on&&ed.pane==='things')edListDraw();if(on&&ed.pane==='roads')edRoadList()}
// on a phone the drawer gets out of the way once something in it is picked
const edPicked=()=>{if(edNarrow()&&ed.drawer){ed.drawer=false;edPaneSync()}};
document.querySelectorAll('#edRail button').forEach(b=>b.onclick=()=>b.dataset.g==='map'?edMapPane():edGroup(b.dataset.g));
$('#edPanelBtn').onclick=()=>{if(!ed.pane){ed.pane='things';ed.drawer=true}else ed.drawer=!ed.drawer;edPaneSync()};
// the group's tools, as a row at the start of the bottom bar
function edSubDraw(){const ts=ED_GROUPS[ed.group].tools,box=$('#edSub');box.hidden=ed.group==='paint'||ts.length<2;if(box.hidden)return;
  box.innerHTML=ts.map(t=>`<button class="sm" data-t="${t}" aria-pressed="${t===ed.tool}">${ED_TOOLS[t]}</button>`).join('');
  box.querySelectorAll('button').forEach(b=>b.onclick=()=>edTool(b.dataset.t))}
// the things to add, by group: the trees and the boulder, then the catalogue (props.js)
const edKindName=t=>PROPS[t]?PROPS[t].n:ED_KINDS[t]||t;
{const all=[...Object.keys(ED_KINDS).map(k=>[k,0]),...Object.keys(PROPS).map(k=>[k,PROPS[k].cat||3])];
  $('#edKinds').innerHTML=ED_KIND_CATS.map((c,ci)=>`<h4>${c}</h4><div class="row">${all.filter(q=>q[1]===ci).map(q=>`<button class="sm" data-k="${q[0]}">${edKindName(q[0])}</button>`).join('')}</div>`).join('');
  document.querySelectorAll('#edKinds button').forEach(b=>b.onclick=()=>{ed.kind=b.dataset.k;edTool('add');edPicked()})}
function edKindMark(){document.querySelectorAll('#edKinds button').forEach(b=>b.setAttribute('aria-pressed',ed.tool==='add'&&b.dataset.k===ed.kind));$('#edKindV').textContent=edKindName(ed.kind)}
// the view: Look makes one finger move the view whatever the tool; closer, farther, north up and back to where the editor opened
$('#edLook').onclick=()=>{ed.look=!ed.look;$('#edLook').setAttribute('aria-pressed',ed.look)};
$('#edZoomIn').onclick=()=>{ed.dist=clamp(ed.dist/1.4,8,220);edStatus()};$('#edZoomOut').onclick=()=>{ed.dist=clamp(ed.dist*1.4,8,220);edStatus()};
$('#edNorth').onclick=()=>{ed.yaw=0};$('#edHome').onclick=()=>{if(ed.home){Object.assign(ed,ed.home);ed.fly=null}};
// the material library: every texture by kind, plus Natural ground, which clears a material, and Worked dirt and Grass,
// which pick the Dirt and Grass tools (they paint ED_P, not a material)
// (made again when the owner's own textures arrive or change, ownmat.js; theirs show their own thumbnail)
function edMatPanel(){const N=MAT_BUILT,esc=t=>t.replace(/[&<>"]/g,c=>'&#'+c.charCodeAt(0)+';'),
    sw=m=>{const d=MAT_LIST[m-1];return !m?'<i class="nat"></i>':d.own?`<i class="own" style="background-image:url(${d.th})"></i>`:`<i style="background-size:${N*100}% 100%;background-position:${(m-1)/(N-1)*100}% 0"></i>`};
  const btn=m=>typeof m==='string'?`<button class="edmat" data-m="${m}"><i class="${m}"></i><span>${ED_TOOLS[m]}</span></button>`:
    `<button class="edmat" data-m="${m}">${sw(m)}<span>${m?esc(MAT_LIST[m-1].n):'Natural ground'}</span></button>`;
  let h=`<h3>Material library <small>${MAT_LIST.filter(Boolean).length} textures</small></h3>`;
  MAT_CATS.forEach((c,ci)=>{const ms=ci?[]:[0,'dirt','grass'];MAT_LIST.forEach((d,i)=>{if(d.cat===ci)ms.push(i+1)});h+=`<h4>${c}</h4><div class="edmatgrid">${ms.map(btn).join('')}</div>`});
  const box=$('#edMats');box.innerHTML=h;
  box.querySelectorAll('.edmat').forEach(b=>b.onclick=()=>{const v=b.dataset.m;if(v==='dirt'||v==='grass')edTool(v);else{ed.mat=+v;edTool('paint')}edPicked()});edMatMark()}
function edMatMark(){document.querySelectorAll('#edMats .edmat').forEach(b=>{const v=b.dataset.m;b.setAttribute('aria-pressed',ed.tool==='paint'?+v===ed.mat&&v!=='dirt'&&v!=='grass':v===ed.tool)});edMatLabel()}
edMatPanel();
document.querySelectorAll('.edshape button').forEach(b=>b.onclick=()=>{ed.square=b.dataset.s==='sq';document.querySelectorAll('.edshape button').forEach(c=>c.setAttribute('aria-pressed',c===b))});
// Hard edge lays whole cells; Soft edge fades the material out to the natural ground over the outer part of the brush
document.querySelectorAll('.eddug button').forEach(b=>b.onclick=()=>{ed.keep=b.dataset.k==='keep';document.querySelectorAll('.eddug button').forEach(c=>c.setAttribute('aria-pressed',c===b))});
document.querySelectorAll('.ededge button').forEach(b=>b.onclick=()=>{ed.soft=b.dataset.e==='soft';$('#edSoftOpt').hidden=!ed.soft;document.querySelectorAll('.ededge button').forEach(c=>c.setAttribute('aria-pressed',c===b))});
function edMatLabel(){const d=matDef(ed.mat);$('#edMatV').textContent=ed.tool==='dirt'?'Worked dirt':ed.tool==='grass'?'Grass (over the dirt yards too)':d?`${d.n} (one tile is ${d.ft} ft)`:'Natural ground (clears materials)';
  if(typeof ownMatPicked==='function')ownMatPicked()}
edMatLabel();
const edSizeIn=$('#edSize'),edStrIn=$('#edStr'),edSoftIn=$('#edSoft');
function edSliders(){$('#edSizeV').textContent=`${Math.round(edFt(ed.size))} ft`;$('#edStrV').textContent=ed.str;$('#edSoftV').textContent=`${Math.round(ed.feather*100)}%`}
edSizeIn.oninput=()=>{ed.size=+edSizeIn.value*FT;edSliders();edStatus()};edStrIn.oninput=()=>{ed.str=+edStrIn.value;edSliders()};edSoftIn.oninput=()=>{ed.feather=+edSoftIn.value/100;edSliders()};
edSizeIn.value=Math.round(edFt(ed.size));edStrIn.value=ed.str;edSoftIn.value=Math.round(ed.feather*100);edSliders();

// ---------- picking the ground ----------
const edRay=new THREE.Raycaster(),edNdc=new THREE.Vector2();
// where a screen point meets the ground: march along the ray, then halve the step to the crossing
function edPick(cx,cy){const r=canvas.getBoundingClientRect();edNdc.set((cx-r.left)/r.width*2-1,-(cy-r.top)/r.height*2+1);
  edRay.setFromCamera(edNdc,camera);const o=edRay.ray.origin,d=edRay.ray.direction;let t0=0,t=0;
  for(let n=0;n<2000&&t<900;n++){const s=Math.max(0.3,t*0.01);t0=t;t+=s;if(o.y+d.y*t<hAt(o.x+d.x*t,o.z+d.z*t))break;if(n===1999||t>=900)return null}
  for(let n=0;n<12;n++){const m=(t0+t)/2;if(o.y+d.y*m<hAt(o.x+d.x*m,o.z+d.z*m))t=m;else t0=m}
  return {x:o.x+d.x*t,z:o.z+d.z*t}}
// the nearest tree, boulder, placed thing or machine to a ground point, if one is under it
function edHit(x,z){let best=null,bd=1;
  for(const a of assets){const d=PROPS[a.t]?propHit(a,x,z):Math.hypot(a.x-x,a.z-z)/((a.t==='rock'?1.0:1.6)*a.s);if(d<bd){bd=d;best={a}}}
  for(const m of ED_MACH){if(!m.m().visible)continue;const o=m.o(),d=Math.hypot(o.x-x,o.z-z)/m.r;if(d<bd){bd=d;best={m}}}
  return best}

// ---------- reshaping and painting ----------
const edGrow=(r,a,b,c,d)=>r?[Math.min(r[0],a),Math.max(r[1],b),Math.min(r[2],c),Math.max(r[3],d)]:[a,b,c,d];
function edStrokeStart(x,z){ed.stroke={h:ED_H.slice(),p:ED_P.slice(),m:ED_M.slice(),a:ED_A.slice(),ij:null};ed.bx=x;ed.bz=z;ed.flatH=baseHeight(x,z)}
// one frame of the brush: a soft round brush, strongest in the middle
function edBrush(dt){const R=ed.size,cx=ed.bx,cz=ed.bz,t=ed.tool,k=ed.str/10;
  const i0=Math.max(3,Math.floor((cx-R-ED_X0)/ED_C)),i1=Math.min(ED_NX-4,Math.ceil((cx+R-ED_X0)/ED_C)),j0=Math.max(3,Math.floor((cz-R-ED_Z0)/ED_C)),j1=Math.min(ED_NZ-4,Math.ceil((cz+R-ED_Z0)/ED_C));
  if(i0>i1||j0>j1)return;
  // painting turns ruts into what is painted, except Mud, and Dirt on ground that is already wet (mud.js); a material
  // stroke also takes dug and dumped ground back to grade, however deep, so the paint shows on it (the dig zone draws no paint on dug ground)
  if(t==='paint'&&ed.keep&&paintKeep(cx,cz,R,ed.square)){ed.pend=edGrow(ed.pend,cx-R-0.6,cx+R+0.6,cz-R-0.6,cz+R+0.6);ed.changed=true}
  if((t==='paint'&&ed.mat!==MUD_ID&&!ed.keep||t==='grass'||t==='dirt')&&rutErase(cx,cz,R,t==='paint'&&ed.square,t==='dirt'?(x,z)=>soakAt(x,z)>0.3:null,t==='paint')){
    ed.pend=edGrow(ed.pend,cx-R-0.6,cx+R+0.6,cz-R-0.6,cz+R+0.6);ed.changed=true}
  let hs=null,W=0;
  if(t==='smooth'||t==='flatten'){W=i1-i0+3;hs=new Float32Array(W*(j1-j0+3));
    for(let j=j0-1;j<=j1+1;j++)for(let i=i0-1;i<=i1+1;i++)hs[(j-j0+1)*W+i-i0+1]=baseHeight(ED_X0+i*ED_C,ED_Z0+j*ED_C)}
  // materials go down whole cells inside the ring (or the square, lined up north-south, for slabs and plates). Hard
  // edged, each cell is covered fully; soft edged, the cover fades to nothing over the outer part (the softness) of the
  // brush (topping out at 253, which tells the ground shader the edge is soft; hard square paint is 254, which it
  // draws as whole square cells, so corners stay sharp). A cell holds one material: a fade only takes over another
  // material where it covers more, and Natural ground fades the paint back out. The cell under the
  // middle always takes paint, so a 1 ft brush (smaller than a cell) still lays a line of cells
  if(t==='paint'){let n=0,ids=false;const R0=R*(1-ed.feather),mat=ed.mat,qc=Math.round((cz-ED_Z0)/ED_C)*ED_NX+Math.round((cx-ED_X0)/ED_C);
    for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){const q=j*ED_NX+i,dx=ED_X0+i*ED_C-cx,dz=ED_Z0+j*ED_C-cz,d=ed.square?Math.max(Math.abs(dx),Math.abs(dz)):Math.hypot(dx,dz);
      if(d>R&&q!==qc)continue;const w=ed.soft?Math.round(253*(1-ss(R0,R,d))):ed.square?254:255;if(w<=0)continue;
      const m0=ED_M[q],a0=ED_A[q];let m=m0,a=a0;
      if(!mat){if(m0){a=Math.min(a0,255-w);if(!a)m=0}}
      else if(m0===mat)a=Math.max(a0,w);
      else if(!m0||w>=a0){m=mat;a=w}
      if(m!==m0||a!==a0){ED_M[q]=m;ED_A[q]=a;n++;if(m!==m0)ids=true}}
    if(!n)return;if(ids)matU.tMatId.value.needsUpdate=true;matU.tMatCov.value.needsUpdate=true}
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
  const i0=Math.max(0,Math.floor(gI(x0))),i1=Math.min(N,Math.ceil(gI(x1))),j0=Math.max(0,Math.floor(gJ(z0))),j1=Math.min(N,Math.ceil(gJ(z1)));
  if(i0<=i1&&j0<=j1){for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){const k=j*V+i,b=baseHeight(gX(i),gZ(j));H[k]=H[k]===H0[k]?b:H[k]+b-H0[k];H0[k]=b;digBase(k)}
    touch(i0,i1,j0,j1);updateTufts(i0-1,i1+1,j0-1,j1+1);lawnTerrain();updateTerrain();winOn=false;blkTerrainMoved()}
  midUpdate(x0,x1,z0,z1);mudEdRefresh(x0,x1,z0,z1);rainEdRefresh(x0,x1,z0,z1);wallBuild(x0,x1,z0,z1);tuftsRefresh(x0,x1,z0,z1);
  if(assets.some(a=>a.x>x0-6&&a.x<x1+6&&a.z>z0-6&&a.z<z1+6)){assetsBuild();shpTreesRefresh()}
  if(full&&(x0<GX0+1||x1>GX1-1||z0<GZ0+1||z1>GZ1-1||x0<MID[0]+1||x1>MID[1]-1||z0<MID[2]+1||z1>MID[3]-1||x0<OUTER_MID[0]+1||x1>OUTER_MID[1]-1||z0<OUTER_MID[2]+1||z1>OUTER_MID[3]-1))buildSkirts()}
function edStrokeEnd(){const s=ed.stroke;if(!s)return;ed.stroke=null;edRefresh(ed.pend,true);ed.pend=null;
  if(!s.ij)return;const [i0,i1,j0,j1]=s.ij,w=i1-i0+1,h=new Float32Array(w*(j1-j0+1)),p=new Float32Array(h.length),m=new Uint8Array(h.length),c=new Uint8Array(h.length);
  for(let j=j0;j<=j1;j++){const a=j*ED_NX+i0,b=j*ED_NX+i1+1,o=(j-j0)*w;h.set(s.h.subarray(a,b),o);p.set(s.p.subarray(a,b),o);m.set(s.m.subarray(a,b),o);c.set(s.a.subarray(a,b),o)}
  edPush({g:[i0,i1,j0,j1],h,p,m,a:c});edQueueSave();matTexUpdate()}

// ---------- undo ----------
function edPush(u){ed.undo.push(u);if(ed.undo.length>30)ed.undo.shift();ed.redo.length=0;edUndoBtns()}
function edUndoBtns(){$('#edUndo').disabled=!ed.undo.length;$('#edRedo').disabled=!ed.redo.length}
// swaps the saved state with the current one, so the same entry undoes and redoes
function edSwap(u){
  if(u.g){const [i0,i1,j0,j1]=u.g,w=i1-i0+1;
    for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){const q=j*ED_NX+i,o=(j-j0)*w+i-i0,a=ED_H[q],b=ED_P[q],c=ED_M[q],d=ED_A[q];ED_H[q]=u.h[o];ED_P[q]=u.p[o];ED_M[q]=u.m[o];ED_A[q]=u.a[o];u.h[o]=a;u.p[o]=b;u.m[o]=c;u.a[o]=d}
    matU.tMatId.value.needsUpdate=true;matU.tMatCov.value.needsUpdate=true;matTexUpdate();
    edRefresh([ED_X0+i0*ED_C-0.6,ED_X0+i1*ED_C+0.6,ED_Z0+j0*ED_C-0.6,ED_Z0+j1*ED_C+0.6],true)}
  else if(u.roads){const now=edRoadsSnap();edRoadsSet(u.roads);u.roads=now;ed.road=null;ed.rpt=-1;edRoadCard();edRoadsDraw();edRefresh(u.rect,true)}
  else{const now=JSON.stringify(assets);assets.length=0;assets.push(...JSON.parse(u.a));u.a=now;assetsBuild();shpTreesRefresh();edSelSet([])}
  ed.changed=true;edQueueSave()}
function edUndo(){const u=ed.undo.pop();if(!u)return;edStrokeEnd();edSwap(u);ed.redo.push(u);edUndoBtns()}
function edRedo(){const u=ed.redo.pop();if(!u)return;edSwap(u);ed.undo.push(u);edUndoBtns()}
$('#edUndo').onclick=edUndo;$('#edRedo').onclick=edRedo;
const edAssetsSnap=()=>JSON.stringify(assets);
function edAssetsChanged(before){edPush({a:before});assetsBuild();shpTreesRefresh();ed.changed=true;edQueueSave();edListDraw()}

// ---------- the info card: what is at a spot, or the selected tree, boulder or machine ----------
function edWhere(x,z){const e=x,s=z-(TRENCH_Z0+TRENCH_Z1)/2;
  return `${edFmt(Math.abs(e),0)} ft ${e<0?'west':'east'}, ${edFmt(Math.abs(s),0)} ft ${s<0?'north':'south'} of the trench`}
function edQuery(x,z){const g=baseHeight(x,z),h=hAt(x,z),r=mesaR(x,z);
  const sx=(baseHeight(x+0.5,z)-baseHeight(x-0.5,z)),sz=(baseHeight(x,z+0.5)-baseHeight(x,z-0.5)),sl=Math.hypot(sx,sz);
  const top=r<EDGE||famR(x,z)<FAM_R||jesR(x,z)<JES_R||dexR(x,z)<DEX_R,deck=deckAt(x,z)>g;
  const surf=deck?'Bridge deck':paintAt(x,z)?matDef(paintAt(x,z)).n:g<WATER?'Lake':roadAmt(x,z)>0.5?'Road':sl>0.9?'Rock face':yardAt(x,z)>0.5?'Dirt yard':top?'Grass':g<WATER+2?'Beach':'Bank';
  const drive=!landIn(x,z,1,0)?'No, off the island':wallAt(x,z)?'No, too steep':'Yes';
  const dh=edSample(ED_H,x,z),dp=edSample(ED_P,x,z),mine=[];
  if(Math.abs(dh)>0.02)mine.push(`${dh>0?'raised':'lowered'} ${edFmt(Math.abs(dh))} ft`);if(dp>0.05)mine.push('painted dirt');if(dp<-0.05)mine.push('painted grass');
  const mt=paintAt(x,z);if(mt)mine.push(matDef(mt).n.toLowerCase());
  const rows=[['Spot',edWhere(x,z)],['Ground',`${g>=0?'+':'−'}${edFmt(Math.abs(g))} ft (mesa top is 0)`],['Slope',`${Math.round(sl*100)}% · ${Math.round(Math.atan(sl)*57.3)}°`],
    ['Surface',surf],['Driveable',drive]];
  // how wet the soil is (rain.js); painted Mud names its look as it dries
  {const k=rwIdx(x,z);if(k>=0&&rainK[k]>0){const w=rainW[k],m=mt===MUD_ID;
    rows.push(['Soil',w>0.9?'Soaked':w>0.55?'Wet':w>0.3?(m?'Drying, still soft':'Damp'):w>0.12?(m?'Dry, starting to crack':'Dry'):(m?'Dry and cracked':'Dry')])}}
  if(h<g-0.04)rows.push(['Dug',`${edFmt(g-h)} ft below the ground`]);else if(h>g+0.04)rows.push(['Dumped',`${edFmt(h-g)} ft of dirt`]);
  if(mine.length)rows.push(['Your edits',mine.join(', ')]);
  const hit=edHit(x,z);if(hit)rows.push(['Here',hit.a?edAssetName(hit.a):hit.m.name]);
  edCard(`<h3>Ground here</h3><dl>${rows.map(([a,b])=>`<dt>${a}</dt><dd>${b}</dd>`).join('')}</dl>`)}
// the bottom bar: a card for the spot queried or the road picked, and the selection's settings when there is no card
function edCard(html){const el=$('#edCard');el.hidden=!html;if(html)el.innerHTML=html;edBottomSync()}
function edBottomSync(){$('#edInfo').hidden=!ed.sel.length||!$('#edCard').hidden}

// ---------- the selection: any number of trees, boulders, placed things and machines ({a} or {m}) ----------
const edKey=h=>h.a||h.m,edIn=h=>ed.sel.some(s=>edKey(s)===edKey(h)),edSelA=()=>ed.sel.filter(s=>s.a).map(s=>s.a);
const edRad=a=>PROPS[a.t]?propR(a):(a.t==='rock'?1.0:1.6)*a.s;
// a ring round each picked one, all in one line set
const edSelRings=(function(){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(1200*48*3),3));g.setDrawRange(0,0);
  const l=new THREE.LineSegments(g,new THREE.LineBasicMaterial({color:0xf07a22,depthTest:false,transparent:true,opacity:0.95,fog:false,toneMapped:false}));l.renderOrder=20;l.frustumCulled=false;l.visible=false;scene.add(l);return l})();
function edRingSel(){const at=edSelRings.geometry.attributes.position,P=at.array,k=ed.sel.length>60?12:24;let n=0;
  for(const s of ed.sel){if(n+2*k>at.count)break;const o=s.a||s.m.o(),r=s.a?edRad(s.a):s.m.r;
    for(let i=0;i<k;i++)for(const e of [i,i+1]){const t=e/k*Math.PI*2,x=o.x+Math.cos(t)*r,z=o.z+Math.sin(t)*r;P[n*3]=x;P[n*3+1]=hAt(x,z)+0.15;P[n*3+2]=z;n++}}
  at.needsUpdate=true;edSelRings.geometry.setDrawRange(0,n);edSelRings.visible=n>0}
function edSelSet(list){ed.sel=list;edRingSel();edInspector();edListDraw();edStatus()}
// the things and machines whose middles are inside a rectangle of the screen
function edInRect(x0,y0,x1,y1,things){const rc=canvas.getBoundingClientRect(),out=[];
  const inR=(x,z)=>{edV.set(x,hAt(x,z)+0.5,z).project(camera);if(Math.abs(edV.z)>1)return false;const sx=(edV.x+1)/2*rc.width+rc.left,sy=(1-edV.y)/2*rc.height+rc.top;return sx>=x0&&sx<=x1&&sy>=y0&&sy<=y1};
  for(const a of assets)if(inR(a.x,a.z))out.push({a});
  if(!things)for(const m of ED_MACH){if(!m.m().visible)continue;const o=m.o();if(inR(o.x,o.z))out.push({m})}return out}
function edSelectView(){const r=canvas.getBoundingClientRect();if(ed.tool!=='select'&&ed.tool!=='add')edTool('select');edSelSet(edInRect(r.left,r.top,r.right,r.bottom,true))}
$('#edAllBtn').onclick=edSelectView;
$('#edBoxBtn').onclick=()=>{ed.boxMode=!ed.boxMode;$('#edBoxBtn').setAttribute('aria-pressed',ed.boxMode)};
function edBoxDraw(){const b=ed.box,el=$('#edBox');el.hidden=false;
  Object.assign(el.style,{left:Math.min(b.x0,b.x1)+'px',top:Math.min(b.y0,b.y1)+'px',width:Math.abs(b.x1-b.x0)+'px',height:Math.abs(b.y1-b.y0)+'px'})}
function edBoxEnd(){const b=ed.box;ed.box=null;$('#edBox').hidden=true;const x0=Math.min(b.x0,b.x1),x1=Math.max(b.x0,b.x1),y0=Math.min(b.y0,b.y1),y1=Math.max(b.y0,b.y1);
  if(x1-x0<6&&y1-y0<6){if(!b.add)edSelSet([]);return}
  const got=edInRect(x0,y0,x1,y1);edSelSet(b.add?[...ed.sel,...got.filter(h=>!edIn(h))]:got)}

// ---------- the selection's settings in the bottom bar ----------
function edAssetName(a){return PROPS[a.t]?propName(a):a.t==='rock'?`Boulder, ${edFmt(1.6*a.s,0)} ft across`:`${ED_KINDS[a.t]||a.t}, ${edFmt((a.t==='pine'?5.9:4.7)*a.s,0)} ft tall`}
const edSlider=(id,lab,min,max,step,val,unit)=>`<span class="edopt"><label for="${id}">${lab}</label><input id="${id}" type="range" min="${min}" max="${max}" step="${step}" value="${val}"><output id="${id}V">${val}${unit}</output></span>`;
// the colours a kind can take (scenery.js tints the trees, props.js the buildings' walls), as swatches
const edFam=t=>t==='pine'||t==='leafy'?t:PROPS[t]&&PROPS[t].tint?'house':null;
function edFams(){return {pine:{n:'Needles',c:ASSET_PT.map(t=>[0.3*t[0],0.46*t[1],0.26*t[2]])},leafy:{n:'Leaves',c:ASSET_LT},house:{n:'Walls',c:PROP_TINT.map(t=>[0.9*t[0],0.88*t[1],0.84*t[2]])}}}
function edInspector(){const S=ed.sel,el=$('#edInfo');edBottomSync();if(!S.length){el.innerHTML='';return}
  const as=edSelA(),one=S.length===1?S[0]:null,deg=y=>Math.round(((y*57.3)%360+360)%360);let h;
  if(one){const o=one.a||one.m.o(),g=baseHeight(o.x,o.z);
    h=`<div class="edihead"><h3>${one.a?edAssetName(one.a):one.m.name}</h3><small>${edWhere(o.x,o.z)} · ground ${g>=0?'+':'−'}${edFmt(Math.abs(g))} ft</small></div>`+
      edSlider('edSelTurn','Turn',0,359,1,deg(one.a?one.a.yaw:o.yaw||0),'°')+(one.a?edSlider('edSelSize','Size',30,300,5,Math.round(one.a.s*100),'%'):'')}
  else{const c={};for(const s of S){const n=s.a?edKindName(s.a.t):'Machine';c[n]=(c[n]||0)+1}
    h=`<div class="edihead"><h3>${S.length} selected</h3><small>${Object.entries(c).map(([n,k])=>`${n} ×${k}`).join(', ')}</small></div>`+
      (as.length?edSlider('edSelTurn','Turn',-180,180,5,0,'°')+edSlider('edSelSize','Size',30,300,5,100,'%')+`<button id="edSelGrp" class="sm" aria-pressed="${ed.grp}">As a group</button>`:'')}
  const F=edFams(),fams={};for(const a of as){const f=edFam(a.t);if(f)(fams[f]=fams[f]||[]).push(a)}
  for(const f in fams){const T=F[f],cs=new Set(fams[f].map(a=>a.c%T.c.length));
    h+=`<span class="edopt"><label>${T.n}</label><span class="edsw">${T.c.map((q,i)=>`<button class="edswb" data-f="${f}" data-c="${i}" aria-pressed="${cs.size===1&&cs.has(i)}" aria-label="${T.n} colour ${i+1}" style="background:rgb(${q.map(v=>Math.round(Math.min(1,v)*255)).join(',')})"></button>`).join('')}</span></span>`}
  h+=`<span class="row">${as.length?'<button id="edSelCopy" class="sm edico" data-ic="copy">Copy</button><button id="edSelDel" class="sm danger edico" data-ic="trash">Delete</button>':'<span class="hint">Drag it to move it.</span>'}<button id="edSelX" class="sm">Clear</button></span>`;
  el.innerHTML=h;edIcons(el);
  // turning and sizing start from where each one was when the slider was taken hold of; several turn and size each about
  // its own middle, or as a group about the middle of them all
  const tv=$('#edSelTurn'),sv=$('#edSelSize');let base=null;
  const begin=()=>{if(base)return;base={snap:edAssetsSnap(),q:as.map(a=>({a,x:a.x,z:a.z,yaw:a.yaw,s:a.s})),cx:0,cz:0};
    for(const q of base.q){base.cx+=q.x/base.q.length;base.cz+=q.z/base.q.length}};
  const put=(q,ox,oz)=>{q.a.x=clamp(base.cx+ox,-118,118);q.a.z=clamp(base.cz+oz,-118,118)};
  const commit=()=>{if(!base)return;edAssetsChanged(base.snap);base=null;edInspector()};
  if(tv)tv.oninput=()=>{$('#edSelTurnV').textContent=tv.value+'°';
    if(!as.length){const o=one.m.o(),y=+tv.value/57.3;o.yaw=y;if(o===wk)wk.view=y;one.m.m().rotation.y=y;return}
    begin();const d=+tv.value/57.3-(one?base.q[0].yaw:0),c=Math.cos(d),n=Math.sin(d);
    for(const q of base.q){q.a.yaw=q.yaw+d;if(!one&&ed.grp){const ox=q.x-base.cx,oz=q.z-base.cz;put(q,ox*c+oz*n,-ox*n+oz*c)}}
    assetsBuild();shpTreesRefresh();edRingSel()};
  if(tv)tv.onchange=commit;
  if(sv){sv.oninput=()=>{$('#edSelSizeV').textContent=sv.value+'%';begin();const f=+sv.value/100/(one?base.q[0].s:1);
      for(const q of base.q){q.a.s=clamp(q.s*f,0.3,3);if(!one&&ed.grp)put(q,(q.x-base.cx)*f,(q.z-base.cz)*f)}
      assetsBuild();shpTreesRefresh();edRingSel()};
    sv.onchange=commit}
  const gb=$('#edSelGrp');if(gb)gb.onclick=()=>{ed.grp=!ed.grp;edInspector()};
  el.querySelectorAll('.edswb').forEach(b=>b.onclick=()=>{const snap=edAssetsSnap();for(const a of fams[b.dataset.f])a.c=+b.dataset.c;edAssetsChanged(snap);edInspector()});
  const cb=$('#edSelCopy');if(cb){cb.onclick=edCopy;$('#edSelDel').onclick=edDelete}
  $('#edSelX').onclick=()=>edSelSet([])}
// a copy of one thing goes alongside it, along its width, so fence sections line up; a copy of several goes beside them
// all, to the right as seen from the camera
function edCopy(){const as=edSelA();if(!as.length)return;const b=edAssetsSnap();let out;
  if(as.length===1){const a0=as[0],P=PROPS[a0.t],w=P?(P.w+(P.d>0.5?0.6:0))*a0.s:0;
    out=[Object.assign({},a0,P?{x:a0.x+Math.cos(a0.yaw)*w,z:a0.z-Math.sin(a0.yaw)*w}:{x:a0.x+2.5*a0.s,z:a0.z+1.5*a0.s})]}
  else{const rx=Math.cos(ed.yaw),rz=-Math.sin(ed.yaw);let p0=1e9,p1=-1e9;for(const a of as){const p=a.x*rx+a.z*rz,r=edRad(a);p0=Math.min(p0,p-r);p1=Math.max(p1,p+r)}
    const w=p1-p0+1;out=as.map(a=>Object.assign({},a,{x:clamp(a.x+rx*w,-118,118),z:clamp(a.z+rz*w,-118,118)}))}
  assets.push(...out);edAssetsChanged(b);edSelSet(out.map(a=>({a})))}
function edDelete(){const as=edSelA();if(!as.length)return;const b=edAssetsSnap(),gone=new Set(as),keep=assets.filter(a=>!gone.has(a));
  assets.length=0;assets.push(...keep);edAssetsChanged(b);edSelSet(ed.sel.filter(s=>!s.a))}
// moves a machine (or the walker) to a spot on the mesa and sets it down on the ground there
function edPlaceMachine(m,x,z){const o=m.o();[x,z]=landClamp(x,z,4,2);
  o.x=x;o.z=z;if(o===tr)tr.v=0;const y=surfAt(x,z);o.y=y;m.m().position.set(x,y,z)}

// ---------- On the map: every thing and machine by kind, in the Things drawer ----------
const edShortSpot=(x,z)=>{const s=z-(TRENCH_Z0+TRENCH_Z1)/2;return `${edFmt(Math.abs(x),0)} ft ${x<0?'W':'E'}, ${edFmt(Math.abs(s),0)} ft ${s<0?'N':'S'}`};
const edFlyTo=(x,z)=>{ed.fly={x,z}};
// a row's key: a + its index in the asset list, or m + its index in ED_MACH
const edRowHit=k=>k[0]==='a'?(assets[+k.slice(1)]?{a:assets[+k.slice(1)]}:null):{m:ED_MACH[+k.slice(1)]};
function edListDraw(){const el=$('#edList');if($('#edDrawer').hidden||ed.pane!=='things')return;
  const f=ed.listF,by={},near=(x,z)=>Math.hypot(x-ed.x,z-ed.z)<ed.dist*0.9;assets.forEach((a,i)=>{(by[a.t]=by[a.t]||[]).push({h:{a},k:'a'+i,label:edAssetName(a),x:a.x,z:a.z})});
  const groups=[...new Set(['pine','leafy','rock',...Object.keys(PROPS),...Object.keys(by)])].filter(t=>by[t]).map(t=>['a:'+t,edKindName(t),by[t],t]);
  groups.push(['m','Machines',ED_MACH.map((m,i)=>({m,i})).filter(q=>q.m.m().visible).map(q=>{const o=q.m.o();return {h:{m:q.m},k:'m'+q.i,label:q.m.name,x:o.x,z:o.z}})]);
  let h='';
  for(const [id,name,items,t] of groups){const shown=items.filter(q=>f==='all'||f==='near'&&near(q.x,q.z)||f==='sel'&&edIn(q.h));if(!shown.length)continue;
    shown.sort((p,q)=>edIn(q.h)-edIn(p.h)); // the picked ones first
    const nSel=items.filter(q=>edIn(q.h)).length,open=!!ed.open[id];
    h+=`<div class="edlg"><button class="edlgo" data-g="${id}" aria-expanded="${open}"><i>${open?'▾':'▸'}</i>${name} <small>${shown.length}${f==='all'?'':' of '+items.length}</small></button><button class="sm edlgs" data-g="${id}" aria-pressed="${nSel===items.length}">${nSel?nSel+' picked':'Select all'}</button></div>`;
    if(!open)continue;
    h+='<div class="edlrows">'+shown.slice(0,200).map(q=>`<div class="edlr"><button class="edlck" data-k="${q.k}" aria-pressed="${edIn(q.h)}" aria-label="Add to the selection"></button><button class="edlrn" data-k="${q.k}"><span>${q.label}</span><small>${edShortSpot(q.x,q.z)}</small></button></div>`).join('')+
      (shown.length>200?`<p class="hint">and ${shown.length-200} more: pick Near the view to see the ones close by</p>`:'')+'</div>';
    if(t)h+=`<div class="row edlact"><button class="sm danger" data-del="${t}">Delete every ${name.toLowerCase()}</button>${ED_KINDS[t]?`<button class="sm" data-def="${t}">Put back the first ones</button>`:''}</div>`}
  el.innerHTML=h||'<p class="hint">Nothing to show.</p>';$('#edListN').textContent=`${assets.length} things`;
  el._g=groups}
document.querySelectorAll('.edfilter button').forEach(b=>b.onclick=()=>{ed.listF=b.dataset.f;document.querySelectorAll('.edfilter button').forEach(c=>c.setAttribute('aria-pressed',c===b));edListDraw()});
$('#edList').onclick=e=>{const b=e.target.closest('button');if(!b)return;const el=$('#edList'),grp=id=>(el._g.find(g=>g[0]===id)||[])[2]||[];
  if(b.classList.contains('edlgo')){ed.open[b.dataset.g]=!ed.open[b.dataset.g];edListDraw();return}
  if(ed.tool!=='select')edTool('select');
  // Select all picks the whole kind (or lets go of it, if it is all picked already)
  if(b.classList.contains('edlgs')){const hs=grp(b.dataset.g).map(q=>q.h),all=hs.every(edIn),keys=new Set(hs.map(edKey));
    edSelSet(all?ed.sel.filter(s=>!keys.has(edKey(s))):[...ed.sel,...hs.filter(h=>!edIn(h))]);return}
  if(b.dataset.del){const t=b.dataset.del,snap=edAssetsSnap(),keep=assets.filter(a=>a.t!==t);assets.length=0;assets.push(...keep);edAssetsChanged(snap);edSelSet(ed.sel.filter(s=>!s.a||s.a.t!==t));return}
  if(b.dataset.def){const t=b.dataset.def,snap=edAssetsSnap(),keep=assets.filter(a=>a.t!==t);assets.length=0;assets.push(...keep,...defaultAssets().filter(a=>a.t===t));edAssetsChanged(snap);edSelSet([]);return}
  const h=b.dataset.k&&edRowHit(b.dataset.k);if(!h)return;
  if(b.classList.contains('edlck')){edSelSet(edIn(h)?ed.sel.filter(s=>edKey(s)!==edKey(h)):[...ed.sel,h]);return}
  const o=h.a||h.m.o();edSelSet([h]);edFlyTo(o.x,o.z);edPicked()};
// the roads, in the Roads drawer: tap one to pick it and go to it
function edRoadList(){const el=$('#edRoadList');$('#edRoadN').textContent=ROADS.length?`${ROADS.length}`:'';if($('#edDrawer').hidden||ed.pane!=='roads')return;
  el.innerHTML=ROADS.map((r,i)=>{let L=0;for(let k=0;k<r.pts.length-1;k++)L+=Math.hypot(r.pts[k+1][0]-r.pts[k][0],r.pts[k+1][1]-r.pts[k][1]);
    return `<div class="edlr"><button class="edlrn" data-r="${i}" aria-pressed="${r===ed.road}"><span>${edGraded(r)?'Graded road':r.mid?'Road':'Track'} ${i+1}</span><small>${Math.round(edFt(r.w))} ft wide · ${edFmt(L,0)} ft long · ${r.pts.length} points</small></button></div>`}).join('')||'<p class="hint">No roads yet. New road, in the bottom bar, lays one.</p>';
  el.querySelectorAll('[data-r]').forEach(b=>b.onclick=()=>{const r=ROADS[+b.dataset.r];if(!r)return;if(ed.tool!=='roads')edTool('roads');ed.road=r;ed.rpt=-1;
    const q=r.pts[Math.floor(r.pts.length/2)];if(q)edFlyTo(q[0],q[1]);edRoadCard();edRoadsDraw();edPicked()})}

// ---------- the status line under the bottom bar: the spot under the pointer, the brush and the view, and a tip ----------
function edStatus(p){if(p){const g=baseHeight(p.x,p.z),sl=Math.hypot(baseHeight(p.x+0.5,p.z)-baseHeight(p.x-0.5,p.z),baseHeight(p.x,p.z+0.5)-baseHeight(p.x,p.z-0.5));
    $('#edStatPos').textContent=`${edShortSpot(p.x,p.z)} · ground ${g>=0?'+':'−'}${edFmt(Math.abs(g))} ft · slope ${Math.round(sl*100)}%`}
  const b=[];if(ED_BRUSH.includes(ed.tool))b.push(`brush ${Math.round(edFt(ed.size))} ft`);b.push(`view from ${Math.round(edFt(ed.dist))} ft`,`${assets.length} things`);
  if(ed.sel.length)b.push(`${ed.sel.length} selected`);$('#edStatInfo').textContent=b.join(' · ')}
function edTipSet(){$('#edTip').textContent=say('edTip_'+ed.tool);edStatus()}

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
  edRoadList();if(ed.tool!=='roads')return;const r=ed.road;if(!r){edCard(null);return}
  let L=0,steep=0;for(let i=0;i<r.pts.length-1;i++){const a=r.pts[i],b=r.pts[i+1],l=Math.hypot(b[0]-a[0],b[1]-a[1]);L+=l;if(a.length>2&&b.length>2&&l>0.1)steep=Math.max(steep,Math.abs(b[2]-a[2])/l)}
  const g=edGraded(r),q=ed.rpt>=0?r.pts[ed.rpt]:null;
  edCard(`<h3>${ed.drawing?'New road':g?'Graded road (cut and filled to each point\u2019s height)':r.mid?'Road (follows the ground)':'Track (follows the ground)'}</h3><dl><dt>Length</dt><dd id="edRdLen">${edFmt(L,0)} ft · ${r.pts.length} points</dd>${g?`<dt>Steepest</dt><dd>${Math.round(steep*100)}%</dd>`:''}</dl>
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
function edPan(dx,dy){ed.fly=null;const s=ed.dist*0.0019*(720/Math.max(320,innerHeight)),c=Math.cos(ed.yaw),n=Math.sin(ed.yaw);
  ed.x=clamp(ed.x+(-c*dx-n*dy)*s,-120,120);ed.z=clamp(ed.z+(n*dx-c*dy)*s,-120,350)}
function edDown(x,y,e){const p=edPick(x,y),t=ed.tool,mod=e&&(e.shiftKey||e.ctrlKey||e.metaKey),touch=e&&e.pointerType!=='mouse';
  if(ed.look||!p){edMouse={pan:true,x,y};return}
  if(ED_BRUSH.includes(t)){edStrokeStart(p.x,p.z);edBrushAt(p.x,p.z);return}
  if(t==='roads'){edRoadDown(p,x,y);return}
  if(t==='query'){edQuery(p.x,p.z);edRingAt(edBrushRing,p.x,p.z,0.5);ed.drag={query:true};return}
  // things from the catalogue come in at full size, their front to the camera
  if(t==='add'){const b=edAssetsSnap(),pr=PROPS[ed.kind],a=pr?{t:ed.kind,x:p.x,z:p.z,yaw:Math.round(ed.yaw/(Math.PI/12))*Math.PI/12,s:1,c:pr.tint?Math.floor(Math.random()*PROP_TINT.length):0}:
      {t:ed.kind,x:p.x,z:p.z,yaw:Math.random()*6.28,s:ed.kind==='rock'?0.7+Math.random()*0.6:0.85+Math.random()*0.4,c:Math.floor(Math.random()*6)};
    assets.push(a);assetsBuild();shpTreesRefresh();ed.drag={items:[{a,dx:0,dz:0}],snap:b,added:true};edSelSet([{a}]);ed.changed=true;return}
  // Select: a tap picks one; Shift (or Ctrl) and a tap, or a long press, adds it or takes it away; a drag on empty ground
  // draws a box round several (with a mouse, or with Box select on); dragging a picked one moves them all
  if(t==='select'){const hit=edHit(p.x,p.z);
    if(!hit){if(!touch||ed.boxMode){ed.box={x0:x,y0:y,x1:x,y1:y,add:mod};edBoxDraw()}else{edSelSet([]);edMouse={pan:true,x,y}}return}
    if(mod){edSelSet(edIn(hit)?ed.sel.filter(s=>edKey(s)!==edKey(hit)):[...ed.sel,hit]);return}
    const prev=ed.sel,was=edIn(hit);if(!was)edSelSet([hit]);if(touch)ed.lp={t:performance.now(),x,y,prev,hit,was};
    ed.drag={items:ed.sel.map(s=>{const o=s.a||s.m.o();return {a:s.a,m:s.m,dx:o.x-p.x,dz:o.z-p.z}}),snap:ed.sel.some(s=>s.a)?edAssetsSnap():null,moved:false}}}
function edMove(x,y){
  if(edMouse){if(edMouse.pan)edPan(x-edMouse.x,y-edMouse.y);else{ed.yaw-=(x-edMouse.x)*0.006;ed.pitch=clamp(ed.pitch+(y-edMouse.y)*0.005,0.25,1.45)}edMouse.x=x;edMouse.y=y;return}
  if(ed.lp&&Math.hypot(x-ed.lp.x,y-ed.lp.y)>8)ed.lp=null;
  if(ed.box){ed.box.x1=x;ed.box.y1=y;edBoxDraw();return}
  const p=edPick(x,y);if(!p)return;
  const now=performance.now();if(now-ed.statT>80){ed.statT=now;edStatus(p)}
  if(ed.stroke){ed.bx=p.x;ed.bz=p.z;edBrushAt(p.x,p.z);return}
  const d=ed.drag;
  if(d&&d.query){edQuery(p.x,p.z);edRingAt(edBrushRing,p.x,p.z,0.5);return}
  if(d&&d.road){edRoadDrag(d,p);return}
  if(d&&d.items){let any=false;for(const q of d.items){if(q.a){q.a.x=clamp(p.x+q.dx,-118,118);q.a.z=clamp(p.z+q.dz,-118,118);any=true}else edPlaceMachine(q.m,p.x+q.dx,p.z+q.dz)}
    d.moved=true;if(any){assetsBuild();shpTreesRefresh()}edRingSel();return}
  if(ED_BRUSH.includes(ed.tool)){edBrushAt(p.x,p.z)}}
function edUp(){edMouse=null;ed.lp=null;edStrokeEnd();if(ed.box){edBoxEnd();return}const d=ed.drag;ed.drag=null;
  if(d&&d.road){edRoadUp(d);return}
  if(d&&d.items&&(d.moved||d.added)){if(d.snap){edPush({a:d.snap});ed.changed=true;edQueueSave()}edInspector();edListDraw()}}
function edGestStart(){const [a,b]=[...edPtrs.values()];
  edGest={d:Math.hypot(a.x-b.x,a.y-b.y)||1,ang:Math.atan2(b.y-a.y,b.x-a.x),mx:(a.x+b.x)/2,my:(a.y+b.y)/2,dist:ed.dist,yaw:ed.yaw}}
canvas.addEventListener('pointerdown',e=>{if(!edOn)return;canvas.setPointerCapture(e.pointerId);edPtrs.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(edPtrs.size===2){edUp();edGestStart();return}if(edPtrs.size>2)return;
  if(e.pointerType==='mouse'&&e.button===2){edMouse={pan:false,x:e.clientX,y:e.clientY};return}
  if(e.pointerType==='mouse'&&e.button===1){edMouse={pan:true,x:e.clientX,y:e.clientY};return}
  edDown(e.clientX,e.clientY,e)});
canvas.addEventListener('pointermove',e=>{if(!edOn)return;const p=edPtrs.get(e.pointerId);
  if(p){p.x=e.clientX;p.y=e.clientY}
  if(edGest&&edPtrs.size===2){const [a,b]=[...edPtrs.values()],d=Math.hypot(a.x-b.x,a.y-b.y)||1,ang=Math.atan2(b.y-a.y,b.x-a.x),mx=(a.x+b.x)/2,my=(a.y+b.y)/2;
    ed.dist=clamp(edGest.dist*edGest.d/d,8,220);ed.yaw=edGest.yaw+(ang-edGest.ang);edPan(mx-edGest.mx,my-edGest.my);edGest.mx=mx;edGest.my=my;return}
  if(p||e.pointerType==='mouse')edMove(e.clientX,e.clientY)});
const edEnd=e=>{if(!edOn)return;if(!edPtrs.delete(e.pointerId))return;if(edGest){if(edPtrs.size<2)edGest=null;return}edUp()};
canvas.addEventListener('pointerup',edEnd);canvas.addEventListener('pointercancel',edEnd);
canvas.addEventListener('pointerleave',e=>{if(edOn&&e.pointerType==='mouse'&&!edPtrs.size)edBrushRing.visible=edSoftRing.visible=false});
canvas.addEventListener('contextmenu',e=>{if(edOn)e.preventDefault()});
canvas.addEventListener('wheel',e=>{if(!edOn)return;e.preventDefault();ed.dist=clamp(ed.dist*Math.exp(e.deltaY*0.0012),8,220)},{passive:false});

// ---------- keys (fixed, not in the Keys panel): G opens and closes unless a game action has G; WASD or arrows pan, Q E turn, R F zoom,
// 1 to 5 the groups and 6 the Map drawer, Delete removes, Esc lets go of the selection, Ctrl+Z undo, Ctrl+A picks everything in view, Ctrl+D copies ----------
addEventListener('keydown',e=>{const tg=e.target&&e.target.tagName;if(tg==='TEXTAREA'||tg==='INPUT')return;
  if(!edOn){if(e.code==='KeyG'&&!e.repeat&&!e.ctrlKey&&!e.metaKey&&!keyActs('KeyG').length&&keysBox.hidden)editorOpen();return}
  const c=e.code,mod=e.ctrlKey||e.metaKey;
  if(mod&&c==='KeyZ'){e.preventDefault();e.shiftKey?edRedo():edUndo();return}
  if(mod&&c==='KeyY'){e.preventDefault();edRedo();return}
  if(mod&&c==='KeyA'){e.preventDefault();edSelectView();return}
  if(mod&&c==='KeyD'){e.preventDefault();edCopy();return}
  if(e.repeat)return;
  if(c==='Escape'&&ed.box){ed.box=null;$('#edBox').hidden=true}
  else if(c==='Escape'&&ed.sel.length)edSelSet([]);
  else if(c==='KeyG'||c==='Escape')editorClose();
  else if(c==='Delete'||c==='Backspace'){if(ed.tool==='roads')edRoadDelete(ed.rpt<0);else edDelete()}
  else if(c==='Enter'&&ed.drawing)edRoadFinish();
  else{const i=['Digit1','Digit2','Digit3','Digit4','Digit5','Digit6'].indexOf(c);if(i===5)edMapPane();else if(i>=0)edGroup(Object.keys(ED_GROUPS)[i])}});

// ---------- saving, copying and loading ----------
function edQueueSave(){clearTimeout(ed.saveT);ed.saveT=setTimeout(edSave,800)}
function edSave(){clearTimeout(ed.saveT);mapAssets=assets;if(ed.roadsEdited)mapRoads=ROADS;try{localStorage.setItem('bhd_map',mapEncode())}catch(e){toast('Could not save the map on this device (storage is full or blocked).','bad',4000)}}
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
  // a list row or road picked: the view glides there; a long press adds to the selection (or takes away)
  if(ed.fly){const k=1-Math.exp(-dt*7);ed.x+=(ed.fly.x-ed.x)*k;ed.z+=(ed.fly.z-ed.z)*k;if(Math.hypot(ed.fly.x-ed.x,ed.fly.z-ed.z)<0.05)ed.fly=null}
  if(ed.lp&&now-ed.lp.t>450){const l=ed.lp,o=l.prev.filter(s=>edKey(s)!==edKey(l.hit));ed.lp=null;ed.drag=null;edSelSet(l.was?o:[...o,l.hit]);if(navigator.vibrate)navigator.vibrate(15)}
  if(ed.listF==='near'&&now-ed.listT>600){ed.listT=now;edListDraw()}
  // puddles and mud tiles keep up with the edits (painted Mud fills ruts, painting over them dries them)
  waterTick(dt);mudTick(dt);if(rainTexDirty)rainTexUpdate();
  const fy=hAt(ed.x,ed.z);edLook.set(ed.x,fy,ed.z);
  camera.position.set(ed.x+Math.sin(ed.yaw)*Math.cos(ed.pitch)*ed.dist,fy+Math.sin(ed.pitch)*ed.dist,ed.z+Math.cos(ed.yaw)*Math.cos(ed.pitch)*ed.dist);
  camera.position.y=Math.max(camera.position.y,hAt(camera.position.x,camera.position.z)+2);camera.lookAt(edLook);
  sky.position.copy(camera.position);
  sun.position.set(ed.x,fy,ed.z).addScaledVector(SUN_DIR,25);sun.target.position.set(ed.x,fy,ed.z);
  timeU.value=now/1000;updateSound(dt);
  shadowProxyTick();lawnLod();tuftLod();renderer.render(scene,camera)}
