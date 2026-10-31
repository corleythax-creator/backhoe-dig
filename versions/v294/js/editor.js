// Corley's Island: the map editor (☰ menu, or G). Shape the ground (raise, lower, flatten, smooth), paint dirt or grass or a material
// from the library (concrete, steel, brick and more; materials.js), lay out and grade roads, and place, move, turn, resize, copy, query and remove trees and boulders; the machines can be
// moved and turned too. Edits are layers over the generated mesa (ED_H, ED_P, ED_M, ROADS and the asset list, terrain.js and
// scenery.js), saved on this device
// as you go; the map can be copied out as text and loaded back. While it is open the game stands still.
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.
const ed={lineK:'streetlt',lineS:'both',lineG:80,tool:'raise',group:'shape',gtool:{shape:'raise',paint:'paint',things:'select',roads:'roads',inspect:'query'},size:15*FT,str:5,kind:'pine',mat:10,square:false,soft:false,keep:false,feather:0.5,x:0,z:10,yaw:0,pitch:0.95,dist:45,
  stroke:null,flatH:0,road:null,rpt:-1,drawing:false,roadSnap:null,bx:0,bz:0,hover:false,pend:null,refT:0,sel:[],drag:null,snap:null,changed:false,saveT:0,undo:[],redo:[],
  look:false,pane:'',drawer:true,boxMode:false,box:null,lp:null,fly:null,home:null,grp:false,listF:'all',open:{},statT:0,listT:0,place:'one',gap:12,dens:5,erase:false,scat:null,meas:[],measClosed:false,
  grid:0,cur:null,curMouse:false,clip:null,xf:null,knob:null,hYaw:0,nudgeT:0,rowOpen:false,rowN:4,rowGap:0,rowDir:'along'};
const ED_TOOLS={raise:'Raise',lower:'Lower',flatten:'Flatten',smooth:'Smooth',dirt:'Worked dirt',grass:'Grass',tall:'Tall grass',notall:'No tall grass',select:'Select',add:'Add',plant:'Plant',query:'Query',measure:'Measure',roads:'Roads',paint:'Paint'};
// the left bar's groups: their tools (picked in the bottom bar, or for Paint by the library's swatches), and whether the
// drawer beside the bar has a part for them (the material library, the things to add and the On the map list, the roads)
const ED_GROUPS={shape:{tools:['raise','lower','flatten','smooth']},paint:{tools:['paint','dirt','grass','tall','notall'],pane:1},things:{tools:['select','add','plant'],pane:1},roads:{tools:['roads'],pane:1},inspect:{tools:['query','measure']}};
// the editor's icons (24 px, drawn with lines), put in front of the words of every part with a data-ic
const ED_ICONS={done:'M15 5l-7 7 7 7',undo:'M9 14L4 9l5-5M4 9h10a6 6 0 010 12h-3',redo:'M15 14l5-5-5-5M20 9H10a6 6 0 000 12h3',
  look:'M12 3v18M3 12h18M9 6l3-3 3 3M9 18l3 3 3-3M6 9l-3 3 3 3M18 9l3 3-3 3',zin:'M10.5 4a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM15.5 15.5L21 21M7.5 10.5h6M10.5 7.5v6',
  zout:'M10.5 4a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM15.5 15.5L21 21M7.5 10.5h6',north:'M12 3l5 17-5-4-5 4z',eye:'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 9a3 3 0 100 6 3 3 0 000-6z',home:'M3 11l9-8 9 8M5 9v11h5v-6h4v6h5V9',
  panel:'M3 4h18v16H3zM9 4v16',shape:'M2 20l7-12 4 6 3-4 6 10z',paint:'M18 3l3 3-8 8-3-3zM10 11c-3 0-5 2-5 4.5S4 19 2 19.5C5 22 11 21 12 17c.4-1.6-.4-3.4-2-6z',
  things:'M12 2l6 9h-3l4 6H5l4-6H6zM12 17v5',roads:'M8 3L4 21M16 3l4 18M12 4v3M12 10v3M12 16v3',inspect:'M10 3a7 7 0 100 14 7 7 0 000-14zM15 15l6 6',
  map:'M3 6h6l2 2h10v11H3z',box:'M4 4h3M10 4h4M17 4h3v3M20 10v4M20 17v3h-3M14 20h-4M7 20H4v-3M4 14v-4M4 7V4',
  copy:'M8 8h12v12H8zM4 16V4h12',grid:'M4 4h16v16H4zM9.3 4v16M14.7 4v16M4 9.3h16M4 14.7h16',trash:'M4 6h16M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7M14 10v7'};
function edIcons(root){root.querySelectorAll('[data-ic]').forEach(b=>{if(b.querySelector('svg'))return;
  b.insertAdjacentHTML('afterbegin',`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${ED_ICONS[b.dataset.ic]}"/></svg>`)})}
edIcons($('#editor'));
const ED_BRUSH=['raise','lower','flatten','smooth','dirt','grass','tall','notall','paint'];
const ED_KINDS={pine:'Pine tree',leafy:'Leafy tree',rock:'Boulder'};
// the machines and the walker can be picked and moved: their state, scene object and pick radius
// (home: where each starts, for Back to start)
const ED_MACH=[{name:'Excavator',o:()=>st,m:()=>machine,r:2.6,home:()=>START},{name:'Dump truck',o:()=>tr,m:()=>truck,r:3.6,home:()=>TR_START},{name:'Mower',o:()=>mw,m:()=>mower,r:1.2,home:()=>MW_START},
  {name:'Skid steer',o:()=>sk,m:()=>skid,r:1.6,home:()=>SK_START},
  ...hvs.map(h=>({name:h.K.n[0].toUpperCase()+h.K.n.slice(1)+({corley:" (Corley's)",jessica:" (Jessica's)"}[h.home.island]||''),o:()=>h,m:()=>h.g,r:h.K.trail?3.6:2.4,home:()=>h.home})),{name:'You, on foot',o:()=>wk,m:()=>walker,r:0.8,home:()=>WK_START}];
const edFt=m=>m/FT,edFmt=(m,d)=>(m/FT).toFixed(d===undefined?1:d);
// spots are given from the trench's middle, so the grid lines up with the numbers shown
const ED_ZM=(TRENCH_Z0+TRENCH_Z1)/2;

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
  document.body.classList.add('editing');$('#editor').hidden=false;$('#bucketChip').hidden=true;showMenu(false);help.hidden=true;toggleMap(false);clearKeys();
  const fv=mode==='boat'?btCur():mode==='heavy'?hvCur():mode==='bike'?bk:mode==='truck'?tr:mode==='mow'?mw:mode==='skid'?sk:mode==='walk'?wk:st;ed.x=fv.x;ed.z=fv.z;
  ed.yaw=Math.atan2(camera.position.x-fv.x,camera.position.z-fv.z);ed.dist=45;ed.pitch=0.95;
  ed.home={x:ed.x,z:ed.z,yaw:ed.yaw,dist:ed.dist,pitch:ed.pitch};ed.drawer=!edNarrow();ed.pane=ED_GROUPS[ed.group].pane?ed.group:'';
  edTool(ed.tool);edCard(null);edSelSet([]);edMapsDraw();edUndoBtns();toast('Map editor. The game is paused while you edit.','',2600)}
function editorClose(){if(!edOn)return;$('#edHistList').hidden=true;edStrokeEnd();edScatterEnd();edRoadFinish();edOn=false;document.body.classList.remove('editing');$('#editor').hidden=true;
  edBrushRing.visible=edSelRings.visible=edSelShade[0].visible=edSelShade[1].visible=edSoftRing.visible=edHRing.visible=edHKnob.visible=edMeasDots.visible=edMeasLine.visible=false;ed.sel=[];ed.box=null;ed.lp=null;$('#edBox').hidden=true;ed.road=null;ed.rpt=-1;edRoadsDraw();clearKeys();firstCam=true;last=performance.now();
  if(assets.some(a=>a.hd)){for(const a of assets)delete a.hd;assetsBuild();shpTreesRefresh();edHiddenSync()}
  if(ed.changed){edSave();mapReset();mapDirty=true;ed.changed=false}}
$('#edDone').onclick=editorClose;
$('#editBtn').onclick=editorOpen;

// ---------- tools: the left bar picks a group, the bottom bar its tool and options, the drawer its library or list ----------
const edNarrow=()=>innerWidth<900||innerHeight<500;
function edTool(t){if(t!=='roads'){edRoadFinish();ed.road=null;ed.rpt=-1}ed.tool=t;
  const g=Object.keys(ED_GROUPS).find(k=>ED_GROUPS[k].tools.includes(t));if(g){ed.group=g;ed.gtool[g]=t}
  $('#edOpts').hidden=false;edSubDraw();
  document.querySelectorAll('#edOpts [data-for]').forEach(el=>el.hidden=!el.dataset.for.split(' ').includes(t));
  $('#edSoftOpt').hidden=!(t==='paint'&&ed.soft);edPlaceSync();
  if(t!=='query')edCard(null);edBrushRing.visible=edSoftRing.visible=false;if(t==='roads')edRoadCard();edRoadsDraw();
  edMatMark();edKindMark();edPaneSync();edTipSet();if(edOn){edRingSel();edMeasDraw()}}
// tapping the picked group again folds the drawer away (or the bottom bar's options, for a group without a drawer part)
function edGroup(g){const G=ED_GROUPS[g];
  if(g===ed.group&&ed.pane!=='map'){if(G.pane)ed.drawer=!ed.drawer;else{const o=$('#edOpts');o.hidden=!o.hidden}edPaneSync();return}
  ed.pane=G.pane?g:'';if(G.pane&&edNarrow())ed.drawer=true;edTool(ed.gtool[g])}
function edMapPane(){if(ed.pane==='map'&&ed.drawer)ed.pane=ED_GROUPS[ed.group].pane?ed.group:'';else{ed.pane='map';ed.drawer=true}edPaneSync()}
function edPaneSync(){const d=$('#edDrawer'),on=ed.drawer&&!!ed.pane;d.hidden=!on;
  d.querySelectorAll('.edsec').forEach(s=>s.hidden=s.dataset.g!==ed.pane);$('#edPanelBtn').setAttribute('aria-pressed',on);
  document.querySelectorAll('#edRail button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.g==='map'?on&&ed.pane==='map':b.dataset.g===ed.group));
  if(on&&ed.pane==='things')edListDraw();if(on&&ed.pane==='roads')edRoadList();if(on&&ed.pane==='map'){edMapsDraw();edStatsDraw()}}
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
function edKindMark(){document.querySelectorAll('#edKinds button').forEach(b=>b.setAttribute('aria-pressed',ed.tool==='add'&&b.dataset.k===ed.kind));$('#edKindV').textContent=edKindName(ed.kind);edPlaceSync()}
// ---------- placing in bulk (Add): One (then it is picked), Stamp (each tap another), Line (along a drag), Scatter (a brush) ----------
const edCap=t=>PROPS[t]?PROPS[t].cap:ASSET_CAP[t]||300;
const edRand=()=>({y:Math.random()*6.28,s:Math.random(),c:Math.random()});
// a new thing at a spot: the catalogue's at full size (facing the camera unless a turn is given), trees and boulders a
// little different each (r: its random numbers, kept by Line so a dragged line doesn't flicker)
function edNewThing(t,x,z,yaw,r){r=r||edRand();x=clamp(x,-555,MAIN_ZMAX);z=clamp(z,-555,MAIN_ZMAX);const pr=PROPS[t];
  return pr?{t,x,z,yaw:yaw!=null?yaw:Math.round(ed.yaw/(Math.PI/12))*Math.PI/12,s:1,c:pr.tint?Math.floor(r.c*PROP_TINT.length):0}:
    {t,x,z,yaw:r.y,s:t==='rock'?0.7+r.s*0.6:0.85+r.s*0.4,c:Math.floor(r.c*6)}}
// the bottom bar shows Spacing for Line and Scatter, Brush, Density and Erase for Scatter
function edPlaceSync(){document.querySelectorAll('#edPlace button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.p===ed.place));
  if(ed.tool==='add')document.querySelectorAll('#edOpts [data-place]').forEach(el=>el.hidden=!el.dataset.place.split(' ').includes(ed.place));
  const P=PROPS[ed.kind];$('#edGapV').textContent=ed.place==='line'&&P&&P.run?'end to end':`${ed.gap} ft`;$('#edDensV').textContent=ed.dens;
  $('#edErase').setAttribute('aria-pressed',ed.erase)}
document.querySelectorAll('#edPlace button').forEach(b=>b.onclick=()=>{ed.place=b.dataset.p;edPlaceSync();edTipSet();edBrushRing.visible=false});
{const g=$('#edGap'),d=$('#edDens');g.value=ed.gap;d.value=ed.dens;g.oninput=()=>{ed.gap=+g.value;edPlaceSync()};d.oninput=()=>{ed.dens=+d.value;edPlaceSync()}}
$('#edErase').onclick=()=>{ed.erase=!ed.erase;edPlaceSync()};
// Plant (Things): trees you planted (plant.js), which grow with ☰ Time's Date. A tap plants the picked species, put in
// Age years before the game's date (0: a nursery sapling today); with Dig up on (or Alt held) a tap digs up the nearest
// of yours within 10 ft. They are kept apart from the map, with the planted trees you set on foot (bhd_plant)
ed.plantAge=0;ed.plantDig=false;
$('#edPlantSp').innerHTML=TREE_SP.map((s,k)=>`<button class="sm" data-sp="${k}">${s.name.replace(/^./,c=>c.toUpperCase())}</button>`).join('');
function edPlantSync(){document.querySelectorAll('#edPlantSp button').forEach(b=>b.setAttribute('aria-pressed',+b.dataset.sp===plant.sp));
  $('#edPlantAge').value=ed.plantAge;$('#edPlantAgeV').textContent=ed.plantAge?`${ed.plantAge} yr ago`:'today';$('#edPlantDig').setAttribute('aria-pressed',ed.plantDig)}
document.querySelectorAll('#edPlantSp button').forEach(b=>b.onclick=()=>{plant.sp=+b.dataset.sp;plantSave();plantKindUI();ed.plantDig=false;edPlantSync()});
$('#edPlantAge').oninput=()=>{ed.plantAge=+$('#edPlantAge').value;edPlantSync()};
$('#edPlantDig').onclick=()=>{ed.plantDig=!ed.plantDig;edPlantSync()};
edPlantSync();
function edPlantAt(x,z,alt){const before=JSON.stringify(plant.list);
  if(ed.plantDig||alt){const i=plantNear(x,z,10*FT);if(i<0){toast('None of your planted trees stands here.','',1800);return}
    const a=plant.list.splice(i,1)[0];edPush({pl:before,n:'Dug up a '+TREE_SP[a.k].name});plantChanged();return}
  if(plant.list.length>=PLANT_CAP){toast(say('plantFull',{n:PLANT_CAP}),'bad',2400);return}
  if(!plantSpotOk(x,z)){toast(say('plantWet',{}),'bad',2200);return}
  plant.list.push(plantNew(plant.sp,x,z,dn.t-ed.plantAge*TREE_YR));edPush({pl:before,n:'Planted a '+TREE_SP[plant.sp].name});plantChanged()}
// Line: the things from where the drag started to where it is now; fences and gates end to end, the rest at the spacing,
// each turned along the line (at most 200, and no more than the kind's cap)
function edLineThings(L){const t=ed.kind,P=PROPS[t],dx=L.x1-L.x0,dz=L.z1-L.z0,len=Math.hypot(dx,dz),ux=len?dx/len:1,uz=len?dz/len:0,yaw=Math.atan2(-uz,ux);
  const room=Math.max(0,edCap(t)-assets.filter(a=>a.t===t).length+L.items.length),run=P&&P.run,g=run?P.w:Math.max(0.3,ed.gap*FT);
  const n=Math.min(200,room,run?Math.max(1,Math.round(len/g)):Math.floor(len/g)+1),out=[];
  for(let i=0;i<n;i++){const k=run?i+0.5:i;out.push(edNewThing(t,L.x0+ux*g*k,L.z0+uz*g*k,yaw,L.rnd[i]=L.rnd[i]||edRand()))}
  return {out,len}}
function edLineSet(L,x,z){[L.x1,L.z1]=edSnapXZ(x,z);const gone=new Set(L.items),keep=assets.filter(a=>!gone.has(a)),{out,len}=edLineThings(L);
  assets.length=0;assets.push(...keep,...out);L.items=out;assetsBuild();shpTreesRefresh();
  $('#edStatInfo').textContent=`line ${edFmt(len,0)} ft · ${out.length} × ${edKindName(ed.kind).toLowerCase()}`}
// Scatter, each frame while held: tries spots in the brush (more for a bigger brush and a higher density), keeping each
// new one the spacing from every thing already there; Erase takes this kind away under the brush
function edScatter(dt){const s=ed.scat,R=ed.size,t=ed.kind;
  if(s.erase){const keep=assets.filter(a=>a.lk||!(a.t===t&&Math.hypot(a.x-s.x,a.z-s.z)<R));if(keep.length<assets.length){assets.length=0;assets.push(...keep);s.dirty=true}}
  else{const g=Math.max(0.5,ed.gap*FT),tries=Math.min(40,Math.ceil(ed.dens*dt*Math.PI*R*R/40));let n=assets.filter(a=>a.t===t).length;
    for(let i=0;i<tries&&n<edCap(t);i++){const r=R*Math.sqrt(Math.random()),q=Math.random()*6.283,x=s.x+Math.cos(q)*r,z=s.z+Math.sin(q)*r;
      if(Math.abs(x)>118||Math.abs(z)>118||baseHeight(x,z)<WATER||assets.some(a=>Math.hypot(a.x-x,a.z-z)<g))continue;
      assets.push(edNewThing(t,x,z,null));n++;s.dirty=true}
    if(n>=edCap(t)&&!s.capped){s.capped=true;toast(`The map holds at most ${edCap(t)} of these (${edKindName(t)}).`,'',2600)}}
  const now=performance.now();if(s.dirty&&now-s.t>80){s.t=now;s.dirty=false;s.any=true;assetsBuild();shpTreesRefresh()}}
function edScatterEnd(){const s=ed.scat;ed.scat=null;if(!s)return;if(s.dirty){s.any=true;assetsBuild();shpTreesRefresh()}
  if(s.any){edPush({a:s.snap});ed.changed=true;edQueueSave();edListDraw();edStatus()}}
// the view: Look makes one finger move the view whatever the tool; closer, farther, north up and back to where the editor opened
$('#edLook').onclick=()=>{ed.look=!ed.look;$('#edLook').setAttribute('aria-pressed',ed.look)};
$('#edZoomIn').onclick=()=>{ed.dist=clamp(ed.dist/1.4,8,900);edStatus()};$('#edZoomOut').onclick=()=>{ed.dist=clamp(ed.dist*1.4,8,900);edStatus()};
$('#edNorth').onclick=()=>{ed.yaw=0};$('#edHome').onclick=()=>{if(ed.home){Object.assign(ed,ed.home);ed.fly=null}};
// the material library: every texture by kind, plus Natural ground, which clears a material, Worked dirt and Grass,
// which pick the Dirt and Grass tools (they paint ED_P, not a material), and Tall grass and No tall grass (ED_G)
// (made again when the owner's own textures arrive or change, ownmat.js; theirs show their own thumbnail)
function edMatPanel(){const N=MAT_BUILT,esc=t=>t.replace(/[&<>"]/g,c=>'&#'+c.charCodeAt(0)+';'),
    sw=m=>{const d=MAT_LIST[m-1];return !m?'<i class="nat"></i>':d.own?`<i class="own" style="background-image:url(${d.th})"></i>`:`<i style="background-size:${N*100}% 100%;background-position:${(m-1)/(N-1)*100}% 0"></i>`};
  const btn=m=>typeof m==='string'?`<button class="edmat" data-m="${m}"><i class="${m}"></i><span>${ED_TOOLS[m]}</span></button>`:
    `<button class="edmat" data-m="${m}">${sw(m)}<span>${m?esc(MAT_LIST[m-1].n):'Natural ground'}</span></button>`;
  let h=`<h3>Material library <small>${MAT_LIST.filter(Boolean).length} textures</small></h3>`;
  MAT_CATS.forEach((c,ci)=>{const ms=ci?[]:[0,'dirt','grass','tall','notall'];MAT_LIST.forEach((d,i)=>{if(d.cat===ci)ms.push(i+1)});h+=`<h4>${c}</h4><div class="edmatgrid">${ms.map(btn).join('')}</div>`});
  const box=$('#edMats');box.innerHTML=h;
  box.querySelectorAll('.edmat').forEach(b=>b.onclick=()=>{const v=b.dataset.m;if(ED_TOOLS[v])edTool(v);else{ed.mat=+v;edTool('paint')}edPicked()});edMatMark()}
function edMatMark(){document.querySelectorAll('#edMats .edmat').forEach(b=>{const v=b.dataset.m;b.setAttribute('aria-pressed',ed.tool==='paint'?+v===ed.mat&&!ED_TOOLS[v]:v===ed.tool)});edMatLabel()}
edMatPanel();
document.querySelectorAll('.edshape button').forEach(b=>b.onclick=()=>{ed.square=b.dataset.s==='sq';document.querySelectorAll('.edshape button').forEach(c=>c.setAttribute('aria-pressed',c===b))});
// Hard edge lays whole cells; Soft edge fades the material out to the natural ground over the outer part of the brush
document.querySelectorAll('.eddug button').forEach(b=>b.onclick=()=>{ed.keep=b.dataset.k==='keep';document.querySelectorAll('.eddug button').forEach(c=>c.setAttribute('aria-pressed',c===b))});
document.querySelectorAll('.ededge button').forEach(b=>b.onclick=()=>{ed.soft=b.dataset.e==='soft';$('#edSoftOpt').hidden=!ed.soft;document.querySelectorAll('.ededge button').forEach(c=>c.setAttribute('aria-pressed',c===b))});
function edMatLabel(){const d=matDef(ed.mat);$('#edMatV').textContent=ed.tool==='dirt'?'Worked dirt':ed.tool==='grass'?'Grass (over the dirt yards too)':ed.tool==='tall'?'Tall grass, to mow (grows back)':ed.tool==='notall'?'No tall grass (takes it away)':d?`${d.n} (one tile is ${d.ft} ft)`:'Natural ground (clears materials)';
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
  for(const a of assets){if(a.lk||a.hd)continue;const d=PROPS[a.t]?propHit(a,x,z):Math.hypot(a.x-x,a.z-z)/((a.t==='rock'?1.0:1.6)*a.s);if(d<bd){bd=d;best={a}}}
  for(const m of ED_MACH){if(!m.m().visible)continue;const o=m.o(),d=Math.hypot(o.x-x,o.z-z)/m.r;if(d<bd){bd=d;best={m}}}
  return best}

// ---------- reshaping and painting ----------
const edGrow=(r,a,b,c,d)=>r?[Math.min(r[0],a),Math.max(r[1],b),Math.min(r[2],c),Math.max(r[3],d)]:[a,b,c,d];
function edStrokeStart(x,z){ed.stroke0=ed.tool;ed.stroke={h:ED_H.slice(),p:ED_P.slice(),m:ED_M.slice(),a:ED_A.slice(),g:ED_G.slice(),ij:null,tn:0,tb:null};
  if(ed.tool==='tall')for(let q=0;q<ED_G.length;q++)if(ED_G[q]){const x=ED_X0+q%ED_NX*ED_C,z=ED_Z0+((q/ED_NX)|0)*ED_C,b=ed.stroke.tb;ed.stroke.tn++;ed.stroke.tb=b?[Math.min(b[0],x),Math.max(b[1],x),Math.min(b[2],z),Math.max(b[3],z)]:[x,x,z,z]}ed.bx=x;ed.bz=z;ed.flatH=baseHeight(x,z)}
// one frame of the brush: a soft round brush, strongest in the middle
function edBrush(dt){const R=ed.size,cx=ed.bx,cz=ed.bz,t=ed.tool,k=ed.str/10;
  const i0=Math.max(3,Math.floor((cx-R-ED_X0)/ED_C)),i1=Math.min(ED_NX-4,Math.ceil((cx+R-ED_X0)/ED_C)),j0=Math.max(3,Math.floor((cz-R-ED_Z0)/ED_C)),j1=Math.min(ED_NZ-4,Math.ceil((cz+R-ED_Z0)/ED_C));
  if(i0>i1||j0>j1)return;
  // painting turns ruts into what is painted, except Mud, and Dirt on ground that is already wet (mud.js); a material
  // stroke also takes dug and dumped ground back to grade, however deep, so the paint shows on it (the dig zone draws no paint on dug ground)
  if(t==='paint'&&ed.keep&&paintKeep(cx,cz,R,ed.square)){ed.pend=edGrow(ed.pend,cx-R-0.6,cx+R+0.6,cz-R-0.6,cz+R+0.6);ed.changed=true}
  if((t==='paint'&&ed.mat!==MUD_ID&&!ed.keep||t==='grass'||t==='dirt')&&rutErase(cx,cz,R,t==='paint'&&ed.square,t==='dirt'?(x,z)=>soakAt(x,z)>0.3:null,t==='paint')){
    ed.pend=edGrow(ed.pend,cx-R-0.6,cx+R+0.6,cz-R-0.6,cz+R+0.6);ed.changed=true}
  // tall grass goes on (or comes off) whole cells inside the ring, up to what the lawn holds (LAWN_MAX cells within
  // LAWN_SPAN each way, mower.js; a cell here is 6.25 of the lawn's); the grass follows a few times a second
  if(t==='tall'||t==='notall'){const v=t==='tall'?1:0,s=ed.stroke,qc=Math.round((cz-ED_Z0)/ED_C)*ED_NX+Math.round((cx-ED_X0)/ED_C),span=LAWN_SPAN*LAWN_GS-ED_C-0.4;let n=0;
    for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){const q=j*ED_NX+i,x=ED_X0+i*ED_C,z=ED_Z0+j*ED_C;if(Math.hypot(x-cx,z-cz)>R&&q!==qc||ED_G[q]===v)continue;
      if(v){const b=s.tb||[x,x,z,z],nb=[Math.min(b[0],x),Math.max(b[1],x),Math.min(b[2],z),Math.max(b[3],z)];
        if(s.tn>=Math.floor(LAWN_MAX/6.25)||nb[1]-nb[0]>span||nb[3]-nb[2]>span){if(!s.full){s.full=1;toast(say('edTallFull',{ft:Math.round(edFt(span))}),'',3500)}continue}
        s.tn++;s.tb=nb}
      ED_G[q]=v;n++}
    if(!n)return;ed.stroke.ij=edGrow(ed.stroke.ij,i0,i1,j0,j1);ed.changed=true;
    const now=performance.now();if(now-(ed.tallT||0)>400){ed.tallT=now;lawnLayout()}return}
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
function edRefresh(r,full){if(!r)return;const [X0,X1,Z0,Z1]=r;baseCacheClear();
  // the ground's own refresh reaches only the editor's layers (Corley's Island); off them (the mainland's town, the
  // other islands) a road or thing changes only the things and streets
  const x0=Math.max(X0,ED_X0),x1=Math.min(X1,ED_X0+(ED_NX-1)*ED_C),z0=Math.max(Z0,ED_Z0),z1=Math.min(Z1,ED_Z0+(ED_NZ-1)*ED_C);
  if(x0<x1&&z0<z1){
  const i0=Math.max(0,Math.floor(gI(x0))),i1=Math.min(N,Math.ceil(gI(x1))),j0=Math.max(0,Math.floor(gJ(z0))),j1=Math.min(N,Math.ceil(gJ(z1)));
  if(i0<=i1&&j0<=j1){for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){const k=j*V+i,b=baseHeight(gX(i),gZ(j));H[k]=H[k]===H0[k]?b:H[k]+b-H0[k];H0[k]=b;digBase(k)}
    touch(i0,i1,j0,j1);updateTufts(i0-1,i1+1,j0-1,j1+1);lawnTerrain();updateTerrain();winOn=false;blkTerrainMoved()}
  midUpdate(x0,x1,z0,z1);mudEdRefresh(x0,x1,z0,z1);tileEdRefresh(x0,x1,z0,z1);rainEdRefresh(x0,x1,z0,z1);lkBedEdit(x0,x1,z0,z1);wallBuild(x0,x1,z0,z1);tuftsRefresh(x0,x1,z0,z1);lawnsStale()}
  if(assets.some(a=>a.x>X0-6&&a.x<X1+6&&a.z>Z0-6&&a.z<Z1+6)){assetsBuild();shpTreesRefresh()}
  streetsEdRefresh(X0,X1,Z0,Z1,full);turfEdRefresh(X0,X1,Z0,Z1);
  // the town's boulders keep to its open grass (scenery.js)
  if(full&&X1>RT_BOX[0]&&X0<RT_BOX[1]&&Z1>RT_BOX[2]&&Z0<RT_BOX[3])rocksTown();
  if(x0<x1&&z0<z1&&full&&(x0<GX0+1||x1>GX1-1||z0<GZ0+1||z1>GZ1-1||x0<MID[0]+1||x1>MID[1]-1||z0<MID[2]+1||z1>MID[3]-1||x0<OUTER_MID[0]+1||x1>OUTER_MID[1]-1||z0<OUTER_MID[2]+1||z1>OUTER_MID[3]-1))buildSkirts()}
function edStrokeEnd(){const s=ed.stroke;if(!s)return;ed.stroke=null;edRefresh(ed.pend,true);ed.pend=null;
  if(!s.ij)return;const [i0,i1,j0,j1]=s.ij,w=i1-i0+1,h=new Float32Array(w*(j1-j0+1)),p=new Float32Array(h.length),m=new Uint8Array(h.length),c=new Uint8Array(h.length),tg=new Uint8Array(h.length);
  for(let j=j0;j<=j1;j++){const a=j*ED_NX+i0,b=j*ED_NX+i1+1,o=(j-j0)*w;h.set(s.h.subarray(a,b),o);p.set(s.p.subarray(a,b),o);m.set(s.m.subarray(a,b),o);c.set(s.a.subarray(a,b),o);tg.set(s.g.subarray(a,b),o)}
  const t=ed.stroke0,mt=matDef(ed.mat);
  if(t==='tall'||t==='notall')lawnLayout();
  edPush({g:[i0,i1,j0,j1],h,p,m,a:c,tg,n:t==='paint'?(mt?`Painted ${mt.n.toLowerCase()}`:'Cleared paint'):ED_STROKE_N[t]||'Edited the ground'});edQueueSave();matTexUpdate()}

// ---------- undo ----------
function edPush(u){const th=!u.g&&!u.roads&&!u.pl;if(!u.n)u.n=th?'Changed things':u.roads?edRoadsName(u.roads):'Edit';if(th)queueMicrotask(()=>{u.n=edThingsName(u.a)});ed.undo.push(u);if(ed.undo.length>30)ed.undo.shift();ed.redo.length=0;edUndoBtns()}
function edUndoBtns(){$('#edUndo').disabled=!ed.undo.length;$('#edRedo').disabled=!ed.redo.length;$('#edHist').disabled=!ed.undo.length&&!ed.redo.length;if(!$('#edHistList').hidden)edHistDraw()}
// each step's name for History: a brush stroke by its tool, roads and things by what changed from the copy kept for undo
const ED_STROKE_N={raise:'Raised ground',lower:'Lowered ground',flatten:'Flattened ground',smooth:'Smoothed ground',dirt:'Painted worked dirt',grass:'Painted grass',tall:'Painted tall grass',notall:'Took away tall grass'};
const edPlural=(n,w)=>n===1?`1 ${w}`:`${n} ${/(s|x|ch|sh)$/.test(w)?w+'es':/[^aeiou]y$/.test(w)?w.slice(0,-1)+'ies':w+'s'}`;
const edKindWord=t=>edKindName(t).replace(/ \(.*\)/,'').toLowerCase();
function edThingsName(before){const was=JSON.parse(before),now=assets,kinds=l=>[...new Set(l.map(a=>a.t))],word=l=>kinds(l).length===1?edKindWord(l[0].t):'thing';
  const say=(v,l)=>`${v} ${edPlural(l.length,word(l))}`;
  if(now.length!==was.length){const key=a=>[a.t,a.x,a.z,a.yaw,a.s].join(),s=new Set(was.map(key)),s2=new Set(now.map(key));
    return now.length>was.length?say('Added',now.filter(a=>!s.has(key(a)))):say('Deleted',was.filter(a=>!s2.has(key(a))))}
  const ch=[],how=new Set();now.forEach((a,i)=>{const b=was[i];if(!b)return;let c=false;
    if(a.x!==b.x||a.z!==b.z){how.add('Moved');c=true}if(a.yaw!==b.yaw){how.add('Turned');c=true}if(a.s!==b.s){how.add('Sized');c=true}
    if(a.c!==b.c){how.add('Coloured');c=true}if(!!a.lk!==!!b.lk){how.add(a.lk?'Locked':'Unlocked');c=true}if(c)ch.push(a)});
  if(!ch.length)return 'Changed things';const v=[...how];return say(v.length===1?v[0]:v.slice(0,2).join(' and ').replace(/ and (\w)/,(m,c)=>' and '+c.toLowerCase()),ch)}
function edRoadsName(before){const was=JSON.parse(before);if(ROADS.length>was.length)return 'New road';if(ROADS.length<was.length)return 'Deleted a road';
  for(let i=0;i<ROADS.length;i++){const r=ROADS[i],b=was[i];if(!b)continue;
    if(r.pts.length>b.pts.length)return 'Added a road point';if(r.pts.length<b.pts.length)return 'Deleted a road point';
    if(r.w!==b.w)return 'Road width';if(r.mid!==b.mid)return 'Grass up the middle';if(!!r.pv!==!!b.pv)return r.pv?'Paved a road':'Unpaved a road';
    if(!!r.cb!==!!b.cb)return 'Curbs';if((r.sw||0)!==(b.sw||0))return 'Sidewalks';if(!!r.cl!==!!b.cl)return 'Centre line';if((r.sf||0)!==(b.sf||0))return 'Street surface';if(edGraded(r)!==edGraded(b))return edGraded(r)?'Graded a road':'Ungraded a road';
    if(JSON.stringify(r.pts)!==JSON.stringify(b.pts))return r.pts.some((q,k)=>b.pts[k]&&q[2]!==b.pts[k][2]&&q[0]===b.pts[k][0])?'Road point height':'Moved a road point'}
  return 'Changed a road'}
// History: every step that can be undone or redone, newest at the top; tapping one undoes or redoes up to just after it
function edHistDraw(){const el=$('#edHistList'),U=ed.undo,R=ed.redo,rows=[];
  for(let i=R.length-1;i>=0;i--)rows.push([U.length+R.length-i,R[i].n,true]);
  for(let i=U.length-1;i>=0;i--)rows.push([i+1,U[i].n,false]);rows.push([0,'Where this began',false]);
  el.innerHTML=rows.map(([k,n,f])=>`<button class="sm${f?' fut':''}" data-h="${k}" aria-current="${k===U.length}">${n}</button>`).join('');
  el.querySelectorAll('button').forEach(b=>b.onclick=()=>{const k=+b.dataset.h;while(ed.undo.length>k)edUndo();while(ed.undo.length<k&&ed.redo.length)edRedo()})}
$('#edHist').onclick=()=>{const el=$('#edHistList'),open=el.hidden;el.hidden=!open;$('#edHist').setAttribute('aria-expanded',open);
  if(open){const r=$('#edHist').getBoundingClientRect();el.style.left=Math.max(4,Math.min(r.left,innerWidth-230))+'px';el.style.top=r.bottom+4+'px';edHistDraw()}};
addEventListener('pointerdown',e=>{const el=$('#edHistList');if(!el.hidden&&!el.contains(e.target)&&e.target!==$('#edHist')){el.hidden=true;$('#edHist').setAttribute('aria-expanded',false)}},true);
// swaps the saved state with the current one, so the same entry undoes and redoes
function edSwap(u){
  if(u.g){const [i0,i1,j0,j1]=u.g,w=i1-i0+1;let tall=false;
    for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){const q=j*ED_NX+i,o=(j-j0)*w+i-i0,a=ED_H[q],b=ED_P[q],c=ED_M[q],d=ED_A[q];ED_H[q]=u.h[o];ED_P[q]=u.p[o];ED_M[q]=u.m[o];ED_A[q]=u.a[o];u.h[o]=a;u.p[o]=b;u.m[o]=c;u.a[o]=d;
      if(u.tg&&u.tg[o]!==ED_G[q]){const e=ED_G[q];ED_G[q]=u.tg[o];u.tg[o]=e;tall=true}}
    matU.tMatId.value.needsUpdate=true;matU.tMatCov.value.needsUpdate=true;matTexUpdate();if(tall)lawnLayout();
    edRefresh([ED_X0+i0*ED_C-0.6,ED_X0+i1*ED_C+0.6,ED_Z0+j0*ED_C-0.6,ED_Z0+j1*ED_C+0.6],true)}
  else if(u.pl){const now=JSON.stringify(plant.list);plant.list.length=0;plant.list.push(...JSON.parse(u.pl));u.pl=now;plantChanged()}
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
// edSelA: the picked things that can be changed (not locked); edSelL: every picked thing, for Lock and Hide
const edKey=h=>h.a||h.m,edIn=h=>ed.sel.some(s=>edKey(s)===edKey(h)),edSelL=()=>ed.sel.filter(s=>s.a).map(s=>s.a),edSelA=()=>edSelL().filter(a=>!a.lk);
const edRad=a=>PROPS[a.t]?propR(a):(a.t==='rock'?1.0:1.6)*a.s;
// a ring round each picked one, all in one line set
const edSelRings=(function(){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(1200*48*3),3));g.setDrawRange(0,0);
  const l=new THREE.LineSegments(g,new THREE.LineBasicMaterial({color:0xf07a22,depthTest:false,transparent:true,opacity:0.95,fog:false,toneMapped:false}));l.renderOrder=20;l.frustumCulled=false;l.visible=false;scene.add(l);return l})();
// and an orange shade over each picked one, seen through whatever stands in front: a box for placed things and machines,
// a column for trees and boulders
const edSelShade=[new THREE.BoxGeometry(1,1,1),new THREE.CylinderGeometry(1,1,1,16)].map(g=>{g.translate(0,0.5,0);
  const m=new THREE.InstancedMesh(g,new THREE.MeshBasicMaterial({color:0xf07a22,transparent:true,opacity:0.3,depthTest:false,depthWrite:false,fog:false,toneMapped:false}),1200);
  m.renderOrder=19;m.frustumCulled=false;m.visible=false;m.count=0;scene.add(m);return m});
const edShadeH={pine:9,leafy:7,rock:1.1},edShadeO=new THREE.Object3D(),edShadeB=new THREE.Box3();
function edShadeSel(){const n=[0,0],o=edShadeO;
  for(const s of ed.sel){if(s.a&&s.a.hd)continue;let k=0;
    if(s.m){const g=s.m.m();if(!g.visible)continue;edShadeB.setFromObject(g);if(edShadeB.isEmpty())continue;
      o.position.set((edShadeB.min.x+edShadeB.max.x)/2,edShadeB.min.y,(edShadeB.min.z+edShadeB.max.z)/2);o.rotation.set(0,0,0);o.scale.set(edShadeB.max.x-edShadeB.min.x+0.2,edShadeB.max.y-edShadeB.min.y+0.2,edShadeB.max.z-edShadeB.min.z+0.2)}
    else{const a=s.a,P=PROPS[a.t],y=hAt(a.x,a.z);o.position.set(a.x,y-0.1,a.z);o.rotation.set(0,a.yaw||0,0);
      if(P)o.scale.set(P.w*a.s+0.2,(P.cat===1?4.5:1.6)*a.s,P.d*a.s+0.2);
      else{k=1;const r=(a.t==='rock'?0.9:1.4)*a.s;o.scale.set(r,(edShadeH[a.t]||3)*a.s,r)}}
    if(n[k]>=1200)continue;o.updateMatrix();edSelShade[k].setMatrixAt(n[k]++,o.matrix)}
  edSelShade.forEach((m,i)=>{m.count=n[i];m.instanceMatrix.needsUpdate=true;m.visible=n[i]>0})}
function edRingSel(){const at=edSelRings.geometry.attributes.position,P=at.array,k=ed.sel.length>60?12:24;let n=0;
  for(const s of ed.sel){if(n+2*k>at.count)break;const o=s.a||s.m.o(),r=s.a?edRad(s.a):s.m.r;
    for(let i=0;i<k;i++)for(const e of [i,i+1]){const t=e/k*Math.PI*2,x=o.x+Math.cos(t)*r,z=o.z+Math.sin(t)*r;P[n*3]=x;P[n*3+1]=hAt(x,z)+0.15;P[n*3+2]=z;n++}}
  at.needsUpdate=true;edSelRings.geometry.setDrawRange(0,n);edSelRings.visible=n>0;edShadeSel();edHandles()}
function edSelSet(list){ed.sel=list;edRingSel();edInspector();edListDraw();edStatus()}
// the things and machines whose middles are inside a rectangle of the screen
function edInRect(x0,y0,x1,y1,things){const rc=canvas.getBoundingClientRect(),out=[];
  const inR=(x,z)=>{edV.set(x,hAt(x,z)+0.5,z).project(camera);if(Math.abs(edV.z)>1)return false;const sx=(edV.x+1)/2*rc.width+rc.left,sy=(1-edV.y)/2*rc.height+rc.top;return sx>=x0&&sx<=x1&&sy>=y0&&sy<=y1};
  for(const a of assets)if(!a.lk&&!a.hd&&inR(a.x,a.z))out.push({a});
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
const edIsTree=a=>a.t==='pine'||a.t==='leafy';
function edAssetName(a){if(PROPS[a.t])return propName(a);if(a.t==='rock')return `Boulder, ${edFmt(1.6*a.s,0)} ft across`;
  if(!edIsTree(a))return `${ED_KINDS[a.t]||a.t}, ${edFmt(4.7*a.s,0)} ft tall`;
  const v=treeVitalsOf(a);return `${ED_KINDS[a.t]} (${TREE_SP[v.k].name}), ${edFmt(v.H,0)} ft tall, about ${sN(v.age)} yr old`}
// the ages of the trees among several picked things
function edTreeAges(S){const ages=S.filter(s=>s.a&&edIsTree(s.a)).map(s=>treeVitalsOf(s.a).age);if(!ages.length)return '';
  return ` · tree ages ${sN(Math.min(...ages))} to ${sN(Math.max(...ages))} yr, average ${sN(ages.reduce((p,q)=>p+q,0)/ages.length)}`}
// the trees on the map by species with their ages, and the guide of age by size
function edTreeBlock(){const C=treeCensus('main');if(!C.n)return '';
  return `<details class="edtrees"${ed.treeOpen?' open':''}><summary>Tree ages: ${sN(C.n)} trees, average ${sN(C.age/C.n)} yr, oldest ${sN(C.old.age)} yr</summary>
    <table class="edsum"><thead><tr><th>Species</th><th>Trees</th><th>Avg age</th><th>Oldest</th><th>Tallest</th></tr></thead><tbody>${C.sp.map((x,k)=>`<tr><td>${treeName(k)}</td><td>${x.n}</td><td>${x.n?sN(x.age/x.n)+' yr':'—'}</td><td>${x.n?sN(x.old)+' yr':'—'}</td><td>${x.n?sFt(x.tall):'—'}</td></tr>`).join('')}</tbody></table>
    <p class="hint">Pick a tree to see its age, trunk and growth. Size changes its age: a taller tree is an older one.</p>${treeGuideHtml()}</details>`}
// a tree's age and size in words: for the info card
function edTreeLine(a){const v=treeVitalsOf(a);return `${TREE_STAGES[v.st]} · ${sN(v.age)} yr old · trunk ${sIn(v.D)} · crown ${edFmt(v.crown,0)} ft wide · grows ${(v.grow/2.54).toFixed(1)} in a year · holds ${sLb(v.co2)} of CO₂`}
const edSlider=(id,lab,min,max,step,val,unit)=>`<span class="edopt"><label for="${id}">${lab}</label><input id="${id}" type="range" min="${min}" max="${max}" step="${step}" value="${val}"><output id="${id}V">${val}${unit}</output></span>`;
// the colours a kind can take (scenery.js tints the trees, props.js the buildings' walls), as swatches
const edFam=t=>t==='pine'||t==='leafy'?t:PROPS[t]&&PROPS[t].tint?'house':propGlow(t)?'glow':null;
function edFams(){return {pine:{n:'Needles',c:ASSET_PT.map(t=>[0.3*t[0],0.46*t[1],0.26*t[2]])},leafy:{n:'Leaves',c:ASSET_LT},house:{n:'Walls',c:PROP_TINT.map(t=>[0.9*t[0],0.88*t[1],0.84*t[2]])},
  glow:{n:'Light',c:LAMP_COLS.map(h=>{const c=new THREE.Color(h);return [c.r,c.g,c.b]})}}}
function edInspector(){const S=ed.sel,el=$('#edInfo');edBottomSync();if(!S.length){el.innerHTML='';return}
  const L=edSelL(),nl=L.length-edSelA().length;
  // only locked things picked: they can be unlocked or hidden, nothing else
  if(nl&&nl===S.length){el.innerHTML=`<div class="edihead"><h3>${nl===1?edAssetName(L[0]):nl+' selected'}</h3><small>Locked: unlock to move or change ${nl===1?'it':'them'}</small></div>`+edHideLockRow(L);edHideLockWire(el,L);return}
  const as=edSelA(),one=S.length===1?S[0]:null,deg=y=>Math.round(((y*57.3)%360+360)%360);let h;
  if(one){const o=one.a||one.m.o(),g=baseHeight(o.x,o.z);
    h=`<div class="edihead"><h3>${one.a?edAssetName(one.a):one.m.name}</h3><small>${edWhere(o.x,o.z)} · ground ${g>=0?'+':'−'}${edFmt(Math.abs(g))} ft</small>${one.a&&edIsTree(one.a)?`<small>${edTreeLine(one.a)}</small>`:''}</div>`+
      `<span class="edopt"><label for="edSelPX">East</label><input id="edSelPX" type="number" step="0.5" value="${edFmt(o.x)}" title="Feet east of the trench (west is negative)"><output>ft</output></span>`+
      `<span class="edopt"><label for="edSelPZ">South</label><input id="edSelPZ" type="number" step="0.5" value="${edFmt(o.z-ED_ZM)}" title="Feet south of the trench (north is negative)"><output>ft</output></span>`+
      edSlider('edSelTurn','Turn',0,359,ed.grid?15:1,deg(one.a?one.a.yaw:o.yaw||0),'°')+(one.a?edSlider('edSelSize','Size',30,300,5,Math.round(one.a.s*100),'%'):'')}
  else{const c={};for(const s of S){const n=s.a?edKindName(s.a.t):'Machine';c[n]=(c[n]||0)+1}
    h=`<div class="edihead"><h3>${S.length} selected</h3><small>${Object.entries(c).map(([n,k])=>`${n} ×${k}`).join(', ')}${edTreeAges(S)}${nl?` · ${nl} locked, left as they are`:''}</small></div>`+
      (as.length?edSlider('edSelTurn','Turn',-180,180,ed.grid?15:5,0,'°')+edSlider('edSelSize','Size',30,300,5,100,'%')+`<button id="edSelGrp" class="sm" aria-pressed="${ed.grp}">As a group</button>`:'')+
      (as.length>1?`<span class="row" role="group" aria-label="Line up"><button id="edAlLine" class="sm">Line up</button>${as.length>2?'<button id="edAlSpace" class="sm">Space evenly</button>':''}<button id="edAlFace" class="sm">Face one way</button></span>`:'')}
  const F=edFams(),fams={};for(const a of as){const f=edFam(a.t);if(f)(fams[f]=fams[f]||[]).push(a)}
  for(const f in fams){const T=F[f],cs=new Set(fams[f].map(a=>a.c%T.c.length));
    h+=`<span class="edopt"><label>${T.n}</label><span class="edsw">${T.c.map((q,i)=>`<button class="edswb" data-f="${f}" data-c="${i}" aria-pressed="${cs.size===1&&cs.has(i)}" aria-label="${T.n} colour ${i+1}" style="background:rgb(${q.map(v=>Math.round(Math.min(1,v)*255)).join(',')})"></button>`).join('')}</span></span>`}
  h+=`<span class="row">${as.length?`<button id="edSelCopy" class="sm edico" data-ic="copy">Duplicate</button><button id="edSelClip" class="sm">Copy</button><button id="edRowBtn" class="sm" aria-pressed="${ed.rowOpen}">Row</button><button id="edSelDel" class="sm danger edico" data-ic="trash">Delete</button>`:'<span class="hint">Drag it to move it.</span>'}${S.some(s=>s.m)?'<button id="edMachHome" class="sm">Back to start</button>':''}<button id="edSelX" class="sm">Clear</button></span>`+(L.length?edHideLockRow(L):'');
  // Row: copies of the selection in a line, along the first one's width or across it, end to end or at a spacing
  if(as.length&&ed.rowOpen)h+=edSlider('edRowN','Copies',1,30,1,ed.rowN,'')+edSlider('edRowGap','Spacing',0,60,1,ed.rowGap,'')+
    `<span class="row" role="group" aria-label="Row direction"><button class="sm" data-rd="along" aria-pressed="${ed.rowDir==='along'}">Along</button><button class="sm" data-rd="across" aria-pressed="${ed.rowDir==='across'}">Across</button></span><button id="edRowGo" class="sm go">Make row</button>`;
  el.innerHTML=h;edIcons(el);
  // turning and sizing start from where each one was when the slider was taken hold of (edXf); several turn and size each
  // about its own middle, or as a group about the middle of them all
  const tv=$('#edSelTurn'),sv=$('#edSelSize');
  const commit=()=>{if(!ed.xf)return;edXfEnd();edInspector()};
  if(tv)tv.oninput=()=>{$('#edSelTurnV').textContent=tv.value+'°';
    if(!as.length){const o=one.m.o(),y=+tv.value/57.3;o.yaw=y;if(o===wk)wk.view=y;one.m.m().rotation.y=y;return}
    const b=edXfBegin(as);edXfTurn(+tv.value/57.3-(one?b.q[0].yaw:0),!one&&ed.grp)};
  if(tv)tv.onchange=commit;
  if(sv){sv.oninput=()=>{$('#edSelSizeV').textContent=sv.value+'%';const b=edXfBegin(as);edXfSize(+sv.value/100/(one?b.q[0].s:1),!one&&ed.grp)};
    sv.onchange=commit}
  // exact spot in feet from the trench, as the Spot line gives it
  const px=$('#edSelPX'),pz=$('#edSelPZ');
  if(px)px.onchange=pz.onchange=()=>{const x=+px.value*FT,z=+pz.value*FT+ED_ZM;if(!isFinite(x)||!isFinite(z))return;
    if(one.a){const b=edAssetsSnap();one.a.x=clamp(x,-555,MAIN_ZMAX);one.a.z=clamp(z,-555,MAIN_ZMAX);edAssetsChanged(b)}else edPlaceMachine(one.m,x,z);
    edRingSel();edInspector()};
  const al=$('#edAlLine');if(al){al.onclick=()=>edAlign('line');$('#edAlFace').onclick=()=>edAlign('face');const sp=$('#edAlSpace');if(sp)sp.onclick=()=>edAlign('space')}
  const rb=$('#edRowBtn');if(rb){rb.onclick=()=>{ed.rowOpen=!ed.rowOpen;edInspector()};$('#edSelClip').onclick=()=>edClipCopy(false)}
  const rn=$('#edRowN'),rg=$('#edRowGap');
  if(rn){const lab=()=>{$('#edRowNV').textContent=ed.rowN;$('#edRowGapV').textContent=ed.rowGap?ed.rowGap+' ft':'end to end'};lab();
    rn.oninput=()=>{ed.rowN=+rn.value;lab()};rg.oninput=()=>{ed.rowGap=+rg.value;lab()};
    el.querySelectorAll('[data-rd]').forEach(b=>b.onclick=()=>{ed.rowDir=b.dataset.rd;edInspector()});$('#edRowGo').onclick=edRowMake}
  const gb=$('#edSelGrp');if(gb)gb.onclick=()=>{ed.grp=!ed.grp;edInspector()};
  el.querySelectorAll('.edswb').forEach(b=>b.onclick=()=>{const snap=edAssetsSnap();for(const a of fams[b.dataset.f])a.c=+b.dataset.c;edAssetsChanged(snap);edInspector()});
  const cb=$('#edSelCopy');if(cb){cb.onclick=edCopy;$('#edSelDel').onclick=edDelete}
  $('#edSelX').onclick=()=>edSelSet([]);if(L.length)edHideLockWire(el,L);
  const mh=$('#edMachHome');if(mh)mh.onclick=()=>{for(const s of ed.sel)if(s.m)edMachHome(s.m);edRingSel();edInspector()}}
// Hide (H) leaves things out of the view while the editor is open, to get at what is behind them; it is not saved, and
// they come back when the editor closes or their row in On the map is tapped. Lock (L) is saved with the map: a locked
// thing can't be picked on the ground or in a box, moved, turned, sized, copied or deleted (Delete every kind leaves it)
// until it is unlocked, from the bottom bar or its 🔒 in On the map
const edHideLockRow=L=>`<span class="row" role="group" aria-label="Hide and lock"><button id="edSelHide" class="sm">Hide</button><button id="edSelLock" class="sm" aria-pressed="${L.every(a=>a.lk)}">${L.every(a=>a.lk)?'Unlock':'Lock'}</button></span>`;
function edHideLockWire(el,L){$('#edSelHide').onclick=()=>edHide(L,true);$('#edSelLock').onclick=()=>edLock(L,!L.every(a=>a.lk));$('#edSelX')&&($('#edSelX').onclick=()=>edSelSet([]))}
function edHide(as,on){for(const a of as)if(on)a.hd=1;else delete a.hd;assetsBuild();shpTreesRefresh();
  if(on)edSelSet(ed.sel.filter(s=>!s.a||!s.a.hd));else edListDraw();edHiddenSync();edStatus()}
function edLock(as,on){const b=edAssetsSnap();for(const a of as)if(on)a.lk=1;else delete a.lk;edAssetsChanged(b);edRingSel();edInspector()}
function edHiddenSync(){const n=assets.filter(a=>a.hd).length,s=$('#edShowAll');s.hidden=!n;s.textContent=`Show hidden (${n})`}
$('#edShowAll').onclick=()=>edHide(assets.filter(a=>a.hd),false);
// a copy of one thing goes alongside it, along its width, so fence sections line up; a copy of several goes beside them
// all, to the right as seen from the camera
function edCopy(){const as=edSelA();if(!as.length)return;const b=edAssetsSnap();let out;
  if(as.length===1){const a0=as[0],P=PROPS[a0.t],w=P?(P.w+(P.d>0.5?0.6:0))*a0.s:0;
    out=[Object.assign({},a0,P?{x:a0.x+Math.cos(a0.yaw)*w,z:a0.z-Math.sin(a0.yaw)*w}:{x:a0.x+2.5*a0.s,z:a0.z+1.5*a0.s})]}
  else{const rx=Math.cos(ed.yaw),rz=-Math.sin(ed.yaw);let p0=1e9,p1=-1e9;for(const a of as){const p=a.x*rx+a.z*rz,r=edRad(a);p0=Math.min(p0,p-r);p1=Math.max(p1,p+r)}
    const w=p1-p0+1;out=as.map(a=>Object.assign({},a,{x:clamp(a.x+rx*w,-555,MAIN_ZMAX),z:clamp(a.z+rz*w,-555,MAIN_ZMAX)}))}
  assets.push(...out);edAssetsChanged(b);edSelSet(out.map(a=>({a})))}
function edDelete(){const as=edSelA();if(!as.length)return;const b=edAssetsSnap(),gone=new Set(as),keep=assets.filter(a=>!gone.has(a));
  assets.length=0;assets.push(...keep);edAssetsChanged(b);edSelSet(ed.sel.filter(s=>!gone.has(s.a)))}
// moves a machine (or the walker) to a spot on the mesa and sets it down on the ground there
function edPlaceMachine(m,x,z){const o=m.o();[x,z]=landClamp(x,z,4,2);
  o.x=x;o.z=z;if(o===tr)tr.v=0;const y=surfAt(x,z);o.y=y;m.m().position.set(x,y,z)}
// a machine (or the walker) back where it starts the game, facing the way it starts
function edMachHome(m){const h=m.home(),o=m.o();edPlaceMachine(m,h.x,h.z);o.yaw=h.yaw;if(o===wk)wk.view=h.yaw;m.m().rotation.y=h.yaw}

// ---------- On the map: every thing and machine by kind, in the Things drawer ----------
const edShortSpot=(x,z)=>{const s=z-(TRENCH_Z0+TRENCH_Z1)/2;return `${edFmt(Math.abs(x),0)} ft ${x<0?'W':'E'}, ${edFmt(Math.abs(s),0)} ft ${s<0?'N':'S'}`};
const edFlyTo=(x,z)=>{ed.fly={x,z}};
// a row's key: a + its index in the asset list, or m + its index in ED_MACH
const edRowHit=k=>k[0]==='a'?(assets[+k.slice(1)]?{a:assets[+k.slice(1)]}:null):{m:ED_MACH[+k.slice(1)]};
function edListDraw(){const el=$('#edList');if($('#edDrawer').hidden||ed.pane!=='things')return;
  const f=ed.listF,by={},lk=q=>q.h.a&&q.h.a.lk,near=(x,z)=>Math.hypot(x-ed.x,z-ed.z)<ed.dist*0.9;assets.forEach((a,i)=>{(by[a.t]=by[a.t]||[]).push({h:{a},k:'a'+i,label:edAssetName(a),x:a.x,z:a.z})});
  const groups=[...new Set(['pine','leafy','rock',...Object.keys(PROPS),...Object.keys(by)])].filter(t=>by[t]).map(t=>['a:'+t,edKindName(t),by[t],t]);
  groups.push(['m','Machines',ED_MACH.map((m,i)=>({m,i})).filter(q=>q.m.m().visible).map(q=>{const o=q.m.o();return {h:{m:q.m},k:'m'+q.i,label:q.m.name,x:o.x,z:o.z}})]);
  let h='';
  for(const [id,name,items,t] of groups){const shown=items.filter(q=>f==='all'||f==='near'&&near(q.x,q.z)||f==='sel'&&edIn(q.h)||f==='lock'&&lk(q));if(!shown.length)continue;
    shown.sort((p,q)=>edIn(q.h)-edIn(p.h)); // the picked ones first
    const nSel=items.filter(q=>edIn(q.h)).length,open=!!ed.open[id];
    h+=`<div class="edlg"><button class="edlgo" data-g="${id}" aria-expanded="${open}"><i>${open?'▾':'▸'}</i>${name} <small>${shown.length}${f==='all'?'':' of '+items.length}</small></button><button class="sm edlgs" data-g="${id}" aria-pressed="${nSel===items.length}">${nSel?nSel+' picked':'Select all'}</button></div>`;
    if(!open)continue;
    h+='<div class="edlrows">'+shown.slice(0,200).map(q=>`<div class="edlr"><button class="edlck" data-k="${q.k}" aria-pressed="${edIn(q.h)}" aria-label="Add to the selection"></button><button class="edlrn" data-k="${q.k}"><span>${q.label}</span><small>${edShortSpot(q.x,q.z)}</small></button>${q.h.a?`<button class="edlhd" data-hd="${q.k}" aria-pressed="${!!q.h.a.hd}" aria-label="Hide while editing" title="Hide while editing">👁</button><button class="edlhd" data-lk="${q.k}" aria-pressed="${!!q.h.a.lk}" aria-label="Lock" title="Lock">🔒</button>`:''}</div>`).join('')+
      (shown.length>200?`<p class="hint">and ${shown.length-200} more: pick Near the view to see the ones close by</p>`:'')+'</div>';
    if(t){const ah=items.every(q=>q.h.a.hd),al=items.every(lk);h+=`<div class="row edlact"><button class="sm" data-hdall="${t}" aria-pressed="${ah}">${ah?'Show':'Hide'} them</button><button class="sm" data-lkall="${t}" aria-pressed="${al}">${al?'Unlock':'Lock'} them</button><button class="sm danger" data-del="${t}">Delete every ${name.toLowerCase()}${items.some(lk)?' not locked':''}</button>${ED_KINDS[t]?`<button class="sm" data-def="${t}">Put back the first ones</button>`:''}</div>`}
    if(id==='m')h+='<div class="row edlact"><button class="sm" data-home="all">Every machine back to its start spot</button></div>'}
  el.innerHTML=edTreeBlock()+(h||'<p class="hint">Nothing to show.</p>');const td=el.querySelector('.edtrees');if(td)td.ontoggle=()=>{ed.treeOpen=td.open};$('#edListN').textContent=`${assets.length} things`;
  el._g=groups}
document.querySelectorAll('.edfilter button').forEach(b=>b.onclick=()=>{ed.listF=b.dataset.f;document.querySelectorAll('.edfilter button').forEach(c=>c.setAttribute('aria-pressed',c===b));edListDraw()});
$('#edList').onclick=e=>{const b=e.target.closest('button');if(!b)return;const el=$('#edList'),grp=id=>(el._g.find(g=>g[0]===id)||[])[2]||[];
  if(b.classList.contains('edlgo')){ed.open[b.dataset.g]=!ed.open[b.dataset.g];edListDraw();return}
  // 👁 and 🔒 on a row, or for the whole kind
  if(b.dataset.hd||b.dataset.lk){const h=edRowHit(b.dataset.hd||b.dataset.lk);if(h&&h.a){if(b.dataset.hd)edHide([h.a],!h.a.hd);else edLock([h.a],!h.a.lk)}return}
  if(b.dataset.hdall||b.dataset.lkall){const t=b.dataset.hdall||b.dataset.lkall,as=assets.filter(a=>a.t===t);
    if(b.dataset.hdall)edHide(as,!as.every(a=>a.hd));else edLock(as,!as.every(a=>a.lk));return}
  if(b.dataset.home){for(const m of ED_MACH)if(m.m().visible)edMachHome(m);edRingSel();edInspector();toast('The machines are back where they start.','',2200);return}
  if(ed.tool!=='select')edTool('select');
  // Select all picks the whole kind (or lets go of it, if it is all picked already)
  if(b.classList.contains('edlgs')){const hs=grp(b.dataset.g).map(q=>q.h).filter(h=>!h.a||!h.a.hd),all=hs.every(edIn),keys=new Set(hs.map(edKey));
    edSelSet(all?ed.sel.filter(s=>!keys.has(edKey(s))):[...ed.sel,...hs.filter(h=>!edIn(h))]);return}
  if(b.dataset.del){const t=b.dataset.del,snap=edAssetsSnap(),keep=assets.filter(a=>a.t!==t||a.lk);assets.length=0;assets.push(...keep);edAssetsChanged(snap);edSelSet(ed.sel.filter(s=>!s.a||s.a.t!==t));return}
  if(b.dataset.def){const t=b.dataset.def,snap=edAssetsSnap(),keep=assets.filter(a=>a.t!==t||a.lk);assets.length=0;assets.push(...keep,...defaultAssets().filter(a=>a.t===t));edAssetsChanged(snap);edSelSet([]);return}
  const h=b.dataset.k&&edRowHit(b.dataset.k);if(!h)return;if(h.a&&h.a.hd)edHide([h.a],false);
  if(b.classList.contains('edlck')){edSelSet(edIn(h)?ed.sel.filter(s=>edKey(s)!==edKey(h)):[...ed.sel,h]);return}
  const o=h.a||h.m.o();edSelSet([h]);edFlyTo(o.x,o.z);edPicked()};
// the roads, in the Roads drawer: tap one to pick it and go to it
function edRoadList(){const el=$('#edRoadList');$('#edRoadN').textContent=ROADS.length?`${ROADS.length}`:'';if($('#edDrawer').hidden||ed.pane!=='roads')return;
  el.innerHTML=ROADS.map((r,i)=>{let L=0;for(let k=0;k<r.pts.length-1;k++)L+=Math.hypot(r.pts[k+1][0]-r.pts[k][0],r.pts[k+1][1]-r.pts[k][1]);
    return `<div class="edlr"><button class="edlrn" data-r="${i}" aria-pressed="${r===ed.road}"><span>${r.pv?(r.sf?ST_SURF[r.sf].n+' street':'Street'):edGraded(r)?'Graded road':r.mid?'Road':'Track'} ${i+1}</span><small>${Math.round(edFt(r.w))} ft wide${r.pv&&r.sw?` · ${Math.round(edFt(r.sw))} ft sidewalks`:''} · ${edFmt(L,0)} ft long · ${r.pts.length} points</small></button></div>`}).join('')||'<p class="hint">No roads yet. New road, in the bottom bar, lays one.</p>';
  el.querySelectorAll('[data-r]').forEach(b=>b.onclick=()=>{const r=ROADS[+b.dataset.r];if(!r)return;if(ed.tool!=='roads')edTool('roads');ed.road=r;ed.rpt=-1;
    const q=r.pts[Math.floor(r.pts.length/2)];if(q)edFlyTo(q[0],q[1]);edRoadCard();edRoadsDraw();edPicked()})}

// ---------- the status line under the bottom bar: the spot under the pointer, the brush and the view, and a tip ----------
function edStatus(p){if(p){const g=baseHeight(p.x,p.z),sl=Math.hypot(baseHeight(p.x+0.5,p.z)-baseHeight(p.x-0.5,p.z),baseHeight(p.x,p.z+0.5)-baseHeight(p.x,p.z-0.5));
    $('#edStatPos').textContent=`${edShortSpot(p.x,p.z)} · ground ${g>=0?'+':'−'}${edFmt(Math.abs(g))} ft · slope ${Math.round(sl*100)}%`}
  const b=[];if(ED_BRUSH.includes(ed.tool)||ed.tool==='add'&&ed.place==='scatter')b.push(`brush ${Math.round(edFt(ed.size))} ft`);b.push(`${assets.length} things`);
  if(ed.sel.length)b.push(`${ed.sel.length} selected`);{const n=assets.filter(a=>a.hd).length;if(n)b.push(`${n} hidden`)}if(ed.grid)b.push(`snap ${ed.grid} ft`);$('#edStatInfo').textContent=b.join(' · ')}
// ---------- the view code: where the camera looks, as text the owner can copy and paste to Claude ----------
// "view X,Z,FACE,TILT,BACK": the spot looked at (world feet, x east, z south), the compass way the view faces (0 north,
// 90 east), how far it tilts down (degrees) and how far back the camera sits (feet). viewGo takes it back, in the
// editor or (game) pinned over the game for a headless shot; tools/play.js --view does that.
const VIEW_DIRS=['N','NE','E','SE','S','SW','W','NW'];
let viewPin=null;
const viewDeg=r=>((Math.round(r*180/Math.PI)%360)+360)%360;
// the view now: the editor's own, or the game camera's (the ground it points at)
function viewNow(){if(edOn)return {x:ed.x,z:ed.z,face:viewDeg(-ed.yaw),tilt:Math.round(ed.pitch*180/Math.PI),back:ed.dist};
  const d=camera.getWorldDirection(new THREE.Vector3()),p=camera.position;let t=1;
  while(t<900&&p.y+d.y*t>hAt(p.x+d.x*t,p.z+d.z*t))t*=1.03;
  return {x:p.x+d.x*t,z:p.z+d.z*t,face:viewDeg(Math.atan2(d.x,-d.z)),tilt:Math.round(Math.asin(-d.y)*180/Math.PI),back:t}}
function viewCode(v){v=v||viewNow();return `view ${Math.round(edFt(v.x))},${Math.round(edFt(v.z))},${v.face},${v.tilt},${Math.round(edFt(v.back))}`}
function viewText(v){v=v||viewNow();return `Looking at ${edShortSpot(v.x,v.z)} · facing ${VIEW_DIRS[Math.round(v.face/45)%8]} ${v.face}° · tilt ${v.tilt}° · ${Math.round(edFt(v.back))} ft back`}
function viewGo(code,game){const n=String(code).replace(/−/g,'-').match(/-?\d+(\.\d+)?/g);if(!n||n.length<5)return 'need 5 numbers: '+code;
  const [x,z,face,tilt,back]=n.map(Number),v={x:x*FT,z:z*FT,yaw:-face*Math.PI/180,pitch:clamp(tilt,1,89)*Math.PI/180,dist:clamp(back*FT,2,900)};
  if(game){if(edOn)editorClose();viewPin=v;return viewCode(viewNow())}
  viewPin=null;if(!edOn)editorOpen();Object.assign(ed,{x:v.x,z:v.z,yaw:v.yaw,pitch:v.pitch,dist:v.dist,fly:null});return viewCode()}
// main.js calls this after the game's own camera when a view is pinned
function viewPinApply(){const v=viewPin,fy=hAt(v.x,v.z);
  camera.position.set(v.x+Math.sin(v.yaw)*Math.cos(v.pitch)*v.dist,fy+Math.sin(v.pitch)*v.dist,v.z+Math.cos(v.yaw)*Math.cos(v.pitch)*v.dist);camera.lookAt(v.x,fy,v.z)}
$('#edViewCopy').onclick=()=>{const c=viewCode(),t=viewText();
  try{navigator.clipboard.writeText(c).then(()=>toast(say('edViewCopied',{code:c,where:t}),'good',5000),()=>toast(c,'',8000))}catch(e){toast(c,'',8000)}};
function edTipSet(){$('#edTip').textContent=say('edTip_'+ed.tool+(ed.tool==='add'&&ed.place!=='one'?'_'+ed.place:''));edStatus()}

// ---------- roads ----------
// Roads tool: tap a road to pick it, drag its points (dots) to move them, tap the picked road between points to add one,
// or lay a new road point by point. Its card sets the width, grass up the middle, grading (cut and filled to a height
// at each point, like the ramp; otherwise it follows the ground), the picked point's height, and deletes
const edRoadsSnap=()=>JSON.stringify(ROADS);
function edRoadsSet(json){ROADS.length=0;ROADS.push(...JSON.parse(json));roadsBuild();ST.dirty=1;ed.roadsEdited=true}
// the area a road (or the points i0..i1 of it) reaches, with its banks
function edRoadBox(r,i0,i1){let x0=1e9,x1=-1e9,z0=1e9,z1=-1e9;const m=r.w/2+3.2;
  for(let i=Math.max(0,i0===undefined?0:i0);i<=Math.min(r.pts.length-1,i1===undefined?1e9:i1);i++){const q=r.pts[i];x0=Math.min(x0,q[0]);x1=Math.max(x1,q[0]);z0=Math.min(z0,q[1]);z1=Math.max(z1,q[1])}
  return x0>x1?null:[x0-m,x1+m,z0-m,z1+m]}
const edUnion=(a,b)=>!a?b:!b?a:[Math.min(a[0],b[0]),Math.max(a[1],b[1]),Math.min(a[2],b[2]),Math.max(a[3],b[3])];
// a change to roads: rebuild the lookup, redraw, and bring the ground over the area up to date (now, or a few times a second while dragging)
function edRoadsChanged(rect,now){roadsBuild();ST.dirty=1;ed.roadsEdited=true;ed.changed=true;edRoadsDraw();
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
// roads go anywhere the road lookup grid reaches (terrain.js RG_*): Corley's, the other islands and the mainland's town
const edClampXZ=(x,z)=>[clamp(x,RG_X0+4,RG_X0+RG_NX*RG_C-4),clamp(z,RG_Z0+4,RG_Z0+RG_NZ*RG_C-4)];
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
// New street: paved 24 ft wide, curbs, 6 ft sidewalks and a centre line, all changeable on its card
function edRoadNew(street){edRoadFinish();ed.roadSnap=edRoadsSnap();const r=street?{w:24*FT,mid:0,pv:1,cb:1,sw:6*FT,cl:1,pts:[]}:{w:3.6,mid:1,pts:[]};ROADS.push(r);ed.road=r;ed.rpt=-1;ed.drawing=true;
  edRoadCard();toast(`Tap the ground to lay the ${street?'street':'road'}, point by point. Tap Finish when it is done.`,'',3600)}
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
function edRoadCard(){const ob=$('#edRoadNew'),sb=$('#edStreetNew'),fb=$('#edRoadFin');if(ob){ob.hidden=sb.hidden=ed.drawing;fb.hidden=!ed.drawing}
  edRoadList();if(ed.tool!=='roads')return;const r=ed.road;if(!r){edCard(null);return}
  let L=0,steep=0;for(let i=0;i<r.pts.length-1;i++){const a=r.pts[i],b=r.pts[i+1],l=Math.hypot(b[0]-a[0],b[1]-a[1]);L+=l;if(a.length>2&&b.length>2&&l>0.1)steep=Math.max(steep,Math.abs(b[2]-a[2])/l)}
  const g=edGraded(r),q=ed.rpt>=0?r.pts[ed.rpt]:null;
  edCard(`<h3>${ed.drawing?(r.pv?'New street':'New road'):r.pv?'Street ('+(r.sf?ST_SURF[r.sf].n.toLowerCase():'paved')+(r.cb?', curbs':'')+(r.sw?', sidewalks':'')+')':g?'Graded road (cut and filled to each point\u2019s height)':r.mid?'Road (follows the ground)':'Track (follows the ground)'}</h3><dl><dt>Length</dt><dd id="edRdLen">${edFmt(L,0)} ft · ${r.pts.length} points</dd>${g?`<dt>Steepest</dt><dd>${Math.round(steep*100)}%</dd>`:''}</dl>
    <div class="edopt"><label for="edRdW">Width</label><input id="edRdW" type="range" min="6" max="${r.pv?40:26}" step="1" value="${Math.round(edFt(r.w))}"><output id="edRdWV">${Math.round(edFt(r.w))} ft</output></div>
    <div class="row"><button id="edRdPv" class="sm" aria-pressed="${!!r.pv}">Paved</button>${r.pv?`<button id="edRdCb" class="sm" aria-pressed="${!!r.cb}">Curbs</button><button id="edRdCl" class="sm" aria-pressed="${!!r.cl}">Centre line</button>`:''}</div>
    ${r.pv?`<div class="row" id="edRdSf" role="group" aria-label="Surface">${ST_SURF.map((d,f)=>`<button class="sm" data-sf="${f}" aria-pressed="${(r.sf||0)===f}">${d?d.n:'Asphalt'}</button>`).join('')}</div>`:''}
    ${r.pv?`<div class="edopt"><label for="edRdSw">Sidewalks</label><input id="edRdSw" type="range" min="0" max="16" step="1" value="${Math.round(edFt(r.sw||0))}"><output id="edRdSwV">${r.sw?Math.round(edFt(r.sw))+' ft':'none'}</output></div>
    <div class="edline" id="edRdLine"><b>Line the street</b><div class="row"><select id="edRdLk" aria-label="What to line it with">${ED_LINE_KINDS.map(([k,n])=>`<option value="${k}"${k===ed.lineK?' selected':''}>${n}</option>`).join('')}</select>
      <select id="edRdLs" aria-label="Which sides">${[['both','Both sides'],['stagger','Staggered'],['left','Left side'],['right','Right side']].map(([k,n])=>`<option value="${k}"${k===ed.lineS?' selected':''}>${n}</option>`).join('')}</select></div>
      <div class="edopt"><label for="edRdLg">Every</label><input id="edRdLg" type="range" min="10" max="200" step="5" value="${ed.lineG}"><output id="edRdLgV">${ed.lineG} ft</output></div>
      <div class="row"><button id="edRdLn" class="sm go">Place along the street</button></div></div>`:''}
    <div class="row">${r.pv?'':`<button id="edRdMid" class="sm" aria-pressed="${!!r.mid}">Grass up the middle</button>`}<button id="edRdGrade" class="sm" aria-pressed="${g}">Graded</button></div>
    ${g&&q?`<div class="edopt"><label for="edRdH">Point height</label><input id="edRdH" type="range" min="-80" max="40" step="0.5" value="${edFt(q[2]).toFixed(1)}"><output id="edRdHV">${edFt(q[2]).toFixed(1)} ft</output></div>`:''}
    <div class="row">${q&&r.pts.length>2?'<button id="edRdDelPt" class="sm danger">Delete point</button>':''}<button id="edRdDel" class="sm danger">Delete road</button></div>`);
  const box=()=>edRoadBox(r);
  const w=$('#edRdW');w.oninput=()=>{if(!ed.roadSnap)ed.roadSnap=edRoadsSnap();const b0=box();r.w=+w.value*FT;$('#edRdWV').textContent=w.value+' ft';roadsBuild();ed.roadsEdited=true;edRoadsDraw();ed.wBox=edUnion(ed.wBox,edUnion(b0,box()))};
  w.onchange=()=>{edRoadsChanged(ed.wBox,true);edRoadCommit(ed.wBox);ed.wBox=null};
  const md=$('#edRdMid');if(md)md.onclick=()=>{ed.roadSnap=edRoadsSnap();r.mid=r.mid?0:1;edRoadsChanged(box(),true);edRoadCommit(box());edRoadCard()};
  // paving: a dirt road becomes a street (asphalt, curbs, 6 ft sidewalks, a centre line) and back; streets.js draws it
  const flip=(k,on)=>{ed.roadSnap=edRoadsSnap();const b0=box();if(on)r[k]=1;else delete r[k];
    if(k==='pv'){if(on){r.mid=0;r.cb=1;r.cl=1;r.sw=6*FT;if(r.w<20*FT)r.w=24*FT}else{delete r.cb;delete r.cl;delete r.sw;delete r.sf;r.w=Math.min(r.w,8)}}
    const bb=edUnion(b0,box());edRoadsChanged(bb,true);edRoadCommit(bb);edRoadCard()};
  $('#edRdPv').onclick=()=>flip('pv',!r.pv);
  if(r.pv){$('#edRdCb').onclick=()=>flip('cb',!r.cb);$('#edRdCl').onclick=()=>flip('cl',!r.cl);
    // the surface: asphalt, or brick or cobblestone with real relief (ST_SURF, streets.js)
    document.querySelectorAll('#edRdSf [data-sf]').forEach(b=>b.onclick=()=>{const f=+b.dataset.sf;if((r.sf||0)===f)return;ed.roadSnap=edRoadsSnap();if(f)r.sf=f;else delete r.sf;
      edRoadsChanged(box(),true);edRoadCommit(box());edRoadCard()});
    const sw=$('#edRdSw');sw.oninput=()=>{$('#edRdSwV').textContent=+sw.value?sw.value+' ft':'none'};
    sw.onchange=()=>{ed.roadSnap=edRoadsSnap();const b0=box();if(+sw.value)r.sw=+sw.value*FT;else delete r.sw;const bb=edUnion(b0,box());edRoadsChanged(bb,true);edRoadCommit(bb);edRoadCard()};
    $('#edRdLk').onchange=e=>{ed.lineK=e.target.value};$('#edRdLs').onchange=e=>{ed.lineS=e.target.value};
    const lg=$('#edRdLg');lg.oninput=()=>{ed.lineG=+lg.value;$('#edRdLgV').textContent=lg.value+' ft'};
    $('#edRdLn').onclick=()=>edLineStreet(r)}
  // grading takes each point's height from the ground there now; ungrading lets the road follow the ground again
  $('#edRdGrade').onclick=()=>{ed.roadSnap=edRoadsSnap();if(g)r.pts.forEach(p=>p.length=2);else r.pts.forEach(p=>{p[2]=baseHeight(p[0],p[1])});edRoadsChanged(box(),true);edRoadCommit(box());edRoadCard()};
  const h=$('#edRdH');if(h){h.oninput=()=>{if(!ed.roadSnap)ed.roadSnap=edRoadsSnap();q[2]=+h.value*FT;$('#edRdHV').textContent=(+h.value).toFixed(1)+' ft';edRoadsChanged(edRoadBox(r,ed.rpt-1,ed.rpt+1),false)};
    h.onchange=()=>{edRefresh(ed.pend,true);ed.pend=null;edRoadCommit(edRoadBox(r,ed.rpt-1,ed.rpt+1));edRoadCard()}}
  const dp=$('#edRdDelPt');if(dp)dp.onclick=()=>edRoadDelete(false);
  $('#edRdDel').onclick=()=>edRoadDelete(true)}
// Line the street: a row of street lights, lamp posts, trees, benches or hydrants along a paved street, set back by the
// curb (lights and hydrants) or in the sidewalk's outer half (trees, benches), facing the street. They are ordinary
// placed things: picked once placed, to move, turn, size, colour or delete like any other; one undo step
const ED_LINE_KINDS=[['streetlt','Street lights'],['lamppost','Lamp posts'],['leafy','Street trees'],['bench','Benches'],['hydrant','Fire hydrants'],['bollard','Path lights'],['planter','Flower planters']];
function edLineStreet(r){const k=ed.lineK,sw=r.sw||0,c=r.w/2+(r.cb?ST.curb:0),near=k==='streetlt'||k==='lamppost'||k==='hydrant'||k==='bollard',
    off=sw?(near?c+Math.min(0.5,sw/2):c+sw*(k==='bench'?0.7:0.6)):c+(k==='leafy'?2.2:0.7),spots=stAlong(r,ed.lineG*FT,ed.lineS,off);
  const have=assets.filter(a=>a.t===k).length,room=Math.max(0,edCap(k)-have);if(!spots.length){toast('The street is too short for that spacing.','',2400);return}
  if(!room){toast(`That is as many ${ED_LINE_KINDS.find(q=>q[0]===k)[1].toLowerCase()} as the map holds (${edCap(k)}).`,'',2800);return}
  const b=edAssetsSnap(),add=spots.slice(0,room).map(p=>{const a=edNewThing(k,p.x,p.z,p.yaw);if(k==='leafy')a.yaw=edRand().y;return a});
  assets.push(...add);edAssetsChanged(b);edSelSet(add.map(a=>({a})));
  toast(`${add.length} placed${add.length<spots.length?` (the map holds ${edCap(k)})`:''}. They are picked: move, turn or delete them like any thing.`,'',3200)}
$('#edRoadNew').onclick=()=>edRoadNew(false);$('#edStreetNew').onclick=()=>edRoadNew(true);$('#edRoadFin').onclick=edRoadFinish;

// ---------- Measure (Inspect): tap points on the ground for the length of the path and, with three or more, the area
// inside it; drag a point to move it, tap the first point (or Close) to close the shape. Snap puts points on the grid ----------
const edMeasDots=edDots(0x7fe3ff,17,64),edMeasLine=(function(){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(8000*3),3));g.setDrawRange(0,0);
  const l=new THREE.Line(g,new THREE.LineBasicMaterial({color:0x7fe3ff,depthTest:false,transparent:true,fog:false,toneMapped:false}));l.renderOrder=21;l.frustumCulled=false;l.visible=false;scene.add(l);return l})();
function edMeasPtAt(cx,cy){const rc=canvas.getBoundingClientRect();let best=-1,bd=24*24;
  ed.meas.forEach((q,i)=>{edV.set(q[0],hAt(q[0],q[1])+0.3,q[1]).project(camera);if(edV.z>1)return;const d=((edV.x+1)/2*rc.width+rc.left-cx)**2+((1-edV.y)/2*rc.height+rc.top-cy)**2;if(d<bd){bd=d;best=i}});return best}
function edMeasDown(p,cx,cy){const i=edMeasPtAt(cx,cy);
  if(i===0&&ed.meas.length>2&&!ed.measClosed){ed.measClosed=true;edMeasDraw();return}
  if(i>=0){ed.drag={meas:i};return}
  if(ed.meas.length>=64)return;ed.meas.push(edSnapXZ(p.x,p.z));ed.drag={meas:ed.meas.length-1};edMeasDraw()}
function edMeasClear(){ed.meas=[];ed.measClosed=false;edMeasDraw()}
const edArea=P=>{let a=0;for(let i=0;i<P.length;i++){const p=P[i],q=P[(i+1)%P.length];a+=p[0]*q[1]-q[0]*p[1]}return Math.abs(a)/2};
// the line over the ground (to the pointer too, while it moves, when cur is given) and the card with the numbers
function edMeasDraw(cur){const on=edOn&&ed.tool==='measure',P=on?ed.meas:[],L=P.slice();if(on&&cur&&!ed.measClosed&&P.length)L.push([cur.x,cur.z]);if(ed.measClosed)L.push(P[0]);
  edDotsSet(edMeasDots,P);const a=edMeasLine.geometry.attributes.position;let n=0;
  for(let i=0;i<L.length-1;i++){const p=L[i],q=L[i+1],k=Math.max(1,Math.ceil(Math.hypot(q[0]-p[0],q[1]-p[1])));
    for(let j=(i?1:0);j<=k&&n<a.count;j++){const x=p[0]+(q[0]-p[0])*j/k,z=p[1]+(q[1]-p[1])*j/k;a.array[n*3]=x;a.array[n*3+1]=hAt(x,z)+0.25;a.array[n*3+2]=z;n++}}
  a.needsUpdate=true;edMeasLine.geometry.setDrawRange(0,n);edMeasLine.visible=n>1;if(!on)return;
  let len=0,grd=0;for(let i=0;i<L.length-1;i++){const p=L[i],q=L[i+1],k=Math.max(1,Math.ceil(Math.hypot(q[0]-p[0],q[1]-p[1])));len+=Math.hypot(q[0]-p[0],q[1]-p[1]);
    for(let j=0;j<k;j++){const x0=p[0]+(q[0]-p[0])*j/k,z0=p[1]+(q[1]-p[1])*j/k,x1=p[0]+(q[0]-p[0])*(j+1)/k,z1=p[1]+(q[1]-p[1])*(j+1)/k;grd+=Math.hypot(x1-x0,z1-z0,hAt(x1,z1)-hAt(x0,z0))}}
  if(cur&&P.length&&!ed.measClosed){$('#edStatInfo').textContent=`${edFmt(len,1)} ft to here`;return}
  if(!P.length){edCard(`<h3>Measure</h3><p class="hint">${say('edTip_measure')}</p>`);return}
  const f=a=>Math.round(a/(FT*FT)),last=P[P.length-1],dh=hAt(last[0],last[1])-hAt(P[0][0],P[0][1]),fl=Math.hypot(last[0]-P[0][0],last[1]-P[0][1]),rows=[['Points',`${P.length}`],
    [ed.measClosed?'Around':'Length',`${edFmt(len)} ft${Math.abs(grd-len)>0.05*FT?` · ${edFmt(grd)} ft over the ground`:''}`]];
  if(!ed.measClosed&&P.length>1)rows.push(['Start to end',`${edFmt(fl)} ft straight, ${dh>=0?'up':'down'} ${edFmt(Math.abs(dh))} ft${fl>0.3?` (${Math.round(Math.abs(dh)/fl*100)}%)`:''}`]);
  if(P.length>2){const ar=f(edArea(P));rows.push(['Area',`${ar.toLocaleString()} sq ft${ar>4356?` · ${(ar/43560).toFixed(2)} acres`:''}${ed.measClosed?'':' (if closed)'}`])}
  edCard(`<h3>Measure</h3><dl>${rows.map(([x,y])=>`<dt>${x}</dt><dd>${y}</dd>`).join('')}</dl><div class="row">${P.length>2?`<button id="edMsClose" class="sm" aria-pressed="${ed.measClosed}">Close the shape</button>`:''}<button id="edMsBack" class="sm">Take away the last point</button><button id="edMsClear" class="sm danger">Clear</button></div>`);
  const c=$('#edMsClose');if(c)c.onclick=()=>{ed.measClosed=!ed.measClosed;edMeasDraw()};
  $('#edMsBack').onclick=()=>{ed.meas.pop();if(ed.meas.length<3)ed.measClosed=false;edMeasDraw()};$('#edMsClear').onclick=edMeasClear}

// ---------- exact edits: snap, the turn and size ring, nudging, line up, Row, copy and paste ----------
// Snap (top bar) cycles off, 1, 2, 5 and 10 ft: moves and new things land on the grid, turns go in 15° steps, a fence or
// gate meets another's end, and a placed thing near a road's edge stands at the edge facing the road
const ED_GRIDS=[0,1,2,5,10];
const edSnapXZ=(x,z)=>{const g=ed.grid*FT;return g?[Math.round(x/g)*g,ED_ZM+Math.round((z-ED_ZM)/g)*g]:[x,z]};
const edSnapA=y=>ed.grid?Math.round(y/(Math.PI/12))*(Math.PI/12):y;
function edGridSync(){const b=$('#edGrid');b.lastChild.textContent=ed.grid?`Snap ${ed.grid} ft`:'Snap off';b.setAttribute('aria-pressed',ed.grid>0)}
$('#edGrid').onclick=()=>{ed.grid=ED_GRIDS[(ED_GRIDS.indexOf(ed.grid)+1)%ED_GRIDS.length];edGridSync();edInspector();edStatus()};
// a fence or gate end within 2 ft of another's goes to it; anything else from the catalogue within 3 ft of standing at a
// road's edge goes there and turns its front to the road (true if it moved)
function edSnapThing(a){const P=PROPS[a.t];if(!ed.grid||!P)return false;
  if(P.run){const ends=o=>{const h=PROPS[o.t].w/2*o.s,c=Math.cos(o.yaw)*h,n=-Math.sin(o.yaw)*h;return [[o.x+c,o.z+n],[o.x-c,o.z-n]]};
    let best=null,bd=0.6;const me=ends(a);
    for(const b of assets){if(b===a||!PROPS[b.t]||!PROPS[b.t].run||Math.abs(b.x-a.x)>8||Math.abs(b.z-a.z)>8)continue;
      for(const f of ends(b))for(const e of me){const d=Math.hypot(f[0]-e[0],f[1]-e[1]);if(d<bd){bd=d;best=[f[0]-e[0],f[1]-e[1]]}}}
    if(best){a.x+=best[0];a.z+=best[1];return true}}
  let best=null,bd=0.9;
  for(const r of ROADS)for(let i=0;i<r.pts.length-1;i++){const p=r.pts[i],q=r.pts[i+1],[d,t]=edSegD(a.x,a.z,p,q),D=r.w/2+P.d/2*a.s+0.3;
    if(Math.abs(d-D)<bd&&d>0.01){bd=Math.abs(d-D);const cx=p[0]+(q[0]-p[0])*t,cz=p[1]+(q[1]-p[1])*t;best={cx,cz,nx:(a.x-cx)/d,nz:(a.z-cz)/d,D}}}
  if(best){a.x=best.cx+best.nx*best.D;a.z=best.cz+best.nz*best.D;a.yaw=Math.atan2(-best.nx,-best.nz);return true}
  return false}
// a turn or size of the picked things, from where each was when it began (the sliders and the ring share it)
function edXfBegin(as){if(ed.xf)return ed.xf;const q=as.map(a=>({a,x:a.x,z:a.z,yaw:a.yaw,s:a.s}));let cx=0,cz=0;
  for(const o of q){cx+=o.x/q.length;cz+=o.z/q.length}return ed.xf={snap:edAssetsSnap(),q,cx,cz}}
function edXfTurn(d,grp){const b=ed.xf,c=Math.cos(d),n=Math.sin(d);
  for(const q of b.q){q.a.yaw=q.yaw+d;if(grp){const ox=q.x-b.cx,oz=q.z-b.cz;q.a.x=clamp(b.cx+ox*c+oz*n,-555,MAIN_ZMAX);q.a.z=clamp(b.cz-ox*n+oz*c,-555,MAIN_ZMAX)}}
  assetsBuild();shpTreesRefresh();edRingSel()}
function edXfSize(f,grp){const b=ed.xf;
  for(const q of b.q){q.a.s=clamp(q.s*f,0.3,3);if(grp){q.a.x=clamp(b.cx+(q.x-b.cx)*f,-555,MAIN_ZMAX);q.a.z=clamp(b.cz+(q.z-b.cz)*f,-555,MAIN_ZMAX)}}
  assetsBuild();shpTreesRefresh();edRingSel()}
function edXfEnd(){const b=ed.xf;ed.xf=null;if(b)edAssetsChanged(b.snap)}
// the ring round the picked things (with Select): drag its knob, which sits on the side nearest the view, to turn them,
// or its edge to size them, both about their middle
const edHRing=edRing(0xffd23f),edHKnob=edDots(0xffd23f,24,1);edHRing.material.opacity=0.75;
function edHandleGeo(){const as=edSelA();if(!edOn||ed.tool!=='select'||!as.length)return null;let cx=0,cz=0,R=0;
  for(const a of as){cx+=a.x/as.length;cz+=a.z/as.length}for(const a of as)R=Math.max(R,Math.hypot(a.x-cx,a.z-cz)+edRad(a));
  return {as,cx,cz,R:R+1.2}}
function edHandles(){const g=edHandleGeo();if(!g){edHRing.visible=edHKnob.visible=false;ed.knob=null;return}ed.hYaw=ed.yaw;
  const d=ed.drag&&ed.drag.ring==='turn'?ed.drag.ang:ed.yaw;edRingAt(edHRing,g.cx,g.cz,g.R);ed.knob=[g.cx+Math.sin(d)*g.R,g.cz+Math.cos(d)*g.R];edDotsSet(edHKnob,[ed.knob])}
function edHandleDown(sx,sy,p){const g=edHandleGeo();if(!g||!ed.knob)return false;const rc=canvas.getBoundingClientRect();
  edV.set(ed.knob[0],hAt(ed.knob[0],ed.knob[1])+0.3,ed.knob[1]).project(camera);
  if(edV.z<1&&Math.hypot((edV.x+1)/2*rc.width+rc.left-sx,(1-edV.y)/2*rc.height+rc.top-sy)<24){const a=Math.atan2(p.x-g.cx,p.z-g.cz);
    edXfBegin(g.as);ed.drag={ring:'turn',a0:a,ang:a};return true}
  const d=Math.hypot(p.x-g.cx,p.z-g.cz);if(Math.abs(d-g.R)<Math.max(0.35,ed.dist*0.012)){edXfBegin(g.as);ed.drag={ring:'size',d0:Math.max(0.3,d)};return true}
  return false}
function edHandleMove(d,p){const b=ed.xf;if(!b)return;
  if(d.ring==='turn'){d.ang=Math.atan2(p.x-b.cx,p.z-b.cz);let t=d.ang-d.a0;
    if(ed.grid){const y0=b.q.length===1?b.q[0].yaw:0;t=edSnapA(y0+t)-y0}edXfTurn(t,true)}
  else edXfSize(Math.hypot(p.x-b.cx,p.z-b.cz)/d.d0,true);
  const n=b.q[0].a;$('#edStatInfo').textContent=d.ring==='turn'?`turn ${Math.round((((n.yaw-(b.q.length===1?0:b.q[0].yaw))*57.3)%360+540)%360-180)}°`:`size ${Math.round(n.s*100/(b.q.length===1?1:b.q[0].s))}%`}
// the arrow keys nudge the picked things 1 ft (Shift 10 ft) along whichever of north, south, east and west is nearest
// that way on the screen; nudges close together are one undo step
function edNudge(c,ft){const r=c==='ArrowRight'?[1,0]:c==='ArrowLeft'?[-1,0]:c==='ArrowUp'?[0,1]:[0,-1],cy=Math.cos(ed.yaw),sy=Math.sin(ed.yaw);
  let vx=cy*r[0]-sy*r[1],vz=-sy*r[0]-cy*r[1];if(Math.abs(vx)>Math.abs(vz)){vx=Math.sign(vx);vz=0}else{vz=Math.sign(vz);vx=0}
  const dx=vx*ft*FT,dz=vz*ft*FT,as=edSelA(),now=performance.now();
  if(as.length){if(now-ed.nudgeT>700)edPush({a:edAssetsSnap()});for(const a of as){a.x=clamp(a.x+dx,-555,MAIN_ZMAX);a.z=clamp(a.z+dz,-555,MAIN_ZMAX)}
    assetsBuild();shpTreesRefresh();ed.changed=true;edQueueSave()}
  ed.nudgeT=now;for(const s of ed.sel)if(s.m){const o=s.m.o();edPlaceMachine(s.m,o.x+dx,o.z+dz)}
  edRingSel();edInspector()}
// Line up puts the picked things' middles on the line that runs best through them; Space evenly spreads them out evenly
// along it, from the first to the last; Face one way turns them all to the first one picked
function edAlign(how){const as=edSelA();if(as.length<2)return;const b=edAssetsSnap();
  if(how==='face')for(const a of as)a.yaw=as[0].yaw;
  else{let cx=0,cz=0,xx=0,zz=0,xz=0;for(const a of as){cx+=a.x/as.length;cz+=a.z/as.length}
    for(const a of as){const x=a.x-cx,z=a.z-cz;xx+=x*x;zz+=z*z;xz+=x*z}
    const th=0.5*Math.atan2(2*xz,xx-zz),ux=Math.cos(th),uz=Math.sin(th),t=a=>(a.x-cx)*ux+(a.z-cz)*uz;
    if(how==='line')for(const a of as){const k=t(a);a.x=cx+ux*k;a.z=cz+uz*k}
    else{const o=as.slice().sort((p,q)=>t(p)-t(q)),t0=t(o[0]),t1=t(o[o.length-1]);
      o.forEach((a,i)=>{const k=t0+(t1-t0)*i/(o.length-1)-t(a);a.x=clamp(a.x+ux*k,-555,MAIN_ZMAX);a.z=clamp(a.z+uz*k,-555,MAIN_ZMAX)})}}
  edAssetsChanged(b);edRingSel();edInspector()}
// how far a thing reaches from its middle along a direction
const edHalf=(a,ux,uz)=>{const P=PROPS[a.t];if(!P)return edRad(a);const c=Math.cos(a.yaw),n=Math.sin(a.yaw);
  return (Math.abs(ux*c-uz*n)*P.w+Math.abs(ux*n+uz*c)*P.d)/2*a.s};
// Row: Copies more of the picked things in a line, along the first one's width (fence runs) or across it, end to end
// or at a spacing (middle to middle), as one undo step; no kind goes past what the map holds of it
function edRowMake(){const as=edSelA();if(!as.length)return;const a0=as[0],al=ed.rowDir==='along',ux=al?Math.cos(a0.yaw):Math.sin(a0.yaw),uz=al?-Math.sin(a0.yaw):Math.cos(a0.yaw);
  let p0=1e9,p1=-1e9;for(const a of as){const p=a.x*ux+a.z*uz,h=edHalf(a,ux,uz);p0=Math.min(p0,p-h);p1=Math.max(p1,p+h)}
  const step=ed.rowGap?ed.rowGap*FT:p1-p0,k={};for(const a of as)k[a.t]=(k[a.t]||0)+1;
  let n=ed.rowN;for(const t in k)n=Math.min(n,Math.floor((edCap(t)-assets.filter(a=>a.t===t).length)/k[t]));
  if(n<ed.rowN)toast(n>0?`Only room for ${n} more on the map.`:'The map holds no more of these.','',2600);if(n<1)return;
  const b=edAssetsSnap(),out=[];for(let i=1;i<=n;i++)for(const a of as)out.push(Object.assign({},a,{x:clamp(a.x+ux*step*i,-555,MAIN_ZMAX),z:clamp(a.z+uz*step*i,-555,MAIN_ZMAX)}));
  assets.push(...out);ed.rowOpen=false;edAssetsChanged(b);edSelSet([...as,...out].map(a=>({a})))}
// Copy (Ctrl+C) and Cut (Ctrl+X) keep the picked things' shape; Paste (Ctrl+V) puts them down with their middle at the
// mouse pointer (on touch, the middle of the view), on the grid when Snap is on, and picks them
function edClipCopy(cut){const as=edSelA();if(!as.length)return;let cx=0,cz=0;for(const a of as){cx+=a.x/as.length;cz+=a.z/as.length}
  ed.clip=as.map(a=>Object.assign({},a,{x:a.x-cx,z:a.z-cz}));$('#edClipPaste').hidden=false;
  toast(`${cut?'Cut':'Copied'} ${as.length===1?edKindName(as[0].t).toLowerCase():as.length+' things'}. Paste with ${navigator.maxTouchPoints?'Paste':'Ctrl+V'}.`,'',2000);if(cut)edDelete()}
function edClipPaste(){const c=ed.clip;if(!c)return;const k={};for(const a of c)k[a.t]=(k[a.t]||0)+1;
  for(const t in k)if(assets.filter(a=>a.t===t).length+k[t]>edCap(t)){toast(`The map holds at most ${edCap(t)} of these (${edKindName(t)}).`,'',2600);return}
  const [x,z]=edSnapXZ(...(ed.curMouse&&ed.cur?[ed.cur.x,ed.cur.z]:[ed.x,ed.z])),b=edAssetsSnap(),out=c.map(a=>Object.assign({},a,{x:clamp(x+a.x,-555,MAIN_ZMAX),z:clamp(z+a.z,-555,MAIN_ZMAX)}));
  assets.push(...out);if(ed.tool!=='select')edTool('select');edAssetsChanged(b);edSelSet(out.map(a=>({a})))}
$('#edClipPaste').onclick=edClipPaste;

// ---------- pointer: tools, and look around with two fingers, the right mouse button or the Look tool ----------
const edPtrs=new Map();let edGest=null,edMouse=null;
function edPan(dx,dy){ed.fly=null;const s=ed.dist*0.0019*(720/Math.max(320,innerHeight)),c=Math.cos(ed.yaw),n=Math.sin(ed.yaw);
  ed.x=clamp(ed.x+(-c*dx-n*dy)*s,-430,430);ed.z=clamp(ed.z+(n*dx-c*dy)*s,-555,MAIN_ZMAX)}
function edDown(x,y,e){const p=edPick(x,y),t=ed.tool,mod=e&&(e.shiftKey||e.ctrlKey||e.metaKey),touch=e&&e.pointerType!=='mouse';
  if(ed.look||!p){edMouse={pan:true,x,y};return}
  if(ED_BRUSH.includes(t)){edStrokeStart(p.x,p.z);edBrushAt(p.x,p.z);return}
  if(t==='roads'){edRoadDown(p,x,y);return}
  if(t==='measure'){edMeasDown(p,x,y);return}
  if(t==='plant'){edPlantAt(p.x,p.z,e&&e.altKey);return}
  if(t==='query'){edQuery(p.x,p.z);edRingAt(edBrushRing,p.x,p.z,0.5);ed.drag={query:true};return}
  // things from the catalogue come in at full size, their front to the camera
  if(t==='add'&&ed.place==='scatter'){ed.scat={x:p.x,z:p.z,snap:edAssetsSnap(),erase:ed.erase||!!(e&&e.altKey),t:0};edBrushAt(p.x,p.z);return}
  if(t==='add'&&ed.place==='line'){const [x0,z0]=edSnapXZ(p.x,p.z);ed.drag={line:{x0,z0,x1:x0,z1:z0,items:[],rnd:[]},snap:edAssetsSnap()};edLineSet(ed.drag.line,p.x,p.z);return}
  if(t==='add'){if(assets.filter(a=>a.t===ed.kind).length>=edCap(ed.kind)){toast(`The map holds at most ${edCap(ed.kind)} of these (${edKindName(ed.kind)}).`,'',2600);return}
    const b=edAssetsSnap(),a=edNewThing(ed.kind,...edSnapXZ(p.x,p.z),null);edSnapThing(a);
    assets.push(a);assetsBuild();shpTreesRefresh();ed.drag={items:[{a,dx:0,dz:0}],snap:b,added:true};edSelSet([{a}]);ed.changed=true;return}
  // Select: a tap picks one; Shift (or Ctrl) and a tap, or a long press, adds it or takes it away; a drag on empty ground
  // draws a box round several (with a mouse, or with Box select on); dragging a picked one moves them all
  if(t==='select'){if(!mod&&edHandleDown(x,y,p))return;const hit=edHit(p.x,p.z);
    if(!hit){if(!touch||ed.boxMode){ed.box={x0:x,y0:y,x1:x,y1:y,add:mod};edBoxDraw()}else{edSelSet([]);edMouse={pan:true,x,y}}return}
    if(mod){edSelSet(edIn(hit)?ed.sel.filter(s=>edKey(s)!==edKey(hit)):[...ed.sel,hit]);return}
    const prev=ed.sel,was=edIn(hit);if(!was)edSelSet([hit]);if(touch)ed.lp={t:performance.now(),x,y,prev,hit,was};
    ed.drag={items:ed.sel.filter(s=>!(s.a&&s.a.lk)).map(s=>{const o=s.a||s.m.o();return {a:s.a,m:s.m,dx:o.x-p.x,dz:o.z-p.z}}),snap:ed.sel.some(s=>s.a)?edAssetsSnap():null,moved:false}}}
function edMove(x,y){
  if(edMouse){if(edMouse.pan)edPan(x-edMouse.x,y-edMouse.y);else{ed.yaw-=(x-edMouse.x)*0.006;ed.pitch=clamp(ed.pitch+(y-edMouse.y)*0.005,0.25,1.45)}edMouse.x=x;edMouse.y=y;return}
  if(ed.lp&&Math.hypot(x-ed.lp.x,y-ed.lp.y)>8)ed.lp=null;
  if(ed.box){ed.box.x1=x;ed.box.y1=y;edBoxDraw();return}
  const p=edPick(x,y);if(!p)return;ed.cur=p;
  const now=performance.now();if(now-ed.statT>80){ed.statT=now;edStatus(p)}
  if(ed.stroke){ed.bx=p.x;ed.bz=p.z;edBrushAt(p.x,p.z);return}
  if(ed.scat){ed.scat.x=p.x;ed.scat.z=p.z;edBrushAt(p.x,p.z);return}
  if(ed.drag&&ed.drag.line){edLineSet(ed.drag.line,p.x,p.z);return}
  const d=ed.drag;
  if(d&&d.meas!==undefined){[ed.meas[d.meas][0],ed.meas[d.meas][1]]=edSnapXZ(p.x,p.z);edMeasDraw();return}
  if(ed.tool==='measure'&&ed.meas.length&&!d){edMeasDraw(p);return}
  if(d&&d.query){edQuery(p.x,p.z);edRingAt(edBrushRing,p.x,p.z,0.5);return}
  if(d&&d.road){edRoadDrag(d,p);return}
  if(d&&d.ring){edHandleMove(d,p);return}
  // with Snap on, the first one picked lands on the grid and the rest keep their places round it; one thing on its own
  // can also meet a fence end or a road edge
  if(d&&d.items){let any=false,px=p.x,pz=p.z;const q0=d.items[0];
    if(ed.grid){const [sx,sz]=edSnapXZ(px+q0.dx,pz+q0.dz);px=sx-q0.dx;pz=sz-q0.dz}
    for(const q of d.items){if(q.a){if(q.yaw0===undefined)q.yaw0=q.a.yaw;q.a.x=clamp(px+q.dx,-555,MAIN_ZMAX);q.a.z=clamp(pz+q.dz,-555,MAIN_ZMAX);any=true}else edPlaceMachine(q.m,px+q.dx,pz+q.dz)}
    if(d.items.length===1&&q0.a){q0.a.yaw=q0.yaw0;edSnapThing(q0.a)}
    d.moved=true;if(any){assetsBuild();shpTreesRefresh()}edRingSel();return}
  if(ED_BRUSH.includes(ed.tool)||ed.tool==='add'&&ed.place==='scatter'){edBrushAt(p.x,p.z)}}
function edUp(){edMouse=null;ed.lp=null;edStrokeEnd();edScatterEnd();if(ed.box){edBoxEnd();return}const d=ed.drag;ed.drag=null;
  if(d&&d.road){edRoadUp(d);return}
  if(d&&d.ring){edXfEnd();edRingSel();edInspector();return}
  // a laid line is one undo step, and picked when done
  if(d&&d.line){if(d.line.items.length){edPush({a:d.snap});ed.changed=true;edQueueSave();edSelSet(d.line.items.map(a=>({a})))}return}
  if(d&&d.items&&(d.moved||d.added)){if(d.snap){edPush({a:d.snap});ed.changed=true;edQueueSave()}edInspector();edListDraw();if(d.added&&ed.place==='one')edTool('select')}}
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
    ed.dist=clamp(edGest.dist*edGest.d/d,8,900);ed.yaw=edGest.yaw+(ang-edGest.ang);edPan(mx-edGest.mx,my-edGest.my);edGest.mx=mx;edGest.my=my;return}
  ed.curMouse=e.pointerType==='mouse';if(p||ed.curMouse)edMove(e.clientX,e.clientY)});
const edEnd=e=>{if(!edOn)return;if(!edPtrs.delete(e.pointerId))return;if(edGest){if(edPtrs.size<2)edGest=null;return}edUp()};
canvas.addEventListener('pointerup',edEnd);canvas.addEventListener('pointercancel',edEnd);
canvas.addEventListener('pointerleave',e=>{if(edOn&&e.pointerType==='mouse'&&!edPtrs.size)edBrushRing.visible=edSoftRing.visible=false});
canvas.addEventListener('contextmenu',e=>{if(edOn)e.preventDefault()});
canvas.addEventListener('wheel',e=>{if(!edOn)return;e.preventDefault();ed.dist=clamp(ed.dist*Math.exp(e.deltaY*0.0012),8,900)},{passive:false});

// ---------- keys (fixed, not in the Keys panel): G opens and closes unless a game action has G; WASD or arrows pan, Q E turn, R F zoom,
// 1 to 5 the groups and 6 the Map drawer, Delete removes, Esc lets go of the selection, Ctrl+Z undo, Ctrl+A picks everything in view, Ctrl+D duplicates,
// Ctrl+C, X and V copy, cut and paste, and with something picked the arrows nudge it (Shift for 10 ft) ----------
addEventListener('keydown',e=>{const tg=e.target&&e.target.tagName;if(tg==='TEXTAREA'||tg==='INPUT')return;
  if(!edOn){if(e.code==='KeyG'&&!e.repeat&&!e.ctrlKey&&!e.metaKey&&!keyActs('KeyG').length&&keysBox.hidden)editorOpen();return}
  const c=e.code,mod=e.ctrlKey||e.metaKey;
  if(mod&&c==='KeyZ'){e.preventDefault();e.shiftKey?edRedo():edUndo();return}
  if(mod&&c==='KeyY'){e.preventDefault();edRedo();return}
  if(mod&&c==='KeyA'){e.preventDefault();edSelectView();return}
  if(mod&&c==='KeyD'){e.preventDefault();edCopy();return}
  if(mod&&(c==='KeyC'||c==='KeyX')){if(edSelA().length){e.preventDefault();edClipCopy(c==='KeyX')}return}
  if(mod&&c==='KeyV'){if(ed.clip){e.preventDefault();edClipPaste()}return}
  if(c.startsWith('Arrow')&&ed.sel.length&&ed.tool!=='roads'&&!ed.drag){e.preventDefault();edNudge(c,e.shiftKey?10:1);return}
  if(e.repeat)return;
  if(c==='Escape'&&ed.box){ed.box=null;$('#edBox').hidden=true}
  else if(c==='Escape'&&ed.tool==='measure'&&ed.meas.length)edMeasClear();
  else if((c==='Delete'||c==='Backspace')&&ed.tool==='measure'){ed.meas.pop();if(ed.meas.length<3)ed.measClosed=false;edMeasDraw()}
  else if(c==='Enter'&&ed.tool==='measure'&&ed.meas.length>2){ed.measClosed=!ed.measClosed;edMeasDraw()}
  else if(c==='Escape'&&ed.sel.length)edSelSet([]);
  else if(c==='KeyG'||c==='Escape')editorClose();
  else if(c==='Delete'||c==='Backspace'){if(ed.tool==='roads')edRoadDelete(ed.rpt<0);else edDelete()}
  else if(c==='Enter'&&ed.drawing)edRoadFinish();
  else if(c==='KeyH'&&edSelL().length)edHide(edSelL(),true);
  else if(c==='KeyL'&&edSelL().length)edLock(edSelL(),!edSelL().every(a=>a.lk));
  else{const i=['Digit1','Digit2','Digit3','Digit4','Digit5','Digit6'].indexOf(c);if(i===5)edMapPane();else if(i>=0)edGroup(Object.keys(ED_GROUPS)[i])}});

// ---------- saving, copying and loading ----------
function edQueueSave(){clearTimeout(ed.saveT);ed.pend=true;ed.saveT=setTimeout(edSave,800)}
// not while a synced save is being put in (it reloads the page), or the old map would be written back over it
function edSave(){clearTimeout(ed.saveT);ed.pend=false;if(window.syncHold)return;mapAssets=assets;if(ed.roadsEdited)mapRoads=ROADS;try{localStorage.setItem('bhd_map',mapEncode())}catch(e){toast('Could not save the map on this device (storage is full or blocked).','bad',4000)}}
$('#edCopy').onclick=()=>{edSave();const t=mapEncode(),box=$('#edCopyBox');
  const show=()=>{box.value=t;box.hidden=false;box.focus();box.select();toast('Select all of the text and copy it.','',3000)};
  try{navigator.clipboard.writeText(t).then(()=>toast(`Map copied (${Math.round(t.length/1024)} KB of text). Paste it anywhere to keep it.`,'good',3500),show)}catch(e){show()}};
$('#edPasteBtn').onclick=()=>{$('#edPasteBox').hidden=false;$('#edCopyBox').hidden=true;$('#edPaste').focus()};
$('#edLoad').onclick=()=>{const t=$('#edPaste').value.trim();
  try{mapDecode(t)}catch(e){toast('That is not a Corley\'s Island map. Copy one with Copy map first.','bad',3500);return}
  try{localStorage.setItem('bhd_map',t)}catch(e){toast('Could not save the map on this device.','bad');return}
  location.reload()};
// ---------- maps: several named maps on this device (bhd_maps, name → map text), the open one in bhd_map as always,
// its name in bhd_mapname; opening another stores this one first, then reloads, as Load does ----------
const edMaps=()=>{try{const m=JSON.parse(localStorage.getItem('bhd_maps')||'{}');return m&&typeof m==='object'?m:{}}catch(e){return {}}};
const edMapName=()=>{try{return localStorage.getItem('bhd_mapname')||'My island'}catch(e){return 'My island'}};
const edEsc=t=>String(t).replace(/[&<>"]/g,c=>'&#'+c.charCodeAt(0)+';');
function edMapsPut(m){try{localStorage.setItem('bhd_maps',JSON.stringify(m));return true}catch(e){toast('Not enough room on this device for another map. Delete one or download it as a file.','bad',4000);return false}}
function edFreeName(base){const m=edMaps(),cur=edMapName();let n=base,k=2;while(m[n]!==undefined||n===cur)n=`${base} ${k++}`;return n}
// leaves this map in the list and opens another: its text (or the starting island, for null) under its name
function edMapOpen(name,text){edSave();const m=edMaps(),cur=edMapName();m[cur]=localStorage.getItem('bhd_map')||'';delete m[name];if(!edMapsPut(m))return;
  try{if(text)localStorage.setItem('bhd_map',text);else localStorage.removeItem('bhd_map');localStorage.setItem('bhd_mapname',name)}catch(e){toast('Could not save the map on this device.','bad');return}
  location.reload()}
function edMapsDraw(){const m=edMaps(),cur=edMapName(),names=Object.keys(m).filter(n=>n!==cur).sort();
  $('#edMapNm').textContent=cur;const ni=$('#edMapNameIn');if(document.activeElement!==ni)ni.value=cur;$('#edMapsN').textContent=names.length+1;
  $('#edMapList').innerHTML=names.map(n=>`<div class="edlr"><button class="edlrn" data-open="${edEsc(n)}"><span>${edEsc(n)}</span><small>${Math.max(1,Math.round(m[n].length/1024))} KB · tap to open</small></button><button class="sm danger" data-del="${edEsc(n)}">Delete</button></div>`).join('')||'<p class="hint">No other maps yet.</p>'}
$('#edMapList').onclick=e=>{const b=e.target.closest('button');if(!b)return;
  if(b.dataset.open!==undefined){const n=b.dataset.open,m=edMaps();if(m[n]!==undefined)edMapOpen(n,m[n]);return}
  if(b.dataset.del!==undefined){if(b.dataset.arm){const m=edMaps();delete m[b.dataset.del];edMapsPut(m);edMapsDraw();return}
    b.dataset.arm=1;b.textContent='Tap again';setTimeout(()=>{if(b.isConnected){delete b.dataset.arm;b.textContent='Delete'}},2500)}};
$('#edMapNameIn').onchange=()=>{const v=$('#edMapNameIn').value.trim().slice(0,40),m=edMaps();
  if(!v||v===edMapName()){edMapsDraw();return}if(m[v]!==undefined){toast('There is already a map with that name.','bad',2600);edMapsDraw();return}
  try{localStorage.setItem('bhd_mapname',v)}catch(e){}edMapsDraw()};
$('#edMapNew').onclick=()=>edMapOpen(edFreeName('New map'),null);
$('#edMapDup').onclick=()=>{edSave();edMapOpen(edFreeName(edMapName()+' copy'),localStorage.getItem('bhd_map'))};
// a map as a file to keep, and a file opened as a new map, named after the file
$('#edDownload').onclick=()=>{edSave();const u=URL.createObjectURL(new Blob([mapEncode()],{type:'application/json'})),a=document.createElement('a');
  a.href=u;a.download=edMapName().replace(/[^\w\- ]+/g,'').trim().replace(/ +/g,'-')+'.island.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),2000)};
$('#edOpenFile').onclick=()=>$('#edFileIn').click();
$('#edFileIn').onchange=()=>{const f=$('#edFileIn').files[0];$('#edFileIn').value='';if(!f)return;
  f.text().then(t=>{t=t.trim();try{mapDecode(t)}catch(e){toast('That file is not a Corley\'s Island map.','bad',3500);return}
    edMapOpen(edFreeName(f.name.replace(/(\.island)?\.json$/i,'').slice(0,40)||'Opened map'),t)})};
// This map: things by kind, roads and their length, the ground shaped and painted, and its size
function edStatsDraw(){const c={};for(const a of assets)c[a.t]=(c[a.t]||0)+1;let L=0;for(const r of ROADS)for(let i=0;i<r.pts.length-1;i++)L+=Math.hypot(r.pts[i+1][0]-r.pts[i][0],r.pts[i+1][1]-r.pts[i][1]);
  let sh=0,pa=0,tg=0;for(let q=0;q<ED_H.length;q++){if(Math.abs(ED_H[q])>0.02)sh++;if(ED_M[q]||Math.abs(ED_P[q])>0.05)pa++;if(ED_G[q])tg++}
  const sq=n=>`${Math.round(n*ED_C*ED_C/(FT*FT)).toLocaleString()} sq ft`,kb=Math.max(1,Math.round(mapEncode().length/1024));
  const rows=[['Things',`${assets.length}`],...Object.entries(c).sort((p,q)=>q[1]-p[1]).map(([t,n])=>['',edPlural(n,edKindWord(t))]),
    ['Roads',ROADS.length?`${ROADS.length}, ${Math.round(edFt(L)).toLocaleString()} ft in all`:'None'],['Shaped',sh?sq(sh):'None'],['Painted',pa?sq(pa):'None'],['Tall grass',tg?sq(tg):'None'],['Size',`${kb} KB`]];
  $('#edMapStats').innerHTML=rows.map(([a,b])=>`<dt>${a}</dt><dd>${b}</dd>`).join('')}
// Start over, for the whole map or one layer: the layer goes back to the starting island (shape and paint cleared, the
// first trees and boulders and roads back), saved, then the game reloads
$('#edReset').onclick=e=>{const b=e.target.closest('button');if(!b)return;
  if(!b.dataset.arm){b.dataset.arm=1;const t=b.textContent;b.textContent='Tap again';setTimeout(()=>{if(b.dataset.arm){delete b.dataset.arm;b.textContent=t}},2500);return}
  const k=b.dataset.clear;if(k==='all'){try{localStorage.removeItem('bhd_map')}catch(e){}location.reload();return}
  edSave();if(k==='shape')ED_H.fill(0);if(k==='paint'){ED_P.fill(0);ED_M.fill(0);ED_A.fill(0);tallDefault()}if(k==='things')mapAssets=null;if(k==='roads')mapRoads=null;
  try{localStorage.setItem('bhd_map',mapEncode())}catch(e){toast('Could not save the map on this device.','bad');return}location.reload()};

// ---------- each frame while the editor is open (main.js hands it the frame) ----------
const edLook=new THREE.Vector3();
function editorFrame(dt,now){
  // keys move the view
  const ek=(a,b)=>(keys[a]?1:0)-(keys[b]?1:0),ar=ed.sel.length?0:1,kx=ek('KeyD','KeyA')+ar*ek('ArrowRight','ArrowLeft'),kz=ek('KeyS','KeyW')+ar*ek('ArrowDown','ArrowUp');
  if(kx||kz)edPan(-kx*dt*700,-kz*dt*700);
  ed.yaw+=ek('KeyQ','KeyE')*dt*1.6;ed.dist=clamp(ed.dist*Math.exp(ek('KeyF','KeyR')*dt*1.5),8,900);
  // the brush works while held; the ground catches up a few times a second, and fully when the stroke ends
  if(ed.stroke)edBrush(dt);if(ed.scat)edScatter(dt);plantTick();
  if(ed.pend&&(ed.stroke||(ed.drag&&ed.drag.road))&&now-ed.refT>110){ed.refT=now;edRefresh(ed.pend,false);ed.pend=null}
  // a list row or road picked: the view glides there; a long press adds to the selection (or takes away)
  if(ed.fly){const k=1-Math.exp(-dt*7);ed.x+=(ed.fly.x-ed.x)*k;ed.z+=(ed.fly.z-ed.z)*k;if(Math.hypot(ed.fly.x-ed.x,ed.fly.z-ed.z)<0.05)ed.fly=null}
  if(ed.lp&&now-ed.lp.t>450){const l=ed.lp,o=l.prev.filter(s=>edKey(s)!==edKey(l.hit));ed.lp=null;ed.drag=null;edSelSet(l.was?o:[...o,l.hit]);if(navigator.vibrate)navigator.vibrate(15)}
  if(ed.listF==='near'&&now-ed.listT>600){ed.listT=now;edListDraw()}
  if(ed.knob&&ed.yaw!==ed.hYaw&&!(ed.drag&&ed.drag.ring))edHandles()
  // puddles and mud tiles keep up with the edits (painted Mud fills ruts, painting over them dries them)
  waterTick(dt);mudTick(dt);treesTick(dt);dnTick(dt);if(rainTexDirty)rainTexUpdate();
  const fy=hAt(ed.x,ed.z);edLook.set(ed.x,fy,ed.z);
  camera.position.set(ed.x+Math.sin(ed.yaw)*Math.cos(ed.pitch)*ed.dist,fy+Math.sin(ed.pitch)*ed.dist,ed.z+Math.cos(ed.yaw)*Math.cos(ed.pitch)*ed.dist);
  camera.position.y=Math.max(camera.position.y,hAt(camera.position.x,camera.position.z)+2);camera.lookAt(edLook);
  sky.position.copy(camera.position);
  if(now-(ed.viewT||0)>200){ed.viewT=now;const t=viewText()+' · '+viewCode();if(t!==ed.viewS){ed.viewS=t;$('#edStatView').textContent=t}}
  sun.position.set(ed.x,fy,ed.z).addScaledVector(LIGHT_DIR,SUN_D);sun.target.position.set(ed.x,fy,ed.z);
  timeU.value=now/1000;updateSound(dt);
  shadowProxyTick();lawnLod();tuftLod();turfLod();postRender()}
