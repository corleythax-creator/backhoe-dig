// Corley's Island: Main Street from Building Forge (Graphics: High and Ultra, the bfMain setting). Each Main Street shop
// the game draws (mainLot, mainland.js) is taken out of the world as the map editor hides one (fixed.js: its triangles,
// walls, floors, rooms, doors, lamps and people's spots; its sign board stays) and Building Forge's building for its
// kind of shop stands in its place: the owner's own designs from Daylight House Studio (forge-studio's building
// library, the same ones Forge Studio places for Lakeside Town), the front wall on the lot's front. They change there:
// Daylight's Buildings, Send to games, and forge-studio rebuilds the library this loads.
// From each building's library entry: its ground floor walls (solids, cut at the doorways), its floor (a walk pad), its
// rooms (the camera stays in them), the furniture (solids with their height, measured from the model), the stairs (a
// solid: the floor above isn't walked yet) and its door leaves, which swing open as the worker comes up to them.
// The model is packed for drawing once per kind (merged by material; furniture apart, drawn only within BF_NEAR).
// Moving, turning or hiding the building in the map editor carries it (bfAfter, called at the end of fxApply).
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.
const BF_SITE='https://corley-forge-studio.vercel.app/building/library/';
// which building for a shop: by what kind of room interiors.js makes of it (RM_KIND), the pubs by their sign
const BF_KIND={eat:'main_street_cafe',shop:'main_street_shop',salon:'main_street_salon',office:'main_street_office',wash:'main_street_laundromat',art:'main_street_shop',gun:'main_street_shop'};
const BF_SIGN={12:'main_street_pub',21:'main_street_pub',20:'main_street_laundromat'};
const BF_NEAR=30,BF_OPEN=1.35;
const bf={lib:null,kinds:{},on:false,busy:false,lots:[],gen:0};
const bfIdOf=si=>BF_SIGN[si]||BF_KIND[RM_KIND[si]]||'main_street_shop';
function bfImport(){if(bf.mods)return bf.mods;
  return bf.mods=Promise.all([import('three/addons/loaders/GLTFLoader.js'),import('three/addons/libs/meshopt_decoder.module.js'),import('three/addons/utils/BufferGeometryUtils.js')])
    .then(([G,M,U])=>({loader:new G.GLTFLoader().setMeshoptDecoder(M.MeshoptDecoder),merge:U.mergeGeometries}))}
// a building kind, loaded and packed once: meshes merged by material (furniture apart), each door leaf's parts merged
// in its own frame, the furniture's boxes, all in the building's space
function bfKind(id){if(bf.kinds[id])return bf.kinds[id];
  return bf.kinds[id]=bfImport().then(({loader,merge})=>new Promise((ok,no)=>loader.load(BF_SITE+id+'.glb',g=>ok(bfPack(g.scene,merge)),undefined,no)))}
function bfPack(root,merge){const col=root.getObjectByName('Collision');if(col)col.removeFromParent();root.updateMatrixWorld(true);
  const plain=g=>{const h=new THREE.BufferGeometry();for(const [n,at] of Object.entries(g.attributes)){const f=new Float32Array(at.count*at.itemSize);
      for(let i=0;i<at.count;i++)for(let k=0;k<at.itemSize;k++)f[i*at.itemSize+k]=at.getComponent(i,k);h.setAttribute(n,new THREE.BufferAttribute(f,at.itemSize))}
    if(g.index)h.setIndex(new THREE.BufferAttribute(Uint32Array.from(g.index.array),1));return h};
  const group=(list,inv)=>{const G=new Map();for(const o of list){const g=o.geometry,k=o.material.uuid+Object.keys(g.attributes).sort().join(',')+(g.index?'+i':'');
      if(!G.has(k))G.set(k,{mat:o.material,list:[]});G.get(k).list.push(plain(g).applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv,o.matrixWorld)))}
    return [...G.values()].map(x=>({mat:x.mat,geo:x.list.length>1?merge(x.list):x.list[0]})).filter(x=>x.geo)};
  const I=new THREE.Matrix4(),stat=[],furn=[],leaves=[],boxes=[];let F=null;
  root.traverse(o=>{if(o.name==='Furniture'&&!F)F=o;if(o.userData&&o.userData.type==='doorLeaf')leaves.push(o)});
  root.traverse(o=>{if(!o.isMesh)return;let leaf=false,fu=false;for(let q=o;q&&q!==root;q=q.parent){if(q.userData&&q.userData.type==='doorLeaf')leaf=true;if(q===F)fu=true}if(!leaf)(fu?furn:stat).push(o)});
  // the furniture's boxes: each piece under Furniture, as tall as it stands (rugs and the like left out)
  // (the ground floor's only: the floor above isn't walked yet; a porch is a floor to stand on, porches)
  const porches=[];
  if(F)for(const c of F.children){const u=c.userData||{};if(u.level)continue;const b=new THREE.Box3().setFromObject(c);if(b.isEmpty())continue;const s=b.getSize(new THREE.Vector3());
    if(u.kind==='porch'||u.kind==='deck'){porches.push([(b.min.x+b.max.x)/2,(b.min.z+b.max.z)/2,s.x/2,s.z/2]);continue}
    if(u.kind==='stairs'||u.kind==='rug'||b.min.y>1.2||s.y<0.3||s.x>6||s.z>6)continue;boxes.push([(b.min.x+b.max.x)/2,(b.min.z+b.max.z)/2,s.x/2,s.z/2,b.max.y])}
  return {stat:group(stat,I),furn:group(furn,I),boxes,porches,
    leaves:leaves.map(L=>{const m=L.matrixWorld.clone(),p=new THREE.Vector3(),q=new THREE.Quaternion(),s=new THREE.Vector3();m.decompose(p,q,s);
      const li=m.clone().invert(),parts=[];L.traverse(o=>{if(o.isMesh)parts.push(o)});return {p,q,s,door:L.userData.door,swing:L.userData.swing||1,parts:group(parts,li)}})}}
// every frame (mainTick): the door leaves near the worker on foot swing open, and furniture shows only near the camera
function bfTick(dt){if(!bf.on)return;const foot=mode==='walk'&&!wk.inside;
  for(const L of bf.lots){const B=L.b;if(!B||!B.g.visible)continue;const dx=camera.position.x-B.g.position.x,dz=camera.position.z-B.g.position.z;B.furn.visible=dx*dx+dz*dz<BF_NEAR*BF_NEAR;
    for(const D of B.doors){const ex=wk.x-D.wx,ez=wk.z-D.wz,t=foot&&ex*ex+ez*ez<1.7*1.7&&Math.abs(wk.y-B.g.position.y)<2?1:0;if(t===D.a)continue;
      D.a=t>D.a?Math.min(1,D.a+dt*2.2):Math.max(0,D.a-dt*1.4);for(const l of D.leaves)l.o.quaternion.copy(l.q).multiply(bf.qa.setFromAxisAngle(bf.ay,l.swing*BF_OPEN*D.a))}}}
bf.qa=new THREE.Quaternion();bf.ay=new THREE.Vector3(0,1,0);
// the fixed thing (fixed.js) a lot's building is, found by its middle
function bfItem(L){let best=null;for(const it of FX)if(it.t==='fxbuilding'&&L.x>=it.x0&&L.x<=it.x1&&L.z>=it.z0&&L.z<=it.z1&&(!best||(it.x1-it.x0)*(it.z1-it.z0)<(best.x1-best.x0)*(best.z1-best.z0)))best=it;return best}
// a lot's building: drawn, and its walls, floor, rooms and furniture made in the world, laid where the lot is, each
// handed to the fixed thing (its pieces list, flagged bf) so the map editor carries it with the rest
function bfBuild(L,K,item){const it=bf.lib[L.id],face=L.face,c=Math.cos(face),s=Math.sin(face);
  const W=it.walls.filter(w=>!w[5]),front=Math.max(...W.map(w=>Math.max(w[1],w[3])+w[4]/2)),off=L.d/2-front,ox=L.x+Math.sin(face)*off,oz=L.z+Math.cos(face)*off;
  const y0=rmGroundMax(ox,oz,face,it.width,it.length-1.4)+0.03,X=(x,z)=>ox+x*c+z*s,Z=(x,z)=>oz-x*s+z*c,fl=y0+it.levels[0].floorY;
  const g=new THREE.Group();g.position.set(ox,y0,oz);g.rotation.y=face;const furn=new THREE.Group();g.add(furn);
  for(const x of K.stat){const m=new THREE.Mesh(x.geo,x.mat);m.castShadow=m.receiveShadow=true;g.add(m)}
  for(const x of K.furn){const m=new THREE.Mesh(x.geo,x.mat);m.castShadow=m.receiveShadow=true;furn.add(m)}
  const doors=new Map();for(const l of K.leaves){const o=new THREE.Object3D();o.position.copy(l.p);o.quaternion.copy(l.q);o.scale.copy(l.s);
    for(const x of l.parts){const m=new THREE.Mesh(x.geo,x.mat);m.castShadow=m.receiveShadow=true;o.add(m)}g.add(o);
    if(!doors.has(l.door))doors.set(l.door,{id:l.door,a:0,leaves:[]});doors.get(l.door).leaves.push({o,q:l.q.clone(),swing:l.swing})}
  scene.add(g);
  const G=fxGather(item),mine={solids:[],pads:[],rooms:[]},solid=(x,z,f,hs,ho,top)=>{rmSolid(X(x,z),Z(x,z),f,hs,ho,top);const S=SOLIDS[SOLIDS.length-1];S.bf=1;
    const e={s:S,o:{x:S.x,z:S.z,hx:S.hx,hz:S.hz,f:Math.atan2(S.sn,S.cs),lx:S.lx,lz:S.lz}};G.solids.push(e);mine.solids.push(S)};
  // the ground floor's walls along their centre lines; the stairs; the furniture
  for(const [x0,z0,x1,z1,t] of W){const ux=x1-x0,uz=z1-z0,len=Math.hypot(ux,uz);if(len<0.05)continue;
    const wx=ux*c+uz*s,wz=-ux*s+uz*c;solid((x0+x1)/2,(z0+z1)/2,Math.atan2(-wz,wx),len/2,t/2+0.04)}
  for(const st of it.stairs||[])if(!st.level){const [fx,fz]=st.foot,[hx,hz]=st.head,ux=hx-fx,uz=hz-fz,len=Math.hypot(ux,uz),wx=ux*c+uz*s,wz=-ux*s+uz*c;
    solid((fx+hx)/2,(fz+hz)/2,Math.atan2(-wz,wx),len/2,st.width/2,y0+it.levels[1].floorY)}
  for(const [x,z,hx,hz,top] of K.boxes)solid(x,z,face,hx,hz,y0+top);
  // the floor and the rooms (ground floor), each the box round its outline
  const xs=[],zs=[];for(const w of W){xs.push(w[0],w[2]);zs.push(w[1],w[3])}
  {const ax=(Math.min(...xs)+Math.max(...xs))/2,az=(Math.min(...zs)+Math.max(...zs))/2,p=walkPad(X(ax,az),Z(ax,az),(Math.max(...xs)-Math.min(...xs))/2,(Math.max(...zs)-Math.min(...zs))/2,face,fl);
    p.bf=1;G.pads.push({p,o:{x:p.x,z:p.z,f:face,t:p.t}});mine.pads.push(p)}
  for(const [x,z,hx,hz] of K.porches){const p=walkPad(X(x,z),Z(x,z),hx,hz,face,fl);p.bf=1;G.pads.push({p,o:{x:p.x,z:p.z,f:face,t:p.t}});mine.pads.push(p)}
  for(const r of it.rooms)if(!r.level){const a=r.outline.map(q=>q[0]),b=r.outline.map(q=>q[1]),cx=(Math.min(...a)+Math.max(...a))/2,cz=(Math.min(...b)+Math.max(...b))/2;
    const R=rmRoom(X(cx,cz),Z(cx,cz),face,(Math.max(...a)-Math.min(...a))/2,(Math.max(...b)-Math.min(...b))/2,y0+r.floorY,y0+r.ceilingY);R.bf=1;G.rooms.push({r:R,o:{x:R.x,z:R.z,f:R.f,y:R.y,top:R.top}});mine.rooms.push(R)}
  // the doors' middles (for opening them), in the building's space
  for(const d of it.doors)if(!d.level&&doors.has(d.id))Object.assign(doors.get(d.id),{lx:d.center[0],lz:d.center[2]});
  L.b={g,furn,doors:[...doors.values()].filter(D=>D.lx!==undefined),o:{x:ox,z:oz,y:y0,f:face},mine};item.bf=L}
// after fxApply has laid a fixed thing (moved, turned, hidden or home): on a swapped one, the game's own pieces taken
// out (all but its sign) and the building laid with it; on one swapped back, the building's pieces taken out instead
function bfAfter(it,a){const L=it.bf;if(!L||!L.b)return;const B=L.b,gone=!a||!!a.hd,show=bf.on&&!gone,G=fxGather(it),away=e=>e.bf;
  const r=gone?0:a.yaw,c=Math.cos(r),s=Math.sin(r),dx=gone?0:a.x-it.cx,dz=gone?0:a.z-it.cz,dy=gone?0:baseHeight(a.x,a.z)-baseHeight(it.cx,it.cz);
  B.g.visible=show;if(show){const x=B.o.x-it.cx,z=B.o.z-it.cz;B.g.position.set(it.cx+x*c+z*s+dx,B.o.y+dy,it.cz-x*s+z*c+dz);B.g.rotation.y=B.o.f+r;
    for(const D of B.doors){const ox=B.g.position.x,oz=B.g.position.z,f=B.g.rotation.y;D.wx=ox+D.lx*Math.cos(f)+D.lz*Math.sin(f);D.wz=oz-D.lx*Math.sin(f)+D.lz*Math.cos(f)}}
  if(gone)return;
  // which side is out of the world: the game's (swapped) or the building's (not)
  const out=e=>bf.on?!away(e):away(e);
  for(const {s:S} of G.solids)if(out(S)){S.x+=1e5}
  for(const {p} of G.pads)if(out(p))fxPadPut(p,p.x+1e5,p.z,Math.atan2(p.s,p.c),p.t);
  for(const {r:R} of G.rooms)if(out(R))R.x+=1e5;
  if(!bf.on)return;
  for(const T of G.tris){if(T.F.m.userData.sign)continue;const PA=T.F.m.geometry.attributes.position.array;
    for(const i of T.list)for(let v=0;v<9;v+=3){PA[i+v]+=1e5;PA[i+v+1]-=500}T.F.m.geometry.attributes.position.needsUpdate=true;T.F.bfDirty=1}
  for(const {d} of G.doors){d.x+=1e5;if(d.i>=0)rmDoorPut(d)}
  for(const {sp} of G.spots){sp.x+=1e5;if(sp.who&&typeof tfDrop==='function')tfDrop(sp.who)}
  for(const {l} of G.lamps)l[1]=-600;if(G.lamps.length){bf.lamps=1;fxApply.lamps=1}
  for(const {O} of G.objs)O.o.visible=false}
function bfFlush(){for(const F of FX_MESH)if(F.bfDirty){F.bfDirty=0;F.m.geometry.computeBoundingSphere();F.m.geometry.computeBoundingBox()}if(bf.lamps){bf.lamps=0;fxLampsSync()}}
// on or off (gfxApply, and once at load): the library and each kind loaded the first time, then every lot laid again
async function bfSync(){const want=!!(gfxCur&&gfxCur.bfMain);if(typeof FX==='undefined'||!FX.length||!MAIN_ST_LOTS.length)return;
  if(want===bf.on&&(!want||bf.lots.length))return;const gen=++bf.gen;
  if(want&&!bf.lots.length){try{if(!bf.lib){const r=await fetch(BF_SITE+'library.json');if(!r.ok)throw new Error(r.status);bf.lib=Object.fromEntries((await r.json()).buildings.map(b=>[b.id,b]))}
      const lots=MAIN_ST_LOTS.map(L=>Object.assign({},L,{id:bfIdOf(L.si)})).filter(L=>bf.lib[L.id]),K={};
      for(const id of new Set(lots.map(L=>L.id)))K[id]=await bfKind(id);if(gen!==bf.gen)return;
      for(const L of lots){const item=bfItem(L);if(!item||item.bf)continue;bfBuild(L,K[L.id],item);bf.lots.push(L)}}
    catch(e){console.warn('Building Forge: Main Street not loaded',e);return}}
  bf.on=want;const as=new Map();for(const a of assets)if(FX_KN[a.t])as.set(a.c,a);
  for(const L of bf.lots){const item=FX.find(x=>x.bf===L);if(!item)continue;const a=as.get(item.id);fxApply(item,a||null)}
  for(const F of FX_MESH)if(F.dirty){F.dirty=0;F.bfDirty=1}bfFlush()}
bfSync();
