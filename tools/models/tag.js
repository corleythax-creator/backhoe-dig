// Corley's Island: the detailed equipment trailer (Dexter's 16 ft tandem-axle tag trailer on his pickup's ball,
// trailer.js tgMake), built from shapes and written out as models/tag.glb by tools/build_model.js (three.js r147 in
// headless Chromium). The game loads it (js/models.js, MDL_KIT.tag in trailer.js) in place of the kit-built trailer
// when Machine models are Detailed.
// The contract with the game, so a model made in Blender or bought can replace this one:
// - trailer: the trailer in its own frame (x across, y up, z forward toward the pickup, metres), origin on the ground
//   under the ball, whose centre is 0.5 m up; the oak deck's top 0.58 m up (TG_TOP), 2.08 m wide (±1.04), from z -0.75
//   (the stone guard just ahead of it) back to z -5.95; the tandem axles' middle 4.0 m behind the ball; 15 in tyres;
// - rampL, rampR: the two fold-up ramps, origin on their hinge at the back of the deck (x ∓0.6, y 0.58, z -5.95), each
//   0.48 m wide and 1.65 m long down -z with its top face at y 0 (the game swings them about x: down onto the ground
//   when the pickup stops, standing up behind the deck when it pulls away);
// - materials named for the game's (models.js mdlMatOf): deck (the oak planks), paint#2b2d30 (the frame), steel#6c7378
//   (the ramps), tire, rim, chrome, steel, steelL, black, redL, amber, lens.
// Metres. Classic script, no modules.
function buildTag(){
const T=THREE,BGU=T.BufferGeometryUtils,parts={};
const mtx=new T.Matrix4(),q=new T.Quaternion(),e=new T.Euler();
function put(part,mat,g,p,r){g=g.index?g.toNonIndexed():g.clone();
  e.set(...(r||[0,0,0]));q.setFromEuler(e);mtx.compose(new T.Vector3(...(p||[0,0,0])),q,new T.Vector3(1,1,1));g.applyMatrix4(mtx);
  g.deleteAttribute('uv');for(const k of Object.keys(g.attributes))if(k!=='position'&&k!=='normal')g.deleteAttribute(k);
  ((parts[part]=parts[part]||{})[mat]=parts[part][mat]||[]).push(g);return g}
const RB=(w,h,d,r,s)=>new T.RoundedBoxGeometry(w,h,d,s||1,Math.min(r,w/2-1e-4,h/2-1e-4,d/2-1e-4));
const BX=(w,h,d)=>new T.BoxGeometry(w,h,d);
const CY=(rt,rb,h,n)=>new T.CylinderGeometry(rt,rb,h,n||16);
const XR=[0,0,Math.PI/2],ZR=[Math.PI/2,0,0];
const cx=(part,mat,r,len,p,n)=>put(part,mat,CY(r,r,len,n||16),p,XR);
// a profile in (z, y) pushed across x, w wide, centred on x = 0
function side(pts,w,bev){const s=new T.Shape();pts.forEach(([z,y],i)=>i?s.lineTo(z,y):s.moveTo(z,y));
  const b=bev||0,g=new T.ExtrudeGeometry(s,{depth:Math.max(0.002,w-2*b),bevelEnabled:b>0,bevelThickness:b,bevelSize:b,bevelSegments:1,curveSegments:12});
  g.rotateY(-Math.PI/2);g.translate((w-2*b)/2,0,0);return BGU.toCreasedNormals(g,0.6)}
// a profile in (x, y) pushed along z, len long, centred on z = 0
function along(pts,len){const s=new T.Shape();pts.forEach(([x,y],i)=>i?s.lineTo(x,y):s.moveTo(x,y));
  const g=new T.ExtrudeGeometry(s,{depth:len,bevelEnabled:false});g.translate(0,0,-len/2);return BGU.toCreasedNormals(g,0.6)}
// a C channel h tall, w wide (flanges), t thick, opening toward +x (o=1) or -x (o=-1), along z
const chan=(h,w,t,o,len)=>along([[0,-h/2],[o*w,-h/2],[o*w,-h/2+t],[o*t,-h/2+t],[o*t,h/2-t],[o*w,h/2-t],[o*w,h/2],[0,h/2]],len);
function tube(part,mat,pts,r,n,rs){const c=new T.CatmullRomCurve3(pts.map(p=>new T.Vector3(...p)),false,'catmullrom',0.1);put(part,mat,new T.TubeGeometry(c,n||Math.max(8,pts.length*5),r,rs||6,false))}
const arc=(c0,c1,r,a0,a1,n)=>Array.from({length:n+1},(_,i)=>{const a=a0+(a1-a0)*i/n;return [c0+Math.cos(a)*r,c1+Math.sin(a)*r]});
const TR='trailer',F='paint#2b2d30',RS='steel#6c7378',TOP=0.58,U0=-0.75,U1=-5.95,HW=1.04,AX=[-3.58,-4.42],WX=1.18,WR=0.355;

// ---------- the frame: 6 in channel rails, 3 in channel crossmembers, a tube sill at the back ----------
const LEN=U0-U1+0.05,MZ=(U0+U1)/2;
for(const s of [-1,1]){put(TR,F,chan(0.15,0.05,0.007,-s,LEN),[s*HW,0.455,MZ]);
  // stake pockets and the rub rail outside the rails, D-rings on the deck edge
  put(TR,F,RB(0.02,0.04,LEN,0.006),[s*(HW+0.01),0.5,MZ]);
  for(const z of [-1.3,-2.35,-3.05,-4.95,-5.6]){put(TR,F,BX(0.06,0.12,0.075),[s*(HW+0.04),0.5,z]);put(TR,'black',BX(0.035,0.005,0.05),[s*(HW+0.04),0.562,z])}
  for(const z of [-1.0,-2.7,-4.0,-5.75]){put(TR,'steel',new T.TorusGeometry(0.035,0.008,6,12,Math.PI),[s*(HW-0.03),TOP+0.0,z],[-Math.PI/2,0,0]);put(TR,'steel',RB(0.05,0.02,0.09,0.006),[s*(HW-0.03),TOP+0.005,z])}}
for(let z=-0.95;z>U1+0.1;z-=0.4)put(TR,F,chan(0.076,0.035,0.005,1,2*HW-0.05),[0,0.49,z],[0,Math.PI/2,0]);
put(TR,F,RB(2*HW,0.15,0.08,0.01),[0,0.455,U0]);put(TR,F,RB(2*HW,0.12,0.1,0.012),[0,0.47,U1]);
// the oak deck boards
put(TR,'deck',BX(2*HW-0.02,0.045,U0-U1-0.04),[0,TOP-0.0225,MZ]);
for(const s of [-1,1])put(TR,'steel',RB(0.03,0.012,U0-U1,0.004),[s*(HW-0.015),TOP+0.002,MZ]);

// ---------- the tongue: an A-frame of channel to the coupler, the jack, chains, the plug cord and breakaway box ----------
for(const s of [-1,1]){const a=[0.05*s,-0.22],b=[0.7*s,-1.35],L=Math.hypot(b[0]-a[0],b[1]-a[1]),yaw=Math.atan2(b[0]-a[0],b[1]-a[1]);
  put(TR,F,chan(0.1,0.04,0.006,-s,L),[(a[0]+b[0])/2,0.44,(a[1]+b[1])/2],[0,yaw,0])}
put(TR,F,RB(0.2,0.012,0.22,0.004),[0,0.494,-0.33]);put(TR,F,RB(0.16,0.012,0.16,0.004),[0,0.387,-0.33]);
// the coupler: a cast housing over the ball with its latch, bolted to the tongue's nose
put(TR,F,side([[-0.3,0.44],[-0.02,0.47],[0.05,0.49],[0.07,0.52],[0.05,0.555],[-0.02,0.56],[-0.12,0.53],[-0.3,0.5]],0.11,0.008));
put(TR,F,new T.SphereGeometry(0.048,18,10,0,Math.PI*2,0,Math.PI/2),[0,0.505,0.0]);
put(TR,'chrome',new T.SphereGeometry(0.029,18,12),[0,0.5,0.0]);put(TR,'steel',CY(0.022,0.026,0.04,14),[0,0.455,0.0]);
put(TR,'steelL',RB(0.025,0.025,0.16,0.008),[0,0.575,-0.07],[0.14,0,0]);put(TR,'steel',new T.TorusGeometry(0.014,0.004,6,10),[0.02,0.585,-0.15],[0,Math.PI/2,0]);
for(const z of [-0.13,-0.24])cx(TR,'steel',0.01,0.13,[0,0.47,z],8);
// the jack: a side-wind A-frame jack through the tongue, its foot wound up off the ground
{const z=-0.42;put(TR,F,CY(0.034,0.034,0.5,16),[0,0.72,z]);put(TR,'steelL',CY(0.027,0.027,0.3,16),[0,0.38,z]);put(TR,F,RB(0.12,0.02,0.12,0.006),[0,0.235,z]);
  put(TR,F,RB(0.09,0.08,0.09,0.012),[0,0.98,z]);put(TR,F,CY(0.012,0.012,0.12,8),[0.1,0.98,z],XR);put(TR,F,RB(0.015,0.16,0.015,0.004),[0.16,0.92,z]);
  put(TR,'black',CY(0.012,0.012,0.08,8),[0.2,0.86,z],XR);put(TR,F,RB(0.12,0.012,0.12,0.004),[0,0.5,z])}
// safety chains crossed under the coupler, hooked forward; the 7-pin cord and the breakaway switch's cable
for(const s of [-1,1]){const p0=new T.Vector3(0.09*s,0.42,-0.2),p1=new T.Vector3(-0.07*s,0.4,0.16),n=16;
  for(let i=0;i<n;i++){const t=i/(n-1),p=p0.clone().lerp(p1,t);p.y-=Math.sin(t*Math.PI)*0.13;const d=p1.clone().sub(p0).normalize(),yaw=Math.atan2(d.x,d.z);
    const g=new T.TorusGeometry(0.014,0.0045,4,8);g.scale(1.5,1,1);if(i%2)g.rotateX(Math.PI/2);put(TR,'steel',g,[p.x,p.y,p.z],[0,yaw-Math.PI/2,0])}
  put(TR,'steel',new T.TorusGeometry(0.022,0.007,6,10,Math.PI*1.5),[p1.x,p1.y,p1.z+0.02],[0,Math.PI/2,0])}
tube(TR,'black',[[-0.12,0.45,-0.6],[-0.08,0.47,-0.3],[-0.05,0.42,-0.05],[-0.06,0.35,0.12],[-0.04,0.42,0.22]],0.008,20);
put(TR,'black',RB(0.05,0.07,0.04,0.008),[0.12,0.52,-0.6]);tube(TR,'steel',[[0.12,0.5,-0.58],[0.1,0.4,-0.3],[0.08,0.35,0.0],[0.06,0.4,0.18]],0.003,16,4);
// the stone guard across the front of the deck: a square tube frame round expanded metal
{const z=U0+0.03,y0=TOP,y1=0.88;for(const x of [-HW+0.03,0,HW-0.03])put(TR,F,RB(0.05,y1-y0,0.05,0.008),[x,(y0+y1)/2,z]);
  put(TR,F,RB(2*HW,0.05,0.05,0.008),[0,y1,z]);put(TR,F,RB(2*HW,0.03,0.03,0.006),[0,(y0+y1)/2,z]);
  for(let x=-HW+0.1;x<HW-0.05;x+=0.085)if(Math.abs(x)>0.04)put(TR,F,BX(0.012,y1-y0-0.03,0.025),[x,(y0+y1)/2,z])}

// ---------- the running gear: leaf springs on hangers and an equalizer, two axles, brake drums, wheels ----------
for(const s of [-1,1]){const x=s*(HW-0.05);
  for(const z of [AX[0]+0.34,AX[1]-0.34])put(TR,F,side([[-0.03,0.38],[0.03,0.38],[0.025,0.29],[-0.025,0.29]],0.06,0.004),[x,0,z]);
  put(TR,F,side([[-0.07,0.33],[0.07,0.33],[0.0,0.27]],0.05,0.004),[x,0,(AX[0]+AX[1])/2]);put(TR,F,side([[-0.03,0.38],[0.03,0.38],[0.02,0.33],[-0.02,0.33]],0.06,0.003),[x,0,(AX[0]+AX[1])/2]);
  for(const az of AX){for(let k=0;k<3;k++){const w=0.32-k*0.07,pts=arc(az,1.79,1.5,Math.PI*1.5-w/1.5,Math.PI*1.5+w/1.5,8);
      const inner=pts.map(([z,y])=>[z,y+0.008]).reverse();put(TR,'steel',side([...pts,...inner],0.045,0),[x,-k*0.009,0])}
    for(const o of [-0.035,0.035])tube(TR,'steelL',[[x+o,0.27,az-0.04],[x+o,0.36,az-0.05],[x+o,0.41,az],[x+o,0.36,az+0.05],[x+o,0.27,az+0.04]],0.006,12,5);
    put(TR,'steel',RB(0.07,0.015,0.11,0.004),[x,0.262,az])}}
for(const az of AX){cx(TR,F,0.038,2*WX-0.18,[0,WR,az],14);
  for(const s of [-1,1]){const x=s*WX;
    cx(TR,'steel',0.105,0.07,[x-s*0.1,WR,az],22);cx(TR,'steel',0.06,0.04,[x-s*0.15,WR,az],14);
    // a 225/75R15 tyre with its tread, a silver modular wheel, five lug nuts and a hub cap
    // highway rib tread: three ribs between two grooves, the shoulders rounded into the sidewalls
    const tire=new T.LatheGeometry([[0.2,-0.1],[0.31,-0.108],[0.345,-0.095],[0.356,-0.07],[0.356,-0.03],[0.348,-0.027],[0.348,-0.017],[0.356,-0.014],
      [0.356,0.014],[0.348,0.017],[0.348,0.027],[0.356,0.03],[0.356,0.07],[0.345,0.095],[0.31,0.108],[0.2,0.1]].map(([r,y])=>new T.Vector2(r,y)),36);
    put(TR,'tire',tire,[x,WR,az],XR);
    cx(TR,'rim',0.19,0.17,[x,WR,az],28);const f=x+s*0.075;
    put(TR,'rim',CY(0.19,0.17,0.02,28),[f,WR,az],XR);put(TR,'steelL',CY(0.12,0.12,0.012,24),[f+s*0.008,WR,az],XR);
    for(let k=0;k<5;k++){const a=k/5*Math.PI*2;put(TR,'chrome',CY(0.011,0.011,0.03,6),[f+s*0.015,WR+Math.sin(a)*0.07,az+Math.cos(a)*0.07],XR)}
    for(let k=0;k<8;k++){const a=(k+0.5)/8*Math.PI*2;put(TR,'steel',CY(0.022,0.022,0.006,10),[f+s*0.009,WR+Math.sin(a)*0.145,az+Math.cos(a)*0.145],XR)}
    put(TR,'chrome',CY(0.035,0.04,0.035,16),[f+s*0.025,WR,az],XR)}}
// fenders over each pair of wheels: a smooth steel skirt round the tyres, a flat step on top, lamps front and back
for(const s of [-1,1]){const x=s*WX,za=AX[0],zb=AX[1],r=0.43;
  const outer=[...arc(zb,WR,r,Math.PI,Math.PI/2,8),...arc(za,WR,r,Math.PI/2,0,8)],inner=outer.map(([z,y])=>{const c=z<(za+zb)/2?zb:za,dz=z-c,dy=y-WR,l=Math.hypot(dz,dy);return [c+dz/l*(r-0.006),WR+dy/l*(r-0.006)]}).reverse();
  const top=outer.map(([z,y])=>[z,Math.min(y,0.79)]),topIn=inner.map(([z,y])=>[z,Math.min(y,0.784)]);
  put(TR,F,side([...top,...topIn],0.3,0.003),[x,0,0]);put(TR,F,RB(0.3,0.012,za-zb,0.004),[x,0.785,(za+zb)/2]);
  tube(TR,F,top.map(([z,y])=>[x+s*0.15,y,z]),0.008,40,5);
  put(TR,F,RB(0.012,0.2,0.4,0.004),[s*(HW+0.006),0.68,(za+zb)/2]);
  put(TR,'amber',RB(0.012,0.035,0.06,0.006),[x+s*0.156,0.72,za+0.18]);put(TR,'redL',RB(0.012,0.035,0.06,0.006),[x+s*0.156,0.72,zb-0.18])}
// rear lamps on the sill, side markers at the back corners, the plate bracket with its lamp; the wiring along a rail
for(const s of [-1,1]){put(TR,'black',RB(0.2,0.08,0.03,0.02),[s*0.82,0.47,U1-0.065]);put(TR,'redL',RB(0.18,0.06,0.012,0.02),[s*0.82,0.47,U1-0.083]);
  put(TR,'redL',RB(0.012,0.035,0.06,0.006),[s*(HW+0.022),0.5,U1+0.12]);put(TR,'amber',RB(0.012,0.035,0.06,0.006),[s*(HW+0.022),0.5,U0-0.12])}
put(TR,F,RB(0.32,0.17,0.012,0.004),[-0.45,0.4,U1-0.08]);put(TR,'black',RB(0.08,0.03,0.04,0.008),[-0.45,0.5,U1-0.09]);put(TR,'lens',RB(0.05,0.012,0.012,0.004),[-0.45,0.487,U1-0.1]);
tube(TR,'black',[[-0.12,0.42,-0.62],[-HW+0.08,0.42,-1.0],[-HW+0.08,0.42,-5.5],[-0.82,0.43,U1+0.03]],0.006,30,4);
// the ramps' hinges and the brackets they stand against when folded up
for(const s of [-1,1])for(const o of [-0.2,0.2]){put(TR,F,RB(0.04,0.06,0.07,0.006),[s*0.6+o,0.53,U1-0.02]);cx(TR,'steelL',0.016,0.05,[s*0.6+o,0.56,U1],10)}

// ---------- the ramps: channel rails, angle cleats, a tapered tip, the hinge knuckle and a handle ----------
for(const R of ['rampL','rampR']){const L=1.65;
  for(const s of [-1,1])put(R,RS,chan(0.07,0.035,0.005,-s,L-0.02),[s*0.225,-0.035,-L/2]);
  for(let z=-0.12;z>-L+0.12;z-=0.15)put(R,RS,along([[0,0],[0.025,0],[0.025,0.004],[0.004,0.004],[0.004,0.025],[0,0.025]],0.43),[0,0,z],[0,Math.PI/2,0]);
  put(R,RS,side([[-L,-0.008],[-L+0.14,-0.035],[-L+0.14,0],[-L,0]],0.46,0.002),[0,0,0]);
  for(const o of [-0.15,0,0.15])cx(R,RS,0.02,0.11,[o,-0.01,-0.02],12);
  put(R,RS,RB(0.44,0.012,0.04,0.004),[0,-0.03,-0.03]);
  tube(R,RS,[[-0.08,-0.04,-0.85],[-0.08,-0.09,-0.83],[0.08,-0.09,-0.83],[0.08,-0.04,-0.85]],0.009,16,5)}

// ---------- merge: one mesh per material, a node per part ----------
const root=new T.Group();root.name='tag';
for(const [part,mats] of Object.entries(parts)){const g=new T.Group();g.name=part;root.add(g);
  for(const [mat,list] of Object.entries(mats)){let m=BGU.mergeBufferGeometries(list);m=BGU.mergeVertices(m,1e-4);
    const mesh=new T.Mesh(m,new T.MeshStandardMaterial({name:mat}));mesh.name=part+'_'+mat.replace(/[^a-zA-Z0-9]/g,'');g.add(mesh)}}
return root}
