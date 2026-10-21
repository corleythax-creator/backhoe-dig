// Corley's Island: the detailed four-wheeler (Dexter's and Corley's, heavy.js kind 'atv'), built from shapes and
// written out as models/atv.glb by tools/build_model.js (three.js r147 in headless Chromium). The game loads it
// (js/models.js) in place of the kit-built one when Machine models are Detailed.
// The contract with the game, so a model made in Blender or bought can replace this one:
// - one node, body, in the four-wheeler's own frame: origin on the ground under its middle, x right, y up, z forward;
//   the wheels' centres at x ±0.47, 0.31 m up, z ±0.64 (a 50 in wheelbase, 25 in tyres); the seat's top about 0.97 m
//   up, centred 0.2 m behind the middle, and the bars about 1.13 m up at z 0.42, where the game sits its rider;
// - materials named for the game's: paintR (the red plastics), black (floorboards, grips, trim), steel (frame, racks),
//   chrome, tire, rim, seat, lens, redL.
// Metres. Classic script, no modules.
function buildAtv(){
const T=THREE,BGU=T.BufferGeometryUtils,parts={};
const mtx=new T.Matrix4(),q=new T.Quaternion(),e=new T.Euler();
function put(part,mat,g,p,r){g=g.index?g.toNonIndexed():g.clone();
  e.set(...(r||[0,0,0]));q.setFromEuler(e);mtx.compose(new T.Vector3(...(p||[0,0,0])),q,new T.Vector3(1,1,1));g.applyMatrix4(mtx);
  g.deleteAttribute('uv');for(const k of Object.keys(g.attributes))if(k!=='position'&&k!=='normal')g.deleteAttribute(k);
  ((parts[part]=parts[part]||{})[mat]=parts[part][mat]||[]).push(g);return g}
// rounded boxes: two segments on the big panels, one (a chamfer) on small parts
const RB=(w,h,d,r)=>new T.RoundedBoxGeometry(w,h,d,Math.max(w,h,d)>0.6?2:1,Math.min(r,w/2-1e-4,h/2-1e-4,d/2-1e-4));
const CY=(rt,rb,h,n)=>new T.CylinderGeometry(rt,rb,h,n||20);
function side(pts,w,bev){const s=new T.Shape();pts.forEach(([z,y],i)=>i?s.lineTo(z,y):s.moveTo(z,y));
  const b=bev||0,g=new T.ExtrudeGeometry(s,{depth:Math.max(0.002,w-2*b),bevelEnabled:b>0,bevelThickness:b,bevelSize:b,bevelSegments:3,curveSegments:24});
  g.rotateY(-Math.PI/2);g.translate((w-2*b)/2,0,0);return BGU.toCreasedNormals(g,0.6)}
function tube(mat,pts,r,n){const c=new T.CatmullRomCurve3(pts.map(p=>new T.Vector3(...p)),false,'catmullrom',0.1);put(B,mat,new T.TubeGeometry(c,n||Math.max(6,pts.length*6),r,8,false))}
const B='body',P='paintR',WX=0.47,WR=0.31,WB=0.64;

// ---------- wheels: knobby tyres, steel rims, four lugs ----------
const tire=new T.LatheGeometry([[0.17,-0.13],[0.24,-0.135],[0.29,-0.12],[0.305,-0.09],[0.305,0.09],[0.29,0.12],[0.24,0.135],[0.17,0.13]].map(([r,y])=>new T.Vector2(r,y)),32);
for(const s of [-1,1])for(const cz of [WB,-WB]){const x=s*WX;put(B,'tire',tire,[x,WR,cz],[0,0,Math.PI/2]);
  for(let k=0;k<18;k++){const a=k/18*Math.PI*2;for(const [o,w] of [[-0.075,0.07],[0,0.06],[0.075,0.07]]){const b=(k%2?0.5:0)/18*Math.PI*2*(o===0?1:0);
    put(B,'tire',new T.BoxGeometry(w,0.03,0.05),[x+o,WR+Math.sin(a+b)*0.31,cz+Math.cos(a+b)*0.31],[a+b,0,0])}}
  put(B,'rim',CY(0.165,0.165,0.18,24),[x,WR,cz],[0,0,Math.PI/2]);put(B,'rim',CY(0.14,0.14,0.02,24),[x+s*0.09,WR,cz],[0,0,Math.PI/2]);
  put(B,'chrome',CY(0.04,0.04,0.03,16),[x+s*0.1,WR,cz],[0,0,Math.PI/2]);
  for(let k=0;k<4;k++){const a=(k+0.5)/4*Math.PI*2;put(B,'steel',CY(0.01,0.01,0.03,6),[x+s*0.1,WR+Math.sin(a)*0.06,cz+Math.cos(a)*0.06],[0,0,Math.PI/2])}}

// ---------- frame: rails, uprights, the front A-arms and coil-over shocks, the rear swingarm and axle ----------
for(const s of [-1,1]){tube('steel',[[s*0.17,0.28,0.85],[s*0.17,0.26,0.3],[s*0.17,0.26,-0.4],[s*0.17,0.32,-0.85]],0.022);
  tube('steel',[[s*0.15,0.62,0.75],[s*0.16,0.7,0.2],[s*0.16,0.72,-0.4],[s*0.17,0.66,-0.85]],0.02);
  for(const z of [0.75,0.1,-0.5])tube('steel',[[s*0.17,0.27,z],[s*0.16,0.68,z]],0.018);
  // the front suspension: upper and lower arms to the knuckle, a shock with its spring
  for(const [y0,y1] of [[0.3,0.27],[0.45,0.38]])for(const dz of [-0.08,0.08])tube('steel',[[s*0.17,y0,WB+dz],[s*0.38,y1,WB]],0.014);
  put(B,'steel',RB(0.05,0.16,0.06,0.015),[s*0.38,WR,WB]);
  tube('chrome',[[s*0.33,0.36,WB+0.03],[s*0.2,0.68,WB-0.05]],0.016);
  {const pts=[];for(let i=0;i<=60;i++){const t=i/60,a=t*Math.PI*14;pts.push([s*(0.33-0.13*t)+Math.cos(a)*0.035,0.4+0.25*t,WB+0.03-0.08*t+Math.sin(a)*0.035])}tube('paintR',pts,0.007,240)}
  // the rear: swingarm to the axle housing, the CV boots
  tube('steel',[[s*0.15,0.36,-0.2],[s*0.2,0.33,-WB]],0.025);put(B,'black',CY(0.04,0.03,0.12,12),[s*0.32,WR,WB],[0,0,Math.PI/2])}
put(B,'steel',CY(0.035,0.035,0.8,12),[0,WR,-WB],[0,0,Math.PI/2]);put(B,'steel',RB(0.22,0.16,0.16,0.03),[0,WR,-WB]);
tube('chrome',[[0,0.4,-0.25],[0,0.72,-0.55]],0.02);

// ---------- engine, exhaust and muffler ----------
put(B,'steel',RB(0.34,0.3,0.42,0.05),[0,0.48,0.0]);for(let i=0;i<5;i++)put(B,'steel',RB(0.36,0.012,0.2,0.004),[0,0.66+i*0.025,0.1]);
put(B,'black',RB(0.24,0.18,0.3,0.04),[0,0.42,-0.3]);
tube('chrome',[[0.12,0.62,0.18],[0.22,0.58,0.05],[0.26,0.55,-0.45],[0.28,0.6,-0.7]],0.022);put(B,'steel',CY(0.07,0.07,0.32,16),[0.28,0.62,-0.82],[Math.PI/2,0,0]);
put(B,'chrome',CY(0.03,0.03,0.06,12),[0.28,0.62,-1.0],[Math.PI/2,0,0]);

// ---------- plastics: front and rear fenders over the wheels, the nose with its lamps, the side panels ----------
put(B,P,side([[0.22,0.6],[0.42,0.66],[0.64,0.71],[0.86,0.68],[1.02,0.6],[1.08,0.52],[1.02,0.5],[0.9,0.57],[0.64,0.62],[0.42,0.6],[0.26,0.55]],1.18,0.03));
put(B,P,side([[-0.2,0.62],[-0.42,0.68],[-0.64,0.73],[-0.88,0.7],[-1.02,0.63],[-1.07,0.55],[-1.0,0.53],[-0.9,0.6],[-0.64,0.65],[-0.42,0.63],[-0.24,0.57]],1.18,0.03));
put(B,P,side([[0.95,0.6],[1.1,0.62],[1.14,0.72],[1.06,0.8],[0.9,0.78]],0.52,0.03));
for(const s of [-1,1]){put(B,'lens',RB(0.12,0.07,0.04,0.02),[s*0.14,0.72,1.12],[0.4,0,0]);put(B,'black',RB(0.16,0.1,0.02,0.02),[s*0.14,0.72,1.1],[0.4,0,0])}
for(const s of [-1,1]){put(B,P,RB(0.06,0.24,0.62,0.03),[s*0.22,0.68,0.02]);
  // floorboards with their raised outer lips
  put(B,'black',RB(0.28,0.03,0.48,0.01),[s*0.4,0.36,-0.02]);put(B,'black',RB(0.03,0.08,0.48,0.01),[s*0.54,0.39,-0.02]);
  for(let z=-0.2;z<0.2;z+=0.08)put(B,'black',RB(0.24,0.012,0.02,0.004),[s*0.4,0.38,z])}
// the tank cover and fuel cap, the seat, the rear lamp
put(B,P,side([[0.12,0.78],[0.5,0.8],[0.52,0.9],[0.32,0.96],[0.12,0.95]],0.36,0.04));put(B,'chrome',CY(0.035,0.035,0.03,16),[0,0.97,0.3]);
put(B,'seat',side([[0.14,0.8],[-0.58,0.84],[-0.66,0.9],[-0.58,0.97],[0.06,0.97],[0.18,0.9]],0.36,0.05));
put(B,'redL',RB(0.12,0.05,0.03,0.015),[0,0.66,-1.06]);put(B,'steel',RB(0.06,0.06,0.14,0.01),[0,0.36,-0.95]);put(B,'chrome',new T.SphereGeometry(0.025,12,8),[0,0.41,-1.02]);

// ---------- the bars: steering post, handlebar, grips, levers, the pod with its gauge ----------
tube('steel',[[0,0.72,0.55],[0,0.95,0.48],[0,1.08,0.43]],0.02);
tube('chrome',[[-0.38,1.15,0.47],[-0.2,1.12,0.43],[0,1.11,0.42],[0.2,1.12,0.43],[0.38,1.15,0.47]],0.012,30);
for(const s of [-1,1]){put(B,'black',CY(0.018,0.018,0.11,12),[s*0.36,1.148,0.465],[0,0,Math.PI/2+s*0.1]);
  tube('black',[[s*0.27,1.15,0.47],[s*0.33,1.15,0.52]],0.006)}
put(B,'black',RB(0.2,0.08,0.12,0.03),[0,1.15,0.4]);put(B,'lens',RB(0.08,0.03,0.01,0.01),[0,1.18,0.355],[0.5,0,0]);

// ---------- racks: tubular steel, front and back, with cross bars ----------
for(const [z0,z1,y] of [[0.5,0.98,0.84],[-0.52,-1.0,0.88]]){const zm=(z0+z1)/2;
  tube('steel',[[-0.44,y,z0],[-0.46,y,zm],[-0.44,y,z1],[0,y,z1+(z1>0?0.02:-0.02)],[0.44,y,z1],[0.46,y,zm],[0.44,y,z0]],0.016,40);
  for(const x of [-0.25,0,0.25])tube('steel',[[x,y,z0],[x,y,z1]],0.01);for(const z of [z0,zm])tube('steel',[[-0.45,y,z],[0.45,y,z]],0.01);
  for(const s of [-1,1])tube('steel',[[s*0.4,y,z0],[s*0.3,y-0.18,z0]],0.012)}

// ---------- merge: one mesh per material ----------
const root=new T.Group();root.name='atv';
for(const [part,mats] of Object.entries(parts)){const g=new T.Group();g.name=part;root.add(g);
  for(const [mat,list] of Object.entries(mats)){let m=BGU.mergeBufferGeometries(list);m=BGU.mergeVertices(m,1e-4);
    const mesh=new T.Mesh(m,new T.MeshStandardMaterial({name:mat}));mesh.name=part+'_'+mat;g.add(mesh)}}
return root}
