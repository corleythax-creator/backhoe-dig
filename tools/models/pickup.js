// Corley's Island: the detailed pickup (Dexter's and Corley's, heavy.js kind 'pickup'), built from shapes and written
// out as models/pickup.glb by tools/build_model.js (three.js r147 in headless Chromium). The game loads it (js/models.js)
// in place of the kit-built pickup when Machine models are Detailed.
// The contract with the game, so a model made in Blender or bought can replace this one:
// - one node, body, in the pickup's own frame: origin on the ground under its middle, x right, y up, z forward; the
//   wheels' centres at x ±0.86, 0.41 m up, z ±1.85 (a 12 ft 2 in wheelbase, 32 in tyres); 19 ft 4 in long, 6 ft 6 in
//   wide; the driver's eye (heavy.js K.eye) at x 0.4, 1.62 m up, z 0.25, so the cab is open to it through the glass;
// - materials named for the game's: paintB (the blue paint), chrome, black (trim, the bed liner, plastics), steel,
//   tire, rim, tint (the glass), lens, redL, amber, seat, mirror.
// Metres. Classic script, no modules.
function buildPickup(){
const T=THREE,BGU=T.BufferGeometryUtils,parts={};
const mtx=new T.Matrix4(),q=new T.Quaternion(),e=new T.Euler();
function put(part,mat,g,p,r){g=g.index?g.toNonIndexed():g.clone();
  e.set(...(r||[0,0,0]));q.setFromEuler(e);mtx.compose(new T.Vector3(...(p||[0,0,0])),q,new T.Vector3(1,1,1));g.applyMatrix4(mtx);
  g.deleteAttribute('uv');for(const k of Object.keys(g.attributes))if(k!=='position'&&k!=='normal')g.deleteAttribute(k);
  ((parts[part]=parts[part]||{})[mat]=parts[part][mat]||[]).push(g);return g}
// rounded boxes: two segments on the big panels, one (a chamfer) on small parts
const RB=(w,h,d,r)=>new T.RoundedBoxGeometry(w,h,d,Math.max(w,h,d)>0.6?2:1,Math.min(r,w/2-1e-4,h/2-1e-4,d/2-1e-4));
const CY=(rt,rb,h,n)=>new T.CylinderGeometry(rt,rb,h,n||24);
function side(pts,w,bev){const s=new T.Shape();pts.forEach(([z,y],i)=>i?s.lineTo(z,y):s.moveTo(z,y));
  const b=bev||0,g=new T.ExtrudeGeometry(s,{depth:Math.max(0.002,w-2*b),bevelEnabled:b>0,bevelThickness:b,bevelSize:b,bevelSegments:3,curveSegments:24});
  g.rotateY(-Math.PI/2);g.translate((w-2*b)/2,0,0);return BGU.toCreasedNormals(g,0.6)}
function tube(mat,pts,r,n){const c=new T.CatmullRomCurve3(pts.map(p=>new T.Vector3(...p)),false,'catmullrom',0.1);put(B,mat,new T.TubeGeometry(c,n||Math.max(8,pts.length*8),r,10,false))}
const arc=(cz,cy,r,a0,a1,n)=>Array.from({length:n+1},(_,i)=>{const a=a0+(a1-a0)*i/n;return [cz+Math.cos(a)*r,cy+Math.sin(a)*r]});
const B='body',P='paintB',WB=1.85,WR=0.41,WX=0.86,A0=0.333,A1=Math.PI-0.333;

// ---------- the lower body: one pressed side shape across the width, cut round both wheels ----------
put(B,P,side([[2.95,0.62],[2.4,0.58],...arc(WB,WR,0.52,A0,A1,20),[1.32,0.58],[-1.32,0.58],...arc(-WB,WR,0.52,A0,A1,20),[-2.4,0.58],[-2.95,0.62],[-2.95,0.97],[2.95,0.97]],1.98,0.035));
// black flares round the arches, and the rocker sills
for(const cz of [WB,-WB])put(B,'black',side([...arc(cz,WR,0.56,A0-0.04,A1+0.04,20),...arc(cz,WR,0.515,A1+0.04,A0-0.04,20)],2.04,0.008));
for(const s of [-1,1])put(B,'black',RB(0.05,0.1,2.55,0.02),[s*0.99,0.62,0.0]);

// ---------- the front clip: hood rolling down to the grille, a crown along the middle ----------
put(B,P,side([[1.0,0.96],[2.95,0.96],[2.98,1.06],[2.94,1.24],[2.78,1.31],[1.12,1.37],[1.0,1.37]],1.96,0.05));
put(B,P,side([[1.15,1.36],[2.7,1.31],[2.7,1.33],[1.15,1.385]],0.7,0.015));
// grille: chrome surround, dark mesh with three chrome bars, a badge; headlamps with amber running lights; bumper
put(B,'black',RB(1.36,0.3,0.04,0.01),[0,1.08,2.975]);
for(const y of [0.98,1.08,1.18])put(B,'chrome',RB(1.34,0.025,0.03,0.008),[0,y,2.99]);
put(B,'chrome',RB(1.48,0.05,0.05,0.02),[0,1.25,2.98]);put(B,'chrome',RB(1.48,0.05,0.05,0.02),[0,0.91,2.98]);
for(const s of [-1,1]){put(B,'chrome',RB(0.05,0.38,0.05,0.02),[s*0.72,1.08,2.98]);
  put(B,'lens',RB(0.3,0.15,0.05,0.03),[s*0.86,1.16,2.96]);put(B,'amber',RB(0.28,0.02,0.04,0.01),[s*0.86,1.065,2.965]);
  put(B,'lens',CY(0.045,0.045,0.04,16),[s*0.78,0.64,3.07],[Math.PI/2,0,0])}
put(B,'chrome',RB(0.18,0.1,0.02,0.01),[0,1.08,3.0]);
put(B,'chrome',RB(2.04,0.2,0.22,0.06),[0,0.7,3.0]);put(B,'black',RB(1.9,0.12,0.18,0.03),[0,0.55,2.95]);
for(const s of [-1,1])put(B,'steel',RB(0.06,0.08,0.12,0.02),[s*0.45,0.5,3.05]);

// ---------- the crew cab: the lower doors to the beltline, the glasshouse, its pillars and the roof ----------
put(B,P,RB(1.98,0.42,1.86,0.04),[0,1.16,0.1]);
// the glass, tinted, as one block (from the driver's seat it is seen from inside, where it does not draw)
put(B,'tint',side([[1.0,1.35],[0.24,1.92],[-0.78,1.92],[-0.82,1.35]],1.74,0.02));
put(B,P,side([[0.27,1.9],[-0.81,1.9],[-0.85,1.98],[0.22,2.0]],1.86,0.03));
for(const s of [-1,1]){tube(P,[[s*0.88,1.37,1.0],[s*0.875,1.62,0.66],[s*0.87,1.92,0.25]],0.04);
  put(B,P,RB(0.05,0.56,0.12,0.02),[s*0.875,1.64,0.1]);put(B,P,RB(0.05,0.56,0.16,0.02),[s*0.875,1.64,-0.76]);
  // door seams and handles, the mirror on its arm, the running board
  for(const z of [0.98,0.16,-0.8])put(B,'black',RB(0.012,0.4,0.012,0.004),[s*0.993,1.16,z]);
  for(const z of [0.62,-0.22])put(B,'black',RB(0.02,0.04,0.16,0.01),[s*1.0,1.28,z]);
  tube('black',[[s*0.9,1.45,0.88],[s*1.02,1.47,0.86],[s*1.1,1.5,0.84]],0.018);
  put(B,'black',RB(0.1,0.22,0.26,0.04),[s*1.14,1.52,0.83]);put(B,'mirror',RB(0.01,0.18,0.22,0.03),[s*1.14,1.52,0.77]);
  put(B,'black',RB(0.2,0.05,2.0,0.02),[s*1.08,0.5,0.05]);for(const z of [0.8,-0.7])put(B,'steel',RB(0.12,0.05,0.06,0.01),[s*0.98,0.52,z])}
// inside, seen through the glass: dash, steering wheel on its column, front seats and the rear bench
put(B,'black',RB(1.74,0.16,0.36,0.05),[0,1.42,0.8]);put(B,'black',RB(1.6,0.04,0.2,0.02),[0,1.51,0.88]);
put(B,'black',new T.TorusGeometry(0.19,0.022,10,32),[0.4,1.52,0.6],[-1.1,0,0]);put(B,'black',CY(0.03,0.03,0.3,10),[0.4,1.45,0.72],[-1.1,0,0]);
for(const x of [0.4,-0.4]){put(B,'seat',RB(0.5,0.6,0.14,0.06),[x,1.62,-0.02],[-0.15,0,0]);put(B,'seat',RB(0.26,0.18,0.1,0.04),[x,2.0,-0.08])}
put(B,'seat',RB(1.5,0.55,0.14,0.06),[0,1.6,-0.7],[-0.12,0,0]);

// ---------- the bed: liner floor with ribs, wheel wells, sides with capped rails, tailgate and lamps ----------
put(B,'black',RB(1.72,0.04,2.04,0.01),[0,0.98,-1.87]);
for(let x=-0.7;x<=0.71;x+=0.2)put(B,'black',RB(0.05,0.02,2.0,0.008),[x,1.005,-1.87]);
for(const s of [-1,1]){put(B,'black',RB(0.26,0.26,0.95,0.06),[s*0.76,1.1,-1.85]);
  put(B,P,RB(0.1,0.38,2.08,0.02),[s*0.945,1.16,-1.87]);put(B,'black',RB(0.15,0.04,2.1,0.015),[s*0.95,1.36,-1.87]);
  put(B,'redL',RB(0.07,0.32,0.1,0.02),[s*0.96,1.16,-2.88]);put(B,'black',RB(0.012,0.38,0.012,0.004),[s*0.993,1.16,-0.84])}
put(B,P,RB(1.98,0.4,0.08,0.02),[0,1.16,-0.84]);put(B,'black',RB(1.98,0.04,0.12,0.015),[0,1.36,-0.84]);
put(B,P,RB(1.86,0.42,0.07,0.02),[0,1.17,-2.91]);put(B,'black',RB(0.32,0.07,0.03,0.015),[0,1.3,-2.95]);put(B,'chrome',RB(0.4,0.07,0.015,0.008),[0,1.12,-2.95]);
put(B,'chrome',RB(2.02,0.19,0.2,0.06),[0,0.69,-2.97]);for(const s of [-1,1])put(B,'black',RB(0.4,0.02,0.12,0.01),[s*0.6,0.79,-2.98]);
put(B,'steel',RB(0.1,0.1,0.25,0.01),[0,0.56,-3.0]);

// ---------- underneath: frame rails, front skid plate, the rear axle and diff, exhaust ----------
for(const s of [-1,1])put(B,'steel',RB(0.1,0.18,5.2,0.01),[s*0.48,0.5,0]);
put(B,'steel',RB(1.0,0.04,0.6,0.01),[0,0.4,2.4]);
put(B,'steel',CY(0.06,0.06,1.64,12),[0,0.41,-WB],[0,0,Math.PI/2]);put(B,'steel',new T.SphereGeometry(0.16,16,10),[0,0.41,-WB]);
tube('steel',[[0.3,0.45,0.9],[0.32,0.42,-1.0],[0.62,0.42,-2.3],[0.66,0.42,-2.92]],0.035);put(B,'chrome',CY(0.045,0.045,0.12,16),[0.66,0.42,-2.97],[Math.PI/2,0,0]);

// ---------- wheels: treaded tyres on their sidewalls, six-spoke alloy rims, lug nuts, caps ----------
const tire=new T.LatheGeometry([[0.26,-0.145],[0.33,-0.152],[0.385,-0.138],[0.408,-0.112],[0.41,0],[0.408,0.112],[0.385,0.138],[0.33,0.152],[0.26,0.145]].map(([r,y])=>new T.Vector2(r,y)),40);
for(const s of [-1,1])for(const cz of [WB,-WB]){const x=s*WX;put(B,'tire',tire,[x,WR,cz],[0,0,Math.PI/2]);
  for(let k=0;k<30;k++){const a=k/30*Math.PI*2;for(const o of [-0.065,0.065])put(B,'tire',new T.BoxGeometry(0.1,0.022,0.055),[x+o,WR+Math.sin(a)*0.414,cz+Math.cos(a)*0.414],[a+(o>0?0.1:-0.1),0,0])}
  put(B,'rim',CY(0.255,0.255,0.24,32),[x,WR,cz],[0,0,Math.PI/2]);
  const f=x+s*0.125;put(B,'rim',CY(0.24,0.24,0.02,32),[f-s*0.02,WR,cz],[0,0,Math.PI/2]);
  for(let k=0;k<6;k++){const a=k/6*Math.PI*2;put(B,'chrome',RB(0.025,0.2,0.05,0.01),[f,WR+Math.sin(a)*0.13,cz+Math.cos(a)*0.13],[a,0,0])}
  put(B,'chrome',CY(0.06,0.07,0.04,20),[f+s*0.01,WR,cz],[0,0,Math.PI/2]);
  for(let k=0;k<6;k++){const a=(k+0.5)/6*Math.PI*2;put(B,'steel',CY(0.012,0.012,0.03,6),[f,WR+Math.sin(a)*0.085,cz+Math.cos(a)*0.085],[0,0,Math.PI/2])}}

// ---------- merge: one mesh per material ----------
const root=new T.Group();root.name='pickup';
for(const [part,mats] of Object.entries(parts)){const g=new T.Group();g.name=part;root.add(g);
  for(const [mat,list] of Object.entries(mats)){let m=BGU.mergeBufferGeometries(list);m=BGU.mergeVertices(m,1e-4);
    const mesh=new T.Mesh(m,new T.MeshStandardMaterial({name:mat}));mesh.name=part+'_'+mat;g.add(mesh)}}
return root}
