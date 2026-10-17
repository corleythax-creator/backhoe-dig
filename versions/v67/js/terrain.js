// Corley's Island: dig-zone heightmap, the road, soil layers, digging, dumping, slumping and cave-ins.
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.
// ---------- terrain heightmap ----------
// dig grid: 64 m square at 0.16 m (about 6 in) per cell. GRID_K = cells per 0.32 m, the old 1 ft cell, so reaches and
// settling speeds written in cells stay the same in feet
const S=64,N=400,CELL=S/N,V=N+1,CA=CELL*CELL,FLOOR=3.5,GRID_K=Math.round(0.32/CELL);
const H=new Float32Array(V*V),H0=new Float32Array(V*V),grass=new Float32Array(V*V*3),matCov=new Float32Array(V*V),paint=new Uint8Array(V*V),nz=new Float32Array(V*V),rockA=new Float32Array(V*V);
const ss=(a,b,x)=>{const t=Math.min(1,Math.max(0,(x-a)/(b-a)));return t*t*(3-2*t)};
const hash=(i,j)=>{const s=Math.sin(i*127.1+j*311.7)*43758.5453;return s-Math.floor(s)};
// ---------- map edits ----------
// the map editor's layers over the generated ground, on a 0.5 m grid over the mesa and its cliffs: ED_H raises or
// lowers the ground (metres), ED_P paints it toward dirt (+) or grass (-), ED_M covers it with a material from the
// library (materials.js; 0 is the natural ground). The outer cells stay 0 so the edges meet the coarse ground. Saved on
// this device as bhd_map, with the placed assets (trees and boulders) and the roads; see editor.js
const ED_X0=-58,ED_Z0=-32,ED_C=0.5,ED_NX=233,ED_NZ=249,ED_H=new Float32Array(ED_NX*ED_NZ),ED_P=new Float32Array(ED_NX*ED_NZ),ED_M=new Uint8Array(ED_NX*ED_NZ);
let mapAssets=null,mapRoads=null;
function edSample(A,x,z){const fx=(x-ED_X0)/ED_C,fz=(z-ED_Z0)/ED_C;if(fx<0||fz<0||fx>=ED_NX-1||fz>=ED_NZ-1)return 0;
  const i=fx|0,j=fz|0,u=fx-i,v=fz-j,k=j*ED_NX+i;return A[k]*(1-u)*(1-v)+A[k+1]*u*(1-v)+A[k+ED_NX]*(1-u)*v+A[k+ED_NX+1]*u*v}
// the material painted on the cell nearest a point (0: natural ground)
function paintAt(x,z){const i=Math.round((x-ED_X0)/ED_C),j=Math.round((z-ED_Z0)/ED_C);return i<0||j<0||i>=ED_NX||j>=ED_NZ?0:ED_M[j*ED_NX+i]}
// a ground vertex's colour c (rgb array) under the painted materials: blended toward each nearby cell's material colour
// as the cells' corners blend, tightened so an edge turns over about 0.25 m, as built surfaces have crisp edges. Returns
// how much of it is covered (0 to 1)
function matTint(x,z,c){const fx=(x-ED_X0)/ED_C,fz=(z-ED_Z0)/ED_C;if(fx<0||fz<0||fx>=ED_NX-1||fz>=ED_NZ-1)return 0;
  const i=fx|0,j=fz|0,u=fx-i,v=fz-j,k=j*ED_NX+i;let cov=0,r=0,g=0,b=0;
  for(const [q,w] of [[k,(1-u)*(1-v)],[k+1,u*(1-v)],[k+ED_NX,(1-u)*v],[k+ED_NX+1,u*v]]){const m=ED_M[q];if(!m||w<=0)continue;const mc=MAT_LIST[m-1].c;cov+=w;r+=mc[0]*w;g+=mc[1]*w;b+=mc[2]*w}
  if(cov<=0)return 0;const sc=ss(0.25,0.75,cov),f=sc/cov;
  c[0]=c[0]*(1-sc)+r*f;c[1]=c[1]*(1-sc)+g*f;c[2]=c[2]*(1-sc)+b*f;
  return sc}
function b64Bytes(b){let s='';for(let i=0;i<b.length;i+=0x8000)s+=String.fromCharCode.apply(null,b.subarray(i,i+0x8000));return btoa(s)}
function bytesB64(t){const s=atob(t),b=new Uint8Array(s.length);for(let i=0;i<s.length;i++)b[i]=s.charCodeAt(i);return b}
// a map as text: each edit layer as the smallest box holding its edits (heights in centimetres, paint in hundredths,
// materials as ids), the assets as [type, x, z, turn, size, tint] and the roads as [width, grass up the middle, [[x, z, height if graded], ...]]
function edBox(A,scale,Arr){let i0=ED_NX,i1=-1,j0=ED_NZ,j1=-1;
  for(let j=0;j<ED_NZ;j++)for(let i=0;i<ED_NX;i++)if(Math.round(A[j*ED_NX+i]*scale)!==0){if(i<i0)i0=i;if(i>i1)i1=i;if(j<j0)j0=j;if(j>j1)j1=j}
  if(i1<0)return null;const w=i1-i0+1,h=j1-j0+1,q=new Arr(w*h),lim=Arr===Int8Array?127:32767;
  for(let j=0;j<h;j++)for(let i=0;i<w;i++)q[j*w+i]=Math.max(-lim,Math.min(lim,Math.round(A[(j+j0)*ED_NX+i+i0]*scale)));
  return {r:[i0,j0,w,h],d:b64Bytes(new Uint8Array(q.buffer))}}
function edUnbox(o,A,scale,Arr){if(!o)return;const [i0,j0,w,h]=o.r,q=new Arr(bytesB64(o.d).buffer);
  if(!(w>0&&h>0&&i0>=0&&j0>=0&&i0+w<=ED_NX&&j0+h<=ED_NZ&&q.length===w*h))throw new Error('bad layer');
  for(let j=0;j<h;j++)for(let i=0;i<w;i++)A[(j+j0)*ED_NX+i+i0]=q[j*w+i]/scale}
function mapEncode(){const doc={game:'backhoe-dig',v:1},h=edBox(ED_H,100,Int16Array),p=edBox(ED_P,100,Int8Array);
  const m=edBox(ED_M,1,Uint8Array);if(h)doc.h=h;if(p)doc.p=p;if(m)doc.m=m;
  if(mapAssets)doc.assets=mapAssets.map(a=>[a.t,+a.x.toFixed(2),+a.z.toFixed(2),+a.yaw.toFixed(2),+a.s.toFixed(2),a.c]);
  if(mapRoads)doc.roads=mapRoads.map(r=>[+r.w.toFixed(2),r.mid,r.pts.map(q=>q.map(v=>+v.toFixed(2)))]);
  return JSON.stringify(doc)}
// reads a map into new layers; throws on anything that is not one
function mapDecode(text){const doc=JSON.parse(text);if(!doc||doc.game!=='backhoe-dig'||doc.v!==1)throw new Error('not a Corley\'s Island map');
  const h=new Float32Array(ED_H.length),p=new Float32Array(ED_P.length),m=new Uint8Array(ED_M.length);edUnbox(doc.h,h,100,Int16Array);edUnbox(doc.p,p,100,Int8Array);edUnbox(doc.m,m,1,Uint8Array);
  for(let q=0;q<m.length;q++)if(m[q]>MAT_LIST.length)m[q]=0;
  for(let j=0;j<ED_NZ;j++)for(let i=0;i<ED_NX;i++)if(i<3||j<3||i>ED_NX-4||j>ED_NZ-4){h[j*ED_NX+i]=0;p[j*ED_NX+i]=0;m[j*ED_NX+i]=0}
  const as=Array.isArray(doc.assets)?doc.assets.filter(a=>Array.isArray(a)&&['pine','leafy','rock'].includes(a[0])&&isFinite(a[1])&&isFinite(a[2]))
    .map(a=>({t:a[0],x:+a[1],z:+a[2],yaw:+a[3]||0,s:Math.max(0.3,Math.min(3,+a[4]||1)),c:(a[5]|0)>=0?a[5]|0:0})):null;
  // roads: 1.5 to 8 m wide, 2 to 200 points each; graded only when every point has a height
  const rs=Array.isArray(doc.roads)?doc.roads.slice(0,60).filter(r=>Array.isArray(r)&&isFinite(r[0])&&Array.isArray(r[2])&&r[2].length>=2&&r[2].length<=200&&r[2].every(q=>Array.isArray(q)&&q.length>=2&&q.slice(0,3).every(isFinite)))
    .map(r=>{const g=r[2].every(q=>q.length>2);return {w:Math.max(1.5,Math.min(8,+r[0])),mid:r[1]?1:0,pts:r[2].map(q=>g?[+q[0],+q[1],+q[2]]:[+q[0],+q[1]])}}):null;
  return {h,p,m,as,rs}}
try{const t=localStorage.getItem('bhd_map');if(t){const m=mapDecode(t);ED_H.set(m.h);ED_P.set(m.p);ED_M.set(m.m);mapAssets=m.as;mapRoads=m.rs}}catch(e){}
// the painted ids for the ground shader, one texel per cell (materials.js); editor.js flags it when they change
matU.tMatId.value=new THREE.DataTexture(ED_M,ED_NX,ED_NZ,THREE.LuminanceFormat,THREE.UnsignedByteType);
matU.tMatId.value.unpackAlignment=1;matU.tMatId.value.needsUpdate=true;
// the site sits on a grassy mesa; cliffs drop about 150 ft to meadows and a lake. It is about 295 ft across, centred
// south of the dig so the north rim (the truck's dump spot) stays put. The north part is the high top with two hills;
// across the middle a rocky scarp drops 24 ft to the Lower Bench, a dirt yard with stockpiles, and a ramp runs down it
const EDGE=45,WATER=-58,MZ=30,BENCH_H=-7.3;
function mesaR(x,z){z-=MZ;const a=Math.atan2(z,x);return Math.pow(Math.pow(Math.abs(x),4)+Math.pow(Math.abs(z),4),0.25)*(1+0.06*Math.sin(a*5+0.7)+0.035*Math.sin(a*11+2.1))}
// roads: centrelines in metres and widths; a third number on every point grades the road to that height (the ramp).
// The map editor can replace them (a saved map's roads load here)
const ROAD_W=3.6;
const ROADS=[
  {w:3.6,mid:1,pts:[[-40,16],[-30,-6],[-14,-12],[0,-13],[16,-12],[32,-6],[40,6],[41,22],[40,34],[28,35],[12,38.5],[0,39.5],[-24,37.5],[-38,33],[-40,16]]},
  {w:4.8,mid:0,pts:[[40,34,0],[38,36.5,-0.2],[20,44.5,-2.4],[0,49,-4.8],[-22,53,-7.3]]},
  {w:3.6,mid:1,pts:[[-22,53],[-33,59.5],[-20,66.5],[0,66.5],[20,65],[30,58.5],[18,55],[2,57],[-14,56.5],[-22,53]]},
  {w:2.4,mid:0,pts:[[41,12],[33,9],[24,10.5],[19,17],[21,23.5],[27,20]]},
];
if(mapRoads){ROADS.length=0;ROADS.push(...mapRoads);mapRoads=ROADS}
// segments bucketed on a 4 m grid so a lookup only checks the few nearby; roadAt leaves its answer in RD_*.
// Rebuilt whenever the editor changes a road
const RG_X0=-60,RG_Z0=-32,RG_C=4,RG_NX=30,RG_NZ=32,RG=[],RSEG=[];
function roadsBuild(){RSEG.length=0;RG.length=0;
  for(const r of ROADS)for(let i=0;i<r.pts.length-1;i++){const a=r.pts[i],b=r.pts[i+1],dx=b[0]-a[0],dz=b[1]-a[1];if(dx*dx+dz*dz<1e-6)continue;
    RSEG.push({ax:a[0],az:a[1],dx,dz,il:1/(dx*dx+dz*dz),ha:a[2],hb:b[2],w:r.w,mid:r.mid,g:a.length>2&&b.length>2})}
  for(let j=0;j<RG_NZ;j++)for(let i=0;i<RG_NX;i++){const cx=RG_X0+(i+0.5)*RG_C,cz=RG_Z0+(j+0.5)*RG_C,l=[];
    for(const q of RSEG){let t=((cx-q.ax)*q.dx+(cz-q.az)*q.dz)*q.il;t=Math.max(0,Math.min(1,t));
      if(Math.hypot(cx-q.ax-q.dx*t,cz-q.az-q.dz*t)<RG_C*0.71+q.w/2+3.5)l.push(q)}RG.push(l)}}
roadsBuild();
// RD_o: metres out from the edge of a standard-width road (roadOff's old meaning), RD_mid: grass up the middle;
// RD_gd, RD_h, RD_gw: distance to the nearest graded road, its height there and its width
let RD_o=99,RD_mid=0,RD_gd=99,RD_h=0,RD_gw=0;
function roadAt(x,z){RD_o=99;RD_gd=99;
  const i=Math.floor((x-RG_X0)/RG_C),j=Math.floor((z-RG_Z0)/RG_C);if(i<0||j<0||i>=RG_NX||j>=RG_NZ)return;
  for(const q of RG[j*RG_NX+i]){let t=((x-q.ax)*q.dx+(z-q.az)*q.dz)*q.il;t=t<0?0:t>1?1:t;
    const d=Math.hypot(x-q.ax-q.dx*t,z-q.az-q.dz*t),o=d-(q.w-ROAD_W)/2;
    if(o<RD_o){RD_o=o;RD_mid=q.mid}
    if(q.g&&d<RD_gd){RD_gd=d;RD_h=q.ha+(q.hb-q.ha)*t;RD_gw=q.w}}}
// roadOff is metres across a standard-width road from its centreline
function roadOff(x,z){roadAt(x,z);return RD_o}
function roadAmt(x,z){return 1-ss(ROAD_W/2-0.35,ROAD_W/2+0.45,Math.abs(roadOff(x,z)))}
// packed tan dirt, darker in the two wheel tracks, a little grass up the middle; blends colour c (rgb array) toward it, returns the amount
function roadTint(x,z,c,n){const o=Math.abs(roadOff(x,z)),a=1-ss(ROAD_W/2-0.35,ROAD_W/2+0.45,o);if(a<=0)return 0;
  const rut=1-0.17*Math.exp(-((o-0.95)/0.32)*((o-0.95)/0.32)),mid=0.35*(1-ss(0.15,0.45,o))*RD_mid,v=0.92+0.16*n;
  const rc=[0.58*v*rut,0.47*v*rut,0.33*v*rut];rc[0]+=(0.36-rc[0])*mid;rc[1]+=(0.5-rc[1])*mid;rc[2]+=(0.26-rc[2])*mid;
  for(let q=0;q<3;q++)c[q]+=(rc[q]-c[q])*a;return a*(1-mid)}
// the scarp's centre line, and smooth round hills
function scarpZ(x){return 45+2.5*Math.sin(x*0.09+0.5)}
function hill(x,z,cx,cz,rx,rz,h){const t=Math.hypot((x-cx)/rx,(z-cz)/rz);return t>=1?0:h*0.5*(1+Math.cos(Math.PI*t))}
// worked dirt: the Lower Bench yard and a laydown pad west of the dig; 0 to 1
function yardAt(x,z){const r=mesaR(x,z),zs=scarpZ(x);
  return Math.max(0,Math.min(1,Math.max(ss(zs+3,zs+6,z)*(1-ss(37,42,r)),ss(0.15,0.4,hill(x,z,-22,4,9,6,1)))+edSample(ED_P,x,z)))}
// colour c (rgb array) toward packed dirt by the yard amount; returns the amount
function yardTint(x,z,c,n){const a=yardAt(x,z);if(a<=0)return 0;const v=0.86+0.2*n;
  c[0]+=(0.55*v-c[0])*a;c[1]+=(0.42*v-c[1])*a;c[2]+=(0.29*v-c[2])*a;return a}
// the generated ground plus the editor's raise and lower
function baseHeight(x,z){return groundHeight(x,z)+edSample(ED_H,x,z)}
function groundHeight(x,z){
  const r=mesaR(x,z);let h;
  if(r<EDGE+3){
    // gentle rolls, flatter round the dig; Lookout Knoll (18 ft) and West Rise (10 ft) on the top; the bench and its stockpiles
    const roll=(0.012+0.025*ss(16,34,Math.hypot(x,z+4)))*(6*Math.sin(x*0.09+1.3)*Math.cos(z*0.08)+4*Math.sin(x*0.21+z*0.17));
    const top=roll+hill(x,z,27,20,12.5,12.5,5.5)+hill(x,z,-22,22,9,9,3);
    const zs=scarpZ(x),lo=ss(zs-4,zs+5,z);
    const bench=BENCH_H+roll*0.5+hill(x,z,-8,61.5,4.5,3.4,2.4)+hill(x,z,9,61.3,5,3.4,2.4)+hill(x,z,22,60,3.5,3,1.5);
    h=top+(bench-top)*lo;
    roadAt(x,z);
    const lip=ss(EDGE-6,EDGE,r)*0.4*(0.5+0.5*Math.sin(Math.atan2(z-MZ,x)*7));
    if(lip>0)h+=lip*(1-ss(ROAD_W/2-0.35,ROAD_W/2+0.45,Math.abs(RD_o)));
    // the ramp is graded into the scarp, with cut and fill banks either side
    if(RD_gd<RD_gw/2+2.5)h=RD_h+(h-RD_h)*ss(RD_gw/2,RD_gw/2+2.5,RD_gd);
    if(r<EDGE)return h;
  }
  const d=r-EDGE;
  const cliff=-46*ss(0,7,d)-1.6*Math.sin(d*1.9)*ss(0,1,d)*(1-ss(6,9,d));
  const low=-14*ss(7,60,d)-9*ss(40,95,d);
  const bumps=(Math.sin(x*0.07+z*0.05)*3+Math.sin(x*0.17-z*0.13)*1.5+Math.sin(x*0.031-z*0.027+1)*4)*ss(8,22,d);
  const out=cliff+low+bumps+0.5*(1-ss(0,2,d));
  // the cliff starts from the ground at the rim (the bench is lower than the top)
  return d<3?out+(h-0.5)*(1-ss(0,3,d)):out;
}
// ground too steep to drive onto (the scarp, ramp banks, stockpiles), on a 0.5 m grid over the mesa from the original grade
const WG_X0=-48,WG_Z0=-20,WG_C=0.5,WG_NX=193,WG_NZ=197,WALL=new Uint8Array(WG_NX*WG_NZ);
// rebuilt over an area (metres) after the editor reshapes it
function wallBuild(x0,x1,z0,z1){
  const i0=Math.max(1,Math.floor((x0-WG_X0)/WG_C)-1),i1=Math.min(WG_NX-2,Math.ceil((x1-WG_X0)/WG_C)+1),j0=Math.max(1,Math.floor((z0-WG_Z0)/WG_C)-1),j1=Math.min(WG_NZ-2,Math.ceil((z1-WG_Z0)/WG_C)+1);
  const W=i1-i0+3,hh=new Float32Array(W*(j1-j0+3)),hv=(i,j)=>hh[(j-j0+1)*W+i-i0+1];
  for(let j=j0-1;j<=j1+1;j++)for(let i=i0-1;i<=i1+1;i++)hh[(j-j0+1)*W+i-i0+1]=baseHeight(WG_X0+i*WG_C,WG_Z0+j*WG_C);
  for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){const k=j*WG_NX+i;WALL[k]=0;
    if(mesaR(WG_X0+i*WG_C,WG_Z0+j*WG_C)>EDGE-1)continue;
    const sl=Math.hypot(hv(i+1,j)-hv(i-1,j),hv(i,j+1)-hv(i,j-1))/(2*WG_C);if(sl>0.85)WALL[k]=1}}
wallBuild(WG_X0,WG_X0+(WG_NX-1)*WG_C,WG_Z0,WG_Z0+(WG_NZ-1)*WG_C);
function wallAt(x,z){const i=Math.round((x-WG_X0)/WG_C),j=Math.round((z-WG_Z0)/WG_C);return i>=0&&j>=0&&i<WG_NX&&j<WG_NZ&&WALL[j*WG_NX+i]===1}
// how many of a machine's probe points (local [side, forward] offsets) stand on ground too steep to drive
function wallCount(x,z,yaw,P){const s=Math.sin(yaw),c=Math.cos(yaw);let n=0;for(const [lx,lz] of P)if(wallAt(x+lx*c+lz*s,z-lx*s+lz*c))n++;return n}
const PIPE_Z=-5.5, TRENCH_Z0=-8.5, TRENCH_Z1=-3.0;
// a dig-grid vertex's undug colour (grass, rock on steep ground, sand, the yards and roads, painted materials), its
// dirt-texture amount and how much material covers it
function digBase(k){const i=k%V,j=(k/V)|0,x=i*CELL-S/2,z=j*CELL-S/2;
  const n=hash(i,j),n2=hash(i*0.37|0,j*0.37|0);
  grass[k*3]=0.30+0.07*n+0.05*n2; grass[k*3+1]=0.50+0.08*n+0.04*n2; grass[k*3+2]=0.24+0.04*n;
  const h=H0[k],sl=(Math.abs(baseHeight(x+0.5,z)-baseHeight(x-0.5,z))+Math.abs(baseHeight(x,z+0.5)-baseHeight(x,z-0.5))),rock=ss(0.55,1.1,sl),sand=1-ss(WATER+0.6,WATER+2.8,h),st2=0.06*Math.sin(h*1.4+n);
  if(rock>0){grass[k*3]+=(0.50+0.06*n+st2-grass[k*3])*rock;grass[k*3+1]+=(0.44+0.05*n+st2-grass[k*3+1])*rock;grass[k*3+2]+=(0.38+0.04*n+st2-grass[k*3+2])*rock}
  if(sand>0){grass[k*3]+=(0.80-grass[k*3])*sand;grass[k*3+1]+=(0.72-grass[k*3+1])*sand;grass[k*3+2]+=(0.52-grass[k*3+2])*sand}
  const rc=[grass[k*3],grass[k*3+1],grass[k*3+2]],ya=yardTint(x,z,rc,n),ra=roadTint(x,z,rc,n),mc=matTint(x,z,rc);grass[k*3]=rc[0];grass[k*3+1]=rc[1];grass[k*3+2]=rc[2];
  rockA[k]=Math.min(1,Math.max(rock*0.95+sand*0.4,ra*0.9,ya*0.85))*(1-mc);matCov[k]=mc}
for(let j=0;j<V;j++)for(let i=0;i<V;i++){
  const k=j*V+i,x=i*CELL-S/2,z=j*CELL-S/2;
  H0[k]=H[k]=baseHeight(x,z); nz[k]=hash(i*1.7+3,j*2.3+1);
  digBase(k);
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
// cut-face detail painted on dug and dumped dirt, by layer (the same depths as layerAt): roots and runners in topsoil,
// grey mottles and pebbles in clay, fine streaks in sand, cracks in rock, crumbs in loose fill, and on steep cuts the
// grooves the bucket's five teeth leave, about 7 in apart. vSD is depth below original grade (negative for fill).
const FACE_GLSL=`
float fh(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float fn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(fh(i),fh(i+vec2(1.0,0.0)),f.x),mix(fh(i+vec2(0.0,1.0)),fh(i+vec2(1.0,1.0)),f.x),f.y);}
float fb(vec2 p){return 0.5*fn(p)+0.3*fn(p*2.03+7.1)+0.2*fn(p*4.01+3.3);}
vec3 faceDetail(vec3 wp,float d,float pz){
  vec3 wn=normalize(cross(dFdx(wp),dFdy(wp)));float steep=1.0-abs(wn.y);
  vec2 along=normalize(vec2(-wn.z,wn.x)+vec2(1e-4,0.0));vec2 fc=vec2(dot(wp.xz,along),wp.y);
  vec2 uv=steep>0.35?fc:wp.xz;
  float w=0.06*sin(wp.x*1.7+wp.z*0.9);vec3 m=vec3(1.0);
  bool sand=abs(wp.x)<12.5&&abs(wp.z-pz)<0.55+0.08*sin(wp.x*0.8)&&d>0.95+w&&d<1.62+w;
  if(d<-0.02){m*=0.82+0.36*fb(uv*9.0);}
  else if(d<0.3+w){float r=abs(sin(fb(uv*3.0)*14.0+uv.x*6.0));float root=smoothstep(0.07,0.0,r)*step(0.55,fn(uv*5.0));
    m*=0.85+0.3*fb(uv*12.0);m=mix(m,vec3(1.45,1.22,0.92),root*0.75);}
  else if(sand){m*=0.9+0.14*(0.5+0.5*sin(uv.y*90.0+fb(uv*4.0)*6.0));}
  else if(d<1.95+2.0*w){float mot=fb(uv*2.5);m*=mix(vec3(1.0),vec3(0.78,0.87,0.96),smoothstep(0.55,0.75,mot)*0.85);
    vec2 pc=uv*14.0;float peb=step(0.92,fh(floor(pc)))*smoothstep(0.42,0.18,length(fract(pc)-0.5));m=mix(m,vec3(1.3,1.22,1.1),peb*0.8);}
  else{float c=abs(fb(uv*3.0)-0.5);m*=0.78+0.26*smoothstep(0.0,0.045,c);}
  if(d>0.0)m*=1.0-0.2*smoothstep(0.35,0.8,steep)*smoothstep(0.55,1.0,0.5+0.5*sin(fc.x*34.9));
  return m;}
`;
const groundOcc={value:[new THREE.Vector4(0,0,0,0),new THREE.Vector4(1.4,2.0,0,0),new THREE.Vector4(0,0,0,0),new THREE.Vector4(1.2,3.9,0.0,0)]};
const groundMat=M(0xffffff,{vertexColors:true});
groundMat.onBeforeCompile=sh=>{
  sh.uniforms.tGrass={value:texGrass};sh.uniforms.tDirt={value:texDirt};sh.uniforms.texMix=texMixU;sh.uniforms.uTime=timeU;sh.uniforms.uPipeZ={value:PIPE_Z};
  // wetT: when this ground was last cut or dumped; fresh dirt shows dark and damp and dries over a few minutes
  sh.vertexShader='attribute float dirt;\nattribute float wetT;\nattribute float soilD;\nattribute float matA;\nuniform float uTime;\nvarying float vDirt;\nvarying float vWet;\nvarying float vSD;\nvarying float vMatA;\nvarying vec2 vWXZ;\nvarying vec3 vWP;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvDirt=dirt;\nvSD=soilD;\nvMatA=matA;\nvWet=exp(-max(0.0,uTime-wetT)/100.0);\nvWP=(modelMatrix*vec4(transformed,1.0)).xyz;\nvWXZ=vWP.xz;');
  // texture detail goes in ahead of the vertex colour so it is turned linear with it. groundOcc: sky light under the
  // excavator and truck, dimmed by distance to each footprint (x, z, yaw, unused; half width, half length, forward offset, unused)
  sh.uniforms.uOcc=groundOcc;Object.assign(sh.uniforms,matU);
  sh.fragmentShader='uniform sampler2D tGrass;\nuniform sampler2D tDirt;\nuniform float texMix;\nuniform float uPipeZ;\nuniform vec4 uOcc[4];\nvarying float vDirt;\nvarying float vWet;\nvarying float vSD;\nvarying float vMatA;\nvarying vec2 vWXZ;\nvarying vec3 vWP;\n'+MAT_GLSL_HEAD+FACE_GLSL+sh.fragmentShader.replace('#include <specularmap_fragment>','#include <specularmap_fragment>\nspecularStrength*=1.0+7.0*vWet*vDirt;').replace('#include <color_fragment>',
    'vec3 tg=texture2D(tGrass,vWXZ*0.22).rgb/vec3(0.36,0.468,0.178);\nvec3 td=texture2D(tDirt,vWXZ*0.45).rgb/vec3(0.461,0.255,0.123);\nvec3 gd=clamp(mix(tg,td,vDirt),0.0,2.2);float gk=0.8;\n'+matGlsl()+'diffuseColor.rgb*=mix(vec3(1.0),gd,gk*texMix);\ndiffuseColor.rgb*=1.0-0.32*vWet*vDirt;\nif(vDirt>0.01&&texMix>0.5)diffuseColor.rgb*=mix(vec3(1.0),faceDetail(vWP,vSD,uPipeZ),vDirt);\n#include <color_fragment>').replace('#include <lights_fragment_end>',
    'float skyO=1.0;\nfor(int m=0;m<4;m+=2){vec2 d=vWXZ-uOcc[m].xy;float c=cos(uOcc[m].z),s=sin(uOcc[m].z);vec2 l=vec2(d.x*c-d.y*s,d.x*s+d.y*c-uOcc[m+1].z);vec2 q=abs(l)-uOcc[m+1].xy;\nfloat dist=length(max(q,0.0))+min(max(q.x,q.y),0.0);skyO*=1.0-0.75*(1.0-smoothstep(-0.4,1.6,dist));}\nirradiance*=skyO;\n#include <lights_fragment_end>');
};
const geo=new THREE.PlaneGeometry(S,S,N,N); geo.rotateX(-Math.PI/2);
const colors=new Float32Array(V*V*3);
geo.setAttribute('color',new THREE.BufferAttribute(colors,3));
const dirtA=new Float32Array(V*V);geo.setAttribute('dirt',new THREE.BufferAttribute(dirtA,1));
const wetT=new Float32Array(V*V).fill(-1e4);geo.setAttribute('wetT',new THREE.BufferAttribute(wetT,1));
const soilDA=new Float32Array(V*V);geo.setAttribute('soilD',new THREE.BufferAttribute(soilDA,1));
const matAA=new Float32Array(V*V);geo.setAttribute('matA',new THREE.BufferAttribute(matAA,1));
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
    p[k*3+1]=h;soilDA[k]=-d;
    let r=grass[k*3],g=grass[k*3+1],b=grass[k*3+2];
    if(paint[k]&&ad<0.04){ if(paint[k]===1){r=0.93;g=0.93;b=0.9}else{r=0.96;g=0.78;b=0.1} }
    const t=ss(0.02,0.16,ad);dirtA[k]=Math.max(t,rockA[k]);matAA[k]=matCov[k]*(1-t);
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
  const sa=geo.attributes.soilD;sa.updateRange.offset=off/3;sa.updateRange.count=cnt/3;sa.needsUpdate=true;
  const ma=geo.attributes.matA;ma.updateRange.offset=off/3;ma.updateRange.count=cnt/3;ma.needsUpdate=true;
  pos.needsUpdate=true; ca.needsUpdate=true;
  snapClods(ja,jb);updateShadowCaster();
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
  // dry topsoil kicks up a little dust; the bucket picks up dirt as it works
  dustPuff(tip.x,tip.y+0.3,tip.z,vol*s*(digMix[SOD]+digMix[CRUMB])*25,digC);st.grime=Math.min(0.85,st.grime+vol*s*0.08);
  return vol*s;
}
function deposit(x,z,vol,col,mix,spread,wet){
  const r=0.9*(spread||1),list=[];let sum=0;
  const i0=Math.max(0,Math.floor((x-r+S/2)/CELL)),i1=Math.min(N,Math.ceil((x+r+S/2)/CELL));
  const j0=Math.max(0,Math.floor((z-r+S/2)/CELL)),j1=Math.min(N,Math.ceil((z+r+S/2)/CELL));
  for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){
    const d=Math.hypot(i*CELL-S/2-x,j*CELL-S/2-z); if(d>r)continue;
    const w=Math.exp(-(d/(0.5*(spread||1)))*(d/(0.5*(spread||1)))); list.push(j*V+i,w); sum+=w;
  }
  if(!sum)return;
  touch(i0,i1,j0,j1);
  for(let n=0;n<list.length;n+=2){const k=list[n],a=vol*list[n+1]/sum/CA;H[k]+=a;mixSpoil(k,col||SOIL[SPOIL].c,a);if(a>0.002){wetT[k]=timeU.value+(wet>0.3?600:0);comp[k]=0;if(wet>0.3)mudA[k]=Math.max(mudA[k],wet)}}
  dropMix(x,z,r,vol*DIRT,mix||CRUMB_MIX,col||SOIL[SPOIL].c,'dump');
  dustPuff(x,hAt(x,z)+0.2,z,vol*30*(1-(wet||0)),col);
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
  {const m=matAt(k,H[k]-0.05),ck=clodKind(m,H0[k]-H[k]+0.05);dropClods(ck,p.x,p.z,1.4,60*DIRT,ck===CRUMB?matColor(k,m):KIND_COL[Math.max(0,ck)],ck===SOD?1:1.4);dustPuff(p.x,p.y,p.z,25,matColor(k,m));dirtRumble(p)}
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

// ---------- shadow caster ----------
// the 6 in ground casts no shadows (too many triangles for the shadow pass); a 1 ft copy of the dug area, sunk 2 in so
// it never shades the surface it copies, casts them instead, so trench walls throw real shade on the floor and the pipe
const SH_N=96,shGeo=new THREE.PlaneGeometry(1,1,SH_N,SH_N);
const shMesh=new THREE.Mesh(shGeo,new THREE.MeshBasicMaterial({colorWrite:false,depthWrite:false}));
shMesh.castShadow=true;shMesh.frustumCulled=false;shMesh.visible=false;scene.add(shMesh);
function updateShadowCaster(){
  if(cI1<cI0){shMesh.visible=false;return}
  const span=SH_N*GRID_K,ci=(cI0+cI1)>>1,cj=(cJ0+cJ1)>>1;
  const i0=Math.max(0,Math.min(N-span,Math.round((ci-span/2)/GRID_K)*GRID_K)),j0=Math.max(0,Math.min(N-span,Math.round((cj-span/2)/GRID_K)*GRID_K));
  const p=shGeo.attributes.position.array;
  for(let j=0;j<=SH_N;j++)for(let i=0;i<=SH_N;i++){const gi=i0+i*GRID_K,gj=j0+j*GRID_K,o=(j*(SH_N+1)+i)*3;
    p[o]=gi*CELL-S/2;p[o+1]=H[gj*V+gi]-0.05;p[o+2]=gj*CELL-S/2}
  shGeo.attributes.position.needsUpdate=true;shMesh.visible=true;
}
