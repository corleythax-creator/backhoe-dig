// Corley's Island: lake, mountains, grass tufts, outer ground, gas main, stakes and trees.
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.
// ---------- scenery ----------
const timeU={value:0};
(function(){
  // lake: low-poly water with gentle animated swells
  const wg=new THREE.PlaneGeometry(2600,2600,120,120);wg.rotateX(-Math.PI/2);
  const wm=new THREE.MeshPhongMaterial({color:0x1f5d72,specular:0xfff2dc,shininess:90,flatShading:true,envMap:skyEnv,combine:THREE.MixOperation,reflectivity:0.7});
  wm.onBeforeCompile=sh=>{sh.uniforms.uTime=timeU;sh.vertexShader='uniform float uTime;\n'+sh.vertexShader.replace('#include <begin_vertex>',
    '#include <begin_vertex>\nvec4 wpos=modelMatrix*vec4(transformed,1.0);\ntransformed.y+=sin(wpos.x*0.09+uTime*1.1)*0.35+cos(wpos.z*0.11+uTime*0.8)*0.3+sin((wpos.x+wpos.z)*0.23+uTime*1.7)*0.12;')};
  const water=new THREE.Mesh(wg,wm);water.position.y=WATER;water.receiveShadow=true;scene.add(water);
  // two mountain layers far across the lake: a lit front range, and pale hazy peaks behind it
  function range(R0,R1,NR,NA,lo,hi,hazeA,hazeB,phase,unlit){
    const pp=[],cc=[],ix=[],hz=[0.75,0.82,0.87];
    for(let ri=0;ri<=NR;ri++)for(let ai=0;ai<=NA;ai++){
      const t=ri/NR,r=R0+(R1-R0)*Math.pow(t,0.85),a=ai/NA*Math.PI*2,x=Math.cos(a)*r,z=Math.sin(a)*r;
      const env=ss(0,0.3,t)*(1-0.5*ss(0.8,1,t)),side=0.5+0.5*Math.sin(a+2.4+phase);
      const n=(1-Math.abs(Math.sin(a*7+r*0.013+phase)))*0.5+(1-Math.abs(Math.sin(a*17+r*0.031+1.3+phase)))*0.3+(1-Math.abs(Math.sin(a*37-r*0.05+2.1)))*0.2;
      const hh=env*(0.45+0.55*side)*(lo+hi*n*n);
      pp.push(x,WATER-6+hh,z);
      const f=hh/(lo+hi),j=hash(ri*3.3+phase,ai*1.7)*0.06;let c;
      if(f<0.08)c=[0.26,0.4,0.26];else if(f<0.3)c=[0.18+j,0.32+j,0.22];else if(f<0.56+j)c=[0.46+j,0.44+j,0.43+j];else c=[0.95,0.96,0.98];
      const hk=hazeA+(hazeB-hazeA)*t;cc.push(c[0]+(hz[0]-c[0])*hk,c[1]+(hz[1]-c[1])*hk,c[2]+(hz[2]-c[2])*hk);
    }
    for(let ri=0;ri<NR;ri++)for(let ai=0;ai<NA;ai++){const q=ri*(NA+1)+ai;ix.push(q,q+1,q+NA+1,q+1,q+NA+2,q+NA+1)}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pp,3));g.setAttribute('color',new THREE.Float32BufferAttribute(cc,3));
    g.setAttribute('normal',new THREE.Float32BufferAttribute(new Float32Array(pp.length),3));g.setIndex(ix);
    const mat=unlit?new THREE.MeshBasicMaterial({vertexColors:true,fog:false,side:THREE.DoubleSide,toneMapped:false})
      :new THREE.MeshPhongMaterial({vertexColors:true,flatShading:true,fog:false,side:THREE.DoubleSide,shininess:2,specular:0x000000,emissive:0x6a7686});
    const m=new THREE.Mesh(g,mat);m.renderOrder=-0.5;scene.add(m);
  }
  range(470,820,40,220,30,240,0.42,0.66,0,false);
  range(860,1220,28,200,60,430,0.7,0.85,1.7,true);
})();
// grass tufts that disappear wherever the ground gets dug or buried
const TUFTS=15000,tX=new Float32Array(TUFTS),tZ=new Float32Array(TUFTS),tS=new Float32Array(TUFTS),tR=new Float32Array(TUFTS),tI=new Int32Array(TUFTS),tJ=new Int32Array(TUFTS);
const tuftGeo=(function(){const bp=[];for(let b=0;b<4;b++){const a=b*1.6+0.3,c=Math.cos(a),s=Math.sin(a),w=0.05,h=0.26+0.08*(b%2),ln=0.09;
  bp.push(-c*w,0,-s*w, c*w,0,s*w, -s*ln,h,c*ln)}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(bp,3));g.computeVertexNormals();
  // shaded at the root where the blades crowd together, sunlit at the tips
  g.setAttribute('color',new THREE.Float32BufferAttribute(bp.map((_,i)=>bp[i-i%3+1]>0?1.12:0.5),3));return g})();
const tufts=new THREE.InstancedMesh(tuftGeo,M(0xffffff,{side:THREE.DoubleSide,vertexColors:true}),TUFTS);tufts.receiveShadow=true;tufts.frustumCulled=false;scene.add(tufts);
(function(){const c=new THREE.Color();for(let n=0;n<TUFTS;n++){let gx,gz,q=0;do{gx=(Math.random()-0.5)*94;gz=-18+Math.random()*96}while((mesaR(gx,gz)>EDGE-0.8||roadAmt(gx,gz)>0.1||yardAt(gx,gz)>0.3||wallAt(gx,gz))&&++q<60);
  tX[n]=gx;tZ[n]=gz;tS[n]=0.7+Math.random()*0.8;tR[n]=Math.random()*6.3;
  tI[n]=Math.round((tX[n]+S/2)/CELL);tJ[n]=Math.round((tZ[n]+S/2)/CELL);if(tI[n]<0||tI[n]>N||tJ[n]<0||tJ[n]>N){tI[n]=-1;tJ[n]=-1}
  const v=Math.random();c.setRGB(0.27+0.1*v,0.48+0.12*v,0.2+0.05*v);if(Math.random()<0.08)c.setRGB(0.62,0.58,0.3);tufts.setColorAt(n,c)}})();
const tO=new THREE.Object3D();
function updateTufts(i0,i1,j0,j1){
  for(let n=0;n<TUFTS;n++){const i=tI[n],j=tJ[n];if(i<0)continue;if(i<i0||i>i1||j<j0||j>j1)continue;const k=j*V+i;
    if(Math.abs(H[k]-H0[k])>0.04){tufts.setMatrixAt(n,ZERO_M);continue}
    tO.position.set(tX[n],hAt(tX[n],tZ[n])-0.02,tZ[n]);tO.rotation.set(0,tR[n],0);tO.scale.setScalar(tS[n]);tO.updateMatrix();tufts.setMatrixAt(n,tO.matrix)}
  tufts.instanceMatrix.needsUpdate=true;
}
const ZERO_M=new THREE.Matrix4().makeScale(0,0,0);
// after the map editor reshapes, repaints or lays a road over an area (metres): tufts follow the ground and keep off
// dirt, roads and steep ground
function tuftsRefresh(x0,x1,z0,z1){
  for(let n=0;n<TUFTS;n++){const x=tX[n],z=tZ[n];if(x<x0||x>x1||z<z0||z>z1)continue;const i=tI[n],k=tJ[n]*V+i;
    if((i>=0&&Math.abs(H[k]-H0[k])>0.04)||yardAt(x,z)>0.3||roadAmt(x,z)>0.1||wallAt(x,z)){tufts.setMatrixAt(n,ZERO_M);continue}
    tO.position.set(x,hAt(x,z)-0.02,z);tO.rotation.set(0,tR[n],0);tO.scale.setScalar(tS[n]);tO.updateMatrix();tufts.setMatrixAt(n,tO.matrix)}
  tufts.instanceMatrix.needsUpdate=true}
for(let n=0;n<TUFTS;n++){tO.position.set(tX[n],hAt(tX[n],tZ[n])-0.02,tZ[n]);tO.rotation.set(0,tR[n],0);tO.scale.setScalar(tS[n]);tO.updateMatrix();tufts.setMatrixAt(n,tO.matrix)}
// ground outside the dig zone: 0.5 m over the rest of the mesa and its cliffs (hills, the scarp and the ramp need it),
// 2 m beyond; each patch has a hole where the finer one sits
const MID=[-58,58,-32,92];
// a ground vertex's colour into c (rgb array), and its dirt-texture amount: grass (darker down on the meadows), rock on
// steep ground, sand at the lake, the yards and the roads
function groundColor(x,z,h,c){const n=hash(x*3.55+0.3,z*2.65+0.7);
  const sl=(Math.abs(baseHeight(x+1,z)-baseHeight(x-1,z))+Math.abs(baseHeight(x,z+1)-baseHeight(x,z-1)))/2;
  const rock=ss(0.55,1.1,sl),sand=1-ss(WATER+0.6,WATER+2.8,h),low=ss(-4,-20,h)*ss(EDGE-1,EDGE+2,mesaR(x,z));
  let r=0.30+0.08*n+0.05*low,g=0.50+0.09*n-0.02*low,b=0.24+0.04*n;
  const strata=0.06*Math.sin(h*1.4+n);
  r+=(0.50+0.06*n+strata-r)*rock;g+=(0.44+0.05*n+strata-g)*rock;b+=(0.38+0.04*n+strata-b)*rock;
  r+=(0.80-r)*sand;g+=(0.72-g)*sand;b+=(0.52-b)*sand;
  c[0]=r;c[1]=g;c[2]=b;const ya=yardTint(x,z,c,n),ra=roadTint(x,z,c,n);return Math.min(1,Math.max(rock*0.95+sand*0.4,ra*0.9,ya*0.85))}
let midPatch=null,skirtMesh=null;
(function(){
  function patch(X0,X1,Z0,Z1,CO,hole){
    const NX=Math.round((X1-X0)/CO),NZ=Math.round((Z1-Z0)/CO),VX=NX+1,pp=[],cc=[],ix=[],rk=[],c=[0,0,0];
    for(let j=0;j<=NZ;j++)for(let i=0;i<=NX;i++){const x=X0+i*CO,z=Z0+j*CO,h=baseHeight(x,z);pp.push(x,h,z);rk.push(groundColor(x,z,h,c));cc.push(c[0],c[1],c[2])}
    for(let j=0;j<NZ;j++)for(let i=0;i<NX;i++){const x0=X0+i*CO,z0=Z0+j*CO;
      if(x0>=hole[0]-1e-6&&x0+CO<=hole[1]+1e-6&&z0>=hole[2]-1e-6&&z0+CO<=hole[3]+1e-6)continue;const a=j*VX+i;ix.push(a,a+VX,a+1,a+1,a+VX,a+VX+1)}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pp,3));g.setAttribute('color',new THREE.Float32BufferAttribute(cc,3));
    g.setAttribute('normal',new THREE.Float32BufferAttribute(new Float32Array(pp.length),3));g.setIndex(ix);
    g.setAttribute('dirt',new THREE.Float32BufferAttribute(rk,1));g.setAttribute('wetT',new THREE.Float32BufferAttribute(new Float32Array(rk.length).fill(-1e4),1));g.setAttribute('soilD',new THREE.Float32BufferAttribute(new Float32Array(rk.length),1));
    const m=new THREE.Mesh(g,groundMat);m.receiveShadow=true;scene.add(m);
    return {g,X0,Z0,CO,VX,NX,NZ};
  }
  patch(-160,160,-160,160,2,MID);
  midPatch=patch(MID[0],MID[1],MID[2],MID[3],0.5,[-S/2,S/2,-S/2,S/2]);
  buildSkirts();
})();
// after the map editor reshapes or repaints an area (metres): the 0.5 m ground there takes the new heights and colours
function midUpdate(x0,x1,z0,z1){const P=midPatch,g=P.g,pa=g.attributes.position,ca=g.attributes.color,da=g.attributes.dirt,c=[0,0,0];
  const i0=Math.max(0,Math.floor((x0-P.X0)/P.CO)),i1=Math.min(P.NX,Math.ceil((x1-P.X0)/P.CO)),j0=Math.max(0,Math.floor((z0-P.Z0)/P.CO)),j1=Math.min(P.NZ,Math.ceil((z1-P.Z0)/P.CO));
  if(i0>i1||j0>j1)return;
  for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){const v=j*P.VX+i,x=P.X0+i*P.CO,z=P.Z0+j*P.CO,h=baseHeight(x,z);
    pa.array[v*3+1]=h;da.array[v]=groundColor(x,z,h,c);ca.array[v*3]=c[0];ca.array[v*3+1]=c[1];ca.array[v*3+2]=c[2]}
  for(const [a,w] of [[pa,3],[ca,3],[da,1]]){a.updateRange.offset=j0*P.VX*w;a.updateRange.count=(j1-j0+1)*P.VX*w;a.needsUpdate=true}}
// skirts hide any hairline gap where a finer grid meets a coarser one; rebuilt when the editor reshapes the ground
function buildSkirts(){
  const sp=[],si=[];let q=0;
  const run=(fx,a0,a1,st,dp)=>{for(let t=a0;t<a1-1e-6;t+=st){const [x0,z0]=fx(t),[x1,z1]=fx(t+st),h0=baseHeight(x0,z0),h1=baseHeight(x1,z1);
    sp.push(x0,h0,z0,x1,h1,z1,x0,h0-dp,z0,x1,h1-dp,z1);si.push(q,q+2,q+1,q+1,q+2,q+3);q+=4}};
  const E=S/2;run(t=>[t,-E],-E,E,0.5,0.6);run(t=>[t,E],-E,E,0.5,0.6);run(t=>[-E,t],-E,E,0.5,0.6);run(t=>[E,t],-E,E,0.5,0.6);
  run(t=>[t,MID[2]],MID[0],MID[1],0.5,2);run(t=>[t,MID[3]],MID[0],MID[1],0.5,2);run(t=>[MID[0],t],MID[2],MID[3],0.5,2);run(t=>[MID[1],t],MID[2],MID[3],0.5,2);
  const sg=new THREE.BufferGeometry();sg.setAttribute('position',new THREE.Float32BufferAttribute(sp,3));sg.setAttribute('normal',new THREE.Float32BufferAttribute(new Float32Array(sp.length),3));sg.setIndex(si);
  if(skirtMesh){skirtMesh.geometry.dispose();skirtMesh.geometry=sg}else{skirtMesh=new THREE.Mesh(sg,M(0x4a6a34,{side:THREE.DoubleSide}));scene.add(skirtMesh)}}
const pipe=new THREE.Mesh(new THREE.CylinderGeometry(PIPE_R,PIPE_R,24,36,4),M(0xf2c21a,{shininess:30}));
pipe.rotation.z=Math.PI/2; pipe.position.set(0,PIPE_Y,PIPE_Z); scene.add(pipe);
function stake(x,z,flagColor){
  const g=new THREE.Group(),y=baseHeight(x,z);
  const post=new THREE.Mesh(new THREE.BoxGeometry(0.04,0.8,0.04),M(0xd9c9a3)); post.position.y=0.4; g.add(post);
  const flag=new THREE.Mesh(new THREE.BoxGeometry(0.22,0.15,0.01),M(flagColor)); flag.position.set(0.12,0.72,0); g.add(flag);
  g.position.set(x,y,z); scene.add(g);
}
[[0.8,TRENCH_Z0-0.3],[-0.8,TRENCH_Z0-0.3],[0.8,TRENCH_Z1+0.3],[-0.8,TRENCH_Z1+0.3]].forEach(p=>stake(p[0],p[1],0xf2f2ee));
[[-3,PIPE_Z],[3,PIPE_Z],[-7,PIPE_Z],[7,PIPE_Z]].forEach(p=>stake(p[0],p[1],0xf5c518));
// the tree instance meshes, for shadowproxy.js
const treeIMs=[];
// placed assets (trees and boulders) as {t: type, x, z, yaw, s: size, c: tint}; the map editor moves, adds and removes them
const ASSET_CAP={pine:600,leafy:300,rock:400},assetIMs={},assets=mapAssets?mapAssets.slice():[];
const ASSET_PT=[[1,1,1],[0.85,0.95,1.06],[1.08,1.04,0.82],[0.92,0.98,0.9]],ASSET_LT=[[0.98,0.78,0.26],[0.93,0.52,0.2],[0.56,0.64,0.3],[0.78,0.32,0.18],[0.46,0.6,0.28],[0.95,0.85,0.4]];
(function trees(){
  function colorize(g,fn){if(g.index)g=g.toNonIndexed();const p=g.attributes.position,c=new Float32Array(p.count*3);
    for(let i=0;i<p.count;i++){const col=fn(p.getX(i),p.getY(i),p.getZ(i));c[i*3]=col[0];c[i*3+1]=col[1];c[i*3+2]=col[2]}
    g.setAttribute('color',new THREE.BufferAttribute(c,3));return g}
  function mergeGeos(list){let n=0;for(const g of list)n+=g.attributes.position.count;
    const P=new Float32Array(n*3),Nn=new Float32Array(n*3),C=new Float32Array(n*3);let o=0;
    for(const g of list){P.set(g.attributes.position.array,o*3);Nn.set(g.attributes.normal.array,o*3);C.set(g.attributes.color.array,o*3);o+=g.attributes.position.count}
    const m=new THREE.BufferGeometry();m.setAttribute('position',new THREE.BufferAttribute(P,3));m.setAttribute('normal',new THREE.BufferAttribute(Nn,3));m.setAttribute('color',new THREE.BufferAttribute(C,3));return m}
  const BARK=[0.36,0.25,0.17];
  // pine: five drooping tiers with ragged skirts, darker underneath, lighter toward the tip
  const pine=[];
  const pt=new THREE.CylinderGeometry(0.09,0.19,1.7,12,2);pt.translate(0,0.85,0);pine.push(colorize(pt,()=>BARK));
  const TOP=5.9;
  for(let t=0;t<5;t++){
    const r=1.5*(1-t*0.17),h=1.65-t*0.08,base=0.85+t*0.92;
    const g=new THREE.ConeGeometry(r,h,24,3,true),p=g.attributes.position;
    for(let i=0;i<p.count;i++){const y=p.getY(i);
      if(Math.abs(y+h/2)<1e-4){const j=Math.round((Math.atan2(p.getZ(i),p.getX(i))+Math.PI)/(Math.PI*2)*24),o=j%2?1.14:0.9;
        p.setX(i,p.getX(i)*o);p.setZ(i,p.getZ(i)*o);p.setY(i,y-(j%2?0.18:0))}}
    g.translate(0,base+h/2,0);
    pine.push(colorize(g,(x,y,z)=>{const f=Math.min(1,y/TOP),e=Math.min(1,Math.hypot(x,z)/r),k=0.72+0.28*f;
      return[(0.12+0.1*f)*k+0.03*e,(0.30+0.18*f)*k+0.05*e,(0.16+0.06*f)*k]}));
    const cap=new THREE.CircleGeometry(r*0.95,24);cap.rotateX(Math.PI/2);cap.translate(0,base+0.03,0);pine.push(colorize(cap,()=>[0.07,0.17,0.09]));
  }
  const pineGeo=mergeGeos(pine);
  // broadleaf: trunk and branches, plus a lumpy crown tinted per tree (autumn golds, oranges, greens)
  const lw=[];
  const lt=new THREE.CylinderGeometry(0.1,0.18,2.1,10,2);lt.translate(0,1.05,0);lw.push(colorize(lt,()=>BARK));
  for(const [ang,len,rot] of [[0.75,1.1,0],[-0.7,1.0,1.2],[0.6,0.9,2.6]]){const br=new THREE.CylinderGeometry(0.045,0.08,len,8);br.translate(0,len/2,0);br.rotateZ(ang);br.rotateY(rot);br.translate(0,1.5,0);lw.push(colorize(br,()=>BARK))}
  const woodGeo=mergeGeos(lw);
  const crown=[];
  for(const [x,y,z,r] of [[0,3.1,0,1.3],[0.95,2.65,0.2,0.95],[-0.9,2.6,-0.2,1.0],[0.2,2.45,0.95,0.9],[-0.15,2.6,-0.95,0.9],[0.1,3.85,0.05,0.85]]){
    const g=new THREE.IcosahedronGeometry(r,1),p=g.attributes.position;
    for(let i=0;i<p.count;i++){const n=Math.sin(p.getX(i)*7.3+p.getY(i)*5.1+p.getZ(i)*3.7)*0.09;p.setXYZ(i,p.getX(i)*(1+n),p.getY(i)*(0.86+n),p.getZ(i)*(1+n))}
    g.translate(x,y,z);g.computeVertexNormals();
    crown.push(colorize(g,(px,py)=>{const k=0.62+0.38*Math.min(1,Math.max(0,(py-1.5)/3));return[k,k,k]}));
  }
  const crownGeo=mergeGeos(crown);
  // boulder: a lumpy grey stone, lighter on top
  const rockGeo=(function(){const g=new THREE.IcosahedronGeometry(0.8,1),p=g.attributes.position;
    for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),n=1+0.22*Math.sin(x*5.1+y*3.3)*Math.cos(z*4.7-y*2.1);p.setXYZ(i,x*n*1.15,y*n*0.62,z*n)}
    g.computeVertexNormals();return colorize(g,(x,y)=>{const k=0.62+0.3*Math.min(1,Math.max(0,(y+0.3)/0.8));return[0.62*k,0.6*k,0.56*k]})})();
  const treeM=M(0xffffff,{vertexColors:true});
  const pines=new THREE.InstancedMesh(pineGeo,treeM,ASSET_CAP.pine),woods=new THREE.InstancedMesh(woodGeo,treeM,ASSET_CAP.leafy),crowns=new THREE.InstancedMesh(crownGeo,treeM,ASSET_CAP.leafy),rocks=new THREE.InstancedMesh(rockGeo,treeM,ASSET_CAP.rock);
  // colour buffers sized to capacity up front (three r128 sizes them by the live count, which starts at 0 here)
  for(const im of [pines,woods,crowns,rocks]){im.castShadow=true;im.receiveShadow=true;im.frustumCulled=false;
    im.instanceColor=new THREE.InstancedBufferAttribute(new Float32Array(im.instanceMatrix.count*3),3);im.count=0;scene.add(im)}
  assetIMs.pine=[pines];assetIMs.leafy=[woods,crowns];assetIMs.rock=[rocks];treeIMs.push(pines,woods,crowns,rocks);
  if(!assets.length)assets.push(...defaultAssets());
  assetsBuild();
})();
// the default trees and boulders, the same every time (a seeded shuffle): clustered in a band inside the rim, round West
// Rise and on the meadows, clear of the roads, the yards, the scarp and the tall grass
function defaultAssets(){
  let sd=7;const rnd=()=>{sd=(sd+0x6D2B79F5)|0;let t=Math.imul(sd^(sd>>>15),1|sd);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296};
  const okSpot=(x,z)=>{if(Math.abs(x)>116||Math.abs(z)>116)return false;const r=mesaR(x,z),h=baseHeight(x,z);
    if(r<EDGE-1.5){if(!(r>EDGE-9.5||Math.hypot(x+22,z-22)<7))return false;
      if(roadOff(x,z)<ROAD_W/2+1.6||yardAt(x,z)>0.05||z<-2||(Math.abs(x)<14&&z<2)||Math.hypot(x+7,z-1)<9||(x>-3&&x<17&&z>9&&z<25))return false;
      return Math.abs(baseHeight(x+1,z)-h)+Math.abs(baseHeight(x,z+1)-h)<0.5}
    const sl=Math.abs(baseHeight(x+1,z)-h)+Math.abs(baseHeight(x,z+1)-h);return h>WATER+2.5&&sl<0.7};
  const out=[];let guard=0,np=0,nb=0;
  while(np+nb<285&&guard++<20000){const cx=(rnd()-0.5)*230,cz=(rnd()-0.5)*230,n=3+Math.floor(rnd()*7);
    if(!okSpot(cx,cz))continue;
    for(let i=0;i<n&&np+nb<285;i++){const x=cx+(rnd()-0.5)*10,z=cz+(rnd()-0.5)*10;if(!okSpot(x,z))continue;
      const pine=np<210&&(nb>=75||rnd()<0.74);out.push({t:pine?'pine':'leafy',x,z,yaw:rnd()*6.3,s:0.8+rnd()*0.7,c:Math.floor(rnd()*(pine?4:6))});if(pine)np++;else nb++}}
  for(let n=0,g=0;n<18&&g<4000;g++){const x=(rnd()-0.5)*100,z=-20+rnd()*100;if(!okSpot(x,z))continue;out.push({t:'rock',x,z,yaw:rnd()*6.3,s:0.5+rnd()*0.9,c:0});n++}
  return out}
// fills the instance meshes from the asset list (after any change to it)
function assetsBuild(){const o=new THREE.Object3D(),c=new THREE.Color(),n={pine:0,leafy:0,rock:0};
  for(const a of assets){const k=n[a.t];if(k===undefined||k>=ASSET_CAP[a.t])continue;n[a.t]++;
    const w=hash(a.x*1.3+0.7,a.z*2.1+0.3),w2=hash(a.z*1.7,a.x*0.9),y=baseHeight(a.x,a.z);
    if(a.t==='rock'){o.position.set(a.x,y-0.18*a.s,a.z);o.rotation.set((w-0.5)*0.4,a.yaw,(w2-0.5)*0.4);o.scale.set(a.s,a.s*(0.8+0.4*w),a.s)}
    else{o.position.set(a.x,y-0.05,a.z);o.rotation.set((w-0.5)*0.08,a.yaw,(w2-0.5)*0.08);o.scale.set(a.s,a.s*(a.t==='pine'?0.9+0.35*w:1),a.s)}
    o.updateMatrix();for(const im of assetIMs[a.t])im.setMatrixAt(k,o.matrix);
    if(a.t==='pine'){const t=ASSET_PT[a.c%4],v=0.88+0.24*w2;c.setRGB(t[0]*v,t[1]*v,t[2]*v);assetIMs.pine[0].setColorAt(k,c)}
    else if(a.t==='leafy'){const t=ASSET_LT[a.c%6],v=0.9+0.2*w2;c.setRGB(t[0]*v,t[1]*v,t[2]*v);assetIMs.leafy[1].setColorAt(k,c);c.setRGB(1,1,1);assetIMs.leafy[0].setColorAt(k,c)}
    else{const v=0.85+0.3*w2;c.setRGB(v,v,v);assetIMs.rock[0].setColorAt(k,c)}}
  for(const t in assetIMs)for(const im of assetIMs[t]){im.count=n[t];im.instanceMatrix.needsUpdate=true;if(im.instanceColor)im.instanceColor.needsUpdate=true}}
