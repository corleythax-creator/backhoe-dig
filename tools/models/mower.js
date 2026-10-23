// Corley's Island: the detailed zero-turn mower (js/mower.js), a commercial 52 in machine, built from shapes and written
// out as models/mower.glb by tools/build_model.js (three.js r147 in headless Chromium). The game loads it (js/models.js,
// MDL_KIT.mower in mower.js) in place of the simple shapes when Machine models are Detailed.
// The contract with the game, so a model made in Blender or bought can replace this one:
// - nodes in the mower's own part groups, each in that group's frame (metres; x to the operator's left, y up, z forward):
//   body (the mower group: origin on the ground under the middle of the rear axle; rear tyres' centres at x ±0.58,
//   0.29 m up; the deck between z 0.42 and 1.18, its discharge chute on the right, -x, where the clippings fly out at
//   x -0.88, 0.22 m up, z 0.8; the seat cushion's top 0.81 m up at z 0.1, the operator's eye at 0, 1.42, 0.02, so
//   nothing stands in front of it above the lap bars; the casters' swivels at x ±0.46, z 1.55);
//   barL, barR (the lap bars, pivoting about x at their origin, x +0.38 and -0.38, 0.7 m up, z 0.3; the grip 0.34 up
//   and running in toward the middle);
//   wheelL, wheelR (the rear tyres, spinning about x at their origin; L is +x, its face outward);
//   caster (each front swivel, turning about y at its origin on the ground under the swivel; the fork trails back to
//   the axle 0.11 m up, 0.1 m behind) and cast (each caster wheel, spinning about x at its origin, 0.11 m radius);
// - materials named for the game's: paint#c8291f (the red), paint#202224 (black powder coat), steel, steelL, chrome,
//   rubber, tire, seat, black, plastic#1c1d1f (tanks and shrouds), lib:diamond (the foot plate), lens, redL, amber,
//   metal#c4c8ca (bright metal).
// Metres. Classic script, no modules.
function buildMower(){
const T=THREE,BGU=T.BufferGeometryUtils,parts={};
const mtx=new T.Matrix4(),q=new T.Quaternion(),e=new T.Euler();
function put(part,mat,g,p,r,s){g=g.index?g.toNonIndexed():g.clone();
  e.set(...(r||[0,0,0]));q.setFromEuler(e);mtx.compose(new T.Vector3(...(p||[0,0,0])),q,new T.Vector3(...(s||[1,1,1])));g.applyMatrix4(mtx);
  g.deleteAttribute('uv');for(const k of Object.keys(g.attributes))if(k!=='position'&&k!=='normal')g.deleteAttribute(k);
  ((parts[part]=parts[part]||{})[mat]=parts[part][mat]||[]).push(g);return g}
const RB=(w,h,d,r)=>new T.RoundedBoxGeometry(w,h,d,Math.max(w,h,d)>0.4&&r>=0.02?2:1,Math.min(r,w/2-1e-4,h/2-1e-4,d/2-1e-4));
const CY=(rt,rb,h,n)=>new T.CylinderGeometry(rt,rb,h,n||20);
// a profile in (z, y) pressed across x, w wide
function side(pts,w,bev){const s=new T.Shape();pts.forEach(([z,y],i)=>i?s.lineTo(z,y):s.moveTo(z,y));
  const b=bev||0,g=new T.ExtrudeGeometry(s,{depth:Math.max(0.002,w-2*b),bevelEnabled:b>0,bevelThickness:b,bevelSize:b,bevelSegments:2,curveSegments:16});
  g.rotateY(-Math.PI/2);g.translate((w-2*b)/2,0,0);return BGU.toCreasedNormals(g,0.6)}
// a plan outline in (x, z) raised h from y 0 (holes: more outlines cut through it)
function plan(pts,h,bev,holes){const s=new T.Shape(pts.map(([x,z])=>new T.Vector2(x,-z)));
  for(const hp of holes||[])s.holes.push(new T.Path(hp.map(([x,z])=>new T.Vector2(x,-z))));
  const b=bev||0,g=new T.ExtrudeGeometry(s,{depth:Math.max(0.002,h-2*b),bevelEnabled:b>0,bevelThickness:b,bevelSize:b,bevelSegments:2,curveSegments:12});
  g.translate(0,0,b);g.rotateX(-Math.PI/2);return BGU.toCreasedNormals(g,0.6)}
function tube(part,mat,pts,r,n,closed){const c=new T.CatmullRomCurve3(pts.map(p=>new T.Vector3(...p)),!!closed,'catmullrom',0.1);put(part,mat,new T.TubeGeometry(c,n||Math.max(8,pts.length*8),r,10,!!closed))}
const arc=(cx,cy,r,a0,a1,n)=>Array.from({length:n+1},(_,i)=>{const a=a0+(a1-a0)*i/n;return [cx+Math.cos(a)*r,cy+Math.sin(a)*r]});
// a rounded rectangle outline in plan, centre cx,cz, half sizes hx,hz, corner radius r
const rrect=(cx,cz,hx,hz,r,n)=>[...arc(cx+hx-r,cz+hz-r,r,0,Math.PI/2,n||4),...arc(cx-hx+r,cz+hz-r,r,Math.PI/2,Math.PI,n||4),...arc(cx-hx+r,cz-hz+r,r,Math.PI,Math.PI*1.5,n||4),...arc(cx+hx-r,cz-hz+r,r,Math.PI*1.5,Math.PI*2,n||4)];
const B='body',R='paint#c8291f',K='paint#202224',PL='plastic#1c1d1f',BM='metal#c4c8ca';

// ---------- the frame: rectangular tube rails, front cross tube with the caster barrels, the foot plate ----------
for(const s of [-1,1]){put(B,K,RB(0.07,0.09,1.62,0.012),[s*0.41,0.38,0.62]);
  put(B,K,RB(0.07,0.07,0.36,0.01),[s*0.41,0.36,-0.37],[-0.25,0,0]);
  // caster barrel and its gusset on each end of the front tube
  put(B,K,CY(0.042,0.042,0.13,18),[s*0.46,0.44,1.55]);put(B,'steel',CY(0.046,0.046,0.012,18),[s*0.46,0.51,1.55]);put(B,'chrome',CY(0.018,0.018,0.02,10),[s*0.46,0.52,1.55]);
  put(B,K,RB(0.06,0.06,0.12,0.01),[s*0.43,0.41,1.48]);
  // deck hangers from the rails, with the lift chains
  for(const z of [0.5,1.1]){put(B,K,RB(0.02,0.1,0.05,0.005),[s*0.45,0.33,z]);put(B,'steel',RB(0.012,0.07,0.012,0.004),[s*0.47,0.3,z])}}
tube(B,K,[[0.46,0.38,1.52],[0.3,0.4,1.6],[-0.3,0.4,1.6],[-0.46,0.38,1.52]],0.032,24);
put(B,K,RB(0.88,0.06,0.06,0.01),[0,0.38,1.48]);put(B,K,RB(0.8,0.05,0.05,0.01),[0,0.38,0.42]);
// the foot plate: diamond-plate pan with turned-up edges, on the front of the frame
put(B,'lib:diamond',RB(0.74,0.02,0.44,0.006),[0,0.465,1.22]);
for(const s of [-1,1])put(B,K,RB(0.02,0.07,0.46,0.006),[s*0.37,0.48,1.22]);put(B,K,RB(0.74,0.12,0.02,0.006),[0,0.44,1.44]);
put(B,K,RB(0.7,0.08,0.03,0.008),[0,0.43,0.99],[0.4,0,0]);
// the height-of-cut pedal and the pin plate on the left
put(B,K,RB(0.12,0.02,0.16,0.008),[0.22,0.5,1.36],[-0.3,0,0]);put(B,'steel',RB(0.03,0.2,0.03,0.006),[0.22,0.42,1.29]);
put(B,'steel',RB(0.01,0.16,0.14,0.004),[0.36,0.52,0.98]);for(let i=0;i<7;i++)put(B,'black',CY(0.006,0.006,0.012,8),[0.366,0.46+i*0.02,0.94+i*0.012],[0,0,Math.PI/2]);
put(B,'plastic#e8c21a',CY(0.012,0.012,0.05,10),[0.38,0.54,1.0],[0,0,Math.PI/2]);

// ---------- the deck: 52 in fabricated shell, its skirt, reinforcing channels, spindles, pulleys and belt ----------
const DZ=0.8,DECK=[...arc(0.44,DZ+0.18,0.2,0,Math.PI/2,6),...arc(-0.44,DZ+0.18,0.2,Math.PI/2,Math.PI,6),[-0.64,DZ-0.38],[0.64,DZ-0.38]];
const DIN=DECK.map(([x,z])=>[x*0.985,DZ+(z-DZ)*0.975]);
put(B,R,plan(DECK,0.014,0.004),[0,0.3,0]);
put(B,R,plan(DECK,0.15,0,[DIN]),[0,0.155,0]);
put(B,R,plan([[0.66,DZ-0.4],[0.66,DZ+0.18],[0.69,DZ+0.18],[0.69,DZ-0.4]],0.1,0.004),[0,0.2,0]);
// the chute side: opening framed by the hinged deflector
put(B,K,RB(0.03,0.14,0.42,0.008),[-0.665,0.225,DZ]);
{const d=side([[DZ-0.2,0.31],[DZ+0.2,0.31],[DZ+0.18,0.17],[DZ-0.16,0.16]],0.26,0.006);put(B,PL,d,[-0.8,0,0],[0,0,-0.18])}
for(const z of [DZ-0.2,DZ+0.2])put(B,'steel',CY(0.012,0.012,0.08,8),[-0.67,0.3,z],[0,0,Math.PI/2]);
put(B,'steel',CY(0.008,0.008,0.4,8),[-0.68,0.31,DZ],[Math.PI/2,0,0]);
// channels welded over the top, the bumper strip round the front, anti-scalp rollers
for(const z of [DZ-0.28,DZ+0.06])put(B,R,RB(1.12,0.03,0.05,0.008),[0,0.322,z]);
tube(B,K,[...arc(0.44,DZ+0.18,0.215,0,Math.PI/2,6),...arc(-0.44,DZ+0.18,0.215,Math.PI/2,Math.PI,6)].map(([x,z])=>[x,0.23,z]),0.012,40);
for(const s of [-1,1])for(const z of [DZ-0.34,DZ+0.3]){put(B,K,RB(0.05,0.03,0.08,0.008),[s*0.69,0.17,z]);
  put(B,'plastic#2a2b2d',CY(0.04,0.04,0.05,16),[s*0.72,0.1,z+0.03],[0,0,Math.PI/2]);put(B,'steel',CY(0.012,0.012,0.07,8),[s*0.72,0.1,z+0.03],[0,0,Math.PI/2])}
// three spindles with their housings, pulleys under shields, the idler and the belt
const SP=[[0.42,DZ+0.04],[0,DZ-0.06],[-0.42,DZ+0.04]];
for(const [x,z] of SP){put(B,'steel',CY(0.07,0.085,0.05,24),[x,0.34,z]);put(B,'steel',CY(0.032,0.032,0.04,14),[x,0.38,z]);
  put(B,'steelL',CY(0.075,0.075,0.03,28),[x,0.405,z]);put(B,'steel',CY(0.065,0.065,0.012,28),[x,0.39,z]);put(B,'chrome',CY(0.016,0.016,0.03,12),[x,0.425,z]);
  for(let k=0;k<4;k++){const a=k/4*Math.PI*2+0.4;put(B,'steel',CY(0.008,0.008,0.02,6),[x+Math.cos(a)*0.06,0.37,z+Math.sin(a)*0.06])}}
{const pts=[];const around=(cx,cz,r,a0,a1)=>{for(let i=0;i<=8;i++){const a=a0+(a1-a0)*i/8;pts.push([cx+Math.cos(a)*r,0.405,cz+Math.sin(a)*r])}};
  around(0.42,DZ+0.04,0.08,-Math.PI*0.6,Math.PI*0.55);around(0.04,DZ+0.22,0.04,Math.PI*0.2,Math.PI*0.8);around(-0.42,DZ+0.04,0.08,Math.PI*0.45,Math.PI*1.6);
  around(0,DZ-0.06,0.08,Math.PI*1.1,Math.PI*1.9);tube(B,'black',pts,0.007,80,true)}
put(B,'steel',CY(0.04,0.04,0.025,18),[0.04,0.405,DZ+0.22]);put(B,'steel',RB(0.03,0.02,0.18,0.006),[0.12,0.39,DZ+0.16],[0,0.6,0]);
// belt shields: pressed covers over the outer pulleys and the middle
for(const [x,z] of SP){const sh=rrect(x,z,0.1,0.1,0.07,5);put(B,K,plan(sh,0.012,0.003),[0,0.44,0]);put(B,K,plan(sh,0.04,0,[rrect(x,z,0.094,0.094,0.065,5)]),[0,0.405,0])}
put(B,'paint#e8c21a',RB(0.12,0.003,0.05,0.001),[0.42,0.454,DZ+0.04]);put(B,'paint#e8c21a',RB(0.12,0.003,0.05,0.001),[-0.42,0.454,DZ+0.04]);
// the drive belt up from the engine's clutch (under the seat pan) to the deck
tube(B,'black',[[0.04,0.4,DZ-0.06],[0.05,0.38,0.3],[0.05,0.36,-0.2],[0.08,0.34,-0.36]],0.007,24);
put(B,'steel',CY(0.07,0.07,0.08,22),[0.06,0.33,-0.4]);put(B,'black',CY(0.05,0.05,0.04,18),[0.06,0.28,-0.4]);

// ---------- rear wheel motors and the frame round the seat ----------
for(const s of [-1,1]){put(B,'steel',CY(0.07,0.07,0.1,20),[s*0.4,0.29,0],[0,0,Math.PI/2]);put(B,'steel',RB(0.08,0.12,0.12,0.02),[s*0.36,0.29,0]);
  put(B,'steel',CY(0.008,0.008,0.4,6),[s*0.33,0.34,-0.18],[Math.PI/2+0.2,0,0])}
// seat pan and the fender sides, red, over the drive tyres
put(B,R,side([[-0.25,0.42],[0.4,0.42],[0.47,0.47],[0.48,0.64],[0.44,0.69],[-0.25,0.69]],0.82,0.02));put(B,R,RB(0.86,0.025,0.8,0.01),[0,0.7,0.12]);
put(B,K,RB(0.7,0.02,0.05,0.008),[0,0.45,0.48]);
for(const s of [-1,1]){
  // the fender over each drive tyre, its outer lip turned down
  put(B,R,side([...arc(0,0.29,0.365,Math.PI*0.1,Math.PI*0.9,16),...arc(0,0.29,0.34,Math.PI*0.9,Math.PI*0.1,16)],0.3,0.006),[s*0.585,0,0]);
  put(B,R,side([...arc(0,0.29,0.365,Math.PI*0.12,Math.PI*0.88,16),...arc(0,0.29,0.31,Math.PI*0.88,Math.PI*0.12,16)],0.014,0.004),[s*0.73,0,0]);
  // the fuel tanks: moulded, on the fenders either side of the seat, with their caps and sight strips
  put(B,PL,RB(0.24,0.17,0.44,0.05),[s*0.6,0.76,0.06]);put(B,PL,RB(0.2,0.04,0.3,0.02),[s*0.6,0.85,0.06]);
  put(B,'black',CY(0.04,0.045,0.035,20),[s*0.62,0.88,0.16]);put(B,'black',CY(0.032,0.032,0.012,20),[s*0.62,0.9,0.16]);
  put(B,'plastic#5c5f62',RB(0.004,0.11,0.02,0.002),[s*0.721,0.76,-0.02]);
  // the control towers either side of the seat that carry the lap bars, with the steering dampers
  put(B,R,RB(0.1,0.24,0.24,0.02),[s*0.39,0.6,0.28]);put(B,K,RB(0.11,0.02,0.25,0.006),[s*0.39,0.72,0.28]);
  put(B,'steel',CY(0.026,0.026,0.06,16),[s*0.36,0.7,0.3],[0,0,Math.PI/2]);
  put(B,'chrome',CY(0.008,0.008,0.18,8),[s*0.42,0.6,0.22],[0.9,0,0]);put(B,'black',CY(0.016,0.016,0.12,10),[s*0.42,0.55,0.15],[0.9,0,0])}
// the dash on the right tower: key, the PTO knob, the throttle and choke, the hour meter
put(B,'black',RB(0.14,0.03,0.2,0.01),[-0.5,0.74,0.3],[0,0,0.12]);
put(B,'plastic#e8c21a',CY(0.02,0.02,0.035,14),[-0.48,0.77,0.36]);put(B,'chrome',CY(0.01,0.01,0.02,10),[-0.53,0.765,0.28]);
put(B,'steel',RB(0.012,0.06,0.012,0.004),[-0.47,0.78,0.24],[0.3,0,0]);put(B,'black',CY(0.012,0.012,0.03,10),[-0.47,0.81,0.25]);
put(B,'black',RB(0.05,0.02,0.035,0.006),[-0.53,0.765,0.37]);put(B,'lens',RB(0.034,0.004,0.02,0.002),[-0.53,0.776,0.37]);

// ---------- the suspension seat: cushion, high back, armrests, the isolator base ----------
put(B,'black',RB(0.44,0.06,0.4,0.02),[0,0.73,0.08]);for(const s of [-1,1])put(B,'chrome',CY(0.014,0.014,0.06,8),[s*0.16,0.72,0.2]);
put(B,'seat',RB(0.5,0.09,0.46,0.04),[0,0.795,0.1]);put(B,'seat',RB(0.46,0.02,0.4,0.01),[0,0.84,0.11]);
put(B,'seat',RB(0.5,0.52,0.1,0.05),[0,1.07,-0.15],[-0.16,0,0]);put(B,'seat',RB(0.42,0.4,0.03,0.02),[0,1.07,-0.095],[-0.16,0,0]);
put(B,'black',RB(0.46,0.46,0.06,0.03),[0,1.07,-0.205],[-0.16,0,0]);
for(const s of [-1,1]){put(B,'seat',RB(0.08,0.07,0.32,0.03),[s*0.29,0.95,0.06]);put(B,'black',RB(0.03,0.16,0.04,0.01),[s*0.29,0.86,-0.07])}
for(let i=0;i<4;i++)put(B,'black',RB(0.46,0.008,0.012,0.003),[0,0.92+i*0.1,-0.1+i*0.015],[-0.16,0,0]);

// ---------- the engine behind the seat: V-twin with its blower shroud, air cleaner, muffler, pumps and oil tank ----------
put(B,K,RB(0.78,0.04,0.5,0.01),[0,0.43,-0.44]);
put(B,'steelL',RB(0.34,0.22,0.3,0.04),[0,0.55,-0.44]);
for(const s of [-1,1]){const cyl=CY(0.085,0.085,0.22,18);put(B,'steelL',cyl,[s*0.15,0.68,-0.44],[0,0,s*0.85]);
  for(let i=0;i<7;i++)put(B,'steelL',CY(0.1,0.1,0.008,18),[s*(0.1+i*0.018),0.64+i*0.016,-0.44],[0,0,s*0.85]);
  put(B,K,RB(0.12,0.1,0.16,0.02),[s*0.24,0.78,-0.44],[0,0,s*0.85]);put(B,'black',CY(0.012,0.012,0.04,8),[s*0.28,0.83,-0.4],[0,0,s*0.85])}
put(B,PL,RB(0.42,0.16,0.36,0.06),[0,0.82,-0.42]);for(let i=0;i<6;i++)put(B,'black',RB(0.3,0.006,0.012,0.002),[0,0.86+i*0.008,-0.24]);
put(B,PL,CY(0.15,0.15,0.03,32),[0,0.905,-0.42]);for(let i=0;i<12;i++){const a=i/12*Math.PI*2;put(B,'black',RB(0.015,0.006,0.09,0.002),[Math.cos(a)*0.09,0.92,-0.42+Math.sin(a)*0.09],[0,-a,0])}
// the canister air cleaner on top, its intake hose
put(B,K,CY(0.085,0.085,0.3,24),[0.05,0.98,-0.5],[0,0,Math.PI/2]);put(B,'black',CY(0.09,0.09,0.03,24),[0.21,0.98,-0.5],[0,0,Math.PI/2]);
put(B,'black',CY(0.09,0.09,0.03,24),[-0.11,0.98,-0.5],[0,0,Math.PI/2]);put(B,'paint#e8c21a',CY(0.03,0.03,0.02,14),[0.225,0.98,-0.5],[0,0,Math.PI/2]);
tube(B,'black',[[-0.13,0.98,-0.5],[-0.18,0.94,-0.46],[-0.16,0.86,-0.36]],0.03,16);
for(const s of [-1,1])put(B,'steel',RB(0.02,0.1,0.04,0.006),[s*0.1,0.91,-0.5]);
// oil filter, dipstick, starter, the muffler under its shield and the tailpipe
put(B,'paint#d8661a',CY(0.04,0.04,0.09,16),[0.16,0.5,-0.26],[Math.PI/2,0,0]);put(B,'paint#e8c21a',CY(0.01,0.01,0.03,8),[-0.12,0.72,-0.3]);
put(B,'black',CY(0.04,0.04,0.12,14),[-0.2,0.5,-0.32],[0,0,Math.PI/2]);
put(B,'steel',RB(0.5,0.13,0.14,0.04),[0,0.5,-0.68]);put(B,K,RB(0.56,0.16,0.04,0.02),[0,0.51,-0.76]);
for(let i=0;i<5;i++)put(B,'black',RB(0.4,0.01,0.012,0.003),[0,0.45+i*0.025,-0.785]);
put(B,'steel',CY(0.02,0.02,0.1,10),[0.22,0.46,-0.79],[Math.PI/2+0.4,0,0]);
// hydraulic pumps either side and the oil tank with its cap
for(const s of [-1,1]){put(B,'steel',RB(0.1,0.12,0.14,0.02),[s*0.27,0.36,-0.42]);put(B,'black',CY(0.01,0.01,0.2,6),[s*0.3,0.33,-0.24],[Math.PI/2,0,0])}
put(B,PL,RB(0.18,0.14,0.12,0.03),[-0.28,0.56,-0.58]);put(B,'black',CY(0.025,0.025,0.03,12),[-0.28,0.645,-0.58]);
// rear bumper and the hitch plate
put(B,K,RB(0.9,0.06,0.06,0.01),[0,0.33,-0.66]);put(B,K,RB(0.12,0.04,0.12,0.01),[0,0.3,-0.72]);put(B,'steel',CY(0.012,0.012,0.06,8),[0,0.33,-0.74]);
for(const s of [-1,1]){put(B,'redL',RB(0.06,0.04,0.012,0.006),[s*0.38,0.42,-0.67]);put(B,K,RB(0.06,0.18,0.05,0.01),[s*0.42,0.35,-0.6])}

// ---------- the roll bar: two-piece, folding at its knuckles, with its work lights ----------
for(const s of [-1,1]){put(B,K,RB(0.12,0.04,0.12,0.01),[s*0.42,0.52,-0.3]);put(B,K,RB(0.08,0.16,0.06,0.01),[s*0.42,0.6,-0.3]);
  tube(B,K,[[s*0.42,0.55,-0.3],[s*0.42,0.85,-0.3],[s*0.42,1.12,-0.3]],0.028,10);
  put(B,'steel',RB(0.08,0.1,0.08,0.012),[s*0.42,1.15,-0.3]);put(B,'chrome',CY(0.012,0.012,0.11,10),[s*0.42,1.15,-0.3],[0,0,Math.PI/2]);
  put(B,'paint#e8c21a',CY(0.022,0.022,0.035,14),[s*0.48,1.15,-0.3],[0,0,Math.PI/2]);
  put(B,'black',RB(0.07,0.06,0.07,0.015),[s*0.36,1.76,-0.27]);put(B,'lens',CY(0.025,0.025,0.01,16),[s*0.36,1.76,-0.235],[Math.PI/2,0,0])}
tube(B,K,[[0.42,1.18,-0.3],[0.42,1.6,-0.3],[0.39,1.72,-0.3],[0.3,1.775,-0.3],[-0.3,1.775,-0.3],[-0.39,1.72,-0.3],[-0.42,1.6,-0.3],[-0.42,1.18,-0.3]],0.028,64);

// ---------- the lap bars, each in its own pivot's frame ----------
for(const [name,s] of [['barL',1],['barR',-1]]){
  put(name,'steel',CY(0.022,0.022,0.07,14),[0,0,0],[0,0,Math.PI/2]);put(name,K,RB(0.04,0.06,0.04,0.01),[s*0.01,0.03,0]);
  tube(name,K,[[0,0.02,0],[0,0.18,0.01],[0,0.29,0.02],[-s*0.03,0.335,0.03],[-s*0.1,0.34,0.03],[-s*0.28,0.34,0.03]],0.016,40);
  put(name,'rubber',CY(0.022,0.022,0.16,16),[-s*0.19,0.34,0.03],[0,0,Math.PI/2]);put(name,'black',CY(0.024,0.024,0.012,16),[-s*0.27,0.34,0.03],[0,0,Math.PI/2])}

// ---------- rear drive tyres: 23 in turf tyres on steel rims, in each wheel's own frame ----------
const TR=0.29,TW=0.235;
const tire=new T.LatheGeometry([[0.17,-TW/2],[0.22,-TW/2-0.004],[0.255,-TW/2+0.004],[0.276,-TW/2+0.03],[0.281,-0.06],[0.283,0],[0.281,0.06],[0.276,TW/2-0.03],[0.255,TW/2-0.004],[0.22,TW/2+0.004],[0.17,TW/2]].map(([r,y])=>new T.Vector2(r,y)),48);
for(const [name,s] of [['wheelL',1],['wheelR',-1]]){
  put(name,'tire',tire,[0,0,0],[0,0,Math.PI/2]);
  // turf tread: shallow staggered bars across the crown
  for(let k=0;k<40;k++){const a=k/40*Math.PI*2;for(const o of [-1,1]){const x=o*0.045+(k%2?0.012:-0.012);
    put(name,'tire',new T.BoxGeometry(0.075,0.024,0.014),[x,Math.sin(a)*0.283,Math.cos(a)*0.283],[a,0,o*0.25])}}
  put(name,'steel',CY(0.165,0.165,0.2,32),[0,0,0],[0,0,Math.PI/2]);
  put(name,K,CY(0.15,0.15,0.012,32),[s*0.06,0,0],[0,0,Math.PI/2]);
  for(let k=0;k<6;k++){const a=k/6*Math.PI*2;put(name,'steel',CY(0.025,0.025,0.014,14),[s*0.064,Math.sin(a)*0.1,Math.cos(a)*0.1],[0,0,Math.PI/2])}
  put(name,'steel',CY(0.055,0.06,0.03,20),[s*0.075,0,0],[0,0,Math.PI/2]);
  for(let k=0;k<5;k++){const a=k/5*Math.PI*2;put(name,'chrome',CY(0.008,0.008,0.024,6),[s*0.094,Math.sin(a)*0.037,Math.cos(a)*0.037],[0,0,Math.PI/2])}
  put(name,'chrome',CY(0.018,0.018,0.012,12),[s*0.1,0,0],[0,0,Math.PI/2]);put(name,'steel',CY(0.006,0.006,0.03,6),[s*0.08,0.13,0.06],[0.4,0,0])}

// ---------- the front casters: forks trailing from the swivel, and their smooth tyres ----------
put('caster','steel',CY(0.022,0.022,0.12,14),[0,0.46,0]);put('caster','steel',CY(0.03,0.03,0.02,16),[0,0.395,0]);
put('caster',K,RB(0.17,0.025,0.1,0.008),[0,0.375,-0.02]);
for(const x of [-0.075,0.075]){put('caster',K,side([[0.02,0.37],[-0.04,0.37],[-0.13,0.12],[-0.07,0.08]],0.012,0.003),[x,0,0]);put('caster','steel',CY(0.016,0.016,0.012,12),[x*1.1,0.11,-0.1],[0,0,Math.PI/2])}
put('caster','paint#e8c21a',CY(0.006,0.006,0.012,8),[0,0.4,0.03],[Math.PI/2,0,0]);
const ctire=new T.LatheGeometry([[0.055,-0.06],[0.085,-0.064],[0.1,-0.058],[0.108,-0.04],[0.11,0],[0.108,0.04],[0.1,0.058],[0.085,0.064],[0.055,0.06]].map(([r,y])=>new T.Vector2(r,y)),36);
put('cast','tire',ctire,[0,0,0],[0,0,Math.PI/2]);put('cast','steel',CY(0.058,0.058,0.11,24),[0,0,0],[0,0,Math.PI/2]);
for(const s of [-1,1]){put('cast',K,CY(0.05,0.05,0.006,24),[s*0.056,0,0],[0,0,Math.PI/2]);put('cast','chrome',CY(0.02,0.02,0.02,12),[s*0.062,0,0],[0,0,Math.PI/2]);
  put('cast','steel',CY(0.006,0.006,0.01,6),[s*0.06,0.03,0],[0,0,Math.PI/2])}

// ---------- merge: one mesh per material in each node ----------
// each node stands where its part group stands at rest (the game reads the meshes in the node's own frame and ignores
// this; it only shows the machine put together in a viewer)
const AT={barL:[0.38,0.7,0.3],barR:[-0.38,0.7,0.3],wheelL:[0.58,0.29,0],wheelR:[-0.58,0.29,0],caster:[0.46,0,1.55],cast:[0.46,0.11,1.45]};
const root=new T.Group();root.name='mower';
for(const [part,mats] of Object.entries(parts)){const g=new T.Group();g.name=part;if(AT[part])g.position.set(...AT[part]);root.add(g);
  for(const [mat,list] of Object.entries(mats)){let m=BGU.mergeBufferGeometries(list);m=BGU.mergeVertices(m,1e-4);
    const mesh=new T.Mesh(m,new T.MeshStandardMaterial({name:mat}));mesh.name=part+'_'+mat.replace(/[^a-zA-Z0-9]/g,'');g.add(mesh)}}
return root}
