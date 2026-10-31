// Corley's Island: the detailed excavator, built from shapes and written out as models/excavator.glb by
// tools/build_model.js (which runs this in headless Chromium with three.js r147). The game loads that file (js/models.js).
// The contract with the game, so a model made in Blender or bought can replace this one:
// - one node per moving part, named machine (tracks and car body), house (turns), cab, boom, stick and bucket, each
//   at the origin, its meshes already placed in that part's own frame exactly as excavator.js lays the parts out
//   (house 0.85 m up, cab at house (-0.72, 0.85, 0.4), boom pin at house (0.42, 1.0, 0.95), stick pin 5.7 m along
//   the boom, bucket pin 2.9 m along the stick; x right, y up, z forward toward the bucket);
// - each mesh's material named for the game material it gets: paint, paintD, steel, steelL, chrome, rubber, track
//   (gets the mud), bucket (gets the dirt), glass, mirror, lens, redL, amber, black (cab plastics), seat, trim and
//   screen (the cab display, drawn by the game; its mesh keeps its own UVs).
// - joyL and joyR (optional): the operator's left and right joysticks above their boots, each in its own frame with the
//   origin at its pivot, cab (0.34, 0.6, 0.15) and (-0.34, 0.6, 0.15) (facing forward, +x is the operator's left).
// The rams, hoses and bucket linkage stay the game's own, since they move every frame.
// Metres. Classic script, no modules.
function buildExcavator(){
const T=THREE,BGU=T.BufferGeometryUtils,parts={},KEEP_UV={screen:1};
const L1=5.7,L2=2.9,L3=1.1,KN=2.7;
// put a geometry into a part under a material, moved by position, rotation (XYZ) and scale
const mtx=new T.Matrix4(),q=new T.Quaternion(),e=new T.Euler();
function put(part,mat,g,p,r,s){g=g.index?g.toNonIndexed():g.clone();
  e.set(...(r||[0,0,0]));q.setFromEuler(e);mtx.compose(new T.Vector3(...(p||[0,0,0])),q,new T.Vector3(...(s||[1,1,1])));g.applyMatrix4(mtx);
  if(!KEEP_UV[mat])g.deleteAttribute('uv');for(const k of Object.keys(g.attributes))if(k!=='position'&&k!=='normal'&&k!=='uv')g.deleteAttribute(k);
  ((parts[part]=parts[part]||{})[mat]=parts[part][mat]||[]).push(g);return g}
const RB=(w,h,d,r,s)=>new T.RoundedBoxGeometry(w,h,d,s||1,Math.min(r,w/2-1e-4,h/2-1e-4,d/2-1e-4));
const BX=(w,h,d)=>new T.BoxGeometry(w,h,d);
const CY=(rt,rb,h,n)=>new T.CylinderGeometry(rt,rb,h,n||24);
// a cylinder lying along x
const cx=(part,mat,r,len,p,n)=>put(part,mat,CY(r,r,len,n||24),p,[0,0,Math.PI/2]);
// a side profile [[z,y],...] made into a plate across x, of a width, with rounded edges, centred on x
function side(pts,w,bev){const s=new T.Shape();pts.forEach(([z,y],i)=>i?s.lineTo(z,y):s.moveTo(z,y));
  const b=bev||0,g=new T.ExtrudeGeometry(s,{depth:Math.max(0.002,w-2*b),bevelEnabled:b>0,bevelThickness:b,bevelSize:b,bevelSegments:2,curveSegments:16});
  g.rotateY(-Math.PI/2);g.translate((w-2*b)/2,0,0);return BGU.toCreasedNormals(g,0.6)}
// a plan shape [[x,z],...] made into a slab in y from 0 to h
function slab(pts,h,bev){const s=new T.Shape();pts.forEach(([x,z],i)=>i?s.lineTo(x,-z):s.moveTo(x,-z));
  const b=bev||0,g=new T.ExtrudeGeometry(s,{depth:Math.max(0.002,h-2*b),bevelEnabled:b>0,bevelThickness:b,bevelSize:b,bevelSegments:3,curveSegments:24});
  g.rotateX(-Math.PI/2);g.translate(0,b,0);return BGU.toCreasedNormals(g,0.6)}
// a tube along points
function tube(part,mat,pts,r,closed,seg,rad){const c=new T.CatmullRomCurve3(pts.map(p=>new T.Vector3(...p)),!!closed,'catmullrom',0.05);
  put(part,mat,new T.TubeGeometry(c,seg||Math.max(8,pts.length*10),r,rad||10,!!closed))}

// ---------- undercarriage (machine) ----------
for(const s of [-1,1]){const X=1.1*s;
  // track frame, a tapered box beam, with a guard over the top run
  put('machine','steel',side([[-1.5,0.3],[1.5,0.3],[1.32,0.62],[-1.32,0.62]],0.34,0.03),[X,0,0]);
  put('machine','steelL',side([[-1.25,0.62],[1.25,0.62],[1.18,0.68],[-1.18,0.68]],0.4,0.01),[X,0,0]);
  // sprocket at the back: drive motor, hub and toothed ring
  cx('machine','steelL',0.24,0.22,[X+0.27*s,0.4,-1.65],32);cx('machine','steel',0.16,0.05,[X+0.39*s,0.4,-1.65],24);
  for(let i=0;i<8;i++){const a=i/8*Math.PI*2;cx('machine','steel',0.02,0.03,[X+0.42*s,0.4+Math.sin(a)*0.12,-1.65+Math.cos(a)*0.12],8)}
  const sp=new T.Shape(),NT=13;for(let i=0;i<NT*2;i++){const a=i/(NT*2)*Math.PI*2,r=i%2?0.3:0.36;i?sp.lineTo(Math.cos(a)*r,Math.sin(a)*r):sp.moveTo(Math.cos(a)*r,Math.sin(a)*r)}
  const spg=new T.ExtrudeGeometry(sp,{depth:0.07,bevelEnabled:true,bevelThickness:0.01,bevelSize:0.01,bevelSegments:1});spg.rotateY(Math.PI/2);
  put('machine','steelL',spg,[X-0.035,0.4,-1.65]);cx('machine','steel',0.2,0.36,[X,0.4,-1.65],32);
  // idler at the front, with its rim and flanges
  cx('machine','steelL',0.33,0.16,[X,0.4,1.65],40);cx('machine','steelL',0.35,0.05,[X-0.1,0.4,1.65],40);cx('machine','steelL',0.35,0.05,[X+0.1,0.4,1.65],40);
  cx('machine','steel',0.12,0.4,[X,0.4,1.65],20);
  // bottom rollers and carrier rollers
  for(let i=0;i<7;i++){const z=-1.2+i*0.4;cx('machine','steelL',0.105,0.22,[X,0.165,z],20);
    cx('machine','steelL',0.13,0.04,[X-0.13,0.165,z],20);cx('machine','steelL',0.13,0.04,[X+0.13,0.165,z],20);cx('machine','steel',0.05,0.42,[X,0.165,z],12)}
  for(const z of [-0.6,0.6]){cx('machine','steelL',0.09,0.2,[X,0.705,z],20);cx('machine','steel',0.04,0.36,[X,0.705,z],10)}
  // the track: steel shoes with grousers round the sprocket, along the bottom, round the idler and back over the top
  const R=0.385,ZE=1.65,Lp=4*ZE+2*Math.PI*R,N=Math.round(Lp/0.19),pitch=Lp/N;
  for(let i=0;i<N;i++){let d=i*pitch,z,y,a;
    if(d<2*ZE){z=-ZE+d;y=0.4+R;a=0}else if((d-=2*ZE)<Math.PI*R){a=d/R;z=ZE+Math.sin(a)*R;y=0.4+Math.cos(a)*R}
    else if((d-=Math.PI*R)<2*ZE){z=ZE-d;y=0.4-R;a=Math.PI}else{d-=2*ZE;a=Math.PI+d/R;z=-ZE+Math.sin(a)*R;y=0.4+Math.cos(a)*R}
    // shoe frame: outward normal is (sin a, cos a) in (z, y); the shoe turns by -a about x
    const ny=Math.cos(a),nz=Math.sin(a),o=(k)=>[X,y+ny*k,z+nz*k];
    put('machine','track',BX(0.6,0.022,0.175),o(0.012),[a,0,0]);
    // the grouser bar stands on the shoe's trailing edge (the tangent is (cos a, -sin a) in z, y)
    put('machine','track',BX(0.6,0.03,0.022),[X,y+ny*0.034+Math.sin(a)*0.05,z+nz*0.034-Math.cos(a)*0.05],[a,0,0]);
    for(const lx of [-0.13,0.13])put('machine','steel',BX(0.05,0.05,0.19),[X+lx,y-ny*0.025,z-nz*0.025],[a,0,0]);
    // the link pins showing on the outside of each chain, at the joint between shoes, and the shoe's four bolt heads
    for(const lx of [-0.165,0.165])cx('machine','steelL',0.026,0.02,[X+lx,y-ny*0.025+Math.sin(a)*0.095,z-nz*0.025-Math.cos(a)*0.095],8);
    for(const lx of [-0.2,0.2])for(const t of [-0.04,0.04])put('machine','steel',BX(0.032,0.012,0.032),[X+lx,y+ny*0.026+Math.sin(a)*t,z+nz*0.026-Math.cos(a)*t],[a,0,0]);
    // the shoe's edges are turned down a little at front and back, as rolled shoes are
    put('machine','track',BX(0.6,0.012,0.02),[X,y+ny*0.008-Math.sin(a)*0.085,z+nz*0.008+Math.cos(a)*0.085],[a+0.5,0,0])}
  // the idler's yoke and the recoil spring housing behind it, the guide plates either side of the front of the frame
  for(const lx of [-0.12,0.12])put('machine','steel',side([[1.2,0.3],[1.62,0.3],[1.62,0.5],[1.2,0.56]],0.03,0.008),[X+lx,0,0]);
  cx('machine','steelL',0.06,0.3,[X,0.4,1.65],16);put('machine','steel',CY(0.09,0.09,0.55,16),[X,0.46,0.95],[Math.PI/2,0,0]);
  // a step cut into the outside of the frame for climbing up, and the frame's lower guard plates over the roller ends
  put('machine','steel',side([[-0.25,0.42],[0.25,0.42],[0.25,0.47],[-0.25,0.47]],0.12,0.006),[X+0.22*s,0,0.25]);
  for(let i=0;i<5;i++)put('machine','steelL',BX(0.09,0.008,0.012),[X+0.22*s,0.475,0.08+i*0.08]);
  put('machine','steel',side([[-1.35,0.24],[1.35,0.24],[1.3,0.3],[-1.3,0.3]],0.42,0.01),[X,0,0]);
  for(let i=0;i<7;i++){const z=-1.2+i*0.4;for(const lx of [-0.215,0.215])for(const dz of [-0.06,0.06])cx('machine','steel',0.016,0.03,[X+lx,0.27,z+dz],6)}
}
// car body and swing bearing with its bolts
put('machine','steelL',RB(1.7,0.4,2.5,0.06,2),[0,0.55,0]);
put('machine','steel',slab([[-0.4,-1.25],[0.4,-1.25],[0.55,-1.45],[-0.55,-1.45]],0.12,0.01),[0,0.45,0]);
put('machine','steel',CY(0.96,0.96,0.12,64),[0,0.79,0]);put('machine','steelL',CY(0.9,0.92,0.06,64),[0,0.86,0]);
for(let i=0;i<28;i++){const a=i/28*Math.PI*2;put('machine','steel',CY(0.022,0.022,0.04,8),[Math.cos(a)*0.86,0.86,Math.sin(a)*0.86])}
for(const s of [-1,1])for(let i=0;i<8;i++)cx('machine','steel',0.03,0.04,[1.42*s,0.5,-1.2+i*0.34],8);

// ---------- house ----------
// revolving frame (dark band) and the main body, with the counterweight swept round the back
put('house','steel',RB(2.46,0.2,2.96,0.03,1),[0,0.1,-0.42]);
put('house','paint',RB(2.5,0.66,3.0,0.06,2),[0,0.53,-0.4]);
// the counterweight is one casting: round in plan, its side bellied out a little at mid height, tucked under at the
// foot and rolled over into the top in a big radius, as real ones are (a sweep of that profile round the plan)
const CWA=1.25,CWB=0.95,CWZ=-1.8;
const cwPlan=[[CWA,-1.6,1,0]];for(let i=0;i<=40;i++){const a=Math.PI*i/40,c=Math.cos(a),s=Math.sin(a),nx=c/CWA,nz=-s/CWB,nl=Math.hypot(nx,nz);
  cwPlan.push([CWA*c,CWZ-CWB*s,nx/nl,nz/nl])}cwPlan.push([-CWA,-1.6,-1,0]);
const CW_PROF=[[0.05,-0.13],[0.08,-0.06],[0.14,-0.015],[0.26,0.015],[0.42,0.035],[0.58,0.035],[0.72,0.018],[0.82,-0.01],[0.89,-0.05],[0.935,-0.1],[0.96,-0.16],[0.97,-0.22]];
function sweep(part,mat,plan,prof){const pos=[],idx=[],nP=prof.length;
  for(const [x,z,nx,nz] of plan)for(const [y,o] of prof)pos.push(x+nx*o,y,z+nz*o);
  for(let i=0;i<plan.length-1;i++)for(let j=0;j<nP-1;j++){const a=i*nP+j,b=a+nP;idx.push(a,a+1,b,b,a+1,b+1)}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();
  // keep the faces turned outward
  const P=g.attributes.position,v=k=>new T.Vector3(P.getX(k),P.getY(k),P.getZ(k)),m=Math.floor(plan.length/2)*nP+4;
  const n=new T.Vector3().crossVectors(v(m+1).sub(v(m)),v(m+nP).sub(v(m)));if(n.dot(new T.Vector3(plan[Math.floor(plan.length/2)][2],0,plan[Math.floor(plan.length/2)][3]))<0){
    for(let k=0;k<idx.length;k+=3){const t=idx[k+1];idx[k+1]=idx[k+2];idx[k+2]=t}g.setIndex(idx);g.computeVertexNormals()}
  return put(part,mat,g)}
sweep('house','paintD',cwPlan,CW_PROF);
// top and underside: the plan drawn in to where the profile ends
const cwIn=(o)=>cwPlan.map(([x,z,nx,nz])=>[x+nx*o,z+nz*o]);
put('house','paintD',slab(cwIn(-0.22),0.012),[0,0.958,0]);put('house','steel',slab(cwIn(-0.13),0.01),[0,0.05,0]);
// a cast-in crease round the back at the top of the belly, and the maker's recess for the decal across the middle
{const cr=cwPlan.slice(4,-4).map(([x,z,nx,nz])=>[x+nx*0.03,0.74,z+nz*0.03]);tube('house','paintD',cr,0.012,false,48,6)}
// counterweight tail lights, set into its curve: each on the casting's face, turned to its normal
for(const s of [-1,1]){const a=Math.acos(0.88*s),c=Math.cos(a),sn=Math.sin(a),x=CWA*c,z=CWZ-CWB*sn,nx=c/CWA,nz=-sn/CWB,nl=Math.hypot(nx,nz),ux=nx/nl,uz=nz/nl,ry=Math.atan2(ux,uz);
  const at=(o,dx)=>[x+ux*o-uz*dx,0.64,z+uz*o+ux*dx];
  put('house','steel',RB(0.3,0.14,0.06,0.02),at(0.04,0),[0,ry,0]);put('house','redL',RB(0.2,0.08,0.03,0.01),at(0.075,-0.04*s),[0,ry,0]);
  put('house','amber',RB(0.07,0.08,0.03,0.01),at(0.075,0.1*s),[0,ry,0])}
// rear-view camera on the counterweight top, and a pair of grab handles either side of it
put('house','black',RB(0.1,0.07,0.08,0.015),[0,1.01,-2.62],[0.4,0,0]);put('house','lens',CY(0.018,0.018,0.012,12),[0,1.0,-2.665],[Math.PI/2+0.4,0,0]);
for(const x of [-0.95,0.95])tube('house','paintD',[[x-0.12,0.97,-2.25],[x-0.1,1.06,-2.26],[x+0.1,1.06,-2.26],[x+0.12,0.97,-2.25]],0.014);
for(const x of [-0.55,0.55]){put('house','steel',CY(0.06,0.06,0.05,16),[x,0.98,-2.1]);put('house','steelL',new T.TorusGeometry(0.045,0.012,8,16),[x,1.02,-2.1],[Math.PI/2,0,0])}
// panel seams and door handles down the sides
for(const s of [-1,1])for(const z of [-1.5,-0.8,-0.1,0.6]){put('house','paintD',BX(0.012,0.56,0.012),[1.252*s,0.53,z]);}
for(const z of [-1.15,-0.45]){put('house','steel',RB(0.03,0.04,0.14,0.012),[1.265,0.62,z]);put('house','steel',RB(0.03,0.04,0.14,0.012),[-1.265,0.62,z])}
// engine louvres on both sides: a dark recess with angled slats
for(const [s,z0,len] of [[1,-0.95,1.2],[-1,-1.05,0.9]]){put('house','steel',BX(0.02,0.42,len),[1.245*s,0.55,z0]);
  for(let i=0;i<12;i++)put('house','paintD',BX(0.045,0.012,len-0.04),[1.25*s,0.37+i*0.033,z0],[0,0,0.5*s])}
// engine hood with a louvred top, the exhaust and the air intake
put('house','paint',RB(1.4,0.32,1.9,0.05,2),[0.5,1.0,-0.95]);
put('house','steel',BX(0.9,0.01,0.7),[0.55,1.162,-1.25]);
for(let i=0;i<14;i++)put('house','paintD',BX(0.9,0.012,0.035),[0.55,1.165,-1.57+i*0.048],[0.45,0,0]);
put('house','steel',CY(0.07,0.075,0.6,24),[0.95,1.45,-1.2]);put('house','steel',new T.TorusGeometry(0.072,0.012,8,24),[0.95,1.17,-1.2],[Math.PI/2,0,0]);
put('house','steelL',CY(0.08,0.07,0.1,24),[0.95,1.8,-1.2],[0.35,0,0]);
put('house','black',CY(0.11,0.11,0.24,24),[0.2,1.28,-0.45]);put('house','steel',CY(0.12,0.12,0.03,24),[0.2,1.41,-0.45]);
// handrails along the hood
for(const x of [0.14,1.08]){tube('house','paintD',[[x,1.16,-1.78],[x,1.4,-1.72],[x,1.4,-0.2],[x,1.16,-0.14]],0.02);
  put('house','paintD',CY(0.018,0.018,0.24,10),[x,1.28,-0.95])}
// right front toolbox, fuel cap and steps
put('house','paint',RB(0.55,0.42,0.8,0.04,2),[0.95,1.06,0.55]);
put('house','paintD',BX(0.012,0.3,0.6),[1.226,1.05,0.55]);put('house','steel',RB(0.025,0.05,0.12,0.01),[1.235,1.12,0.55]);
put('house','steel',CY(0.17,0.17,0.06,32),[0.95,1.3,0.75]);put('house','steelL',CY(0.12,0.12,0.03,24),[0.95,1.34,0.75]);
for(let i=0;i<3;i++)put('house','steel',RB(0.32,0.03,0.22,0.01),[1.18,0.12+i*0.3,1.02-i*0.02]);
for(const z of [0.88,1.15])put('house','steel',BX(0.03,0.62,0.03),[1.34,0.38,z]);
// the right front handrail up from the toolbox, with the big right-hand mirror on its own stalk at the front corner
tube('house','paintD',[[1.2,1.27,0.2],[1.2,1.62,0.25],[1.2,1.62,0.85],[1.2,1.27,0.92]],0.02);
tube('house','steel',[[1.15,1.27,0.95],[1.16,1.8,0.98],[1.2,2.05,1.02]],0.016);
put('house','steel',RB(0.26,0.34,0.05,0.03),[1.24,2.14,1.06],[0,-0.6,0]);put('house','mirror',BX(0.22,0.3,0.01),[1.255,2.14,1.08],[0,-0.6,0]);
// anti-slip plate on the deck walkways
for(let i=0;i<5;i++)for(let j=0;j<4;j++)put('house','steelL',BX(0.06,0.008,0.012),[0.78+j*0.12,1.284,0.28+i*0.06],[0,(i+j)%2?0.6:-0.6,0]);
// a grab handle by the cab step at the front left, and the steps up the left side under the cab
tube('house','paintD',[[-1.27,0.35,0.95],[-1.32,0.4,0.98],[-1.32,0.85,0.98],[-1.27,0.9,0.95]],0.017);
for(let i=0;i<2;i++){put('house','steel',RB(0.24,0.025,0.2,0.008),[-1.38,0.15+i*0.32,0.75]);for(let j=0;j<4;j++)put('house','steelL',BX(0.2,0.008,0.015),[-1.38,0.165+i*0.32,0.68+j*0.045])}
for(const z of [0.66,0.84])put('house','steel',BX(0.02,0.42,0.03),[-1.28,0.32,z]);
// a heat guard round the exhaust stack, and the hinge pins of the engine hood
put('house','steelL',new T.CylinderGeometry(0.092,0.092,0.36,20,1,true),[0.95,1.36,-1.2]);for(let i=0;i<6;i++)put('house','steel',new T.TorusGeometry(0.093,0.006,4,20),[0.95,1.2+i*0.06,-1.2],[Math.PI/2,0,0]);
for(const z of [-1.7,-0.25])put('house','steel',CY(0.022,0.022,0.12,10),[-0.2,1.12,z],[Math.PI/2,0,0]);
// boom foot: two heavy plates round the boom pin, a nose for the boom rams and the pin bosses
for(const s of [-1,1]){put('house','paintD',side([[0.55,0.15],[1.25,0.15],[1.3,0.55],[1.22,1.2],[0.75,1.25],[0.55,0.95]],0.06,0.015),[0.42+0.28*s,0,0]);
  cx('house','steel',0.16,0.04,[0.42+0.32*s,1.0,0.95],28)}
put('house','paintD',RB(0.8,0.34,0.62,0.05,2),[0.42,0.3,1.38]);
for(const x of [0.2,0.64]){put('house','paintD',side([[1.35,0.12],[1.72,0.18],[1.72,0.52],[1.35,0.5]],0.05,0.012),[x-0.09,0,0]);put('house','paintD',side([[1.35,0.12],[1.72,0.18],[1.72,0.52],[1.35,0.5]],0.05,0.012),[x+0.09,0,0])}
cx('house','steel',0.05,0.62,[0.42,0.35,1.55],16);

// ---------- cab ----------
// frame: pillars, sills, the bar across the front, a mid pillar each side
for(const [x,z] of [[-0.45,-0.62],[0.45,-0.62],[-0.45,0.62],[0.45,0.62]])put('cab','steel',RB(0.07,1.54,0.07,0.025,2),[x,0.78,z]);
for(const x of [-0.45,0.45])put('cab','steel',RB(0.05,1.5,0.05,0.02),[x,0.78,-0.12]);
put('cab','steel',RB(0.94,0.06,0.05,0.02),[0,0.7,0.62]);put('cab','steel',RB(0.94,0.06,0.05,0.02),[0,0.3,0.62]);
for(const z of [-0.62,0.62])put('cab','steel',RB(0.94,0.07,0.06,0.02),[0,0.035,z]);
for(const x of [-0.45,0.45])put('cab','steel',RB(0.06,0.07,1.28,0.02),[x,0.035,0]);
for(const z of [-0.62,0.62])put('cab','steel',RB(0.94,0.06,0.06,0.02),[0,1.52,z]);
for(const x of [-0.45,0.45])put('cab','steel',RB(0.06,0.06,1.28,0.02),[x,1.52,0]);
put('cab','paintD',RB(0.9,0.27,0.035,0.012),[0,0.17,0.63]);
put('cab','paint',RB(0.92,0.84,0.025,0.01),[0,0.46,-0.645]);put('cab','trim',BX(0.84,0.8,0.01),[0,0.47,-0.627]);
// roof: painted shell round a skylight, grey headliner under it, a visor over the windscreen and the work lights
const roof=[[0,-0.36,0.76,0.72],[0,0.66,0.76,0.2],[-0.44,0.15,0.22,0.82],[0.44,0.15,0.22,0.82]];
for(const [x,z,w,d] of [[0,-0.4,1.12,0.66],[0,0.69,1.12,0.14],[-0.445,0.145,0.23,0.95],[0.445,0.145,0.23,0.95]]){
  put('cab','paint',RB(w,0.06,d,0.025,2),[x,1.6,z]);put('cab','trim',BX(Math.max(0.02,w-0.06),0.02,Math.max(0.02,d-0.04)),[x,1.555,z])}
void roof;
put('cab','glass',BX(0.66,0.012,0.56),[0,1.6,0.14]);
put('cab','paintD',RB(1.0,0.02,0.14,0.008),[0,1.56,0.73],[-0.25,0,0]);
for(let i=0;i<4;i++)put('cab','steel',RB(0.03,0.03,0.6,0.01),[-0.27+i*0.18,1.645,0.14]);
for(const x of [-0.3,0.3]){put('cab','steel',RB(0.17,0.12,0.1,0.03),[x,1.68,0.62]);put('cab','lens',RB(0.13,0.08,0.02,0.01),[x,1.68,0.675]);
  put('cab','steel',BX(0.03,0.06,0.04),[x,1.62,0.6])}
// glass: windscreen upper and lower, the right side, the door and front quarter on the left, the back window
put('cab','glass',BX(0.84,0.78,0.008),[0,1.1,0.635]);put('cab','glass',BX(0.84,0.34,0.008),[0,0.5,0.635]);
put('cab','glass',BX(0.008,1.42,0.52),[0.462,0.8,0.25]);put('cab','glass',BX(0.008,1.42,0.44),[0.462,0.8,-0.37]);
put('cab','glass',BX(0.008,1.42,0.48),[-0.462,0.8,-0.37]);put('cab','glass',BX(0.008,1.42,0.66),[-0.462,0.8,0.25]);
put('cab','glass',BX(0.84,0.62,0.008),[0,1.2,-0.635]);
// door handle and the grab rail beside the door
put('cab','steel',RB(0.03,0.03,0.12,0.012),[-0.485,0.85,-0.5]);tube('cab','paintD',[[-0.5,0.4,0.66],[-0.56,0.45,0.66],[-0.56,1.2,0.66],[-0.5,1.25,0.66]],0.016);
// door hinges, the rain gutter along the roof edge and the door's rubber seal line
for(const y of [0.35,1.25])put('cab','steel',RB(0.03,0.09,0.05,0.01),[-0.475,y,0.4]);
for(const x of [-0.5,0.5])put('cab','paintD',RB(0.025,0.025,1.3,0.008),[x,1.575,0.03]);
put('cab','black',BX(0.012,1.36,0.012),[-0.468,0.8,0.08]);put('cab','black',BX(0.012,1.36,0.012),[-0.468,0.8,-0.6]);
// mirror on its arm
tube('cab','steel',[[-0.48,1.25,0.6],[-0.65,1.2,0.75],[-0.78,1.13,0.92]],0.014);
put('cab','steel',RB(0.24,0.3,0.05,0.03),[-0.8,1.12,0.95],[0,0.5,0]);put('cab','mirror',BX(0.2,0.26,0.01),[-0.79,1.12,0.975],[0,0.5,0]);
// inside: the floor mat with ribs
put('cab','rubber',RB(0.88,0.03,1.22,0.01),[0,0.085,0]);for(let i=0;i<10;i++)put('cab','rubber',BX(0.8,0.012,0.02),[0,0.105,-0.5+i*0.1]);
// the seat: base, suspension, cushion, back, headrest and the armrests on the consoles
put('cab','black',RB(0.42,0.12,0.4,0.03),[0,0.16,-0.15]);put('cab','black',CY(0.16,0.18,0.12,24),[0,0.28,-0.15]);
put('cab','seat',RB(0.5,0.11,0.5,0.05,3),[0,0.4,-0.12]);put('cab','seat',RB(0.42,0.04,0.38,0.02,2),[0,0.465,-0.12]);
put('cab','seat',RB(0.5,0.62,0.13,0.06,3),[0,0.78,-0.41],[-0.12,0,0]);put('cab','seat',RB(0.4,0.48,0.03,0.015,2),[0,0.79,-0.34],[-0.12,0,0]);
put('cab','black',RB(0.3,0.16,0.1,0.04,2),[0,1.19,-0.47],[-0.12,0,0]);
// the two consoles with their joysticks, buttons on the grips, a keypad on the right
for(const s of [-1,1]){const x=0.34*s;
  put('cab','black',RB(0.16,0.34,0.5,0.03,2),[x,0.3,-0.04]);put('cab','seat',RB(0.15,0.05,0.3,0.02,2),[x,0.6,-0.14]);
  put('cab','black',RB(0.14,0.06,0.18,0.02),[x,0.5,0.14],[0.15,0,0]);
  put('cab','rubber',CY(0.022,0.05,0.07,16),[x,0.57,0.15]);
  // the stick above the boot moves: its own part, about the pivot (x, 0.6, 0.15)
  const J=s>0?'joyL':'joyR';
  put(J,'steel',CY(0.011,0.011,0.08,8),[0,0.03,0.01],[0.12,0,0]);
  put(J,'black',CY(0.024,0.028,0.11,16),[0,0.11,0.02],[0.2,0,0]);put(J,'black',new T.SphereGeometry(0.026,16,10),[0,0.165,0.03]);
  put(J,'redL',CY(0.008,0.008,0.012,10),[-0.01*s,0.18,0.035]);put(J,'amber',CY(0.007,0.007,0.03,8),[0,0.13,0.05],[Math.PI/2,0,0])}
for(let i=0;i<3;i++)for(let j=0;j<2;j++)put('cab','steelL',RB(0.022,0.01,0.022,0.004),[0.31+j*0.035,0.475,-0.06+i*0.035]);
// travel levers and pedals in front of the seat
put('cab','black',RB(0.34,0.3,0.12,0.03,2),[0,0.25,0.5]);
for(const x of [-0.1,0.1]){put('cab','rubber',CY(0.018,0.035,0.06,12),[x,0.42,0.48]);put('cab','steel',CY(0.012,0.012,0.4,10),[x,0.63,0.46],[-0.12,0,0]);
  put('cab','black',CY(0.02,0.02,0.08,12),[x,0.84,0.44],[0,0,Math.PI/2]);put('cab','black',RB(0.11,0.025,0.2,0.01),[x,0.15,0.36],[-0.5,0,0])}
// safety lock lever by the left console
put('cab','redL',RB(0.025,0.025,0.16,0.01),[-0.44,0.5,0.0],[0.3,0,0]);
// the display on its post, front right
put('cab','black',CY(0.015,0.015,0.5,10),[0.4,0.62,0.32],[0.2,0,0]);
{const ry=Math.atan2(0.36,0.52)+Math.PI,mp=[0.38,0.92,0.38];put('cab','black',RB(0.24,0.18,0.05,0.015,2),mp,[-0.25,ry,0]);
  const sc=new T.PlaneGeometry(0.2,0.14);put('cab','screen',sc,[0.38-0.027*Math.sin(ry),0.92+0.006,0.38-0.027*Math.cos(ry)],[-0.25,ry,0])}
// switch panel and radio up at the back right, vents and a dome light
put('cab','black',RB(0.3,0.1,0.14,0.02),[0.28,1.4,-0.54]);for(let i=0;i<5;i++)put('cab','steelL',BX(0.03,0.02,0.01),[0.18+i*0.05,1.4,-0.468]);
for(const x of [-0.3,0.3])put('cab','black',RB(0.1,0.05,0.03,0.01),[x,1.47,0.58]);put('cab','lens',RB(0.12,0.02,0.06,0.008),[0,1.535,-0.3]);
// roller blind housing over the windscreen
put('cab','black',CY(0.025,0.025,0.84,12),[0,1.48,0.6],[0,0,Math.PI/2]);

// ---------- boom ----------
put('boom','paint',side([[-0.22,-0.12],[-0.15,0.27],[KN-0.15,0.75+0.37],[KN+0.25,0.75+0.33],[L1-0.25,0.24],[L1+0.14,0.1],[L1+0.14,-0.12],[L1-0.3,-0.22],[KN+0.2,0.75-0.32],[KN-0.25,0.75-0.36],[0.12,-0.28]],0.44,0.03));
// top and bottom flange strips and reinforcing plates round the pins
put('boom','paintD',side([[0.05,0.29],[KN-0.15,0.755+0.37],[KN-0.15,0.785+0.37],[0.05,0.32]],0.4,0.006),[0,0.005,0]);
put('boom','paintD',side([[KN+0.25,0.75+0.33],[L1-0.25,0.24],[L1-0.25,0.27],[KN+0.25,0.785+0.33]],0.36,0.006),[0,0.005,0]);
for(const s of [-1,1]){cx('boom','paintD',0.24,0.04,[0.23*s,0,0],32);cx('boom','paintD',0.2,0.04,[0.23*s,0,L1],32);
  put('boom','paintD',side([[KN-0.6,0.45],[KN+0.3,0.42],[KN+0.12,0.02],[KN-0.32,0.0]],0.05,0.01),[0.25*s,0,0])}
cx('boom','steel',0.11,0.6,[0,0,0],24);cx('boom','steel',0.1,0.54,[0,0,L1],24);cx('boom','steel',0.08,0.62,[0,0.15,KN-0.1],20);
// lug on top for the stick ram
for(const s of [-1,1])put('boom','paintD',side([[KN-0.85,0.92],[KN-0.25,1.1],[KN-0.32,1.14],[KN-0.62,1.15]],0.05,0.012),[0.11*s,0,0]);
cx('boom','paintD',0.13,0.28,[0,1.0,KN-0.5],24);cx('boom','steel',0.08,0.36,[0,1.0,KN-0.5],20);
// steel lines down both sides of the boom (the bucket and auxiliary circuits), in clamp blocks, bending up at the nose
// to the fittings the hoses take on from; doubler plates welded on round the boom foot and at the bend
for(const s of [-1,1])for(const [k,dy] of [[0,0],[1,-0.07]]){const x=(0.245+k*0.035)*s;
  tube('boom','steel',[[x,0.22+dy,0.35],[x,0.5+dy,1.2],[x,0.92+dy,KN-0.3],[x,0.93+dy,KN+0.1],[x,0.88+dy,KN+0.4],[x,0.33+dy,L1-0.7],[x*0.85,0.42+dy,L1-0.45]],0.016,false,40,6);
  put('boom','steel',CY(0.026,0.026,0.06,10),[x*0.85,0.42+dy,L1-0.42],[Math.PI/2+0.3,0,0])}
for(const [z,y] of [[0.75,0.35],[1.7,0.7],[KN-0.05,0.9],[3.6,0.73],[4.5,0.47]])for(const s of [-1,1]){
  put('boom','steel',RB(0.07,0.16,0.07,0.012),[0.255*s,y-0.04,z]);cx('boom','steelL',0.012,0.08,[0.255*s,y+0.04,z],6)}
for(const s of [-1,1]){put('boom','paintD',side([[0.25,-0.18],[1.0,0.0],[1.0,0.38],[0.25,0.42]],0.02,0.006),[0.225*s,0,0]);
  put('boom','paintD',side([[KN-0.8,0.62],[KN+0.7,0.62],[KN+0.55,0.78],[KN-0.65,0.84]],0.02,0.006),[0.225*s,0,0])}
// the boom's work light on its bracket
put('boom','steel',BX(0.04,0.14,0.04),[0.18,0.62,1.0]);put('boom','steel',RB(0.18,0.12,0.1,0.03),[0.18,0.72,1.05],[-0.3,0,0]);put('boom','lens',RB(0.14,0.08,0.02,0.01),[0.18,0.74,1.1],[-0.3,0,0]);
// hose clamps along the top
for(const z of [0.8,1.6,3.5,4.4])put('boom','steel',RB(0.3,0.04,0.06,0.01),[0,0.27+(z<KN?(z/KN)*0.85:0.85-(z-KN)/(L1-KN)*0.6)*1.0,z]);

// ---------- stick ----------
put('stick','paint',side([[-0.78,0.15],[-0.66,0.5],[-0.32,0.52],[0.15,0.24],[L2-0.25,0.16],[L2+0.1,0.06],[L2+0.1,-0.11],[L2-0.3,-0.18],[0.0,-0.32],[-0.55,-0.22]],0.32,0.025));
put('stick','paintD',side([[0.15,0.245],[L2-0.25,0.165],[L2-0.25,0.19],[0.15,0.27]],0.28,0.005),[0,0.004,0]);
for(const s of [-1,1]){cx('stick','paintD',0.17,0.03,[0.17*s,0,0],28);cx('stick','paintD',0.13,0.03,[0.17*s,0,L2],28);cx('stick','paintD',0.12,0.03,[0.17*s,0.35,-0.5],24)}
cx('stick','steel',0.08,0.42,[0,0.35,-0.5],20);cx('stick','steel',0.07,0.4,[0,0,L2],20);
// auxiliary lines down the stick sides, ending in capped quick couplers near the bucket, and a doubler plate each side
for(const s of [-1,1]){const x=0.185*s;
  for(const dy of [0,-0.06])tube('stick','steel',[[x,0.12+dy,0.0],[x,0.1+dy,0.8],[x,0.06+dy,L2-0.6]],0.014,false,16,6);
  for(const dy of [0,-0.06]){put('stick','steelL',CY(0.022,0.022,0.07,10),[x,0.06+dy,L2-0.56],[Math.PI/2,0,0]);put('stick','redL',CY(0.024,0.024,0.025,10),[x,0.06+dy,L2-0.51],[Math.PI/2,0,0])}
  for(const z of [0.4,1.2,2.0])put('stick','steel',RB(0.05,0.12,0.05,0.01),[x,0.07-0.0*z,z]);
  put('stick','paintD',side([[L2-0.9,-0.14],[L2-0.15,-0.1],[L2-0.15,0.1],[L2-0.9,0.14]],0.02,0.006),[0.165*s,0,0])}
// bucket ram lug and the linkage pin boss
for(const s of [-1,1])put('stick','paintD',side([[0.05,0.22],[0.45,0.2],[0.38,0.36],[0.15,0.38]],0.04,0.01),[0.1*s,0,0]);
cx('stick','steel',0.07,0.36,[0,0.34,0.25],20);cx('stick','paintD',0.09,0.38,[0,0.05,L2-0.42],20);

// ---------- bucket ----------
const sh=t=>[L3*t,0.2*Math.sin(Math.PI*t)-0.04*t];
{const top=[],bot=[];for(let i=0;i<=24;i++){const t=i/24,[z,y]=sh(t);top.push([z,y+0.03]);bot.unshift([z,y])}
  put('bucket','bucket',side([...top,...bot],0.9,0.006))}
{const pts=[[0,0]];for(let i=1;i<=24;i++)pts.push(sh(i/24));pts.push([L3*0.92,-0.22],[L3*0.62,-0.5],[L3*0.2,-0.58],[0.02,-0.45]);
  for(const x of [0.47,-0.47])put('bucket','bucket',side(pts,0.035,0.008),[x,0,0])}
// cutting edge, teeth on adapters, side cutters
{const [z,y]=sh(1),ang=-0.32;put('bucket','steel',RB(0.94,0.035,0.12,0.01),[0,y-0.005,z-0.03],[-ang,0,0]);
  const tp=[[0,0.035],[0.1,0.03],[0.24,0.004],[0.25,-0.006],[0.1,-0.03],[0,-0.035]];
  void tp;const dz=Math.cos(ang),dy=Math.sin(ang);
  for(let i=0;i<5;i++){const x=-0.36+i*0.18;put('bucket','steel',RB(0.08,0.07,0.12,0.015),[x,y-0.01,z+0.04],[-ang,0,0]);
    // the tooth: a tapered point, wider than deep, over the adapter's nose, held by a pin through the side
    const tg=CY(0.018,0.062,0.22,4,1).rotateY(Math.PI/4);put('bucket','steelL',tg,[x,y-0.01+dy*0.19,z+0.04+dz*0.19],[Math.PI/2-ang,0,0],[1,1,0.55]);
    cx('bucket','steel',0.012,0.085,[x,y-0.01+dy*0.1,z+0.04+dz*0.1],8)}
  // side wear plates and the lip's top bar
  for(const s of [-1,1])put('bucket','steel',side([[L3*0.25,-0.5],[L3*0.85,-0.26],[L3*0.88,-0.2],[L3*0.25,-0.42]],0.012,0.003),[0.493*s,0,0]);
  for(const s of [-1,1])put('bucket','steel',side([[L3-0.32,-0.02],[L3-0.04,-0.06],[L3*0.9,-0.24],[L3-0.4,-0.2]],0.03,0.006),[0.49*s,0,0])}
// wear strips on the back and the ears that take the pins
for(const x of [-0.3,0,0.3])for(let i=1;i<6;i++){const a=sh(i/7),b=sh((i+1)/7),L=Math.hypot(b[0]-a[0],b[1]-a[1]);
  put('bucket','steel',RB(0.05,0.03,L,0.008),[x,(a[1]+b[1])/2+0.045,(a[0]+b[0])/2],[-Math.atan2(b[1]-a[1],b[0]-a[0]),0,0])}
for(const x of [-0.13,0.13])put('bucket','steel',side([[-0.12,0],[-0.09,0.1],[0.12,0.33],[0.3,0.33],[0.36,0.2],[0.32,0.06],[0.18,0.0]],0.04,0.01),[x,0,0]);
// lifting eye on the back, and the reinforcing band over the top
{const [z,y]=sh(0.55);put('bucket','steel',new T.TorusGeometry(0.05,0.014,8,16),[0.3,y+0.06,z],[0,Math.PI/2,0]);
  put('bucket','steel',RB(0.94,0.04,0.08,0.012),[0,sh(0.85)[1]+0.04,sh(0.85)[0]],[0.2,0,0])}
cx('bucket','steel',0.055,0.32,[0,0.22,0.25],16);cx('bucket','steel',0.065,0.34,[0,0,0],16);

// ---------- merge: one mesh per part and material ----------
const root=new T.Group();root.name='excavator';
for(const [part,mats] of Object.entries(parts)){const g=new T.Group();g.name=part;root.add(g);
  for(const [mat,list] of Object.entries(mats)){let m=BGU.mergeBufferGeometries(list);m=BGU.mergeVertices(m,1e-4);
    const mesh=new T.Mesh(m,new T.MeshStandardMaterial({name:mat}));mesh.name=part+'_'+mat;g.add(mesh)}}
return root}
