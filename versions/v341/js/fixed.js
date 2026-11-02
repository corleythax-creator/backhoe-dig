// Corley's Island: every fixed thing in the game (the buildings and all inside them, benches, posts, walls, signs, the
// town's trees) can be picked, moved, turned, hidden and deleted in the map editor like the things placed there.
// The world is built at load into big merged meshes, so a fixed thing is found by its collision boxes (SOLIDS): a
// building is its footprint (foot) or its rooms (IN_ROOMS) or a box a builder declared (fxDecl, terrain.js), with every
// solid standing in it; any other solid is a thing of its own. Each one is an entry in the editor's asset list,
// {t: its kind (FX_KN), x, z, yaw, s: 1, c: its id}, so selecting, dragging, turning, undo, Hide and Lock all work as
// for placed things; the map saves only the ones moved or locked, and 'fixgone' for the ones deleted. When a fixed
// thing is first touched, fxGather takes the pieces round it: the merged meshes' triangles lying wholly inside its box
// (not the ground sheets lying on the ground), its solids, floors (WALK_PADS), rooms, doors, people's spots, lamps,
// detailed models (MDL_SPOTS) and other meshes standing in it (not ones that have moved since load: boats, carts); fxBuild then lays them where its entry says.
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.
const FX_KN={fxbuilding:'Building',fxstruct:'Structure',fxtree:'Town tree',fxbench:'Town bench',fxlamp:'Town lamp',fxpicnic:'Town picnic table',
  fxtyre:'Tyre',fxbale:'Hay bale',fxroundbale:'Round bale',fxcone:'Town cone',fxbarrier:'Barrier',fxlight:'Light tower (built in)',fxoffice:'Site office',
  fxfueltank:'Fuel tank (built in)',fxpost:'Post',fxwall:'Wall or railing',fxsmall:'Small fixed thing',fxbig:'Large fixed thing'};
// the detailed models' kinds (MDL_SPOTS) name the solids standing on them
const FX_MDL={bench:'fxbench',lamp:'fxlamp',picnic:'fxpicnic',picnic8:'fxpicnic',tyre:'fxtyre',bale:'fxbale',roundbale:'fxroundbale',cone:'fxcone',
  barrier:'fxbarrier',light:'fxlight',office:'fxoffice',fueltank:'fxfueltank'};
const FX=[],FX_BY=new Map(),FX_MESH=[],FX_OBJ=[],fxOf=a=>FX_KN[a.t]?FX_BY.get(a.c):null;
// ---------- finding them ----------
function fxHash(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>1}
function fxIndex(){const cm=v=>Math.round(v*100),S=SOLIDS.filter(s=>!s.prop&&!s.dw),C=[];
  const box=(x0,x1,z0,z1,o)=>Object.assign({x0,x1,z0,z1,solids:[]},o),inB=(b,x,z,m)=>x>=b.x0-m&&x<=b.x1+m&&z>=b.z0-m&&z<=b.z1+m,area=b=>(b.x1-b.x0)*(b.z1-b.z0);
  for(const d of FX_DECL)C.push(box(d.x-d.hx,d.x+d.hx,d.z-d.hz,d.z+d.hz,{n:d.n,decl:1}));
  for(const s of S)if(s.foot&&!C.some(c=>c.decl&&inB(c,s.x,s.z,0)))C.push(box(s.x-s.hx,s.x+s.hx,s.z-s.hz,s.z+s.hz,{}));
  // rooms: in the building whose box holds their middle, else clustered with the rooms they touch into one
  const loose=[];for(const r of IN_ROOMS){const ex=Math.abs(r.cf)*r.hw+Math.abs(r.sf)*r.hd+0.4,ez=Math.abs(r.sf)*r.hw+Math.abs(r.cf)*r.hd+0.4;
    if(!C.some(c=>inB(c,r.x,r.z,0)))loose.push(box(r.x-ex,r.x+ex,r.z-ez,r.z+ez,{}))}
  for(let go=1;go;){go=0;for(let i=0;i<loose.length&&!go;i++)for(let j=i+1;j<loose.length;j++){const a=loose[i],b=loose[j];
    if(a.x0<b.x1&&b.x0<a.x1&&a.z0<b.z1&&b.z0<a.z1){a.x0=Math.min(a.x0,b.x0);a.x1=Math.max(a.x1,b.x1);a.z0=Math.min(a.z0,b.z0);a.z1=Math.max(a.z1,b.z1);loose.splice(j,1);go=1;break}}}
  C.push(...loose);C.sort((a,b)=>area(a)-area(b));
  const own=[];for(const s of S){const c=C.find(c=>inB(c,s.x,s.z,0.3));if(c){c.solids.push(s);if(!c.decl){c.x0=Math.min(c.x0,s.x-s.hx);c.x1=Math.max(c.x1,s.x+s.hx);c.z0=Math.min(c.z0,s.z-s.hz);c.z1=Math.max(c.z1,s.z+s.hz)}}else own.push(s)}
  const items=[];for(const c of C){c.t=c.decl?'fxstruct':'fxbuilding';c.key='b'+[c.x0,c.x1,c.z0,c.z1].map(cm).join(',');items.push(c)}
  const near=(k,x,z)=>(MDL_SPOTS[k]||[]).some(q=>Math.abs(q[0]-x)<0.4&&Math.abs(q[2]-z)<0.4);
  for(const s of own){const m=Math.max(s.hx,s.hz),n=Math.min(s.hx,s.hz);let t=null;for(const k in FX_MDL)if(near(k,s.x,s.z)){t=FX_MDL[k];break}
    if(!t)t=m<0.3?'fxpost':m>=1.5&&m>4*n?'fxwall':m<1.5?'fxsmall':'fxbig';
    items.push(box(s.x-s.hx,s.x+s.hx,s.z-s.hz,s.z+s.hz,{t,solids:[s],key:'s'+[s.x,s.z,s.hx,s.hz].map(cm).join(',')}))}
  // the town's trees (every tree group but the editor's own)
  for(const g in treeGroups)if(g!=='main')for(const e of treeGroups[g])items.push(box(e.x-1,e.x+1,e.z-1,e.z+1,{t:'fxtree',tree:{g,e},key:'t'+g+cm(e.x)+','+cm(e.z)}));
  for(const it of items){let id=fxHash(it.key);while(FX_BY.has(id))id=(id+1)>>>0&0x7fffffff;it.id=id;FX_BY.set(id,it);it.cx=(it.x0+it.x1)/2;it.cz=(it.z0+it.z1)/2;it.st=0;FX.push(it)}
  // the merged meshes (world-space triangles, not indexed) and the other meshes and groups standing loose in the scene
  scene.updateMatrixWorld(true);const I=new THREE.Matrix4(),skip=new Set(ED_MACH.map(m=>m.m()));
  for(const o of scene.children){if(skip.has(o)||o.isInstancedMesh||o.isPoints||o.isLight||o.isCamera)continue;
    if(o.isMesh&&o.matrixWorld.equals(I)){if(!o.geometry.index&&o.geometry.attributes.normal){o.geometry.computeBoundingBox();FX_MESH.push({m:o,own:new Uint32Array(o.geometry.attributes.position.count/3)})}continue}
    if(o.isLine||o.isSprite||!o.visible&&!o.children.length)continue;FX_OBJ.push({o,x:o.position.x,z:o.position.z,r:-1})}}
// how big each loose mesh or group is, measured once, the first time something is picked
function fxObjSize(O){if(O.r<0){const b=new THREE.Box3().setFromObject(O.o),v=b.isEmpty()?null:b.getSize(new THREE.Vector3());O.r=v?Math.max(v.x,v.z)/2:1e9}return O.r}
// a building's box reaches past its solids a little for its eaves and steps; a small thing's for its seat or its head
const fxMargin=it=>it.tree?0:Math.min(1.2,0.3+0.03*Math.max(it.x1-it.x0,it.z1-it.z0));
// ---------- taking its pieces ----------
function fxGather(it){if(it.g)return it.g;const g=it.g={tris:[],solids:[],pads:[],rooms:[],doors:[],spots:[],lamps:[],mdl:[],objs:[]};if(it.tree)return g;
  const m=fxMargin(it),x0=it.x0-m,x1=it.x1+m,z0=it.z0-m,z1=it.z1+m,inn=(x,z)=>x>=x0&&x<=x1&&z>=z0&&z<=z1,low=(P,k)=>Math.abs(P[k+1]-baseHeight(P[k],P[k+2]))<0.1;
  let y1=-1e9;
  for(const F of FX_MESH){const bx=F.m.geometry.boundingBox;if(bx.max.x<x0||bx.min.x>x1||bx.max.z<z0||bx.min.z>z1)continue;
    const P=F.m.geometry.attributes.position.array,N=F.m.geometry.attributes.normal.array,list=[];
    for(let i=0,t=0;i<P.length;i+=9,t++){if(F.own[t]||!inn(P[i],P[i+2])||!inn(P[i+3],P[i+5])||!inn(P[i+6],P[i+8]))continue;if(low(P,i)&&low(P,i+3)&&low(P,i+6))continue;
      F.own[t]=it.id+1;list.push(i);y1=Math.max(y1,P[i+1],P[i+4],P[i+7])}
    if(list.length){const op=new Float32Array(list.length*9),on=new Float32Array(list.length*9);list.forEach((i,k)=>{op.set(P.subarray(i,i+9),k*9);on.set(N.subarray(i,i+9),k*9)});g.tris.push({F,list,op,on})}}
  const taken=o=>o.fx&&o.fx!==it;
  for(const s of it.solids){s.fx=it;g.solids.push({s,o:{x:s.x,z:s.z,hx:s.hx,hz:s.hz,f:s.lx!==undefined?Math.atan2(s.sn,s.cs):0,lx:s.lx!==undefined?s.lx:s.hx,lz:s.lz!==undefined?s.lz:s.hz}})}
  for(const p of WALK_PADS)if(!p.tag&&!taken(p)&&inn(p.x,p.z)){p.fx=it;g.pads.push({p,o:{x:p.x,z:p.z,f:Math.atan2(p.s,p.c),t:p.t}})}
  for(const r of IN_ROOMS)if(!taken(r)&&inn(r.x,r.z)){r.fx=it;g.rooms.push({r,o:{x:r.x,z:r.z,f:r.f,y:r.y,top:r.top}})}
  for(const d of RM_DOORS)if(!taken(d)&&inn(d.x,d.z)){d.fx=it;g.doors.push({d,o:{x:d.x,z:d.z,f:d.f,y:d.y}})}
  for(const R of TF_ROOMS)for(const sp of R.spots)if(!sp.of&&!taken(sp)&&inn(sp.x,sp.z)){sp.fx=it;g.spots.push({sp,o:{x:sp.x,z:sp.z,y:sp.y,yaw:sp.yaw}})}
  for(const l of FAM_LAMPS)if(!taken(l)&&inn(l[0],l[2])){l.fx=it;g.lamps.push({l,o:l.slice(0,3)})}
  for(const k in MDL_SPOTS)MDL_SPOTS[k].forEach((q,i)=>{if(!taken(q)&&inn(q[0],q[2])){q.fx=it;g.mdl.push({k,i,q,o:q.slice(0,4)})}});
  const size=Math.max(x1-x0,z1-z0)/2;
  for(const O of FX_OBJ)if(!taken(O)&&inn(O.x,O.z)&&O.o.position.x===O.x&&O.o.position.z===O.z&&O.o.parent===scene&&fxObjSize(O)<=size+0.5){O.fx=it;g.objs.push({O,o:{p:O.o.position.clone(),q:O.o.quaternion.clone(),v:O.o.visible}})}
  it.h=Math.max(1,y1-baseHeight(it.cx,it.cz));return g}
// ---------- laying them where the entry says (x, z, turned by yaw; gone: out of the world) ----------
const fxQ=new THREE.Quaternion(),fxY=new THREE.Vector3(0,1,0);
function fxPadPut(p,x,z,f,t){const old=[];for(const [k,L] of WP_G){const i=L.indexOf(p);if(i>=0){L.splice(i,1);if(!L.length)old.push(k)}}for(const k of old)WP_G.delete(k);
  p.x=x;p.z=z;p.c=Math.cos(f);p.s=Math.sin(f);p.t=t;const ex=Math.abs(p.c)*p.hx+Math.abs(p.s)*p.hz,ez=Math.abs(p.s)*p.hx+Math.abs(p.c)*p.hz;
  for(let i=Math.floor((x-ex)/WP_C);i<=Math.floor((x+ex)/WP_C);i++)for(let j=Math.floor((z-ez)/WP_C);j<=Math.floor((z+ez)/WP_C);j++){const k=wpKey(i,j);if(!WP_G.has(k))WP_G.set(k,[]);WP_G.get(k).push(p)}}
function fxApply(it,a){const g=fxGather(it),gone=!a||!!a.hd,r=gone?0:a.yaw,c=Math.cos(r),s=Math.sin(r),dx=gone?1e5:a.x-it.cx,dz=gone?0:a.z-it.cz,
    dy=gone?-500:baseHeight(a.x,a.z)-baseHeight(it.cx,it.cz),X=(x,z)=>it.cx+(x-it.cx)*c+(z-it.cz)*s+dx,Z=(x,z)=>it.cz-(x-it.cx)*s+(z-it.cz)*c+dz;
  if(it.tree){const L=treeGroups[it.tree.g],e=it.tree.e,i=L.indexOf(e);if(gone){if(i>=0)L.splice(i,1)}else{if(i<0)L.push(e);if(!it.o)it.o={x:e.x,z:e.z};e.x=a.x;e.z=a.z}fxApply.trees=1;return}
  for(const T of g.tris){const P=T.F.m.geometry.attributes.position,N=T.F.m.geometry.attributes.normal,PA=P.array,NA=N.array;
    T.list.forEach((i,k)=>{for(let v=0;v<9;v+=3){const o=k*9+v,x=T.op[o],z=T.op[o+2],nx=T.on[o],nz=T.on[o+2];
      PA[i+v]=X(x,z);PA[i+v+1]=T.op[o+1]+dy;PA[i+v+2]=Z(x,z);NA[i+v]=nx*c+nz*s;NA[i+v+1]=T.on[o+1];NA[i+v+2]=-nx*s+nz*c}});
    P.needsUpdate=N.needsUpdate=true;T.F.dirty=1}
  for(const {s:S,o} of g.solids){S.x=X(o.x,o.z);S.z=Z(o.x,o.z);if(r||S.lx!==undefined){const f=o.f+r;S.lx=o.lx;S.lz=o.lz;S.cs=Math.cos(f);S.sn=Math.sin(f);
      S.hx=Math.abs(S.cs)*o.lx+Math.abs(S.sn)*o.lz;S.hz=Math.abs(S.sn)*o.lx+Math.abs(S.cs)*o.lz}}
  for(const {p,o} of g.pads)fxPadPut(p,X(o.x,o.z),Z(o.x,o.z),o.f+r,o.t+dy);
  for(const {r:R,o} of g.rooms){R.x=X(o.x,o.z);R.z=Z(o.x,o.z);R.f=o.f+r;R.sf=Math.sin(R.f);R.cf=Math.cos(R.f);R.y=o.y+dy;R.top=o.top+dy}
  for(const {d,o} of g.doors){d.x=X(o.x,o.z);d.z=Z(o.x,o.z);d.f=o.f+r;d.y=o.y+dy;if(d.i>=0&&typeof rmDoorPut==='function')rmDoorPut(d)}
  for(const {sp,o} of g.spots){sp.x=X(o.x,o.z);sp.z=Z(o.x,o.z);sp.y=o.y+dy;sp.yaw=o.yaw+r;if(sp.who&&typeof tfDrop==='function')tfDrop(sp.who)}
  for(const {l,o} of g.lamps){l[0]=X(o[0],o[2]);l[1]=o[1]+dy;l[2]=Z(o[0],o[2])}if(g.lamps.length)fxApply.lamps=1;
  for(const {k,i,q,o} of g.mdl){q[0]=X(o[0],o[2]);q[1]=o[1]+dy;q[2]=Z(o[0],o[2]);q[3]=o[3]+r;const ims=mdl.spotIM[k];
    if(ims){const O=new THREE.Object3D();O.position.set(q[0],q[1],q[2]);O.rotation.set(0,q[3],0);O.scale.setScalar(q[4]);O.updateMatrix();for(const im of ims){im.setMatrixAt(i,O.matrix);im.instanceMatrix.needsUpdate=true}}}
  for(const {O,o} of g.objs){const ob=O.o;ob.visible=o.v&&!gone;ob.position.set(X(o.p.x,o.p.z),o.p.y+dy,Z(o.p.x,o.p.z));ob.quaternion.copy(fxQ.setFromAxisAngle(fxY,r)).multiply(o.q)}}
// the lamps' halos and the light they throw on the ground (daynight.js), laid again from FAM_LAMPS
function fxLampsSync(){let hi=0;const PP=dnPools.geometry.attributes.position,PA=PP.array;let q=0;
  for(const k of [1,2,3]){const L=FAM_LAMPS.filter(l=>l[3]===k);if(!L.length)continue;const m=dnHalos[hi++],H=m.geometry.attributes.position,d=DN_LAMP[k];
    L.forEach((l,i)=>{H.setXYZ(i,l[0],l[1],l[2]);const x=l[0],z=l[2]+d.off,y=l[1]<-100?-600:hAt(x,z)+0.1,r=d.pool;
      for(const [u,v] of [[-r,-r],[r,-r],[r,r],[-r,r]]){PA[q++]=x+u;PA[q++]=y;PA[q++]=z+v}});H.needsUpdate=true;m.geometry.computeBoundingSphere()}
  PP.needsUpdate=true;dnPools.geometry.computeBoundingSphere()}
// every fixed thing to where the asset list says (after any change to it: assetsBuild); only the ones that changed
function fxBuild(){if(!FX.length)return;const want=new Map();for(const a of assets)if(FX_KN[a.t])want.set(a.c,a);fxApply.trees=fxApply.lamps=0;
  for(const it of FX){const a=want.get(it.id),st=!a?3:a.hd?2:1;
    if(st===1&&(it.st===1||!it.st)&&Math.abs(a.x-(it.st?it.ax:it.cx))<1e-4&&Math.abs(a.z-(it.st?it.az:it.cz))<1e-4&&Math.abs(a.yaw-(it.st?it.ay:0))<1e-5)continue;
    if(st>1&&st===it.st)continue;it.st=st;if(a){it.ax=a.x;it.az=a.z;it.ay=a.yaw}fxApply(it,st===1?a:null)}
  for(const F of FX_MESH)if(F.dirty){F.dirty=0;F.m.geometry.computeBoundingSphere();F.m.geometry.computeBoundingBox()}
  if(fxApply.trees){treeLayout();if(typeof shpTreesRefresh==='function')shpTreesRefresh()}if(fxApply.lamps)fxLampsSync()}
// ---------- for the editor ----------
const fxFt=v=>Math.round(v/FT);
function fxDims(it){const g=it.tree?null:fxGather(it);return {w:it.x1-it.x0,d:it.z1-it.z0,h:it.tree?7:it.h||2}}
function fxName(a){const it=fxOf(a);if(!it)return a.t;if(it.tree){const sp=TREE_SP[treeSpecies(it.tree.e.t,it.tree.e.x,it.tree.e.z)];return `Town tree (${sp?sp.name:it.tree.e.t})`}
  return `${it.n||FX_KN[it.t]}, ${fxFt(it.x1-it.x0)} × ${fxFt(it.z1-it.z0)} ft`}
// how near a ground point is to it (under 1 is on it) and its ring's radius
function fxHit(a,x,z){const it=fxOf(a);if(!it)return 9;if(it.tree)return Math.hypot(a.x-x,a.z-z)/1.6;const c=Math.cos(a.yaw),s=Math.sin(a.yaw),dx=x-a.x,dz=z-a.z,u=dx*c-dz*s,v=dx*s+dz*c;
  return Math.max(Math.abs(u)/((it.x1-it.x0)/2+0.3),Math.abs(v)/((it.z1-it.z0)/2+0.3))}
const fxR=a=>{const it=fxOf(a);return !it?1:it.tree?1.6:Math.hypot(it.x1-it.x0,it.z1-it.z0)/2+0.2};
const fxMoved=a=>{const it=fxOf(a);return !!it&&(Math.abs(a.x-it.cx)>0.005||Math.abs(a.z-it.cz)>0.005||Math.abs(a.yaw)>0.0005)};
// back where the game built it
function fxHome(as){for(const a of as){const it=fxOf(a);if(it){a.x=it.cx;a.z=it.cz;a.yaw=0}}}
// what the map keeps (mapEncode, terrain.js): the things, the fixed ones only when moved or locked, and the deleted ones
function fxSaveList(list){if(!FX.length)return list;const out=[],have=new Set();
  for(const a of list){if(!FX_KN[a.t]){out.push(a);continue}have.add(a.c);if(fxMoved(a)||a.lk)out.push(a)}
  if(list===assets){for(const it of FX)if(!have.has(it.id))out.push({t:'fixgone',x:0,z:0,yaw:0,s:1,c:it.id})}
  return out}
// ---------- at load: index them, put them in the asset list from the map ----------
(function(){fxIndex();const seen=new Set(),gone=new Set();
  for(let i=assets.length-1;i>=0;i--){const a=assets[i];if(a.t==='fixgone'){gone.add(a.c);assets.splice(i,1);continue}if(!FX_KN[a.t])continue;
    const it=FX_BY.get(a.c);if(!it||seen.has(a.c)){assets.splice(i,1);continue}seen.add(a.c);a.t=it.t;a.s=1}
  for(const it of FX)if(!seen.has(it.id)&&!gone.has(it.id))assets.push({t:it.t,x:it.cx,z:it.cz,yaw:0,s:1,c:it.id});
  fxBuild()})();
