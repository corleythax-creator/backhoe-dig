// Backhoe Dig: dig-zone heightmap, the road, soil layers, digging, dumping, slumping and cave-ins.
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.
// ---------- terrain heightmap ----------
// dig grid: 64 m square at 0.16 m (about 6 in) per cell. GRID_K = cells per 0.32 m, the old 1 ft cell, so reaches and
// settling speeds written in cells stay the same in feet
const S=64,N=400,CELL=S/N,V=N+1,CA=CELL*CELL,FLOOR=3.5,GRID_K=Math.round(0.32/CELL);
const H=new Float32Array(V*V),H0=new Float32Array(V*V),grass=new Float32Array(V*V*3),paint=new Uint8Array(V*V),nz=new Float32Array(V*V),rockA=new Float32Array(V*V);
const ss=(a,b,x)=>{const t=Math.min(1,Math.max(0,(x-a)/(b-a)));return t*t*(3-2*t)};
const hash=(i,j)=>{const s=Math.sin(i*127.1+j*311.7)*43758.5453;return s-Math.floor(s)};
// the site sits on a flat grassy mesa; cliffs drop about 150 ft to meadows and a lake
const EDGE=30,WATER=-58,MZ=16;
function mesaR(x,z){z-=MZ;const a=Math.atan2(z,x);return Math.pow(Math.pow(Math.abs(x),4)+Math.pow(Math.abs(z),4),0.25)*(1+0.06*Math.sin(a*5+0.7)+0.035*Math.sin(a*11+2.1))}
// a graded dirt road loops the mesa just inside the rim; roadOff is metres across it from the centreline
const ROAD_R=26.8,ROAD_W=3.6;
function roadOff(x,z){const r=mesaR(x,z);if(Math.abs(r-ROAD_R)>6)return 99;const e=0.05,gx=mesaR(x+e,z)-mesaR(x-e,z),gz=mesaR(x,z+e)-mesaR(x,z-e);return (r-ROAD_R)*2*e/Math.max(0.03,Math.hypot(gx,gz))}
function roadAmt(x,z){return 1-ss(ROAD_W/2-0.35,ROAD_W/2+0.45,Math.abs(roadOff(x,z)))}
// packed tan dirt, darker in the two wheel tracks, a little grass up the middle; blends colour c (rgb array) toward it, returns the amount
function roadTint(x,z,c,n){const o=Math.abs(roadOff(x,z)),a=1-ss(ROAD_W/2-0.35,ROAD_W/2+0.45,o);if(a<=0)return 0;
  const rut=1-0.17*Math.exp(-((o-0.95)/0.32)*((o-0.95)/0.32)),mid=0.35*(1-ss(0.15,0.45,o)),v=0.92+0.16*n;
  const rc=[0.58*v*rut,0.47*v*rut,0.33*v*rut];rc[0]+=(0.36-rc[0])*mid;rc[1]+=(0.5-rc[1])*mid;rc[2]+=(0.26-rc[2])*mid;
  for(let q=0;q<3;q++)c[q]+=(rc[q]-c[q])*a;return a*(1-mid)}
function baseHeight(x,z){
  const top=0.35*Math.sin(x*0.13+1.3)*Math.cos(z*0.11)+0.2*Math.sin(x*0.31+z*0.23);
  const r=mesaR(x,z);
  if(r<EDGE){const lip=ss(EDGE-6,EDGE,r)*0.4*(0.5+0.5*Math.sin(Math.atan2(z-MZ,x)*7));return top*0.15+(lip>0?lip*(1-roadAmt(x,z)):0)}
  const d=r-EDGE;
  const cliff=-46*ss(0,7,d)-1.6*Math.sin(d*1.9)*ss(0,1,d)*(1-ss(6,9,d));
  const low=-14*ss(7,60,d)-9*ss(40,95,d);
  const bumps=(Math.sin(x*0.07+z*0.05)*3+Math.sin(x*0.17-z*0.13)*1.5+Math.sin(x*0.031-z*0.027+1)*4)*ss(8,22,d);
  return cliff+low+bumps+0.5*(1-ss(0,2,d));
}
const PIPE_Z=-5.5, TRENCH_Z0=-8.5, TRENCH_Z1=-3.0;
for(let j=0;j<V;j++)for(let i=0;i<V;i++){
  const k=j*V+i,x=i*CELL-S/2,z=j*CELL-S/2;
  H0[k]=H[k]=baseHeight(x,z); nz[k]=hash(i*1.7+3,j*2.3+1);
  const n=hash(i,j),n2=hash(i*0.37|0,j*0.37|0);
  grass[k*3]=0.30+0.07*n+0.05*n2; grass[k*3+1]=0.50+0.08*n+0.04*n2; grass[k*3+2]=0.24+0.04*n;
  {const h=H0[k],sl=(Math.abs(baseHeight(x+0.5,z)-baseHeight(x-0.5,z))+Math.abs(baseHeight(x,z+0.5)-baseHeight(x,z-0.5))),rock=ss(0.55,1.1,sl),sand=1-ss(WATER+0.6,WATER+2.8,h),st2=0.06*Math.sin(h*1.4+n);
    if(rock>0){grass[k*3]+=(0.50+0.06*n+st2-grass[k*3])*rock;grass[k*3+1]+=(0.44+0.05*n+st2-grass[k*3+1])*rock;grass[k*3+2]+=(0.38+0.04*n+st2-grass[k*3+2])*rock}
    if(sand>0){grass[k*3]+=(0.80-grass[k*3])*sand;grass[k*3+1]+=(0.72-grass[k*3+1])*sand;grass[k*3+2]+=(0.52-grass[k*3+2])*sand}
    const rc=[grass[k*3],grass[k*3+1],grass[k*3+2]],ra=roadTint(x,z,rc,n);if(ra>0){grass[k*3]=rc[0];grass[k*3+1]=rc[1];grass[k*3+2]=rc[2]}
    rockA[k]=Math.min(1,Math.max(rock*0.95+sand*0.4,ra*0.9))}
  const hc=CELL/2+0.001,onSide=Math.abs(Math.abs(x)-0.5)<hc&&z>=TRENCH_Z0-hc&&z<=TRENCH_Z1+hc;
  const onEnd=(Math.abs(z-TRENCH_Z0)<hc||Math.abs(z-TRENCH_Z1)<hc)&&Math.abs(x)<=0.5+hc;
  if(onSide||onEnd)paint[k]=1;
  else if(Math.abs(z-PIPE_Z)<hc&&Math.abs(x)<12&&(Math.floor(x+50)&1)===0)paint[k]=2;
}
const PIPE_Y=baseHeight(0,PIPE_Z)-1.3, PIPE_R=0.08;
// textures: grass and dirt detail blended per vertex on the ground, grime overlay on the machine
const texManager=new THREE.LoadingManager(),texLoader=new THREE.TextureLoader(texManager);
function loadTex(url){const t=texLoader.load(url);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());return t}
const texGrass=loadTex('grass.jpg'),texDirt=loadTex('dirt.jpg'),texGrime=loadTex('grime.jpg');
const texMixU={value:0};
const groundOcc={value:[new THREE.Vector4(0,0,0,0),new THREE.Vector4(1.3,1.9,0,0),new THREE.Vector4(0,0,0,0),new THREE.Vector4(1.2,3.6,0.3,0)]};
const groundMat=M(0xffffff,{vertexColors:true});
groundMat.onBeforeCompile=sh=>{
  sh.uniforms.tGrass={value:texGrass};sh.uniforms.tDirt={value:texDirt};sh.uniforms.texMix=texMixU;sh.uniforms.uTime=timeU;
  // wetT: when this ground was last cut or dumped; fresh dirt shows dark and damp and dries over a few minutes
  sh.vertexShader='attribute float dirt;\nattribute float wetT;\nuniform float uTime;\nvarying float vDirt;\nvarying float vWet;\nvarying vec2 vWXZ;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvDirt=dirt;\nvWet=exp(-max(0.0,uTime-wetT)/100.0);\nvWXZ=(modelMatrix*vec4(transformed,1.0)).xz;');
  // texture detail goes in ahead of the vertex colour so it is turned linear with it. groundOcc: sky light under the
  // excavator and truck, dimmed by distance to each footprint (x, z, yaw, unused; half width, half length, forward offset, unused)
  sh.uniforms.uOcc=groundOcc;
  sh.fragmentShader='uniform sampler2D tGrass;\nuniform sampler2D tDirt;\nuniform float texMix;\nuniform vec4 uOcc[4];\nvarying float vDirt;\nvarying float vWet;\nvarying vec2 vWXZ;\n'+sh.fragmentShader.replace('#include <specularmap_fragment>','#include <specularmap_fragment>\nspecularStrength*=1.0+7.0*vWet*vDirt;').replace('#include <color_fragment>',
    'vec3 tg=texture2D(tGrass,vWXZ*0.22).rgb/vec3(0.36,0.468,0.178);\nvec3 td=texture2D(tDirt,vWXZ*0.45).rgb/vec3(0.461,0.255,0.123);\ndiffuseColor.rgb*=mix(vec3(1.0),clamp(mix(tg,td,vDirt),0.0,2.2),0.8*texMix);\ndiffuseColor.rgb*=1.0-0.32*vWet*vDirt;\n#include <color_fragment>').replace('#include <lights_fragment_end>',
    'float skyO=1.0;\nfor(int m=0;m<4;m+=2){vec2 d=vWXZ-uOcc[m].xy;float c=cos(uOcc[m].z),s=sin(uOcc[m].z);vec2 l=vec2(d.x*c-d.y*s,d.x*s+d.y*c-uOcc[m+1].z);vec2 q=abs(l)-uOcc[m+1].xy;\nfloat dist=length(max(q,0.0))+min(max(q.x,q.y),0.0);skyO*=1.0-0.75*(1.0-smoothstep(-0.4,1.6,dist));}\nirradiance*=skyO;\n#include <lights_fragment_end>');
};
const geo=new THREE.PlaneGeometry(S,S,N,N); geo.rotateX(-Math.PI/2);
const colors=new Float32Array(V*V*3);
geo.setAttribute('color',new THREE.BufferAttribute(colors,3));
const dirtA=new Float32Array(V*V);geo.setAttribute('dirt',new THREE.BufferAttribute(dirtA,1));
const wetT=new Float32Array(V*V).fill(-1e4);geo.setAttribute('wetT',new THREE.BufferAttribute(wetT,1));
// sky view: for dug and dumped dirt, how high the ground rises around it (8 directions, about 1 ft and 3 ft out)
// darkens trench floors and lower walls, since the ground casts no shadows on itself
const AO_S=[],AO_R=Math.round(0.95/CELL);
for(const [di,dj] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]])for(const rc of [Math.round(0.33/CELL),AO_R])AO_S.push(di*rc,dj*rc,rc*CELL*Math.hypot(di,dj));
function skyOcc(k,h){const i=k%V,j=(k/V)|0;let occ=0;
  for(let n=0;n<AO_S.length;n+=6){let s=0;
    for(let q=n;q<n+6;q+=3){const ii=i+AO_S[q],jj=j+AO_S[q+1];if(ii<0||ii>N||jj<0||jj>N)continue;const e=(H[jj*V+ii]-h)/AO_S[q+2];if(e>s)s=e}
    occ+=Math.atan(s)}
  return occ/(8*1.5708)}
const terrain=new THREE.Mesh(geo,groundMat);
terrain.receiveShadow=true; terrain.frustumCulled=false; scene.add(terrain);
const pos=geo.attributes.position;
let dI0=0,dI1=N,dJ0=0,dJ1=N,winOn=true;
function touch(i0,i1,j0,j1){if(!winOn){dI0=i0;dI1=i1;dJ0=j0;dJ1=j1;winOn=true}else{dI0=Math.min(dI0,i0);dI1=Math.max(dI1,i1);dJ0=Math.min(dJ0,j0);dJ1=Math.max(dJ1,j1)}}
function updateTerrain(){
  const p=pos.array,ja=Math.max(0,dJ0-1-AO_R),jb=Math.min(N,dJ1+1+AO_R);
  for(let k=ja*V;k<(jb+1)*V;k++){
    const h=H[k],d=h-H0[k],ad=Math.abs(d);
    p[k*3+1]=h;
    let r=grass[k*3],g=grass[k*3+1],b=grass[k*3+2];
    if(paint[k]&&ad<0.04){ if(paint[k]===1){r=0.93;g=0.93;b=0.9}else{r=0.96;g=0.78;b=0.1} }
    const t=ss(0.02,0.16,ad);dirtA[k]=Math.max(t,rockA[k]);
    if(t>0){
      let dr,dg,db;
      if(d<0){const c=SOIL[layerAt((k%V)*CELL-S/2,((k/V)|0)*CELL-S/2,-d,nz[k])].c,sh=1-0.12*ss(0.3,2.5,-d);dr=c[0]*sh;dg=c[1]*sh;db=c[2]*sh}
      else{dr=spoilC[k*3];dg=spoilC[k*3+1];db=spoilC[k*3+2]}
      const cn=(0.82+0.34*nz[k])*(1-0.7*skyOcc(k,h));dr*=cn;dg*=cn;db*=cn;
      r+=(dr-r)*t;g+=(dg-g)*t;b+=(db-b)*t;
    }
    colors[k*3]=r;colors[k*3+1]=g;colors[k*3+2]=b;
  }
  const off=ja*V*3,cnt=(jb-ja+1)*V*3;
  pos.updateRange.offset=off;pos.updateRange.count=cnt;
  const ca=geo.attributes.color;ca.updateRange.offset=off;ca.updateRange.count=cnt;
  const da=geo.attributes.dirt;da.updateRange.offset=off/3;da.updateRange.count=cnt/3;da.needsUpdate=true;
  const wa=geo.attributes.wetT;wa.updateRange.offset=off/3;wa.updateRange.count=cnt/3;wa.needsUpdate=true;
  pos.needsUpdate=true; ca.needsUpdate=true;
  snapClods(ja,jb);
}
function hAt(x,z){
  if(x<-S/2||x>S/2||z<-S/2||z>S/2)return baseHeight(x,z);
  let fx=(x+S/2)/CELL,fz=(z+S/2)/CELL;
  fx=Math.max(0,Math.min(N-0.001,fx)); fz=Math.max(0,Math.min(N-0.001,fz));
  const i=fx|0,j=fz|0,u=fx-i,v=fz-j,k=j*V+i;
  return H[k]*(1-u)*(1-v)+H[k+1]*u*(1-v)+H[k+V]*(1-u)*v+H[k+V+1]*u*v;
}
function h0At(x,z){
  if(x<-S/2||x>S/2||z<-S/2||z>S/2)return baseHeight(x,z);
  const i=Math.max(0,Math.min(N,Math.round((x+S/2)/CELL))),j=Math.max(0,Math.min(N,Math.round((z+S/2)/CELL)));
  return H0[j*V+i];
}
// ---------- soil ----------
// layers by depth below original grade, with wavy boundaries; sand bedding wraps the gas main.
// h: arm speed while the teeth bite, sw: swell (loose volume per bank volume), rp: steepest slope it holds (rise per run),
// rl: slope it holds for good; a deep wall steeper than rl caves in after a while
const SOIL=[
  {n:'Topsoil',c:[0.30,0.21,0.13],h:0.7,sw:1.25,rp:0.9,rl:0.75},
  {n:'Clay',c:[0.64,0.36,0.21],h:0.45,sw:1.3,rp:1.6,rl:0.95},
  {n:'Sand',c:[0.80,0.70,0.48],h:0.85,sw:1.12,rp:0.62,rl:0.62},
  {n:'Rock',c:[0.47,0.46,0.44],h:0.12,sw:1.5,rp:3.0,rl:2.5},
  {n:'Loose fill',c:[0.50,0.34,0.21],h:0.9,sw:1.0,rp:0.75,rl:0.7}];
const SPOIL=4,spoilC=new Float32Array(V*V*3);
function layerAt(x,z,d,nn){
  const w=0.06*Math.sin(x*1.7+z*0.9)+0.05*(nn-0.5);
  if(d<0.3+w)return 0;
  if(Math.abs(x)<12.5&&Math.abs(z-PIPE_Z)<0.55+0.08*Math.sin(x*0.8)&&d>0.95+w&&d<1.62+w)return 2;
  return d<1.95+2*w?1:3;
}
// material at height y over grid vertex k: loose fill above original grade, a native layer below
function matAt(k,y){const d=H0[k]-y;return d<0?SPOIL:layerAt((k%V)*CELL-S/2,((k/V)|0)*CELL-S/2,d,nz[k])}
function matColor(k,m){return m===SPOIL?[spoilC[k*3],spoilC[k*3+1],spoilC[k*3+2]]:SOIL[m].c}
// blend material of colour c and height a into the loose fill on vertex k
function mixSpoil(k,c,a){const above=H[k]-H0[k];if(above<=0||a<=0)return;const f=Math.min(1,a/above);
  for(let q=0;q<3;q++)spoilC[k*3+q]+=(c[q]-spoilC[k*3+q])*f}
const digC=[0,0,0],digMix=[0,1,0,0];
// grid box holding every hole dug so far, scanned for walls that could cave in
let cI0=N+1,cI1=-1,cJ0=N+1,cJ1=-1;
function dig(tip,cap){
  const r=0.55,list=[],vk=[0,0,0,0];let vol=0,cr=0,cg=0,cb=0;
  const i0=Math.max(0,Math.floor((tip.x-r+S/2)/CELL)),i1=Math.min(N,Math.ceil((tip.x+r+S/2)/CELL));
  const j0=Math.max(0,Math.floor((tip.z-r+S/2)/CELL)),j1=Math.min(N,Math.ceil((tip.z+r+S/2)/CELL));
  for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){
    const x=i*CELL-S/2,z=j*CELL-S/2,d=Math.hypot(x-tip.x,z-tip.z);
    if(d>r)continue;
    const k=j*V+i;
    const t=Math.max(tip.y+(d/r)*(d/r)*0.35,H0[k]-FLOOR);
    const dh=H[k]-t;
    if(dh>0){const y=H[k]-dh/2,m=matAt(k,y),c=matColor(k,m),v=dh*CA*SOIL[m].sw,ck=clodKind(m,H0[k]-y);list.push(k,dh);vol+=v;cr+=c[0]*v;cg+=c[1]*v;cb+=c[2]*v;if(ck>=0)vk[ck]+=v}
  }
  if(vol<=0)return 0;
  touch(i0,i1,j0,j1);
  const s=Math.min(1,cap/vol);
  for(let n=0;n<list.length;n+=2){H[list[n]]-=list[n+1]*s;wetT[list[n]]=timeU.value}
  digC[0]=cr/vol;digC[1]=cg/vol;digC[2]=cb/vol;for(let q=0;q<4;q++)digMix[q]=vk[q]/vol;
  const mg=3*GRID_K;cI0=Math.max(0,Math.min(cI0,i0-mg));cI1=Math.min(N,Math.max(cI1,i1+mg));cJ0=Math.max(0,Math.min(cJ0,j0-mg));cJ1=Math.min(N,Math.max(cJ1,j1+mg));
  clodsDug(tip.x,tip.z,r);dropMix(tip.x,tip.z,0.75,vol*s*DIRT,digMix,digC,'bite');
  return vol*s;
}
function deposit(x,z,vol,col,mix){
  const r=0.9,list=[];let sum=0;
  const i0=Math.max(0,Math.floor((x-r+S/2)/CELL)),i1=Math.min(N,Math.ceil((x+r+S/2)/CELL));
  const j0=Math.max(0,Math.floor((z-r+S/2)/CELL)),j1=Math.min(N,Math.ceil((z+r+S/2)/CELL));
  for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){
    const d=Math.hypot(i*CELL-S/2-x,j*CELL-S/2-z); if(d>r)continue;
    const w=Math.exp(-(d/0.5)*(d/0.5)); list.push(j*V+i,w); sum+=w;
  }
  if(!sum)return;
  touch(i0,i1,j0,j1);
  for(let n=0;n<list.length;n+=2){const k=list[n],a=vol*list[n+1]/sum/CA;H[k]+=a;mixSpoil(k,col||SOIL[SPOIL].c,a);if(a>0.002)wetT[k]=timeU.value}
  dropMix(x,z,r,vol*DIRT,mix||CRUMB_MIX,col||SOIL[SPOIL].c,'dump');
}
// each layer holds its own slope: sand runs, clay stands steep, rock barely moves; what slides keeps its colour as loose fill
const RP_MIN=0.62*CELL,M0=1.1*CELL;
function slumpPair(k,k2,long){
  if(prot[k]||prot[k2])return false;
  if((H[k]===H0[k]&&H[k2]===H0[k2])||Math.abs(H0[k]-H0[k2])>M0)return false;
  const df=H[k]-H[k2],ad=Math.abs(df);if(ad<=RP_MIN)return false;
  const hi=df>0?k:k2,lo=df>0?k2:k,m=matAt(hi,H[hi]-0.03),lim=(long?SOIL[m].rl:SOIL[m].rp)*CELL;if(ad<=lim)return false;
  const t=(ad-lim)*0.25,c=matColor(hi,m);H[hi]-=t;H[lo]+=t;mixSpoil(lo,c,t);return true;
}
function slump(){
  let moved=false;
  const ja=Math.max(0,dJ0-2),jb=Math.min(N,dJ1+2),ia=Math.max(0,dI0-2),ib=Math.min(N,dI1+2);
  for(let j=ja;j<=jb;j++)for(let i=ia;i<=ib;i++){
    const k=j*V+i;
    if(i<N&&slumpPair(k,k+1))moved=true;
    if(j<N&&slumpPair(k,k+V))moved=true;
  }
  if(moved){dI0=ia;dI1=ib;dJ0=ja;dJ1=jb}
  return moved;
}
// cave-ins: a wall over a cut deeper than ~4 ft that is steeper than its soil holds for good builds risk, and so does
// loose fill piled on the lip or up to 2 ft back (surcharge); returns the riskiest lip vertex
const CDIR=[[1,0],[-1,0],[0,1],[0,-1]];
function caveScan(){
  let best=0,bk=-1,bs=false;
  for(let j=cJ0;j<=cJ1;j++)for(let i=cI0;i<=cI1;i++){const k=j*V+i;if(prot[k])continue;
    for(const [di,dj] of CDIR){const i2=i+di,j2=j+dj;if(i2<0||i2>N||j2<0||j2>N)continue;const k2=j2*V+i2;
      const dep=H0[k2]-H[k2];if(dep<0.75)continue;
      const df=H[k]-H[k2];if(df<=0.62*CELL||Math.abs(H0[k]-H0[k2])>M0)continue;
      if(df<=SOIL[matAt(k,H[k]-0.03)].rl*CELL)continue;
      let sur=H[k]-H0[k];for(let q=1;q<=2*GRID_K;q++){const i3=i-di*q,j3=j-dj*q;if(i3>=0&&i3<=N&&j3>=0&&j3<=N)sur=Math.max(sur,H[j3*V+i3]-H0[j3*V+i3])}
      const deep=Math.max(0,dep-1.2)*2,load=sur>0.08?sur*3:0,risk=deep+load;
      if(risk>best){best=risk;bk=k;bs=load>deep}}}
  return {best,bk,bs};
}
function collapse(k,sur){
  const ci=k%V,cj=(k/V)|0,R=5*GRID_K,i0=Math.max(0,ci-R),i1=Math.min(N,ci+R),j0=Math.max(0,cj-R),j1=Math.min(N,cj+R);
  for(let it=0;it<24*GRID_K;it++)for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){const kk=j*V+i;
    if(i<i1)slumpPair(kk,kk+1,true);if(j<j1)slumpPair(kk,kk+V,true)}
  touch(i0,i1,j0,j1);st.dirty=true;st.slumpT=2.5;st.caves++;
  const p=new THREE.Vector3(ci*CELL-S/2,H[k]+0.1,cj*CELL-S/2);for(let n=0;n<40;n++)spawn(p,1.6);
  {const m=matAt(k,H[k]-0.05),ck=clodKind(m,H0[k]-H[k]+0.05);dropClods(ck,p.x,p.z,1.4,60*DIRT,ck===CRUMB?matColor(k,m):KIND_COL[Math.max(0,ck)],ck===SOD?1:1.4)}
  shake=reduceMotion?0:0.35;rumble(500,0.8);
  toast(sur?'Cave-in! Spoil too close to the edge. Keep piles 2 ft back.':'Cave-in! Walls past 5 ft deep need a slope or a trench box.','bad',3600);
}
// risk builds while a bad wall stands, then dirt trickles off the lip for 2 s before it lets go
const lipP=new THREE.Vector3();
function caveTick(dt){
  if(st.cave&&prot[st.cave.k]){st.cave=null;st.caveRisk=0}
  if(st.cave){const c=st.cave;c.t-=dt;c.dT-=dt;
    if(c.dT<=0){c.dT=0.07;lipP.set((c.k%V)*CELL-S/2+(Math.random()-0.5)*0.6,H[c.k]+0.05,((c.k/V)|0)*CELL-S/2+(Math.random()-0.5)*0.6);spawn(lipP,0.25)}
    if(c.t<=0){st.cave=null;st.caveRisk=0;collapse(c.k,c.sur)}}
  else if(cI1>=cI0&&(st.caveScanT-=dt)<=0){st.caveScanT=0.5;const r=caveScan();
    if(r.best>0){st.caveRisk+=r.best*0.04;if(st.caveRisk>=1)st.cave={k:r.bk,sur:r.bs,t:2.2,dT:0}}else st.caveRisk=Math.max(0,st.caveRisk-0.05)}
}
