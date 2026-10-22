// Corley's Island: the detailed wheel loader (Dexter's and Corley's, heavy.js kind 'loader'), a 950-class machine,
// built from shapes and written out as models/loader.glb by tools/build_model.js (three.js r147 in headless Chromium).
// The game loads it (js/models.js) in place of the kit-built loader when Machine models are Detailed.
// The contract with the game, so a model made in Blender or bought can replace this one:
// - one node per moving part, each in that part's own frame (x right, y up, z forward, metres):
//   body: origin on the ground under the loader's middle; the wheels' centres at x ±1.15, 0.8 m up, z 1.4 and -1.3
//     (1.6 m tyres); the driver's eye (heavy.js K.eye) at y 2.75, z -0.15, so the cab is open to it through the glass;
//   arm: origin at the lift arms' pivots, 2.1 m up and 0.8 m ahead of the middle; the arms run 2.7 m along z to the
//     bucket's hinge (the game swings this node about its x axis);
//   bucket: origin at its hinge pins; the cutting edge 1.0 m ahead and 0.9 m below them (the game curls it about x);
// - rams: empty nodes ram_<id>_a (the barrel's pin) in one part and ram_<id>_b (the rod's) in another, with extras r (the
//   barrel's radius), lb (the barrel's length ahead of its pin), bk (behind it) and lr (the rod's length); the game
//   draws a hydraulic cylinder between each pair and keeps it pointing pin to pin as the parts move;
// - materials named for the game's: paintY (the yellow paint), steel, steelL, black, chrome, tire, rim, tint (the glass),
//   seat, mirror, lens, redL, amber, screen.
// Metres. Classic script, no modules.
function buildLoader(){
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
const anchor=(part,id,end,p,o)=>anchors.push({part,name:`ram_${id}_${end}`,p,o});
const B='body',Y='paintY',WX=1.15,WY=0.8,WF=1.4,WR=-1.3;

// ---------- wheels: 23.5R25 radial tyres with deep lugs, steel rims, the planetary hubs ----------
const tire=new T.LatheGeometry([[0.5,-0.3],[0.62,-0.31],[0.74,-0.29],[0.79,-0.24],[0.8,-0.12],[0.8,0.12],[0.79,0.24],[0.74,0.29],[0.62,0.31],[0.5,0.3]].map(([r,y])=>new T.Vector2(r,y)),48);
for(const s of [-1,1])for(const cz of [WF,WR]){const x=s*WX;put(B,'tire',tire,[x,WY,cz],XR);
  // the L3 tread: chevron lugs alternating side to side round the tyre
  for(let k=0;k<22;k++){const a=k/22*Math.PI*2;for(const o of [-1,1]){const aa=a+(o>0?0.07:0);
    put(B,'tire',BX(0.28,0.07,0.13),[x+o*0.14,WY+Math.sin(aa)*0.82,cz+Math.cos(aa)*0.82],[aa+Math.PI/2,o*0.45,0])}}
  put(B,'rim',CY(0.5,0.5,0.5,32),[x,WY,cz],XR);put(B,'rim',CY(0.47,0.47,0.04,32),[x+s*0.24,WY,cz],XR);
  put(B,'rim',new T.TorusGeometry(0.5,0.025,8,40),[x+s*0.26,WY,cz],[0,Math.PI/2,0]);
  // the hub: a stepped planetary housing and its ring of wheel nuts
  put(B,Y,CY(0.3,0.33,0.2,28),[x+s*0.22,WY,cz],XR);put(B,Y,CY(0.2,0.24,0.14,24),[x+s*0.36,WY,cz],XR);
  for(let k=0;k<12;k++){const a=k/12*Math.PI*2;put(B,'steelL',CY(0.022,0.022,0.04,6),[x+s*0.3,WY+Math.sin(a)*0.37,cz+Math.cos(a)*0.37],XR)}
  for(let k=0;k<8;k++){const a=k/8*Math.PI*2;put(B,'steelL',CY(0.016,0.016,0.03,6),[x+s*0.44,WY+Math.sin(a)*0.16,cz+Math.cos(a)*0.16],XR)}}
// the axles and their housings between the wheels, the rear one's oscillating pivot
for(const cz of [WF,WR]){put(B,'steel',CY(0.18,0.18,1.7,20),[0,WY,cz],XR);put(B,'steel',new T.SphereGeometry(0.32,20,14),[0,WY,cz])}
put(B,'steel',RB(0.6,0.3,0.5,0.04),[0,WY+0.25,WR]);

// ---------- the front frame: side plates, the towers carrying the arms, the hinge to the rear frame ----------
for(const s of [-1,1]){put(B,Y,side([[0.2,0.95],[0.2,1.55],[0.55,1.8],[0.65,2.35],[1.0,2.35],[1.2,1.8],[2.0,1.45],[2.15,1.0],[1.8,0.75],[0.6,0.75]],0.07,0.012),[s*0.52,0,0]);
  put(B,'steelL',CY(0.11,0.11,0.24,18),[s*0.62,2.1,0.8],XR);put(B,'steel',CY(0.06,0.06,0.3,12),[s*0.62,2.1,0.8],XR)}
put(B,Y,RB(1.0,0.12,1.7,0.02),[0,0.82,1.25]);put(B,Y,RB(1.0,0.5,0.1,0.02),[0,1.25,2.0]);put(B,Y,RB(1.0,0.12,0.9,0.02),[0,1.55,1.5]);
// the articulation hinge: upper and lower pins in their lugs between the frames, the steering cylinders either side
for(const y of [1.05,1.6]){put(B,'steel',RB(0.5,0.1,0.5,0.02),[0,y,0.15]);put(B,'steelL',CY(0.07,0.07,0.3,14),[0,y,0.15])}
for(const s of [-1,1]){put(B,Y,CY(0.06,0.06,0.65,14),[s*0.4,1.2,0.12],ZR);put(B,'chrome',CY(0.03,0.03,0.4,10),[s*0.4,1.2,0.5],ZR)}
// a pair of headlamps and amber turn lamps on the tower fronts
for(const s of [-1,1]){put(B,'black',RB(0.18,0.14,0.12,0.03),[s*0.72,2.28,1.08]);put(B,'lens',CY(0.055,0.055,0.02,16),[s*0.72,2.28,1.15],ZR);
  put(B,'amber',RB(0.08,0.05,0.02,0.01),[s*0.72,2.18,1.15])}

// ---------- the rear frame: the cab deck, fenders over the back wheels, the engine enclosure and the counterweight ----------
put(B,Y,RB(1.5,0.55,2.9,0.04),[0,1.12,-1.15]);put(B,'steel',RB(1.3,0.08,2.6,0.02),[0,0.82,-1.15]);
for(const s of [-1,1]){// fenders: the front pair turning with the front frame, the rear pair over the back wheels
  put(B,Y,side([...arc(WR,WY,0.98,0.15,Math.PI-0.15,18),...arc(WR,WY,0.93,Math.PI-0.15,0.15,18)],0.72,0.01),[s*WX,0,0]);
  put(B,Y,side([...arc(WF,WY,0.98,0.35,Math.PI-0.55,14),...arc(WF,WY,0.93,Math.PI-0.55,0.35,14)],0.72,0.01),[s*WX,0,0]);
  put(B,'black',RB(0.66,0.4,0.02,0.01),[s*WX,0.6,WF+0.98]);
  // the deck beside the cab over the rear wheels: steel tread plate, its kick plate and the steps down
  put(B,Y,RB(0.68,0.05,1.0,0.02),[s*1.05,1.82,-0.15]);put(B,'track',RB(0.64,0.012,0.96,0.004),[s*1.05,1.85,-0.15]);
  for(let k=0;k<4;k++)put(B,'track',RB(0.36,0.03,0.2,0.008),[s*1.28,0.5+k*0.33,0.42-k*0.02]);
  put(B,'black',RB(0.04,1.3,0.04,0.01),[s*1.48,1.0,0.45]);put(B,'black',RB(0.04,1.3,0.04,0.01),[s*1.08,1.0,0.43]);
  tube(B,'black',[[s*0.84,1.86,0.38],[s*0.86,2.6,0.4],[s*0.86,3.0,0.36]],0.018);
  tube(B,Y,[[s*1.37,1.84,0.32],[s*1.39,2.3,0.3],[s*1.39,2.3,-0.62],[s*1.37,1.84,-0.66]],0.02,30)}

// the engine enclosure: a long hood falling to the back, grilles along its sides and over the cooling package at the rear
put(B,Y,side([[-0.72,1.38],[-2.55,1.38],[-2.7,1.5],[-2.7,2.2],[-2.5,2.42],[-0.8,2.62],[-0.72,2.62]],1.6,0.05));
for(const s of [-1,1]){put(B,'black',RB(0.02,0.5,1.3,0.02),[s*0.8,1.95,-1.6]);
  for(let k=0;k<10;k++)put(B,Y,RB(0.04,0.022,1.28,0.008),[s*0.815,1.74+k*0.045,-1.6],[0,0,s*0.5]);
  for(const z of [-1.0,-2.2])put(B,'steel',RB(0.02,0.06,0.08,0.01),[s*0.815,2.35,z]);put(B,'black',RB(0.02,0.04,0.14,0.01),[s*0.815,1.6,-0.98])}
put(B,'black',BX(1.36,0.6,0.03),[0,1.88,-2.71]);for(let k=0;k<10;k++)put(B,'steel',BX(1.36,0.022,0.04),[0,1.62+k*0.058,-2.72]);
// on top: the exhaust stack, the air intake's pre-cleaner, a beacon
tube(B,'black',[[0.4,2.6,-1.6],[0.4,2.95,-1.6],[0.4,3.1,-1.62]],0.065);put(B,'chrome',CY(0.07,0.08,0.12,16),[0.4,3.12,-1.62],[0.35,0,0]);
put(B,'black',CY(0.12,0.12,0.24,20),[-0.42,2.72,-1.45]);put(B,'black',CY(0.14,0.11,0.05,20),[-0.42,2.86,-1.45]);put(B,'tint',CY(0.1,0.1,0.16,20),[-0.42,2.7,-1.45]);
// the counterweight: a heavy curved casting round the back, the tail and stop lamps and the reversing lamps in it
put(B,Y,side([[-2.6,0.85],[-2.95,0.95],[-3.05,1.15],[-3.05,1.55],[-2.95,1.72],[-2.6,1.72]],2.06,0.06));
put(B,'steel',RB(0.4,0.25,0.06,0.02),[0,1.18,-3.05]);put(B,'steelL',CY(0.06,0.06,0.3,14),[0,1.1,-3.06],XR);
for(const s of [-1,1]){put(B,'black',RB(0.3,0.16,0.06,0.02),[s*0.75,1.5,-3.04]);put(B,'redL',BX(0.12,0.1,0.01),[s*0.82,1.5,-3.08]);put(B,'lens',BX(0.1,0.1,0.01),[s*0.68,1.5,-3.08])}
// the fuel and hydraulic tanks under the deck, their caps
for(const s of [-1,1]){put(B,Y,RB(0.42,0.5,0.9,0.05),[s*0.86,1.25,-0.65]);put(B,'steel',CY(0.06,0.06,0.05,14),[s*0.86,1.52,-0.75])}

// ---------- the cab: wide glass on posts, a roof with lamps front and back, doors, mirrors ----------
const CZ=-0.15,CW=1.5,CL=1.4,C0=1.88,C1=3.3;
for(const s of [-1,1]){put(B,Y,RB(0.05,0.35,CL,0.015),[s*(CW/2-0.025),C0+0.17,CZ]);put(B,Y,RB(CW,0.35,0.05,0.015),[0,C0+0.17,CZ+s*(CL/2-0.025)])}
for(const sx of [-1,1])for(const sz of [-1,1])put(B,Y,RB(0.09,C1-C0,0.09,0.02),[sx*(CW/2-0.045),(C0+C1)/2,CZ+sz*(CL/2-0.045)]);
// the glass: a curved front screen running down below the dash, the doors, the back window
const G0=C0+0.06;
put(B,'tint',BX(CW-0.16,C1-G0-0.05,0.02),[0,(G0+C1)/2,CZ+CL/2-0.03]);put(B,'tint',BX(CW-0.16,C1-C0-0.4,0.02),[0,(C0+0.35+C1)/2,CZ-CL/2+0.03]);
for(const s of [-1,1]){put(B,'tint',BX(0.02,C1-G0-0.05,CL-0.16),[s*(CW/2-0.03),(G0+C1)/2,CZ]);
  put(B,Y,RB(0.04,0.05,CL-0.1,0.01),[s*(CW/2-0.01),C0+0.5,CZ]);put(B,'black',RB(0.03,0.04,0.16,0.01),[s*(CW/2+0.01),C0+0.62,CZ-0.35]);
  for(const y of [C0+0.25,C1-0.2])put(B,'steel',CY(0.018,0.018,0.08,8),[s*(CW/2+0.005),y,CZ+0.6]);
  tube(B,'black',[[s*(CW/2),C1-0.12,CZ+CL/2-0.05],[s*(CW/2+0.2),C1-0.06,CZ+CL/2+0.05],[s*(CW/2+0.3),C1-0.14,CZ+CL/2+0.08]],0.014);
  put(B,'black',RB(0.05,0.3,0.2,0.03),[s*(CW/2+0.31),C1-0.3,CZ+CL/2+0.08]);put(B,'mirror',BX(0.01,0.26,0.16,0.01),[s*(CW/2+0.31),C1-0.3,CZ+CL/2+0.05])}
for(const sz of [-1,1]){put(B,'black',RB(CW-0.1,0.03,0.03,0.01),[0,G0,CZ+sz*(CL/2-0.02)]);put(B,'black',RB(CW-0.1,0.03,0.03,0.01),[0,C1-0.03,CZ+sz*(CL/2-0.02)])}
put(B,Y,RB(CW+0.16,0.12,CL+0.2,0.04),[0,C1+0.06,CZ]);put(B,Y,RB(CW-0.1,0.06,CL-0.1,0.03),[0,C1+0.15,CZ]);
for(const sz of [-1,1])for(const sx of [-1,1]){put(B,'black',RB(0.16,0.12,0.1,0.02),[sx*0.52,C1+0.08,CZ+sz*(CL/2+0.13)]);put(B,'lens',BX(0.12,0.08,0.01),[sx*0.52,C1+0.08,CZ+sz*(CL/2+0.18)])}
put(B,'black',CY(0.08,0.09,0.05,16),[-0.45,C1+0.2,CZ-0.35]);put(B,'amber',CY(0.065,0.07,0.12,16),[-0.45,C1+0.28,CZ-0.35]);
put(B,'black',RB(0.02,0.7,0.02,0.005),[0.2,C0+0.75,CZ+CL/2+0.005],[0,0,0.45]);
// inside: the floor, the seat with its right-hand pod and joystick, the steering wheel on its column, the dash and display
const F=C0-0.02;put(B,'black',RB(CW-0.1,0.04,CL-0.1,0.01),[0,F,CZ]);
put(B,'seat',RB(0.52,0.12,0.5,0.05),[0,F+0.42,CZ-0.18]);put(B,'seat',RB(0.5,0.62,0.12,0.05),[0,F+0.78,CZ-0.46],[-0.12,0,0]);
put(B,'seat',RB(0.3,0.16,0.08,0.04),[0,F+1.16,CZ-0.52]);put(B,'black',CY(0.12,0.16,0.34,12),[0,F+0.19,CZ-0.18]);
put(B,'black',RB(0.14,0.1,0.46,0.03),[0.36,F+0.58,CZ-0.1]);put(B,'black',CY(0.016,0.02,0.12,8),[0.36,F+0.69,CZ+0.04]);put(B,'black',new T.SphereGeometry(0.035,10,8),[0.36,F+0.77,CZ+0.05]);
put(B,'black',RB(0.18,0.6,0.18,0.04),[0,F+0.3,CZ+0.5],[0.3,0,0]);put(B,'black',new T.TorusGeometry(0.19,0.022,10,32),[0,F+0.72,CZ+0.36],[-1.0,0,0]);
put(B,'black',RB(0.3,0.22,0.08,0.02),[-0.42,F+0.62,CZ+0.55],[-0.4,0,0]);put(B,'screen',BX(0.25,0.17,0.01),[-0.42,F+0.63,CZ+0.505],[-0.4,0,0]);

// ---------- the lift arms (their own frame, swung on the tower pins) ----------
const A='arm',AL=2.7;
for(const s of [-1,1]){put(A,Y,side([[-0.18,0.0],[0.0,0.2],[1.25,0.2],[2.0,0.05],[AL+0.12,0.05],[AL+0.12,-0.22],[2.0,-0.24],[1.25,-0.24],[0.0,-0.2],[-0.18,0]],0.18,0.025),[s*0.72,0,0]);
  put(A,'steelL',CY(0.1,0.1,0.24,18),[s*0.72,0,0],XR);put(A,'steelL',CY(0.1,0.1,0.24,18),[s*0.72,0,AL],XR);
  put(A,'steel',CY(0.05,0.05,0.3,12),[s*0.72,0,AL],XR)}
// the cross tube, the bellcrank on it and the link down to the bucket (Z-bar linkage)
put(A,Y,CY(0.12,0.12,1.3,20),[0,-0.04,1.35],XR);
put(A,Y,side([[1.2,0.62],[1.5,0.62],[1.55,-0.32],[1.3,-0.38],[1.2,-0.1]],0.2,0.02));put(A,'steelL',CY(0.08,0.08,0.24,16),[0,0.12,1.38],XR);
// the lift cylinders' lugs under the arms
for(const s of [-1,1])put(A,'steel',side([[1.0,-0.22],[1.25,-0.42],[1.45,-0.42],[1.45,-0.22]],0.14,0.01),[s*0.72,0,0]);
const LIFT={r:0.085,lb:1.2,lr:1.2,bk:0},TILT={r:0.09,lb:0.95,lr:0.8,bk:0},LINK={r:0.06,lb:0.55,lr:0.6,bk:0};
for(const s of [-1,1]){const id='lift'+(s<0?'L':'R');anchor(A,id,'b',[s*0.62,-0.38,1.35],LIFT);
  put(B,'steel',RB(0.12,0.24,0.24,0.02),[s*0.62,0.95,0.55]);anchor(B,id,'a',[s*0.62,0.95,0.55],LIFT)}
// the tilt cylinder from the front frame's top to the bellcrank, and the link from the bellcrank to the bucket
put(B,'steel',RB(0.3,0.24,0.24,0.02),[0,2.42,1.12]);anchor(B,'tilt','a',[0,2.45,1.12],TILT);anchor(A,'tilt','b',[0,0.55,1.33],TILT);
anchor(A,'link','a',[0,-0.32,1.45],LINK);

// ---------- the bucket (its own frame, curled on the hinge pins) ----------
const K='bucket',BW=2.7;
// the shell: a curved back and floor in one profile, the top plate, side plates and the bolt-on cutting edge
const shell=[[0.05,0.18],[-0.08,-0.1],[-0.1,-0.45],[-0.02,-0.75],[0.18,-0.9],[1.0,-0.92],[1.02,-0.87],[0.2,-0.84],[0.04,-0.72],[-0.03,-0.45],[-0.01,-0.12],[0.1,0.12]];
put(K,Y,side(shell,BW-0.06,0.01));
put(K,Y,side([[0.05,0.18],[0.42,0.2],[0.44,0.12],[0.1,0.12]],BW-0.06,0.01));
for(const s of [-1,1]){put(K,Y,side([[0.06,0.2],[0.44,0.2],[1.04,-0.9],[0.18,-0.94],[-0.12,-0.75],[-0.14,-0.4],[-0.08,-0.05]],0.04,0.008),[s*(BW/2-0.02),0,0]);}
put(K,'steelL',RB(BW,0.04,0.2,0.01),[0,-0.91,1.04]);for(let k=0;k<12;k++)put(K,'steel',CY(0.02,0.02,0.02,6),[-1.2+k*0.22,-0.885,0.98]);
// wear strips under the floor, the back's ribs, the hinge lugs and the link's lug
for(const x of [-0.8,0,0.8])put(K,'steelL',RB(0.12,0.03,0.7,0.01),[x,-0.94,0.55]);
for(const s of [-1,1]){put(K,Y,side([[-0.14,0.12],[0.06,0.2],[0.06,-0.2],[-0.14,-0.15]],0.14,0.01),[s*0.72,0,0]);put(K,'steelL',CY(0.07,0.07,0.2,14),[s*0.72,0,0],XR)}
put(K,Y,side([[-0.12,0.4],[0.06,0.48],[0.1,0.1],[-0.1,0.05]],0.2,0.01));anchor(K,'link','b',[0,0.38,-0.02],LINK);
put(K,Y,RB(BW-0.2,0.08,0.08,0.02),[0,-0.3,-0.1]);

// ---------- merge: one mesh per material, a node per part, the rams' anchors ----------
const root=new T.Group();root.name='loader';const groups={};
for(const [part,mats] of Object.entries(parts)){const g=new T.Group();g.name=part;root.add(g);groups[part]=g;
  for(const [mat,list] of Object.entries(mats)){let m=BGU.mergeBufferGeometries(list);m=BGU.mergeVertices(m,1e-4);
    const mesh=new T.Mesh(m,new T.MeshStandardMaterial({name:mat}));mesh.name=part+'_'+mat;g.add(mesh)}}
for(const a of anchors){const o=new T.Object3D();o.name=a.name;o.position.set(...a.p);o.userData=Object.assign({},a.o);groups[a.part].add(o)}
return root}
