// Backhoe Dig: loose dirt: clods on spoil, trench floors and cave-ins, flying dirt, and the lumpy bucket load and truck
// heap, all scaled by the Dirt detail setting (1x, 2x, 4x in the menu).
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.
let DIRT=1;
const dO=new THREE.Object3D(),ZERO=new THREE.Matrix4().makeScale(0,0,0),dCol=new THREE.Color();
// a lumpy low-poly rock: an icosahedron pushed in and out per vertex (same position in, same position out, so no cracks)
function lumpGeo(detail,amp,seed){const g=new THREE.IcosahedronGeometry(1,detail),p=g.attributes.position;
  for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i);
    const n=1+amp*(0.5*Math.sin(x*3.1+y*4.7+seed)+0.3*Math.sin(y*7.3-z*5.9+seed*2.1)+0.2*Math.sin(z*13.7+x*11.3+seed*3.7));
    p.setXYZ(i,x*n,y*n*0.82,z*n)}
  g.computeVertexNormals();return g}

// ---------- clods ----------
// each soil breaks its own way: the top few inches of topsoil come up as sod with grass on it, deeper topsoil and loose
// fill as crumbs, clay as blocky lumps, rock as sharp pieces, and sand runs without clods. Each kind is a ring buffer of
// instanced clods that sit on the ground under them and hide once that ground is back to grade.
const SOD=0,CRUMB=1,CLAY=2,ROCK=3,CRUMB_MIX=[0,1,0,0];
// clod kind for soil m dug at depth d below grade (-1: sand, no clods)
function clodKind(m,d){return m===0?(d<0.12?SOD:CRUMB):m===1?CLAY:m===2?-1:m===3?ROCK:CRUMB}
// a geometry with every vertex moved by a function of its position (so shared corners stay shared) and flat normals
function warpGeo(g,f){g=g.index?g.toNonIndexed():g;const p=g.attributes.position;
  for(let i=0;i<p.count;i++){const v=f(p.getX(i),p.getY(i),p.getZ(i));p.setXYZ(i,v[0],v[1],v[2])}g.computeVertexNormals();return g}
const jit=(x,y,z,a)=>a*Math.sin(x*12.9+y*78.2+z*37.7)*0.5;
function colorGeo(g,fn){const p=g.attributes.position,c=new Float32Array(p.count*3);
  for(let i=0;i<p.count;i++){const col=fn(p.getX(i),p.getY(i),p.getZ(i));c.set(col,i*3)}g.setAttribute('color',new THREE.BufferAttribute(c,3));return g}
function joinGeo(list){let n=0;for(const g of list)n+=g.attributes.position.count;
  const P=new Float32Array(n*3),Nn=new Float32Array(n*3),C=new Float32Array(n*3);let o=0;
  for(const g of list){P.set(g.attributes.position.array,o*3);Nn.set(g.attributes.normal.array,o*3);C.set(g.attributes.color.array,o*3);o+=g.attributes.position.count}
  const m=new THREE.BufferGeometry();m.setAttribute('position',new THREE.BufferAttribute(P,3));m.setAttribute('normal',new THREE.BufferAttribute(Nn,3));m.setAttribute('color',new THREE.BufferAttribute(C,3));return m}
// sod: a flat lump of dark topsoil with a mat of grass blades on top (vertex coloured, so instances tint it lightly)
function sodGeo(){
  const base=colorGeo(warpGeo(new THREE.IcosahedronGeometry(1,0),(x,y,z)=>{const n=1+0.25*Math.sin(x*3.1+z*4.7);return [x*n,Math.min(y,0.35)*0.5*n,z*n]}),
    (x,y)=>y>0.15?[0.24,0.34,0.15]:[0.30,0.21,0.13]);
  const bp=[];for(let b=0;b<9;b++){const a=b*2.4,r=0.25+0.45*((b*0.37)%1),x=Math.cos(a)*r,z=Math.sin(a)*r,w=0.09,h=0.35+0.25*((b*0.61)%1),c=Math.cos(a+1),s=Math.sin(a+1);
    bp.push(x-c*w,0.16,z-s*w, x+c*w,0.16,z+s*w, x+0.08,0.16+h,z+0.05)}
  const blades=new THREE.BufferGeometry();blades.setAttribute('position',new THREE.Float32BufferAttribute(bp,3));blades.computeVertexNormals();
  colorGeo(blades,(x,y)=>y>0.3?[0.36,0.56,0.25]:[0.28,0.46,0.2]);
  return joinGeo([base,blades])}
const CLODS=[
  {geo:sodGeo,mat:M(0xffffff,{vertexColors:true,side:THREE.DoubleSide}),pool:500,s:[0.12,0.22],dump:70,bite:20,flat:true},
  {geo:()=>lumpGeo(0,0.3,1.7),mat:M(0xffffff),pool:4000,s:[0.03,0.11],dump:150,bite:60},
  {geo:()=>warpGeo(new THREE.BoxGeometry(1,0.7,0.9,2,1,2),(x,y,z)=>[x+jit(x,y,z,0.35),y+jit(z,x,y,0.3),z+jit(y,z,x,0.35)]),mat:M(0xffffff),pool:1200,s:[0.06,0.17],dump:45,bite:12},
  {geo:()=>warpGeo(new THREE.DodecahedronGeometry(1,0),(x,y,z)=>{const n=1+jit(x,y,z,0.6);return [x*n,y*n*0.7,z*n]}),mat:M(0xffffff,{shininess:20}),pool:500,s:[0.04,0.12],dump:60,bite:30}];
const KIND_COL=[[1,1,1],null,SOIL[1].c,SOIL[3].c];
let clodAcc=[0,0,0,0];
function buildClods(){
  for(const k of CLODS){
    if(k.mesh){scene.remove(k.mesh);k.mesh.geometry.dispose()}
    const n=k.pool*DIRT;k.mesh=new THREE.InstancedMesh(k.geo(),k.mat,n);k.mesh.receiveShadow=true;k.mesh.frustumCulled=false;scene.add(k.mesh);
    k.x=new Float32Array(n);k.z=new Float32Array(n);k.sz=new Float32Array(n);k.r=new Float32Array(n);
    for(let i=0;i<n;i++){k.mesh.setMatrixAt(i,ZERO);k.mesh.setColorAt(i,dCol.setRGB(1,1,1))}
  }
  clearClods();
}
function clearClods(){for(const k of CLODS){k.n=0;k.head=0;if(k.mesh)k.mesh.count=0}clodAcc=[0,0,0,0]}
function placeClod(k,i){
  const x=k.x[i],z=k.z[i],s=k.sz[i],g=Math.round((z+S/2)/CELL)*V+Math.round((x+S/2)/CELL);
  if(!s||Math.abs(H[g]-H0[g])<0.02){k.mesh.setMatrixAt(i,ZERO);return}
  const r=k.r[i];dO.position.set(x,hAt(x,z)+s*(k.flat?0.1:0.25),z);
  // sod mostly lands grass up; about one in four flips
  if(k.flat)dO.rotation.set((r%1)<0.25?Math.PI+r*0.2:r*0.25-0.4,r*7,r*0.3-0.2);else dO.rotation.set(r*0.7,r,r*1.3);
  dO.scale.set(s,s*0.75,s*1.1);dO.updateMatrix();k.mesh.setMatrixAt(i,dO.matrix);
}
function addClod(kind,x,z,size,c){
  if(Math.abs(x)>S/2-0.2||Math.abs(z)>S/2-0.2)return;
  const k=CLODS[kind],i=k.head;k.head=(k.head+1)%k.x.length;if(k.n<k.x.length)k.n++;
  k.x[i]=x;k.z[i]=z;k.sz[i]=size;k.r[i]=Math.random()*6.283;
  const v=kind===SOD?0.85+0.25*Math.random():0.7+0.42*Math.random();k.mesh.setColorAt(i,dCol.setRGB(c[0]*v,c[1]*v,c[2]*v));k.mesh.instanceColor.needsUpdate=true;
  placeClod(k,i);k.mesh.count=k.n;k.mesh.instanceMatrix.needsUpdate=true;
}
// n clods of one kind (fractions carry over) scattered within r of x,z; big scales their size
function dropClods(kind,x,z,r,n,c,big){
  if(kind<0)return;const k=CLODS[kind];clodAcc[kind]+=n;
  while(clodAcc[kind]>=1){clodAcc[kind]--;const a=Math.random()*6.283,d=r*Math.sqrt(Math.random())*0.9;
    addClod(kind,x+Math.cos(a)*d,z+Math.sin(a)*d,(k.s[0]+Math.random()*(k.s[1]-k.s[0]))*(big||1),c)}
}
// clods for a volume v of dirt whose make-up is mix (shares of sod, crumb, clay, rock; the rest is sand); crumbs take col
function dropMix(x,z,r,v,mix,col,rate){for(let q=0;q<4;q++)if(mix[q]>0.001)dropClods(q,x,z,r,v*mix[q]*CLODS[q][rate],q===CRUMB?col:KIND_COL[q])}
// the bucket takes the clods it digs through
function clodsDug(x,z,r){for(const k of CLODS){let any=false;
  for(let i=0;i<k.n;i++){if(!k.sz[i])continue;const dx=k.x[i]-x,dz=k.z[i]-z;if(dx*dx+dz*dz<r*r){k.sz[i]=0;k.mesh.setMatrixAt(i,ZERO);any=true}}
  if(any)k.mesh.instanceMatrix.needsUpdate=true}}
// after the ground under rows ja..jb changes, set those clods back on it
function snapClods(ja,jb){const z0=ja*CELL-S/2-CELL,z1=jb*CELL-S/2+CELL;
  for(const k of CLODS){if(!k.n)continue;let any=false;
    for(let i=0;i<k.n;i++){const z=k.z[i];if(z<z0||z>z1)continue;placeClod(k,i);any=true}
    if(any)k.mesh.instanceMatrix.needsUpdate=true}}

// ---------- flying dirt ----------
// only live particles are drawn (packed to the front each frame); a third of those that land become clods
const PART_BASE=360,pGeo=new THREE.DodecahedronGeometry(0.075,1),pMat=M(0x6e4628);
let pInst=null,parts=[],pi=0;
function buildParticles(){
  if(pInst)scene.remove(pInst);
  const n=PART_BASE*DIRT;pInst=new THREE.InstancedMesh(pGeo,pMat,n);pInst.frustumCulled=false;pInst.count=0;scene.add(pInst);
  parts=[];for(let i=0;i<n;i++)parts.push({m:new THREE.Object3D(),v:new THREE.Vector3(),on:false});pi=0;
}
function spawn(p,spread){
  for(let n=0;n<2*DIRT;n++){const q=parts[pi=(pi+1)%parts.length];q.on=true;q.m.position.copy(p);
    q.v.set((Math.random()-0.5)*spread,Math.random()*0.6,(Math.random()-0.5)*spread);q.m.rotation.set(Math.random()*3,Math.random()*3,0);
    q.m.scale.setScalar(0.55+Math.random()*0.75)}
}
function particlesTick(dt){
  let n=0;
  for(const p of parts){if(!p.on)continue;p.v.y-=9.8*dt;const pp=p.m.position;pp.addScaledVector(p.v,dt);
    if(inBed(pp)&&tl.y<heapTop()){p.on=false;continue}
    if(pp.y<hAt(pp.x,pp.z)){p.on=false;
      if(Math.random()<0.35){const k=Math.round((pp.z+S/2)/CELL)*V+Math.round((pp.x+S/2)/CELL);
        if(k>=0&&k<V*V){const m=matAt(k,H[k]-0.01);if(m!==2)addClod(CRUMB,pp.x,pp.z,0.02+Math.random()*0.04,matColor(k,m))}}
      continue}
    p.m.rotation.x+=dt*4;p.m.updateMatrix();pInst.setMatrixAt(n++,p.m.matrix)}
  pInst.count=n;if(n)pInst.instanceMatrix.needsUpdate=true;
}

// ---------- bucket load and truck heap ----------
const LOAD_DETAIL={1:7,2:10,4:15};
function heapY(x,z){const e=Math.max(Math.abs(x)/1.05,Math.abs(z)/2.05);
  return -0.5+(1-0.65*e*e)+0.07*Math.sin(x*5.1+z*3.7)+0.05*Math.cos(z*6.3)
    +0.035*Math.sin(x*13.1+z*2.3)*Math.sin(z*11.7-x*1.9)+0.02*Math.sin(x*29.3+z*23.9)}
function heapGeometry(){const k=Math.sqrt(DIRT),g=new THREE.BoxGeometry(2.1,1,4.1,Math.round(36*k),1,Math.round(64*k)),pa=g.attributes.position;
  for(let i=0;i<pa.count;i++)if(pa.getY(i)>0)pa.setY(i,heapY(pa.getX(i),pa.getZ(i)));
  g.computeVertexNormals();return g}
// clods riding the truck heap: each shows once the load passes its own fill level
let heapClods=null,hcU,hcV,hcS,hcT,hcLast=-1;
function buildHeapClods(){
  if(heapClods){bedG.remove(heapClods);heapClods.geometry.dispose()}
  const n=200*DIRT;heapClods=new THREE.InstancedMesh(lumpGeo(0,0.3,4.2),CLODS[CRUMB].mat,n);heapClods.frustumCulled=false;bedG.add(heapClods);
  hcU=new Float32Array(n);hcV=new Float32Array(n);hcS=new Float32Array(n);hcT=new Float32Array(n);
  for(let i=0;i<n;i++){let u,v;do{u=(Math.random()*2-1)*1.0;v=(Math.random()*2-1)*2.0}while(Math.max(Math.abs(u)/1.05,Math.abs(v)/2.05)>0.92);
    hcU[i]=u;hcV[i]=v;hcS[i]=0.04+Math.random()*0.09;hcT[i]=Math.random();heapClods.setColorAt(i,dCol.setRGB(0.5,0.35,0.2))}
  hcLast=-1;
}
function updateHeapClods(){
  const f=heap.visible?tr.load/TRUCK_CAP:0;if(Math.abs(f-hcLast)<0.004)return;hcLast=f;
  const sx=heap.scale.x,sy=heap.scale.y,sz=heap.scale.z,y0=heap.position.y,c=tr.loadC;
  for(let i=0;i<hcU.length;i++){
    if(f<=0.04+hcT[i]*0.85){heapClods.setMatrixAt(i,ZERO);continue}
    const s=hcS[i];dO.position.set(hcU[i]*sx,y0+sy*heapY(hcU[i],hcV[i])+s*0.2,heap.position.z+hcV[i]*sz);
    dO.rotation.set(hcT[i]*5,hcT[i]*9,hcT[i]*3);dO.scale.set(s,s*0.75,s*1.1);dO.updateMatrix();heapClods.setMatrixAt(i,dO.matrix);
    const v=0.7+0.4*hcT[i];heapClods.setColorAt(i,dCol.setRGB(c[0]*v,c[1]*v,c[2]*v))}
  heapClods.instanceMatrix.needsUpdate=true;heapClods.instanceColor.needsUpdate=true;
}

// ---------- the setting ----------
function setDirtLevel(L){
  DIRT=[1,2,4].includes(+L)?+L:1;
  buildClods();buildParticles();buildHeapClods();
  const lg=lumpGeo(LOAD_DETAIL[DIRT],0.2,0.6);lg.scale(0.42,0.42,0.42);loadMesh.geometry.dispose();loadMesh.geometry=lg;
  heap.geometry.dispose();heap.geometry=heapGeometry();
  document.querySelectorAll('.sizes button[data-d]').forEach(b=>b.setAttribute('aria-pressed',+b.dataset.d===DIRT));
  try{localStorage.setItem('bhd_dirt',DIRT)}catch(e){}
}
document.querySelectorAll('.sizes button[data-d]').forEach(b=>b.onclick=()=>setDirtLevel(b.dataset.d));
try{setDirtLevel(localStorage.getItem('bhd_dirt')||1)}catch(e){setDirtLevel(1)}
