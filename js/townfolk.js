// Corley's Island: the townsfolk: people out walking the lakeside town's sidewalks, crossing at the crosswalks, looking
// in the shop windows and going in and out of the General Store; and cars driven into town from the cross street's ends
// and the beach road, which keep right, stop at the four-way stop and take their turn, wait for anyone in the way (people,
// the worker, a machine, another car), and park at the General Store or the marina, where the driver gets out, walks in,
// comes back a while later and drives off.
// The people and cars are cruise-brandon's (the owner's other game, its CREDITS.md): photo-textured bodies of a man, a
// woman and a child (models/peds/bodies.json, ~3,000 triangles each, skinned to 9 parts) painted as 32 characters in one
// atlas (peds_atlas.webp, _1k below High; peds.json), drawn as one instanced mesh per body whose limbs swing in the vertex
// shader (TF_GLSL, cruise-brandon's PD_GLSL); and its traffic cars (models/cars.glb, tools/models/cars.js: sedans,
// hatchbacks, wagons, SUVs, minivans, pickups and vans on treaded tyres and alloys, each in its own clear-coated colour).
// They are each device's own: not saved or synced, and how many is the Graphics setting Townsfolk (gfx.js `town`), fewer
// after dark. Nothing loads or moves until the camera comes within TF_NEAR of the town.
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.
const TF_NEAR=360,TF_BOX=[-180,180,540,760],TF_CARS={sedan:4,hatch:3,wagon:1,suv:4,minivan:2,pickup:3,van:1};
// the paints, as often as they are seen on the road: whites, blacks, silvers and greys most, then a few colours (metallic: m)
const TF_PAINT=[[0xe9e9e6,0,4],[0xf2f0ea,0,2],[0x101113,0,3],[0xa9adb0,1,3],[0x5a5e62,1,3],[0x2b2e33,1,2],[0x7e1416,1,2],[0x1c335c,1,2],[0x23382d,1,1],[0xb3a284,1,1],[0x6e869b,1,1],[0x8a4a1c,1,1]];
// [people, cars] for the Townsfolk setting: Off, Few, Some, Busy
const TF_N=[[0,0],[8,3],[14,5],[24,7]];
// in the rooms (TF_ROOMS, interiors.js): customers in each shop besides its staff, for the setting; how near the camera
// must come for a room to fill (it empties again past TF_RFAR); the most drawn in the rooms at once
const TF_RN=[0,1,2,3],TF_RNEAR=70,TF_RFAR=95,TF_ROOM_CAP=110;
const tf={q:2,on:false,load:0,bodies:null,chars:null,tex:null,M:null,cars:{},people:[],drive:[],t:0,spawnT:0,o:new THREE.Object3D(),fr:new THREE.Frustum(),fm:new THREE.Matrix4(),v:new THREE.Vector3()};
function tfGfx(q){tf.q=q??2;if(tf.M)for(const k in tf.M)tf.M[k].m.castShadow=!!gfxCur.pbr}
// ---------- the walks: sidewalk centre lines, crosswalks (x) and the ways to the store's door ----------
const MSX=5.3,MCN=646.85,MCS=657.15,TF_DOOR=[0,742.4],TF_GATE=[64,679.5];
const TF_WALK=[[[-MSX,580],[-MSX,MCN]],[[MSX,580],[MSX,MCN]],[[-MSX,MCS],[-MSX,723]],[[MSX,MCS],[MSX,723]],
  [[-MSX,MCN],[-127,MCN]],[[MSX,MCN],[127,MCN]],[[-MSX,MCS],[-127,MCS]],[[MSX,MCS],[64,MCS]],[[64,MCS],[127,MCS]],[[64,MCS],[64,661],TF_GATE],
  {x:1,p:[[-MSX,MCN],[-5,645],[5,645],[MSX,MCN]]},{x:1,p:[[-MSX,MCS],[-5,659],[5,659],[MSX,MCS]]},
  {x:1,p:[[-MSX,MCN],[-7.8,648.3],[-7.8,655.7],[-MSX,MCS]]},{x:1,p:[[MSX,MCN],[7.8,648.3],[7.8,655.7],[MSX,MCS]]},
  [[-MSX,723],[-5.9,727],[-5.9,741.6],TF_DOOR],[[MSX,723],[6,727],[6,741.6],TF_DOOR]].map(e=>{const p=e.p||e,L=[0];
    for(let i=1;i<p.length;i++)L.push(L[i-1]+Math.hypot(p[i][0]-p[i-1][0],p[i][1]-p[i-1][1]));return {p,L,len:L[L.length-1],x:!!e.x,a:null,b:null}});
// the nodes where walks meet, each with its walks
const TF_NODES=[];
for(const e of TF_WALK)for(const end of ['a','b']){const q=end==='a'?e.p[0]:e.p[e.p.length-1];let n=TF_NODES.find(n=>Math.hypot(n.x-q[0],n.z-q[1])<0.05);
  if(!n)TF_NODES.push(n={x:q[0],z:q[1],e:[],door:[TF_DOOR,TF_GATE].some(D=>Math.hypot(q[0]-D[0],q[1]-D[1])<0.05)});n.e.push(e);e[end]=n}
// a point s along a polyline {p, L}: [x, z, dx, dz]
function tfAt(w,s){const p=w.p,L=w.L;let i=1;while(i<p.length-1&&L[i]<s)i++;const a=p[i-1],b=p[i],d=L[i]-L[i-1]||1,t=Math.min(1,Math.max(0,(s-L[i-1])/d));
  return [a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,(b[0]-a[0])/d,(b[1]-a[1])/d]}
const tfLine=pts=>{const L=[0];for(let i=1;i<pts.length;i++)L.push(L[i-1]+Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]));return {p:pts,L,len:L[L.length-1]}};
// how high the surface is above the ground where someone stands: the asphalt, the raised sidewalks and the store's walk
function tfLift(x,z){if(Math.abs(x-TF_GATE[0])<1.4&&z>658.8&&z<TF_GATE[1]+0.5)return z<661?0.17-(z-658.8)/2.2*0.14:0.03;if(z>724.5)return z>740.2&&Math.abs(x)<15.5?0.12:0.04;if(x>56&&z<615)return 0.04;
  if(Math.abs(x)<MST.x+0.1&&z>556||Math.abs(z-MST.cz)<MST.cw+0.1&&Math.abs(x)>MST.x)return MST.lift;
  if(Math.abs(x)<MST.x+MST.curb+MST.walk+0.2&&z>576||Math.abs(z-MST.cz)<MST.cw+3.5&&Math.abs(x)<128)return MST.top;return 0}
// ---------- the drives: poses [x, z, heading of travel, flags] joined by smooth curves ----------
// flags: 's' a stop sign (the car stops with its middle here, waits its turn), 'r' the stretch up to here is driven in
// reverse (backing out of a stall). Keep right: Main Street's lanes at x ±2, the cross street's at z 650.25 (west) and
// 653.75 (east), the beach roads 1.25 m either side of their middle
const N_=Math.PI,S_=0,E_=Math.PI/2,W_=-Math.PI/2;
// a lane: a road's middle line (as ISLAND_ROADS has it) offset to the right of travel by o, as poses
function tfLane(pts,o){const n=pts.length,P=[];for(let i=0;i<n;i++){const a=pts[Math.max(0,i-1)],b=pts[Math.min(n-1,i+1)],c=pts[i],
    d1=i?Math.atan2(c[0]-a[0],c[1]-a[1]):null,d2=i<n-1?Math.atan2(b[0]-c[0],b[1]-c[1]):null,h=d1===null?d2:d2===null?d1:d1+Math.atan2(Math.sin(d2-d1),Math.cos(d2-d1))/2,
    k=o/Math.max(0.5,Math.cos(d1===null||d2===null?0:Math.atan2(Math.sin(d2-d1),Math.cos(d2-d1))/2));P.push([c[0]-Math.cos(h)*k,c[1]+Math.sin(h)*k,h])}return P}
const TF_BWR=[[-176,576.1],[-170,576],[-60,574],[-4,574]],TF_BER=[[4,574],[26,574],[36,582],[57.5,586.4]];
const TF_IN={E:[[146,650.25,W_],[140,650.25,W_]],W:[[-146,653.75,E_],[-140,653.75,E_]],B:tfLane(TF_BWR,1.25).slice(0,3)};
const TF_TO_ST={E:[[13.1,650.25,W_,'s'],[-2,657.5,S_],[-2,716,S_]],W:[[-13.1,653.75,E_,'s'],[-2,661,S_],[-2,716,S_]],
  B:[[-8,575.25,E_],[-2,581,S_],[-2,639.5,S_,'s'],[-2,716,S_]]};
const TF_BEACH_E=[[8,575.25,E_],...tfLane(TF_BER,1.25).slice(1)],TF_BEACH_W=tfLane(TF_BER.slice().reverse(),1.25).slice(0,3);
const TF_TO_MAR={E:[[13.1,650.25,W_,'s'],[2,639,N_],[2,579.5,N_],[6.5,575.25,E_],...TF_BEACH_E],W:[[-13.1,653.75,E_,'s'],[2,642,N_],[2,579.5,N_],[6.5,575.25,E_],...TF_BEACH_E],B:TF_BEACH_E.slice(1)};
const TF_OUT_N={E:[[6.5,653.75,E_],[140,653.75,E_],[146,653.75,E_]],W:[[-6.5,650.25,W_],[-140,650.25,W_],[-146,650.25,W_]],
  B:[[2,581,N_],...tfLane(TF_BWR.slice().reverse(),1.25).slice(1)]};
const TF_OUT_S={E:[[-2,581,S_],[-2,639.5,S_,'s'],[6.5,653.75,E_],[140,653.75,E_],[146,653.75,E_]],W:[[-2,581,S_],[-2,639.5,S_,'s'],[-6.5,650.25,W_],[-140,650.25,W_],[-146,650.25,W_]],
  B:tfLane(TF_BWR.slice().reverse(),1.25).slice(1)};
// the stalls: the General Store's lot (nose to the store; the ones clear of its lamp poles) and the marina car park's north row;
// the aisles have a lane each way
const TF_STALLS=[...[-7.8,-11,-20.6,-23.8,8.2,14.6].map(x=>({k:'st',x,z:736.5,car:null})),...Array.from({length:14},(_,i)=>({k:'mar',x:65+i*3,z:585.9,car:null}))];
function tfArrive(from,S){const P=[...TF_IN[from]];
  if(S.k==='st'){P.push(...TF_TO_ST[from],[-2,722,S_]);
    if(S.x<0){if(S.x<-9){P.push([-5.5,727.5,W_]);if(S.x+4<-6.5)P.push([S.x+4,727.5,W_])}}
    else{P.push([2,729.5,E_]);if(S.x-4>3)P.push([S.x-4,729.5,E_])}
    P.push([S.x,S.z,S_])}
  else{P.push(...TF_TO_MAR[from],[62,594,E_]);if(S.x-4.5>63.5)P.push([S.x-4.5,594,E_]);P.push([S.x,S.z,N_])}
  return P}
function tfLeave(S,to){const P=[];
  if(S.k==='st'){const s=S.x<0?-1:1,bx=S.x+s*3.1;P.push([S.x,S.z,N_],[bx,s<0?729.5:727.5,s<0?W_:E_,'r'],[bx,s<0?729.5:727.5,s<0?E_:W_],[2,722,N_],[2,664.6,N_,'s'],...TF_OUT_N[to])}
  else P.push([S.x,S.z,S_],[S.x+3.2,590.8,E_,'r'],[S.x+3.2,590.8,W_],[62,590.8,W_],...TF_BEACH_W,...TF_OUT_S[to]);
  return P}
// samples every half metre: position, heading of travel, reverse, the speed it can be taken at, distance along; and the
// stops (stop signs, and where a car changes from reverse to forward)
function tfPath(poses,park){const X=[],Z=[],R=[],stop=[];
  for(let i=0;i<poses.length-1;i++){const [ax,az,ah]=poses[i],[bx,bz,bh,f]=poses[i+1],d=Math.hypot(bx-ax,bz-az),rev=!!(f&&f.includes('r'));
    if(d>0.01){const c=d*0.4,p1x=ax+Math.sin(ah)*c,p1z=az+Math.cos(ah)*c,p2x=bx-Math.sin(bh)*c,p2z=bz-Math.cos(bh)*c,n=Math.max(2,Math.ceil(d/0.5));
      for(let k=X.length?1:0;k<=n;k++){const t=k/n,u=1-t,A=u*u*u,B=3*u*u*t,C=3*u*t*t,D=t*t*t;X.push(A*ax+B*p1x+C*p2x+D*bx);Z.push(A*az+B*p1z+C*p2z+D*bz);R.push(rev?1:0)}}
    if(f&&f.includes('s'))stop.push({i:X.length-1,sign:true})}
  const n=X.length,S=new Float32Array(n),H=new Float32Array(n),V=new Float32Array(n);
  for(let i=1;i<n;i++)S[i]=S[i-1]+Math.hypot(X[i]-X[i-1],Z[i]-Z[i-1]);
  for(let i=0;i<n;i++){let a=Math.max(0,i-1),b=Math.min(n-1,i+1);if(R[a]!==R[i])a=i;if(R[b]!==R[i])b=i;if(a===b)b=Math.min(n-1,i+1);H[i]=Math.atan2(X[b]-X[a],Z[b]-Z[a])}
  const F=H.map((h,i)=>h+(R[i]?Math.PI:0));
  for(let i=1;i<n;i++)if(R[i]!==R[i-1])stop.push({i:i-1,cusp:true});stop.sort((p,q)=>p.i-q.i);
  // the turns: no more than about 0.2 g round them; slow in the lots and backing up
  for(let i=0;i<n;i++){const a=Math.max(0,i-3),b=Math.min(n-1,i+3);let dh=Math.abs(H[b]-H[a]);if(dh>Math.PI)dh=2*Math.PI-dh;
    const k=dh/Math.max(0.5,S[b]-S[a]),lot=Z[i]>723||X[i]>56&&Z[i]<615;V[i]=Math.min(TU.tfCarV,Math.sqrt(2/Math.max(k,1e-4)),lot?3.5:1e9,R[i]?1.4:1e9)}
  for(let i=n-2;i>=0;i--)V[i]=Math.min(V[i],Math.sqrt(V[i+1]*V[i+1]+2*2.2*(S[i+1]-S[i])));
  return {X,Z,R,S,H,F,V,stop,n,len:S[n-1],park}}
// ---------- loading: the bodies and their atlas, then the cars, once the town is near ----------
const TF_GLSL=`attribute vec3 aSk;attribute vec4 aWalk;
mat3 pdRot(float a){float c=cos(a),s=sin(a);return mat3(1.,0.,0.,0.,c,s,0.,-s,c);}
vec3 pdRx(vec3 q,float a,float y){q.y-=y;q=pdRot(a)*q;q.y+=y;return q;}
void pdPart(float pP,inout vec3 p,inout vec3 n){pP=floor(pP+0.5);if(pP<0.5)return;float leg=pP<2.5||(pP>4.5&&pP<6.5)?1.:0.,L=mod(pP,2.);
  if(aWalk.y<-0.5){if(pP>4.5){float k=leg>0.5?1.5:-1.1;p=pdRx(p,k,leg>0.5?0.490:1.100);n=pdRot(k)*n;}float s=leg>0.5?-1.5:-0.22;p=pdRx(p,s,leg>0.5?0.910:1.420);n=pdRot(s)*n;return;}
  float am=abs(aWalk.y),sg=leg>0.5?(L>0.5?1.:-1.):(L>0.5?-1.:1.),sw=sin(aWalk.x)*am*sg,cw=cos(aWalk.x)*sg;
  if(pP>4.5){if(leg>0.5){float k=am*1.5*max(0.,-cw)+am*0.25;p=pdRx(p,k,0.490);n=pdRot(k)*n;}
    else{float e=-0.22-am*0.5*max(0.,-sin(aWalk.x)*sg);p=pdRx(p,e,1.100);n=pdRot(e)*n;}}
  float a=leg>0.5?sw:sw*0.85;p=pdRx(p,a,leg>0.5?0.910:1.420);n=pdRot(a)*n;}
void pdSkin(inout vec3 p,inout vec3 n){vec3 p1=p,n1=n,p2=p,n2=n;pdPart(aSk.x,p1,n1);pdPart(aSk.y,p2,n2);p=mix(p1,p2,aSk.z);n=normalize(mix(n1,n2,aSk.z));}
void pdGirth(inout vec3 p,inout vec3 n){float w=floor(aWalk.w+0.5);if(w<1.)return;
  vec2 g=mix(vec2(floor(w/1000.),mod(w,1000.))/100.,vec2(1.),smoothstep(1.42,1.52,p.y));p.xz*=g;n.xz/=g;n=normalize(n);}`;
function tfLoad(){if(tf.load)return;tf.load=1;const B='models/peds/',j=u=>fetch(B+u).then(r=>{if(!r.ok)throw new Error(u);return r.json()});
  const t=new Promise((ok,no)=>new THREE.TextureLoader().load(B+(gfxCur.pbr?'peds_atlas.webp':'peds_atlas_1k.webp'),ok,undefined,no));
  Promise.all([j('bodies.json'),j('peds.json'),t]).then(([bd,ch,tx])=>{tx.colorSpace=THREE.SRGBColorSpace;tx.anisotropy=4;
    tf.bodies=bd;tf.chars=ch.chars;tf.GC=ch.cols;tf.GR=ch.rows;tf.tex=tx;tf.use=new Array(ch.chars.length).fill(0);tfMeshes();tf.load=2}).catch(e=>{console.warn('townsfolk:',e);tf.load=-1});
  mdlLoad('cars',sc=>{for(const o of (sc.getObjectByName('cars')||sc).children.slice())if(TF_CARS[o.name])tfCarModel(o.name,o)})}
function tfMeshes(){const C=tf.GC.toFixed(1),R=tf.GR.toFixed(1),mat=new THREE.MeshStandardMaterial({map:tf.tex,roughness:0.88,envMap:skyEnv,envMapIntensity:0.5});
  mat.onBeforeCompile=sh=>{sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\n'+TF_GLSL)
    .replace('#include <beginnormal_vertex>','#include <beginnormal_vertex>\nvec3 pdP=position,pdN=objectNormal;pdGirth(pdP,pdN);pdSkin(pdP,pdN);objectNormal=pdN;')
    .replace('#include <begin_vertex>','#include <begin_vertex>\ntransformed=pdP;')
    .replace('#include <uv_vertex>',`#include <uv_vertex>\nvMapUv=(vMapUv+vec2(mod(aWalk.z,${C}),${R}-1.-floor(aWalk.z/${C}+0.01)))/vec2(${C},${R});`)};
  mat.customProgramCacheKey=()=>'townfolk-'+C+'x'+R;
  const cap=TF_N[3][0]+TF_N[3][1]+4+TF_ROOM_CAP;tf.M={};
  for(const k of ['m','f','k']){const b=tf.bodies[k];if(!b)continue;const g=new THREE.BufferGeometry();
    g.setAttribute('position',new THREE.Float32BufferAttribute(b.p,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(Float32Array.from(b.n,v=>v/1000),3));
    g.setAttribute('uv',new THREE.Float32BufferAttribute(Float32Array.from(b.uv,v=>v/65535),2));
    g.setAttribute('aSk',new THREE.Float32BufferAttribute(Float32Array.from(b.sk,(v,i)=>i%3===2?v/255:v),3));
    g.setIndex(b.p.length/3>65535?new THREE.Uint32BufferAttribute(b.i,1):new THREE.Uint16BufferAttribute(b.i,1));
    const walk=new THREE.InstancedBufferAttribute(new Float32Array(cap*4),4);walk.setUsage(THREE.DynamicDrawUsage);g.setAttribute('aWalk',walk);
    const m=new THREE.InstancedMesh(g,mat,cap);m.count=0;m.frustumCulled=false;m.castShadow=!!gfxCur.pbr;m.receiveShadow=true;m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(m);tf.M[k]={m,walk,n:0,cap}}}
// a car model (a node of models/cars.glb, standing on y = 0, nose to +z) on the game's materials; its paint is set per
// car (tfCarPaint), and its wheels (wheel_* nodes, their origins at the hubs) turn about x
function tfCarModel(k,root){root.position.set(0,0,0);root.rotation.set(0,0,0);root.updateMatrixWorld(true);
  const box=new THREE.Box3().setFromObject(root),sz=box.getSize(new THREE.Vector3());
  root.traverse(o=>{if(o.isMesh){const n=o.material.name;o.material=mdlMatOf(n);o.userData.paint=n==='carpaint';o.castShadow=!/^(tint|under|seat)$/.test(n);o.receiveShadow=true}
    if(/^wheel_/.test(o.name)){const t=o.children.find(c=>/_tire$/.test(c.name));t.geometry.computeBoundingBox();o.userData.q0=o.quaternion.clone();o.userData.r=t.geometry.boundingBox.max.y}});
  tf.cars[k]={g:root,len:sz.z,wid:sz.x-0.2}}
// a paint for a new car: picked by how common it is; clear-coated on High graphics
function tfCarPaint(){const W=TF_PAINT.reduce((n,p)=>n+p[2],0);let r=Math.random()*W,p=TF_PAINT[0];for(const q of TF_PAINT){r-=q[2];if(r<0){p=q;break}}
  const k=p[0]+'_'+!!gfxCur.pbr;tf.paint=tf.paint||{};if(tf.paint[k])return tf.paint[k];
  const o={color:p[0],metalness:p[1]?0.55:0.05,roughness:p[1]?0.32:0.28,envMap:skyEnv,envMapIntensity:1.1};
  return tf.paint[k]=gfxCur.pbr?new THREE.MeshPhysicalMaterial(Object.assign(o,{clearcoat:1,clearcoatRoughness:0.08})):new THREE.MeshStandardMaterial(o)}
// ---------- people ----------
// a person's look: the character least seen in town just now (children a third as often), a little taller or shorter
function tfLook(){const C=tf.chars;let best=0,bs=1e9;for(let i=0;i<C.length;i++){const sc=tf.use[i]*(C[i].body==='k'?3:1)+Math.random()*0.9;if(sc<bs){bs=sc;best=i}}
  const c=C[best];tf.use[best]++;return {ci:best,body:c.body,cell:c.cell,sc:c.h/1.75*(0.97+Math.random()*0.06),g:Math.round((c.wx||1)*100)*1000+Math.round((c.wz||1)*100)}}
function tfPerson(o){const p=Object.assign(tfLook(),{x:0,z:0,y:0,yaw:0,ph:Math.random()*6,amp:0,spd:0,vt:TU.tfWalk*(0.82+Math.random()*0.32),side:0.32,wait:0,inside:0,blk:0,look:0},o);
  p.y=baseHeight(p.x,p.z)+tfLift(p.x,p.z);tf.people.push(p);return p}
function tfDrop(p){const i=tf.people.indexOf(p);if(i>=0){tf.people.splice(i,1);tf.use[p.ci]--;if(p.room){p.room.n--;if(p.spot&&p.spot.who===p)p.spot.who=null}}}
// someone on the walks at a random spot (out of sight unless fill: the walks are empty, as when the town first comes near)
function tfSpawnWalker(fill){for(let t=0;t<8;t++){const w=TF_WALK[(Math.random()*TF_WALK.length)|0];if(w.x)continue;const s=Math.random()*w.len,[x,z]=tfAt(w,s);
    if(!fill&&tfSeen(x,z,1)&&Math.hypot(x-camera.position.x,z-camera.position.z)<90)continue;
    const p=tfPerson({w,s,dir:Math.random()<0.5?1:-1,x,z});p.side=0.32*(Math.random()<0.8?1:-1);return p}}
// in view of the camera (within r of a point seen) and not too far off
function tfSeen(x,z,r){tf.v.set(x,baseHeight(x,z)+1,z);return tf.fr.intersectsSphere(new THREE.Sphere(tf.v,r||2))}
// what someone walking at (x, z) toward (dx, dz) would bump into within reach: another person, the worker, a car
function tfBlocked(p,dx,dz,reach){const rx=-dz,rz=dx;
  const hit=(x,z,r)=>{const ox=x-p.x,oz=z-p.z,f=ox*dx+oz*dz;return f>0&&f<reach+r&&Math.abs(ox*rx+oz*rz)<0.32+r};
  if(!(p.ghost>0))for(const q of tf.people)if(q!==p&&!q.inside&&hit(q.x,q.z,0.25))return true;
  if(walker.visible&&mode==='walk'&&hit(wk.x,wk.z,0.3))return true;
  if(!(p.ghost>0))for(const c of tf.drive)if(c.v>0.3||c.st!=='park')for(const lz of [-1.4,0,1.4])if(hit(c.x+Math.sin(c.yaw)*lz,c.z+Math.cos(c.yaw)*lz,1.0))return true;
  return false}
// a crosswalk is clear to step onto: no car within 14 m of its middle moving, none on it
function tfXOk(w){const [mx,mz]=tfAt(w,w.len/2);for(const c of tf.drive){const d=Math.hypot(c.x-mx,c.z-mz);if(d<5||d<14&&c.v>0.6)return false}return true}
function tfWalkStep(p,dt){
  if(p.inside>0){p.inside-=dt;if(p.inside<=0){p.inside=0;if(p.car){p.path=tfLine(p.path.p.slice().reverse());p.s=0;p.back=true}}return}
  let dx,dz,x,z;
  if(p.path){if(p.s>=p.path.len){if(p.back){p.car.boardT=1.2;tfDrop(p);return}p.inside=15+Math.random()*50;p.spd=0;return}
    [x,z,dx,dz]=tfAt(p.path,p.s)}
  else{const w=p.w,[ax,az,ex,ez]=tfAt(w,p.s);dx=ex*p.dir;dz=ez*p.dir;x=ax-dz*p.side;z=az+dx*p.side;
    // at a walk's end: on to another (round the corner, over a crosswalk, into the store) or turn back
    if(p.dir>0&&p.s>=w.len||p.dir<0&&p.s<=0){const n=p.dir>0?w.b:w.a;if(n.door&&!p.wait){p.inside=8+Math.random()*30;p.x=n.x;p.z=n.z}tfPick(p,n,w);return}
    // now and then a look in a shop window (the shops face the street: away from it)
    if(!w.x&&p.wait<=0&&Math.random()<dt*0.035&&(Math.abs(x)>MSX-0.6&&Math.abs(x)<MSX+0.7&&z<724||Math.abs(Math.abs(z-MST.cz)-5.15)<0.7)){p.wait=3+Math.random()*6;
      p.look=Math.abs(z-MST.cz)<6&&Math.abs(x)>MSX+1?(z<MST.cz?N_:S_):(x<0?W_:E_)}
    p.xw=false;if(w.x&&!p.xok&&(p.dir>0?p.s<0.6:p.s>w.len-0.6)){if(tfXOk(w))p.xok=true;else{p.spd=0;p.xw=true;p.amp+=(0-p.amp)*Math.min(1,dt*6);return}}}
  if(p.wait>0){p.wait-=dt;p.spd=0;p.amp+=(0-p.amp)*Math.min(1,dt*6);let d=p.look-p.yaw;d=Math.atan2(Math.sin(d),Math.cos(d));p.yaw+=d*Math.min(1,dt*3);return}
  // held up a while by someone in the way: step to the other side, and if that does not do it, edge round them
  if(p.ghost>0)p.ghost-=dt;const bl=tfBlocked(p,dx,dz,0.9);p.blk=bl?p.blk+dt:0;if(p.blk>2){if(!p.path&&!p.flip){p.side=-p.side;p.flip=1}else{p.ghost=2.5;p.flip=0}p.blk=0}
  p.spd+=((bl?0:p.vt)-p.spd)*Math.min(1,dt*(bl?8:2));const ds=p.spd*dt;
  if(p.path)p.s+=ds;else p.s=Math.min(p.w.len,Math.max(0,p.s+ds*p.dir));
  p.x+=(x-p.x)*Math.min(1,dt*8);p.z+=(z-p.z)*Math.min(1,dt*8);
  let d=Math.atan2(dx,dz)-p.yaw;d=Math.atan2(Math.sin(d),Math.cos(d));p.yaw+=d*Math.min(1,dt*7);
  p.amp+=(Math.min(1,p.spd/1.2)*0.42-p.amp)*Math.min(1,dt*6);p.ph+=p.spd*dt*Math.PI*2/(1.5*p.sc)}
// at node n (come by walk w): the next walk, not straight back unless it is a dead end (where they may stop a moment)
function tfPick(p,n,w){let opts=n.e.filter(e=>e!==w);if(!opts.length){opts=[w];if(Math.random()<0.4){p.wait=2+Math.random()*4;p.look=p.yaw+Math.PI}}
  const e=opts[(Math.random()*opts.length)|0];p.w=e;p.xok=false;p.dir=e.a===n?1:-1;p.s=p.dir>0?0:e.len}
// ---------- cars ----------
function tfSpawnCar(){const ks=Object.keys(tf.cars);if(!ks.length)return;const ends=['E','W','B'].filter(k=>{const [x,z]=TF_IN[k][0];return (!tfSeen(x,z,3)||Math.hypot(x-camera.position.x,z-camera.position.z)>110)&&
    !tf.drive.some(c=>Math.hypot(c.x-x,c.z-z)<c.len+6)});
  // (and clear of any car still pulling away from it, so two never start inside each other)
  const free=TF_STALLS.filter(s=>!s.car);if(!ends.length||!free.length)return;
  const from=ends[(Math.random()*ends.length)|0],pick=Math.random()<0.55?free.filter(s=>s.k==='st'):free.filter(s=>s.k==='mar'),S=(pick.length?pick:free)[(Math.random()*(pick.length?pick:free).length)|0];
  let r=Math.random()*ks.reduce((n,k)=>n+TF_CARS[k],0),k=ks[0];for(const q of ks){r-=TF_CARS[q];if(r<0){k=q;break}}
  const M=tf.cars[k],g=M.g.clone(true),paint=tfCarPaint();scene.add(g);const wheels=[];g.traverse(o=>{if(o.userData.q0){o.userData.q0=o.quaternion.clone();wheels.push(o)}if(o.userData.paint)o.material=paint});
  // (a clone's userData is a JSON copy, so each wheel's rest turn is taken again from its own quaternion)
  const c={k,g,wheels,len:M.len,wid:M.wid,S,path:tfPath(tfArrive(from,S),true),s:0,i:0,v:8,yaw:0,x:0,z:0,st:'in',si:0,wait:0,arr:0,stuck:0,rot:0};S.car=c;tf.drive.push(c);tfCarPlace(c)}
function tfCarDrop(c){scene.remove(c.g);if(c.S&&c.S.car===c)c.S.car=null;tf.drive.splice(tf.drive.indexOf(c),1);if(c.ped)tfDrop(c.ped)}
function tfCarPlace(c){const P=c.path;while(c.i<P.n-2&&P.S[c.i+1]<c.s)c.i++;const i=c.i,t=Math.min(1,Math.max(0,(c.s-P.S[i])/((P.S[i+1]-P.S[i])||1)));
  c.x=P.X[i]+(P.X[i+1]-P.X[i])*t;c.z=P.Z[i]+(P.Z[i+1]-P.Z[i])*t;const h=P.F[i]+Math.atan2(Math.sin(P.F[i+1]-P.F[i]),Math.cos(P.F[i+1]-P.F[i]))*t;c.yaw=h;
  const f=c.len*0.36,sy=Math.sin(h),cy=Math.cos(h),yf=baseHeight(c.x+sy*f,c.z+cy*f),yb=baseHeight(c.x-sy*f,c.z-cy*f);
  c.g.position.set(c.x,(yf+yb)/2+0.04,c.z);c.g.rotation.set(0,0,0);c.g.rotateY(h);c.g.rotateX(-Math.atan2(yf-yb,2*f))}
// the way ahead clear? the slowest speed it allows (people, the worker, machines, other cars; looking along the path)
function tfCarAhead(c){const P=c.path,rev=P.R[Math.min(P.n-1,c.i+1)],j=Math.min(P.n-1,c.i+(rev?4:10)),ax=P.X[j]-c.x,az=P.Z[j]-c.z,al=Math.hypot(ax,az)||1,dx=ax/al,dz=az/al,rx=-dz,rz=dx,
    reach=3+c.v*1.6,half=c.len/2;let lim=1e9;
  const see=(x,z,r)=>{const ox=x-c.x,oz=z-c.z,f=ox*dx+oz*dz;if(f<=0||f>half+reach+r||Math.abs(ox*rx+oz*rz)>c.wid/2+0.25+r)return;lim=Math.min(lim,Math.sqrt(2*4*Math.max(0,f-half-r-1.1)))};
  // (anyone waiting at the curb to cross is waiting for it; held up long by someone who will not move, it edges on)
  if(c.stuck>8)lim=1;else for(const p of tf.people)if(!p.inside&&!p.xw)see(p.x,p.z,0.3);
  if(walker.visible&&mode==='walk')see(wk.x,wk.z,0.35);
  for(const k in WK_RIDES){const R=WK_RIDES[k],o=R.o;if(!o||!R.c)continue;if(Math.abs(o.x-c.x)>30||Math.abs(o.z-c.z)>30)continue;for(const lz of R.c)see(o.x+Math.sin(o.yaw)*lz,o.z+Math.cos(o.yaw)*lz,R.r)}
  // (an oncoming car only when right in its path: lanes pass close on the bends; two held up by each other where their
  // ways cross: the first in the list goes)
  for(const q of tf.drive)if(q!==c){const on=Math.sin(q.yaw)*dx+Math.cos(q.yaw)*dz<-0.5&&q.st!=='park';if(c.ign===q){if(Math.hypot(q.x-c.x,q.z-c.z)>9)c.ign=null;else continue}
    if(on&&c.stuck>4||c.stuck>6&&q.stuck>6&&tf.drive.indexOf(c)<tf.drive.indexOf(q)){c.ign=q;continue}for(const lz of [-q.len*0.3,0,q.len*0.3])see(q.x+Math.sin(q.yaw)*lz,q.z+Math.cos(q.yaw)*lz,on?0.2:1.0)}
  return lim}
// the four-way stop: its turn once it has stopped a moment, the junction is clear and nobody stopped before it is waiting
function tfMyTurn(c){if(c.wait<1.2)return false;
  for(const q of tf.drive)if(q!==c){if(Math.abs(q.x)<7.5&&Math.abs(q.z-MST.cz)<7&&q.v>0.05)return false;if(q.atSign&&q.wait>=1.2&&(q.arr<c.arr||q.arr===c.arr&&tf.drive.indexOf(q)<tf.drive.indexOf(c)))return false}
  return true}
function tfCarStep(c,dt){const P=c.path;
  if(c.st==='park'){if(c.boardT>0){c.boardT-=dt;if(c.boardT<=0){c.boardT=0;c.ped=null;const to=['E','W','B'][(Math.random()*3)|0];c.path=tfPath(tfLeave(c.S,to),false);c.s=0;c.i=0;c.si=0;c.st='out';c.S.car=null}}return}
  const nx=P.stop[c.si];let vt=P.V[Math.min(P.n-1,c.i+1)];c.atSign=false;
  if(P.park){const d=P.len-c.s;vt=Math.min(vt,Math.sqrt(2*2.2*Math.max(0,d))+(d>0.03?0.2:0))}
  if(nx){const d=P.S[nx.i]-c.s;vt=Math.min(vt,Math.sqrt(2*3*Math.max(0,d-0.05)));
    if(d<0.35&&c.v<0.25){if(!c.wait)c.arr=tf.t;c.wait+=dt;c.atSign=!!nx.sign;
      if(nx.cusp?c.wait>0.8:tfMyTurn(c)){c.si++;c.wait=0;c.atSign=false;c.s=P.S[nx.i]+0.02}else vt=0}}
  const lim=tfCarAhead(c);vt=Math.min(vt,lim);c.stuck=vt<0.1&&!c.atSign?c.stuck+dt:0;
  c.v+=Math.max(-5*dt,Math.min(2*dt,vt-c.v));if(c.v<0.02&&vt<0.02)c.v=0;
  c.s=Math.min(P.len,c.s+c.v*dt);tfCarPlace(c);c.rot+=c.v*dt*(P.R[c.i+1]?-1:1);
  for(const w of c.wheels){w.quaternion.setFromAxisAngle(WK_X,c.rot/(w.userData.r||0.35)).multiply(w.userData.q0)}
  if(c.s>=P.len-0.05&&(c.v<0.1||!P.park)){
    if(P.park){c.st='park';c.v=0;const s=Math.sin(c.yaw),k=Math.cos(c.yaw),lx=k*(c.wid/2+0.4),lz=-s*(c.wid/2+0.4),x=c.x+lx+s*0.4,z=c.z+lz+k*0.4,
        door=c.S.k==='st'?TF_DOOR:c.S.x>=80?[93,577.7]:[46,579.3],mid=c.S.k==='st'?[x,741.4]:[x,581.3];
      c.ped=tfPerson({path:tfLine([[x,z],mid,door]),s:0,car:c,x,z,yaw:c.yaw+Math.PI/2})}
    else tfCarDrop(c)}
  // a car stuck a long while (blocked in) gives up once nobody is looking
  else if(c.stuck>40&&!tfSeen(c.x,c.z,3))tfCarDrop(c)}
// ---------- the people in the rooms: staff at their posts, customers browsing, queueing, sitting at tables ----------
// a room within TF_RNEAR of the camera fills to its staff and customers (its big counts, or TF_RN beside its staff),
// each on a spot of their own; past TF_RFAR it empties. Now and then a customer goes (when nobody is looking) and
// someone else comes to another spot; a spot with a path (a waiter, a bartender, a shopper) is walked round and round,
// along lines clear of the furniture
function tfRoomsTick(){const cx=camera.position.x,cz=camera.position.z;let n=tf.people.reduce((k,p)=>k+(p.room?1:0),0);
  for(const R of TF_ROOMS){const d=Math.hypot(R.x-cx,R.z-cz)-R.r;
    if(d>TF_RFAR){if(R.n)for(const p of tf.people.slice())if(p.room===R)tfDrop(p);continue}
    if(d>TF_RNEAR&&!R.n)continue;const staff=R.spots.filter(sp=>sp.staff).length,want=Math.min(R.spots.length,staff+(R.big?R.big[tf.q]:TF_RN[tf.q]));
    while(R.n<want&&n<TF_ROOM_CAP){const free=R.spots.filter(sp=>!sp.who),st=free.filter(sp=>sp.staff),sp=st.length?st[0]:free[(Math.random()*free.length)|0];if(!sp)break;
      const p=tfPerson({room:R,spot:sp,x:sp.x,z:sp.z,yaw:sp.yaw,sit:sp.sit?1:0,t:6+Math.random()*30,look:0,s:sp.at||0});p.y=sp.path&&R.ground?baseHeight(sp.x,sp.z):sp.y;sp.who=p;R.n++;n++}}}
function tfRoomStep(p,dt){const sp=p.spot,R=p.room;
  if(sp.path){// walking the aisles, stopping at a table now and then
    if(p.wait>0){p.wait-=dt;p.spd=0}else{p.spd+=(p.vt*0.8-p.spd)*Math.min(1,dt*2);p.s=(p.s+p.spd*dt)%sp.path.len;if(Math.random()<dt*0.05)p.wait=2+Math.random()*5}
    const [x,z,dx,dz]=tfAt(sp.path,p.s);p.x=x;p.z=z;p.y=R.ground?baseHeight(x,z):sp.y;let d=Math.atan2(dx,dz)-p.yaw;d=Math.atan2(Math.sin(d),Math.cos(d));p.yaw+=d*Math.min(1,dt*5);
    p.amp+=(Math.min(1,p.spd/1.2)*0.42-p.amp)*Math.min(1,dt*6);p.ph+=p.spd*dt*Math.PI*2/(1.5*p.sc);return}
  p.spd=0;p.amp+=(0-p.amp)*Math.min(1,dt*6);let a=sp.yaw+p.look-p.yaw;a=Math.atan2(Math.sin(a),Math.cos(a));p.yaw+=a*Math.min(1,dt*2.5);
  p.t-=dt;if(p.t>0)return;p.t=6+Math.random()*25;
  if(sp.staff||Math.random()<0.45){p.look=sp.sit?0:(Math.random()-0.5)*1.4;return}
  // done: a customer goes (when nobody is looking) and someone else comes in to another spot
  if(!tfSeen(p.x,p.z,1.5))tfDrop(p)}
// ---------- each frame ----------
function tfTick(dt){if(!tf.q){if(tf.on)tfShow(false);return}
  const cx=camera.position.x,cz=camera.position.z,B=TF_BOX,dd=Math.hypot(Math.max(B[0]-cx,0,cx-B[1]),Math.max(B[2]-cz,0,cz-B[3]));
  if(dd>TF_NEAR){if(tf.on)tfShow(false);return}
  if(!tf.load)tfLoad();if(tf.load!==2)return;
  dt=Math.min(dt,0.1);tf.t+=dt;camera.updateMatrixWorld();tf.fm.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);tf.fr.setFromProjectionMatrix(tf.fm);
  const night=typeof dn==='object'?Math.min(1,Math.max(0.3,(dn.el+8)/14)):1,[np,nc]=TF_N[tf.q],wantP=Math.round(np*night),wantC=Math.round(nc*night),walkers=tf.people.filter(p=>!p.car&&!p.room);
  if(!tf.on){tfShow(true);while(walkers.length<wantP){const p=tfSpawnWalker(true);if(!p)break;walkers.push(p)}}
  tf.spawnT-=dt;if(tf.spawnT<=0){tf.spawnT=1.5+Math.random()*2;
    if(walkers.length<wantP)tfSpawnWalker(false);
    else if(walkers.length>wantP){const p=walkers.find(p=>p.inside||!tfSeen(p.x,p.z,1));if(p)tfDrop(p)}
    if(tf.drive.reduce((n,c)=>n+(c.st==='park'?0.5:1),0)<wantC&&Object.keys(tf.cars).length>=3&&Math.random()<0.5)tfSpawnCar()}
  for(const c of tf.drive.slice())tfCarStep(c,dt);
  tfRoomsTick();
  for(const p of tf.people.slice()){if(p.room){tfRoomStep(p,dt);continue}tfWalkStep(p,dt);p.y+=(baseHeight(p.x,p.z)+tfLift(p.x,p.z)-p.y)*Math.min(1,dt*8)}
  if(mode==='walk'&&walker.visible){for(const c of tf.drive)wkPushRound(c,[-c.len*0.3,0,c.len*0.3],c.wid/2);for(const p of tf.people)if(!p.inside)wkPushRound(p,[0],0.22)}
  tfDraw()}
function tfShow(on){tf.on=on;for(const k in tf.M||{})tf.M[k].m.visible=on;for(const c of tf.drive)c.g.visible=on;
  if(!on){for(const c of tf.drive.slice())tfCarDrop(c);for(const p of tf.people.slice())tfDrop(p)}}
function tfDraw(){const M=tf.M,o3=tf.o,cx=camera.position.x,cz=camera.position.z;for(const k in M)M[k].n=0;
  for(const p of tf.people){if(p.inside)continue;const B=M[p.body];if(!B||B.n>=B.cap)continue;
    if((p.x-cx)**2+(p.z-cz)**2>(p.room?TF_RFAR*TF_RFAR:220*220)||!tfSeen(p.x,p.z,1.3))continue;
    o3.position.set(p.x,p.y+(p.sit?-0.42*p.sc:Math.abs(Math.cos(p.ph))*0.025*p.amp*p.sc),p.z);o3.rotation.set(0,p.yaw,0);o3.scale.setScalar(p.sc);o3.updateMatrix();
    const i=B.n++,w=B.walk.array;B.m.setMatrixAt(i,o3.matrix);w[4*i]=p.ph;w[4*i+1]=p.sit?-1:p.amp;w[4*i+2]=p.cell;w[4*i+3]=p.g}
  for(const k in M){const B=M[k];B.m.count=B.n;B.m.instanceMatrix.needsUpdate=true;B.walk.needsUpdate=true}
  for(const c of tf.drive)c.g.visible=(c.x-cx)**2+(c.z-cz)**2<400*400}
