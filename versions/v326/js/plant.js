// Corley's Island: planting trees. On foot, Plant (7) sets a nursery sapling of the chosen species (8 picks the next)
// in front of the worker; Plant next to one of your own digs it up again. Each tree remembers the date it went in, and
// how tall it is comes from that species' real height-for-age curve (treeHeightAt, trees.js) at the game clock's date
// (dn.t, daynight.js), so slide ☰ Time's Date ahead and they grow from sapling to full grown. Three models per species
// stand in for the growth stages (a sapling, a young pole tree and the island's own full-grown one), each scaled to the
// tree's true height between them. Planted trees save in bhd_plant, which syncs between devices like the site.
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.
const PLANT_KEY='bhd_plant',PLANT_CAP=400,PLANT_YR=365.25*86400000,PLANT_AGE0=2;
// the growth stages: the tallest a tree is drawn with each model (m), and the models' own shapes per species (trees.js
// builders); the full-grown stage is the species' island model
const PLANT_STAGE_TOP=[2.4,6,1e9],PLANT_STAGES=['Sapling','Young','Full grown'];
const PLANT_FORMS={
  spruce:[hi=>treeSpruce(hi,{H:1.3,R:0.42,tr:0.025,y0:0.12,dy:0.45,seed:7}),hi=>treeSpruce(hi,{H:4.2,R:1.15,tr:0.09,y0:0.25,dy:0.75,seed:13})],
  redpine:[hi=>treeRedPine(hi,{H:1.4,cf:0.12,tr:0.03,nl:7,seed:7}),hi=>treeRedPine(hi,{H:4.6,cf:0.2,tr:0.1,nl:10,seed:13})],
  oak:[hi=>treeBroad(hi,{fol:'oak',seed:311,trunk:0.7,rad:0.022,limbs:3,limbLen:0.45,out:1.0,spread:0.8,lift:0.1,wob:0.5,cy:1.15,rx:0.5,ry:0.45,clumps:28,size:0.42,stems:1,leader:true,tw:0.15,rmin:0.004}),
    hi=>treeBroad(hi,{fol:'oak',seed:321,trunk:1.5,rad:0.09,limbs:4,limbLen:1.3,out:1.0,spread:0.75,lift:0.08,wob:0.7,cy:3.0,rx:1.6,ry:1.3,clumps:90,size:0.9,stems:1,leader:true,tw:0.5,rmin:0.02})],
  maple:[hi=>treeBroad(hi,{seed:411,trunk:0.8,rad:0.02,limbs:3,limbLen:0.4,out:0.6,spread:0.55,lift:0.2,wob:0.4,cy:1.25,rx:0.4,ry:0.5,clumps:28,size:0.42,stems:1,leader:true,tw:0.15,rmin:0.004}),
    hi=>treeBroad(hi,{seed:421,trunk:1.7,rad:0.08,limbs:4,limbLen:1.4,out:0.6,spread:0.55,lift:0.2,wob:0.45,cy:3.2,rx:1.3,ry:1.5,clumps:100,size:0.95,stems:1,leader:true,tw:0.5,rmin:0.02})],
  birch:[hi=>treeBroad(hi,{fol:'birch',seed:511,trunk:0.9,rad:0.018,limbs:3,limbLen:0.35,out:0.5,spread:0.5,lift:0.12,wob:0.3,cy:1.3,rx:0.35,ry:0.5,clumps:26,size:0.38,stems:1,leader:true,tw:0.15,rmin:0.004}),
    hi=>treeBroad(hi,{fol:'birch',seed:521,trunk:2.4,rad:0.06,limbs:3,limbLen:1.1,out:0.5,spread:0.5,lift:0.12,wob:0.3,cy:3.4,rx:0.95,ry:1.4,clumps:90,size:0.8,stems:2,so:0.1,leader:true,tw:0.4,rmin:0.02})]};
// what you've planted: [{k species, x, z, yaw, t (game time it went in, ms), c:[r,g,b] foliage tint}]; sp: the species Plant sets
const plant={list:[],sp:0,sig:'',dirty:true,lodX:1e9,lodZ:1e9,mapYr:0};
try{const d=JSON.parse(localStorage.getItem(PLANT_KEY)||'null');if(d&&Array.isArray(d.trees)){plant.list=d.trees.filter(a=>a&&isFinite(a.x)&&isFinite(a.z)&&isFinite(a.t)&&TREE_SP[a.k]);plant.sp=TREE_SP[d.sp]?d.sp:0}}catch(e){}
function plantSave(){try{localStorage.setItem(PLANT_KEY,JSON.stringify({v:1,sp:plant.sp,trees:plant.list.map(a=>({k:a.k,x:+a.x.toFixed(2),z:+a.z.toFixed(2),yaw:+a.yaw.toFixed(3),t:Math.round(a.t),c:a.c.map(v=>+v.toFixed(3))}))}))}catch(e){}}
// a shadow hull from a model's foliage: a cone for the pines, an ellipsoid for the leaf trees (as treeHull, trees.js)
function plantHull(g,cone){g.computeBoundingBox();const b=g.boundingBox,h=b.max.y,rx=Math.max(b.max.x-b.min.x,b.max.z-b.min.z)/2*0.8,y0=Math.max(0.05,b.min.y);
  return treeHull(cone?['cone',rx,y0,h]:['ball',rx,(h-y0)/2*0.85,(h+y0)/2])}
// per species, per stage: the near and far models (wood and foliage) and a shadow hull, all instanced; h is the
// model's own height, which the tree's true height divides to give its scale
const PLANT_M=(()=>{const hullMat=new THREE.MeshBasicMaterial({colorWrite:false,depthWrite:false});
  const mk=(g,m,col)=>{const im=new THREE.InstancedMesh(g,m,PLANT_CAP);im.count=0;im.visible=false;im.frustumCulled=false;im.receiveShadow=true;
    if(col)im.instanceColor=new THREE.InstancedBufferAttribute(new Float32Array(PLANT_CAP*3),3);scene.add(im);return im};
  return TREE_SP.map(sp=>{const cone=sp.t==='pine',st=PLANT_FORMS[sp.id].map(f=>{const H=f(true),L=f(false);H.fol.computeBoundingBox();
      return{h:H.fol.boundingBox.max.y,hi:[mk(H.wood,treeMats[sp.wood]),mk(H.fol,treeMats.fol,true)],lo:[mk(L.wood,treeMats[sp.wood]),mk(L.fol,treeMats.fol,true)],hull:plantHull(H.fol,cone)}});
    st.push({h:sp.h,hi:[mk(sp.hi[0].geometry,treeMats[sp.wood]),mk(sp.hi[1].geometry,treeMats.fol,true)],lo:[mk(sp.lo[0].geometry,treeMats[sp.wood]),mk(sp.lo[1].geometry,treeMats.fol,true)],hull:treeHull(sp.hull)});
    for(const S of st){S.sh=new THREE.InstancedMesh(S.hull,hullMat,PLANT_CAP);S.sh.count=0;S.sh.visible=false;S.sh.castShadow=true;S.sh.frustumCulled=false;scene.add(S.sh)}
    return st})})();
// a planted tree at game time t: how old (yr, null before it went in), how tall (m) and which stage
function plantGrowth(a,t){if(t<a.t)return null;const age=PLANT_AGE0+(t-a.t)/PLANT_YR,H=Math.max(0.3,treeHeightAt(TREE_BIO[TREE_SP[a.k].id],age));
  return{age,H,st:PLANT_STAGE_TOP.findIndex(m=>H<m)}}
// lay every planted tree into its species' stage models, near or far by the Graphics setting's tree distance
function plantBuild(){const o=new THREE.Object3D(),R2=treeNearR*treeNearR,cx=camera.position.x,cz=camera.position.z,col=new THREE.Color();
  plant.lodX=cx;plant.lodZ=cz;for(const st of PLANT_M)for(const S of st)S.n=[0,0,0];
  for(const a of plant.list){const G=plantGrowth(a,dn.t);if(!G)continue;const S=PLANT_M[a.k][G.st],w=hash(a.x*1.3+0.7,a.z*2.1+0.3),w2=hash(a.z*1.7,a.x*0.9);
    o.position.set(a.x,surfAt(a.x,a.z)-0.03,a.z);o.rotation.set((w-0.5)*0.05,a.yaw,(w2-0.5)*0.05);o.scale.setScalar(G.H/S.h);o.updateMatrix();
    const f=(a.x-cx)*(a.x-cx)+(a.z-cz)*(a.z-cz)<R2?0:1,ims=f?S.lo:S.hi,j=S.n[f]++;
    for(const m of ims)m.setMatrixAt(j,o.matrix);ims[1].setColorAt(j,col.setRGB(a.c[0],a.c[1],a.c[2]));S.sh.setMatrixAt(S.n[2]++,o.matrix)}
  for(const st of PLANT_M)for(const S of st){[[S.hi,S.n[0]],[S.lo,S.n[1]],[[S.sh],S.n[2]]].forEach(([ims,c])=>{for(const m of ims){m.count=c;m.visible=c>0;
    m.instanceMatrix.needsUpdate=true;if(m.instanceColor)m.instanceColor.needsUpdate=true}})}}
// every frame (the map editor's too): the island's trees grown to the date (treeRegrow, trees.js), the site map's trees
// redrawn once the date settles a year or more from what it shows; then the planted ones rebuilt when the date has moved
// a few hours, a tree went in or out, or the camera has moved on
function plantTick(){treeRegrow();
  if(!dn.dragD&&Math.abs(treeAheadNow-plant.mapYr)>=1)plantMapDirty();
  if(!plant.list.length&&!plant.dirty)return;const sig=Math.floor(dn.t/(6*3600000));
  if(plant.dirty||sig!==plant.sig||Math.hypot(camera.position.x-plant.lodX,camera.position.z-plant.lodZ)>Math.max(4,treeNearR*0.06)){plant.dirty=false;plant.sig=sig;plantBuild()}}
// the site map draws trees into its tiles (maps.js): start them again
function plantMapDirty(){plant.mapYr=treeAheadNow;if(typeof mapReset==='function'){mapReset();mapDirty=true}}
// a planted tree in or out: draw, save and map it
function plantChanged(){plant.dirty=true;plantSave();plantMapDirty()}
// the tint a new tree takes, like the island's own (treeEntry, trees.js)
function plantTint(k,x,z){const w=hash(x*2.7+1.1,z*1.9-0.4),v=0.9+0.2*hash(z*1.7,x*0.9);
  if(TREE_SP[k].t==='pine'){const p=ASSET_PT[Math.floor(w*4)%4];return p.map(c=>c*v)}
  return treeLeafTint(k,Math.floor(w*6)%6,v)}
// Plant: a sapling 4 ft in front of the worker, or dig up your own tree if one stands within 3 ft of that spot
function plantHere(){if(mode!=='walk'||wk.inside){toast(say('plantWalk',{}),'',2200);return}
  const x=wk.x+Math.sin(wk.yaw)*1.2,z=wk.z+Math.cos(wk.yaw)*1.2;
  const best=plantNear(x,z,1);
  if(best>=0){const a=plant.list.splice(best,1)[0],G=plantGrowth(a,dn.t);plantChanged();
    toast(say('plantUp',{tree:TREE_SP[a.k].name,age:Math.max(1,Math.round(G?G.age:PLANT_AGE0))}),'',2400);return}
  if(plant.list.length>=PLANT_CAP){toast(say('plantFull',{n:PLANT_CAP}),'bad',2400);return}
  if(!plantSpotOk(x,z)){toast(say('plantWet',{}),'bad',2200);return}
  const k=plant.sp;plant.list.push(plantNew(k,x,z,dn.t));plantChanged();
  toast(say('plantIn',{tree:TREE_SP[k].name,date:dnDate(dn.t)}),'good',3200)}
function plantNext(){plant.sp=(plant.sp+1)%TREE_SP.length;plantSave();plantKindUI();toast(say('plantKind',{tree:TREE_SP[plant.sp].name}),'',1800)}
// the Plant button on foot, and the Date row's button naming (and stepping) the tree Plant sets
function plantKindUI(){const b=$('#plantKindBtn');if(b)b.textContent=TREE_SP[plant.sp].name.replace(/^./,c=>c.toUpperCase())}
plantKindUI();
$('#plantBtn').addEventListener('pointerdown',e=>{e.preventDefault();plantHere()});
$('#plantKindBtn').onclick=()=>plantNext();
// dry ground above the lake, not standing water
function plantSpotOk(x,z){const w=waterAt(x,z);return surfAt(x,z)>=WATER+0.05&&!(w&&w.d>0.15)}
// a new planted tree of species k at x, z, put in at game time t
function plantNew(k,x,z,t){return{k,x,z,yaw:hash(x*3.1,z*1.3)*6.283,t,c:plantTint(k,x,z)}}
// the planted tree standing within r metres of x, z (the nearest; -1 if none)
function plantNear(x,z,r){let best=-1,bd=r;plant.list.forEach((a,i)=>{const d=Math.hypot(a.x-x,a.z-z);if(d<bd&&dn.t>=a.t){bd=d;best=i}});return best}
// the planted trees' census for the Time row: how many, and the stages they're at
function plantCount(){const c=[0,0,0];let n=0;for(const a of plant.list){const G=plantGrowth(a,dn.t);if(G){c[G.st]++;n++}}return{n,c}}
