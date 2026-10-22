// Corley's Island: the detailed crawler dozer (Dexter's and Corley's, heavy.js kind 'dozer'), a high-drive machine of
// the D6 class, built from shapes and written out as models/dozer.glb by tools/build_model.js (three.js r147 in headless
// Chromium). The game loads it (js/models.js) in place of the kit-built dozer when Machine models are Detailed.
// The contract with the game, so a model made in Blender or bought can replace this one:
// - one node per moving part, each in that part's own frame (x right, y up, z forward, metres):
//   body: origin on the ground under the dozer's middle; tracks 2.1 m apart (x ±1.05), on the ground from z -1.45 to
//     1.45; the driver's eye (heavy.js K.eye) at y 2.35, z -0.6, so the cab is open to it through the glass;
//   blade: origin at the push arms' trunnions, 0.6 m up and 0.45 m ahead of the middle; the cutting edge 0.54 m below
//     and 1.75 m ahead of it (the game swings this node about its x axis to lift the blade);
//   ripper: origin 0.75 m up (with the shank up) and 2.05 m behind the middle; the tooth's tip 0.45 m below it (the game
//     slides this node up and down);
// - rams: empty nodes ram_<id>_a (the barrel's pin) in one part and ram_<id>_b (the rod's) in another, with extras r (the
//   barrel's radius), lb (the barrel's length ahead of its pin), bk (behind it, for a trunnion mount) and lr (the rod's
//   length); the game draws a hydraulic cylinder between each pair and keeps it pointing pin to pin as the parts move;
// - materials named for the game's: paintY (the yellow paint), steel, steelL, track, black, chrome, rubber, tint (the
//   glass), seat, mirror, lens, redL, amber, screen.
// Metres. Classic script, no modules.
function buildDozer(){
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
function tube(part,mat,pts,r,n){const c=new T.CatmullRomCurve3(pts.map(p=>new T.Vector3(...p)),false,'catmullrom',0.1);put(part,mat,new T.TubeGeometry(c,n||Math.max(8,pts.length*8),r,10,false))}
const arc=(cz,cy,r,a0,a1,n)=>Array.from({length:n+1},(_,i)=>{const a=a0+(a1-a0)*i/n;return [cz+Math.cos(a)*r,cy+Math.sin(a)*r]});
const anchor=(part,id,end,p,r)=>anchors.push({part,name:`ram_${id}_${end}`,p,r});
// a bolt head (hex) facing along an axis
const bolt=(part,p,r,ax)=>put(part,'steelL',CY(0.022,0.022,0.02,6),p,ax==='z'?ZR:ax==='x'?XR:[0,0,0]);
const B='body',Y='paintY';

// ---------- the tracks: idler, raised sprocket and rear idler, the rollers, and the chain of shoes round them ----------
// the track's pitch line runs round three wheels (z, y, r, as seen from the side) and along the bottom rollers
const TW=[[1.42,0.45,0.34],[-0.92,1.08,0.42],[-1.3,0.43,0.32]],TX=1.05,SHOE=0.56,PITCH=0.19;
// the loop: outer tangents between the wheels in turn, and the arcs round each (counter-clockwise from the side)
function loop(){const n=TW.length,seg=[];
  for(let i=0;i<n;i++){const [z1,y1,r1]=TW[i],[z2,y2,r2]=TW[(i+1)%n],dz=z2-z1,dy=y2-y1,L=Math.hypot(dz,dy),uz=dz/L,uy=dy/L,a=(r1-r2)/L,b=Math.sqrt(1-a*a);
    const nz=a*uz+b*uy,ny=a*uy-b*uz;seg.push({a:[z1+nz*r1,y1+ny*r1],b:[z2+nz*r2,y2+ny*r2],n:Math.atan2(ny,nz)})}
  const path=[];for(let i=0;i<n;i++){const s=seg[i],nx=seg[(i+1)%n],[cz,cy,r]=TW[(i+1)%n];path.push({line:[s.a,s.b]});
    let a0=s.n,a1=nx.n;while(a1<a0)a1+=Math.PI*2;path.push({arc:[cz,cy,r,a0,a1]})}
  return path}
// points along the loop at a spacing: position and travel direction
function along(path,step){const out=[];let carry=0;
  for(const p of path){let L,at;
    if(p.line){const [a,b]=p.line;L=Math.hypot(b[0]-a[0],b[1]-a[1]);at=t=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,Math.atan2(b[1]-a[1],b[0]-a[0])]}
    else{const [cz,cy,r,a0,a1]=p.arc;L=r*(a1-a0);at=t=>{const an=a0+(a1-a0)*t;return [cz+Math.cos(an)*r,cy+Math.sin(an)*r,an+Math.PI/2]}}
    for(let s=carry;s<L;s+=step)out.push(at(s/L));carry=(carry-L)%step;if(carry<0)carry+=step}
  return out}
const shoes=along(loop(),PITCH);
for(const sx of [-TX,TX]){
  for(const [z,y,dir] of shoes){const r=[-dir,0,0],oz=Math.sin(dir),oy=-Math.cos(dir);   // outward: right of the travel
    // the shoe plate and its grouser bar, then the chain's two links and the pin between them
    put(B,'track',BX(SHOE,0.025,PITCH-0.012),[sx,y+oy*0.05,z+oz*0.05],r);
    put(B,'track',BX(SHOE-0.02,0.055,0.03),[sx,y+oy*0.09+Math.sin(dir)*0.05,z+oz*0.09+Math.cos(dir)*0.05],r);
    for(const lx of [-0.17,0.17]){put(B,'steel',BX(0.06,0.09,PITCH-0.02),[sx+lx,y-oy*0.02,z-oz*0.02],r);
      put(B,'steelL',CY(0.035,0.035,0.08,8),[sx+lx*1.15,y,z],XR)}}
  // front and rear idlers (rims between the links), the sprocket with its teeth, and the final drive's hub
  for(const i of [0,2]){const [z,y,r]=TW[i];put(B,'steelL',CY(r-0.06,r-0.06,0.26,32),[sx,y,z],XR);
    for(const o of [-0.16,0.16])put(B,'steel',CY(r-0.1,r-0.1,0.06,32),[sx+o,y,z],XR);put(B,'steel',CY(0.1,0.1,0.42,16),[sx,y,z],XR)}
  {const [z,y,r]=TW[1];put(B,'steel',CY(r-0.07,r-0.07,0.22,36),[sx,y,z],XR);
    for(let k=0;k<17;k++){const a=k/17*Math.PI*2;put(B,'steelL',BX(0.2,0.07,0.08),[sx,y+Math.sin(a)*(r-0.02),z+Math.cos(a)*(r-0.02)],[a,0,0])}
    put(B,'steelL',CY(0.24,0.28,0.18,24),[sx-Math.sign(sx)*0.16,y,z],XR);
    for(let k=0;k<12;k++){const a=k/12*Math.PI*2;bolt(B,[sx+Math.sign(sx)*0.12,y+Math.sin(a)*0.17,z+Math.cos(a)*0.17],0,'x')}
    put(B,Y,CY(0.34,0.38,0.32,28),[sx-Math.sign(sx)*0.4,y,z],XR)}
  // the roller frame inside the loop: its box beam, the bottom rollers, a carrier roller and the guards
  put(B,Y,RB(0.36,0.3,2.3,0.03),[sx,0.42,0.05]);put(B,Y,side([[1.2,0.55],[-0.1,0.95],[-0.55,0.95],[-0.9,0.6],[-0.9,0.42],[1.2,0.42]],0.34,0.02),[sx,0,0]);
  for(let k=0;k<6;k++){const z=-0.92+k*0.39;put(B,'steelL',CY(0.11,0.11,0.42,18),[sx,0.235,z],XR);put(B,'steel',CY(0.07,0.07,0.46,12),[sx,0.235,z],XR)}
  put(B,'steel',RB(0.4,0.12,2.2,0.02),[sx,0.19,0.03]);
  for(const o of [-0.22,0.22])put(B,'steel',RB(0.03,0.16,2.1,0.01),[sx+o,0.28,0.03]);
  // the recoil spring's housing behind the front idler, and the equaliser bar's pivot
  put(B,'steel',CY(0.08,0.08,0.6,14),[sx,0.47,0.95],ZR);put(B,'steelL',CY(0.1,0.1,0.12,16),[sx-Math.sign(sx)*0.3,0.62,0.1],XR)}
// the equaliser bar across the front of the main frame, under the radiator
put(B,'steel',RB(2.1,0.14,0.22,0.03),[0,0.62,0.15]);

// ---------- main frame and engine: the case between the tracks, the hood with its louvres, the radiator guard ----------
put(B,Y,RB(1.36,0.65,2.9,0.04),[0,0.92,-0.02]);
put(B,'steel',RB(1.2,0.08,2.6,0.02),[0,0.56,0.0]);                   // belly guard
put(B,'steel',RB(1.3,0.4,0.3,0.03),[0,0.62,1.42]);for(const s of [-1,1])put(B,'steelL',CY(0.06,0.06,0.18,12),[s*0.32,0.62,1.6],ZR);  // front pull hooks
// the hood: sides, a crowned top falling slightly to the front, the side doors' louvres and hinges
put(B,Y,side([[0.05,1.2],[1.45,1.2],[1.45,1.92],[1.32,2.0],[0.15,2.08],[0.05,2.08]],1.3,0.035));
put(B,Y,side([[0.12,2.06],[1.36,1.98],[1.36,2.02],[0.12,2.11]],0.9,0.02));
for(const s of [-1,1]){put(B,'black',RB(0.02,0.42,0.86,0.02),[s*0.652,1.58,0.82]);
  for(let k=0;k<9;k++)put(B,Y,RB(0.05,0.022,0.84,0.008),[s*0.665,1.4+k*0.045,0.82],[0,0,s*0.5]);
  for(const z of [0.3,1.3])put(B,'steel',RB(0.025,0.06,0.06,0.01),[s*0.665,1.86,z]);put(B,'black',RB(0.02,0.04,0.12,0.01),[s*0.665,1.32,0.24])}
// the radiator guard: a heavy cast frame with a perforated grille and two headlamps in its top corners
put(B,Y,RB(1.46,0.16,0.18,0.03),[0,2.0,1.48]);put(B,Y,RB(1.46,0.14,0.18,0.03),[0,1.0,1.48]);
for(const s of [-1,1])put(B,Y,RB(0.16,1.14,0.18,0.03),[s*0.65,1.5,1.48]);
put(B,'black',BX(1.16,0.86,0.04),[0,1.5,1.45]);
for(let k=0;k<8;k++)put(B,'steel',BX(1.16,0.03,0.05),[0,1.13+k*0.105,1.5]);
for(let k=0;k<6;k++)put(B,'steel',BX(0.03,0.86,0.05),[-0.48+k*0.192,1.5,1.51]);
for(const s of [-1,1]){put(B,'black',RB(0.2,0.16,0.14,0.03),[s*0.5,2.16,1.42]);put(B,'lens',CY(0.06,0.06,0.03,16),[s*0.5,2.16,1.5],ZR)}
// on top: the exhaust stack with its rain cap, the air pre-cleaner bowl, a lifting eye
tube(B,'black',[[-0.32,2.06,0.62],[-0.32,2.4,0.62],[-0.32,2.72,0.6]],0.065);put(B,'black',CY(0.085,0.075,0.08,16),[-0.32,2.12,0.62]);
put(B,'steel',CY(0.075,0.075,0.02,16),[-0.32,2.77,0.6],[0.5,0,0]);
put(B,'black',CY(0.13,0.13,0.18,20),[0.34,2.18,0.9]);put(B,'black',CY(0.15,0.12,0.06,20),[0.34,2.3,0.9]);put(B,'tint',CY(0.11,0.11,0.12,20),[0.34,2.15,0.9]);
put(B,'steel',new T.TorusGeometry(0.05,0.015,8,16),[0,2.14,1.1],[0,Math.PI/2,0]);

// ---------- fenders, walkways, the steps and rails beside the cab ----------
for(const s of [-1,1]){const x=s*1.05;
  put(B,Y,RB(0.68,0.05,1.65,0.02),[x,1.66,-0.62]);put(B,Y,RB(0.05,0.18,1.65,0.02),[s*1.37,1.58,-0.62]);
  put(B,'track',RB(0.6,0.012,1.55,0.004),[x,1.69,-0.62]);                    // non-slip tread on the walkway
  put(B,Y,side([[0.2,1.66],[-0.1,1.66],[0.2,1.3]],0.06,0.01),[s*0.75,0,0]);
  // the step up from the track, the grab rail along the cab's front corner, the rear handrail round the fender
  put(B,'track',RB(0.36,0.03,0.22,0.01),[s*1.2,1.05,0.3]);tube(B,'black',[[s*1.06,1.05,0.3],[s*1.08,1.4,0.24],[s*1.1,1.66,0.18]],0.016);
  tube(B,Y,[[s*0.78,1.7,0.06],[s*0.79,2.3,0.1],[s*0.8,2.6,0.08]],0.022);
  tube(B,Y,[[s*1.32,1.68,0.15],[s*1.33,2.15,0.12],[s*1.33,2.15,-1.3],[s*1.32,1.68,-1.4]],0.02,40);
  // the fuel and hydraulic tanks' shrouds at the back corners
  put(B,Y,RB(0.5,0.6,0.32,0.05),[s*0.95,1.98,-1.3])}

// ---------- the ROPS cab: lower body, four posts, glass all round, the roof with its lamps and beacon ----------
const CZ=-0.62,CW=1.46,CL=1.42,C0=1.7,C1=2.86;
for(const s of [-1,1]){put(B,Y,RB(0.05,0.42,CL,0.015),[s*(CW/2-0.025),1.5,CZ]);put(B,Y,RB(CW,0.42,0.05,0.015),[0,1.5,CZ+s*(CL/2-0.025)])}
for(const sx of [-1,1])for(const sz of [-1,1])put(B,Y,RB(0.09,C1-C0,0.09,0.02),[sx*(CW/2-0.045),(C0+C1)/2,CZ+sz*(CL/2-0.045)]);
// the glass, as panes: the front one raked forward a touch, doors each side, the rear window
put(B,'tint',BX(CW-0.16,C1-C0-0.06,0.02),[0,(C0+C1)/2,CZ+CL/2-0.03]);put(B,'tint',BX(CW-0.16,C1-C0-0.06,0.02),[0,(C0+C1)/2,CZ-CL/2+0.03]);
for(const s of [-1,1]){put(B,'tint',BX(0.02,C1-C0-0.06,CL-0.16),[s*(CW/2-0.03),(C0+C1)/2,CZ]);
  // door frame, its middle bar, hinges and handle; the mirror on its arm
  put(B,Y,RB(0.04,0.05,CL-0.1,0.01),[s*(CW/2-0.01),C0+0.42,CZ]);put(B,Y,RB(0.04,0.06,0.06,0.01),[s*(CW/2-0.01),C0+0.42,CZ+0.05]);
  put(B,'black',RB(0.03,0.04,0.16,0.01),[s*(CW/2+0.01),C0+0.3,CZ-0.35]);for(const y of [C0+0.15,C1-0.15])put(B,'steel',CY(0.018,0.018,0.08,8),[s*(CW/2+0.005),y,CZ+0.6]);
  tube(B,'black',[[s*(CW/2),C1-0.1,CZ+CL/2-0.05],[s*(CW/2+0.18),C1-0.05,CZ+CL/2+0.02],[s*(CW/2+0.26),C1-0.12,CZ+CL/2+0.04]],0.014);
  put(B,'black',RB(0.05,0.26,0.18,0.03),[s*(CW/2+0.27),C1-0.26,CZ+CL/2+0.04]);put(B,'mirror',BX(0.01,0.22,0.15),[s*(CW/2+0.27),C1-0.26,CZ+CL/2+0.01])}
// glazing bars and seals round each pane
for(const sz of [-1,1]){put(B,'black',RB(CW-0.1,0.03,0.03,0.01),[0,C0+0.03,CZ+sz*(CL/2-0.02)]);put(B,'black',RB(CW-0.1,0.03,0.03,0.01),[0,C1-0.03,CZ+sz*(CL/2-0.02)])}
// the roof: an overhanging canopy, its drip rail, two lamps each end, the amber beacon and the radio aerial
put(B,Y,RB(CW+0.14,0.12,CL+0.16,0.04),[0,C1+0.06,CZ]);put(B,Y,RB(CW-0.1,0.05,CL-0.1,0.03),[0,C1+0.14,CZ]);
for(const sz of [-1,1])for(const sx of [-1,1]){put(B,'black',RB(0.16,0.12,0.1,0.02),[sx*0.48,C1+0.08,CZ+sz*(CL/2+0.11)]);put(B,'lens',BX(0.12,0.08,0.01),[sx*0.48,C1+0.08,CZ+sz*(CL/2+0.16)])}
put(B,'black',CY(0.08,0.09,0.05,16),[0.45,C1+0.19,CZ-0.3]);put(B,'amber',CY(0.065,0.07,0.12,16),[0.45,C1+0.27,CZ-0.3]);
put(B,'black',CY(0.006,0.008,0.6,6),[-0.55,C1+0.45,CZ-0.55]);
// the wipers: front and back
for(const sz of [-1,1])put(B,'black',RB(0.02,0.55,0.02,0.005),[0.15,C0+0.36,CZ+sz*(CL/2+0.005)],[0,0,0.5]);

// ---------- inside, seen from the seat: the floor, the suspension seat with its armrest pods and joysticks, the dash ----------
const F=C0-0.38;put(B,'black',RB(CW-0.1,0.04,CL-0.1,0.01),[0,F,CZ]);
put(B,'seat',RB(0.52,0.12,0.5,0.05),[0,F+0.3,CZ-0.12]);put(B,'seat',RB(0.5,0.62,0.12,0.05),[0,F+0.68,CZ-0.4],[-0.12,0,0]);
put(B,'seat',RB(0.3,0.16,0.08,0.04),[0,F+1.06,CZ-0.46]);put(B,'black',CY(0.12,0.16,0.22,12),[0,F+0.13,CZ-0.12]);
for(const s of [-1,1]){put(B,'black',RB(0.13,0.1,0.42,0.03),[s*0.34,F+0.45,CZ-0.07]);put(B,'black',CY(0.016,0.02,0.12,8),[s*0.34,F+0.56,CZ+0.04]);
  put(B,'black',new T.SphereGeometry(0.035,10,8),[s*0.34,F+0.64,CZ+0.05])}
put(B,'black',RB(0.9,0.36,0.16,0.04),[0,F+0.2,CZ+CL/2-0.15]);put(B,'black',RB(0.26,0.2,0.08,0.02),[0.36,C0+0.12,CZ+CL/2-0.2],[-0.4,0,0]);
put(B,'screen',BX(0.22,0.15,0.01),[0.36,C0+0.13,CZ+CL/2-0.245],[-0.4,0,0]);
for(const s of [-1,1])put(B,'black',RB(0.08,0.08,0.3,0.03),[s*0.15,F+0.12,CZ+0.36],[0.4,0,0]);  // the decel and brake pedals

const RIP={r:0.065,lb:0.55,lr:0.6,bk:0.2};
// ---------- the back: fuel tank, tail lamps, the ripper's mounting frame and drawbar ----------
put(B,Y,RB(1.5,0.78,0.42,0.05),[0,1.55,-1.6]);put(B,'steel',CY(0.07,0.07,0.06,16),[0.5,1.97,-1.55]);
for(const s of [-1,1]){put(B,'black',RB(0.18,0.14,0.08,0.02),[s*0.6,1.75,-1.84]);put(B,'redL',BX(0.14,0.06,0.01),[s*0.6,1.79,-1.88]);
  put(B,'lens',BX(0.14,0.05,0.01),[s*0.6,1.71,-1.88])}
put(B,'steel',RB(1.3,0.5,0.25,0.03),[0,0.95,-1.62]);
for(const s of [-1,1]){put(B,'steel',side([[-1.5,0.55],[-1.82,0.55],[-1.82,1.25],[-1.5,1.4]],0.1,0.01),[s*0.48,0,0]);
  put(B,'steel',side([[-1.8,1.8],[-1.92,1.88],[-1.92,2.02],[-1.8,2.04]],0.12,0.01),[s*0.36,0,0]);   // the ripper cylinders' upper lugs
  put(B,'steelL',CY(0.05,0.05,0.16,12),[s*0.48,0.7,-1.72],XR);put(B,'steelL',CY(0.05,0.05,0.16,12),[s*0.48,1.15,-1.72],XR);
  anchor(B,'rip'+(s<0?'L':'R'),'a',[s*0.36,1.95,-1.88],RIP)}

// ---------- the blade (its own frame, swung on the trunnions) ----------
const L='blade';
// a semi-U blade: a curved moldboard, the box beam across its back, end bits and the bolted cutting edge
const prof=[];for(let k=0;k<=14;k++){const t=k/14,y=-0.52+t*1.12;prof.push([1.74-0.2*Math.sin(Math.PI*t)-0.1*t,y])}
const moldF=prof,moldB=prof.slice().reverse().map(([z,y])=>[z-0.045,y]);
put(L,Y,side([...moldF,...moldB],2.52,0.01));
// the wings, angled forward (pivoting on the moldboard's ends), each with its own cutting edge and end bit
const wing=(s,g,p)=>{g.translate(s*0.2,0,-1.7);g.rotateY(-s*0.32);g.translate(s*1.26,0,1.7);put(L,p,g)};
for(const s of [-1,1]){wing(s,side([...moldF,...moldB],0.4,0.01),Y);wing(s,new T.BoxGeometry(0.4,0.18,0.05).translate(0,-0.48,1.7),'steel');
  wing(s,side([[1.72,-0.52],[1.4,-0.42],[1.38,0.5],[1.62,0.6]],0.04,0.005).translate(s*0.2,0,0),Y)}
put(L,Y,RB(2.4,0.28,0.2,0.03),[0,0.3,1.45]);put(L,Y,RB(2.4,0.22,0.18,0.03),[0,-0.32,1.52]);
for(let k=-3;k<=3;k++)put(L,Y,side([[1.62,-0.5],[1.42,-0.3],[1.38,0.4],[1.56,0.56]],0.04,0.005),[k*0.4,0,0]);
put(L,'steel',RB(2.52,0.18,0.05,0.01),[0,-0.48,1.7]);put(L,'steel',RB(2.52,0.02,0.07,0.008),[0,-0.56,1.71]);
for(let k=0;k<13;k++)put(L,'steelL',CY(0.022,0.022,0.02,6),[-1.2+k*0.2,-0.47,1.735],ZR);
// the spill guard along the top
put(L,Y,RB(1.4,0.22,0.04,0.01),[0,0.7,1.56],[-0.2,0,0]);for(const s of [-1,1])put(L,Y,RB(0.04,0.2,0.18,0.01),[s*0.6,0.62,1.52]);
// the push arms from the trunnions to the blade, their diagonal brace and the tilt cylinder on the right
for(const s of [-1,1]){const x=s*1.45;
  put(L,Y,side([[0.15,-0.16],[1.42,-0.38],[1.42,0.12],[0.15,0.16],[-0.08,0.0]],0.2,0.02),[x,0,0]);
  put(L,'steel',CY(0.16,0.16,0.28,20),[x,0,0],XR);put(L,'steelL',CY(0.08,0.08,0.32,12),[x,0,0],XR);
  put(L,'steel',RB(0.32,0.34,0.3,0.03),[s*1.32,-0.1,1.38])}
tube(L,Y,[[-1.35,-0.05,0.9],[-0.6,0.15,1.34]],0.07);tube(L,Y,[[1.35,-0.05,0.9],[0.7,0.3,1.36]],0.06);
put(L,'chrome',CY(0.035,0.035,0.42,12),[0.96,0.17,1.18],[0,0,1.1]);
// the lift cylinders' lugs on the blade's back
// the lift cylinders: trunnion-mounted on the hood's sides, their rods down to lugs on the blade's back
const LIFT={r:0.075,lb:0.62,lr:0.9,bk:0.3};
for(const s of [-1,1]){const id='lift'+(s<0?'L':'R');
  put(L,'steel',side([[1.4,0.1],[1.16,0.35],[1.16,0.55],[1.4,0.55]],0.12,0.01),[s*0.84,0,0]);anchor(L,id,'b',[s*0.84,0.45,1.25],LIFT);
  put(B,Y,RB(0.16,0.3,0.36,0.03),[s*0.71,1.95,0.75]);put(B,'steelL',CY(0.06,0.06,0.12,14),[s*0.78,1.95,0.75],XR);anchor(B,id,'a',[s*0.84,1.95,0.75],LIFT)}

// ---------- the ripper (its own frame, slid up and down) ----------
const R='ripper';
put(R,'steel',RB(1.3,0.26,0.32,0.03),[0,0.62,0]);put(R,'steel',RB(0.3,0.42,0.36,0.03),[0,0.52,0]);
for(const s of [-1,1]){put(R,'steel',RB(0.1,0.12,0.6,0.02),[s*0.48,0.62,0.32],[0.25,0,0]);put(R,'steelL',CY(0.05,0.05,0.14,12),[s*0.48,0.62,0],XR);
  put(R,'steel',side([[0.1,0.5],[0.24,0.56],[0.24,0.68],[0.1,0.74]],0.1,0.01),[s*0.36,0,0]);anchor(R,'rip'+(s<0?'L':'R'),'b',[s*0.36,0.62,0.17],RIP)}
// the curved shank through the beam's pocket, its tooth and the shin guard, the pin and its keeper
put(R,'steel',side([[0.12,0.86],[-0.12,0.86],[-0.12,-0.05],[-0.05,-0.25],[0.08,-0.36],[0.18,-0.38],[0.12,-0.2],[0.12,-0.0]],0.1,0.012));
put(R,'steelL',side([[0.1,-0.24],[0.17,-0.37],[0.22,-0.46],[0.14,-0.42],[0.06,-0.32]],0.11,0.008));
put(R,'steelL',RB(0.11,0.4,0.03,0.008),[0,0.0,0.13],[-0.1,0,0]);put(R,'steelL',CY(0.03,0.03,0.36,10),[0,0.66,0],XR);

// ---------- merge: one mesh per material, a node per part, the rams' anchors ----------
const root=new T.Group();root.name='dozer';const groups={};
for(const [part,mats] of Object.entries(parts)){const g=new T.Group();g.name=part;root.add(g);groups[part]=g;
  for(const [mat,list] of Object.entries(mats)){let m=BGU.mergeBufferGeometries(list);m=BGU.mergeVertices(m,1e-4);
    const mesh=new T.Mesh(m,new T.MeshStandardMaterial({name:mat}));mesh.name=part+'_'+mat;g.add(mesh)}}
for(const a of anchors){const o=new T.Object3D();o.name=a.name;o.position.set(...a.p);o.userData=Object.assign({},a.r);groups[a.part].add(o)}
return root}
