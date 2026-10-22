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
//   chrome, black (rubber gaskets), amber (the cab's clearance lights).
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
// a rounded rectangle traced into a shape or a hole (x0,y0 to x1,y1, corners of radius r)
function rr(P,x0,y0,x1,y1,r){r=Math.min(r,(x1-x0)/2-1e-4,(y1-y0)/2-1e-4);const H=Math.PI/2;
  P.moveTo(x0+r,y0);P.lineTo(x1-r,y0);P.absarc(x1-r,y0+r,r,-H,0,false);P.lineTo(x1,y1-r);P.absarc(x1-r,y1-r,r,0,H,false);
  P.lineTo(x0+r,y1);P.absarc(x0+r,y1-r,r,H,2*H,false);P.lineTo(x0,y0+r);P.absarc(x0+r,y0+r,r,2*H,3*H,false);return P}
const hole=(...a)=>rr(new T.Path(),...a);
// a shape extruded to a plate: across x (the shape in z,y, centred on x), front to back (in x,y, centred on z), or up
// (in x and -z, from y 0 to its height); the edges rounded by bev
function ext(sh,d,bev,seg){const b=bev||0;return new T.ExtrudeGeometry(sh,{depth:Math.max(0.002,d-2*b),bevelEnabled:b>0,bevelThickness:b,bevelSize:b,bevelSegments:2,curveSegments:seg||6})}
function sideS(sh,w,bev,seg){const b=bev||0,g=ext(sh,w,b,seg);g.rotateY(-Math.PI/2);g.translate((w-2*b)/2,0,0);return BGU.toCreasedNormals(g,0.6)}
function faceS(sh,d,bev,seg){const b=bev||0,g=ext(sh,d,b,seg);g.translate(0,0,-(d-2*b)/2);return BGU.toCreasedNormals(g,0.6)}
function planS(sh,h,bev,seg){const b=bev||0,g=ext(sh,h,b,seg);g.rotateX(-Math.PI/2);g.translate(0,b,0);return BGU.toCreasedNormals(g,0.6)}
// a shell lofted through cross-sections along z, each {z, hw: half width, yb: bottom edge, yt: top of the sides, r: the
// shoulder's radius, c: how much the top crowns in the middle}: flat sides, rounded shoulders, a crowned top; the last
// section is closed by a flat face
function loft(secs,m,k){const rows=secs.map(S=>{const {hw,yb,yt,r,c}=S,p=[[-hw,yb]],w=hw-r;
    for(let i=0;i<=m;i++){const a=Math.PI-i/m*Math.PI/2;p.push([-w+Math.cos(a)*r,yt-r+Math.sin(a)*r])}
    for(let i=1;i<k;i++){const x=-w+2*w*i/k;p.push([x,yt+c*(1-(x/w)**2)])}
    for(let i=0;i<=m;i++){const a=Math.PI/2-i/m*Math.PI/2;p.push([w+Math.cos(a)*r,yt-r+Math.sin(a)*r])}
    p.push([hw,yb]);return p.map(([x,y])=>[x,y,S.z])});
  const n=rows[0].length,pos=[],idx=[];rows.forEach(r=>r.forEach(v=>pos.push(...v)));
  for(let i=0;i<rows.length-1;i++)for(let j=0;j<n-1;j++){const a=i*n+j,b=a+n;idx.push(a,b,a+1,b,b+1,a+1)}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();
  const f=rows[rows.length-1],S=secs[secs.length-1],cp=[0,(S.yb+S.yt)/2,S.z],fp=[...cp],fi=[];f.forEach(v=>fp.push(...v));
  for(let j=1;j<n;j++)fi.push(0,j+1,j);const fg=new T.BufferGeometry();fg.setAttribute('position',new T.Float32BufferAttribute(fp,3));fg.setIndex(fi);fg.computeVertexNormals();
  return [g,fg]}

// ---------- cab: a shell of thin panels with rounded corners round the window openings, so the cab inside still shows ----------
const B='body',W='paintW',CR=0.1;
RBc(B,W,-1.175,1.45,1.1,1.175,1.5,2.6,0.02);                       // floor pan
// the walls: doors and their windows, the front round the two-piece windshield, the back round its window; each
// opening's corners rounded and its edges rolled
for(const s of [-1,1]){const sh=rr(new T.Shape(),1.09+CR,1.45,2.62-CR,2.86,0.001);sh.holes.push(hole(1.525,2.25,2.375,2.75,0.06));put(B,W,sideS(sh,0.04,0.006),[s*1.155,0,0])}
{const sh=rr(new T.Shape(),-1.175+CR,1.45,1.175-CR,2.86,0.001);sh.holes.push(hole(-1.0,2.225,1.0,2.775,0.05));put(B,W,faceS(sh,0.06,0.006),[0,0,2.59])}
{const sh=rr(new T.Shape(),-1.175+CR,1.45,1.175-CR,2.86,0.001);sh.holes.push(hole(-0.95,2.225,0.95,2.675,0.05));put(B,W,faceS(sh,0.06,0.006),[0,0,1.12])}
// the four corners: rounded posts, a quarter of a thick tube each (in plan, x and -z)
for(const [cx,cz,a0] of [[1,1,-Math.PI/2],[-1,1,Math.PI],[1,-1,0],[-1,-1,Math.PI/2]]){
  const x=cx*(1.175-CR),z=cz>0?2.62-CR:1.09+CR,sh=new T.Shape();
  sh.absarc(x,-z,CR,a0,a0+Math.PI/2,false);sh.absarc(x,-z,CR-0.05,a0+Math.PI/2,a0,true);put(B,W,planS(sh,1.41,0,12),[0,1.45,0])}
// window gaskets: black rubber rolled round each opening, and the windshield's centre post
for(const s of [-1,1]){const sh=rr(new T.Shape(),1.505,2.23,2.395,2.77,0.075);sh.holes.push(hole(1.525,2.25,2.375,2.75,0.06));put(B,'black',sideS(sh,0.016,0.004),[s*1.18,0,0])}
{const sh=rr(new T.Shape(),-1.02,2.205,1.02,2.795,0.065);sh.holes.push(hole(-1.0,2.225,1.0,2.775,0.05));put(B,'black',faceS(sh,0.016,0.004),[0,0,2.625])}
{const sh=rr(new T.Shape(),-0.97,2.205,0.97,2.695,0.065);sh.holes.push(hole(-0.95,2.225,0.95,2.675,0.05));put(B,'black',faceS(sh,0.016,0.004),[0,0,1.085])}
put(B,W,RB(0.05,0.55,0.03,0.012),[0,2.5,2.635]);put(B,'black',RB(0.08,0.56,0.012,0.004),[0,2.5,2.627]);
for(const s of [-1,1])put(B,'steelL',RB(0.03,0.03,1.4,0.01),[s*1.19,2.86,1.85]);   // rain gutters along the roof edge
// the roof: a slab with deeply rounded edges and corners, a raised panel on top, and the sun visor over the windshield
// carrying the five amber clearance lights
put(B,W,planS(rr(new T.Shape(),-1.135,-2.6,1.135,-1.105,0.06),0.12,0.045),[0,2.84,0]);
put(B,W,RB(1.9,0.05,1.2,0.024),[0,2.97,1.84]);
put(B,W,side([[2.6,2.9],[2.99,2.885],[3.0,2.915],[2.96,2.94],[2.6,2.97]],2.26,0.015),[0,0,0]);
for(let i=-2;i<=2;i++){const x=i*0.34,g=new T.SphereGeometry(0.042,16,6,0,Math.PI*2,0,Math.PI/2);g.scale(1,0.55,1);g.rotateX(Math.PI/2);
  put(B,'amber',g,[x,2.913,2.995]);put(B,'black',RB(0.11,0.05,0.02,0.008),[x,2.913,2.99])}

// ---------- hood: a lofted shell, flat sides rolling over rounded shoulders onto a crowned top, the nose rolled down to
// the grille ----------
{const H=[[2.62,1.0,2.2,0.14,0.035],[3.1,1.005,2.185,0.145,0.035],[3.6,1.015,2.16,0.155,0.03],[3.85,1.02,2.13,0.17,0.025],
    [3.96,1.022,2.1,0.19,0.02],[4.02,1.02,2.06,0.21,0.015],[4.055,1.012,2.02,0.22,0.01],[4.07,1.0,1.99,0.22,0.005]]
    .map(([z,hw,yt,r,c])=>({z,hw,yb:1.42,yt,r,c}));
  const [shell,face]=loft(H,8,14);put(B,W,shell);put(B,W,face);
  // its underside closed, a flange along the bottom edges, the seam where it tilts away from the cowl
  RBc(B,'steel',-0.98,1.40,2.62,0.98,1.44,4.04,0.01);
  for(const s of [-1,1])put(B,W,RB(0.03,0.035,1.44,0.01),[s*0.995,1.435,3.34]);
  put(B,'black',RB(1.86,0.012,0.012,0.004),[0,2.238,2.64])}
// hood side intakes: a dark recess behind angled louvres in the body colour, in a rolled frame
for(const s of [-1,1]){put(B,'black',RB(0.01,0.22,0.34,0.006),[s*1.016,1.82,3.55]);
  for(let i=0;i<6;i++)put(B,W,RB(0.014,0.016,0.32,0.006),[s*1.022,1.725+i*0.038,3.55],[s*-0.5,0,0]);
  const sh=rr(new T.Shape(),3.37,1.7,3.73,1.94,0.03);sh.holes.push(hole(3.385,1.715,3.715,1.925,0.02));put(B,W,sideS(sh,0.016,0.004),[s*1.022,0,0])}
put(B,'steel',RB(2.1,0.05,0.12,0.02),[0,2.24,2.68]);                // the cowl between hood and windshield

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

// ---------- the dump body: 16 ft long; smooth sides between a boxed top rail and a rub rail, tapered side braces, boxed
// corner posts, a braced front wall and a cab protector on gussets ----------
const D='bed',L=4.9;
put(D,'bedD',RB(2.3,0.12,L,0.03),[0,0.06,L/2]);
for(const s of [-1,1]){
  put(D,D,RB(0.06,0.98,L,0.02),[s*1.16,0.57,L/2]);                         // the side sheet
  put(D,'bedD',RB(0.16,0.16,L+0.1,0.035),[s*1.19,1.12,L/2]);               // top rail
  put(D,'bedD',RB(0.12,0.12,L+0.06,0.03),[s*1.2,0.1,L/2]);                 // rub rail
  // side braces, spaced to clear the marker lights, wider at the foot
  for(let z=0.7;z<L-0.3;z+=0.7)put(D,'bedD',side([[-0.06,0.15],[0.06,0.15],[0.04,1.05],[-0.04,1.05]],0.08,0.012),[s*1.23,0,z]);
  for(const z of [0.35,L/2,L-0.35])put(D,'steel',RB(0.05,0.12,0.18,0.012),[s*1.21,0.92,z]);   // marker-light pads
  put(D,'bedD',RB(0.12,1.12,0.12,0.03),[s*1.2,0.58,0.04]);                 // rear corner posts
  put(D,'bedD',RB(0.12,1.14,0.12,0.03),[s*1.2,0.6,L]);                     // front corner posts
  put(D,'steel',RB(0.1,0.16,0.14,0.02),[s*1.08,1.08,-0.02]);               // tailgate hinge ears
  put(D,'bedD',side([[L,0.62],[L,1.14],[L+0.86,1.16]],0.03,0.008),[s*1.19,0,0])}  // canopy gussets
put(D,D,RB(2.3,1.15,0.08,0.025),[0,0.6,L]);
put(D,'bedD',RB(2.44,0.14,0.14,0.03),[0,1.13,L]);
for(let i=-2;i<=2;i++)put(D,'bedD',side([[L+0.03,0.12],[L+0.12,0.12],[L+0.08,1.06],[L+0.03,1.06]],0.08,0.012),[i*0.5,0,0]);
// the cab protector: a sloped canopy reaching out over the cab with ribs on top
put(D,'bedD',side([[L,1.12],[L+0.92,1.18],[L+0.95,1.25],[L,1.26]],2.44,0.02),[0,0,0]);
for(let i=-2;i<=2;i++)put(D,D,RB(0.06,0.06,0.9,0.015),[i*0.5,1.29,L+0.44]);

// ---------- the tailgate: a framed panel with stiffeners, hung from its top hinge ----------
const G='tail';
put(G,'bedD',RB(2.3,1.0,0.08,0.02),[0,-0.52,-0.03]);
put(G,D,RB(2.36,0.1,0.12,0.03),[0,-0.07,-0.06]);put(G,D,RB(2.36,0.1,0.12,0.03),[0,-0.97,-0.06]);
for(const s of [-1,1])put(G,D,RB(0.1,1.0,0.12,0.03),[s*1.13,-0.52,-0.06]);
for(const x of [-0.75,-0.3,0.3,0.75])put(G,D,RB(0.07,0.8,0.06,0.015),[x,-0.52,-0.1]);
put(G,D,RB(2.1,0.06,0.05,0.015),[0,-0.52,-0.1]);
for(const s of [-1,1])put(G,'steel',RB(0.12,0.1,0.14,0.02),[s*0.95,-0.02,-0.04]);

// ---------- merge: one mesh per part and material ----------
const root=new T.Group();root.name='truck';
for(const [part,mats] of Object.entries(parts)){const g=new T.Group();g.name=part;root.add(g);
  for(const [mat,list] of Object.entries(mats)){let m=BGU.mergeBufferGeometries(list);m=BGU.mergeVertices(m,1e-4);
    const mesh=new T.Mesh(m,new T.MeshStandardMaterial({name:mat}));mesh.name=part+'_'+mat;g.add(mesh)}}
return root}
