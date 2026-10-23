// Corley's Island: the detailed skid steer (js/skid.js), a 2,000 lb class radial-lift machine, built from shapes and
// written out as models/skid.glb by tools/build_model.js (three.js r147 in headless Chromium). The game loads it
// (js/models.js, MDL_KIT.skid in skid.js) in place of the simple shapes when Machine models are Detailed.
// The contract with the game, so a model made in Blender or bought can replace this one:
// - nodes in the skid steer's own part groups, each in that group's frame (metres; x to the operator's left, y up,
//   z forward):
//   body (origin on the ground under the middle; the wheels' centres at x ±0.9, 0.38 m up, z ±0.7; about 6 ft wide over
//   the tyres and 9 ft long without the bucket; the operator's eye at 0, 1.72, 0 inside the cab, which is clear in
//   front of it to the door glass at z 0.78; the lift arms' pivots at x ±0.82, 1.85 m up, z -0.75);
//   wheelL, wheelR (each tyre, spinning about x at its origin; L is +x, its rim facing out);
//   arm (the lift arms, in the arm group's frame: origin on the pivot axis, the arms reaching 2.44 m along +z to the
//   bucket pin; at rest the frame is tipped 35° nose down);
//   bucket (the attach plate and bucket, turning about x on the pin at its origin; the cutting edge 0.46 m below the
//   pin and 0.76 m ahead of it, the floor along y -0.46);
// - the lift and tilt rams are drawn by the game between pins it knows (skid.js), so they are not in the model: lift
//   rams from the body at x ±0.7, 1.12 m up, z -1.0 to the arm at y 0.15, z 0.8; tilt rams from the arm at x ±0.62,
//   y 0.45, z 1.62 to the attach plate at y 0.26, z 0; this model carries their brackets;
// - materials named for the game's: paintY (the yellow), paint#2b2d30 (the dark grey of the cab frame, bucket and
//   trim), black, steel, steelL, chrome, tire, seat, glass (the see-through cab glass), lens, redL, amber, lib:grating
//   (the engine grilles), rubber.
// Metres. Classic script, no modules.
function buildSkid(){
const T=THREE,BGU=T.BufferGeometryUtils,parts={};
const mtx=new T.Matrix4(),q=new T.Quaternion(),e=new T.Euler();
function put(part,mat,g,p,r,s){g=g.index?g.toNonIndexed():g.clone();
  e.set(...(r||[0,0,0]));q.setFromEuler(e);mtx.compose(new T.Vector3(...(p||[0,0,0])),q,new T.Vector3(...(s||[1,1,1])));g.applyMatrix4(mtx);
  g.deleteAttribute('uv');for(const k of Object.keys(g.attributes))if(k!=='position'&&k!=='normal')g.deleteAttribute(k);
  ((parts[part]=parts[part]||{})[mat]=parts[part][mat]||[]).push(g);return g}
const RB=(w,h,d,r)=>new T.RoundedBoxGeometry(w,h,d,Math.max(w,h,d)>0.6&&r>=0.02?2:1,Math.min(r,w/2-1e-4,h/2-1e-4,d/2-1e-4));
const CY=(rt,rb,h,n)=>new T.CylinderGeometry(rt,rb,h,n||20);
// a profile in (z, y) pressed across x, w wide, centred on x 0
function side(pts,w,bev){const s=new T.Shape();pts.forEach(([z,y],i)=>i?s.lineTo(z,y):s.moveTo(z,y));
  const b=bev||0,g=new T.ExtrudeGeometry(s,{depth:Math.max(0.002,w-2*b),bevelEnabled:b>0,bevelThickness:b,bevelSize:b,bevelSegments:2,curveSegments:16});
  g.rotateY(-Math.PI/2);g.translate((w-2*b)/2,0,0);return BGU.toCreasedNormals(g,0.6)}
// a plate along a polyline in (z, y), h either side of it (mitred at the bends)
function beam(pts,h){const up=[],dn=[];
  for(let i=0;i<pts.length;i++){const a=pts[Math.max(0,i-1)],b=pts[Math.min(pts.length-1,i+1)],dz=b[0]-a[0],dy=b[1]-a[1],L=Math.hypot(dz,dy);let nz=-dy/L,ny=dz/L,k=1;
    if(i>0&&i<pts.length-1){const p=pts[i],u=[p[0]-a[0],p[1]-a[1]],v=[b[0]-p[0],b[1]-p[1]],lu=Math.hypot(...u),lv=Math.hypot(...v);
      const n1=[-u[1]/lu,u[0]/lu],n2=[-v[1]/lv,v[0]/lv];nz=n1[0]+n2[0];ny=n1[1]+n2[1];const ln=Math.hypot(nz,ny);nz/=ln;ny/=ln;k=1/Math.max(0.5,nz*n1[0]+ny*n1[1])}
    const hh=(Array.isArray(h)?h[i]:h)*k;up.push([pts[i][0]+nz*hh,pts[i][1]+ny*hh]);dn.push([pts[i][0]-nz*hh,pts[i][1]-ny*hh])}
  return [...up,...dn.reverse()]}
function tube(part,mat,pts,r,n){const c=new T.CatmullRomCurve3(pts.map(p=>new T.Vector3(...p)),false,'catmullrom',0.1);put(part,mat,new T.TubeGeometry(c,n||Math.max(8,pts.length*8),r,10,false))}
const arc=(cz,cy,r,a0,a1,n)=>Array.from({length:n+1},(_,i)=>{const a=a0+(a1-a0)*i/n;return [cz+Math.cos(a)*r,cy+Math.sin(a)*r]});
const B='body',Y='paintY',D='paint#2b2d30',PX=0.82,PY=1.85,PZ=-0.75;

// ---------- the main frame: hull with the chaincases, belly pan, the front step and the axle hubs ----------
put(B,Y,side([[-1.2,0.44],[0.98,0.44],[1.1,0.56],[1.1,0.98],[1.02,1.1],[-1.18,1.1],[-1.26,1.0],[-1.26,0.56]],1.44,0.025));
put(B,D,side([[-1.12,0.38],[0.92,0.38],[1.02,0.46],[-1.2,0.46]],1.3,0.01));
for(const s of [-1,1]){
  // chaincase cover bolts and the axle tubes out to the hubs
  for(let i=0;i<9;i++)put(B,'steel',CY(0.012,0.012,0.012,8),[s*0.725,0.5,-0.9+i*0.225],[0,0,Math.PI/2]);
  for(const z of [-0.7,0.7]){put(B,'steel',CY(0.1,0.12,0.06,22),[s*0.745,0.38,z],[0,0,Math.PI/2]);put(B,'steel',CY(0.07,0.07,0.08,18),[s*0.78,0.38,z],[0,0,Math.PI/2])}
  // grab handle up the front post, the front tie-down loop, the side decal stripe
  tube(B,'black',[[s*0.66,1.2,0.86],[s*0.68,1.3,0.86],[s*0.68,1.85,0.86],[s*0.66,1.95,0.86]],0.016,20);
  put(B,'steel',side([[0.98,0.62],[1.08,0.62],[1.08,0.76],[0.98,0.76]],0.03,0.008),[s*0.6,0,0.04]);
  put(B,D,RB(0.006,0.06,1.6,0.003),[s*0.723,0.98,-0.05])}
// the front: step pads either side of the door, the black nose and its tie-down
put(B,'black',RB(1.3,0.03,0.24,0.01),[0,1.115,0.94]);for(let i=0;i<10;i++)put(B,'steel',RB(1.26,0.008,0.012,0.003),[0,1.134,0.84+i*0.022]);
put(B,D,RB(1.2,0.32,0.06,0.02),[0,0.72,1.11]);put(B,'steel',CY(0.02,0.02,0.4,10),[0,0.6,1.15],[0,0,Math.PI/2]);
for(const s of [-1,1])put(B,'amber',RB(0.08,0.04,0.02,0.01),[s*0.5,0.96,1.115]);

// ---------- the rear towers that carry the arms, with the pivot pins and the lift ram brackets ----------
for(const s of [-1,1]){
  put(B,Y,side([[-1.08,0.98],[-0.42,0.98],[-0.44,1.36],[-0.6,1.84],[-0.68,1.98],[-0.86,2.0],[-0.98,1.86],[-1.08,1.6]],0.15,0.02),[s*PX,0,0]);
  put(B,'steel',CY(0.1,0.1,0.2,24),[s*PX,PY,PZ],[0,0,Math.PI/2]);put(B,'chrome',CY(0.04,0.04,0.24,14),[s*PX,PY,PZ],[0,0,Math.PI/2]);
  put(B,'steel',CY(0.06,0.06,0.03,16),[s*(PX+0.12),PY,PZ],[0,0,Math.PI/2]);
  // lift ram clevis on the body top
  for(const dx of [-0.07,0.07])put(B,D,side([[-1.08,1.08],[-0.92,1.08],[-0.97,1.18],[-1.03,1.18]],0.02,0.004),[s*0.7+dx,0,0]);
  put(B,'chrome',CY(0.02,0.02,0.18,10),[s*0.7,1.12,-1.0],[0,0,Math.PI/2])}

// ---------- the engine bay between the towers: top cover with its grille, exhaust, rear door and lights ----------
put(B,Y,side([[-1.24,1.08],[-0.46,1.08],[-0.46,1.42],[-0.6,1.48],[-1.16,1.48],[-1.24,1.4]],1.36,0.02));
put(B,'black',RB(0.96,0.025,0.5,0.008),[0,1.484,-0.84]);for(let i=0;i<9;i++)put(B,D,RB(0.9,0.014,0.03,0.005),[0,1.5,-1.04+i*0.05],[0.5,0,0]);
put(B,'black',CY(0.04,0.045,0.12,14),[0.36,1.54,-0.62]);put(B,'steel',CY(0.034,0.034,0.06,12),[0.36,1.62,-0.62]);
put(B,'black',CY(0.05,0.05,0.04,14),[-0.36,1.5,-0.62]);
// the rear door: grille in a pressed frame, the handle, the light clusters in the towers, the counterweight
put(B,Y,RB(1.2,0.5,0.05,0.02),[0,0.82,-1.27]);put(B,'black',RB(1.0,0.38,0.012,0.006),[0,0.84,-1.287]);
for(let i=0;i<9;i++)put(B,Y,RB(0.96,0.016,0.04,0.006),[0,0.69+i*0.038,-1.3],[-0.6,0,0]);put(B,'black',RB(0.18,0.03,0.04,0.01),[0,1.04,-1.31]);
for(const s of [-1,1]){put(B,'black',RB(0.16,0.2,0.05,0.02),[s*0.6,1.2,-1.27]);put(B,'redL',RB(0.12,0.08,0.02,0.01),[s*0.6,1.24,-1.296]);
  put(B,'lens',RB(0.12,0.06,0.02,0.01),[s*0.6,1.14,-1.296]);put(B,'amber',RB(0.12,0.025,0.02,0.008),[s*0.6,1.085,-1.296])}
put(B,D,RB(1.42,0.18,0.12,0.03),[0,0.5,-1.24]);for(const s of [-1,1])put(B,'steel',side([[-1.34,0.46],[-1.26,0.46],[-1.26,0.58],[-1.34,0.58]],0.03,0.008),[s*0.45,0,0]);
put(B,'steel',CY(0.02,0.02,0.6,10),[0,0.52,-1.32],[0,0,Math.PI/2]);

// ---------- the cab: frame, roof, door glass, side windows and screens, rear glass ----------
const CX=0.62,CZ0=-0.46,CZ1=0.8,CY0=1.1,CY1=2.15;
for(const s of [-1,1]){
  // corner posts, the side rails, the side glass with its guard bars
  put(B,D,RB(0.07,CY1-CY0,0.08,0.015),[s*(CX-0.03),(CY0+CY1)/2,CZ1-0.06]);put(B,D,RB(0.07,CY1-CY0,0.1,0.015),[s*(CX-0.03),(CY0+CY1)/2,CZ0+0.08]);
  put(B,D,RB(0.07,0.07,CZ1-CZ0,0.015),[s*(CX-0.03),1.2,(CZ0+CZ1)/2]);put(B,D,RB(0.07,0.06,CZ1-CZ0,0.015),[s*(CX-0.03),CY1-0.04,(CZ0+CZ1)/2]);
  put(B,'glass',RB(0.012,0.84,1.06,0.004),[s*(CX-0.035),1.68,(CZ0+CZ1)/2+0.02]);
  for(const y of [1.36,1.52])put(B,D,RB(0.02,0.025,1.1,0.008),[s*(CX+0.005),y,(CZ0+CZ1)/2]);
  for(let i=0;i<5;i++)put(B,D,RB(0.02,0.36,0.02,0.006),[s*(CX+0.005),1.42,CZ0+0.2+i*0.22]);
  // the work lights on the front corners of the roof and the mirror arm
  put(B,'black',RB(0.12,0.08,0.08,0.02),[s*0.48,CY1+0.04,CZ1+0.04]);put(B,'lens',RB(0.1,0.06,0.01,0.01),[s*0.48,CY1+0.04,CZ1+0.085]);
  put(B,'black',RB(0.1,0.07,0.06,0.02),[s*0.46,CY1+0.04,CZ0-0.06]);put(B,'lens',RB(0.08,0.05,0.01,0.01),[s*0.46,CY1+0.04,CZ0-0.095])}
// the roof: pressed yellow panel with a lip and drip rail; the beacon on the back corner
put(B,Y,side([[CZ0-0.06,CY1],[CZ1+0.06,CY1],[CZ1+0.04,CY1+0.07],[CZ0+0.02,CY1+0.09],[CZ0-0.06,CY1+0.06]],2*CX+0.08,0.02));
put(B,D,RB(2*CX+0.1,0.025,CZ1-CZ0+0.14,0.01),[0,CY1-0.005,(CZ0+CZ1)/2]);
put(B,'black',CY(0.06,0.065,0.03,18),[-0.42,CY1+0.105,CZ0+0.12]);put(B,'amber',CY(0.05,0.055,0.11,18),[-0.42,CY1+0.17,CZ0+0.12]);put(B,'amber',new T.SphereGeometry(0.05,16,8,0,Math.PI*2,0,Math.PI/2),[-0.42,CY1+0.225,CZ0+0.12]);
// the front door: frame, the big glass, the wiper, the handle; the rear window
put(B,D,RB(2*CX-0.08,0.07,0.05,0.02),[0,CY0+0.09,CZ1-0.02]);put(B,D,RB(2*CX-0.08,0.06,0.05,0.02),[0,CY1-0.05,CZ1-0.02]);
for(const s of [-1,1])put(B,D,RB(0.05,CY1-CY0-0.1,0.05,0.015),[s*(CX-0.1),(CY0+CY1)/2,CZ1-0.02]);
put(B,'glass',RB(2*CX-0.2,CY1-CY0-0.2,0.012,0.004),[0,(CY0+CY1)/2+0.02,CZ1-0.015]);
put(B,'black',RB(0.012,0.5,0.012,0.004),[0.12,1.55,CZ1+0.005],[0,0,0.35]);put(B,'black',CY(0.02,0.02,0.03,10),[0.2,1.32,CZ1+0.01],[Math.PI/2,0,0]);
put(B,'chrome',RB(0.04,0.14,0.03,0.012),[-0.42,1.62,CZ1+0.02]);
put(B,'glass',RB(2*CX-0.14,0.5,0.012,0.004),[0,1.82,CZ0+0.02]);put(B,D,RB(2*CX-0.1,0.42,0.04,0.012),[0,1.36,CZ0+0.02]);

// ---------- inside: suspension seat, the seat bar, joysticks on their pods, the display, floor and pedals ----------
put(B,'black',RB(1.1,0.03,1.14,0.01),[0,1.115,0.17]);
put(B,'black',RB(0.42,0.08,0.4,0.02),[0,1.17,0.0]);put(B,'seat',RB(0.5,0.1,0.46,0.04),[0,1.25,0.04]);
put(B,'seat',RB(0.5,0.52,0.1,0.05),[0,1.55,-0.24],[-0.12,0,0]);put(B,'seat',RB(0.3,0.12,0.08,0.03),[0,1.88,-0.28]);
for(const s of [-1,1]){put(B,'black',RB(0.12,0.24,0.32,0.03),[s*0.38,1.25,0.12]);put(B,'black',RB(0.1,0.04,0.2,0.02),[s*0.38,1.39,0.14]);
  put(B,'black',CY(0.04,0.03,0.04,12),[s*0.38,1.42,0.2]);put(B,'chrome',CY(0.008,0.008,0.08,8),[s*0.38,1.46,0.2]);
  put(B,'black',RB(0.05,0.13,0.06,0.022),[s*0.38,1.55,0.22],[0.15,0,0]);put(B,'amber',RB(0.02,0.012,0.02,0.005),[s*0.38,1.62,0.24]);
  put(B,'black',RB(0.12,0.03,0.18,0.01),[s*0.18,1.16,0.56],[0.4,0,0])}
// the seat bar, raised, with its pads (down over the lap it would hide the floor)
for(const s of [-1,1])tube(B,'black',[[s*0.5,1.62,-0.22],[s*0.5,1.92,-0.12],[s*0.42,2.05,0.04]],0.02,16);
tube(B,'black',[[0.42,2.05,0.04],[0.2,2.08,0.08],[-0.2,2.08,0.08],[-0.42,2.05,0.04]],0.022,20);
put(B,'black',RB(0.16,0.12,0.18,0.03),[0.42,1.63,-0.22]);
put(B,'black',RB(0.18,0.13,0.04,0.02),[-0.42,1.98,CZ1-0.08],[-0.3,0,0]);put(B,'glass#0b1418',RB(0.15,0.1,0.006,0.004),[-0.42,1.98,CZ1-0.104],[-0.3,0,0]);

// ---------- the wheels: 10-16.5 heavy-duty tyres with chevron bars, eight-lug yellow steel rims ----------
const TR=0.38,TW=0.27;
const tire=new T.LatheGeometry([[0.2,-TW/2],[0.26,-TW/2-0.006],[0.32,-TW/2+0.004],[0.345,-TW/2+0.03],[0.353,-0.08],[0.355,0],[0.353,0.08],[0.345,TW/2-0.03],[0.32,TW/2-0.004],[0.26,TW/2+0.006],[0.2,TW/2]].map(([r,y])=>new T.Vector2(r,y)),48);
for(const [name,s] of [['wheelL',1],['wheelR',-1]]){
  put(name,'tire',tire,[0,0,0],[0,0,Math.PI/2]);
  for(let k=0;k<22;k++){const a=k/22*Math.PI*2;for(const o of [-1,1]){const x=o*0.062;
    put(name,'tire',new T.BoxGeometry(0.13,0.045,0.05),[x,Math.sin(a+o*0.07)*0.355,Math.cos(a+o*0.07)*0.355],[a+o*0.07,0,o*0.45])}}
  put(name,Y,CY(0.21,0.21,0.21,32),[0,0,0],[0,0,Math.PI/2]);put(name,Y,CY(0.19,0.19,0.012,32),[s*0.07,0,0],[0,0,Math.PI/2]);
  for(let k=0;k<8;k++){const a=(k+0.5)/8*Math.PI*2;put(name,D,CY(0.028,0.028,0.014,14),[s*0.074,Math.sin(a)*0.13,Math.cos(a)*0.13],[0,0,Math.PI/2])}
  put(name,'steel',CY(0.085,0.09,0.05,22),[s*0.09,0,0],[0,0,Math.PI/2]);
  for(let k=0;k<8;k++){const a=k/8*Math.PI*2;put(name,'chrome',CY(0.011,0.011,0.03,6),[s*0.12,Math.sin(a)*0.065,Math.cos(a)*0.065],[0,0,Math.PI/2])}
  put(name,'steel',CY(0.035,0.035,0.03,14),[s*0.125,0,0],[0,0,Math.PI/2]);put(name,'steel',CY(0.008,0.008,0.03,6),[s*0.08,0.17,0.06],[0.4,0,0])}

// ---------- the lift arms: dog-legged box-section plates, the cross tube, ram brackets and pin bosses ----------
// arm frame: pivot at the origin, the bucket pin at z 2.44; the bend keeps the arms high beside the cab at rest
const A='arm',PIN=2.44,AP=[[-0.02,0],[0.5,0.25],[1.2,0.5],[1.5,0.56],[1.82,0.5],[2.2,0.22],[2.44,0]];
for(const s of [-1,1]){
  put(A,Y,side(beam(AP,[0.13,0.12,0.12,0.12,0.11,0.1,0.09]),0.13,0.02),[s*PX,0,0]);
  put(A,D,side(beam(AP.slice(1,5),0.045),0.01,0.003),[s*(PX+0.066),0,0]);
  put(A,'steel',CY(0.12,0.12,0.15,26),[s*PX,0,0],[0,0,Math.PI/2]);put(A,'steel',CY(0.085,0.085,0.15,22),[s*PX,0,PIN],[0,0,Math.PI/2]);
  put(A,'chrome',CY(0.035,0.035,0.18,12),[s*PX,0,PIN],[0,0,Math.PI/2]);
  // the lift ram's lugs under the arm, the tilt ram's bracket inside the bend
  for(const dx of [-0.06,0.06])put(A,Y,side([[0.66,0.24],[0.94,0.24],[0.86,0.12],[0.74,0.12]],0.02,0.004),[s*0.7+dx,0,0]);
  put(A,'chrome',CY(0.02,0.02,0.16,10),[s*0.7,0.15,0.8],[0,0,Math.PI/2]);
  put(A,Y,side([[1.42,0.62],[1.7,0.56],[1.72,0.38],[1.5,0.38]],0.12,0.01),[s*0.7,0,0]);
  for(const dx of [-0.05,0.05])put(A,Y,side([[1.54,0.52],[1.7,0.52],[1.7,0.38],[1.54,0.38]],0.015,0.004),[s*0.62+dx,0,0]);
  put(A,'chrome',CY(0.018,0.018,0.14,10),[s*0.62,0.45,1.62],[0,0,Math.PI/2])}
put(A,Y,CY(0.07,0.07,2*PX,22),[0,0.1,2.28],[0,0,Math.PI/2]);put(A,D,RB(1.4,0.04,0.12,0.015),[0,0.18,2.26],[0.3,0,0]);
// the hydraulic lines along the arms to the front
for(const s of [-1,1])for(const dx of [-0.02,0.02])tube(A,'black',[[s*(0.74+dx),0.16,0.3],[s*(0.74+dx),0.42,1.3],[s*(0.74+dx),0.42,1.55],[s*(0.66+dx),0.36,1.66]],0.012,24);

// ---------- the attach plate and the bucket, in the bucket's frame (the pin at the origin) ----------
const K='bucket';
// attach plate: frame with its pivot lugs round the pin, the tilt rams' lugs at the top, the two latch levers
put(K,D,RB(1.42,0.66,0.05,0.015),[0,-0.04,0.06]);
for(const x of [-0.5,0,0.5])put(K,D,RB(0.08,0.62,0.06,0.012),[x,-0.04,0.02]);
for(const s of [-1,1]){put(K,D,CY(0.07,0.07,0.06,20),[s*0.72,0,0],[0,0,Math.PI/2]);
  for(const dx of [-0.05,0.05])put(K,D,side([[-0.05,0.2],[0.06,0.2],[0.06,0.32],[-0.01,0.32]],0.02,0.004),[s*0.62+dx,0,0]);
  put(K,'chrome',CY(0.018,0.018,0.14,10),[s*0.62,0.26,0],[0,0,Math.PI/2]);
  tube(K,'steel',[[s*0.32,0.2,0.02],[s*0.36,0.32,-0.02],[s*0.34,0.4,-0.06]],0.014,12);put(K,'black',CY(0.022,0.022,0.07,10),[s*0.34,0.43,-0.07],[0.4,0,0])}
// the bucket: back curving into the floor, side plates, spill guard with its gussets, bolt-on edge and wear strips
const BK=[[0.1,0.24],[0.1,-0.3],...[0.1,0.25,0.4,0.55,0.7,0.85,1.0].map(t=>[0.1+(1-Math.cos(t*Math.PI/2))*0.16,-0.3-Math.sin(t*Math.PI/2)*0.16]),[0.74,-0.46]];
const BKin=BK.map(([z,y],i)=>[z+(i<2?0.012:0),y+(i>1?0.012:0)]).reverse();
put(K,D,side([...BK,...BKin],1.84,0.004));
for(const s of [-1,1])put(K,D,side([[0.1,0.24],[0.36,0.2],[0.78,-0.36],[0.78,-0.475],[0.24,-0.475],[0.1,-0.34]],0.014,0.004),[s*0.925,0,0]);
put(K,D,side([[0.1,0.24],[0.4,0.2],[0.4,0.18],[0.1,0.21]],1.86,0.004));
for(const x of [-0.6,-0.2,0.2,0.6])put(K,D,side([[0.11,0.22],[0.34,0.19],[0.11,-0.02]],0.014,0.003),[x,0,0]);
put(K,'steel',RB(1.88,0.025,0.1,0.006),[0,-0.465,0.72]);for(let i=0;i<8;i++)put(K,'steel',CY(0.012,0.012,0.008,8),[-0.8+i*0.229,-0.448,0.71]);
for(const x of [-0.55,0,0.55])put(K,'steel',RB(0.06,0.02,0.5,0.006),[x,-0.48,0.42]);
put(K,'steel',RB(0.06,0.06,0.04,0.01),[0.93,-0.44,0.75]);put(K,'steel',RB(0.06,0.06,0.04,0.01),[-0.93,-0.44,0.75]);

// ---------- merge: one mesh per material in each node ----------
// each node stands where its part group stands at rest (the game reads the meshes in the node's own frame and ignores
// this; it only shows the machine put together in a viewer)
const A0=Math.atan2(-1.4,2.0),AT={wheelL:[[0.9,0.38,0.7]],wheelR:[[-0.9,0.38,0.7]],arm:[[0,PY,PZ],[-A0,0,0]],bucket:[[0,PY-1.4,PZ+2.0],[-0.15,0,0]]};
const root=new T.Group();root.name='skid';
for(const [part,mats] of Object.entries(parts)){const g=new T.Group();g.name=part;if(AT[part]){g.position.set(...AT[part][0]);if(AT[part][1])g.rotation.set(...AT[part][1])}root.add(g);
  for(const [mat,list] of Object.entries(mats)){let m=BGU.mergeBufferGeometries(list);m=BGU.mergeVertices(m,1e-4);
    const mesh=new T.Mesh(m,new T.MeshStandardMaterial({name:mat}));mesh.name=part+'_'+mat.replace(/[^a-zA-Z0-9]/g,'');g.add(mesh)}}
return root}
