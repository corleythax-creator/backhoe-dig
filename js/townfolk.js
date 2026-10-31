// Corley's Island: the townsfolk: people out walking the lakeside town's sidewalks, crossing at the crosswalks, looking
// in the shop windows and going in and out of the General Store; and cars driven into town from the cross street's ends
// and the beach road, which keep right, stop at the four-way stop and take their turn, wait for anyone in the way (people,
// the worker, a machine, another car), and park at the General Store or the marina, where the driver gets out, walks in,
// comes back a while later and drives off.
// The people are 32 characters (models/peds/peds.json) each built whole from MakeHuman's CC0 bodies, skins, hair and
// clothes by tools/peds (build_folk.py in Blender, pack_folk.py): its own mesh (models/peds/folk_hi.bin, ~7,000
// triangles, or folk_lo.bin, ~3,000, below High) and texture (folk/<id>.webp, folk_lo/), skinned to 9 parts and drawn
// as one instanced mesh per character whose limbs swing in the vertex shader about its own joints (TF_GLSL, from
// cruise-brandon's PD_GLSL). The traffic cars are cruise-brandon's (the owner's other game, its CREDITS.md):
// models/cars.glb, tools/models/cars.js (sedan, hatchback, wagon, SUV and van from the CC-BY models in CREDITS.md): sedans, hatchbacks, wagons, SUVs, minivans, pickups and vans on treaded tyres
// and alloys, each in its own clear-coated colour.
// They are each device's own: not saved or synced, and how many is the Graphics setting Townsfolk (gfx.js `town`), fewer
// after dark. Nothing loads or moves until the camera comes within TF_NEAR of the town.
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.
const TF_NEAR=360,TF_BOX=[-200,200,540,780],TF_CARS={sedan:4,hatch:3,wagon:1,suv:4,minivan:2,pickup:3,van:1};
// the paints, as often as they are seen on the road: whites, blacks, silvers and greys most, then a few colours (metallic: m)
const TF_PAINT=[[0xe9e9e6,0,4],[0xf2f0ea,0,2],[0x101113,0,3],[0xa9adb0,1,3],[0x5a5e62,1,3],[0x2b2e33,1,2],[0x7e1416,1,2],[0x1c335c,1,2],[0x23382d,1,1],[0xb3a284,1,1],[0x6e869b,1,1],[0x8a4a1c,1,1]];
// [people, cars] for the Townsfolk setting: Off, Few, Some, Busy
const TF_N=[[0,0],[24,9],[42,15],[72,21]];
// in the rooms (TF_ROOMS, interiors.js): customers in each shop besides its staff, for the setting; how near the camera
// must come for a room to fill (it empties again past TF_RFAR); the most drawn in the rooms at once
const TF_RN=[0,1,2,3],TF_RNEAR=70,TF_RFAR=95,TF_ROOM_CAP=110;
const tf={q:2,on:false,parked:[],parkedOn:false,load:0,bodies:null,chars:null,tex:null,M:null,cars:{},people:[],drive:[],t:0,spawnT:0,o:new THREE.Object3D(),fr:new THREE.Frustum(),fm:new THREE.Matrix4(),v:new THREE.Vector3()};
function tfGfx(q){tf.q=q??2;if(tf.M)for(const k in tf.M){const B=tf.M[k];B.m.castShadow=!!gfxCur.pbr;if(B.fg&&B.fg.object)B.fg.object.castShadow=!!gfxCur.pbr}}
// ---------- the walks: sidewalk centre lines, crosswalks (x) and the ways to the store's door ----------
const MSX=5.3,MCN=646.85,MCS=657.15,TF_DOOR=[0,742.4],TF_GATE=[64,679.5];
// (the sidewalks are cut where the mid-block crosswalks land, MST_XW in mainland.js)
const [TF_XN,TF_XS]=MST_XW.z,TF_XX=MST_XW.x[1];
const TF_WALK=[[[-MSX,580],[-MSX,TF_XN]],[[-MSX,TF_XN],[-MSX,MCN]],[[MSX,580],[MSX,TF_XN]],[[MSX,TF_XN],[MSX,MCN]],[[-MSX,MCS],[-MSX,TF_XS]],[[-MSX,TF_XS],[-MSX,723]],[[MSX,MCS],[MSX,TF_XS]],[[MSX,TF_XS],[MSX,723]],
  [[-MSX,MCN],[-TF_XX,MCN]],[[-TF_XX,MCN],[-127,MCN]],[[MSX,MCN],[TF_XX,MCN]],[[TF_XX,MCN],[127,MCN]],[[-MSX,MCS],[-TF_XX,MCS]],[[-TF_XX,MCS],[-127,MCS]],[[MSX,MCS],[TF_XX,MCS]],[[TF_XX,MCS],[64,MCS]],[[64,MCS],[127,MCS]],[[64,MCS],[64,661],TF_GATE],
  {x:1,p:[[-MSX,TF_XN],[MSX,TF_XN]]},{x:1,p:[[-MSX,TF_XS],[MSX,TF_XS]]},{x:1,p:[[-TF_XX,MCN],[-TF_XX,MCS]]},{x:1,p:[[TF_XX,MCN],[TF_XX,MCS]]},
  {x:1,p:[[-MSX,MCN],[-5,645],[5,645],[MSX,MCN]]},{x:1,p:[[-MSX,MCS],[-5,659],[5,659],[MSX,MCS]]},
  {x:1,p:[[-MSX,MCN],[-7.8,648.3],[-7.8,655.7],[-MSX,MCS]]},{x:1,p:[[MSX,MCN],[7.8,648.3],[7.8,655.7],[MSX,MCS]]},
  [[-MSX,723],[-5.9,727],[-5.9,741.6],TF_DOOR],[[MSX,723],[6,727],[6,741.6],TF_DOOR],
  // Harbor Square (square.js): from the foot of Main Street's west sidewalk along the beach road to the green, round
  // it, and over the road to the promenade
  [[-MSX,580],[-12,578.5],[SQ.gx1,SQ.gz0]],[[SQ.gx1,SQ.gz0],[-57,SQ.gz0]],[[-57,SQ.gz0],[SQ.gx0,SQ.gz0]],[[SQ.gx0,SQ.gz0],[SQ.gx0,SQ.gz1]],
  [[SQ.gx0,SQ.gz1],[SQ.gx1,SQ.gz1]],[[SQ.gx1,SQ.gz1],[SQ.gx1,SQ.gz0]],{x:1,p:[[-57,SQ.gz0],[-57,568.6]]},{x:1,p:[[SQ.gx1,SQ.gz0],[SQ.gx1,568.6]]},
  [[-110,568.6],[-57,568.6]],[[-57,568.6],[SQ.gx1,568.6]]].map(e=>{const p=e.p||e,L=[0];
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
function tfLift(x,z){if(x<-6&&x>-114&&z<616){const p=padAt(x,z);return p>-1e8?Math.max(0,p-baseHeight(x,z)):0}if(Math.abs(x-TF_GATE[0])<1.4&&z>658.8&&z<TF_GATE[1]+0.5)return z<661?0.17-(z-658.8)/2.2*0.14:0.03;if(z>724.5)return z>740.2&&Math.abs(x)<15.5?0.12:0.04;if(x>56&&z<615)return 0.04;
  if(Math.abs(x)<MST.x+0.1&&z>556||Math.abs(z-MST.cz)<MST.cw+0.1&&Math.abs(x)>MST.x)return MST.lift;
  if(Math.abs(x)<MST.x+MST.curb+MST.walk+0.2&&z>576||Math.abs(z-MST.cz)<MST.cw+3.5&&Math.abs(x)<128)return mstRamp(x,z);return 0}
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
// the right turns at the four-way stop, round the curb's corner close in (a wide bezier would cut over the sidewalk)
const TF_RT_N=[[13.1,650.25,W_,'s'],[5.5,650.25,W_],[2,646.75,N_]],TF_RT_S=[[-13.1,653.75,E_,'s'],[-5.5,653.75,E_],[-2,657.25,S_]];
const TF_TO_ST={E:[[13.1,650.25,W_,'s'],[-2,657.5,S_],[-2,716,S_]],W:[...TF_RT_S,[-2,661,S_],[-2,716,S_]],
  B:[[-8,575.25,E_],[-2,581,S_],[-2,639.5,S_,'s'],[-2,716,S_]]};
const TF_BEACH_E=[[8,575.25,E_],...tfLane(TF_BER,1.25).slice(1)],TF_BEACH_W=tfLane(TF_BER.slice().reverse(),1.25).slice(0,3);
const TF_TO_MAR={E:[...TF_RT_N,[2,639,N_],[2,579.5,N_],[6.5,575.25,E_],...TF_BEACH_E],W:[[-13.1,653.75,E_,'s'],[2,642,N_],[2,579.5,N_],[6.5,575.25,E_],...TF_BEACH_E],B:[[-8,575.25,E_],...TF_BEACH_E]};
const TF_OUT_N={E:[[6.5,653.75,E_],[140,653.75,E_],[146,653.75,E_]],W:[[-6.5,650.25,W_],[-140,650.25,W_],[-146,650.25,W_]],
  B:[[2,581,N_],...tfLane(TF_BWR.slice().reverse(),1.25)]};
const TF_OUT_S={E:[[-2,581,S_],[-2,639.5,S_,'s'],[6.5,653.75,E_],[140,653.75,E_],[146,653.75,E_]],W:[[-2,581,S_],[-2,639.5,S_,'s'],[-6.5,650.25,W_],[-140,650.25,W_],[-146,650.25,W_]],
  B:tfLane(TF_BWR.slice().reverse(),1.25)};
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
  else P.push([S.x,S.z,S_],[S.x+3.2,590.8,E_,'r'],[S.x+3.2,590.8,W_],[62,590.8,W_],...TF_BEACH_W,[6,572.75,W_],...TF_OUT_S[to]);
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
  // the turns: no more than about 0.2 g round them; slow in the lots, across Harbor Square and backing up
  for(let i=0;i<n;i++){const a=Math.max(0,i-3),b=Math.min(n-1,i+3);let dh=Math.abs(H[b]-H[a]);if(dh>Math.PI)dh=2*Math.PI-dh;
    const k=dh/Math.max(0.5,S[b]-S[a]),lot=Z[i]>723||X[i]>56&&Z[i]<615||X[i]>-108&&X[i]<-8&&Z[i]<579;V[i]=Math.min(TU.tfCarV,Math.sqrt(2/Math.max(k,1e-4)),lot?3.5:1e9,R[i]?1.4:1e9)}
  for(let i=n-2;i>=0;i--)V[i]=Math.min(V[i],Math.sqrt(V[i+1]*V[i+1]+2*2.2*(S[i+1]-S[i])));
  return {X,Z,R,S,H,F,V,stop,n,len:S[n-1],park}}
// ---------- loading: the people and their textures, then the cars, once the town is near ----------
// the limbs swing about each character's own joint heights (uJ: knee, hip, elbow, shoulder, from tools/peds)
const TF_GLSL=`#define TF_LSX 1.
attribute vec3 aSk;attribute vec4 aWalk;uniform vec4 uJ;
mat3 pdRot(float a){float c=cos(a),s=sin(a);return mat3(1.,0.,0.,0.,c,s,0.,-s,c);}
vec3 pdRx(vec3 q,float a,float y){q.y-=y;q=pdRot(a)*q;q.y+=y;return q;}
mat3 pdRotZ(float a){float c=cos(a),s=sin(a);return mat3(c,s,0.,-s,c,0.,0.,0.,1.);}
vec3 pdRz(vec3 q,float a,float y,float x){q.y-=y;q.x-=x;q=pdRotZ(a)*q;q.y+=y;q.x+=x;return q;}
void pdPart(float pP,inout vec3 p,inout vec3 n){pP=floor(pP+0.5);if(pP<0.5)return;float leg=pP<2.5||(pP>4.5&&pP<6.5)?1.:0.,L=mod(pP,2.);
  if(abs(aWalk.z)>0.001){float lp=abs(aWalk.z),fc=aWalk.z<0.?1.:0.,sx=L>0.5?TF_LSX:-TF_LSX,one=sx>0.?1.:0.;
    if(pP>4.5){if(leg>0.5){float k=mix(0.12,mix(1.0,0.35,fc),one)*lp;p=pdRx(p,k,uJ.x);n=pdRot(k)*n;}else{float e=-mix(0.7,mix(0.45,1.1,fc),one)*lp;p=pdRx(p,e,uJ.z);n=pdRot(e)*n;}}
    if(leg>0.5){float h=-0.55*one*(1.-fc)*lp,ab=sx*mix(0.28,0.14,one)*lp;p=pdRx(p,h,uJ.y);n=pdRot(h)*n;p=pdRz(p,ab,uJ.y,sx*0.1);n=pdRotZ(ab)*n;}
    else{float fl=-0.3*(1.-fc)*lp,ab=sx*mix(mix(1.1,0.3,fc),mix(1.4,2.2,fc),one)*lp;p=pdRx(p,fl,uJ.w);n=pdRot(fl)*n;p=pdRz(p,ab,uJ.w,sx*0.17);n=pdRotZ(ab)*n;}
    return;}
  if(aWalk.y<-0.5){if(pP>4.5){float k=leg>0.5?1.5:-1.1;p=pdRx(p,k,leg>0.5?uJ.x:uJ.z);n=pdRot(k)*n;}float s=leg>0.5?-1.5:-0.22;p=pdRx(p,s,leg>0.5?uJ.y:uJ.w);n=pdRot(s)*n;return;}
  float am=abs(aWalk.y),sg=leg>0.5?(L>0.5?1.:-1.):(L>0.5?-1.:1.),sw=sin(aWalk.x)*am*sg,cw=cos(aWalk.x)*sg;
  if(pP>4.5){if(leg>0.5){float k=am*1.5*max(0.,-cw)+am*0.25;p=pdRx(p,k,uJ.x);n=pdRot(k)*n;}
    else{float e=-0.22-am*0.5*max(0.,-sin(aWalk.x)*sg);p=pdRx(p,e,uJ.z);n=pdRot(e)*n;}}
  float a=leg>0.5?sw:sw*0.85;p=pdRx(p,a,leg>0.5?uJ.y:uJ.w);n=pdRot(a)*n;}
void pdSkin(inout vec3 p,inout vec3 n){vec3 p1=p,n1=n,p2=p,n2=n;pdPart(aSk.x,p1,n1);pdPart(aSk.y,p2,n2);p=mix(p1,p2,aSk.z);n=normalize(mix(n1,n2,aSk.z));}`;
// each character's mesh (folk_hi.bin on High graphics, folk_lo.bin below) and texture (folk/<id>.webp, folk_lo/), loaded
// when someone first wears that look
function tfLoad(){if(tf.load)return;tf.load=1;const B='models/peds/',lod=gfxCur.pbr?'hi':'lo',j=u=>fetch(B+u).then(r=>{if(!r.ok)throw new Error(u);return r});
  Promise.all([j('peds.json').then(r=>r.json()),j('folk.json').then(r=>r.json()),j('folk_'+lod+'.bin').then(r=>r.arrayBuffer())]).then(([ch,fk,buf])=>{
    const by={};for(const f of fk.chars)by[f.id]=f;tf.chars=ch.chars.filter(c=>by[c.id]);for(const c of tf.chars)c.folk=by[c.id];
    tf.use=new Array(tf.chars.length).fill(0);tfMeshes(buf,lod,B+(lod==='hi'?'folk/':'folk_lo/'));tf.load=2}).catch(e=>{console.warn('townsfolk:',e);tf.load=-1});
  mdlLoad('cars',sc=>{const top=sc.getObjectByName('cars')||sc;for(const k in TF_CARS){const hi=top.getObjectByName(k),lo=top.getObjectByName(k+'_lo');if(hi&&lo)tfCarModel(k,hi,lo)}
    // no car drives in until every kind's shaders and pictures are ready (gpuWarm, main.js), so none stalls a frame
    const W=new THREE.Group();for(const k in tf.cars){const g=tf.cars[k].g.clone(true);g.traverse(o=>{if(o.userData.paint)o.material=tfCarPaint(0.5)});W.add(g)}
    gpuWarm(W).then(()=>{tf.carsOk=1})})}
// one character's mesh from the packed file (layout in tools/peds/pack_folk.py)
function tfGeo(buf,r){const g=new THREE.BufferGeometry(),nv=r.nv,n=new Int8Array(buf,r.n,nv*4),N=new Float32Array(nv*3),k=new Uint8Array(buf,r.sk,nv*4),K=new Float32Array(nv*3);
  for(let i=0;i<nv;i++){N[3*i]=n[4*i]/127;N[3*i+1]=n[4*i+1]/127;N[3*i+2]=n[4*i+2]/127;K[3*i]=k[4*i];K[3*i+1]=k[4*i+1];K[3*i+2]=k[4*i+2]/255}
  g.setAttribute('position',new THREE.Float32BufferAttribute(Float32Array.from(new Int16Array(buf,r.p,nv*3),v=>v/1000),3));g.setAttribute('normal',new THREE.BufferAttribute(N,3));
  g.setAttribute('uv',new THREE.Float32BufferAttribute(Float32Array.from(new Uint16Array(buf,r.uv,nv*2),v=>v/65535),2));g.setAttribute('aSk',new THREE.BufferAttribute(K,3));
  g.setIndex(new THREE.BufferAttribute(r.u32?new Uint32Array(buf,r.i,r.ni):new Uint16Array(buf,r.i,r.ni),1));return g}
// one instanced mesh per character, each on its own material (its texture, its joints) sharing one shader; hair,
// eyebrows and glasses cut out of the texture
function tfMeshes(buf,lod,texDir){const cap=TF_N[3][0]+TF_N[3][1]+4+TF_ROOM_CAP;tf.M={};
  for(const c of tf.chars){const f=c.folk,J=f.joint,uJ={value:new THREE.Vector4(J.knee,J.hip,J.elbow,J.shoulder)};
    const mat=tfMat(uJ),g=tfGeo(buf,f[lod]),walk=new THREE.InstancedBufferAttribute(new Float32Array(cap*4),4);walk.setUsage(THREE.DynamicDrawUsage);g.setAttribute('aWalk',walk);
    const m=new THREE.InstancedMesh(g,mat,cap);m.count=0;m.frustumCulled=false;m.castShadow=!!gfxCur.pbr;m.receiveShadow=true;m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);m.visible=tf.on;
    scene.add(m);tf.M[c.id]={m,walk,n:0,cap,tex:texDir+c.id+'.webp'}}
  // the textured look's shader, built now in the background so the first picture to arrive doesn't stall a frame
  const c0=tf.chars[0];if(c0){const W=new THREE.InstancedMesh(tf.M[c0.id].m.geometry,tfMat({value:new THREE.Vector4()}),1),t=new THREE.DataTexture(new Uint8Array(4),1,1);
    t.colorSpace=THREE.SRGBColorSpace;t.needsUpdate=true;W.material.map=t;W.material.color.set(0xffffff);W.castShadow=!!gfxCur.pbr;gpuWarm(W)}}
function tfMat(uJ){const mat=new THREE.MeshStandardMaterial({roughness:0.86,envMap:skyEnv,envMapIntensity:0.5,alphaTest:0.5,side:THREE.DoubleSide,color:0x808080});
  mat.onBeforeCompile=sh=>{sh.uniforms.uJ=uJ;sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\n'+TF_GLSL)
    .replace('#include <beginnormal_vertex>','#include <beginnormal_vertex>\nvec3 pdP=position,pdN=objectNormal;pdSkin(pdP,pdN);objectNormal=pdN;')
    .replace('#include <begin_vertex>','#include <begin_vertex>\ntransformed=pdP;')};
  mat.customProgramCacheKey=()=>'townfolk2';return mat}
// a character's texture, the first time someone in town wears it
function tfTex(B){if(B.texing)return;B.texing=1;new THREE.TextureLoader().load(B.tex,t=>{t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;
  gpuUp([t]).then(()=>{const M=B.m.material;M.map=t;M.color.set(0xffffff);M.needsUpdate=true})},undefined,()=>{})}
// ---------- Human Forge (High and Ultra graphics, gfxCur.forge): the same 32 people rigged with a skeleton and real
// animation clips (models/people, from the human-forge repo; README "Townsfolk"), one GPU-skinned crowd per character
// in use. The runtime loads with the townsfolk (near town only); until it and a character's crowd are ready, or if
// either fails, that character draws on its old mesh. The crowds' clocks are never run (no forge.update): each person
// keeps their own clip time (p.ct), handed over as the clip's offset, since tfDraw packs whoever is in view every frame
const TF_FG_CLIPS=['walk','idle','talk','sit','drive','run','point','die_b','die_f','cower'];
function tfForge(){const F=tf.F||(tf.F={st:0});if(F.st||!gfxCur.forge)return;F.st=1;
  const go=()=>HumanForge.load(THREE,'models/people/').then(f=>{F.f=f;F.ref=f.library.anims.ref_pelvis||0.97;F.st=2}).catch(e=>{console.warn('townsfolk forge:',e);F.st=-1});
  if(window.HumanForge)return go();const s=document.createElement('script');s.src='models/people/human-forge.js';s.onload=go;s.onerror=()=>{F.st=-1};document.head.appendChild(s)}
// a character's crowd, the first time someone in view wears that look; the walk's ground speed scales with the
// person's size (the clip's own speed is a 6 ft person's)
function tfForgeCrowd(B,id){B.fg=1;const F=tf.F;
  F.f.preload(['island_'+id]).then(([t])=>{tfDieClips(t);return F.f.crowd('island_'+id,{max:B.cap,clips:TF_FG_CLIPS,lod:gfxCur.forge,castShadow:true,receiveShadow:true}).then(c=>{const m=c.object,M=m.material;
    M.roughness=0.86;M.envMap=skyEnv;M.envMapIntensity=0.5;m.castShadow=!!gfxCur.pbr;m.visible=false;c.stride=F.f.clips.walk.speed*c.type.hip/F.ref;c.runS=(F.f.clips.run||F.f.clips.walk).speed*c.type.hip/F.ref;scene.add(m);
      return gpuWarm(m).then(()=>{B.fg=c})})})
    .catch(e=>console.warn('townsfolk forge:',id,e))}
// person p as instance i of crowd c: walking (pace = their speed), sitting (the clip's origin is on the floor under the
// seat's middle, its seat 18 in up like the rooms' chairs and benches), driving (its seat 14 in up: lifted to where the
// old seated pose's seat was, 18 in over p.y), or standing easy or talking (staff and customers)
function tfFgClip(p,c,dt,hp,die){let k=die?die.k:p.cower>0&&!hp&&c.clips.cower?'cower':p.cop&&p.aim>0&&!hp&&c.clips.point?'point':hp&&(p.dead||p.hurt)?(hp.kneel?'sit':'idle'):p.drv?'drive':p.sit?'sit':p.spd>(p.fk==='walk'?0.15:0.3)?'walk':0;
  if(!k){if(p.fk!=='idle'&&p.fk!=='talk'||p.t>(p.tp??0)+1)p.tk=Math.random()<(p.room?p.spot.staff?0.5:0.35:0.06);p.tp=p.t;k=p.tk?'talk':'idle'}
  if(k==='walk'&&p.flee>0&&p.spd>2.2&&c.clips.run)k='run';
  const A=c.clips[k];if(k!==p.fk){p.fk=k;p.ct=k==='walk'||k==='run'?0.1:Math.random()*A.duration}
  if(die)p.ct=Math.min(A.duration-0.02,die.t);else if(k==='cower'||k==='point')p.ct=Math.min(A.duration-0.02,k==='point'?0.5:(p.ct||0)+dt);else if(!(p.dead||p.hurt))p.ct=(p.ct+dt*(k==='walk'?p.spd/(c.stride*p.sc):k==='run'?p.spd/(c.runS*p.sc):1))%A.duration;return k}
const TF_PL={x:0,y:0,z:0,heading:0,tilt:0,roll:0,scale:1};
function tfFgAt(p,hp,die){const o=TF_PL,f=p.sit&&!p.drv?0.05:0;o.scale=p.sc;
  if(hp){o.x=p.x;o.y=p.y+hp.dy-(hp.kneel&&!p.sit&&!die?0.32*p.sc:0);o.z=p.z;o.heading=hp.yaw;o.tilt=hp.tilt;o.roll=hp.roll}
  else{o.x=p.x+Math.sin(p.yaw)*f;o.y=p.y+(p.drv?0.1:0);o.z=p.z+Math.cos(p.yaw)*f;o.heading=p.yaw;o.tilt=o.roll=0}return o}
const tfDieFor=(p,c)=>p.dead&&!p.sit&&c.clips.die_b?tfDieOf(p):null;
function tfFgPose(p,c,i,dt){const hp=p.dead||p.hurt||p.hit?tfHitPose(p):null,die=tfDieFor(p,c),k=tfFgClip(p,c,dt,hp,die);c.place(i,tfFgAt(p,hp,die));c.anim(i,k,{offset:p.ct})}
// ---------- Ultra graphics close up (gfxCur.fgUltra, not phones): the few townsfolk nearest the camera, within
// TU.tfUltraR, swap from their crowd copy to a hero on their ultra mesh (Human Forge's ultra tier, ~100k triangles,
// fetched from R2 the first time). The hero takes the crowd copy's place, clip and clip time (p.ct) every frame, its
// mixer stepped to that time (no forge.update: that would run the crowds' clocks), so the swap does not show; the crowd
// copy is skipped while it shows. One hero loads at a time; idle ones wait in a pool (TF_UH_POOL), and the ultra meshes
// and maps of characters not seen lately are freed (TF_UH_KEEP), since each is ~60 MB on the GPU
const TF_UH_POOL=4,TF_UH_KEEP=4,_tfQ=new THREE.Quaternion(),_tfQ2=new THREE.Quaternion(),_tfE=new THREE.Euler(),_tfUp=new THREE.Vector3(0,1,0);
function tfUhOn(){return !!(gfxCur.fgUltra&&!PHONE&&tf.F&&tf.F.st===2)}
// who gets a hero this frame: the nearest few in view whose character's crowd is ready (a little farther for those who
// already have one, so nobody flickers at the edge)
function tfUhPick(cx,cz){const F=tf.F,U=F.uh||(F.uh={free:[],res:[],busy:0}),R=TU.tfUltraR||6,R2=(R+0.8)**2,n=gfxCur.fgUltra,c=[];
  for(const p of tf.people){if(p.inside)continue;const d2=(p.x-cx)**2+(p.z-cz)**2;if(d2>(p.uh?R2:R*R))continue;const B=tf.M[p.body];if(!B||!B.fg||B.fg===1||!tfSeen(p.x,p.z,1.3))continue;c.push([d2,p])}
  c.sort((a,b)=>a[0]-b[0]);const want=new Set(c.slice(0,n).map(a=>a[1]));
  for(const p of tf.people)if(p.uh&&!want.has(p))tfUhFree(p);for(const p of U.gone||[])if(p.uh&&tf.people.indexOf(p)<0)tfUhFree(p);U.gone=[...want];
  for(const p of want)if(!p.uh){const i=U.free.findIndex(h=>h.id==='island_'+p.body);if(i>=0){p.uh=U.free.splice(i,1)[0];tfUhUse(p.uh.id)}else if(!U.busy)tfUhLoad(p.body)}
  return want}
function tfUhUse(id){const U=tf.F.uh,i=U.res.indexOf(id);if(i>=0)U.res.splice(i,1);U.res.push(id)}
function tfUhLoad(body){const F=tf.F,U=F.uh,id='island_'+body;U.busy=1;tfUhUse(id);
  F.f.hero(id,{ultra:true,autoLod:false,castShadow:!!gfxCur.pbr,receiveShadow:true}).then(h=>{U.busy=0;if(!h.ultra){h.dispose();return}
    h.object.traverse(o=>{if(o.isMesh){const M=o.material;M.envMap=skyEnv;M.envMapIntensity=0.5;o.castShadow=!!gfxCur.pbr}});h.object.visible=false;scene.add(h.object);(U.types||(U.types={}))[id]=h.type;
    U.busy=1;return gpuWarm(h.object).then(()=>{U.busy=0;tfUhPool(h)})})
    .catch(e=>{U.busy=0;console.warn('townsfolk ultra:',id,e)})}
function tfUhFree(p){const h=p.uh;p.uh=null;h.object.visible=false;tfUhPool(h)}
// into the pool, dropping the oldest idle hero past TF_UH_POOL; then free the GPU copies of characters past TF_UH_KEEP
function tfUhPool(h){const U=tf.F.uh;U.free.push(h);while(U.free.length>TF_UH_POOL){const o=U.free.shift();o.dispose();o.object.traverse(m=>{if(m.isMesh)m.material.dispose()})}
  const live=new Set([...U.free.map(h=>h.id),...tf.people.filter(p=>p.uh).map(p=>p.uh.id)]);
  while(U.res.length>TF_UH_KEEP){const i=U.res.findIndex(id=>!live.has(id));if(i<0)break;const id=U.res.splice(i,1)[0],t=tf.F.f.library&&tfUhType(id);
    if(t&&t.ultra){const q=t.ultra;t.ultra=null;q.then(u=>{if(!u)return;u.geo.dispose();for(const x of [u.tex,u.normal,u.rough])if(x)x.dispose()})}}}
function tfUhType(id){const U=tf.F.uh;U.types=U.types||{};return U.types[id]}
// every hero back to the pool (graphics lowered, the town out of reach)
function tfUhOff(){for(const p of tf.people)if(p.uh)tfUhFree(p);for(const p of tf.F.uh.gone||[])if(p.uh)tfUhFree(p);tf.F.uh.gone=[]}
// person p on their hero: the crowd copy's clip, clip time and place (false, and back on the crowd, for a clip it lacks)
function tfUhPose(p,c,dt){const h=p.uh,hp=p.dead||p.hurt||p.hit?tfHitPose(p):null,die=tfDieFor(p,c),k=tfFgClip(p,c,dt,hp,die),o=tfFgAt(p,hp,die),g=h.object;
  _tfQ.setFromAxisAngle(_tfUp,o.heading);if(o.tilt||o.roll)_tfQ.multiply(_tfQ2.setFromEuler(_tfE.set(o.tilt,0,o.roll,'XYZ')));
  g.position.set(o.x,o.y,o.z);g.quaternion.copy(_tfQ);g.scale.setScalar(o.scale);
  const a=h.actions[k];if(!a){tfUhFree(p);return false}if(h.clip!==k)h.play(k,{fade:0});a.time=p.ct;h.mixer.update(0);h.lod('ultra');g.visible=tf.on;return true}
// a car model (a node of models/cars.glb, standing on y = 0, nose to +z) on the game's materials; its paint is set per
// car (tfCarPaint), its own:<name> materials keep the model's textures, and its wheels (wheel_* nodes, their origins at the hubs) turn about x. Each car holds the detailed
// model and its light one (<kind>_lo), and shows the light one past TF_CAR_HI (tfDraw)
function tfCarModel(k,hi,lo){const root=new THREE.Group();for(const o of [hi,lo]){o.position.set(0,0,0);o.rotation.set(0,0,0);root.add(o)}lo.visible=false;root.updateMatrixWorld(true);
  const box=new THREE.Box3().setFromObject(hi),sz=box.getSize(new THREE.Vector3());
  root.traverse(o=>{if(o.isMesh){const n=o.material.name;if(/^own:/.test(n)){o.material.envMap=skyEnv;o.material.envMapIntensity=0.8}else o.material=mdlMatOf(n);o.userData.paint=n==='carpaint';o.castShadow=!/^(tint|under|seat)$/.test(n);o.receiveShadow=true}
    if(/^wheel_/.test(o.name)){const t=o.children.find(c=>/_tire$/.test(c.name));t.geometry.computeBoundingBox();o.userData.q0=o.quaternion.clone();o.userData.r=t.geometry.boundingBox.max.y}});
  tf.cars[k]={g:root,len:sz.z,wid:sz.x-0.2}}
// a paint for a new car: picked by how common it is; clear-coated on High graphics
function tfCarPaint(u){const W=TF_PAINT.reduce((n,p)=>n+p[2],0);let r=(u??Math.random())*W,p=TF_PAINT[0];for(const q of TF_PAINT){r-=q[2];if(r<0){p=q;break}}
  const k=p[0]+'_'+!!gfxCur.pbr;tf.paint=tf.paint||{};if(tf.paint[k])return tf.paint[k];
  const o={color:p[0],metalness:p[1]?0.55:0.05,roughness:p[1]?0.32:0.28,envMap:skyEnv,envMapIntensity:1.1};
  return tf.paint[k]=gfxCur.pbr?new THREE.MeshPhysicalMaterial(Object.assign(o,{clearcoat:1,clearcoatRoughness:0.08})):new THREE.MeshStandardMaterial(o)}
// ---------- people ----------
// a person's look: the character least seen in town just now (children a third as often), a little taller or shorter;
// never one the owner left out (TU.tfOut, a bit per character), unless every one is; a driver is never a child
function tfOff(i){const m=TU.tfOut||0;return i<32&&Math.floor(m/2**i)%2===1}
function tfLook(adult){const C=tf.chars,all=C.every((c,i)=>tfOff(i));let best=0,bs=1e9;for(let i=0;i<C.length;i++){if(!all&&tfOff(i)||adult&&C[i].body==='k'&&C.some(c=>c.body!=='k'))continue;const sc=tf.use[i]*(C[i].body==='k'?3:1)+Math.random()*0.9;if(sc<bs){bs=sc;best=i}}
  const c=C[best];tf.use[best]++;return {ci:best,body:c.id,sc:0.97+Math.random()*0.06,g:0}}
function tfPerson(o){const p=Object.assign(tfLook(o&&o.drv),{x:0,z:0,y:0,yaw:0,ph:Math.random()*6,amp:0,spd:0,vt:TU.tfWalk*(0.82+Math.random()*0.32),side:0.32,wait:0,inside:0,blk:0,look:0},o);
  p.y=baseHeight(p.x,p.z)+tfLift(p.x,p.z);tf.people.push(p);return p}
// someone run down (tfRunOver): p.dead counts the seconds since; they go over backwards, flat in about 0.7 s
const tfFall=p=>p.dead?Math.min(1,(p.dead/0.7)**2)*Math.PI/2*0.97:0;
// how someone shot moves (pistol.js, gunHit; p.hit: k where, t seconds since, side +1 their right, fwd +1 shot from
// behind, ux/uz the shot's way): into o, the turn forward (tilt, + falls on their face), the roll (+ onto their right),
// the heading, the lift off the ground and whether their knees are bent (the seated pose); otherwise as tfFall
const TF_HP={tilt:0,roll:0,yaw:0,dy:0,kneel:0};
function tfHitPose(p){const o=TF_HP,H=p.hit;o.tilt=o.roll=o.dy=0;o.kneel=0;o.yaw=p.yaw;
  if(!H){if(p.dead){const f=tfFall(p);o.tilt=-f;o.dy=f*0.08;tfSettle(p,o,p.dead,0.7)}return o}
  const t=H.t,s=H.side,b=H.fwd,c=x=>Math.min(1,Math.max(0,x)),e=x=>x*x,m=x=>x*x*(3-2*x),Q=Math.PI/2*0.96;
  if(H.k==='head'){const a=c(t/0.18),f=e(c((t-0.12)/0.5));o.kneel=t<0.3?1:0;o.tilt=0.35*a+(Q-0.35)*f;o.roll=s*0.45*f;o.yaw+=s*0.35*f;o.dy=f*0.1}
  else if(H.k==='chest'){const a=m(c(t/0.42)),f=e(c((t-0.36)/0.55));o.tilt=b*(0.22*a+(Q-0.22)*f);o.yaw+=s*0.7*a;o.roll=-s*0.2*f;o.dy=f*0.08}
  else if(H.k==='gut'){const a=m(c(t/0.3)),k=c((t-0.75)/0.3),f=e(c((t-1.15)/0.5));o.kneel=t>0.75&&t<1.4?1:0;o.tilt=0.7*a+(Q-0.7)*f;o.roll=s*0.3*f;o.dy=-0.04*k*(1-f)+f*0.09}
  else if(H.k==='leg'){const a=m(c(t/0.22)),f=e(c((t-0.25)/0.45)),w=p.crawl?Math.sin(t*5)*0.05:0;o.kneel=t<0.4?1:0;o.roll=s*(0.35*a+(Q-0.35)*f)+w;o.tilt=0.25*f;o.dy=f*0.14}
  else if(H.k==='slump'){const a=m(c(t/0.4));o.kneel=1;o.tilt=0.55*a;o.roll=s*0.35*a}
  else if(H.k==='arm'){const a=Math.sin(Math.PI*c(t/0.5));o.yaw+=s*0.9*a;o.tilt=-0.15*a;o.roll=s*0.15*a}
  if(H.jolt>0){o.tilt+=H.jolt*0.3*Math.sin(t*40)}
  if(p.dead)tfSettle(p,o,H.t,TF_LAND[H.k]);
  return o}
// falling dead: how long each fall takes to reach the ground. tfSettle: as they land they bounce a little, then lie
// along the ground's slope (the head end up or down hill, worked out once as they land; a room's floor is flat)
const TF_LAND={head:0.62,chest:0.91,gut:1.65,leg:0.7};
function tfSettle(p,o,t,tl){if(!tl||t<tl)return;const u=t-tl,ax=Math.abs(o.tilt)>=Math.abs(o.roll)?'tilt':'roll',s=Math.sign(o[ax])||1;
  o[ax]-=s*0.1*Math.exp(-u*6)*Math.sin(u*16);
  if(p.slA===undefined){p.slA=0;p.slY=0;if(!p.room){const fx=Math.sin(o.yaw),fz=Math.cos(o.yaw),hx=ax==='tilt'?fx*s:-fz*s,hz=ax==='tilt'?fz*s:fx*s,L=1.6*p.sc,g=(x,z)=>surfAt(x,z)+tfLift(x,z),g0=g(p.x,p.z);
    p.slA=clamp(Math.atan2(g(p.x+hx*L,p.z+hz*L)-g0,L),-0.5,0.5);p.slY=Math.max(0,g(p.x+hx*L*0.5,p.z+hz*L*0.5)-g0-Math.sin(p.slA)*L*0.5);p.slX=ax}}
  o[p.slX||ax]-=s*p.slA*Math.min(1,u*4);o.dy+=p.slY}
// the dead on the old meshes: how limp (0 to 1, as they go down), negative when they lie on their face
function tfLimp(p){const H=p.hit,tl=H?TF_LAND[H.k]:0.7,t=H?H.t:p.dead,u=tl?Math.min(1,t/tl):1;return (tfDieOf(p).k==='die_f'?-1:1)*Math.max(0.001,u*u)}
// which fall (Human Forge): onto the back (die_b) or the face (die_f), and how far into it (s, the clip reaching the
// ground at 0.9 s as the body does)
function tfDieOf(p){const H=p.hit,o=tfDieOf.o||(tfDieOf.o={k:'',t:0});if(!H){o.k='die_b';o.t=p.dead*0.9/0.7;return o}
  o.k=H.k==='head'||H.k==='gut'||H.k==='chest'&&H.fwd>0?'die_f':'die_b';o.t=H.k==='leg'?p.dead:H.t*0.9/(TF_LAND[H.k]||0.9);return o}
// a third, cower: crouched low, hands over the head (people too frightened to run, pistol.js gunScare); pel lowers the
// hips by that much of their height.
// two clips made here for each character and baked with its others: the body goes limp as it falls (knees buckle, arms
// fly up and out, the head lolls) and settles sprawled, on its back (die_b: arms flung wide, a knee up, the head
// turned) or on its face (die_f: an arm up by the head, the other along the side, the face turned to one side). Each
// is a turn of the bones (a right-side bone's mirrored: + turns out, as on the left) from the idle clip's stance, about the body's own axes (x its left, y up, z ahead) taken in
// the bone's parent's frame, so a turned upper arm carries its forearm
const TF_DIE={cower:[[0,{}],[0.3,{pel:0.42,thigh:[-1.6,0,0.15],calf:[2.3,0,0],foot:[-0.55,0,0],spine_01:[0.3,0,0],spine_02:[0.35,0,0],neck_01:[0.55,0,0],upperarm:[-2.4,0,0.4],lowerarm:[-2.2,0,0]}],
    [0.8,{pel:0.43,thigh:[-1.6,0,0.15],calf:[2.3,0,0],foot:[-0.55,0,0],spine_01:[0.3,0,0],spine_02:[0.4,0,0],neck_01:[0.6,0,0],upperarm:[-2.4,0,0.45],lowerarm:[-2.25,0,0]}],
    [1.4,{pel:0.42,thigh:[-1.6,0,0.15],calf:[2.3,0,0],foot:[-0.55,0,0],spine_01:[0.3,0,0],spine_02:[0.35,0,0],neck_01:[0.55,0,0],upperarm:[-2.4,0,0.4],lowerarm:[-2.2,0,0]}]],
  die_b:[[0,{}],[0.22,{thigh:[-0.3,0,0],calf:[0.55,0,0],upperarm:[-0.5,0,0.5],lowerarm:[-0.4,0,0],neck_01:[0.25,0,0],spine_02:[0.15,0,0]}],
    [0.55,{thigh:[-0.25,0,0],calf:[0.4,0,0],upperarm:[-0.9,0,1.0],lowerarm:[-0.3,0,0],neck_01:[-0.35,0,0],spine_02:[-0.1,0,0]}],
    [0.9,{thigh_l:[-0.05,0,0.25],calf_l:[0.1,0,0],thigh_r:[-0.6,0,0.1],calf_r:[1.05,0,0],foot_l:[0,0.4,0],foot_r:[0,0.3,0],upperarm_l:[-0.2,0,1.5],upperarm_r:[-0.1,0,1.2],lowerarm_l:[-0.45,0,0],lowerarm_r:[-0.85,0,0],neck_01:[-0.25,0.2,0],head:[-0.1,0.45,0]}],
    [1.05,{thigh_l:[-0.08,0,0.22],calf_l:[0.15,0,0],thigh_r:[-0.68,0,0.1],calf_r:[1.15,0,0],foot_l:[0,0.4,0],foot_r:[0,0.3,0],upperarm_l:[-0.35,0,1.3],upperarm_r:[-0.25,0,1.05],lowerarm_l:[-0.6,0,0],lowerarm_r:[-1.0,0,0],neck_01:[-0.15,0.2,0],head:[-0.05,0.45,0]}],
    [1.35,{thigh_l:[-0.05,0,0.25],calf_l:[0.1,0,0],thigh_r:[-0.62,0,0.1],calf_r:[1.08,0,0],foot_l:[0,0.45,0],foot_r:[0,0.35,0],upperarm_l:[-0.25,0,1.42],upperarm_r:[-0.15,0,1.15],lowerarm_l:[-0.5,0,0],lowerarm_r:[-0.9,0,0],neck_01:[-0.22,0.2,0],head:[-0.1,0.5,0]}]],
  die_f:[[0,{}],[0.2,{thigh:[-0.5,0,0],calf:[1.0,0,0],upperarm:[-0.3,0,0.15],lowerarm:[-0.3,0,0],neck_01:[0.5,0,0],spine_02:[0.2,0,0]}],
    [0.55,{thigh:[-0.3,0,0],calf:[0.7,0,0],upperarm:[-0.9,0,0.4],lowerarm:[-0.4,0,0],neck_01:[0.2,0,0],spine_02:[0.1,0,0]}],
    [0.9,{thigh_l:[0,0,0.3],calf_l:[0.35,0,0],thigh_r:[0,0,0.08],calf_r:[0.05,0,0],foot_l:[0.4,0.3,0],foot_r:[0.5,0.2,0],upperarm_l:[-0.2,0,2.2],lowerarm_l:[-1.1,0,0],upperarm_r:[0.3,0,0.25],lowerarm_r:[-0.15,0,0],neck_01:[-0.1,-0.5,0],head:[0,-0.6,0]}],
    [1.05,{thigh_l:[-0.05,0,0.28],calf_l:[0.45,0,0],thigh_r:[-0.05,0,0.08],calf_r:[0.12,0,0],foot_l:[0.4,0.3,0],foot_r:[0.5,0.2,0],upperarm_l:[-0.35,0,2.0],lowerarm_l:[-1.25,0,0],upperarm_r:[0.15,0,0.35],lowerarm_r:[-0.3,0,0],neck_01:[-0.05,-0.5,0],head:[0,-0.6,0]}],
    [1.35,{thigh_l:[0,0,0.3],calf_l:[0.38,0,0],thigh_r:[0,0,0.08],calf_r:[0.06,0,0],foot_l:[0.4,0.3,0],foot_r:[0.5,0.2,0],upperarm_l:[-0.25,0,2.15],lowerarm_l:[-1.15,0,0],upperarm_r:[0.25,0,0.28],lowerarm_r:[-0.2,0,0],neck_01:[-0.1,-0.5,0],head:[0,-0.62,0]}]]};
function tfDieClips(t){if(!t||t.clips.some(c=>c.name==='die_b'))return;const idle=t.clips.find(c=>c.name==='idle');if(!idle)return;
  const by={},g=new THREE.Group(),bones=t.jointIdx.map(ni=>{const n=t.J.nodes[ni],b=new THREE.Bone();b.name=n.name;if(n.translation)b.position.fromArray(n.translation);if(n.rotation)b.quaternion.fromArray(n.rotation);by[ni]=b;return b});
  t.jointIdx.forEach(ni=>{const q=t.parent[ni];(by[q]||g).add(by[ni])});
  const mx=new THREE.AnimationMixer(g),a=mx.clipAction(idle);a.play();a.time=0.3;mx.update(0);g.updateMatrixWorld(true);
  const base=bones.map(b=>({b,q0:b.quaternion.clone(),P:b.parent.getWorldQuaternion(new THREE.Quaternion()),p0:b.position.clone()})),X=new THREE.Vector3(1,0,0),Y=new THREE.Vector3(0,1,0),Z=new THREE.Vector3(0,0,1);
  const q=new THREE.Quaternion(),D=new THREE.Quaternion(),Pi=new THREE.Quaternion();
  for(const name of ['die_b','die_f','cower']){const K=TF_DIE[name],times=K.map(k=>k[0]),tracks=[];
    for(const B of base){const n=B.b.name,side=/_l$/.test(n)?1:/_r$/.test(n)?-1:0,root=n.replace(/_[lr]$/,''),vals=[];
      for(const [,P] of K){const r=P[n]||P[root];q.copy(B.q0);
        if(r){const s=side||1;D.setFromAxisAngle(X,r[0]).multiply(q.clone().setFromAxisAngle(Y,r[1]*s)).multiply(q.clone().setFromAxisAngle(Z,r[2]*s));
          Pi.copy(B.P).invert();q.copy(Pi).multiply(D).multiply(B.P).multiply(B.q0)}
        vals.push(q.x,q.y,q.z,q.w)}
      tracks.push(new THREE.QuaternionKeyframeTrack(n+'.quaternion',times,vals));
      if(n==='pelvis')tracks.push(new THREE.VectorKeyframeTrack('pelvis.position',times,K.flatMap(([,P])=>[B.p0.x,B.p0.y*(1-(P.pel||0)),B.p0.z])))}
    t.clips.push(new THREE.AnimationClip(name,1.4,tracks))}}
// a step of it: knocked back a pace by a chest shot (half one by the gut), the leg-shot dragging themselves away
// from him on the ground, slowing to a stop; walls stop them
function tfHitStep(p,dt){const H=p.hit;H.t+=dt;if(H.jolt>0)H.jolt-=dt;if(H.k==='arm'&&H.t>0.6&&!p.dead){p.hit=null;return}
  let v=0,ux=H.ux,uz=H.uz;const l=Math.hypot(ux,uz)||1;ux/=l;uz/=l;
  if(H.k==='chest')v=H.t<0.42?1.6*(1-H.t/0.42):0;else if(H.k==='gut')v=H.t<0.3?0.9*(1-H.t/0.3):0;
  else if(H.k==='leg'&&p.hurt&&H.t>1.4&&H.t<14){p.crawl=1;v=0.22*(1-(H.t-1.4)/12.6);const dx=p.x-wk.x,dz=p.z-wk.z,d=Math.hypot(dx,dz)||1;ux=dx/d;uz=dz/d}else p.crawl=0;
  if(!v)return;const nx=p.x+ux*v*dt,nz=p.z+uz*v*dt;if(SOLIDS.some(s=>!s.foot&&solidOut(s,nx,nz,0.3)))return;
  p.x=nx;p.z=nz;p.y=baseHeight(nx,nz)+tfLift(nx,nz)}
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
  if(!(p.ghost>0))for(const q of tf.people)if(q!==p&&!q.inside&&!q.drv&&hit(q.x,q.z,0.25))return true;
  if(walker.visible&&mode==='walk'&&hit(wk.x,wk.z,0.3))return true;
  if(!(p.ghost>0))for(const c of tf.drive)if(c.v>0.3||c.st!=='park')for(const lz of [-1.4,0,1.4])if(hit(c.x+Math.sin(c.yaw)*lz,c.z+Math.cos(c.yaw)*lz,1.0))return true;
  return false}
// a crosswalk is clear to step onto: no car on it or at its edge, none headed over it that could not stop short of it
function tfXOk(w){const [mx,mz]=tfAt(w,w.len/2);for(const c of tf.drive){const ox=mx-c.x,oz=mz-c.z,d=Math.hypot(ox,oz);if(d<c.len/2+2.2)return false;
    if(c.v>0.6){const fx=Math.sin(c.yaw),fz=Math.cos(c.yaw),f=ox*fx+oz*fz;if(f>-c.len/2&&f<c.len/2+8+c.v*3.5&&Math.abs(ox*fz-oz*fx)<4)return false}}return true}
function tfWalkStep(p,dt){
  if(p.inside>0){p.inside-=dt;if(p.inside<=0){p.inside=0;if(p.car){p.path=tfLine(p.path.p.slice().reverse());p.s=0;p.back=true}}return}
  let dx,dz,x,z;
  if(p.path){if(p.s>=p.path.len){if(p.back){const c=p.car;c.boardT=1.2;c.ped=null;c.drv=p;Object.assign(p,{drv:c,sit:1,path:null,back:false});tfDriverPlace(c);return}p.inside=15+Math.random()*50;p.spd=0;return}
    [x,z,dx,dz]=tfAt(p.path,p.s)}
  else{const w=p.w,[ax,az,ex,ez]=tfAt(w,p.s);dx=ex*p.dir;dz=ez*p.dir;x=ax-dz*p.side;z=az+dx*p.side;
    // at a walk's end: on to another (round the corner, over a crosswalk, into the store) or turn back
    if(p.dir>0&&p.s>=w.len||p.dir<0&&p.s<=0){const n=p.dir>0?w.b:w.a;if(n.door&&!p.wait){p.inside=8+Math.random()*30;p.x=n.x;p.z=n.z}tfPick(p,n,w);return}
    // now and then a look in a shop window (the shops face the street: away from it)
    if(!w.x&&p.wait<=0&&Math.random()<dt*0.035&&(Math.abs(x)>MSX-0.6&&Math.abs(x)<MSX+0.7&&z<724||Math.abs(Math.abs(z-MST.cz)-5.15)<0.7)){p.wait=3+Math.random()*6;
      p.look=Math.abs(z-MST.cz)<6&&Math.abs(x)>MSX+1?(z<MST.cz?N_:S_):(x<0?W_:E_)}
    p.xw=false;if(w.x&&!p.xok&&(p.dir>0?p.s<0.6:p.s>w.len-0.6)){if(tfXOk(w))p.xok=true;else{p.spd=0;p.xw=true;p.amp+=(0-p.amp)*Math.min(1,dt*6);return}}
    // at a side street's mouth (SUB_APRONS, suburbs.js) with a car turning in or out: wait at its edge
    if(!w.x)for(const A of SUB_APRONS){const ox=A[0]-x;if(Math.abs(ox)<4.6&&Math.abs(ox)>3.1&&ox*dx>0&&z>A[1]-0.6&&z<A[2]+0.6&&
      tf.drive.some(c=>c.v>0.3&&Math.abs(c.x-A[0])<9&&Math.abs(c.z-(A[1]+A[2])/2)<10)){p.spd=0;p.amp+=(0-p.amp)*Math.min(1,dt*6);return}}}
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
// the driver's seat of each kind (tools/models/cars.js; the wheel on the left, +x): how far forward of the car's middle,
// and the seated driver's height above the ground (low in the seat, the head clear of the roof)
const TF_SEAT={sedan:[0.38,0.18],hatch:[0.3,0.2],wagon:[0.38,0.18],suv:[0.35,0.32],minivan:[1.0,0.32],pickup:[0.55,0.38],van:[1.2,0.4]},TF_SEAT_X=0.37;
// the trips through town without stopping, from each entry: on along the cross street, or turning onto Main Street for the
// beach road (or up from the beach road onto the cross street); and round the neighbourhoods (L, keeping off the four-way
// stop): west, down the street at x -107, along z 700 and back up x -63 and out west; east, down x 107, along z 734 and
// up x 160 to its end in the woods (SUB_STREETS, suburbs.js: their lanes 1.5 m either side of the middle)
const TF_THRU={E:{W:[[13.1,650.25,W_,'s'],[-140,650.25,W_],[-146,650.25,W_]],B:[...TF_RT_N,[2,639,N_],...TF_OUT_N.B],
    L:[[112,650.25,W_],[105.5,660,S_],[105.5,727,S_],[112,735.5,E_],[153,735.5,E_],[161.5,727,N_],[161.5,624,N_]]},
  W:{E:[[-13.1,653.75,E_,'s'],[140,653.75,E_],[146,653.75,E_]],B:[[-13.1,653.75,E_,'s'],[2,642,N_],...TF_OUT_N.B],
    L:[[-113,653.75,E_],[-108.5,659,S_],[-108.5,694,S_],[-102,701.5,E_],[-68,701.5,E_],[-61.5,695,N_],[-61.5,659,N_],[-67,650.25,W_],[-140,650.25,W_],[-146,650.25,W_]]},
  B:{E:[[-8,575.25,E_],...TF_OUT_S.E],W:[[-8,575.25,E_],...TF_OUT_S.W]}};
function tfSpawnCar(){const ks=Object.keys(tf.cars);if(!ks.length)return;const ends=['E','W','B'].filter(k=>{const [x,z]=TF_IN[k][0];return (!tfSeen(x,z,3)||Math.hypot(x-camera.position.x,z-camera.position.z)>110)&&
    !tf.drive.some(c=>Math.hypot(c.x-x,c.z-z)<c.len+6)});
  // (and clear of any car still pulling away from it, so two never start inside each other)
  // (the rest only pass through: all of them once a third of the cars, or every stall, are parking)
  const free=TF_STALLS.filter(s=>!s.car);if(!ends.length)return;
  // (and while the four-way stop is backed up, only trips round the neighbourhoods, which keep off it)
  const jam=tf.drive.filter(q=>q.st!=='park'&&q.v<0.3&&Math.abs(q.x)<40&&Math.abs(q.z-MST.cz)<40).length>=4,
    from=ends[(Math.random()*ends.length)|0],mar=free.filter(s=>s.k==='mar');if(jam&&from==='B')return;
  const thru=jam||!free.length||tf.drive.filter(c=>c.S).length>=TF_N[tf.q][1]/3||Math.random()<0.25,pick=Math.random()<0.55?free.filter(s=>s.k==='st'):mar,
    S=thru?null:(pick.length?pick:free)[(Math.random()*(pick.length?pick:free).length)|0],tos=Object.keys(TF_THRU[from]).filter(k=>k!=='L'),to=TF_THRU[from].L&&(jam||Math.random()<0.55)?'L':tos[(Math.random()*tos.length)|0];
  let r=Math.random()*ks.reduce((n,k)=>n+TF_CARS[k],0),k=ks[0];for(const q of ks){r-=TF_CARS[q];if(r<0){k=q;break}}
  const M=tf.cars[k],g=M.g.clone(true),paint=tfCarPaint();scene.add(g);const wheels=[];g.traverse(o=>{if(o.userData.q0){o.userData.q0=o.quaternion.clone();wheels.push(o)}if(o.userData.paint)o.material=paint});
  // (a clone's userData is a JSON copy, so each wheel's rest turn is taken again from its own quaternion)
  const c={k,g,wheels,len:M.len,wid:M.wid,S,path:S?tfPath(tfArrive(from,S),true):tfPath([...TF_IN[from],...TF_THRU[from][to]],false),s:0,i:0,v:8,yaw:0,x:0,z:0,st:S?'in':'out',si:0,wait:0,arr:0,stuck:0,rot:0,yld:0};
  if(S)S.car=c;tf.drive.push(c);c.drv=tfPerson({drv:c,car:c,sit:1});tfCarPlace(c)}
function tfCarDrop(c){scene.remove(c.g);if(c.S&&c.S.car===c)c.S.car=null;tf.drive.splice(tf.drive.indexOf(c),1);if(c.ped)tfDrop(c.ped);if(c.drv)tfDrop(c.drv)}
// the driver in the seat, sitting, facing the way the car faces
function tfDriverPlace(c){const p=c.drv,[sz,sy]=TF_SEAT[c.k]||TF_SEAT.sedan,h=c.yaw,k=Math.cos(h),n=Math.sin(h);
  p.x=c.x+k*TF_SEAT_X+n*sz;p.z=c.z-n*TF_SEAT_X+k*sz;p.y=c.g.position.y+sy;p.yaw=h;p.amp=0}
function tfCarPlace(c){const P=c.path;while(c.i<P.n-2&&P.S[c.i+1]<c.s)c.i++;const i=c.i,t=Math.min(1,Math.max(0,(c.s-P.S[i])/((P.S[i+1]-P.S[i])||1)));
  c.x=P.X[i]+(P.X[i+1]-P.X[i])*t;c.z=P.Z[i]+(P.Z[i+1]-P.Z[i])*t;const h=P.F[i]+Math.atan2(Math.sin(P.F[i+1]-P.F[i]),Math.cos(P.F[i+1]-P.F[i]))*t;c.yaw=h;
  const f=c.len*0.36,sy=Math.sin(h),cy=Math.cos(h),ax=c.x+sy*f,az=c.z+cy*f,bx=c.x-sy*f,bz=c.z-cy*f,yf=baseHeight(ax,az)+Math.max(0.04,raiseAt(ax,az)),yb=baseHeight(bx,bz)+Math.max(0.04,raiseAt(bx,bz));
  c.g.position.set(c.x,(yf+yb)/2,c.z);c.g.rotation.set(0,0,0);c.g.rotateY(h);c.g.rotateX(-Math.atan2(yf-yb,2*f));if(c.drv)tfDriverPlace(c)}
// the way ahead clear? the slowest speed it allows (people, the worker, machines, other cars; looking along the path)
function tfCarAhead(c){const P=c.path,rev=P.R[Math.min(P.n-1,c.i+1)],j=Math.min(P.n-1,c.i+(rev?4:10)),ax=P.X[j]-c.x,az=P.Z[j]-c.z,al=Math.hypot(ax,az)||1,dx=ax/al,dz=az/al,rx=-dz,rz=dx,
    reach=3+c.v*1.6,half=c.len/2;let lim=1e9;
  // (by: the car that holds it up most, if a car does)
  const see=(x,z,r,q)=>{const ox=x-c.x,oz=z-c.z,f=ox*dx+oz*dz;if(f<=0||f>half+reach+r||Math.abs(ox*rx+oz*rz)>c.wid/2+0.25+r)return;const l=Math.sqrt(2*4*Math.max(0,f-half-r-1.1));if(l<lim){lim=l;c.by=q||null}};c.by=null;
  // (anyone waiting at the curb to cross is waiting for it; held up long by someone who will not move, it edges on)
  // (and someone on a crosswalk ahead, or waiting at its curb: stop at its yield line and let them over; for someone
  // waiting, a few seconds at most, and not once in the four-way stop's junction, which it must clear)
  if(c.stuck>8)lim=1;else for(const p of tf.people){if(p.inside||p.drv||p.room)continue;if(!p.xw)see(p.x,p.z,0.3);
    if(rev||!p.w||!p.w.x||!p.xw&&!p.xok)continue;const [mx,mz]=tfAt(p.w,p.w.len/2),fx=Math.sin(c.yaw),fz=Math.cos(c.yaw),ox=mx-c.x,oz=mz-c.z,f=ox*fx+oz*fz;
    if(f>half+(p.xw?3.2:1.6)&&f<half+25&&Math.abs(ox*fz-oz*fx)<3){if(p.xw){c.yw=1;if(c.yld>=4||Math.abs(c.x)<9&&Math.abs(c.z-MST.cz)<9)continue}const l=Math.sqrt(2*3*Math.max(0,f-half-3.2));if(l<lim){lim=l;c.by=null}}}
  if(walker.visible&&mode==='walk')see(wk.x,wk.z,0.35);
  for(const k in WK_RIDES){const R=WK_RIDES[k],o=R.o;if(!o||!R.c)continue;if(Math.abs(o.x-c.x)>30||Math.abs(o.z-c.z)>30)continue;for(const lz of R.c)see(o.x+Math.sin(o.yaw)*lz,o.z+Math.cos(o.yaw)*lz,R.r)}
  // (an oncoming car only when right in its path: lanes pass close on the bends; two held up by each other where their
  // ways cross: the first in the list goes)
  // (held up over 20 s by other cars, which can only be a knot of them: it eases on through them a few seconds)
  if(c.stuck>20)c.gh=3;if(!(c.gh>0))for(const q of tf.drive)if(q!==c){const on=Math.sin(q.yaw)*dx+Math.cos(q.yaw)*dz<-0.5&&q.st!=='park';if(c.ign===q){if(Math.hypot(q.x-c.x,q.z-c.z)>9)c.ign=null;else continue}
    if(on&&c.stuck>4||c.stuck>6&&q.stuck>6&&tf.drive.indexOf(c)<tf.drive.indexOf(q)){c.ign=q;continue}for(const lz of [-q.len*0.3,0,q.len*0.3])see(q.x+Math.sin(q.yaw)*lz,q.z+Math.cos(q.yaw)*lz,on?0.2:1.0,q)}
  return lim}
// the four-way stop: its turn once it has stopped a moment, no other car is in the junction and nobody stopped before it is waiting
// (the cars given their turn hold the junction until they have gone in and out again, two let go in the same moment
// would meet; but a car may go with those coming the other way when neither turns left)
const tfInJ=q=>Math.abs(q.x)<7.5&&Math.abs(q.z-MST.cz)<7;
// a car's way over the junction from its stop sign: the heading it comes in on, and whether it turns left
function tfMove(c){const P=c.path,i=P.stop[c.si].i,j=Math.min(P.n-1,i+44),d=P.H[j]-P.H[i];return {h:P.H[i],left:Math.atan2(Math.sin(d),Math.cos(d))>0.6}}
function tfMyTurn(c){if(c.wait<1.2)return false;const m=tfMove(c),
    ok=q=>{const n=q.atSign?tfMove(q):q.mv;if(!n||n.left||m.left)return false;const d=n.h-m.h;return Math.abs(Math.atan2(Math.sin(d),Math.cos(d)))>2.6};
  tf.jset=(tf.jset||[]).filter(q=>tf.drive.includes(q)&&(tf.t-q.jt<2.5||tfInJ(q)));
  for(const q of tf.jset)if(q!==c&&!ok(q))return false;
  for(const q of tf.drive)if(q!==c){if(tfInJ(q)&&!tf.jset.includes(q))return false;if(q.atSign&&q.wait>=1.2&&(q.arr<c.arr||q.arr===c.arr&&tf.drive.indexOf(q)<tf.drive.indexOf(c))&&!ok(q))return false}
  c.mv=m;c.jt=tf.t;tf.jset.push(c);return true}
function tfCarStep(c,dt){const P=c.path;
  if(c.wreck){c.v=Math.max(0,c.v-4*dt);c.s=Math.min(P.len,c.s+c.v*dt);tfCarPlace(c);if(c.drv&&tf.people.includes(c.drv))tfDriverPlace(c);else if((c.wreckT=(c.wreckT||0)+dt)>30&&!tfSeen(c.x,c.z,3))tfCarDrop(c);return}
  if(c.st==='park'){if(c.boardT>0){c.boardT-=dt;if(c.boardT<=0){c.boardT=0;const to=['E','W','B'][(Math.random()*3)|0];c.path=tfPath(tfLeave(c.S,to),false);c.s=0;c.i=0;c.si=0;c.st='out';c.S.car=null}}return}
  const nx=P.stop[c.si];let vt=P.V[Math.min(P.n-1,c.i+1)];c.atSign=false;
  if(P.park){const d=P.len-c.s;vt=Math.min(vt,Math.sqrt(2*2.2*Math.max(0,d))+(d>0.03?0.2:0))}
  if(nx){const d=P.S[nx.i]-c.s;vt=Math.min(vt,Math.sqrt(2*3*Math.max(0,d-0.05)));
    if(d<0.35&&c.v<0.25){if(!c.wait)c.arr=tf.t;c.wait+=dt;c.atSign=!!nx.sign;
      if(nx.cusp?c.wait>0.8:tfMyTurn(c)){c.si++;c.wait=0;c.atSign=false;c.s=P.S[nx.i]+0.02}else vt=0}}
  c.yw=0;const lim=tfCarAhead(c);vt=Math.min(vt,lim);c.yld=c.yw?c.yld+(c.v<0.3?dt:0):0;
  // stuck: held up by people, the worker, a machine, or cars in a knot; not when queued behind cars that are going,
  // waiting at the stop sign or letting people over. qd: how many cars back in such a queue (worked out along it
  // frame by frame; round a knot it only grows)
  const B=c.by;c.qd=lim>=0.3?0:!B?(c.yw?0:1e9):B.atSign||B.yw||B.v>0.3?1:(B.qd??1e9)+1;c.stuck=vt<0.3&&!c.atSign&&c.qd>25?c.stuck+dt:0;
  c.v+=Math.max(-5*dt,Math.min(2*dt,vt-c.v));if(c.v<0.02&&vt<0.02)c.v=0;
  c.s=Math.min(P.len,c.s+c.v*dt);tfCarPlace(c);c.rot+=c.v*dt*(P.R[c.i+1]?-1:1);
  for(const w of c.wheels){w.quaternion.setFromAxisAngle(WK_X,c.rot/(w.userData.r||0.35)).multiply(w.userData.q0)}
  if(c.s>=P.len-0.05&&(c.v<0.1||!P.park)){
    if(P.park){c.st='park';c.v=0;const s=Math.sin(c.yaw),k=Math.cos(c.yaw),lx=k*(c.wid/2+0.4),lz=-s*(c.wid/2+0.4),x=c.x+lx+s*0.4,z=c.z+lz+k*0.4,
        door=c.S.k==='st'?TF_DOOR:c.S.x>=80?[93,577.7]:[46,579.3],mid=c.S.k==='st'?[x,741.4]:[x,581.3];
      const p=c.drv;c.drv=null;Object.assign(p,{drv:null,sit:0,path:tfLine([[x,z],mid,door]),s:0,x,z,yaw:c.yaw+Math.PI/2,spd:0,back:false,inside:0});
      p.y=baseHeight(x,z)+tfLift(x,z);c.ped=p}
    else tfCarDrop(c)}
  // a car stuck a long while (blocked in) gives up once nobody is looking, or after a minute and a half anyway
  else if(c.stuck>40&&!tfSeen(c.x,c.z,3)||c.stuck>90)tfCarDrop(c);if(c.gh>0)c.gh-=dt}
// ---------- the people in the rooms: staff at their posts, customers browsing, queueing, sitting at tables ----------
// a room within TF_RNEAR of the camera fills to its staff and customers (its big counts, or TF_RN beside its staff),
// each on a spot of their own; past TF_RFAR it empties. Now and then a customer goes (when nobody is looking) and
// someone else comes to another spot; a spot with a path (a waiter, a bartender, a shopper) is walked round and round,
// along lines clear of the furniture
function tfRoomsTick(){const cx=camera.position.x,cz=camera.position.z;let n=tf.people.reduce((k,p)=>k+(p.room?1:0),0);
  for(const R of TF_ROOMS){const d=Math.hypot(R.x-cx,R.z-cz)-R.r;
    if(d>TF_RFAR){if(R.n)for(const p of tf.people.slice())if(p.room===R)tfDrop(p);continue}
    if(d>TF_RNEAR&&!R.n)continue;const staff=R.spots.filter(sp=>sp.staff).length,want=Math.min(R.spots.length,staff+(R.big?R.big[tf.q]:TF_RN[tf.q]));
    while(R.n<want&&n<Math.min(TF_ROOM_CAP,tfShopLeft())){const free=R.spots.filter(sp=>!sp.who),st=free.filter(sp=>sp.staff),sp=st.length?st[0]:free[(Math.random()*free.length)|0];if(!sp)break;
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
// ---------- the cars parked in the neighbourhoods' driveways and at their curbs (TF_PARKED, suburbs.js) ----------
// each always the same kind and colour; solid while shown (they come and go with the townsfolk)
const TF_CAR_HI=45;
function tfParkedShow(on){if(on===tf.parkedOn)return;tf.parkedOn=on;const ks=Object.keys(TF_CARS);
  if(on&&!tf.parked.length&&tf.carsOk&&ks.every(k=>tf.cars[k]))TF_PARKED.forEach((P,i)=>{const h=hash(P.x*0.37+1.3,P.z*0.71-0.4),k=P.k||ks[Math.floor(h*ks.length)%ks.length],M=tf.cars[k],g=M.g.clone(true);
    g.traverse(o=>{if(o.userData.paint)o.material=tfCarPaint(hash(P.z*0.53,P.x*0.29+2.2))});g.position.set(P.x,P.y,P.z);g.rotation.y=P.yaw;scene.add(g);
    const c=Math.abs(Math.cos(P.yaw)),s=Math.abs(Math.sin(P.yaw));tf.parked.push({g,x:P.x,z:P.z,sol:{x:P.x,z:P.z,hx:(s*M.len+c*M.wid)/2,hz:(c*M.len+s*M.wid)/2}})});
  if(on&&!tf.parked.length){tf.parkedOn=false;return}
  for(const c of tf.parked){c.g.visible=on;const i=SOLIDS.indexOf(c.sol);if(on&&i<0)SOLIDS.push(c.sol);else if(!on&&i>=0)SOLIDS.splice(i,1)}}
// ---------- each frame ----------
function tfTick(dt){if(!tf.q){if(tf.on)tfShow(false);return}
  const cx=camera.position.x,cz=camera.position.z,B=TF_BOX,dd=Math.hypot(Math.max(B[0]-cx,0,cx-B[1]),Math.max(B[2]-cz,0,cz-B[3]));
  if(dd>TF_NEAR){if(tf.on)tfShow(false);return}
  if(!tf.load)tfLoad();if(tf.load!==2)return;if(gfxCur.forge&&!(tf.F&&tf.F.st))tfForge();
  dt=Math.min(dt,0.1);tf.t+=dt;camera.updateMatrixWorld();tf.fm.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);tf.fr.setFromProjectionMatrix(tf.fm);
  const night=typeof dn==='object'?Math.min(1,Math.max(0.3,(dn.el+8)/14)):1,[np,nc]=TF_N[tf.q],left=tfLeft(),wantP=Math.min(left,Math.round(np*night)),wantC=Math.min(Math.max(0,left-wantP),Math.round(nc*night)),walkers=tf.people.filter(p=>!p.car&&!p.room);
  if(!tf.on){tfShow(true);while(walkers.length<wantP){const p=tfSpawnWalker(true);if(!p)break;walkers.push(p)}}
  tf.spawnT-=dt;if(tf.spawnT<=0){tf.spawnT=1.5+Math.random()*2;
    if(walkers.length<wantP)tfSpawnWalker(false);
    else if(walkers.length>wantP){const p=walkers.find(p=>p.inside||!tfSeen(p.x,p.z,1));if(p)tfDrop(p)}
    if(tf.carsOk&&tf.drive.reduce((n,c)=>n+(c.st==='park'?0.5:1),0)<wantC&&Object.keys(tf.cars).length>=3&&Math.random()<0.5)tfSpawnCar()}
  for(const c of tf.drive.slice())tfCarStep(c,dt);
  tfRunOver(dt);
  tfRoomsTick();if(!tf.parkedOn&&tf.carsOk&&Object.keys(tf.cars).length===Object.keys(TF_CARS).length)tfParkedShow(true);
  for(const p of tf.people.slice()){if(p.hit)tfHitStep(p,dt);if(p.hurt&&!p.dead)p.hurt+=dt;
    if(p.dead||p.hurt){const t=p.dead||p.hurt;if(p.dead)p.dead+=dt;if(p.fly)tfFly(p,dt);if(t>TU.gunBody&&(!tfSeen(p.x,p.z,1)||t>TU.gunBody*3))tfDrop(p);continue}if(p.cower>0){p.cower=Math.max(0,p.cower-dt);continue}if(p.room){tfRoomStep(p,dt);continue}if(p.drv||p.cop)continue;tfWalkStep(p,dt);p.y+=(baseHeight(p.x,p.z)+tfLift(p.x,p.z)-p.y)*Math.min(1,dt*8)}
  if(mode==='walk'&&walker.visible){for(const c of tf.drive)wkPushRound(c,[-c.len*0.3,0,c.len*0.3],c.wid/2);for(const p of tf.people)if(!p.inside&&!p.drv&&!p.dead&&!p.hurt)wkPushRound(p,[0],0.22)}
  tfDraw(dt);tfChip(dt)}
function tfShow(on){tf.on=on;$('#tfChip').hidden=!on||PHONE;for(const k in tf.M||{})tf.M[k].m.visible=on;for(const c of tf.drive)c.g.visible=on;tfParkedShow(on);
  if(!on){if(tf.F&&tf.F.uh)tfUhOff();for(const k in tf.M||{}){const c=tf.M[k].fg;if(c&&c.object)c.object.visible=false}for(const c of tf.drive.slice())tfCarDrop(c);for(const p of tf.people.slice())tfDrop(p)}}
function tfDraw(dt){const M=tf.M,o3=tf.o,cx=camera.position.x,cz=camera.position.z,fo=tf.F&&tf.F.st===2&&!!gfxCur.forge;for(const k in M)M[k].n=M[k].fn=0;
  const uh=fo&&tfUhOn()?tfUhPick(cx,cz):null;if(!uh&&tf.F&&tf.F.uh)tfUhOff();
  for(const p of tf.people){if(p.inside)continue;const B=M[p.body];if(!B||B.n>=B.cap)continue;
    if((p.x-cx)**2+(p.z-cz)**2>(p.room?TF_RFAR*TF_RFAR:p.drv?TF_CAR_HI*TF_CAR_HI:220*220)||!tfSeen(p.x,p.z,1.3))continue;
    const hp=p.dead||p.hurt||p.hit?tfHitPose(p):null,kn=hp&&hp.kneel||!hp&&p.cower>0;o3.position.set(p.x,p.y+(p.sit||kn?-0.42*p.sc:Math.abs(Math.cos(p.ph))*0.025*p.amp*p.sc),p.z);
    if(hp){o3.rotation.set(hp.tilt,hp.yaw,hp.roll,'YXZ');o3.position.y+=hp.dy}else o3.rotation.set(0,p.yaw,0,'YXZ');o3.scale.setScalar(p.sc);o3.updateMatrix();
    if(fo){if(!B.fg)tfForgeCrowd(B,p.body);if(B.fg!==1){if(!p.uh)tfFgPose(p,B.fg,B.fn++,dt);else if(!tfUhPose(p,B.fg,dt))tfFgPose(p,B.fg,B.fn++,0);continue}}
    if(!B.texing)tfTex(B);const i=B.n++,w=B.walk.array;B.m.setMatrixAt(i,o3.matrix);w[4*i]=p.ph;const lp=p.dead&&!p.sit?tfLimp(p):0;w[4*i+1]=(kn&&!lp)||p.sit&&!(p.dead||p.hurt)?-1:p.dead||p.hurt?0:p.amp;w[4*i+2]=lp;w[4*i+3]=p.g}
  for(const k in M){const B=M[k];B.m.count=B.n;B.m.visible=tf.on&&B.n>0;B.m.instanceMatrix.needsUpdate=true;B.walk.needsUpdate=true;
    const c=B.fg;if(c&&c.object){c.object.count=B.fn;c.object.visible=fo&&tf.on&&B.fn>0}}
  for(const c of [...tf.drive,...tf.parked]){const d2=(c.x-cx)**2+(c.z-cz)**2;c.g.visible=d2<400*400;const hi=d2<TF_CAR_HI*TF_CAR_HI;c.g.children[0].visible=hi;c.g.children[1].visible=!hi}}
// ---------- run over ----------
// whatever machine he is driving: going faster than TU.runKill it knocks anyone it touches flying (counted in tf.runs),
// slower than that they jump out of its way; the people round about run off either way
const tfRun={x:0,z:0,k:null};
function tfRunOver(dt){const k=mode==='walk'?null:rideOf(mode),R=k&&WK_RIDES[k];if(!R){tfRun.k=null;return}
  const o=R.o,dx=o.x-tfRun.x,dz=o.z-tfRun.z,same=tfRun.k===k;Object.assign(tfRun,{x:o.x,z:o.z,k});
  const d=Math.hypot(dx,dz);if(!same||d>5||dt<=0)return;const v=d/dt,sy=Math.sin(o.yaw),cy=Math.cos(o.yaw);
  for(const p of tf.people){if(p.dead||p.inside||p.drv||p.room)continue;
    let hit=false;for(const lz of R.c)if(Math.hypot(p.x-o.x-sy*lz,p.z-o.z-cy*lz)<R.r+0.25){hit=true;break}
    if(!hit)continue;
    if(v<TU.runKill/2.237){if(typeof gunRun==='function')gunRun(p,4);continue}
    // thrown along the way it was going and a little off to the side they were on, higher the faster it was
    const ux=dx/d,uz=dz/d,sd=Math.sign((p.x-o.x)*uz-(p.z-o.z)*ux)||1,f=Math.min(v,25);
    Object.assign(p,{dead:1e-3,sit:0,wait:0,spd:0,amp:0,flee:0,yaw:Math.atan2(o.x-p.x,o.z-p.z),
      fly:{vx:ux*f*0.9+uz*sd*f*0.25,vz:uz*f*0.9-ux*sd*f*0.25,vy:Math.min(7,1.2+f*0.3)}});if(p.vt0){p.vt=p.vt0;p.vt0=0}
    dustPuff(p.x,p.y+0.4,p.z,4,[-0.55,-1.05,-1]);tf.runs=(tf.runs||0)+1;if(typeof gunScare==='function')gunScare(p.x,p.z,p)}}
// a body in the air: falls under gravity, then slides to a stop on the ground (walls stop it)
function tfFly(p,dt){const F=p.fly,g=baseHeight(p.x,p.z)+tfLift(p.x,p.z),nx=p.x+F.vx*dt,nz=p.z+F.vz*dt;
  if(SOLIDS.some(s=>!s.foot&&Math.abs(nx-s.x)<s.hx+0.2&&Math.abs(nz-s.z)<s.hz+0.2)){F.vx*=-0.25;F.vz*=-0.25}else{p.x=nx;p.z=nz}
  F.vy-=9.8*dt;p.y+=F.vy*dt;
  if(p.y<=g){p.y=g;F.vy=Math.abs(F.vy)>2?-F.vy*0.3:0;const s=Math.hypot(F.vx,F.vz),k=s>0?Math.max(0,s-7*dt)/s:0;F.vx*=k;F.vz*=k;
    if(!F.vy&&s<0.05)p.fly=null}}
// the town's people: TU.townPop of them each time the game starts, less everyone he has killed since (they do not come
// back, so the crowd about town thins out as it falls)
function tfLeft(){return Math.max(0,Math.round(TU.townPop)-(typeof gun==='object'?gun.downs:0)+(tf.shopKills||0)-(tf.runs||0))}
// the same for the people in the shops and houses (TU.shopPop, less those shot indoors, tf.shopKills from pistol.js)
function tfShopLeft(){return Math.max(0,Math.round(TU.shopPop)-(tf.shopKills||0))}
// the count in the corner (desktop, in town): how many townsfolk are left, and how many he has shot and run down
function tfChip(dt){if(PHONE)return;tf.chipT=(tf.chipT||0)-dt;if(tf.chipT>0)return;tf.chipT=0.25;
  const shot=typeof gun==='object'?gun.downs:0,run=tf.runs||0;
  $('#tfChipVal').textContent=tfLeft();$('#tfShopVal').textContent=tfShopLeft();$('#tfChipShot').textContent=shot;$('#tfChipRun').textContent=run;$('#tfChipDead').textContent=shot+run}
