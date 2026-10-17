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
// a ring buffer of instanced clods; each sits on the ground under it and hides once that ground is back to grade
const CLOD_BASE=4000,clodMat=M(0xffffff);
let clods=null,cX,cZ,cS,cR,cN=0,cHead=0,clodAcc=0;
function buildClods(){
  if(clods){scene.remove(clods);clods.geometry.dispose()}
  const n=CLOD_BASE*DIRT;
  clods=new THREE.InstancedMesh(lumpGeo(0,0.3,1.7),clodMat,n);clods.receiveShadow=true;clods.frustumCulled=false;scene.add(clods);
  cX=new Float32Array(n);cZ=new Float32Array(n);cS=new Float32Array(n);cR=new Float32Array(n);
  for(let i=0;i<n;i++){clods.setMatrixAt(i,ZERO);clods.setColorAt(i,dCol.setRGB(0.5,0.35,0.2))}
  clearClods();
}
function clearClods(){cN=0;cHead=0;clodAcc=0;if(clods)clods.count=0}
function placeClod(i){
  const x=cX[i],z=cZ[i],s=cS[i],k=Math.round((z+S/2)/CELL)*V+Math.round((x+S/2)/CELL);
  if(!s||Math.abs(H[k]-H0[k])<0.02){clods.setMatrixAt(i,ZERO);return}
  dO.position.set(x,hAt(x,z)+s*0.25,z);dO.rotation.set(cR[i]*0.7,cR[i],cR[i]*1.3);dO.scale.set(s,s*0.75,s*1.1);dO.updateMatrix();
  clods.setMatrixAt(i,dO.matrix);
}
function addClod(x,z,size,c){
  if(Math.abs(x)>S/2-0.2||Math.abs(z)>S/2-0.2)return;
  const i=cHead;cHead=(cHead+1)%cX.length;if(cN<cX.length)cN++;
  cX[i]=x;cZ[i]=z;cS[i]=size;cR[i]=Math.random()*6.283;
  const v=0.7+0.42*Math.random();clods.setColorAt(i,dCol.setRGB(c[0]*v,c[1]*v,c[2]*v));clods.instanceColor.needsUpdate=true;
  placeClod(i);clods.count=cN;clods.instanceMatrix.needsUpdate=true;
}
// n clods (fractions carry over) scattered within r of x,z; big scales their size
function dropClods(x,z,r,n,c,big){
  clodAcc+=n;
  while(clodAcc>=1){clodAcc--;const a=Math.random()*6.283,d=r*Math.sqrt(Math.random())*0.9;
    addClod(x+Math.cos(a)*d,z+Math.sin(a)*d,(0.03+Math.random()*0.08)*(big||1),c)}
}
// the bucket takes the clods it digs through
function clodsDug(x,z,r){let any=false;
  for(let i=0;i<cN;i++){if(!cS[i])continue;const dx=cX[i]-x,dz=cZ[i]-z;if(dx*dx+dz*dz<r*r){cS[i]=0;clods.setMatrixAt(i,ZERO);any=true}}
  if(any)clods.instanceMatrix.needsUpdate=true}
// after the ground under rows ja..jb changes, set those clods back on it
function snapClods(ja,jb){if(!cN)return;
  const z0=ja*CELL-S/2-CELL,z1=jb*CELL-S/2+CELL;let any=false;
  for(let i=0;i<cN;i++){const z=cZ[i];if(z<z0||z>z1)continue;placeClod(i);any=true}
  if(any)clods.instanceMatrix.needsUpdate=true}

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
        if(k>=0&&k<V*V)addClod(pp.x,pp.z,0.02+Math.random()*0.04,matColor(k,matAt(k,H[k]-0.01)))}
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
  const n=200*DIRT;heapClods=new THREE.InstancedMesh(lumpGeo(0,0.3,4.2),clodMat,n);heapClods.frustumCulled=false;bedG.add(heapClods);
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
