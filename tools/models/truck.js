// Corley's Island: the detailed dump truck's body panels, built from shapes and written out as models/truck.glb by
// tools/build_model.js (three.js r147 in headless Chromium). The game loads that file (js/models.js) and puts these
// panels in place of the simple truck's painted ones (the cab shell, hood, fenders, the DEF tank, the bed and the
// tailgate); everything else on the truck (chassis, tanks, lights, glass, the cab inside, the wheels) stays the game's,
// on the same physically based materials.
// The contract with the game, so a model made in Blender or bought can replace this one:
// - one node per moving part: body (the cab and frame, in the truck's own frame: origin on the ground under the middle,
//   x right, y up, z forward toward the cab; the front axle 3.1 m ahead, the tandem at -1.6 and -2.8), bed (the dump
//   body, origin at its hinge, 1.3 m up and 4.0 m behind the middle; the floor runs forward 4.9 m along z) and tail
//   (the tailgate, origin at its top hinge, 1.1 m up the bed's rear end);
// - the cab keeps its window openings where the game's glass is: windshield x ±1.0, y 2.225 to 2.775 at z 2.6; side
//   windows z 1.525 to 2.375, y 2.25 to 2.75; back window x ±0.95, y 2.225 to 2.675 at z 1.12;
// - materials named for the game's: paintW (the white cab paint), bed, bedD (the dump body and its ribs), steel, steelL,
//   chrome.
// Metres. Classic script, no modules.
function buildTruck(){
const T=THREE,BGU=T.BufferGeometryUtils,parts={};
const mtx=new T.Matrix4(),q=new T.Quaternion(),e=new T.Euler();
function put(part,mat,g,p,r){g=g.index?g.toNonIndexed():g.clone();
  e.set(...(r||[0,0,0]));q.setFromEuler(e);mtx.compose(new T.Vector3(...(p||[0,0,0])),q,new T.Vector3(1,1,1));g.applyMatrix4(mtx);
  g.deleteAttribute('uv');for(const k of Object.keys(g.attributes))if(k!=='position'&&k!=='normal')g.deleteAttribute(k);
  ((parts[part]=parts[part]||{})[mat]=parts[part][mat]||[]).push(g);return g}
const RB=(w,h,d,r)=>new T.RoundedBoxGeometry(w,h,d,2,Math.min(r,w/2-1e-4,h/2-1e-4,d/2-1e-4));
// a box from its two corners, rounded
const RBc=(part,mat,x0,y0,z0,x1,y1,z1,r)=>put(part,mat,RB(x1-x0,y1-y0,z1-z0,r),[(x0+x1)/2,(y0+y1)/2,(z0+z1)/2]);
// a side profile [[z,y],...] made into a plate across x, of a width, with rounded edges, centred on x
function side(pts,w,bev){const s=new T.Shape();pts.forEach(([z,y],i)=>i?s.lineTo(z,y):s.moveTo(z,y));
  const b=bev||0,g=new T.ExtrudeGeometry(s,{depth:Math.max(0.002,w-2*b),bevelEnabled:b>0,bevelThickness:b,bevelSize:b,bevelSegments:3,curveSegments:24});
  g.rotateY(-Math.PI/2);g.translate((w-2*b)/2,0,0);return BGU.toCreasedNormals(g,0.6)}
const arc=(r,a0,a1,n)=>Array.from({length:n+1},(_,i)=>{const a=a0+(a1-a0)*i/n;return [Math.cos(a)*r,Math.sin(a)*r]});

// ---------- cab: thin rounded panels round the window openings, so the cab inside still shows ----------
const B='body',W='paintW';
RBc(B,W,-1.175,1.45,1.1,1.175,1.5,2.6,0.02);                       // floor pan
RBc(B,W,-1.175,1.45,2.56,1.175,2.225,2.62,0.025);                 // front wall below the windshield
RBc(B,W,-1.175,2.775,2.56,1.175,2.86,2.62,0.025);                 // header above it
RBc(B,W,-1.175,1.45,1.09,1.175,2.225,1.15,0.025);                 // back wall below the back window
RBc(B,W,-1.175,2.675,1.09,1.175,2.86,1.15,0.025);                 // and above it
for(const s of [-1,1]){
  RBc(B,W,s>0?1.0:-1.175,2.2,2.56,s>0?1.175:-1.0,2.8,2.62,0.02);  // windshield posts
  RBc(B,W,s>0?0.95:-1.175,2.2,1.09,s>0?1.175:-0.95,2.7,1.15,0.02);// back window posts
  const x0=s>0?1.135:-1.175,x1=s>0?1.175:-1.135;
  RBc(B,W,x0,1.45,1.1,x1,2.25,2.62,0.015);                        // door below the window
  RBc(B,W,x0,2.75,1.1,x1,2.86,2.62,0.015);                        // above it
  RBc(B,W,x0,2.24,2.375,x1,2.76,2.62,0.015);RBc(B,W,x0,2.24,1.1,x1,2.76,1.525,0.015);
  // door seam and the rain gutter along the roof edge
  put(B,'steel',RB(0.012,0.8,0.012,0.004),[s*1.178,1.85,2.02]);put(B,'steelL',RB(0.03,0.03,1.56,0.01),[s*1.19,2.86,1.85])}
put(B,W,RB(0.05,0.55,0.03,0.012),[0,2.5,2.635]);                  // the windshield's centre post
// the roof: a domed cap with rounded edges and a sun visor over the windshield
put(B,W,RB(2.38,0.1,1.58,0.05),[0,2.89,1.85]);put(B,W,RB(2.1,0.06,1.4,0.03),[0,2.95,1.83]);
put(B,W,side([[2.62,2.86],[2.95,2.9],[2.95,2.94],[2.62,2.92]],2.2,0.015),[0,0,0]);

// ---------- hood: a sloped nose with a crown along the middle, rolled down to the grille ----------
put(B,W,side([[2.62,1.42],[4.0,1.42],[4.06,1.5],[4.06,1.98],[3.98,2.1],[3.7,2.15],[2.62,2.2]],2.0,0.06),[0,0,0]);
put(B,W,side([[2.7,2.18],[3.9,2.13],[3.9,2.17],[2.7,2.23]],0.6,0.02),[0,0,0]);
// hood side vents and the cowl between hood and windshield
for(const s of [-1,1])for(let i=0;i<4;i++)put(B,'steel',RB(0.01,0.04,0.32,0.006),[s*1.0,1.92-i*0.07,3.55]);
put(B,'steel',RB(2.1,0.05,0.12,0.02),[0,2.24,2.68]);

// ---------- fenders: rolled steel arches over the front wheels, with a flared lip ----------
for(const s of [-1,1]){
  const o=arc(0.77,0,Math.PI,24),i=arc(0.72,Math.PI,0,24),pts=[...o,...i].map(([z,y])=>[z,y]);
  put(B,W,side(pts,0.56,0.012),[s*1.05,0.55,3.1]);
  const lo=arc(0.8,0.08,Math.PI-0.08,24),li=arc(0.765,Math.PI-0.08,0.08,24);
  put(B,'steelL',side([...lo,...li],0.6,0.006),[s*1.05,0.55,3.1]);
  // the fender's top deck back to the cab step
  put(B,W,RB(0.56,0.05,0.5,0.02),[s*1.05,1.33,2.35])}

// ---------- DEF tank (left side): white plastic drum with domed ends ----------
{const g=new T.CylinderGeometry(0.21,0.21,0.55,40);g.rotateX(Math.PI/2);put(B,W,g,[-1.0,1.05,0.55]);
  for(const s of [-1,1]){const d=new T.SphereGeometry(0.21,32,8,0,Math.PI*2,0,Math.PI/2);d.scale(1,0.22,1);d.rotateX(s*Math.PI/2);put(B,W,d,[-1.0,1.05,0.55+s*0.275])}}

// ---------- the guards over the tandem ----------
for(const s of [-1,1]){put(B,'bedD',RB(0.06,0.5,1.9,0.02),[s*1.15,1.15,-2.2]);put(B,'steelL',RB(0.1,0.04,1.95,0.015),[s*1.15,1.41,-2.2])}

// ---------- the dump body: 16 ft long, sides with a rolled top rail and boxed ribs, a cab protector up front ----------
const D='bed',L=4.9;
put(D,'bedD',RB(2.3,0.12,L,0.03),[0,0.06,L/2]);
for(const s of [-1,1]){
  put(D,D,RB(0.08,1.0,L,0.02),[s*1.15,0.56,L/2]);
  {const g=new T.CylinderGeometry(0.075,0.075,L+0.08,20);g.rotateX(Math.PI/2);put(D,'bedD',g,[s*1.17,1.1,L/2])}
  put(D,'bedD',RB(0.1,0.1,L+0.04,0.03),[s*1.19,0.08,L/2]);
  for(let z=0.35;z<L-0.1;z+=0.6)put(D,'bedD',side([[-0.05,0.1],[0.05,0.1],[0.04,1.02],[-0.04,1.02]],0.09,0.012),[s*1.235,0,z]);
  // the rear corner posts and the hinge ears
  {const g=new T.CylinderGeometry(0.06,0.06,1.12,16);put(D,'bedD',g,[s*1.16,0.56,0.03])}
  put(D,'steel',RB(0.1,0.16,0.14,0.02),[s*1.08,1.08,-0.02])}
put(D,D,RB(2.3,1.15,0.1,0.025),[0,0.6,L]);
for(let i=-2;i<=2;i++)put(D,'bedD',RB(0.08,1.05,0.06,0.015),[i*0.5,0.6,L+0.07]);
// the cab protector: a sloped canopy reaching out over the cab with ribs on top
put(D,'bedD',side([[L,1.12],[L+0.92,1.18],[L+0.95,1.25],[L,1.25]],2.4,0.02),[0,0,0]);
for(let i=-2;i<=2;i++)put(D,D,RB(0.06,0.06,0.9,0.015),[i*0.5,1.29,L+0.44]);

// ---------- the tailgate: a ribbed panel hung from its top hinge ----------
const G='tail';
put(G,'bedD',RB(2.3,1.0,0.1,0.025),[0,-0.52,-0.03]);
for(let i=-2;i<=2;i++)put(G,D,RB(0.08,0.9,0.05,0.015),[i*0.45,-0.52,-0.1]);
for(let i=0;i<3;i++)put(G,D,RB(2.2,0.05,0.04,0.012),[0,-0.2-i*0.3,-0.11]);
for(const s of [-1,1])put(G,'steel',RB(0.12,0.1,0.14,0.02),[s*0.95,-0.02,-0.04]);

// ---------- merge: one mesh per part and material ----------
const root=new T.Group();root.name='truck';
for(const [part,mats] of Object.entries(parts)){const g=new T.Group();g.name=part;root.add(g);
  for(const [mat,list] of Object.entries(mats)){let m=BGU.mergeBufferGeometries(list);m=BGU.mergeVertices(m,1e-4);
    const mesh=new T.Mesh(m,new T.MeshStandardMaterial({name:mat}));mesh.name=part+'_'+mat;g.add(mesh)}}
return root}
