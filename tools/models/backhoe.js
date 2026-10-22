// Corley's Island: the detailed backhoe loader (Corley's, backhoe.js), a 420-class machine: a loader bucket up front,
// outriggers and a swinging hoe at the back worked from the swivelled seat. Built from shapes and written out as
// models/backhoe.glb by tools/build_model.js (three.js r147 in headless Chromium). The game loads it (js/models.js) in
// place of the kit-built backhoe when Machine models are Detailed.
// The contract with the game, so a model made in Blender or bought can replace this one:
// - one node per moving part, each in that part's own frame (x right, y up, z forward, metres):
//   body: origin on the ground under the middle of the 2.2 m wheelbase (axles at z 1.1 and -1.1);
//   wFL wFR wRL wRR: the wheels, origin at their centres (front: 0.48 m radius at x ±0.92, rear: 0.68 m at x ±0.98);
//   arm: the loader arms, origin at their pivots (y 2.05, z 0.3), running 3.0 m along z to the bucket hinge;
//   bucket: origin at its hinge, the cutting edge 0.85 m ahead and 0.43 m below;
//   seat: the swivel seat, origin on the cab floor (y 1.3, z -0.75), facing +z (the game turns it about y);
//   swing: the hoe's swing casting, origin on the kingpost (y 1.05, z -2.45), turned about y;
//   boom: origin at its foot pin (swing 0, 0.15, -0.35), running back along -z to the stick pin at (0, 0.5, -3.05);
//   stick: origin at that pin, hanging 2.05 m down -y to the bucket pin;
//   hoe: the hoe bucket, origin at its pin, mouth toward +z, the teeth at (0, -0.8, 0.4);
//   legL legR: the outriggers, origin at their pivots (x ±0.75, y 1.2, z -2.2), hanging 1.55 m down -y to the pads;
//   padL padR: the pads, origin at the leg's end (kept level by the game).
// - rams: empty nodes ram_<id>_a / ram_<id>_b with extras r, lb, bk, lr (as tools/models/loader.js);
// - materials named for the game's: paintY, steel, steelL, black, chrome, tire, tint, seat, mirror, lens, redL, amber, screen.
// Metres. Classic script, no modules.
function buildBackhoe(){
const T=THREE,BGU=T.BufferGeometryUtils,parts={},anchors=[];
const mtx=new T.Matrix4(),q=new T.Quaternion(),e=new T.Euler();
function put(part,mat,g,p,r){g=g.index?g.toNonIndexed():g.clone();
  e.set(...(r||[0,0,0]));q.setFromEuler(e);mtx.compose(new T.Vector3(...(p||[0,0,0])),q,new T.Vector3(1,1,1));g.applyMatrix4(mtx);
  g.deleteAttribute('uv');for(const k of Object.keys(g.attributes))if(k!=='position'&&k!=='normal')g.deleteAttribute(k);
  ((parts[part]=parts[part]||{})[mat]=parts[part][mat]||[]).push(g);return g}
const RB=(w,h,d,r)=>new T.RoundedBoxGeometry(w,h,d,Math.max(w,h,d)>1.2?2:1,Math.min(r,w/2-1e-4,h/2-1e-4,d/2-1e-4));
const BX=(w,h,d)=>new T.BoxGeometry(w,h,d);
const CY=(rt,rb,h,n)=>new T.CylinderGeometry(rt,rb,h,n||20);
const XR=[0,0,Math.PI/2],ZR=[Math.PI/2,0,0];
function side(pts,w,bev){const s=new T.Shape();pts.forEach(([z,y],i)=>i?s.lineTo(z,y):s.moveTo(z,y));
  const b=bev||0,g=new T.ExtrudeGeometry(s,{depth:Math.max(0.002,w-2*b),bevelEnabled:b>0,bevelThickness:b,bevelSize:b,bevelSegments:2,curveSegments:16});
  g.rotateY(-Math.PI/2);g.translate((w-2*b)/2,0,0);return BGU.toCreasedNormals(g,0.6)}
function tube(part,mat,pts,r,n){const c=new T.CatmullRomCurve3(pts.map(p=>new T.Vector3(...p)),false,'catmullrom',0.1);put(part,mat,new T.TubeGeometry(c,n||Math.max(8,pts.length*8),r,8,false))}
const arc=(cz,cy,r,a0,a1,n)=>Array.from({length:n+1},(_,i)=>{const a=a0+(a1-a0)*i/n;return [cz+Math.cos(a)*r,cy+Math.sin(a)*r]});
const anchor=(part,id,end,p,o)=>anchors.push({part,name:`ram_${id}_${end}`,p,o});
const B='body',Y='paintY';

// ---------- wheels: industrial lug tyres on yellow rims; the fronts steer (their own nodes, spun by the game) ----------
function wheel(part,R,W,s,lugs){
  const prof=[[R*0.6,-W],[R*0.84,-W*1.04],[R*0.95,-W*0.92],[R*0.99,-W*0.55],[R*0.99,W*0.55],[R*0.95,W*0.92],[R*0.84,W*1.04],[R*0.6,W]];
  put(part,'tire',new T.LatheGeometry(prof.map(([r,y])=>new T.Vector2(r,y)),40),[0,0,0],XR);
  // the tread: angled bars from each shoulder toward the middle, staggered
  for(let k=0;k<lugs;k++){const a=k/lugs*Math.PI*2;for(const o of [-1,1]){const aa=a+(o>0?Math.PI/lugs:0);
    put(part,'tire',BX(W*0.95,0.055,W*0.32),[o*W*0.48,Math.sin(aa)*R,Math.cos(aa)*R],[aa+Math.PI/2,o*0.55,0])}}
  // the rim: a dished steel disc with its bead ring, the hub and its nuts
  put(part,Y,CY(R*0.6,R*0.6,W*1.7,28),[0,0,0],XR);put(part,Y,CY(R*0.5,R*0.5,0.03,28),[s*W*0.7,0,0],XR);
  put(part,Y,new T.TorusGeometry(R*0.6,0.02,6,32),[s*W*0.86,0,0],[0,Math.PI/2,0]);
  put(part,'steel',CY(R*0.2,R*0.24,0.14,18),[s*W*0.8,0,0],XR);put(part,'steelL',CY(R*0.12,R*0.12,0.06,14),[s*W*0.9,0,0],XR);
  for(let k=0;k<8;k++){const a=k/8*Math.PI*2;put(part,'steelL',CY(0.018,0.018,0.04,6),[s*W*0.86,Math.sin(a)*R*0.3,Math.cos(a)*R*0.3],XR)}}
wheel('wFL',0.48,0.15,-1,18);wheel('wFR',0.48,0.15,1,18);wheel('wRL',0.68,0.22,-1,22);wheel('wRR',0.68,0.22,1,22);
// the axles: the front one swinging on its centre pivot, the rear one's housings and the differential
put(B,'steel',CY(0.09,0.09,1.6,16),[0,0.48,1.1],XR);put(B,'steel',RB(0.4,0.26,0.36,0.04),[0,0.48,1.1]);
for(const s of [-1,1]){put(B,'steel',RB(0.14,0.26,0.2,0.03),[s*0.74,0.48,1.1]);put(B,'steelL',CY(0.035,0.035,0.34,10),[s*0.74,0.48,1.1])}
put(B,'steel',CY(0.13,0.15,1.5,18),[0,0.68,-1.1],XR);put(B,'steel',new T.SphereGeometry(0.28,18,12),[0,0.66,-1.1]);
for(const s of [-1,1])put(B,'steel',CY(0.17,0.13,0.18,18),[s*0.72,0.68,-1.1],XR);

// ---------- the frame: side rails nose to tail, the front counterweight and grille, the engine hood ----------
for(const s of [-1,1])put(B,'steel',RB(0.12,0.3,4.5,0.02),[s*0.4,0.75,-0.2]);
put(B,'steel',RB(0.9,0.12,1.1,0.02),[0,0.62,-0.2]);
// the nose: a cast counterweight with the tow pin, the grille above it
put(B,Y,side([[2.0,0.55],[2.32,0.6],[2.38,0.8],[2.36,1.12],[2.0,1.12]],0.98,0.03));
put(B,'steelL',CY(0.04,0.04,0.2,10),[0,0.72,2.38]);put(B,'black',RB(0.24,0.12,0.06,0.02),[0,0.72,2.37]);
// the hood: high at the cab, falling to the nose, louvres down both sides and a grille in front
put(B,Y,side([[0.3,0.85],[2.12,0.85],[2.2,1.1],[2.16,1.45],[1.95,1.58],[0.9,1.7],[0.3,1.74]],0.92,0.04));
put(B,'black',RB(0.7,0.42,0.03,0.02),[0,1.25,2.19],[0.12,0,0]);for(let k=0;k<8;k++)put(B,'steel',BX(0.68,0.02,0.04),[0,1.07+k*0.05,2.2],[0.12,0,0]);
for(const s of [-1,1]){put(B,'black',RB(0.02,0.36,0.9,0.02),[s*0.46,1.25,1.3]);for(let k=0;k<7;k++)put(B,Y,RB(0.03,0.02,0.88,0.006),[s*0.47,1.1+k*0.048,1.3],[0,0,s*0.5]);
  // headlamps in the hood's front corners, the turn lamps beside them
  put(B,'black',RB(0.16,0.13,0.06,0.03),[s*0.33,1.48,2.06]);put(B,'lens',CY(0.05,0.05,0.02,14),[s*0.33,1.48,2.1],ZR);put(B,'amber',RB(0.05,0.05,0.02,0.01),[s*0.42,1.38,2.12])}
// the hood's seam, the filler cap and the exhaust stack and air pre-cleaner at the cab's front corners
put(B,'black',RB(0.9,0.01,0.02,0.004),[0,1.72,0.6]);put(B,'steelL',CY(0.05,0.05,0.04,12),[0.2,1.72,0.9]);
tube(B,'black',[[0.3,1.6,0.35],[0.3,2.4,0.35],[0.3,2.95,0.32]],0.055);put(B,'chrome',CY(0.06,0.065,0.1,14),[0.3,2.98,0.32],[0.3,0,0]);
put(B,'black',CY(0.04,0.04,0.7,10),[-0.3,2.0,0.35]);put(B,'black',CY(0.11,0.11,0.2,18),[-0.3,2.42,0.35]);put(B,'tint',CY(0.09,0.09,0.12,18),[-0.3,2.42,0.35]);

// ---------- the loader tower: side plates carrying the arms' pivots and the lift cylinders' feet ----------
for(const s of [-1,1]){put(B,Y,side([[0.05,0.85],[0.62,0.85],[0.62,1.4],[0.45,2.12],[0.15,2.18],[0.05,1.9]],0.08,0.012),[s*0.56,0,0]);
  put(B,'steelL',CY(0.08,0.08,0.22,16),[s*0.62,2.05,0.3],XR);put(B,'steel',CY(0.045,0.045,0.28,10),[s*0.62,2.05,0.3],XR);
  put(B,'steel',RB(0.14,0.18,0.18,0.02),[s*0.62,0.82,0.6])}
const LIFT={r:0.07,lb:0.8,lr:0.75,bk:0.04},TILT={r:0.075,lb:0.5,lr:0.45,bk:0.04};
for(const s of [-1,1]){const id='lift'+(s<0?'L':'R');anchor(B,id,'a',[s*0.62,0.82,0.6],LIFT);anchor('arm',id,'b',[s*0.62,-0.2,1.3],LIFT)}

// ---------- the rear frame: fenders over the big wheels, the steps, the battery and tool boxes ----------
for(const s of [-1,1]){
  put(B,Y,side([...arc(-1.1,0.68,0.8,0.1,Math.PI-0.05,20),...arc(-1.1,0.68,0.76,Math.PI-0.05,0.1,20)],0.5,0.01),[s*0.98,0,0]);
  put(B,'black',RB(0.48,0.3,0.02,0.01),[s*0.98,0.35,-1.95]);
  // the tail and stop lamps on the fender's back
  put(B,'black',RB(0.16,0.1,0.05,0.02),[s*0.98,1.2,-1.86],[-0.7,0,0]);put(B,'redL',BX(0.12,0.07,0.01),[s*0.98,1.22,-1.89],[-0.7,0,0])}
// the step and grab handle on the left, ahead of the rear wheel
for(let k=0;k<2;k++)put(B,'steel',RB(0.3,0.03,0.2,0.008),[-0.92,0.45+k*0.38,-0.2]);
for(const s of [-1,1])put(B,'black',RB(0.02,0.42,0.02,0.005),[-0.92+s*0.14,0.62,-0.2]);
put(B,Y,RB(0.5,0.45,0.5,0.03),[0.98,0.95,-0.15]);put(B,'black',RB(0.46,0.02,0.46,0.01),[0.98,1.18,-0.15]);
tube(B,'black',[[-0.76,1.4,-0.05],[-0.82,1.9,-0.05],[-0.82,2.4,-0.05]],0.015);

// ---------- the cab: glass all round on four posts, a roof with work lamps front and back ----------
const CZ=-0.75,CW=1.5,CL=1.8,C0=1.25,C1=3.15,G0=C0+0.55;
put(B,Y,RB(CW,0.4,CL,0.04),[0,C0-0.15,CZ]);put(B,'black',RB(CW-0.06,0.03,CL-0.06,0.01),[0,C0+0.06,CZ]);
for(const s of [-1,1]){put(B,Y,RB(0.04,0.42,CL-0.1,0.01),[s*(CW/2-0.02),C0+0.25,CZ]);put(B,Y,RB(CW-0.1,0.5,0.04,0.01),[0,C0+0.3,CZ+s*(CL/2-0.02)])}
for(const sx of [-1,1])for(const sz of [-1,1])put(B,Y,RB(0.08,C1-C0-0.4,0.08,0.02),[sx*(CW/2-0.04),(C0+0.4+C1)/2,CZ+sz*(CL/2-0.04)]);
// the glass: the front screen, the doors (the right one split), the back window that opens over the hoe
put(B,'tint',BX(CW-0.14,C1-G0,0.02),[0,(G0+C1)/2,CZ+CL/2-0.03]);put(B,'tint',BX(CW-0.14,C1-G0+0.1,0.02),[0,(G0-0.1+C1)/2,CZ-CL/2+0.03]);
for(const s of [-1,1]){put(B,'tint',BX(0.02,C1-C0-0.45,CL-0.14),[s*(CW/2-0.03),(C0+0.45+C1)/2,CZ]);
  put(B,'black',RB(0.03,C1-C0-0.45,0.03,0.01),[s*(CW/2-0.02),(C0+0.45+C1)/2,CZ+0.25]);
  put(B,'steel',RB(0.03,0.03,0.16,0.01),[s*(CW/2+0.01),C0+1.0,CZ-0.1]);
  // mirrors on arms off the front posts
  tube(B,'black',[[s*(CW/2),C1-0.2,CZ+CL/2-0.04],[s*(CW/2+0.18),C1-0.12,CZ+CL/2+0.04],[s*(CW/2+0.26),C1-0.2,CZ+CL/2+0.06]],0.012);
  put(B,'black',RB(0.04,0.24,0.16,0.02),[s*(CW/2+0.27),C1-0.32,CZ+CL/2+0.06]);put(B,'mirror',BX(0.01,0.2,0.13),[s*(CW/2+0.27),C1-0.32,CZ+CL/2+0.03])}
for(const sz of [-1,1]){put(B,'black',RB(CW-0.08,0.03,0.03,0.01),[0,G0,CZ+sz*(CL/2-0.02)]);put(B,'black',RB(CW-0.08,0.03,0.03,0.01),[0,C1-0.02,CZ+sz*(CL/2-0.02)])}
put(B,'black',RB(0.02,0.7,0.02,0.005),[0.15,G0+0.38,CZ+CL/2+0.005],[0,0,0.5]);
// the roof: a drip edge all round, the work lamps and the beacon
put(B,Y,RB(CW+0.14,0.1,CL+0.18,0.04),[0,C1+0.05,CZ]);put(B,'paintY',RB(CW-0.1,0.06,CL-0.12,0.03),[0,C1+0.13,CZ]);
for(const sz of [-1,1])for(const sx of [-1,1]){put(B,'black',RB(0.15,0.11,0.09,0.02),[sx*0.5,C1+0.06,CZ+sz*(CL/2+0.12)]);put(B,'lens',BX(0.11,0.07,0.01),[sx*0.5,C1+0.06,CZ+sz*(CL/2+0.17)])}
put(B,'black',CY(0.08,0.09,0.05,16),[0.45,C1+0.18,CZ+0.4]);put(B,'amber',CY(0.06,0.07,0.12,16),[0.45,C1+0.27,CZ+0.4]);
// inside: the steering wheel, dash and display ahead; the hoe's two control levers behind the seat
const F=C0+0.05;put(B,'black',RB(0.5,0.5,0.18,0.03),[0,F+0.25,CZ+0.78]);put(B,'black',RB(0.12,0.5,0.12,0.03),[0,F+0.45,CZ+0.62],[0.4,0,0]);
put(B,'black',new T.TorusGeometry(0.18,0.02,8,28),[0,F+0.72,CZ+0.52],[-1.0,0,0]);put(B,'screen',BX(0.2,0.14,0.01),[-0.38,F+0.55,CZ+0.84],[-0.3,0,0]);
put(B,'black',RB(0.24,0.18,0.08,0.02),[-0.38,F+0.55,CZ+0.86],[-0.3,0,0]);
put(B,'black',RB(1.1,0.4,0.22,0.03),[0,F+0.2,CZ-0.78]);
for(const s of [-1,1]){put(B,'black',RB(0.18,0.2,0.24,0.03),[s*0.32,F+0.48,CZ-0.72]);
  put(B,'chrome',CY(0.012,0.012,0.36,8),[s*0.32,F+0.72,CZ-0.66],[0.25,0,0]);put(B,'black',new T.SphereGeometry(0.035,10,8),[s*0.32,F+0.9,CZ-0.62])}

// ---------- the swivel seat (its own node): suspension base, cushion, back, armrests with joysticks ----------
const S='seat';
put(S,'black',CY(0.14,0.18,0.26,14),[0,0.14,0]);put(S,'steel',RB(0.5,0.06,0.5,0.02),[0,0.3,0]);
put(S,'seat',RB(0.5,0.12,0.48,0.05),[0,0.4,0.02]);put(S,'seat',RB(0.48,0.56,0.12,0.05),[0,0.72,-0.22],[-0.12,0,0]);
put(S,'seat',RB(0.3,0.15,0.08,0.04),[0,1.06,-0.27]);
for(const s of [-1,1]){put(S,'black',RB(0.08,0.06,0.36,0.02),[s*0.3,0.56,0.0]);put(S,'black',RB(0.12,0.08,0.16,0.02),[s*0.3,0.56,0.16]);
  put(S,'black',CY(0.014,0.018,0.12,8),[s*0.3,0.64,0.2]);put(S,'black',new T.SphereGeometry(0.03,10,8),[s*0.3,0.71,0.21])}

// ---------- the hoe's mount: the stabiliser beam and the kingpost bracket the swing casting turns in ----------
put(B,Y,RB(1.62,0.55,0.4,0.04),[0,1.2,-2.18]);put(B,'steel',RB(1.3,0.08,0.7,0.02),[0,0.9,-1.85]);
put(B,Y,RB(1.1,0.5,0.55,0.04),[0,1.2,-1.75]);put(B,'black',RB(0.4,0.12,0.04,0.02),[0,1.36,-2.4]);
for(const y of [0.62,1.48]){put(B,Y,side([[-2.0,-0.06],[-2.6,-0.06],[-2.68,0],[-2.6,0.06],[-2.0,0.06]],0.62,0.01),[0,y,0]);put(B,'steelL',CY(0.1,0.1,0.14,18),[0,y,-2.45])}
for(const s of [-1,1]){put(B,'steel',RB(0.12,0.62,0.12,0.02),[s*0.38,1.75,-2.2]);put(B,'steelL',CY(0.06,0.06,0.16,12),[s*0.38,1.98,-2.2],XR);
  put(B,'steelL',CY(0.075,0.075,0.2,14),[s*0.75,1.2,-2.2],ZR);
  // the swing cylinders' feet, low beside the kingpost
  put(B,'steel',RB(0.14,0.12,0.18,0.02),[s*0.42,0.82,-2.1])}
const OUTR={r:0.06,lb:0.55,lr:0.55,bk:0.03},SWR={r:0.06,lb:0.45,lr:0.4,bk:0.03};
for(const s of [-1,1]){const k=s<0?'L':'R';anchor(B,'out'+k,'a',[s*0.38,1.98,-2.2],OUTR);anchor('leg'+k,'out'+k,'b',[s*-0.06,-0.6,0],OUTR);
  anchor(B,'sw'+k,'a',[s*0.42,0.82,-2.1],SWR);anchor('swing','sw'+k,'b',[s*0.22,-0.22,-0.12],SWR)}

// ---------- the outriggers (their own nodes): box legs swung out on pins, the pads under them ----------
for(const s of [-1,1]){const P='leg'+(s<0?'L':'R'),D='pad'+(s<0?'L':'R');
  put(P,Y,side([[-0.13,0.08],[0.13,0.08],[0.1,-1.45],[-0.1,-1.45]],0.2,0.015));put(P,'steelL',CY(0.08,0.08,0.24,14),[0,0,0],ZR);
  put(P,'steel',RB(0.24,0.12,0.22,0.02),[s*-0.06,-0.6,0]);put(P,'steelL',CY(0.05,0.05,0.24,12),[0,-1.5,0],ZR);
  // the pad: a ribbed steel plate on a pin (the street pad's rubber face up)
  put(D,'steel',RB(0.4,0.06,0.46,0.02),[0,-0.12,0]);for(const z of [-0.14,0,0.14])put(D,'steel',RB(0.34,0.04,0.025,0.01),[0,-0.15,z]);
  put(D,'steel',RB(0.14,0.12,0.2,0.02),[0,-0.04,0]);put(D,'black',RB(0.38,0.04,0.42,0.02),[0,-0.07,0])}

// ---------- the swing casting (its own node): turns on the kingpost, carries the boom's foot ----------
const W='swing';
put(W,Y,side([[0.12,0.44],[-0.2,0.44],[-0.5,0.32],[-0.52,-0.05],[-0.3,-0.45],[0.12,-0.45]],0.5,0.03));
put(W,'steelL',CY(0.11,0.11,0.95,18),[0,0,0]);for(const y of [-0.42,0.42])put(W,'steel',CY(0.13,0.13,0.06,18),[0,y,0]);
put(W,'steelL',CY(0.09,0.09,0.6,16),[0,0.15,-0.35],XR);put(W,'steel',RB(0.3,0.16,0.2,0.02),[0,-0.4,-0.18]);
for(const s of [-1,1])put(W,'steel',CY(0.05,0.05,0.12,10),[s*0.22,-0.22,-0.12],[0,0,0]);
const BOOMR={r:0.085,lb:0.8,lr:0.7,bk:0.05},DIPR={r:0.075,lb:0.85,lr:0.8,bk:0.05},HBKR={r:0.065,lb:0.8,lr:0.75,bk:0.05};
anchor(W,'boom','a',[0,-0.42,-0.18],BOOMR);

// ---------- the boom (its own node): a bent box section back from the foot pin to the stick pin ----------
const Bm='boom';
put(Bm,Y,side([[0.2,0.05],[0.06,0.24],[-1.0,0.76],[-1.75,0.98],[-2.6,0.86],[-3.2,0.64],[-3.26,0.42],[-3.0,0.3],[-1.75,0.56],[-1.0,0.4],[0.06,-0.2],[0.2,-0.12]],0.3,0.03));
put(Bm,'steelL',CY(0.1,0.1,0.38,16),[0,0,0],XR);put(Bm,'steelL',CY(0.09,0.09,0.4,16),[0,0.5,-3.05],XR);
put(Bm,'steel',RB(0.36,0.14,0.24,0.02),[0,0.3,-1.1]);put(Bm,'steel',RB(0.34,0.16,0.24,0.02),[0,1.06,-1.6]);
anchor(Bm,'boom','b',[0,0.3,-1.1],BOOMR);anchor(Bm,'dip','a',[0,1.08,-1.6],DIPR);
// the hoses along the boom's top, to the stick and bucket cylinders
for(const s of [-1,1])tube(Bm,'black',[[s*0.09,0.3,0.0],[s*0.09,0.84,-1.0],[s*0.09,1.06,-1.75],[s*0.09,0.94,-2.6],[s*0.09,0.85,-3.0],[s*0.06,0.95,-3.15]],0.022,40);

// ---------- the stick (its own node): hangs from the boom's tip; the bucket cylinder along its back ----------
const Sk='stick';
put(Sk,Y,side([[0.14,0.68],[0.14,0.05],[0.1,-1.2],[0.08,-2.1],[-0.1,-2.16],[-0.13,-1.2],[-0.18,0.05],[-0.12,0.68]],0.24,0.02));
put(Sk,'steelL',CY(0.08,0.08,0.3,14),[0,0,0],XR);put(Sk,'steelL',CY(0.07,0.07,0.32,14),[0,-2.05,0],XR);
put(Sk,'steel',RB(0.26,0.12,0.16,0.02),[0,0.62,0.04]);put(Sk,'steel',RB(0.26,0.12,0.14,0.02),[0,0.3,-0.2]);
anchor(Sk,'dip','b',[0,0.62,0.06],DIPR);anchor(Sk,'hbk','a',[0,0.3,-0.22],HBKR);
for(const s of [-1,1])tube(Sk,'black',[[s*0.08,0.72,-0.05],[s*0.13,0.55,-0.18],[s*0.13,0.25,-0.22]],0.02,16);

// ---------- the hoe bucket (its own node): a curved shell with side cutters and four teeth ----------
const H='hoe',HW=0.62;
const shell=[[0.14,0.14],[-0.14,0.12],[-0.3,-0.18],[-0.32,-0.5],[-0.16,-0.76],[0.06,-0.86],[0.36,-0.82],[0.36,-0.77],[0.06,-0.8],[-0.12,-0.71],[-0.26,-0.48],[-0.24,-0.2],[-0.1,0.06],[0.12,0.08]];
put(H,Y,side(shell,HW-0.04,0.008));
for(const s of [-1,1]){put(H,Y,side([[0.14,0.16],[-0.15,0.14],[-0.32,-0.18],[-0.34,-0.5],[-0.17,-0.79],[0.06,-0.89],[0.4,-0.84]],0.025,0.006),[s*(HW/2-0.01),0,0]);
  put(H,'steelL',RB(0.03,0.3,0.06,0.01),[s*(HW/2+0.005),-0.62,0.3],[0.9,0,0])}
for(let k=0;k<4;k++){const x=(k-1.5)*0.17;put(H,'steelL',RB(0.07,0.05,0.16,0.012),[x,-0.8,0.42],[-0.25,0,0]);put(H,'steel',RB(0.05,0.03,0.07,0.008),[x,-0.82,0.52],[-0.25,0,0])}
put(H,'steelL',CY(0.075,0.075,HW,14),[0,0,0],XR);put(H,'steel',RB(0.2,0.14,0.14,0.02),[0,0.2,-0.25]);
anchor(H,'hbk','b',[0,0.2,-0.25],HBKR);

// ---------- the loader arms (their own node): bowed plates joined by a cross tube carrying the tilt cylinder ----------
const A='arm',AL=3.0;
for(const s of [-1,1]){put(A,Y,side([[-0.14,0.1],[0.2,0.2],[1.5,0.34],[2.3,0.26],[AL+0.12,0.1],[AL+0.14,-0.12],[2.3,-0.02],[1.5,0.06],[0.2,-0.16],[-0.14,-0.08]],0.12,0.02),[s*0.62,0,0]);
  put(A,'steelL',CY(0.08,0.08,0.18,16),[s*0.62,0,0],XR);put(A,'steelL',CY(0.08,0.08,0.18,16),[s*0.62,0,AL],XR);
  put(A,'steel',RB(0.08,0.16,0.2,0.02),[s*0.62,-0.16,1.3])}
put(A,Y,CY(0.09,0.09,1.24,18),[0,0.45,2.0],XR);put(A,'steel',RB(0.24,0.2,0.22,0.02),[0,0.5,2.0]);
for(const s of [-1,1])put(A,Y,RB(0.12,0.4,0.2,0.02),[s*0.62,0.28,2.0]);
anchor(A,'tilt','a',[0,0.5,2.0],TILT);

// ---------- the loader bucket (its own node): curved back and floor, the top plate, side plates, a bolt-on edge ----------
const K='bucket',BW=2.3;
put(K,Y,side([[0.02,0.3],[-0.12,0.05],[-0.14,-0.2],[-0.06,-0.38],[0.12,-0.45],[0.85,-0.45],[0.87,-0.41],[0.14,-0.4],[-0.04,-0.33],[-0.08,-0.05],[0.04,0.24]],BW-0.04,0.008));
put(K,Y,side([[0.02,0.3],[0.38,0.32],[0.4,0.26],[0.04,0.24]],BW-0.04,0.008));
for(const s of [-1,1])put(K,Y,side([[0.02,0.33],[0.4,0.34],[0.9,-0.44],[0.12,-0.48],[-0.16,-0.25],[-0.15,0.1]],0.03,0.006),[s*(BW/2-0.01),0,0]);
put(K,'steelL',RB(BW,0.035,0.16,0.01),[0,-0.45,0.86]);for(let k=0;k<10;k++)put(K,'steel',CY(0.018,0.018,0.02,6),[-1.0+k*0.222,-0.425,0.82]);
for(const x of [-0.7,0,0.7])put(K,'steelL',RB(0.1,0.03,0.55,0.01),[x,-0.47,0.45]);
for(const s of [-1,1]){put(K,Y,side([[-0.14,0.1],[0.06,0.16],[0.06,-0.16],[-0.14,-0.12]],0.12,0.01),[s*0.62,0,0]);put(K,'steelL',CY(0.065,0.065,0.18,14),[s*0.62,0,0],XR)}
put(K,'steel',RB(0.22,0.2,0.14,0.02),[0,0.4,-0.02]);anchor(K,'tilt','b',[0,0.4,-0.02],TILT);

// ---------- merge: one mesh per material, a node per part, the rams' anchors ----------
const root=new T.Group();root.name='backhoe';const groups={};
for(const [part,mats] of Object.entries(parts)){const g=new T.Group();g.name=part;root.add(g);groups[part]=g;
  for(const [mat,list] of Object.entries(mats)){let m=BGU.mergeBufferGeometries(list);m=BGU.mergeVertices(m,1e-4);
    const mesh=new T.Mesh(m,new T.MeshStandardMaterial({name:mat}));mesh.name=part+'_'+mat;g.add(mesh)}}
for(const a of anchors){const o=new T.Object3D();o.name=a.name;o.position.set(...a.p);o.userData=Object.assign({},a.o);groups[a.part].add(o)}
return root}
