// Corley's Island: a patch of tall grass on the mesa and a zero-turn mower to cut it: lap-bar steering, swivel casters,
// clippings out the side chute and lawn stripes that follow the direction of each pass and change with the view.
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.
// ---------- tall grass ----------
// a 16 x 12 m (52 x 39 ft) patch north-east of the trench, one clump of grass per 0.2 m cell. Each cell remembers when it
// was last cut (on the lawn clock, lawn.t): it stays stubble for a while, then grows back to full height over a few minutes
const LAWN_X0=-1,LAWN_Z0=11,LAWN_GS=0.2,LAWN_NX=80,LAWN_NZ=60,LAWN_N=LAWN_NX*LAWN_NZ,LAWN_BH=0.75;
const lawn={ct:new Float32Array(LAWN_N).fill(-1e9),gd:new Float32Array(LAWN_N).fill(1),dug:new Uint8Array(LAWN_N),str:new Float32Array(LAWN_N),ga:new Float32Array(LAWN_N),ht:new Float32Array(LAWN_N),x:new Float32Array(LAWN_N),z:new Float32Array(LAWN_N),
  r:new Float32Array(LAWN_N),s:new Float32Array(LAWN_N),h:new Float32Array(LAWN_N),tc:new Float32Array(LAWN_N*3),nz:new Float32Array(LAWN_N),
  t:0,pct:0,pctT:0,row:0,nDug:0,startT:0,doneT:0,done:false,mDirty:false,cDirty:false,gDirty:false,mapDirty:true,sDirty:false,saveT:0,aDirty:false};
// how grown a cell is: 0 fresh stubble, 1 full height
function lawnG(n){return Math.min(1,Math.max(0,(lawn.t-lawn.ct[n]-TU.lawnWait)/TU.lawnGrow))}
// grid cells of the dig zone the patch covers, so terrain edits elsewhere skip it
let LAWN_I0=0,LAWN_I1=0,LAWN_J0=0,LAWN_J1=0;
// the patch's grid points, clamped to the grid (none while the grid is elsewhere)
function lawnIdx(){LAWN_I0=Math.max(0,Math.floor(gI(LAWN_X0))-1);LAWN_I1=Math.min(N,Math.ceil(gI(LAWN_X0+LAWN_NX*LAWN_GS))+1);LAWN_J0=Math.max(0,Math.floor(gJ(LAWN_Z0))-1);LAWN_J1=Math.min(N,Math.ceil(gJ(LAWN_Z0+LAWN_NZ*LAWN_GS))+1);
  if(LAWN_I0>LAWN_I1||LAWN_J0>LAWN_J1){LAWN_I0=LAWN_J0=N+1;LAWN_I1=LAWN_J1=-1}}
lawnIdx();
// one clump: eight tapered blades that arch over and twist as they rise, each its own shade of green, dark down in the
// clump and sunlit at the tips, plus two seed stalks with straw-coloured heads standing above them (46 triangles)
const lawnGeo=(function(){const P=[],C=[],tri=(v,c,list)=>{for(const t of list)for(const q of t){P.push(...v[q]);C.push(...c[q])}};
  for(let b=0;b<8;b++){const a=b*0.785+Math.random()*0.5,ra=0.015+Math.random()*0.045,rx=Math.cos(a+1.9)*ra,rz=Math.sin(a+1.9)*ra;
    const h=LAWN_BH*(0.55+Math.random()*0.45),lean=0.08+Math.random()*0.2,w=0.018+Math.random()*0.012,tw=(Math.random()-0.5)*1.2,ca=Math.cos(a),sa=Math.sin(a);
    const hv=Math.random()*2-1,tint=[1+0.1*hv,1+0.04*hv,1-0.12*hv],v=[],c=[];
    for(const [t,wf,k] of [[0,1,0.38],[0.35,0.85,0.7],[0.68,0.55,0.95],[1,0,1.18]]){
      const o=lean*Math.pow(t,1.8),cx=rx+ca*o,cz=rz+sa*o,y=h*t*(1-0.12*t*lean/0.28),ta=a+Math.PI/2+tw*t,px=Math.cos(ta)*w*wf,pz=Math.sin(ta)*w*wf;
      const col=[k*tint[0],k*tint[1],k*tint[2]];
      if(wf>0){v.push([cx-px,y,cz-pz],[cx+px,y,cz+pz]);c.push(col,col)}else{v.push([cx,y,cz]);c.push(col)}}
    tri(v,c,[[0,1,3],[0,3,2],[2,3,5],[2,5,4],[4,5,6]])}
  for(let b=0;b<2;b++){const a=Math.random()*6.3,ca=Math.cos(a),sa=Math.sin(a),h=LAWN_BH*(1.05+Math.random()*0.2),lean=0.06+Math.random()*0.08,hx=ca*lean,hz=sa*lean,ws=0.006;
    const st=[0.45,0.5,0.3],hd=[1.05,0.95,0.62],hh=h*0.82,hw=0.022;
    tri([[-sa*ws,0,ca*ws],[sa*ws,0,-ca*ws],[hx,h,hz]],[st,st,st],[[0,1,2]]);
    tri([[hx*0.8,hh,hz*0.8],[hx*0.9-sa*hw,h*0.9,hz*0.9+ca*hw],[hx*0.9+sa*hw,h*0.9,hz*0.9-ca*hw],[hx*1.05,h*1.04,hz*1.05]],[hd,hd,hd,hd],[[0,2,1],[1,2,3]])}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('color',new THREE.Float32BufferAttribute(C,3));g.computeVertexNormals();return g})();
// per clump (aLawn): mowing grain times stripe strength (x, z) and the height of the grass around it (z), set by lawnShade
lawnGeo.setAttribute('aLawn',new THREE.InstancedBufferAttribute(new Float32Array(LAWN_N*4),4));
// wind comes in gusts that roll across the patch, bending the grass over and showing its paler side; the grass leans away
// from the machines and the worker (mower, excavator, truck front and back, worker: x, z, radius). Cut grass reads light looking along the way
// the mower laid it and dark looking against it, so the stripes swap as you walk round. Down in the clumps it is dark
// where the grass around stands taller, and looking toward the sun the blades glow where light comes through them
const lawnPush={value:[new THREE.Vector4(),new THREE.Vector4(),new THREE.Vector4(),new THREE.Vector4(),new THREE.Vector4(1e5,0,0,0)]};
const lawnMat=M(0xffffff,{side:THREE.DoubleSide,vertexColors:true});
lawnMat.onBeforeCompile=sh=>{sh.uniforms.uTime=timeU;sh.uniforms.uPush=lawnPush;sh.uniforms.uSun={value:SUN_DIR};
  sh.vertexShader='uniform float uTime;\nuniform vec4 uPush[5];\nattribute vec4 aLawn;\nvarying vec3 vLW;\nvarying float vTip;\n'+sh.vertexShader.replace('#include <project_vertex>',
    'vec4 mvPosition=vec4(transformed,1.0);\n#ifdef USE_INSTANCING\nmvPosition=instanceMatrix*mvPosition;\nvec3 root=instanceMatrix[3].xyz;\n#else\nvec3 root=vec3(0.0);\n#endif\n'+
    'float hg=max(0.0,mvPosition.y-root.y);vec2 wd=vec2(0.8,0.6);\n'+
    'float gust=pow(0.5+0.5*sin(dot(root.xz,wd)*0.42-uTime*1.9+1.5*sin(dot(root.xz,vec2(-0.6,0.8))*0.11+uTime*0.23)),3.0);\n'+
    'float fl=sin(uTime*5.3+root.x*2.1+root.z*1.7)*0.5+sin(uTime*3.1+root.x*1.7-root.z*1.1)*0.5;\n'+
    'mvPosition.xz+=wd*hg*hg*(0.08+0.42*gust+0.07*fl);mvPosition.y-=hg*hg*0.18*gust;\n'+
    'for(int m=0;m<5;m++){vec2 d=root.xz-uPush[m].xy;float l=length(d),f=1.0-smoothstep(uPush[m].z*0.55,uPush[m].z+0.35,l);\n'+
    'if(f>0.0){mvPosition.xz+=d/max(l,0.05)*hg*0.9*f;mvPosition.y-=hg*0.7*f;}}\n'+
    'vec3 cv=root-cameraPosition;float cd=length(cv);vec2 vh=cv.xz/max(0.001,length(cv.xz));\n'+
    'float shade=mix(1.0,0.55+0.45*smoothstep(-0.05,aLawn.z*0.9+0.01,hg),clamp(aLawn.z/0.45,0.0,1.0));\n'+
    'vColor.rgb*=shade*(1.0+0.22*gust*smoothstep(0.1,0.6,hg))*(1.0+0.32*dot(vh,aLawn.xy)*(1.0-0.5*smoothstep(0.5,0.95,-cv.y/cd)));\n'+
    'vLW=mvPosition.xyz;vTip=smoothstep(0.05,0.6,hg);\n'+
    'mvPosition=modelViewMatrix*mvPosition;\ngl_Position=projectionMatrix*mvPosition;');
  sh.fragmentShader='uniform vec3 uSun;\nvarying vec3 vLW;\nvarying float vTip;\n'+sh.fragmentShader.replace('#include <emissivemap_fragment>',
    '#include <emissivemap_fragment>\nfloat bl=pow(max(0.0,dot(normalize(vLW-cameraPosition),uSun)),3.0);\ntotalEmissiveRadiance+=diffuseColor.rgb*vec3(1.0,1.15,0.4)*bl*vTip*1.1;')};
const lawnClumps=new THREE.InstancedMesh(lawnGeo,lawnMat,LAWN_N);lawnClumps.receiveShadow=true;lawnClumps.frustumCulled=true;scene.add(lawnClumps);
// far away (Graphics Low and Medium) the patch draws a quarter of the clumps, every other one each way and twice as wide,
// so it reads the same for a quarter of the triangles; both versions are skipped when the patch is out of view (an
// InstancedMesh starts with culling off, so it is switched on, with a bounding sphere round the whole patch)
const LAWN_FN=(LAWN_NX>>1)*(LAWN_NZ>>1),lawnFarGeo=new THREE.BufferGeometry();
for(const k of ['position','color','normal'])lawnFarGeo.setAttribute(k,lawnGeo.attributes[k]);
lawnFarGeo.setAttribute('aLawn',new THREE.InstancedBufferAttribute(new Float32Array(LAWN_FN*4),4));
const lawnFar=new THREE.InstancedMesh(lawnFarGeo,lawnMat,LAWN_FN);lawnFar.receiveShadow=true;lawnFar.frustumCulled=true;lawnFar.count=0;scene.add(lawnFar);
lawnFar.instanceColor=new THREE.InstancedBufferAttribute(new Float32Array(LAWN_FN*3),3);
{const cx=LAWN_X0+LAWN_NX*LAWN_GS/2,cz=LAWN_Z0+LAWN_NZ*LAWN_GS/2,r=Math.hypot(LAWN_NX,LAWN_NZ)*LAWN_GS/2+1.5;
  for(const g of [lawnGeo,lawnFarGeo])g.boundingSphere=new THREE.Sphere(new THREE.Vector3(cx,baseHeight(cx,cz)+0.4,cz),r)}
let lawnFarOn=false,lawnFarStale=true;
// copy every other clump into the far version, widened
function lawnFarSync(){const M=lawnClumps.instanceMatrix.array,F=lawnFar.instanceMatrix.array,A=lawnGeo.attributes.aLawn.array,FA=lawnFarGeo.attributes.aLawn.array,
    C=lawnClumps.instanceColor&&lawnClumps.instanceColor.array;let m=0;
  for(let j=0;j+1<LAWN_NZ;j+=2)for(let i=0;i+1<LAWN_NX;i+=2,m++){const n=j*LAWN_NX+i;
    for(let e=0;e<16;e++)F[m*16+e]=M[n*16+e]*(e===0||e===1||e===2||e===8||e===9||e===10?2:1);
    for(let e=0;e<4;e++)FA[m*4+e]=A[n*4+e];if(C)for(let e=0;e<3;e++)lawnFar.instanceColor.array[m*3+e]=C[n*3+e]}
  lawnFar.instanceMatrix.needsUpdate=true;lawnFarGeo.attributes.aLawn.needsUpdate=true;if(C)lawnFar.instanceColor.needsUpdate=true;lawnFarStale=false}
// every frame: near or far version, by the camera's distance to the patch and the Graphics setting (always near while mowing)
function lawnLod(){const d=Math.hypot(Math.max(0,LAWN_X0-camera.position.x,camera.position.x-LAWN_X0-LAWN_NX*LAWN_GS),Math.max(0,LAWN_Z0-camera.position.z,camera.position.z-LAWN_Z0-LAWN_NZ*LAWN_GS));
  const far=mode!=='mow'&&d>(typeof gfxCur!=='undefined'?gfxCur.lawnFar:1e9);
  if(far&&lawnFarStale)lawnFarSync();
  if(far!==lawnFarOn){lawnFarOn=far;lawnClumps.count=far?0:LAWN_N;lawnFar.count=far?LAWN_FN:0}}
const lwO=new THREE.Object3D(),lwC=new THREE.Color();
for(let j=0;j<LAWN_NZ;j++)for(let i=0;i<LAWN_NX;i++){const n=j*LAWN_NX+i,e=Math.min(i+0.5,j+0.5,LAWN_NX-i-0.5,LAWN_NZ-j-0.5)*LAWN_GS;
  lawn.x[n]=LAWN_X0+(i+0.5+(Math.random()-0.5)*0.8)*LAWN_GS;lawn.z[n]=LAWN_Z0+(j+0.5+(Math.random()-0.5)*0.8)*LAWN_GS;
  lawn.r[n]=Math.random()*6.3;lawn.s[n]=0.8+Math.random()*0.4;lawn.nz[n]=hash(i*1.3+7,j*0.7+2);
  // shorter toward the edges so the patch feathers into the mesa grass; drifts of clumps gone to seed and straw coloured
  lawn.h[n]=(0.8+Math.random()*0.45)*(0.45+0.55*ss(0,1.2,e));
  const v=Math.random(),drift=ss(0.55,0.9,hash(i*0.11+3,j*0.13+5)),dry=Math.random()<0.15+0.4*drift?0.45+0.5*Math.random():0.12*Math.random();
  lwC.setRGB(0.36+0.08*v,0.55+0.1*v,0.2+0.04*v).lerp(new THREE.Color(0.8,0.72,0.42),dry);lawn.tc[n*3]=lwC.r;lawn.tc[n*3+1]=lwC.g;lawn.tc[n*3+2]=lwC.b}
// the mesa's short grass tufts give way to the patch
for(let n=0;n<TUFTS;n++)if(tX[n]>LAWN_X0-0.2&&tX[n]<LAWN_X0+LAWN_NX*LAWN_GS+0.2&&tZ[n]>LAWN_Z0-0.2&&tZ[n]<LAWN_Z0+LAWN_NZ*LAWN_GS+0.2){tI[n]=-1;tGone[n]=1;tuftPut(n,false)}
tuftFlush();
// ground under the patch: dark thatch under tall grass, light and dark stripes once it is cut, fading as it grows back
const LAWN_VX=LAWN_NX+1,LAWN_VN=LAWN_VX*(LAWN_NZ+1),LAWN_TG=[0.24,0.34,0.15],LAWN_LT=[0.46,0.66,0.29],LAWN_DK=[0.27,0.44,0.17];
const lawnGround=(function(){const P=new Float32Array(LAWN_VN*3),ix=[];
  for(let j=0;j<=LAWN_NZ;j++)for(let i=0;i<=LAWN_NX;i++){const k=j*LAWN_VX+i;P[k*3]=LAWN_X0+i*LAWN_GS;P[k*3+2]=LAWN_Z0+j*LAWN_GS}
  for(let j=0;j<LAWN_NZ;j++)for(let i=0;i<LAWN_NX;i++){const a=j*LAWN_VX+i;ix.push(a,a+LAWN_VX,a+1,a+1,a+LAWN_VX,a+LAWN_VX+1)}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(P,3));g.setAttribute('normal',new THREE.BufferAttribute(upNormals(LAWN_VN*3),3));
  g.setAttribute('color',new THREE.BufferAttribute(new Float32Array(LAWN_VN*3),3));g.setAttribute('dirt',new THREE.BufferAttribute(new Float32Array(LAWN_VN),1));
  g.setAttribute('wetT',new THREE.BufferAttribute(new Float32Array(LAWN_VN).fill(-1e4),1));g.setIndex(ix);
  g.setAttribute('aGrain',new THREE.BufferAttribute(new Float32Array(LAWN_VN*2),2));
  const mat=groundMat.clone();mat.polygonOffset=true;
  // the mesa ground's shading, plus the stripes: lighter looking along the grain, darker against it, softer from overhead
  mat.onBeforeCompile=sh=>{groundMat.onBeforeCompile(sh);
    sh.vertexShader='attribute vec2 aGrain;\nvarying vec2 vGrain;\nvarying vec3 vLG;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvGrain=aGrain;vLG=(modelMatrix*vec4(transformed,1.0)).xyz;');
    sh.fragmentShader='varying vec2 vGrain;\nvarying vec3 vLG;\n'+sh.fragmentShader.replace('#include <specularmap_fragment>',
      '{vec3 cv=vLG-cameraPosition;float cd=length(cv);vec2 vh=cv.xz/max(0.001,length(cv.xz));diffuseColor.rgb*=1.0+0.45*dot(vh,vGrain)*(1.0-0.5*smoothstep(0.5,0.95,-cv.y/cd));}\n#include <specularmap_fragment>')};mat.polygonOffsetFactor=-1;mat.polygonOffsetUnits=-4;
  const m=new THREE.Mesh(g,mat);m.receiveShadow=true;scene.add(m);return m})();
function lawnCellCol(n,out){const k=0.9+0.2*lawn.nz[n],f=ss(0,0.6,lawn.gd[n]);
  for(let q=0;q<3;q++){const mid=(LAWN_DK[q]+LAWN_LT[q])/2;out[q]=(mid+(LAWN_TG[q]-mid)*f)*k}return out}
// how strongly a cell shows its stripe: full when fresh cut, gone once it has grown back (never-cut grass has none)
const lawnAmp=n=>lawn.dug[n]?0:1-ss(0,0.7,lawn.gd[n]);
const lwCol=[0,0,0];
// a ground vertex takes the average of the cells around it
function lawnVert(i,j){const ca=lawnGround.geometry.attributes.color.array,ga=lawnGround.geometry.attributes.aGrain.array,k=j*LAWN_VX+i;let r=0,g=0,b=0,gx=0,gz=0,c=0;
  for(let jj=j-1;jj<=j;jj++)for(let ii=i-1;ii<=i;ii++){if(ii<0||jj<0||ii>=LAWN_NX||jj>=LAWN_NZ)continue;const n=jj*LAWN_NX+ii,a=lawnAmp(n);
    lawnCellCol(n,lwCol);r+=lwCol[0];g+=lwCol[1];b+=lwCol[2];gx+=Math.sin(lawn.ga[n])*a;gz+=Math.cos(lawn.ga[n])*a;c++}
  ca[k*3]=r/c;ca[k*3+1]=g/c;ca[k*3+2]=b/c;ga[k*2]=gx/c;ga[k*2+1]=gz/c}
// one clump at its drawn growth gd: stubble rising back to full height, its stripe colour fading into the tall grass
// colour; gone where the ground was dug or buried
function lawnSet(n){
  if(lawn.dug[n]){lawnClumps.setMatrixAt(n,ZERO_M);lawn.ht[n]=0;return}
  const g=lawn.gd[n],stub=TU.lawnCut/LAWN_BH*(0.8+0.4*lawn.nz[n]),f=ss(0,0.7,g);
  lwO.position.set(lawn.x[n],hAt(lawn.x[n],lawn.z[n])-0.02,lawn.z[n]);lwO.rotation.set(0,lawn.r[n],0);
  const sy=stub+(lawn.h[n]-stub)*Math.pow(g,1.3);lawn.ht[n]=sy*LAWN_BH;
  lwO.scale.set(lawn.s[n],sy,lawn.s[n]);lwO.updateMatrix();lawnClumps.setMatrixAt(n,lwO.matrix);
  const t=0.5,k=0.9+0.2*lawn.nz[n];
  lwC.setRGB((0.36+0.2*t)*k,(0.55+0.22*t)*k,(0.21+0.11*t)*k);lwC.r+=(lawn.tc[n*3]-lwC.r)*f;lwC.g+=(lawn.tc[n*3+1]-lwC.g)*f;lwC.b+=(lawn.tc[n*3+2]-lwC.b)*f;
  lawnClumps.setColorAt(n,lwC)}
// the grain and stripe strength each clump shows, and the average height of the eight around it (the mesa grass
// outside the patch counts as 3 in)
function lawnShade(i0,i1,j0,j1){const A=lawnGeo.attributes.aLawn.array;
  for(let j=Math.max(0,j0);j<=Math.min(LAWN_NZ-1,j1);j++)for(let i=Math.max(0,i0);i<=Math.min(LAWN_NX-1,i1);i++){const n=j*LAWN_NX+i,a=lawnAmp(n);let hs=0;
    for(let jj=j-1;jj<=j+1;jj++)for(let ii=i-1;ii<=i+1;ii++){if(ii===i&&jj===j)continue;hs+=ii<0||jj<0||ii>=LAWN_NX||jj>=LAWN_NZ?0.08:lawn.ht[jj*LAWN_NX+ii]}
    A[n*4]=Math.sin(lawn.ga[n])*a;A[n*4+1]=Math.cos(lawn.ga[n])*a;A[n*4+2]=hs/8}
  lawn.aDirty=true}
function lawnPaint(n){lawnSet(n);const i=n%LAWN_NX,j=(n/LAWN_NX)|0;for(let jj=j;jj<=j+1;jj++)for(let ii=i;ii<=i+1;ii++)lawnVert(ii,jj);lawnShade(i-1,i+1,j-1,j+1);lawn.mDirty=lawn.cDirty=lawn.gDirty=lawn.mapDirty=lawn.sDirty=true}
// regrowth: a few rows a frame, redrawing the cells that have grown visibly since they were last drawn
function lawnGrow(){
  for(let r=0;r<4;r++){const j=lawn.row;lawn.row=(lawn.row+1)%LAWN_NZ;let any=false;
    for(let i=0;i<LAWN_NX;i++){const n=j*LAWN_NX+i;if(lawn.dug[n]||lawn.gd[n]>=1)continue;const g=lawnG(n);
      if(g-lawn.gd[n]>0.02||(g>=1&&lawn.gd[n]<1)){lawn.gd[n]=g;lawnSet(n);any=true}}
    if(any){for(let jj=j;jj<=j+1;jj++)for(let i=0;i<=LAWN_NX;i++)lawnVert(i,jj);lawnShade(0,LAWN_NX-1,j-1,j+1);lawn.mDirty=lawn.cDirty=lawn.gDirty=lawn.mapDirty=true}}}
// follow the terrain: grass goes where the ground was dug or dumped on, and the stripe ground sinks out of sight there
function lawnTerrain(){
  if(dI1<LAWN_I0||dI0>LAWN_I1||dJ1<LAWN_J0||dJ0>LAWN_J1)return;
  for(let n=0;n<LAWN_N;n++){const x=lawn.x[n],z=lawn.z[n],d=Math.abs(hAt(x,z)-h0At(x,z))>0.04?1:0;
    if(d&&!lawn.dug[n]){lawn.dug[n]=1;lawn.nDug++}
    lawnSet(n)}
  lawnShade(0,LAWN_NX-1,0,LAWN_NZ-1);
  const p=lawnGround.geometry.attributes.position.array;
  for(let k=0;k<LAWN_VN;k++){const x=p[k*3],z=p[k*3+2],h=hAt(x,z);p[k*3+1]=Math.abs(h-h0At(x,z))>0.04?h-0.4:h+0.015}
  lawn.mDirty=lawn.cDirty=lawn.gDirty=lawn.mapDirty=true;lawnGround.geometry.attributes.position.needsUpdate=true}
// Reset brings back fresh ground, so dug or buried cells come back as tall sod, but mowed grass stays mowed and keeps growing
function lawnReset(){for(let n=0;n<LAWN_N;n++)if(lawn.dug[n]){lawn.ct[n]=-1e9;lawn.gd[n]=1;lawn.str[n]=0}lawn.dug.fill(0);lawn.nDug=0;
  const sv=[dI0,dI1,dJ0,dJ1];dI0=LAWN_I0;dI1=LAWN_I1;dJ0=LAWN_J0;dJ1=LAWN_J1;lawnTerrain();[dI0,dI1,dJ0,dJ1]=sv;
  for(let j=0;j<=LAWN_NZ;j++)for(let i=0;i<=LAWN_NX;i++)lawnVert(i,j);
  for(const c of clips)c.t=c.life;lawnCount()}
// the lawn is saved in this browser so it is still mowed after a reload: two bytes a cell, how long ago it was cut on the
// lawn clock (0 full grown) and the heading it was mown in (its grain), plus the mowing time, the mower's spot and the wall-clock time of the save.
// Grass grows while the game runs, not while it is closed. Written at most every 2 s while it changes and when the page is hidden
const LAWN_KEY='bhd_lawn';let mwSaved=null;
function lawnSave(){if(window.syncHold)return;lawn.sDirty=false;lawn.saveT=performance.now();const b=new Uint8Array(LAWN_N*2);
  for(let n=0;n<LAWN_N;n++){const a=lawn.t-lawn.ct[n];if(lawn.dug[n]||a>=(TU.lawnWait+TU.lawnGrow))continue;
    b[n*2]=1+Math.round(Math.max(0,a)/(TU.lawnWait+TU.lawnGrow)*254);const h=lawn.ga[n]/(Math.PI*2);b[n*2+1]=Math.round((h-Math.floor(h))*255)&255}
  let bin='';for(let k=0;k<b.length;k+=4096)bin+=String.fromCharCode.apply(null,b.subarray(k,k+4096));
  const el=lawn.startT?Math.round(((lawn.done?lawn.doneT:performance.now())-lawn.startT)/1000):0;
  try{localStorage.setItem(LAWN_KEY,JSON.stringify({v:3,n:LAWN_N,t:Date.now(),cells:btoa(bin),field:fieldSave(),el,done:lawn.done,
    mw:{x:+mw.x.toFixed(2),z:+mw.z.toFixed(2),yaw:+mw.yaw.toFixed(3)}}))}catch(e){}}
function lawnLoad(){let d=null;try{d=JSON.parse(localStorage.getItem(LAWN_KEY))}catch(e){}
  if(!d||(d.v!==2&&d.v!==3)||d.n!==LAWN_N||typeof d.cells!=='string')return;let b;try{b=atob(d.cells)}catch(e){return}
  if(b.length!==LAWN_N*2)return;let cut=0;
  for(let n=0;n<LAWN_N;n++){const a=b.charCodeAt(n*2);if(!a)continue;
    lawn.ct[n]=lawn.t-(a-1)/254*(TU.lawnWait+TU.lawnGrow);const q=b.charCodeAt(n*2+1);
    lawn.ga[n]=d.v===3?q/255*Math.PI*2:q>=128?Math.PI/4:Math.PI*1.25;lawn.str[n]=Math.max(-1,Math.min(1,(Math.cos(lawn.ga[n])+Math.sin(lawn.ga[n]))*0.8));lawn.gd[n]=lawnG(n);cut++}
  if(cut&&d.el>0){const now=performance.now();lawn.startT=now-d.el*1000;if(d.done){lawn.done=true;lawn.doneT=now}}
  lawnCount();if(lawn.pct>=0.97)lawn.done=true;fieldLoad(d.field);
  if(d.mw&&isFinite(d.mw.x)&&isFinite(d.mw.z)&&isFinite(d.mw.yaw))mwSaved=d.mw}
try{lawnLoad()}catch(e){lawn.ct.fill(-1e9);lawn.gd.fill(1);lawn.str.fill(0);lawn.ga.fill(0);mwSaved=null;try{localStorage.removeItem(LAWN_KEY)}catch(e2){}}
addEventListener('pagehide',lawnSave);
document.addEventListener('visibilitychange',()=>{if(document.hidden)lawnSave()});
// share of the patch that counts as mowed: below half its height (refreshed a few times a second)
function lawnCount(){let c=0;for(let n=0;n<LAWN_N;n++)if(!lawn.dug[n]&&lawnG(n)<0.5)c++;const live=LAWN_N-lawn.nDug;lawn.pct=live>0?c/live:1}
function lawnPct(){return lawn.pct}
// push the per-cell changes to the GPU once a frame
function lawnFlush(){
  if(lawn.mDirty||lawn.cDirty||lawn.aDirty){lawnFarStale=true;if(lawnFarOn)lawnFarSync()}
  if(lawn.mDirty){lawnClumps.instanceMatrix.needsUpdate=true;lawn.mDirty=false}
  if(lawn.cDirty&&lawnClumps.instanceColor){lawnClumps.instanceColor.needsUpdate=true;lawn.cDirty=false}
  if(lawn.gDirty){const ga=lawnGround.geometry.attributes;ga.color.needsUpdate=true;ga.aGrain.needsUpdate=true;lawn.gDirty=false}
  if(lawn.aDirty){lawnGeo.attributes.aLawn.needsUpdate=true;lawn.aDirty=false}}

// ---------- zero-turn mower ----------
// origin on the ground under the middle of the rear axle, nose toward +z. 52 in deck between the casters and the drive wheels
const MW_RED=M(0xc8291f,PAINT),MW_SEAT=M(0x1e1f21,{shininess:24,specular:0x222222}),MW_DECK=0.8,MW_HW=0.66,MW_HD=0.36,MW_TRACK=1.16,MW_TIRE=0.29,MW_CAST=0.11;
const MW_START={x:7,z:9.2,yaw:0};
const mw={x:0,z:0,y:0,yaw:0,pitch:0,roll:0,l:0,r:0,vl:0,vr:0,v:0,w:0,spinL:0,spinR:0,cast:[0,0],load:0,blades:0};
const mower=new THREE.Group();mower.rotation.order='YXZ';scene.add(mower);
// frame, deck and body
for(const x of [-0.42,0.42])box(0.08,0.08,1.95,STEEL,x,0.38,0.55,mower);
box(0.92,0.07,0.07,STEEL,0,0.38,1.5,mower);
box(1.32,0.13,0.74,MW_RED,0,0.25,MW_DECK,mower);
box(1.38,0.06,0.8,MW_RED,0,0.18,MW_DECK,mower);
for(const x of [-0.42,0,0.42]){const c=cyl(0.21,0.24,0.05,20,MW_RED,mower);c.position.set(x,0.34,MW_DECK+(x?0.04:-0.06))}
box(1.0,0.03,0.3,STEEL_L,0,0.37,MW_DECK-0.1,mower);
{const ch=box(0.26,0.1,0.34,STEEL,-0.78,0.2,MW_DECK,mower);ch.rotation.z=-0.25}
for(const x of [-0.7,0.7]){const ro=cyl(0.04,0.04,0.07,10,STEEL_L,mower);ro.rotation.z=Math.PI/2;ro.position.set(x,0.12,MW_DECK+0.42)}
box(0.72,0.04,0.42,STEEL_L,0,0.46,1.2,mower);
box(0.72,0.14,0.04,MW_RED,0,0.4,1.42,mower);
box(0.96,0.28,0.72,MW_RED,0,0.56,0.12,mower);
for(const x of [-0.6,0.6]){box(0.32,0.05,0.62,MW_RED,x,0.66,0.0,mower);box(0.05,0.16,0.62,MW_RED,x*1.24,0.58,0.0,mower);
  const tk=cyl(0.1,0.1,0.3,14,MW_SEAT,mower);tk.position.set(x*0.95,0.78,0.12);const cp=cyl(0.04,0.04,0.04,10,STEEL,mower);cp.position.set(x*0.95,0.95,0.12)}
// seat and the operator's console
box(0.52,0.1,0.46,MW_SEAT,0,0.76,0.1,mower);
{const bk=box(0.52,0.46,0.1,MW_SEAT,0,1.02,-0.15,mower);bk.rotation.x=-0.18}
for(const x of [-0.29,0.29])box(0.06,0.06,0.36,MW_SEAT,x,0.92,0.08,mower);
// engine behind the seat, air filter, muffler
box(0.6,0.4,0.42,STEEL_L,0,0.62,-0.42,mower);box(0.64,0.05,0.46,MW_RED,0,0.85,-0.42,mower);
{const af=cyl(0.09,0.09,0.12,14,MW_SEAT,mower);af.position.set(0.16,0.94,-0.42);const mf=cyl(0.06,0.06,0.3,12,STEEL,mower);mf.rotation.z=Math.PI/2;mf.position.set(0,0.5,-0.66)}
// roll bar
for(const x of [-0.42,0.42]){const u=cyl(0.03,0.03,1.25,10,MW_SEAT,mower);u.position.set(x,1.15,-0.3)}
{const t=cyl(0.03,0.03,0.84,10,MW_SEAT,mower);t.rotation.z=Math.PI/2;t.position.set(0,1.77,-0.3)}
for(const x of [-0.42,0.42]){const s=cyl(0.04,0.04,0.12,10,MW_RED,mower);s.position.set(x,0.62,-0.3)}
// lap bars: each stick drives the wheel on its side; they tip forward and back with the input
const mwBars=[];
for(const sd of [1,-1]){const g=new THREE.Group();g.position.set(sd*0.38,0.7,0.3);mower.add(g);
  const up=cyl(0.018,0.018,0.34,8,STEEL,g);up.position.y=0.17;
  const tb=cyl(0.018,0.018,0.26,8,STEEL,g);tb.rotation.z=Math.PI/2;tb.position.set(-sd*0.13,0.34,0.03);
  const gr=cyl(0.026,0.026,0.16,10,MW_SEAT,g);gr.rotation.z=Math.PI/2;gr.position.set(-sd*0.19,0.34,0.03);
  mergeStatic(g,[]);mwBars.push(g)}
// rear drive tyres with lugs, and front casters that swivel to follow the turn
const mwWheels=[];
for(const sd of [1,-1]){const g=new THREE.Group();g.position.set(sd*MW_TRACK/2,MW_TIRE,0);mower.add(g);
  const t=cyl(MW_TIRE,MW_TIRE,0.24,22,RUBBER,g);t.rotation.z=Math.PI/2;
  for(let k=0;k<14;k++){const a=k/14*Math.PI*2,lug=box(0.25,0.035,0.06,RUBBER,0,Math.sin(a)*(MW_TIRE+0.012),Math.cos(a)*(MW_TIRE+0.012),g);lug.rotation.x=-a+(k%2?0.4:-0.4)}
  const rim=cyl(0.15,0.15,0.25,16,STEEL_L,g);rim.rotation.z=Math.PI/2;const hb=cyl(0.05,0.05,0.27,10,CHROME,g);hb.rotation.z=Math.PI/2;
  mergeStatic(g,[]);mwWheels.push(g)}
const mwCasters=[];
for(const sd of [1,-1]){const sw=new THREE.Group();sw.position.set(sd*0.46,0,1.55);mower.add(sw);
  const post=cyl(0.025,0.025,0.2,8,STEEL,sw);post.position.y=0.34;
  for(const x of [-0.06,0.06])box(0.02,0.18,0.05,STEEL,x,0.2,-0.05,sw);
  box(0.14,0.02,0.07,STEEL,0,0.29,-0.03,sw);
  const wh=new THREE.Group();wh.position.set(0,MW_CAST,-0.1);sw.add(wh);
  const t=cyl(MW_CAST,MW_CAST,0.09,16,RUBBER,wh);t.rotation.z=Math.PI/2;const hub=cyl(0.05,0.05,0.1,10,STEEL_L,wh);hub.rotation.z=Math.PI/2;
  mergeStatic(sw,[wh]);mergeStatic(wh,[]);mwCasters.push({sw,wh})}
mergeStatic(mower,[...mwBars,...mwWheels,...mwCasters.map(c=>c.sw)]);
mower.traverse(o=>{if(o.isMesh&&!o.material.transparent)o.receiveShadow=true});
const MW_C=[0.0,0.85],MW_R=0.72;
// the first reset (page load) puts the mower where it was left; the Reset button sends it home
function mowReset(){Object.assign(mw,MW_START,mwSaved||{},{l:0,r:0,vl:0,vr:0,v:0,w:0,load:0,blades:0});mwSaved=null;mw.y=surfAt(mw.x,mw.z);lawnReset()}

// ---------- clippings out the chute ----------
const CLIP_N=160,clips=[],clipGeo=new THREE.TetrahedronGeometry(0.03);clipGeo.scale(1,0.4,1.6);
const clipMesh=new THREE.InstancedMesh(clipGeo,M(0x7aa64a),CLIP_N);clipMesh.frustumCulled=false;scene.add(clipMesh);
for(let i=0;i<CLIP_N;i++){clips.push({x:0,y:0,z:0,vx:0,vy:0,vz:0,t:1,life:1,s:1,r:0});clipMesh.setMatrixAt(i,ZERO_M)}
let clipHead=0,clipLive=false;
const clipV=new THREE.Vector3(),clipP=new THREE.Vector3();
function clipSpawn(n){
  for(let q=0;q<n;q++){const c=clips[clipHead];clipHead=(clipHead+1)%CLIP_N;
    mower.localToWorld(clipP.set(-0.88,0.22,MW_DECK+(Math.random()-0.5)*0.25));
    clipV.set(-2.2-Math.random()*1.8,0.8+Math.random()*1.4,(Math.random()-0.5)*1.4).applyAxisAngle(UPY,mw.yaw);
    Object.assign(c,{x:clipP.x,y:clipP.y,z:clipP.z,vx:clipV.x+Math.sin(mw.yaw)*mw.v,vy:clipV.y,vz:clipV.z+Math.cos(mw.yaw)*mw.v,t:0,life:1.6+Math.random()*1.4,s:0.7+Math.random()*0.8,r:Math.random()*6})}
  clipLive=true}
function clipTick(dt){if(!clipLive)return;let any=false;
  for(let i=0;i<CLIP_N;i++){const c=clips[i];if(c.t>=c.life)continue;c.t+=dt;
    if(c.t>=c.life){clipMesh.setMatrixAt(i,ZERO_M);continue}any=true;
    const g=hAt(c.x,c.z)+0.01;
    if(c.y>g){const dr=Math.exp(-dt*2.2);c.vx*=dr;c.vz*=dr;c.vy=c.vy*dr-9.8*dt*0.55;c.x+=c.vx*dt;c.y+=c.vy*dt;c.z+=c.vz*dt;c.r+=dt*9;if(c.y<g)c.y=g}
    const k=c.s*Math.min(1,(c.life-c.t)*2);lwO.position.set(c.x,c.y,c.z);lwO.rotation.set(c.r,c.r*0.7,0);lwO.scale.setScalar(k);lwO.updateMatrix();clipMesh.setMatrixAt(i,lwO.matrix)}
  clipMesh.instanceMatrix.needsUpdate=true;clipLive=any}

// ---------- driving and cutting ----------
// hydrostatic drive: each lap bar sets its wheel's speed (8 mph forward, 4 mph back), so opposite bars spin it in place
function mowCut(){
  const sy=Math.sin(mw.yaw),cy=Math.cos(mw.yaw),dx0=mw.x+sy*MW_DECK,dz0=mw.z+cy*MW_DECK,R=0.85;
  const i0=Math.max(0,Math.floor((dx0-R-LAWN_X0)/LAWN_GS)),i1=Math.min(LAWN_NX-1,Math.floor((dx0+R-LAWN_X0)/LAWN_GS));
  const j0=Math.max(0,Math.floor((dz0-R-LAWN_Z0)/LAWN_GS)),j1=Math.min(LAWN_NZ-1,Math.floor((dz0+R-LAWN_Z0)/LAWN_GS));
  // each pass lays the grass the way the mower heads (lawn.ga); the shaders turn that into stripes for the camera,
  // and sv keeps the map's fixed light/dark (north or east light, south or west dark)
  const sv=clamp((cy+sy)*0.8,-1,1);let n0=0;
  for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){const n=j*LAWN_NX+i;if(lawn.dug[n])continue;
    const dx=LAWN_X0+(i+0.5)*LAWN_GS-mw.x,dz=LAWN_Z0+(j+0.5)*LAWN_GS-mw.z,lx=dx*cy-dz*sy,lz=dx*sy+dz*cy;
    if(Math.abs(lx)>MW_HW||Math.abs(lz-MW_DECK)>MW_HD)continue;
    // anything standing above the deck gets cut, and the regrowth clock starts over; tall grass throws clippings
    const g=lawnG(n);lawn.ct[n]=lawn.t;if(g>0.3)n0++;
    const da=mw.yaw-lawn.ga[n];
    if(g>0.03||lawn.gd[n]>0)statCut(n,g);
    if(g>0.03||lawn.gd[n]>0||Math.abs(Math.atan2(Math.sin(da),Math.cos(da)))>0.5){lawn.str[n]=sv;lawn.ga[n]=mw.yaw;lawn.gd[n]=0;lawnPaint(n)}}
  // and the field grass anywhere on the mesa (scenery.js); a few clumps throw clippings like a cell of tall grass
  return n0+Math.ceil(fieldCut(dx0,dz0,mw.yaw,MW_HW,MW_HD)/3)}
function updateMower(dt,inL,inR){
  // the bars ease to where they are held; the pumps answer in about a third of a second
  mw.l+=clamp(inL-mw.l,-3*dt,3*dt);mw.r+=clamp(inR-mw.r,-3*dt,3*dt);
  const bog=1-0.25*mw.load;
  mw.vl+=(mw.l*(mw.l>0?TU.mwFwd:TU.mwRev)*bog-mw.vl)*Math.min(1,dt*6);mw.vr+=(mw.r*(mw.r>0?TU.mwFwd:TU.mwRev)*bog-mw.vr)*Math.min(1,dt*6);
  mw.v=(mw.vl+mw.vr)/2;mw.w=(mw.vr-mw.vl)/MW_TRACK;
  const ox=mw.x,oz=mw.z,w0=wallCount(mw.x,mw.z,mw.yaw,MW_P);
  mw.yaw+=mw.w*dt;mw.x+=Math.sin(mw.yaw)*mw.v*dt;mw.z+=Math.cos(mw.yaw)*mw.v*dt;
  // each drive wheel splashes through puddles
  {const c=Math.cos(mw.yaw),s=Math.sin(mw.yaw),h=MW_TRACK/2;splashMud(mw.x-h*c,mw.z+h*s,mw.yaw,mw.vl,0.12,0.5,dt);splashMud(mw.x+h*c,mw.z-h*s,mw.yaw,mw.vr,0.12,0.5,dt)}
  if(wallCount(mw.x,mw.z,mw.yaw,MW_P)>w0){mw.x=ox;mw.z=oz}
  // stays on the mesa, steers clear of the excavator, the truck and tall blocks; the big machines shove it aside
  for(const lz of MW_C){const sy=Math.sin(mw.yaw),cy=Math.cos(mw.yaw),px=mw.x+sy*lz,pz=mw.z+cy*lz,q=landClamp(px,pz,2,1);
    mw.x+=q[0]-px;mw.z+=q[1]-pz;
    const ex=px-st.x,ez=pz-st.z,ed=Math.hypot(ex,ez),em=MW_R+2.7;if(ed<em&&ed>1e-3){mw.x+=ex/ed*(em-ed);mw.z+=ez/ed*(em-ed)}
    for(const tz of TR_C){const tx=tr.x+Math.sin(tr.yaw)*tz,tzz=tr.z+Math.cos(tr.yaw)*tz,dx=px-tx,dz=pz-tzz,d=Math.hypot(dx,dz),m=MW_R+TR_R;
      if(d<m&&d>1e-3){mw.x+=dx/d*(m-d);mw.z+=dz/d*(m-d)}}
    for(const q of SK_C){const dx=px-sk.x-Math.sin(sk.yaw)*q,dz=pz-sk.z-Math.cos(sk.yaw)*q,d=Math.hypot(dx,dz),m=MW_R+SK_R;if(d<m&&d>1e-3){mw.x+=dx/d*(m-d);mw.z+=dz/d*(m-d)}}}
  blkPush(mw,MW_C,MW_R);
  const sy=Math.sin(mw.yaw),cy=Math.cos(mw.yaw);
  // the tyres and casters press the grass down (scenery.js)
  if(Math.abs(mw.v)>0.05||Math.abs(mw.w)>0.05)for(const [lx,lz] of [[MW_TRACK/2,0],[-MW_TRACK/2,0],[0.46,1.45],[-0.46,1.45]])grassCrush(mw.x+lx*cy+lz*sy,mw.z-lx*sy+lz*cy,mw.yaw,lz?0.06:0.13,lz?0.1:0.25,5,0.85,dt);
  // rides the ground on its four wheels
  const smp=(lx,lz)=>surfAt(mw.x+lx*cy+lz*sy,mw.z-lx*sy+lz*cy);
  const fL=smp(0.46,1.45),fR=smp(-0.46,1.45),bL=smp(MW_TRACK/2,0),bR=smp(-MW_TRACK/2,0),k=Math.min(1,dt*12);
  mw.y+=((bL+bR)/2-mw.y)*k;mw.pitch+=(-Math.atan2((fL+fR)/2-(bL+bR)/2,1.45)-mw.pitch)*k;mw.roll+=(Math.atan2((fL+bL)/2-(fR+bR)/2,1.0)-mw.roll)*k;
  mower.position.set(mw.x,mw.y,mw.z);mower.rotation.set(mw.pitch,mw.yaw,mw.roll);
  mwBars[0].rotation.x=mw.l*0.32;mwBars[1].rotation.x=mw.r*0.32;
  mw.spinL+=mw.vl*dt/MW_TIRE;mw.spinR+=mw.vr*dt/MW_TIRE;mwWheels[0].rotation.x=mw.spinL;mwWheels[1].rotation.x=mw.spinR;
  // casters trail behind their pivots, so they swing round to roll the way their corner of the mower is moving
  for(let c=0;c<2;c++){const px=c?-0.46:0.46,pz=1.55,vx=mw.w*pz,vz=mw.v-mw.w*px,sp=Math.hypot(vx,vz),cs=mwCasters[c];
    if(sp>0.05){let a=Math.atan2(vx,vz)-mw.cast[c];a=Math.atan2(Math.sin(a),Math.cos(a));mw.cast[c]+=a*Math.min(1,dt*sp*8)}
    cs.sw.rotation.y=mw.cast[c];cs.wh.rotation.x+=sp*dt/MW_CAST*(Math.cos(Math.atan2(vx,vz)-mw.cast[c])>0?1:-1)}
  // blades run while it is the machine in hand
  const on=mode==='mow'&&!bench.on;mw.blades+=((on?1:0)-mw.blades)*Math.min(1,dt*(on?2:1));
  let cutN=0;if(on)cutN=mowCut();
  mw.load+=((cutN>0?Math.min(1,0.35+cutN*0.12):0)-mw.load)*Math.min(1,dt*(cutN?6:2));
  if(cutN){clipSpawn(Math.min(6,cutN*2));
    if(!lawn.startT)lawn.startT=performance.now();started()}
  // the grass grows back: once the lawn is under half mowed again, it is a fresh job
  lawn.t+=dt;lawnGrow();fieldGrow(dt);lawn.pctT-=dt;if(lawn.pctT<=0){lawn.pctT=0.25;lawnCount()}
  if(lawn.done&&lawn.pct<0.5){lawn.done=false;lawn.startT=0;toast(say('lawnBack'),'',3500)}
  if(!lawn.done&&lawn.pct>=0.97){lawn.done=true;lawn.doneT=performance.now();const s=Math.round((lawn.doneT-lawn.startT)/1000);statLawnDone(s);
    toast(say('lawnDone',{time:`${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`}),'good',5000)}
  // the grass leans away from whatever drives through it
  const P=lawnPush.value;P[0].set(mw.x+sy*0.7,mw.z+cy*0.7,0.95,0);P[1].set(st.x,st.z,2.4,0);P[4].set(wk.inside?1e5:wk.x,wk.z,0.45,0);
  P[2].set(tr.x+Math.sin(tr.yaw)*2.0,tr.z+Math.cos(tr.yaw)*2.0,1.6,0);P[3].set(tr.x-Math.sin(tr.yaw)*2.4,tr.z-Math.cos(tr.yaw)*2.4,1.6,0);
  clipTick(dt);lawnFlush();
  if(Math.abs(mw.v)>0.01||Math.abs(mw.w)>0.01)lawn.sDirty=true;
  if(lawn.sDirty&&performance.now()-lawn.saveT>2000)lawnSave();
}
