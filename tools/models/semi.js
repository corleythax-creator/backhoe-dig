// Corley's Island: the detailed semi (Dexter's and Corley's, heavy.js kind 'semi'), a long-hood day-cab tractor in red
// with its lowboy trailer, built from shapes and written out as models/semi.glb by tools/build_model.js (three.js r147
// in headless Chromium). The game loads it (js/models.js) in place of the kit-built semi when Machine models are Detailed.
// The contract with the game, so a model made in Blender or bought can replace this one:
// - one node per part, each in that part's own frame (x right, y up, z forward, metres):
//   body: the tractor, origin on the ground under its middle; the steer axle at z 3.4, the drive tandem at z -1.1 and
//     -2.4, 1.1 m tyres, the fifth wheel's plate 1.36 m up at z -1.8; the driver's eye (heavy.js K.eye) at x 0.5, 2.9 m
//     up, z 1.7, so the cab is open to it through the glass;
//   trailer: the lowboy, origin on the ground under its kingpin (the game swings it there behind the tractor); its
//     upper coupler 1.36 m up, the well deck from z -2.9 to -10.3, the three axles at z -12, -13.2 and -14.4;
// - materials named for the game's: paintR (the red paint), black, steel, steelL, chrome, rim, tire, tint (the glass),
//   deck (the trailer's oak planks), seat, mirror, lens, redL, amber.
// Metres. Classic script, no modules.
function buildSemi(){
const T=THREE,BGU=T.BufferGeometryUtils,parts={};
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
  const b=bev||0,g=new T.ExtrudeGeometry(s,{depth:Math.max(0.002,w-2*b),bevelEnabled:b>0,bevelThickness:b,bevelSize:b,bevelSegments:3,curveSegments:16});
  g.rotateY(-Math.PI/2);g.translate((w-2*b)/2,0,0);return BGU.toCreasedNormals(g,0.6)}
function tube(part,mat,pts,r,n){const c=new T.CatmullRomCurve3(pts.map(p=>new T.Vector3(...p)),false,'catmullrom',0.1);put(part,mat,new T.TubeGeometry(c,n||Math.max(8,pts.length*8),r,10,false))}
const arc=(cz,cy,r,a0,a1,n)=>Array.from({length:n+1},(_,i)=>{const a=a0+(a1-a0)*i/n;return [cz+Math.cos(a)*r,cy+Math.sin(a)*r]});
const B='body',P='paintR';

// ---------- wheels: tyres with rib and drive treads, polished aluminium wheels, hubs and lug nuts ----------
function wheel(part,x,y,z,r,w,s,drive,outer){
  const t=new T.LatheGeometry([[r*0.55,-w/2],[r*0.86,-w/2-0.005],[r*0.97,-w/2+0.02],[r,-w/2+0.05],[r,w/2-0.05],[r*0.97,w/2-0.02],[r*0.86,w/2+0.005],[r*0.55,w/2]].map(([a,b])=>new T.Vector2(a,b)),32);
  put(part,'tire',t,[x,y,z],XR);
  if(drive)for(let k=0;k<22;k++){const a=k/22*Math.PI*2;for(const o of [-1,1])put(part,'tire',BX(w*0.42,0.025,0.06),[x+o*w*0.24,y+Math.sin(a+(o>0?0.12:0))*(r+0.004),z+Math.cos(a+(o>0?0.12:0))*(r+0.004)],[a,0,0])}
  else for(const o of [-0.33,0.33])put(part,'tire',new T.TorusGeometry(r-0.004,0.008,3,32),[x+o*w*0.5,y,z],[0,Math.PI/2,0]);
  if(!outer)return;
  // the wheel's face: a dished polished disc, its hand holes, the hub and its cap, ten lug nuts
  put(part,'chrome',CY(r*0.6,r*0.6,0.03,24),[x+s*(w/2-0.03),y,z],XR);put(part,'chrome',CY(r*0.38,r*0.46,0.05,32),[x+s*(w/2-0.005),y,z],XR);
  for(let k=0;k<10;k++){const a=k/10*Math.PI*2;put(part,'black',CY(0.035,0.035,0.012,8),[x+s*(w/2-0.012),y+Math.sin(a)*r*0.5,z+Math.cos(a)*r*0.5],XR);
    put(part,'chrome',CY(0.016,0.016,0.03,6),[x+s*(w/2+0.02),y+Math.sin(a+0.31)*r*0.3,z+Math.cos(a+0.31)*r*0.3],XR)}
  put(part,'chrome',CY(0.08,0.11,0.12,20),[x+s*(w/2+0.04),y,z],XR)}
const WR=0.53;
for(const s of [-1,1]){wheel(B,s*1.03,WR,3.4,WR,0.3,s,false,true);
  for(const z of [-1.1,-2.4]){wheel(B,s*0.88,WR,z,WR,0.28,s,true,false);wheel(B,s*1.19,WR,z,WR,0.28,s,true,true)}}
for(const z of [3.4,-1.1,-2.4])put(B,'steel',CY(0.08,0.08,1.9,14),[0,WR,z],XR);
for(const z of [-1.1,-2.4])put(B,'steel',new T.SphereGeometry(0.22,16,10),[0,WR,z]);
// steering: the front axle's beam, leaf springs; the tandem's air bags and torque rods
put(B,'steel',RB(1.7,0.14,0.12,0.02),[0,WR-0.05,3.4]);for(const s of [-1,1])put(B,'steel',RB(0.1,0.08,1.4,0.02),[s*0.43,0.72,3.4]);
for(const s of [-1,1])for(const z of [-1.1,-2.4]){put(B,'black',CY(0.13,0.13,0.22,16),[s*0.45,0.86,z-0.35]);put(B,'steel',RB(0.08,0.06,0.9,0.01),[s*0.45,0.62,z-0.1])}

// ---------- the frame: two rails end to end, the fifth wheel on its slider, the deck plate behind the cab ----------
for(const s of [-1,1])put(B,'black',RB(0.1,0.28,7.4,0.01),[s*0.43,0.9,0.75]);
for(const z of [-2.9,-1.5,0.2,2.0,3.9])put(B,'black',RB(0.86,0.18,0.1,0.01),[0,0.9,z]);
put(B,'steel',RB(1.0,0.12,0.9,0.02),[0,1.12,-1.8]);put(B,'black',side([[-1.3,1.36],[-2.3,1.36],[-2.4,1.28],[-1.2,1.28]],1.7,0.015));
put(B,'black',BX(0.18,0.06,0.5),[0,1.34,-2.15]);   // the fifth wheel's throat
for(const s of [-1,1]){put(B,'steel',RB(0.12,0.2,0.4,0.02),[s*0.55,1.2,-1.8]);put(B,'black',BX(0.04,0.12,0.9),[s*0.5,1.06,-1.8])}
put(B,'track',RB(1.9,0.03,0.9,0.01),[0,1.22,-0.1]);
// the frame's tail: the light bar and the mud flaps on their hangers behind the tandem
put(B,'black',RB(1.0,0.14,0.08,0.01),[0,0.88,-2.98]);for(const s of [-1,1])put(B,'redL',BX(0.12,0.06,0.01),[s*0.3,0.88,-3.03]);
for(const s of [-1,1]){tube(B,'chrome',[[s*0.5,1.0,-2.9],[s*0.9,1.05,-2.95],[s*1.25,0.95,-2.95]],0.025);put(B,'black',BX(0.62,0.62,0.015),[s*1.05,0.5,-2.97])}
// quarter fenders over the tandem
for(const s of [-1,1])put(B,'black',side(arc(-1.75,WR,0.6,0.25,Math.PI-0.25,16).concat(arc(-1.75,WR,0.57,Math.PI-0.25,0.25,16)),0.65,0.005),[s*1.04,0,0]);

// ---------- the long hood: a crowned bonnet over the engine, its fenders over the steer wheels, the grille and lamps ----------
const HZ0=2.5,HZ1=4.3;
// the bonnet: rising from the grille shell to the cowl, rounded hard along its top edges
put(B,P,side([[HZ0,1.15],[HZ1-0.05,1.15],[HZ1,1.25],[HZ1,2.25],[HZ1-0.15,2.32],[HZ0+0.1,2.44],[HZ0,2.44]],1.24,0.08));
// the fenders: swept sheets from the bumper up round the wheels and into the bonnet's sides
for(const s of [-1,1]){
  const top=[[HZ1-0.02,1.0],[HZ1-0.1,1.2],...arc(3.4,WR,0.72,0.12,Math.PI-0.05,18).map(([z,y])=>[z,y+0.06]),[HZ0+0.05,1.2],[HZ0,1.1]];
  const und=arc(3.4,WR,0.66,Math.PI-0.05,0.12,18).map(([z,y])=>[z,y+0.06]);
  put(B,P,side([...top,[HZ0,1.05],...und,[HZ1-0.05,0.95]],0.42,0.05),[s*0.78,0,0])}
// the hood's step, the cowl band, and the long hinge seam
for(const s of [-1,1])put(B,'black',RB(0.012,0.02,1.7,0.004),[s*0.625,2.2,3.4]);
// the grille: a tall chrome shell, vertical bars, a badge; the bumper; headlamps on their brackets; amber markers
put(B,'chrome',RB(1.14,1.18,0.1,0.03),[0,1.74,HZ1+0.02]);put(B,'black',BX(0.96,1.02,0.04),[0,1.74,HZ1+0.06]);
for(let k=0;k<17;k++)put(B,'chrome',BX(0.022,1.0,0.03),[-0.46+k*0.0575,1.74,HZ1+0.08]);
put(B,'chrome',RB(1.16,0.08,0.12,0.03),[0,2.3,HZ1+0.02]);put(B,'chrome',RB(0.22,0.08,0.02,0.02),[0,2.36,HZ1+0.08]);
put(B,'chrome',RB(2.5,0.32,0.22,0.06),[0,0.72,HZ1+0.15]);put(B,'black',RB(0.4,0.08,0.06,0.02),[0,0.72,HZ1+0.27]);
for(const s of [-1,1]){for(const o of [0,0.26]){put(B,'chrome',CY(0.11,0.12,0.12,24),[s*(0.82+o*0.75),1.42,HZ1-0.18-o*0.05],ZR);
    put(B,'lens',CY(0.095,0.095,0.02,24),[s*(0.82+o*0.75),1.42,HZ1-0.11-o*0.05],ZR)}
  put(B,'chrome',RB(0.5,0.04,0.04,0.01),[s*0.92,1.28,HZ1-0.2]);
  put(B,'amber',RB(0.1,0.06,0.04,0.01),[s*1.08,1.56,HZ1-0.42]);put(B,'amber',RB(0.12,0.06,0.04,0.01),[s*1.2,0.72,HZ1+0.2])}
// the big round air cleaners on the cowl's sides, and their intake tubes into the hood
for(const s of [-1,1]){put(B,'chrome',CY(0.25,0.25,0.75,28),[s*0.98,2.05,2.25]);put(B,'chrome',CY(0.26,0.26,0.05,28),[s*0.98,2.44,2.25]);
  put(B,'chrome',CY(0.26,0.26,0.05,28),[s*0.98,1.66,2.25]);for(const y of [1.85,2.25])put(B,'black',CY(0.255,0.255,0.03,28),[s*0.98,y,2.25]);
  tube(B,'black',[[s*0.98,1.6,2.25],[s*0.85,1.45,2.6],[s*0.6,1.4,2.8]],0.08)}

// ---------- the cab: a day cab, its doors, a two-piece windshield under a sun visor, glass all round ----------
const CZ0=0.55,CZ1=2.5,CB=1.35,CT=3.3,CX=1.0,GB=2.45;
// the shell as panels, so the inside shows: the lower body round the floor, then posts and roof
for(const s of [-1,1]){put(B,P,RB(0.05,GB-CB,CZ1-CZ0,0.02),[s*(CX-0.025),(CB+GB)/2,(CZ0+CZ1)/2]);
  put(B,P,RB(0.08,CT-GB,0.1,0.02),[s*(CX-0.04),(GB+CT)/2,CZ1-0.12],[0.1,0,0]);put(B,P,RB(0.08,CT-GB,0.12,0.02),[s*(CX-0.04),(GB+CT)/2,CZ0+0.06]);
  put(B,P,RB(0.08,CT-GB,0.08,0.02),[s*(CX-0.04),(GB+CT)/2,1.35])}
put(B,P,RB(2*CX,GB-CB,0.05,0.02),[0,(CB+GB)/2,CZ1-0.025]);put(B,P,RB(2*CX,CT-CB,0.05,0.02),[0,(CB+CT)/2-0.0,CZ0+0.025]);
put(B,P,RB(2*CX+0.04,0.1,CZ1-CZ0+0.06,0.04),[0,CT,(CZ0+CZ1)/2]);put(B,P,RB(2*CX-0.2,0.06,CZ1-CZ0-0.2,0.03),[0,CT+0.07,(CZ0+CZ1)/2]);
put(B,P,RB(2*CX,0.08,0.1,0.02),[0,CB+0.0,(CZ0+CZ1)/2]);
// the glass: two windshield panes split down the middle and raked back, the door and quarter windows, the back light
for(const s of [-1,1])put(B,'tint',BX(CX-0.08,CT-GB-0.08,0.02),[s*CX/2,(GB+CT)/2,CZ1-0.1],[0.1,s*0.06,0]);
put(B,P,RB(0.06,CT-GB,0.05,0.01),[0,(GB+CT)/2,CZ1-0.1],[0.1,0,0]);
for(const s of [-1,1]){put(B,'tint',BX(0.02,CT-GB-0.08,0.7),[s*(CX-0.03),(GB+CT)/2,1.8]);put(B,'tint',BX(0.02,CT-GB-0.08,0.5),[s*(CX-0.03),(GB+CT)/2,0.95])}
put(B,'tint',BX(1.2,0.45,0.02),[0,2.85,CZ0+0.06]);
put(B,'black',RB(2*CX+0.1,0.06,0.42,0.02),[0,CT-0.06,CZ1+0.14],[-0.25,0,0]);   // the sun visor
// on the roof: five amber marker lamps along the visor, the air horns, an aerial
for(let k=0;k<5;k++)put(B,'amber',RB(0.1,0.05,0.05,0.01),[-0.6+k*0.3,CT+0.02,CZ1+0.3]);
for(const o of [0,0.15])put(B,'chrome',CY(0.03,0.06,0.5+o*1.5,14),[0.4+o,CT+0.12,1.5-o*0.5],ZR);
put(B,'black',CY(0.006,0.008,0.9,6),[-0.95,CT+0.5,0.9]);
// doors: the seams, the handles and the key lock, steps and grab handles, the big west-coast mirrors on their arms
for(const s of [-1,1]){const x=s*(CX+0.005);
  put(B,'black',RB(0.012,GB-CB-0.1,0.012,0.004),[x,(CB+GB)/2,2.17]);put(B,'black',RB(0.012,GB-CB-0.1,0.012,0.004),[x,(CB+GB)/2,1.0]);
  put(B,'chrome',RB(0.03,0.04,0.22,0.01),[x+s*0.01,2.25,1.15]);
  tube(B,'chrome',[[x+s*0.02,1.6,2.27],[x+s*0.06,1.7,2.3],[x+s*0.06,2.6,2.33],[x+s*0.02,2.7,2.3]],0.016);
  for(const y of [0.62,1.02])put(B,'track',RB(0.3,0.03,0.5,0.01),[s*1.08,y,1.6]);put(B,'black',RB(0.04,0.55,0.5,0.01),[s*0.93,0.85,1.6]);
  tube(B,'chrome',[[x,2.75,2.3],[x+s*0.25,2.8,2.4],[x+s*0.32,2.7,2.42]],0.015);tube(B,'chrome',[[x,2.4,2.3],[x+s*0.25,2.35,2.4],[x+s*0.32,2.25,2.42]],0.015);
  put(B,'chrome',RB(0.06,0.55,0.2,0.02),[x+s*0.34,2.5,2.42]);put(B,'mirror',BX(0.01,0.5,0.17),[x+s*0.34,2.5,2.4]);
  put(B,'chrome',CY(0.09,0.09,0.03,20),[x+s*0.34,2.1,2.42],ZR);put(B,'mirror',CY(0.08,0.08,0.01,20),[x+s*0.34,2.1,2.44],ZR)}
// inside: the floor, the dash in front of the driver with its gauges, the steering wheel, two seats
put(B,'black',RB(2*CX-0.1,0.04,CZ1-CZ0-0.1,0.01),[0,1.9,(CZ0+CZ1)/2]);
put(B,'black',RB(2*CX-0.1,0.4,0.42,0.06),[0,2.4,CZ1-0.3]);put(B,'trim',RB(0.9,0.22,0.02,0.02),[0.45,2.5,CZ1-0.52],[-0.35,0,0]);
put(B,'black',new T.TorusGeometry(0.24,0.025,10,32),[0.5,2.5,2.05],[-0.6,0,0]);put(B,'black',CY(0.035,0.035,0.42,10),[0.5,2.4,2.22],[-0.6,0,0]);
for(const x of [0.5,-0.5]){put(B,'seat',RB(0.52,0.14,0.5,0.06),[x,2.22,1.4]);put(B,'seat',RB(0.52,0.65,0.14,0.06),[x,2.62,1.08],[-0.15,0,0]);
  put(B,'black',CY(0.14,0.18,0.3,12),[x,2.02,1.4])}

// ---------- the stacks behind the cab, the chrome fuel tanks and the battery box under the doors ----------
for(const s of [-1,1]){put(B,'chrome',CY(0.1,0.1,3.0,20),[s*1.1,2.75,0.38]);put(B,'chrome',CY(0.1,0.13,0.25,20),[s*1.1,4.3,0.4],[-0.3,0,0]);
  put(B,'chrome',CY(0.125,0.125,0.95,20),[s*1.1,2.05,0.38]);for(let k=0;k<6;k++)put(B,'black',CY(0.128,0.128,0.03,20),[s*1.1,1.62+k*0.17,0.38]);
  for(const y of [1.6,3.2])put(B,'chrome',RB(0.2,0.04,0.06,0.01),[s*1.0,y,0.42]);tube(B,'chrome',[[s*1.1,1.25,0.38],[s*0.95,1.05,0.5],[s*0.7,0.95,0.9]],0.09)}
put(B,'chrome',CY(0.33,0.33,1.3,32),[1.12,0.9,0.85],ZR);for(const z of [0.35,1.35])put(B,'black',CY(0.335,0.335,0.06,32),[1.12,0.9,z],ZR);
put(B,'chrome',CY(0.07,0.07,0.04,16),[1.12,1.24,1.2]);
put(B,'chrome',CY(0.33,0.33,1.0,32),[-1.12,0.9,0.7],ZR);for(const z of [0.35,1.05])put(B,'black',CY(0.335,0.335,0.06,32),[-1.12,0.9,z],ZR);
put(B,'chrome',CY(0.07,0.07,0.04,16),[-1.12,1.24,0.5]);
for(const s of [-1,1])put(B,'black',RB(0.12,0.5,1.5,0.02),[s*0.62,0.95,0.85]);
// the air and electrical lines coiled from the back of the cab to the trailer
tube(B,'black',[[0.15,2.5,CZ0-0.02],[0.15,2.1,0.2],[0.1,1.7,-0.5],[0.12,1.55,-0.95]],0.018,40);
tube(B,'redL',[[-0.05,2.5,CZ0-0.02],[-0.05,2.1,0.2],[-0.05,1.7,-0.5],[-0.05,1.55,-0.95]],0.016,40);
tube(B,'chrome',[[-0.2,2.5,CZ0-0.02],[-0.2,2.1,0.2],[-0.18,1.7,-0.5],[-0.16,1.55,-0.95]],0.016,40);

// ---------- the lowboy (its own frame, origin on the ground under the kingpin) ----------
const L='trailer',TW=2.6,DY=0.62,DZ0=-2.9,DZ1=-10.3,RY=1.18,RZ1=-15.1;
// the gooseneck: deep side beams rising from the well to the coupler, a tread-plate top, the kingpin plate
for(const s of [-1,1])put(L,'black',side([[1.0,1.9],[1.0,1.45],[-1.9,1.38],[DZ0+0.1,DY-0.08],[DZ0-0.3,DY-0.08],[DZ0-0.3,DY+0.1],[-2.5,1.4],[-1.9,1.92]],0.12,0.015),[s*0.62,0,0]);
put(L,'black',RB(2.0,0.1,2.95,0.02),[0,1.93,-0.45]);put(L,'track',RB(1.94,0.012,2.9,0.004),[0,1.985,-0.45]);
put(L,'black',RB(1.5,0.06,2.6,0.01),[0,1.39,-0.4]);put(L,'steelL',CY(0.045,0.045,0.12,12),[0,1.31,0]);
for(const s of [-1,1])put(L,'black',RB(0.4,0.5,0.2,0.02),[s*0.85,1.66,0.9]);for(const s of [-1,1]){put(L,'redL',BX(0.06,0.04,0.01),[s*0.95,1.85,1.01]);put(L,'amber',BX(0.06,0.04,0.01),[s*0.75,1.85,1.01])}
// the hydraulic neck: its two rams and the swing-down front, and the hoses up to the tractor
for(const s of [-1,1]){put(L,'steel',CY(0.08,0.08,1.2,14),[s*0.35,1.65,-1.8],[1.25,0,0]);put(L,'chrome',CY(0.04,0.04,0.5,10),[s*0.35,1.38,-2.5],[1.25,0,0])}
put(L,'black',RB(TW,0.32,0.4,0.03),[0,DY+0.15,DZ0-0.15]);
// the well: two main I-beams, crossmembers, outriggers to the side rails, oak decking, stake pockets and D-rings
for(const s of [-1,1]){put(L,'black',RB(0.14,0.48,DZ0-DZ1,0.01),[s*0.45,DY-0.2,(DZ0+DZ1)/2]);put(L,'black',RB(0.3,0.04,DZ0-DZ1,0.01),[s*0.45,DY-0.44,(DZ0+DZ1)/2]);
  put(L,'black',RB(0.12,0.24,DZ0-DZ1+0.1,0.015),[s*(TW/2-0.06),DY-0.05,(DZ0+DZ1)/2]);
  for(let z=DZ0-0.4;z>DZ1+0.2;z-=0.6){put(L,'black',RB(0.14,0.06,0.12,0.01),[s*(TW/2+0.01),DY+0.02,z]);put(L,'steelL',new T.TorusGeometry(0.04,0.012,6,12),[s*(TW/2+0.03),DY-0.1,z+0.3],[0,Math.PI/2,0])}}
for(let z=DZ0-0.5;z>DZ1;z-=0.9)put(L,'black',RB(TW-0.2,0.16,0.08,0.01),[0,DY-0.14,z]);
for(let k=0;k<12;k++)put(L,'deck',BX(0.2,0.06,DZ0-DZ1-0.04),[-TW/2+0.2+k*0.2+0.1-0.1,DY+0.04,(DZ0+DZ1)/2]);
// the rear: a raised deck over the axles, its beams, and the loading ramps at the very back
put(L,'black',side([[DZ1+0.2,DY+0.1],[DZ1-0.6,RY],[RZ1,RY],[RZ1,RY-0.35],[DZ1-0.8,RY-0.35],[DZ1+0.2,DY-0.3]],TW,0.02));
for(let k=0;k<12;k++)put(L,'deck',BX(0.2,0.05,RZ1-DZ1+0.55),[-TW/2+0.2+k*0.2,RY+0.03,(DZ1-0.6+RZ1)/2]);
for(const s of [-1,1]){put(L,'black',side([[RZ1+0.02,RY+0.06],[RZ1-1.0,0.25],[RZ1-1.0,0.2],[RZ1+0.02,RY-0.02]],0.6,0.01),[s*0.75,0,0]);
  for(let k=0;k<5;k++)put(L,'steelL',BX(0.56,0.025,0.03),[s*0.75,RY-0.15-k*0.19,RZ1-0.17-k*0.19])}
// the tri-axle: low-profile duals on each end of each axle, the suspension's hangers and air bags, the mud flaps
for(const z of [-12,-13.2,-14.4]){put(L,'steel',CY(0.07,0.07,2.3,12),[0,0.42,z],XR);
  for(const s of [-1,1]){wheel(L,s*0.76,0.42,z,0.42,0.24,s,false,false);wheel(L,s*1.03,0.42,z,0.42,0.24,s,false,true);
    put(L,'black',CY(0.12,0.12,0.2,14),[s*0.45,0.72,z+0.35]);put(L,'black',RB(0.1,0.3,0.12,0.01),[s*0.45,0.72,z-0.3])}}
for(const s of [-1,1])put(L,'black',BX(0.6,0.5,0.015),[s*0.9,0.42,-15.0]);
// the lamps: red tails and amber markers down each side, the rear light bar and its bumper
for(let z=-1.0;z>-15;z-=2.5)for(const s of [-1,1])put(L,'amber',BX(0.02,0.04,0.08),[s*(TW/2+0.01),z<DZ1?RY-0.15:z<DZ0?DY:1.6,z]);
put(L,'steel',RB(TW-0.4,0.1,0.1,0.01),[0,0.5,RZ1-0.05]);
for(const s of [-1,1]){put(L,'redL',CY(0.06,0.06,0.02,16),[s*1.05,RY-0.2,RZ1-0.02],ZR);put(L,'redL',CY(0.06,0.06,0.02,16),[s*0.9,RY-0.2,RZ1-0.02],ZR)}

// ---------- merge: one mesh per material, a node per part ----------
const root=new T.Group();root.name='semi';
for(const [part,mats] of Object.entries(parts)){const g=new T.Group();g.name=part;root.add(g);
  for(const [mat,list] of Object.entries(mats)){let m=BGU.mergeBufferGeometries(list);m=BGU.mergeVertices(m,1e-4);
    const mesh=new T.Mesh(m,new T.MeshStandardMaterial({name:mat}));mesh.name=part+'_'+mat;g.add(mesh)}}
return root}
