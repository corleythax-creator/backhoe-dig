// Corley's Island: the town from Building Forge (Graphics: High and Ultra; bfMain the shops, hall, hotel, library,
// brewery, store, marina and waterfront, bfHomes the neighbourhoods' houses). Each building the game draws in town is
// taken out of the world as the map editor hides one (fixed.js: its triangles, walls, floors, rooms, doors, lamps and
// people's spots; a shop's sign board stays) and Building Forge's building for it stands in its place: the owner's own
// designs from Daylight House Studio, from forge-studio's live site. Where each stands is forge-studio's
// building/library/corleys_island.json (map/tools/town_places.mjs works it out from this game's own code: re-run it
// there when the town's layout changes). They change in Daylight: its Buildings, Send to games, forge-studio rebuilds.
// From each building's library entry, floor by floor: its walls (solids that stand from their floor to the next, so the
// worker upstairs and down each keeps to his own floor's), its floors (walk pads; the upper ones `up`, stood on only from
// within a step: terrain.js padAt), its stairs (a pad rising from one floor to the next), its rooms (the camera stays in
// them), the furniture (solids as tall as they stand) and its doors (RM_DOORS of kind 'bf', opened as the worker or a
// townsperson comes through: interiors.js rmDoorsTick; their leaves in the model swing with them).
// Its townsfolk: the game's own room for the building (TF_ROOMS: a shop's, a home's, the brewery's, the store's) is kept,
// so whoever works or lives there still does (lives.js holds rooms by identity), and given the building's spots while it
// is swapped (bfRoomSet: its own put back after): staff at the counters and desk, people on the dining chairs (where
// Daylight sets them round a table) and before the shelves, machines and kitchen, and a shop's door in the front wall,
// which its customers walk in and out of round the walls and furniture (R.sol), as in the game's own shops.
// The model is packed for drawing once per kind (merged by material; furniture apart, drawn only within BF_NEAR).
// Moving, turning or hiding a building in the map editor carries it (bfAfter, called at the end of fxApply).
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.
const BF_SITE='https://corley-forge-studio.vercel.app/building/library/',BF_PLACES='corleys_island.json';
const BF_NEAR=30,BF_OPEN=1.35,BF_STAFF=new Set(['counter','desk','island']),BF_SHOP=new Set(['counter','washer','dryer','desk','island','fridge','range','vanity']);
const bf={lib:null,places:null,kinds:{},lots:[],gen:0,qa:new THREE.Quaternion(),ay:new THREE.Vector3(0,1,0)};
// which setting draws an area's buildings
const bfWant=area=>!!(gfxCur&&(area==='homes'?gfxCur.bfHomes:gfxCur.bfMain));
// the doors drawn by the building's model (nothing of their own here)
RM_DOOR_KIND.bf=K=>{};RM_DK.bf=RM_DK.bf||[];
function bfImport(){if(bf.mods)return bf.mods;
  return bf.mods=Promise.all([import('three/addons/loaders/GLTFLoader.js'),import('three/addons/libs/meshopt_decoder.module.js'),import('three/addons/utils/BufferGeometryUtils.js')])
    .then(([G,M,U])=>({loader:new G.GLTFLoader().setMeshoptDecoder(M.MeshoptDecoder),merge:U.mergeGeometries}))}
// where people stand or sit at a piece of furniture, by its kind (Daylight's Commercial pieces: a counter's staff
// behind it, at its back, its customers before it): [x, z (the piece's own feet, its front +z), the way they face (0: to
// its front), 's' sit / 'f' staff / ''], for a piece w by d feet
const BF_KSPOT={
  checkout:(w,d)=>[[0,-d/2-1.4,0,'f'],[0,d/2+1.4,Math.PI,'']],
  svcounter:(w,d)=>(w>=9?[-w/4,w/4]:[0]).flatMap(x=>[[x,-d/2-1.4,0,'f'],[x,d/2+1.4,Math.PI,'']]),
  reception:(w,d)=>[[0,-d/2-1.3,0,'f'],[0,d/2+1.4,Math.PI,'']],
  bar:(w,d)=>[...(w>=9?[-w/4,w/4]:[0]).map(x=>[x,-d/2-1.3,0,'f']),...Array.from({length:Math.max(1,Math.floor((w-1)/2.6))},(_,i)=>[-w/2+1.5+i*2.6,d/2+1.4,Math.PI,''])],
  dispcase:(w,d)=>[[0,d/2+1.4,Math.PI,'']],shelving:(w,d)=>[[0,d/2+1.4,Math.PI,'']],cooler:(w,d)=>[[0,d/2+1.4,Math.PI,'']],rack:(w,d)=>[[0,d/2+1.4,Math.PI,''],[0,-d/2-1.4,0,'']],
  gondola:(w,d)=>[[-w/4,d/2+1.3,Math.PI,''],[w/4,-d/2-1.3,0,'']],
  booth:(w,d)=>[-w/4,w/4].flatMap(x=>[[x,-(d/2-0.85),0,'s'],[x,d/2-0.85,Math.PI,'s']]),
  cafetable:(w,d)=>[[0,-1.75,0,'s'],[0,1.75,Math.PI,'s']],
  salonst:(w,d)=>[[0,d/2-1.5,Math.PI,'s'],[0,d/2+0.8,Math.PI,'f']],
  wchairs:(w,d)=>{const n=Math.max(1,Math.round(w/2));return Array.from({length:n},(_,i)=>[-w/2+(i+.5)*w/n,0.1,0,'s'])},
  pew:(w,d)=>Array.from({length:Math.max(1,Math.floor(w/2.2))},(_,i)=>[-w/2+1.1+i*2.2,0.15,0,'s'])};
// a lone chair or stool (Daylight's dchair and stool, round a table or along a bar): one seat on it, turned to face the
// table or bar it stands at (bfSeatAim)
BF_KSPOT.dchair=BF_KSPOT.stool=(w,d)=>[[0,0,0,'s']];
const BF_SEATS=new Set(['dchair','stool']),BF_ROUND=new Set(['round','cafetable']);
// each lone seat turned to the table or bar beside it (a piece with a top 2 to 4 ft up, within 3 ft): facing the middle
// of a round table, else the nearest point of its edge. The seat spot gets [x, z, facing, 's', dy (a bar stool's seat
// above the 18 in a chair's is, lifting the sitter), [f, h] (where their glass and plate go: f ahead of the seat, h
// over the floor; townfolk.js tfTableDraw)]
function bfSeatAim(items){for(const P of items){if(!BF_SEATS.has(P.kind)||!P.spots||!P.spots[0])continue;const q=P.spots[0],x=q[0],z=q[1];let best=null,bd=0.95;
    for(const T of items){if(T===P||T.lvl!==P.lvl||BF_SEATS.has(T.kind))continue;const [cx,cz,hx,hz,y0,y1]=T.box,h=y1-y0;if(h<0.6||h>1.25)continue;
      const nx=Math.max(cx-hx,Math.min(cx+hx,x)),nz=Math.max(cz-hz,Math.min(cz+hz,z)),d=Math.hypot(nx-x,nz-z);if(d<bd){bd=d;best={T,nx,nz}}}
    const sh=P.box[5]-P.box[4],dy=P.kind==='stool'&&sh>0.55?Math.min(0.5,sh-0.46):0;if(!best){q[4]=dy;continue}
    const [cx,cz,hx,hz,y0,y1]=best.T.box,rd=BF_ROUND.has(best.T.kind);let tx,tz;
    if(rd){const r=Math.min(hx,hz),ux=x-cx,uz=z-cz,L=Math.hypot(ux,uz)||1,k=Math.max(0.1,r-0.2);tx=cx+ux/L*k;tz=cz+uz/L*k}
    else{const ux=best.nx-x,uz=best.nz-z,L=Math.hypot(ux,uz)||1;tx=best.nx+ux/L*0.2;tz=best.nz+uz/L*0.2}
    q[2]=Math.atan2(tx-x,tz-z);q[4]=dy;q[5]=[Math.hypot(tx-x,tz-z),y1-y0]}}
// a floor of the building's drawn in one of the game's own photo-scanned materials in place of Daylight's, by building
// (lib: textures/<lib>.jpg with _n and _r from tools/cc0.py, ft the feet one tile covers): the brewery's taproom in worn
// pine planks. Its relief and sheen show with Material relief (gfxCur.pbr: bfFloorPbr)
const BF_FLOOR={lakeside_brewery:{lib:'wood_floor',ft:3.7}},bfFloorMats=new Map();
function bfFloorMat(d,upm){const key=d.lib+'@'+upm.toFixed(3);let m=bfFloorMats.get(key);if(m)return m;
  const rep=1/(d.ft*0.3048*upm),L=k=>{const t=new THREE.TextureLoader().load(`textures/${d.lib}${k}.jpg`);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(rep,rep);t.anisotropy=8;return t};
  m=new THREE.MeshStandardMaterial({map:L(''),roughness:1,metalness:0,envMap:skyEnv,envMapIntensity:0.25});m.name='bfFloor';m.userData={n:L('_n'),r:L('_r')};bfFloorPbr1(m);bfFloorMats.set(key,m);return m}
function bfFloorPbr1(m){const on=!!(gfxCur&&gfxCur.pbr);m.normalMap=on?m.userData.n:null;m.roughnessMap=on?m.userData.r:null;m.roughness=on?1:0.6;m.needsUpdate=true}
function bfFloorPbr(){for(const m of bfFloorMats.values())bfFloorPbr1(m)}
// a floor mesh's UVs per metre (Daylight lays them in feet)
function bfUvPerM(o){const P=o.geometry.attributes.position,U=o.geometry.attributes.uv;if(!P||!U||P.count<3)return 3.2808;let best=0;
  const v0=new THREE.Vector3().fromBufferAttribute(P,0).applyMatrix4(o.matrixWorld),v=new THREE.Vector3();
  for(let i=1;i<Math.min(P.count,64);i++){v.fromBufferAttribute(P,i).applyMatrix4(o.matrixWorld);const d=Math.hypot(v.x-v0.x,v.z-v0.z);if(d>0.5){const u=Math.hypot(U.getX(i)-U.getX(0),U.getY(i)-U.getY(0));best=u/d;break}}
  return best>0.01?best:3.2808}
// a piece's spots in the building's space: [x, z, the way they face, flags]
function bfKSpots(c,kind){const f=BF_KSPOT[kind];if(!f)return null;const inv=new THREE.Matrix4().copy(c.matrixWorld).invert(),m=new THREE.Matrix4(),b=new THREE.Box3();
  c.traverse(o=>{if(o.isMesh){o.geometry.computeBoundingBox();b.union(o.geometry.boundingBox.clone().applyMatrix4(m.multiplyMatrices(inv,o.matrixWorld)))}});if(b.isEmpty())return null;
  const v=new THREE.Vector3(),u=new THREE.Vector3();
  return f(b.max.x-b.min.x,b.max.z-b.min.z).map(([x,z,yl,fl])=>{v.set(x,0,z).applyMatrix4(c.matrixWorld);u.set(Math.sin(yl),0,Math.cos(yl)).transformDirection(c.matrixWorld);return [v.x,v.z,Math.atan2(u.x,u.z),fl]})}
// a building kind, loaded and packed once: meshes merged by material (furniture apart), each door leaf's parts merged
// in its own frame, the furniture's pieces, all in the building's space
function bfKind(id){if(bf.kinds[id])return bf.kinds[id];
  return bf.kinds[id]=bfImport().then(({loader,merge})=>new Promise((ok,no)=>loader.load(BF_SITE+id+'.glb',g=>ok(bfPack(g.scene,merge,bf.lib[id])),undefined,no)))}
// a Daylight dining table's chairs (its 'dining' piece: n a side, one per 2.3 ft of table, 0.45 ft out from its edge,
// one at each end of a table 6 ft or longer), found from the table top (the piece's thinnest mesh), in the item's own feet:
// [x, z, the way the sitter faces] in the building's space
function bfChairs(c){const inv=new THREE.Matrix4().copy(c.matrixWorld).invert(),m=new THREE.Matrix4();let top=null,th=1e9;
  c.traverse(o=>{if(!o.isMesh)return;o.geometry.computeBoundingBox();const b=o.geometry.boundingBox.clone().applyMatrix4(m.multiplyMatrices(inv,o.matrixWorld));if(b.max.y-b.min.y<th){th=b.max.y-b.min.y;top=b}});
  if(!top)return [];const w=top.max.x-top.min.x,d=top.max.z-top.min.z,cx=(top.min.x+top.max.x)/2,cz=(top.min.z+top.max.z)/2,n=Math.max(1,Math.floor(w/2.3)),S=[];
  for(let i=0;i<n;i++){const x=cx-w/2+(i+0.5)*w/n;S.push([x,cz-(d/2+0.45)],[x,cz+(d/2+0.45)])}if(w>=6)S.push([cx-(w/2+0.45),cz],[cx+w/2+0.45,cz]);
  const v=new THREE.Vector3(),C=new THREE.Vector3(cx,0,cz).applyMatrix4(c.matrixWorld);
  return S.map(([x,z])=>{v.set(x,0,z).applyMatrix4(c.matrixWorld);return [v.x,v.z,Math.atan2(C.x-v.x,C.z-v.z)]})}
// the building's materials as the game's own (Phong, core.js M): the GLB comes with PBR ones, which the game's sun and sky
// light far darker (no environment light), so a Forge building stood darker than the game's; its textures, colours and
// glass kept, shine from the roughness, metal from the metalness. Its ceiling lights (Daylight's 'light' pieces) glow
// as the game's lamps do (K.lit's colour)
const BF_GLOW=new THREE.MeshBasicMaterial({color:0xffe2a8}),bfMats=new Map();
// ---------- the buildings' own lights ----------
// Each building's lamps and fixtures that give light come with it from Daylight House Studio (its GAMES.md, "lights" and
// "lighting"): the library entry's `lights` ({id, kind, type 'point'|'spot', position (the bulb), color, lumens, dim,
// range, switch 'auto'|'on'|'off', outdoor, direction and beam for a spot}, in the building's own space, metres) and
// `lighting` ({mode 'auto'|'on'|'off', dim}). A light's switch, or the building's when its own is 'auto': on, off, or
// auto, lit from dusk to dawn by the game's clock with the street lamps (daynight.js `lamp`). A building with no list
// has none. What is lit:
// - its fixture glows in the light's colour (bfLtGlow: a material of its own, dimmer by day when auto), on every level;
// - an outdoor one has a halo after dark, as the placed lamps do (props.js propHaloMat), on every level;
// - the few nearest the camera (within TU.bfLtFar) each hold a real light from a small pool: how many is the Tuning
//   for the Graphics level (TU.bfLtMed, bfLtHigh, bfLtUltra; none on Low or with Graphics, Building lights off), a
//   third of them spotlights (up to 2). A spot with no spotlight left shines as a point light; a point light in a
//   spare spotlight shines down in a wide cone. No shadows from them (`shadows` is not read), so one shines through a
//   wall as far as its range. The pool is in the scene only while a building with lights is shown: adding or taking a
//   light makes three.js build its shaders again, so its size changes only with the setting.
// Only what is drawn: nothing here is saved or touches the ground. The map editor carries them: each is placed from
// its building's own place every third of a second (and bfAfter asks for it at once).
const BF_LT_KEY={low:'bfLtMed',med:'bfLtMed',high:'bfLtHigh',ultra:'bfLtUltra',quest:'bfLtMed'},BF_LT_I=1.2,BF_LT_DECAY=1.3;
const bfLt={pts:[],spots:[],all:[],n:0,t:0,dirty:1,on:0,real:0,glow:new Map(),cam:new THREE.Vector3(),v:new THREE.Vector3(),halos:null,fill:0,fillK:0};
// inside a building whose lights are on, a warm fill (TU.bfLtFill) lights the room as its many fixtures would, beyond
// the few the pool can hold: an ambient light always in the scene (ambient light adds no shader work), up while the
// camera is within a lit building's walls and under its roof, down again outside
const BF_FILL=new THREE.AmbientLight(0xffd6a8,0),BF_FILL_I=0.55;scene.add(BF_FILL);
const bfLtBudget=()=>gfxCur&&gfxCur.bfLt?Math.max(0,Math.min(8,Math.round(TU[BF_LT_KEY[gfxKey]||'bfLtMed']||0))):0;
const bfLtState=(l,G)=>{const s=l.switch==='on'||l.switch==='off'?l.switch:G&&G.mode;return s==='on'||s==='off'?s:'auto'};
// a fixture's glowing material, by colour and whether it follows the dusk (shared by every building)
function bfLtMat(col,auto){const c=new THREE.Color(col||'#ffe2a8'),k=c.getHex()+(auto?'a':'o');let e=bfLt.glow.get(k);
  if(!e){e={m:new THREE.MeshBasicMaterial({color:c.clone()}),c,auto};e.m.name='bfGlow';bfLt.glow.set(k,e)}return e.m}
// which meshes of a model glow: the fixture's node carries its light's id; a ceiling light glows whole, any other the
// part round its bulb (the mesh nearest the light's position, if it is no bigger than a shade: under 3 ft)
function bfLtGlow(root,LS,LG){const by=new Map(LS.map(l=>[l.id,l])),out=new Map(),bx=new THREE.Box3(),v=new THREE.Vector3(),sz=new THREE.Vector3();
  root.traverse(q=>{const u=q.userData,l=u&&u.id!=null&&u.type==='item'?by.get(u.id):null;if(!l)return;const st=bfLtState(l,LG);if(st==='off')return;
    const ms=[];q.traverse(o=>{if(o.isMesh)ms.push(o)});if(!ms.length)return;const mat=bfLtMat(l.color,st==='auto');
    if(u.kind==='light'){for(const o of ms)out.set(o,mat);return}
    if(!Array.isArray(l.position))return;v.fromArray(l.position);let best=null,bd=1e9;
    for(const o of ms){bx.setFromObject(o);bx.getSize(sz);if(Math.max(sz.x,sz.y,sz.z)>0.9)continue;const d=bx.distanceToPoint(v)+sz.length()*0.01;if(d<bd){bd=d;best=o}}
    if(best&&bd<0.6)out.set(best,mat)});
  return out}
// a building kind's lights that are not switched off, ready for the pool: place and aim in its own space, colour,
// strength (the root of its lumens over an 800 lumen bulb's, as Daylight draws it, times its dimmer and the building's;
// an 800 lumen bulb shines BF_LT_I, falling off with distance as the game's room light does, BF_LT_DECAY)
function bfLtPack(LS,LG){const out=[],gd=LG&&LG.dim!=null?Math.max(0,Math.min(2,+LG.dim)):1;
  for(const l of LS||[]){const st=bfLtState(l,LG),p=l.position,k=Math.sqrt((+l.lumens>0?+l.lumens:800)/800)*(l.dim!=null?Math.max(0,Math.min(1,+l.dim)):1)*gd;
    if(st==='off'||!Array.isArray(p)||p.length<3||!(k>0))continue;const dir=l.type==='spot'&&Array.isArray(l.direction)?new THREE.Vector3().fromArray(l.direction):null;
    out.push({id:l.id,p:new THREE.Vector3(+p[0],+p[1],+p[2]),d:dir&&dir.lengthSq()>1e-6?dir.normalize():null,col:new THREE.Color(l.color||'#ffe2a8'),k,
      r:+l.range>0?+l.range:6,ang:Math.min(1.45,Math.max(0.1,(+l.beam||90)*Math.PI/360)),auto:st==='auto',out:!!l.outdoor})}
  return out}
// the pool: n real lights in the scene (dark until held), a third of them spotlights
function bfLtPool(n){if(n===bfLt.n)return;bfLt.n=n;const ns=Math.min(2,Math.floor(n/3)),fit=(A,m,make)=>{
    while(A.length<m){const o=make();o.castShadow=false;scene.add(o);if(o.target)scene.add(o.target);A.push({o,l:null,B:null,k:0,e:0})}
    while(A.length>m){const s=A.pop();scene.remove(s.o);if(s.o.target)scene.remove(s.o.target);s.o.dispose()}};
  fit(bfLt.pts,n-ns,()=>new THREE.PointLight(0xffffff,0,10,BF_LT_DECAY));fit(bfLt.spots,ns,()=>new THREE.SpotLight(0xffffff,0,10,0.6,0.5,BF_LT_DECAY));bfLt.all=bfLt.pts.concat(bfLt.spots)}
// the halos of the outdoor lights of the buildings shown (after one is laid, moved or hidden)
function bfLtHalos(){const P=[],C=[],S=[],F=[],v=bfLt.v;
  for(const L of bf.lots){const B=L.b;if(!B||!B.g.visible)continue;B.g.updateMatrixWorld();
    for(const l of B.K.lights)if(l.out){v.copy(l.p).applyMatrix4(B.g.matrixWorld);P.push(v.x,v.y,v.z);C.push(l.col.r,l.col.g,l.col.b);S.push(Math.max(0.5,Math.min(1.6,0.9*l.k)));F.push(0)}}
  if(!bfLt.halos){if(!P.length)return;bfLt.halos=new THREE.Points(new THREE.BufferGeometry(),propHaloMat);bfLt.halos.frustumCulled=false;bfLt.halos.visible=false;scene.add(bfLt.halos)}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('col',new THREE.Float32BufferAttribute(C,3));
  g.setAttribute('sz',new THREE.Float32BufferAttribute(S,1));g.setAttribute('fx',new THREE.Float32BufferAttribute(F,1));bfLt.halos.geometry.dispose();bfLt.halos.geometry=g}
// each frame from daynight.js: lamp is how dark it is (0 by day, 1 at night), ll the Lamp light tuning
function bfLightTick(lamp,ll,dt){
  for(const e of bfLt.glow.values())e.m.color.copy(e.c).multiplyScalar(e.auto?0.45+0.55*lamp:1);
  if(bfLt.dirty&&bf.lots.length){bfLt.dirty=0;bfLtHalos()}
  if(bfLt.halos)bfLt.halos.visible=lamp>0.01&&bfLt.halos.geometry.attributes.position.count>0;
  // every third of a second: the lit lights nearest the camera take the pool's lights (one that had a light keeps it)
  if((bfLt.t-=dt)<=0){bfLt.t=0.33;const far=TU.bfLtFar,cam=camera.getWorldPosition(bfLt.cam),C=[],v=bfLt.v;let any=false,fill=0;
    for(const L of bf.lots){const B=L.b;if(!B||!B.g.visible||!B.K.lights.length)continue;any=true;
      if(Math.hypot(cam.x-B.g.position.x,cam.z-B.g.position.z)>far+B.rad)continue;B.g.updateMatrixWorld();
      const it=bf.lib[L.id];if(it&&it.width){v.copy(cam);B.g.worldToLocal(v);if(Math.abs(v.x)<it.width/2&&Math.abs(v.z)<it.length/2&&v.y>-0.5&&v.y<8)
        for(const l of B.K.lights){const k=l.auto?lamp:1;if(k>fill)fill=k}}
      for(const l of B.K.lights){if(l.auto&&lamp<=0.01)continue;v.copy(l.p).applyMatrix4(B.g.matrixWorld);const d=v.distanceTo(cam);if(d<far)C.push({l,B,d,x:v.x,y:v.y,z:v.z})}}
    bfLt.fill=fill;C.sort((a,b)=>a.d-b.d);bfLt.on=C.length;bfLtPool(any?bfLtBudget():0);
    const A=bfLt.all,pick=C.slice(0,A.length),free=[];
    for(const s of A){const i=pick.findIndex(c=>c&&c.l===s.l&&c.B===s.B);if(i<0){s.l=null;free.push(s)}else{s.c=pick[i];pick[i]=null}}
    for(const c of pick){if(!c)continue;const want=!!c.l.d,i=Math.max(0,free.findIndex(s=>!!s.o.isSpotLight===want)),s=free.splice(i,1)[0];s.l=c.l;s.B=c.B;s.c=c;s.k=0}
    bfLt.real=0;
    for(const s of A){const l=s.l,c=s.c,o=s.o;if(!l){o.intensity=0;continue}bfLt.real++;
      o.position.set(c.x,c.y,c.z);o.color.copy(l.col);s.e=Math.max(0,Math.min(1,(far-c.d)/5));o.distance=l.r;
      if(o.isSpotLight){if(l.d){v.copy(l.d).transformDirection(s.B.g.matrixWorld);o.angle=l.ang;o.penumbra=0.5;o.distance=l.r*1.35}else{v.set(0,-1,0);o.angle=1.45;o.penumbra=1}
        o.target.position.set(c.x+v.x*5,c.y+v.y*5,c.z+v.z*5)}}}
  // a light comes up over a quarter of a second when it takes one of the pool's, and fades toward the edge of the range
  bfLt.fillK+=(bfLt.fill-bfLt.fillK)*Math.min(1,dt*3);BF_FILL.intensity=bfLt.fillK*(TU.bfLtFill??1)*BF_FILL_I*LI;
  const g=ll*TU.bfLight*BF_LT_I*LI,f=Math.min(1,dt*4);
  for(const s of bfLt.all){const l=s.l;if(!l)continue;s.k=Math.min(1,s.k+f);s.o.intensity=g*l.k*(l.auto?lamp:1)*s.k*s.e*(s.o.isSpotLight&&l.d?1.5:1)}}
function bfPhong(m){if(!m||!m.isMeshStandardMaterial)return m;if(bfMats.has(m))return bfMats.get(m);
  const r=m.roughness??1,mt=m.metalness||0,P=new THREE.MeshPhongMaterial({color:m.color.clone(),map:m.map,normalMap:m.normalMap,emissive:m.emissive.clone(),emissiveMap:m.emissiveMap,
    transparent:m.transparent,opacity:m.opacity,alphaTest:m.alphaTest,side:m.side,depthWrite:m.depthWrite,vertexColors:m.vertexColors,
    shininess:4+Math.pow(1-r,2)*90,specular:mt>0.3?m.color.clone().multiplyScalar(0.5*mt):new THREE.Color(0x111111).lerp(new THREE.Color(0x555555),Math.max(0,0.6-r))});
  if(m.normalMap)P.normalScale.copy(m.normalScale);P.name=m.name;bfMats.set(m,P);return P}
function bfPack(root,merge,it){const col=root.getObjectByName('Collision');if(col)col.removeFromParent();root.updateMatrixWorld(true);
  // its lights (the library entry's, or the same list in the model's own extras.forge.game): with a list, each fixture
  // that is not switched off glows in its light's colour (bfLtGlow); with none, every ceiling light glows as before
  let gm=null;root.traverse(o=>{if(!gm&&o.userData&&o.userData.forge&&o.userData.forge.game)gm=o.userData.forge.game});
  const LS=it&&Array.isArray(it.lights)?it.lights:gm&&Array.isArray(gm.lights)?gm.lights:null,LG=it&&it.lighting||gm&&gm.lighting||null,glow=LS?bfLtGlow(root,LS,LG):null;
  root.traverse(o=>{if(!o.isMesh)return;let lit=false;if(!LS)for(let q=o;q&&q!==root;q=q.parent)if(q.userData&&q.userData.kind==='light')lit=true;
    const fl=it&&BF_FLOOR[it.id]&&/_floor$/i.test(o.name)&&!Array.isArray(o.material)?BF_FLOOR[it.id]:null;
    o.material=fl?bfFloorMat(fl,bfUvPerM(o)):glow&&glow.has(o)?glow.get(o):lit?BF_GLOW:Array.isArray(o.material)?o.material.map(bfPhong):bfPhong(o.material)});
  const plain=g=>{const h=new THREE.BufferGeometry();for(const [n,at] of Object.entries(g.attributes)){const f=new Float32Array(at.count*at.itemSize);
      for(let i=0;i<at.count;i++)for(let k=0;k<at.itemSize;k++)f[i*at.itemSize+k]=at.getComponent(i,k);h.setAttribute(n,new THREE.BufferAttribute(f,at.itemSize))}
    if(g.index)h.setIndex(new THREE.BufferAttribute(Uint32Array.from(g.index.array),1));return h};
  const group=(list,inv)=>{const G=new Map();for(const o of list){const g=o.geometry,k=o.material.uuid+Object.keys(g.attributes).sort().join(',')+(g.index?'+i':'');
      if(!G.has(k))G.set(k,{mat:o.material,list:[]});G.get(k).list.push(plain(g).applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv,o.matrixWorld)))}
    return [...G.values()].map(x=>({mat:x.mat,geo:x.list.length>1?merge(x.list):x.list[0]})).filter(x=>x.geo).map(x=>Object.assign(x,{inside:inside(x.geo)}))};
  // what is all inside the walls and under the roof (floors, inside paint, furniture) takes no shadows: the game's own
  // buildings' rooms stand lit, where the building's own walls and roof would leave a Forge building dark inside
  const BB=new THREE.Box3().setFromObject(root),inside=g=>{const P=g.attributes.position;if(!P)return false;
    for(let i=0;i<P.count;i++){const x=P.getX(i),y=P.getY(i),z=P.getZ(i);if(x<BB.min.x+0.12||x>BB.max.x-0.12||z<BB.min.z+0.12||z>BB.max.z-0.12||y>BB.max.y-0.3)return false}return true};
  const I=new THREE.Matrix4(),stat=[],furn=[],leaves=[],items=[];let F=null;
  root.traverse(o=>{if(o.name==='Furniture'&&!F)F=o;if(o.userData&&o.userData.type==='doorLeaf')leaves.push(o)});
  root.traverse(o=>{if(!o.isMesh)return;let leaf=false,fu=false;for(let q=o;q&&q!==root;q=q.parent){if(q.userData&&q.userData.type==='doorLeaf')leaf=true;if(q===F)fu=true}if(!leaf)(fu?furn:stat).push(o)});
  // each piece of furniture: its kind, floor, box ([x, z, half x, half z, bottom, top], building space) and a dining
  // table's chairs
  if(F)for(const c of F.children){const u=c.userData||{},b=new THREE.Box3().setFromObject(c);if(b.isEmpty())continue;
    items.push({kind:u.kind||'',lvl:u.level||0,box:[(b.min.x+b.max.x)/2,(b.min.z+b.max.z)/2,(b.max.x-b.min.x)/2,(b.max.z-b.min.z)/2,b.min.y,b.max.y],chairs:u.kind==='dining'?bfChairs(c):null,spots:bfKSpots(c,u.kind)})}
  bfSeatAim(items);
  return {stat:group(stat,I),furn:group(furn,I),items,lights:bfLtPack(LS,LG),
    leaves:leaves.map(L=>{const m=L.matrixWorld.clone(),p=new THREE.Vector3(),q=new THREE.Quaternion(),s=new THREE.Vector3();m.decompose(p,q,s);
      const li=m.clone().invert(),parts=[];L.traverse(o=>{if(o.isMesh)parts.push(o)});return {p,q,s,door:L.userData.door,swing:L.userData.swing||1,parts:group(parts,li)}})}}
// every frame (mainTick): each door's leaves follow its door (opened by rmDoorsTick), and furniture shows only near
function bfTick(dt){for(const L of bf.lots){const B=L.b;if(!B||!B.g.visible)continue;const dx=camera.position.x-B.g.position.x,dz=camera.position.z-B.g.position.z;B.furn.visible=dx*dx+dz*dz<BF_NEAR*BF_NEAR;
    for(const D of B.doors){const a=D.d.a;if(a===D.a)continue;D.a=a;for(const l of D.leaves)l.o.quaternion.copy(l.q).multiply(bf.qa.setFromAxisAngle(bf.ay,l.swing*BF_OPEN*a))}}}
// the fixed thing (fixed.js) a place's building is: the smallest building, structure, large thing or site office round its middle
const BF_FX=new Set(['fxbuilding','fxstruct','fxbig','fxoffice']);
function bfItem(L){let best=null;for(const it of FX)if(BF_FX.has(it.t)&&L.x>=it.x0&&L.x<=it.x1&&L.z>=it.z0&&L.z<=it.z1&&(!best||(it.x1-it.x0)*(it.z1-it.z0)<(best.x1-best.x0)*(best.z1-best.z0)))best=it;return best}
// in a box round a ground floor room's outline (inset by m)
const bfIn=(r,x,z,m)=>{const a=r.outline.map(q=>q[0]),b=r.outline.map(q=>q[1]);return x>Math.min(...a)+m&&x<Math.max(...a)-m&&z>Math.min(...b)+m&&z<Math.max(...b)-m};
// where people can stand in the building (its space, floor lvl): in one of the floor's rooms, clear of its walls, the
// stairs and every piece of furniture (but skip)
function bfClear(it,K,lvl,x,z,skip){
  if(!it.rooms.some(r=>r.level===lvl&&bfIn(r,x,z,0.3)))return false;
  for(const [x0,z0,x1,z1,t,l] of it.walls){if((l||0)!==lvl)continue;const ux=x1-x0,uz=z1-z0,L2=ux*ux+uz*uz||1,k=Math.max(0,Math.min(1,((x-x0)*ux+(z-z0)*uz)/L2));if(Math.hypot(x-x0-ux*k,z-z0-uz*k)<t/2+0.32)return false}
  for(const st of it.stairs||[])if(st.level===lvl){const [fx,fz]=st.foot,[hx,hz]=st.head,ux=hx-fx,uz=hz-fz,L2=ux*ux+uz*uz||1,k=Math.max(0,Math.min(1,((x-fx)*ux+(z-fz)*uz)/L2));if(Math.hypot(x-fx-ux*k,z-fz-uz*k)<st.width/2+0.35)return false}
  for(const P of K.items){if(P===skip||P.lvl!==lvl||P.kind==='rug'||P.kind==='porch'||P.kind==='stairs')continue;const [cx,cz,hx,hz]=P.box;if(Math.abs(x-cx)<hx+0.28&&Math.abs(z-cz)<hz+0.28)return false}
  return true}
// the building's spots for its room's people (building space: [x, z, the way they face], sit, staff), as many as the
// game's room had (nStaff of them staff): staff at the counters and desks (on their open side farthest from the door),
// people on the dining chairs and before the shelves, machines and kitchen (nearest the door first), then anywhere clear
function bfSpots(it,K,door,nStaff,nAll){const out=[],used=new Set(),dd=(x,z)=>Math.hypot(x-door[0],z-door[1]),G=K.items.filter(P=>!P.lvl);
  // the pieces that say where people go (Daylight's Commercial ones: counters, the bar, booths, salon stations...):
  // staff first (nearest the front door first), then seats, then places to stand, each clear of the walls and furniture
  // (a seat in its own piece)
  const inRm=(x,z)=>it.rooms.some(r=>!r.level&&bfIn(r,x,z,0.2)),KS=[];
  for(const P of G)if(P.spots)for(const q of P.spots)if(inRm(q[0],q[1])&&(q[3]==='s'||bfClear(it,K,0,q[0],q[1],P)))KS.push(q);
  const near=(a,b)=>dd(a[0],a[1])-dd(b[0],b[1]),fs=KS.filter(q=>q[3]==='f').sort(near);
  let staff=0;for(const q of fs){if(staff>=nStaff)break;out.push({p:q.slice(0,3),staff:1});staff++}
  for(const q of KS.filter(q=>q[3]==='s').concat(KS.filter(q=>!q[3]).sort(near))){if(out.length>=nAll)break;out.push(q[3]==='s'?{p:q.slice(0,3),sit:1,dy:q[4]||0,tb:q[5]||null}:{p:q.slice(0,3)})}
  if(staff>=nStaff&&out.length>=nAll)return out;
  if(staff)for(const P of G)if(P.spots)used.add(P);
  const sides=P=>{const [cx,cz,hx,hz]=P.box,g=0.45;return [[cx,cz+hz+g,Math.PI],[cx,cz-hz-g,0],[cx+hx+g,cz,-Math.PI/2],[cx-hx-g,cz,Math.PI/2]].filter(([x,z])=>bfClear(it,K,0,x,z,P))};
  // then (a building with no such pieces, or not enough) the counters and desks, chairs and the rest
  for(const P of G.filter(P=>BF_STAFF.has(P.kind)).sort((a,b)=>dd(a.box[0],a.box[1])-dd(b.box[0],b.box[1]))){if(staff>=nStaff)break;
    const S=sides(P).sort((a,b)=>dd(b[0],b[1])-dd(a[0],a[1]));if(!S.length)continue;out.push({p:S[0],staff:1});staff++;used.add(P);
    if(S.length>1)out.push({p:S[S.length-1]})}
  for(const P of G)if(P.chairs)for(const c of P.chairs)if(it.rooms.some(r=>!r.level&&bfIn(r,c[0],c[1],0)))out.push({p:c,sit:1});
  for(const P of G.filter(P=>BF_SHOP.has(P.kind)&&!used.has(P)).sort((a,b)=>dd(a.box[0],a.box[1])-dd(b.box[0],b.box[1]))){if(out.length>=nAll)break;const S=sides(P).sort((a,b)=>dd(a[0],a[1])-dd(b[0],b[1]));if(S.length)out.push({p:S[0]})}
  // anywhere clear in the ground floor's rooms, a metre apart, facing the room's middle (staff first if still short)
  for(const r of it.rooms.filter(r=>!r.level)){const a=r.outline.map(q=>q[0]),b=r.outline.map(q=>q[1]);
    for(let x=Math.min(...a)+0.8;x<Math.max(...a)-0.5;x+=1.1)for(let z=Math.min(...b)+0.8;z<Math.max(...b)-0.5;z+=1.1){if(out.length>=nAll)break;
      if(!bfClear(it,K,0,x,z)||out.some(q=>Math.hypot(q.p[0]-x,q.p[1]-z)<0.9))continue;out.push({p:[x,z,Math.atan2(r.center[0]-x,r.center[2]-z)],staff:staff<nStaff?(staff++,1):0})}}
  return out.slice(0,Math.max(nAll,staff))}
// a place's building: drawn, and its walls, floors, stairs, rooms, furniture and doors made in the world, laid where the
// place says, each handed to the fixed thing (its pieces lists, flagged bf) so the map editor carries it; and the spots,
// door frame and furniture its room for townsfolk takes while it is swapped (B.rs)
function bfBuild(L,K,item){const it=bf.lib[L.id],face=L.turn*Math.PI/180,c=Math.cos(face),s=Math.sin(face),ox=L.x,oz=L.z;
  const X=(x,z)=>ox+x*c+z*s,Z=(x,z)=>oz-x*s+z*c,G=fxGather(item),f0=it.levels[0].floorY;
  // its height: on the ground, or on the floor the game's own building stood on (a deck, a raised lot)
  let pt=-1e9;for(const {p} of G.pads){const dx=ox-p.x,dz=oz-p.z,u=dx*p.c-dz*p.s,v=dx*p.s+dz*p.c;if(Math.abs(u)<=p.hx&&Math.abs(v)<=p.hz)pt=Math.max(pt,p.t)}
  const y0=Math.max(rmGroundMax(ox,oz,face,it.width,it.length-1.4)+0.03,pt-f0),fy=i=>y0+(it.levels[i]||it.levels[0]).floorY,nl=it.levels.length;
  const g=new THREE.Group();g.position.set(ox,y0,oz);g.rotation.y=face;const furn=new THREE.Group();g.add(furn);
  for(const x of K.stat){const m=new THREE.Mesh(x.geo,x.mat);m.castShadow=true;m.receiveShadow=!x.inside;g.add(m)}
  for(const x of K.furn){const m=new THREE.Mesh(x.geo,x.mat);m.castShadow=true;m.receiveShadow=!x.inside;furn.add(m)}
  const leaves=new Map();for(const l of K.leaves){const o=new THREE.Object3D();o.position.copy(l.p);o.quaternion.copy(l.q);o.scale.copy(l.s);
    for(const x of l.parts){const m=new THREE.Mesh(x.geo,x.mat);m.castShadow=m.receiveShadow=true;o.add(m)}g.add(o);
    if(!leaves.has(l.door))leaves.set(l.door,[]);leaves.get(l.door).push({o,q:l.q.clone(),swing:l.swing})}
  g.visible=false;scene.add(g);
  const mine={solids:[]},yr=(S,a,b)=>{S.by0=a;S.by1=b;S.y0=a;S.y1=b};
  const solid=(x,z,f,hs,ho,lo,hi,top)=>{rmSolid(X(x,z),Z(x,z),f,hs,ho,top);const S=SOLIDS[SOLIDS.length-1];S.bf=1;yr(S,lo,hi);
    G.solids.push({s:S,o:{x:S.x,z:S.z,hx:S.hx,hz:S.hz,f:Math.atan2(S.sn,S.cs),lx:S.lx,lz:S.lz}});mine.solids.push(S)};
  const pad=(x,z,hx,hz,yaw,t,o)=>{const p=walkPad(X(x,z),Z(x,z),hx,hz,yaw,t,o);p.bf=1;if(o&&o.up)p.up=1;G.pads.push({p,o:{x:p.x,z:p.z,f:yaw,t:p.t}})};
  for(let lv=0;lv<nl;lv++){const W=it.walls.filter(w=>(w[5]||0)===lv);if(!W.length)continue;
    // the floor's walls, standing from it to the next (the ground floor's from below the ground)
    const lo=lv?fy(lv):y0-2,hi=lv+1<nl?fy(lv+1):fy(lv)+it.levels[lv].height+0.3;
    for(const [x0,z0,x1,z1,t] of W){const ux=x1-x0,uz=z1-z0,len=Math.hypot(ux,uz);if(len<0.05)continue;const wx=ux*c+uz*s,wz=-ux*s+uz*c;solid((x0+x1)/2,(z0+z1)/2,Math.atan2(-wz,wx),len/2,t/2+0.04,lo,hi)}
    // its floor (the upper ones stood on only from within a step) and rooms
    const xs=W.flatMap(w=>[w[0],w[2]]),zs=W.flatMap(w=>[w[1],w[3]]),ax=(Math.min(...xs)+Math.max(...xs))/2,az=(Math.min(...zs)+Math.max(...zs))/2;
    pad(ax,az,(Math.max(...xs)-Math.min(...xs))/2,(Math.max(...zs)-Math.min(...zs))/2,face,fy(lv),lv?{up:1}:null);
    for(const r of it.rooms)if(r.level===lv){const a=r.outline.map(q=>q[0]),b=r.outline.map(q=>q[1]),cx=(Math.min(...a)+Math.max(...a))/2,cz=(Math.min(...b)+Math.max(...b))/2;
      const R=rmRoom(X(cx,cz),Z(cx,cz),face,(Math.max(...a)-Math.min(...a))/2,(Math.max(...b)-Math.min(...b))/2,y0+r.floorY,y0+r.ceilingY);R.bf=1;R.clad=it.clad||((it.tags||[]).includes('brick')?'brick':(it.tags||[]).includes('steel')?'steel':'siding');G.rooms.push({r:R,o:{x:R.x,z:R.z,f:R.f,y:R.y,top:R.top}})}
    // its furniture (a porch a floor to stand on; rugs and stairs left to the floor)
    for(const P of K.items){if(P.lvl!==lv)continue;const [x,z,hx,hz,b0,b1]=P.box;
      if(P.kind==='porch'||P.kind==='deck'){if(!lv)pad(x,z,hx,hz,face,fy(0));continue}
      if(P.kind==='stairs'||P.kind==='rug'||b1-b0<0.3||hx>3||hz>3)continue;solid(x,z,face,hx,hz,y0+b0-0.05,y0+b1,y0+b1)}}
  // the stairs: a floor rising from one level to the next, foot to head
  for(const st of it.stairs||[]){const [fx,fz]=st.foot,[hx,hz]=st.head,ux=hx-fx,uz=hz-fz,len=Math.hypot(ux,uz),wx=ux*c+uz*s,wz=-ux*s+uz*c,a=fy(st.level),b=fy(st.up);
    pad((fx+hx)/2,(fz+hz)/2,st.width/2,len/2,Math.atan2(wx,wz),a,{rise:b-a})}
  // the doors with leaves: each one of RM_DOORS (kind bf: its hinge's foot and the way it faces out), its leaves following
  const doors=[];for(const d of it.doors){const ls=leaves.get(d.id);if(!ls)continue;const n=d.normal,fo=face+Math.atan2(n[0],n[2]),hw=d.width/2;
    const mx=X(d.center[0],d.center[2]),mz=Z(d.center[0],d.center[2]),D=rmDoor('bf',mx-Math.cos(fo)*hw,fy(d.level||0),mz+Math.sin(fo)*hw,fo,d.width);D.bf=1;
    G.doors.push({d:D,o:{x:D.x,z:D.z,f:D.f,y:D.y}});doors.push({d:D,a:0,leaves:ls,id:d.id})}
  // the game's own room for townsfolk in this building (not an outdoor one), the one with the most spots
  const W0=it.walls.filter(w=>!w[5]),inBox=(x,z)=>x>=item.x0-1&&x<=item.x1+1&&z>=item.z0-1&&z<=item.z1+1;
  const gameR=TF_ROOMS.filter(R=>!R.grp&&!R.ground&&R.spots&&R.spots.length&&inBox(R.x,R.z)).sort((a,b)=>b.spots.length-a.spots.length)[0]||null;
  let rs=null;if(gameR){const fdoors=it.doors.filter(d=>!d.level&&d.exterior&&leaves.has(d.id)),fd=fdoors.find(d=>d.normal[2]>0.7)||fdoors[0];
    const door=fd?[fd.center[0],fd.center[2]]:[0,0],nStaff=gameR.spots.filter(q=>q.staff).length,nAll=gameR.spots.length;
    rs={spots:[],y:fy(0)};
    for(const q of bfSpots(it,K,door,nStaff,nAll)){const [x,z,yl]=q.p,sp={x:X(x,z),z:Z(x,z),y:fy(0)+(q.dy||0),yaw:face+yl};if(q.sit)sp.sit=1;if(q.dy)sp.dy=q.dy;if(q.tb){sp.tf=q.tb[0];sp.th=q.tb[1]}if(q.staff)sp.staff=1;sp.bf=1;rs.spots.push(sp);G.spots.push({sp,o:{x:sp.x,z:sp.z,y:sp.y,yaw:sp.yaw}})}
    // a shop's: its frame looks out through the front door (rmKit: o out, s across) with its middle dO behind it, deep
    // enough to reach the back wall; R.sol the walls, stairs and furniture in that frame
    if(gameR.dO!=null&&fd&&fd.normal[2]>0.7){const dx0=fd.center[0],dz0=fd.center[2],back=Math.min(...W0.flatMap(w=>[w[1],w[3]])),dO=(dz0-back)/2+0.3,K0=rmKit(null,X(dx0,dz0-dO),Z(dx0,dz0-dO),fy(0),face),sol=[];
      const box=(cx,cz,hx,hz)=>sol.push([cz-(dz0-dO),cx-dx0,hx,hz]);
      for(const [x0,z0,x1,z1,t] of W0)box((x0+x1)/2,(z0+z1)/2,Math.abs(x1-x0)/2+t/2,Math.abs(z1-z0)/2+t/2);
      for(const st of it.stairs||[])if(!st.level){const [fx,fz]=st.foot,[hx,hz]=st.head;box((fx+hx)/2,(fz+hz)/2,Math.abs(hx-fx)/2+st.width/2,Math.abs(hz-fz)/2+st.width/2)}
      for(const P of K.items)if(!P.lvl&&P.kind!=='rug'&&P.kind!=='porch'&&P.kind!=='stairs')box(P.box[0],P.box[1],P.box[2],P.box[3]);
      Object.assign(rs,{x:K0.x,z:K0.z,f:face,P:K0.P,dO,W:it.width/2+Math.abs(dx0),sol,at0:{x:K0.x,z:K0.z}})}}
  L.b={g,furn,doors,gameR,rs,o:{x:ox,z:oz,y:y0,f:face},mine,K,rad:Math.hypot(it.width,it.length)/2};item.bf=L;bfLt.dirty=1}
// a game room given the building's spots and door frame while it is swapped (on), its own put back after; whoever was
// in it or on the way leaves first
const BF_RKEYS=['spots','dO','W','sol','P','x','z','f','y'];
function bfRoomSet(B,on){const R=B.gameR;if(!R||!B.rs||!!R.bfOn===on)return;
  if(typeof tf!=='undefined')for(const p of tf.people.slice())if(p.room===R||(p.go||p.goTo)&&(p.go||p.goTo).R===R)tfDrop(p);
  if(on){R.bfOrig={};for(const k of BF_RKEYS)R.bfOrig[k]=R[k];for(const k of BF_RKEYS)if(k in B.rs)R[k]=B.rs[k]}
  else{for(const k of BF_RKEYS)R[k]=R.bfOrig[k];delete R.bfOrig}
  for(const sp of R.spots)sp.who=null;R.n=0;R.cInc=0;R.live=0;delete R.ent;R.bfOn=on?1:0}
// after fxApply has laid a fixed thing (moved, turned, hidden or home): on a swapped one, the game's own pieces taken
// out (all but its sign) and the building laid with it; on one swapped back, the building's pieces taken out instead
function bfAfter(it,a){const L=it.bf;if(!L||!L.b)return;const B=L.b,gone=!a||!!a.hd,on=bfWant(L.area),show=on&&!gone,G=fxGather(it),away=e=>e.bf;
  const r=gone?0:a.yaw,c=Math.cos(r),s=Math.sin(r),dx=gone?0:a.x-it.cx,dz=gone?0:a.z-it.cz,dy=gone?0:baseHeight(a.x,a.z)-baseHeight(it.cx,it.cz),
    at=(x,z)=>[it.cx+(x-it.cx)*c+(z-it.cz)*s+dx,it.cz-(x-it.cx)*s+(z-it.cz)*c+dz];
  B.g.visible=show;bfRoomSet(B,show);bfLt.dirty=1;bfLt.t=0;
  if(show){const [x,z]=at(B.o.x,B.o.z);B.g.position.set(x,B.o.y+dy,z);B.g.rotation.y=B.o.f+r;for(const S of B.mine.solids){S.y0=S.by0+dy;S.y1=S.by1+dy}
    if(B.rs&&B.rs.at0){const [rx,rz]=at(B.rs.at0.x,B.rs.at0.z),R=B.gameR,f=B.o.f+r,sf=Math.sin(f),cf=Math.cos(f);R.x=rx;R.z=rz;R.f=f;R.y=B.rs.y+dy;R.P=(o,q)=>[rx+sf*o+cf*q,rz+cf*o-sf*q]}}
  if(gone)return;
  // which side is out of the world: the game's (swapped) or the building's (not)
  const out=e=>on?!away(e):away(e);
  for(const {s:S} of G.solids)if(out(S)){S.x+=1e5}
  for(const {p} of G.pads)if(out(p))fxPadPut(p,p.x+1e5,p.z,Math.atan2(p.s,p.c),p.t);
  for(const {r:R} of G.rooms)if(out(R))R.x+=1e5;
  for(const {d} of G.doors)if(out(d)){d.x+=1e5;if(d.i>=0)rmDoorPut(d)}
  for(const {sp} of G.spots)if(out(sp)){sp.x+=1e5;if(sp.who&&typeof tfDrop==='function')tfDrop(sp.who)}
  if(!on)return;
  for(const T of G.tris){if(T.F.m.userData.sign)continue;const PA=T.F.m.geometry.attributes.position.array;
    for(const i of T.list)for(let v=0;v<9;v+=3){PA[i+v]+=1e5;PA[i+v+1]-=500}T.F.m.geometry.attributes.position.needsUpdate=true;T.F.bfDirty=1}
  for(const {l} of G.lamps)l[1]=-600;if(G.lamps.length){bf.lamps=1;fxApply.lamps=1}
  for(const {O} of G.objs)if(!O.o.userData.sign)O.o.visible=false}
function bfFlush(){for(const F of FX_MESH)if(F.bfDirty){F.bfDirty=0;F.m.geometry.computeBoundingSphere();F.m.geometry.computeBoundingBox()}if(bf.lamps){bf.lamps=0;fxLampsSync()}}
// on or off by area (gfxApply, and once at load): the library and the places the first time, each kind when first
// wanted, then every building laid again whose setting changed
async function bfSync(){if(typeof FX==='undefined'||!FX.length)return;const gen=++bf.gen;
  if(!bfWant('town')&&!bfWant('homes')&&!bf.lots.length)return;
  try{if(!bf.lib){const get=async u=>{const r=await fetch(BF_SITE+u);if(!r.ok)throw new Error(u+' '+r.status);return r.json()};
      const [lib,pl]=await Promise.all([get('library.json'),get(BF_PLACES)]);bf.lib=Object.fromEntries(lib.buildings.map(b=>[b.id,b]));bf.places=pl.places.filter(p=>bf.lib[p.id])}
    const todo=bf.places.filter(p=>bfWant(p.area)&&!p.built),K={};
    for(const id of new Set(todo.map(p=>p.id)))K[id]=await bfKind(id);if(gen!==bf.gen)return;
    for(const p of todo){p.built=1;const L=Object.assign({},p),item=bfItem(L);if(!item||item.bf)continue;bfBuild(L,K[L.id],item);bf.lots.push(L)}}
  catch(e){console.warn('Building Forge: the town not loaded',e);return}
  const as=new Map();for(const a of assets)if(FX_KN[a.t])as.set(a.c,a);
  for(const L of bf.lots){const item=FX.find(x=>x.bf===L),on=bfWant(L.area);if(!item||L.on===on)continue;L.on=on;fxApply(item,as.get(item.id)||null)}
  for(const F of FX_MESH)if(F.dirty){F.dirty=0;F.bfDirty=1}bfFlush()}
bfSync();
// Daylight House Studio's See it in game (#daylight=ID&at=X,Z, the game's metres; Daylight's js/forge.js): the map
// editor opened at that spot once the island has loaded, the game's own building there picked, then, on High and Ultra
// once the town from Building Forge is built (up to 2 minutes, while nothing else has been picked), the Building Forge
// building standing nearest X, Z. The other way is the editor's Edit in Daylight (editor.js, #forge=ID&at=X,Z).
function bfFromDaylight(){const m=location.hash.match(/^#daylight=([a-z0-9_]+)&at=(-?[\d.]+),(-?[\d.]+)/);if(!m)return;
  history.replaceState(null,'',location.pathname+location.search);const id=m[1],x=+m[2],z=+m[3],t0=performance.now(),gen=bfFromDaylight.gen=(bfFromDaylight.gen||0)+1;
  const near=f=>{let best=null,bd=1e9;for(const a of assets){const it=fxOf(a);if(!it||a.hd||!f(it))continue;const d=Math.hypot(a.x-x,a.z-z);if(d<bd){bd=d;best=a}}return best&&{a:best,d:bd}};
  const forge=()=>near(it=>it.bf&&it.bf.id===id),name=L=>L.name||bf.lib&&bf.lib[id]&&bf.lib[id].name||id;
  const pick=a=>{edAllGo({a});return a};
  const go=()=>{if(gen!==bfFromDaylight.gen)return;if(!LOADP.done||bench.on){if(performance.now()-t0<120000)setTimeout(go,400);return}
    if(edOn)edSelSet([]);else editorOpen();if(!edOn)return;
    const hit=forge();if(hit){pick(hit.a);toast(say('edFromDaylight',{name:name(fxOf(hit.a).bf)}),'',4000);return}
    const own=near(it=>BF_FX.has(it.t)),mine=own&&own.d<15?pick(own.a):null;if(!mine){edFlyTo(x,z);ed.dist=60}
    if(!bfWant('town')&&!bfWant('homes')){toast(say('edFromDaylightNear'),'',4000);return}
    // the town from Building Forge still being built: its building picked when it is, unless something else was
    const later=()=>{if(gen!==bfFromDaylight.gen||!edOn)return;const s=ed.sel;if(s.length>1||s.length===1&&s[0].a!==mine)return;
      const h=forge();if(h){pick(h.a);toast(say('edFromDaylight',{name:name(fxOf(h.a).bf)}),'',4000);return}
      if(performance.now()-t0<120000)setTimeout(later,500)};
    later()};
  go()}
bfFromDaylight();
// Daylight opens its See it in game in the same tab each time (named corleys-island): a new #daylight= goes there too
window.addEventListener('hashchange',()=>{if(/^#daylight=/.test(location.hash))bfFromDaylight()});
