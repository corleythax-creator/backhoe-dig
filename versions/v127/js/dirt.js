// Corley's Island: loose dirt: clods on spoil, trench floors and cave-ins, flying dirt, and the lumpy bucket load and truck
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
  const x=k.x[i],z=k.z[i],s=k.sz[i],g=Math.round(gJ(z))*V+Math.round(gI(x));
  if(!s||Math.abs(H[g]-H0[g])<0.02){k.mesh.setMatrixAt(i,ZERO);return}
  const r=k.r[i];dO.position.set(x,hAt(x,z)+s*(k.flat?0.1:0.25),z);
  // sod mostly lands grass up; about one in four flips
  if(k.flat)dO.rotation.set((r%1)<0.25?Math.PI+r*0.2:r*0.25-0.4,r*7,r*0.3-0.2);else dO.rotation.set(r*0.7,r,r*1.3);
  dO.scale.set(s,s*0.75,s*1.1);dO.updateMatrix();k.mesh.setMatrixAt(i,dO.matrix);
}
function addClod(kind,x,z,size,c){
  if(!inDig(x,z,0.2))return;
  [x,z]=rollClod(x,z,size,kind);
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
function snapClods(ja,jb){const z0=gZ(ja)-CELL,z1=gZ(jb)+CELL;
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
    if(pp.y<surfAt(pp.x,pp.z)){p.on=false;if(pp.y>hAt(pp.x,pp.z)+0.02)continue;
      if(Math.random()<0.35){const k=Math.round(gJ(pp.z))*V+Math.round(gI(pp.x));
        if(k>=0&&k<V*V){const m=matAt(k,H[k]-0.01);if(m!==2)addClod(CRUMB,pp.x,pp.z,0.02+Math.random()*0.04,matColor(k,m))}}
      continue}
    p.m.rotation.x+=dt*4;p.m.updateMatrix();pInst.setMatrixAt(n++,p.m.matrix)}
  pInst.count=n;if(n)pInst.instanceMatrix.needsUpdate=true;
}

// ---------- bucket load and truck heap ----------
const LOAD_DETAIL={1:7,2:10,4:15,16:31};
function heapY(x,z){const e=Math.max(Math.abs(x)/1.05,Math.abs(z)/(BED_L/2-0.1));
  return -0.5+(1-0.65*e*e)+0.07*Math.sin(x*5.1+z*3.7)+0.05*Math.cos(z*6.3)
    +0.035*Math.sin(x*13.1+z*2.3)*Math.sin(z*11.7-x*1.9)+0.02*Math.sin(x*29.3+z*23.9)}
function heapGeometry(){const k=Math.sqrt(DIRT),g=new THREE.BoxGeometry(2.1,1,BED_L-0.2,Math.round(36*k),1,Math.round(64*k)),pa=g.attributes.position;
  for(let i=0;i<pa.count;i++)if(pa.getY(i)>0)pa.setY(i,heapY(pa.getX(i),pa.getZ(i)));
  g.computeVertexNormals();return g}
// clods riding the truck heap: each shows once the load passes its own fill level
let heapClods=null,hcU,hcV,hcS,hcT,hcLast=-1;
function buildHeapClods(){
  if(heapClods){bedG.remove(heapClods);heapClods.geometry.dispose()}
  const n=200*DIRT;heapClods=new THREE.InstancedMesh(lumpGeo(0,0.3,4.2),CLODS[CRUMB].mat,n);heapClods.frustumCulled=false;bedG.add(heapClods);
  hcU=new Float32Array(n);hcV=new Float32Array(n);hcS=new Float32Array(n);hcT=new Float32Array(n);
  for(let i=0;i<n;i++){let u,v;do{u=(Math.random()*2-1)*1.0;v=(Math.random()*2-1)*(BED_L/2-0.15)}while(Math.max(Math.abs(u)/1.05,Math.abs(v)/(BED_L/2-0.1))>0.92);
    hcU[i]=u;hcV[i]=v;hcS[i]=0.04+Math.random()*0.09;hcT[i]=Math.random();heapClods.setColorAt(i,dCol.setRGB(0.5,0.35,0.2))}
  hcLast=-1;
}
function updateHeapClods(){
  const f=heap.visible?Math.max(tr.load,tr.stuck||0)/TU.trCap:0;if(Math.abs(f-hcLast)<0.004)return;hcLast=f;
  const sx=heap.scale.x,sy=heap.scale.y,sz=heap.scale.z,y0=heap.position.y,c=tr.loadC;
  for(let i=0;i<hcU.length;i++){
    if(f<=0.04+hcT[i]*0.85){heapClods.setMatrixAt(i,ZERO);continue}
    const s=hcS[i];dO.position.set(hcU[i]*sx,y0+sy*heapY(hcU[i],hcV[i])+s*0.2,heap.position.z+hcV[i]*sz);
    dO.rotation.set(hcT[i]*5,hcT[i]*9,hcT[i]*3);dO.scale.set(s,s*0.75,s*1.1);dO.updateMatrix();heapClods.setMatrixAt(i,dO.matrix);
    const v=0.7+0.4*hcT[i];heapClods.setColorAt(i,dCol.setRGB(c[0]*v,c[1]*v,c[2]*v))}
  heapClods.instanceMatrix.needsUpdate=true;heapClods.instanceColor.needsUpdate=true;
}

// ---------- the setting ----------
function setDirtLevel(L,save){
  DIRT=[1,2,4,16].includes(+L)?+L:1;
  buildClods();buildParticles();buildHeapClods();buildDust();
  const lg=lumpGeo(LOAD_DETAIL[DIRT],0.2,0.6);lg.scale(0.42,0.42,0.42);loadMesh.geometry.dispose();loadMesh.geometry=lg;
  heap.geometry.dispose();heap.geometry=heapGeometry();
  document.querySelectorAll('.sizes button[data-d]').forEach(b=>b.setAttribute('aria-pressed',+b.dataset.d===DIRT));
  if(save!==false)try{localStorage.setItem('bhd_dirt',DIRT)}catch(e){}
}

// ---------- rolling and ruts ----------
// a clod dropped on a face steeper than about 27 degrees rolls downhill; big ones roll farther, so piles sort themselves
function rollClod(x,z,size,k){const steps=Math.round(size/0.1*(k===SOD?5:14));
  for(let n=0;n<steps;n++){const e=0.12,gx=(hAt(x+e,z)-hAt(x-e,z))/(2*e),gz=(hAt(x,z+e)-hAt(x,z-e))/(2*e),g=Math.hypot(gx,gz);
    if(g<0.5)break;x-=gx/g*0.08;z-=gz/g*0.08;if(n===3)dirtRattle({x,y:hAt(x,z),z})}
  return [x,z]}
// tracks and tyres press loose fill down by up to 30% of its height (comp: how much of that each point has had; fresh fill
// resets it) and crush the clods under them. In mud (mudOf, water.js) they sink up to 9 in below grade instead, in a
// rounded rut printed with the tread (rutDepth), and squeeze what they push aside into lumpy berms along both edges
// (rutBerm: up to about 8 in, more mud than that squelches away); the mud then slumps until no face is steeper than
// about 40 degrees (rutSlump), so driving back and forth churns the ground into soft ridges. Returns 0 when nothing gave
// way, 1 for loose fill, 2 for mud.
const comp=new Float32Array(V*V);let crushT=0;
const RUT_BERM=0.45,RUT_BH=0.2,RUT_MUD=0.15,RUT_SLOPE=0.85,MUD_C=[0.29,0.2,0.13],rutB=[];let tuftBox=null,tuftT=0;
// smooth value noise at scale sc metres (0 to 1): lumps that span several cells, never a lone spike
function vnoise(x,z,sc){const fx=x/sc,fz=z/sc,i=Math.floor(fx),j=Math.floor(fz),u=fx-i,v=fz-j,a=u*u*(3-2*u),b=v*v*(3-2*v);
  return (hash(i,j)*(1-a)+hash(i+1,j)*a)*(1-b)+(hash(i,j+1)*(1-a)+hash(i+1,j+1)*a)*b}
// share of the full rut depth at v across a print of half width hw: flat in the middle, rounding up to the edges, with
// tread bars every 0.48 m along the ground (al: the point's distance along the heading): straight grousers under the
// excavator's tracks (half width under 0.28 m), chevrons under the truck's tyres
function rutDepth(v,hw,al){const e=Math.abs(v)/hw,ch=hw<0.28?0:Math.abs(v)*0.9;
  return (1-e*e*e*e)*(0.78+0.22*Math.cos(6.2832*(al+ch)/0.48))}
// churned mud shows darker and wetter down in a rut, lighter where it was squeezed up (d: height above grade)
const rutShade=d=>d<0?1-0.3*ss(0.03,0.2,-d):1+0.2*ss(0.03,0.18,d);
// room for squeezed mud at a point av-hw outside the print's edge: a ridge that peaks a third of the way out and dies
// away by RUT_BERM, in lumps about 1 to 2 ft long
function rutBerm(out,x,z){const t=out/RUT_BERM;
  return RUT_BH*ss(0,0.3,t)*(1-ss(0.4,1,t))*(0.45+0.75*vnoise(x,z,0.55)+0.35*vnoise(x+7.3,z-3.1,0.27))}
// soft mud flows: wherever two neighbouring muddy points' heights above or below grade differ by more than RUT_SLOPE
// per cell, part of the difference moves down (volume kept; the slope of the ground itself doesn't count), a few passes over the box just churned
function rutSlump(i0,i1,j0,j1){const lim=RUT_SLOPE*CELL;i1=Math.min(N-1,i1);j1=Math.min(N-1,j1);
  const flow=(k,k2)=>{if(prot[k2])return;const d=H[k]-H0[k]-H[k2]+H0[k2],ad=Math.abs(d);if(ad<=lim)return;
    const hi=d>0?k:k2,lo=d>0?k2:k;if(Math.abs(H[hi]-H0[hi])>0.45||Math.abs(H[lo]-H0[lo])>0.45)return;
    const a=(ad-lim)*0.3;H[hi]-=a;H[lo]+=a;mixSpoil(lo,MUD_C,a);mudA[lo]=Math.max(mudA[lo],mudA[hi]*0.9);comp[lo]=0};
  for(let pass=0;pass<3;pass++)for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){const k=j*V+i;
    if(mudA[k]<0.05||prot[k])continue;flow(k,k+1);flow(k,k+V)}}
function stampRut(x,z,yaw,hw,hl,dt){
  // tracks and tyres lay the grass flat (scenery.js)
  grassCrush(x,z,yaw,hw,hl,6,1,dt);
  const s=Math.sin(yaw),c=Math.cos(yaw),R=Math.hypot(hw+RUT_BERM,hl);let any=0,outL=0,outR=0,mSum=0,mN=0;rutB.length=0;
  const i0=Math.max(0,Math.floor(gI(x-R))),i1=Math.min(N,Math.ceil(gI(x+R))),j0=Math.max(0,Math.floor(gJ(z-R))),j1=Math.min(N,Math.ceil(gJ(z+R)));
  for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){const wx=gX(i),wz=gZ(j),dx=wx-x,dz=wz-z,u=dx*s+dz*c,v=dx*c-dz*s,av=Math.abs(v);
    if(Math.abs(u)>hl||av>hw+RUT_BERM)continue;const k=j*V+i;if(prot[k])continue;
    if(av>hw){const room=rutBerm(av-hw,wx,wz)-(H[k]-H0[k]);if(room>0)rutB.push(k,v,room);continue}
    const loose=H[k]-H0[k],m=mudOf(k);
    if(m>RUT_MUD&&loose<0.45){const d=Math.min(0.5*dt,H[k]-(H0[k]-TU.rutDepth*Math.min(1,m*1.25)*rutDepth(v,hw,wx*s+wz*c)));
      if(d>0){H[k]-=d;if(v<0)outL+=d;else outR+=d;mSum+=m;mN++;wetT[k]=timeU.value;comp[k]=0;mudA[k]=Math.max(mudA[k],m);any=2}continue}
    if(loose<0.02||comp[k]>=1)continue;
    const full=loose/(1-0.3*comp[k])*0.3,d=Math.min(0.25*dt,full*(1-comp[k]));H[k]-=d;comp[k]=Math.min(1,comp[k]+d/full);any=any||1}
  // the squeezed mud: each side's share goes to its berm, more where there is more room under each lump's height; berms are
  // half as wet as the mud they came from, so tracks carry mud only a little way onto dry ground
  if(outL+outR>0){let wL=0,wR=0;for(let n=0;n<rutB.length;n+=3)if(rutB[n+1]<0)wL+=rutB[n+2];else wR+=rutB[n+2];
    const m=mSum/mN;
    for(let n=0;n<rutB.length;n+=3){const k=rutB[n],w=rutB[n+1]<0?(wL?outL/wL:0):(wR?outR/wR:0),a=Math.min(1,w)*rutB[n+2];if(a<=0)continue;
      H[k]+=a;mixSpoil(k,MUD_C,a);comp[k]=0;mudA[k]=Math.max(mudA[k],m*0.5)}
    rutSlump(i0,i1,j0,j1);growDug(i0,i1,j0,j1);tuftBox=tuftBox?[Math.min(tuftBox[0],i0),Math.max(tuftBox[1],i1),Math.min(tuftBox[2],j0),Math.max(tuftBox[3],j1)]:[i0,i1,j0,j1]}
  // grass tufts in the churned ground go, a few times a second (each refresh walks every tuft)
  if(tuftBox&&timeU.value-tuftT>0.3){tuftT=timeU.value;updateTufts(...tuftBox);tuftBox=null}
  // past the dig zone's edge the mud tiles take the ruts (mud.js)
  if(!inDig(x,z,R)){const fr=farRut(x,z,yaw,hw,hl,dt);if(fr){any=Math.max(any,fr);tuftFarMark(x-R,x+R,z-R,z+R)}}
  if(crushT<=0){for(const kd of CLODS){let hit=false;
    for(let n=0;n<kd.n;n++){if(!kd.sz[n])continue;const dx=kd.x[n]-x,dz=kd.z[n]-z;if(dx*dx+dz*dz>R*R)continue;
      const u=dx*s+dz*c,v=dx*c-dz*s;if(Math.abs(u)<hl&&Math.abs(v)<hw){kd.sz[n]=0;kd.mesh.setMatrixAt(n,ZERO);hit=true}}
    if(hit)kd.mesh.instanceMatrix.needsUpdate=true}}
  return any}

// ---------- dust ----------
// soft round puffs that rise, spread and drift downwind as they fade; one draw for all of them, capped at the 4x amount
const DUST_BASE=300,WIND=[0.35,0,0.12];
let dustN=0,dustPts=null,dP,dV,dA,dS,dC,dLife,dAge,dHead=0,dustAcc=0;
const dustMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{uScale:{value:400}},
  vertexShader:'attribute float aA;attribute float aS;attribute vec3 aC;varying float vA;varying vec3 vC;uniform float uScale;\nvoid main(){vA=aA;vC=aC;vec4 mv=modelViewMatrix*vec4(position,1.0);gl_PointSize=aS*uScale/max(0.1,-mv.z);gl_Position=projectionMatrix*mv;}',
  fragmentShader:'varying float vA;varying vec3 vC;\nvoid main(){vec2 d=gl_PointCoord-0.5;float r=dot(d,d)*4.0;if(r>1.0)discard;gl_FragColor=vec4(vC,vA*(1.0-r)*(1.0-r));}'});
function buildDust(){
  if(dustPts){scene.remove(dustPts);dustPts.geometry.dispose()}
  dustN=DUST_BASE*Math.min(DIRT,4);const g=new THREE.BufferGeometry();
  dP=new Float32Array(dustN*3);dA=new Float32Array(dustN);dS=new Float32Array(dustN);dC=new Float32Array(dustN*3);
  dV=new Float32Array(dustN*3);dLife=new Float32Array(dustN);dAge=new Float32Array(dustN).fill(1e9);
  g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(dustN*3),3));g.setAttribute('aA',new THREE.BufferAttribute(new Float32Array(dustN),1));
  g.setAttribute('aS',new THREE.BufferAttribute(new Float32Array(dustN),1));g.setAttribute('aC',new THREE.BufferAttribute(new Float32Array(dustN*3),3));
  g.setDrawRange(0,0);dustPts=new THREE.Points(g,dustMat);dustPts.frustumCulled=false;dustPts.renderOrder=2;scene.add(dustPts);dHead=0;
}
function clearDust(){if(dAge)dAge.fill(1e9);dustAcc=0}
// n puffs (fractions carry over) at x,y,z, tinted toward soil colour c
function dustPuff(x,y,z,n,c){
  dustAcc+=n*Math.min(DIRT,4);
  while(dustAcc>=1){dustAcc--;const i=dHead;dHead=(dHead+1)%dustN;
    dP[i*3]=x+(Math.random()-0.5)*0.6;dP[i*3+1]=y+Math.random()*0.3;dP[i*3+2]=z+(Math.random()-0.5)*0.6;
    dV[i*3]=(Math.random()-0.5)*0.5;dV[i*3+1]=0.2+Math.random()*0.35;dV[i*3+2]=(Math.random()-0.5)*0.5;
    dAge[i]=0;dLife[i]=2.2+Math.random()*2;const cc=c||SOIL[SPOIL].c;
    dC[i*3]=0.55+cc[0]*0.45;dC[i*3+1]=0.48+cc[1]*0.45;dC[i*3+2]=0.4+cc[2]*0.45}
}
function dustTick(dt){
  const g=dustPts.geometry,P=g.attributes.position.array,A=g.attributes.aA.array,Sz=g.attributes.aS.array,C=g.attributes.aC.array;let n=0;
  for(let i=0;i<dustN;i++){if(dAge[i]>=dLife[i])continue;dAge[i]+=dt;const t=dAge[i]/dLife[i];if(t>=1)continue;
    for(let a=0;a<3;a++){dV[i*3+a]+=(WIND[a]-dV[i*3+a])*Math.min(1,dt*0.8);dP[i*3+a]+=dV[i*3+a]*dt}
    P[n*3]=dP[i*3];P[n*3+1]=dP[i*3+1];P[n*3+2]=dP[i*3+2];C[n*3]=dC[i*3];C[n*3+1]=dC[i*3+1];C[n*3+2]=dC[i*3+2];
    A[n]=0.22*Math.min(1,t*6)*(1-t);Sz[n]=0.3+1.2*Math.sqrt(t);n++}
  g.setDrawRange(0,n);
  if(n){g.attributes.position.needsUpdate=true;g.attributes.aA.needsUpdate=true;g.attributes.aS.needsUpdate=true;g.attributes.aC.needsUpdate=true}
  dustMat.uniforms.uScale.value=renderer.domElement.height/(2*Math.tan(camera.fov*Math.PI/360));
}

// ---------- dirt that sticks ----------
// the bucket, the tracks and the truck tyres get their own copies of their materials so dirt can build up on them
const MUD=new THREE.Color(0.36,0.26,0.17);let grimeMats=null;
function grimeTick(){
  if(!grimeMats){if(!texMixU.value)return;grimeMats=[];
    const own=(mesh,base,kind)=>{const m=base.clone();mesh.material=m;grimeMats.push({m,base,kind})};
    for(const c of bucketP.children)if(c.isMesh&&(c.material===STEEL||c.material===STEEL_L))own(c,c.material,'bucket');
    for(const c of machine.children)if(c.isMesh&&c.material===RUBBER)own(c,RUBBER,'track');
    for(const w of wheels)for(const c of w.children)if(c.isMesh&&c.material===RUBBER)own(c,RUBBER,'tire')}
  for(const g of grimeMats){const a=g.kind==='bucket'?st.grime*0.65:g.kind==='track'?st.mud*0.7:tr.mud*0.7;
    g.m.color.copy(g.base.color).lerp(MUD,a)}
}

// ---------- sticky clay ----------
// share of a load that clings when it is tipped out: moist clay (near its plastic limit) sticks most, dry clay crumbles
// out and slop slides; topsoil carries a little clay
function stickFrac(mix,wet){return TU.clayStick*Math.min(1,mix[CLAY]+0.2*mix[SOD])*Math.max(0,0.3+0.7*ss(0.1,0.45,wet)-0.45*ss(0.75,1,wet))}
// shaking it out: reversing the curl (or the bed) fast, or slamming it into its stop, knocks part of what clings loose,
// more the further it is tipped; tipped, it also creeps out slowly. o holds stuck and the joint's last speed (jv), the
// way it last moved fast (jd) and the time since (jt); v: its speed now, fast: what counts as fast, stop: at its stop,
// tip 0-1. Returns the volume that falls; o.jolt is set on a shake
function shakeOut(o,v,fast,stop,tip,dt){
  let j=0;
  if(Math.abs(v)>fast){const d=Math.sign(v);if(o.jd&&d!==o.jd&&o.jt<0.35)j=1;o.jd=d;o.jt=0}else o.jt=(o.jt||0)+dt;
  if(stop&&Math.abs(o.jv||0)>fast&&Math.abs(v)<fast*0.3)j=1.3;
  o.jv=v;o.jolt=j>0&&tip>0.15&&o.stuck>0.0005;
  if(!(o.stuck>0))return 0;
  return Math.min(o.stuck,o.stuck*(0.03*tip*dt+(o.jolt?TU.clayShake*j*tip:0)));
}
// a shaken-out cake lands as big clay lumps
function shakeClods(x,z,v){dropClods(CLAY,x,z,0.45,v*60*DIRT,KIND_COL[CLAY],1.7)}

// ---------- clay packed in the undercarriage ----------
// working wet clay, the tracks carry it up between the rollers and pack it onto the track frames, most while turning
// (the pads scrub sideways). Packed tracks run tight: they drag and turn slower. It drops off in clumps as the tracks
// flex, faster on firm ground and when the tracks are rocked back and forth, and slowly as it dries; what packs in comes
// off the ground under the tracks and what drops lands as lumps, so no dirt is made or lost. st.pack: m3 packed,
// st.packC: its colour
const PACK_CAP=0.3,PACK_N=56,packMesh=(()=>{const m=new THREE.InstancedMesh(CLODS[CLAY].geo(),M(0xffffff),PACK_N),R=Math.random,o=new THREE.Object3D();
  m.castShadow=true;m.count=0;machine.add(m);
  for(let i=0;i<PACK_N;i++){const s=i%2?1:-1,f=R();
    if(f<0.7)o.position.set(s*(1.1+(R()<0.6?0.27:-0.27)),0.15+R()*0.5,(R()*2-1)*1.5);
    else if(f<0.85)o.position.set(s*(1.1+(R()-0.5)*0.4),0.82,(R()*2-1)*1.4);
    else o.position.set(s*(1.1+(R()-0.5)*0.4),0.25+R()*0.35,(R()<0.5?-1:1)*(1.95+R()*0.06));
    o.rotation.set(R()*6,R()*6,R()*6);const sz=0.06+R()*0.1;o.scale.set(sz*1.3,sz,sz*1.6);o.updateMatrix();m.setMatrixAt(i,o.matrix);m.setColorAt(i,dCol.setRGB(1,1,1))}
  return m})();
// how much clay a point of ground carries (loose fill by its colour, spoilFr in terrain.js; grass-covered topsoil a little)
function clayAt(x,z){const i=Math.round(gI(x)),j=Math.round(gJ(z));if(i<0||i>N||j<0||j>N)return 0.2;
  const k=j*V+i,m=matAt(k,H[k]-0.03);if(m===SPOIL){const f=spoilFr(k);return f[1]+0.2*f[0]}return m===1?1:m===0?0.2:0}
function packTick(dt,drive,turn){
  if(!st.packC)st.packC=[...MUD_C];
  const sy=Math.sin(st.yaw),cy=Math.cos(st.yaw),mv=Math.abs(drive)+1.5*Math.abs(turn),wet=mudAt(st.x,st.z);
  let p=st.pack||0;
  if(mv>0.05&&!bench.on){
    // packing in: wet, sticky clay, worse the more it scrubs; slop partly washes through
    const g=Math.min(PACK_CAP-p,TU.packRate*0.012*mv*clayAt(st.x,st.z)*ss(0.15,0.5,wet)*(1-0.5*ss(0.8,1,wet))*(1-p/PACK_CAP)*dt);
    if(g>1e-6){p+=g;const c=groundC(st.x,st.z),f=g/p;for(let q=0;q<3;q++)st.packC[q]+=(c[q]-st.packC[q])*f;
      for(const sd of [-1,1])takeGround(st.x+sd*1.1*cy,st.z-sd*1.1*sy,g/2)}
    // and out: reversing the tracks knocks a chunk loose
    const d=Math.abs(drive)>0.5?Math.sign(drive):0;if(d&&st.packDir&&d!==st.packDir&&st.packT<0.8&&p>0.005)shedPack(p*0.3*TU.packShed);
    if(d){st.packDir=d;st.packT=0}else st.packT=(st.packT||0)+dt}
  st.pack=p;
  if(p>0.0005)shedPack(p*TU.packShed*(0.08*mv*(1-ss(0.2,0.5,wet))+0.004)*dt);
  if(st.pack>PACK_CAP*0.5&&!st.seenPack){st.seenPack=true;toast(say('trackPack'),'',4500)}
  const n=Math.round(PACK_N*Math.min(1,st.pack/PACK_CAP));
  if(n!==packMesh.count){if(n){for(let i=0;i<PACK_N;i++){const v=0.75+0.4*((i*0.618)%1);packMesh.setColorAt(i,dCol.setRGB(st.packC[0]*v,st.packC[1]*v,st.packC[2]*v))}packMesh.instanceColor.needsUpdate=true}packMesh.count=n;packMesh.instanceMatrix.needsUpdate=true}
}
// clumps of packed clay drop off a track end or out from between the rollers
function shedPack(v){v=Math.min(v,st.pack||0);if(v<=1e-6)return;st.pack-=v;st.packAcc=(st.packAcc||0)+v;
  if(st.packAcc<0.004)return;const a=st.packAcc;st.packAcc=0;
  const sd=Math.random()<0.5?-1:1,lz=(Math.random()*2-1)*1.9,sy=Math.sin(st.yaw),cy=Math.cos(st.yaw),x=st.x+sd*1.1*cy+lz*sy,z=st.z-sd*1.1*sy+lz*cy;
  if(inDig(x,z,0.5)){deposit(x,z,a,st.packC,[0,0.3,0.7,0],0.45,0);st.dirty=true;st.slumpT=Math.max(st.slumpT,1)}
  dropClods(CLAY,x,z,0.35,a*120*DIRT,st.packC,1.5)}
// the ground's colour at x,z (loose fill keeps the colour of what was dumped there)
function groundC(x,z){const i=Math.round(gI(x)),j=Math.round(gJ(z));if(i<0||i>N||j<0||j>N)return MUD_C;const k=j*V+i,m=matAt(k,H[k]-0.03);return m===0?MUD_C:matColor(k,m)}
// take volume v off the ground within about a foot and a half of x,z (inside the dig zone)
function takeGround(x,z,v){const r=0.45,i0=Math.max(0,Math.floor(gI(x-r))),i1=Math.min(N,Math.ceil(gI(x+r))),j0=Math.max(0,Math.floor(gJ(z-r))),j1=Math.min(N,Math.ceil(gJ(z+r))),l=[];
  for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++)if(!prot[j*V+i]&&Math.hypot(gX(i)-x,gZ(j)-z)<=r)l.push(j*V+i);
  if(!l.length)return;const d=v/(l.length*CA);for(const k of l){H[k]-=d;comp[k]=0}touch(i0,i1,j0,j1);st.dirty=true}

// apply the saved Dirt detail last, once everything above exists
document.querySelectorAll('.sizes button[data-d]').forEach(b=>b.onclick=()=>setDirtLevel(b.dataset.d));
try{setDirtLevel(localStorage.getItem('bhd_dirt')||1,false)}catch(e){setDirtLevel(1,false)}

// ---------- pouring ----------
// dirt leaving the bucket or the truck bed falls as one wobbling stream that thins and breaks up near the ground
// (the flying bits and clods do the breaking); streams[0] is the bucket, streams[1] the tailgate
function makeStream(){const g=new THREE.CylinderGeometry(1,1,1,9,14,true),m=new THREE.Mesh(g,M(0x8a5a36,{side:THREE.DoubleSide}));
  m.visible=false;m.frustumCulled=false;m.castShadow=true;scene.add(m);return {m,g,base:g.attributes.position.array.slice()}}
const streams=[makeStream(),makeStream()];
function pourStream(s,top,bottomY,rate,col,t){
  if(rate<0.03||top.y-bottomY<0.05){s.m.visible=false;return}
  const h=top.y-bottomY,rad=Math.min(0.32,0.05+Math.sqrt(rate)*0.2),p=s.g.attributes.position.array,b=s.base;
  for(let i=0;i<p.length;i+=3){const v=0.5-b[i+1],r=rad*(1-0.45*v)*(1+0.35*Math.sin(t*13+v*17+b[i+2]*5)*v),wob=0.12*Math.sin(t*9+v*11)*v;
    p[i]=b[i]*r+wob;p[i+1]=-v*h;p[i+2]=b[i+2]*r+wob*0.6}
  s.g.attributes.position.needsUpdate=true;s.g.computeVertexNormals();
  s.m.position.copy(top);s.m.visible=true;tintLoad(s.m.material,col);if(pMat.map&&s.m.material.map!==pMat.map){s.m.material.map=pMat.map;s.m.material.needsUpdate=true}
}
// dirt dropped from higher up spreads wider: deposit radius scale for a drop of h metres
const dropSpread=h=>Math.max(0.75,Math.min(1.8,0.6+0.25*h));
