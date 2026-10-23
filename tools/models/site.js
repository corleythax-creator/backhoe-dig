// Corley's Island: the detailed things standing in Dexter's yard and round his dirt bike track (js/dexter.js), built
// from shapes and written out as models/site.glb by tools/build_model.js (three.js r147 in headless Chromium). The game
// loads it (js/models.js, MDL_SPOT_FILES) and draws each node as instanced meshes at every spot dexter.js lists for that
// kind (famSpot), in place of the kit-built ones, when Machine models are Detailed. cone and light are also kinds the
// map editor places (js/props.js), which take the same nodes.
// The contract with the game, so a model made in Blender or bought can replace one of these:
// - one node per kind, each in its own frame: origin on the ground under its middle, x across, y up, z its front (the
//   game turns it by the spot's yaw); metres; materials named as js/models.js reads them (mdlMats names, 'kind#hex',
//   'lib:<id>');
// - cone: a 28 in traffic cone on a 14 in square base (0.36 × 0.36 m, 0.71 m tall); the PVC 'plastic#f0601a', the two
//   reflective collars 'plastic#eceeea', the base 'rubber#1d1d1d';
// - light: a towable light tower inside 1.6 × 2.8 m (its tongue +z), lamps facing +z: the four LED heads' lit faces
//   'glow#fff6d8' centred 9.35 m up at x ±0.8 and ±0.27, z 0.1 (where the yard's lamp halos are, FAM_LAMPS); its
//   paint 'paintY';
// - barrier: a 42 in concrete F-shape Jersey barrier 3.2 m long (along x), 0.8 m across the foot, 1.07 m tall,
//   'lib:concrete';
// - fueltank: a 4.2 m diesel tank on two saddles, its axis along x 1.9 m up, 1.05 m round, with its dispenser pump
//   standing at x 2.8, z 1.0; the yard's DIESEL sign (a board 1.6 × 0.45 m, 3.25 m up over the middle, facing +z)
//   hangs in its frame on top;
// - office: a 12 × 3.4 m office trailer, walls from 0.6 to 3.4 m up, the door (0.95 × 2.0 m, sill 0.65 m up) on the
//   front at x 1.2 with its steps and landing in front; the front wall (z 1.7) left clear between x -2.75 and -0.45
//   above 2.75 m, where the yard's OFFICE sign hangs; windows 'win#3c4a52';
// - bale: a three-string straw bale 0.52 m across, 0.42 m tall, 1.1 m long (along z);
// - tyre: a light-truck mud tyre lying flat, 0.67 m across and 0.24 m wide, its middle 0.04 m up (half sunk, as the
//   track sets them), the hole filled with dirt.
// Classic script, no modules.
function buildSite(){
const T=THREE,BGU=T.BufferGeometryUtils,parts={};
const mtx=new T.Matrix4(),q=new T.Quaternion(),e=new T.Euler();
let N='cone';
function put(mat,g,p,r,s){g=g.index?g.toNonIndexed():g.clone();
  e.set(...(r||[0,0,0]));q.setFromEuler(e);mtx.compose(new T.Vector3(...(p||[0,0,0])),q,new T.Vector3(...(s||[1,1,1])));g.applyMatrix4(mtx);
  g.deleteAttribute('uv');for(const k of Object.keys(g.attributes))if(k!=='position'&&k!=='normal')g.deleteAttribute(k);
  ((parts[N]=parts[N]||{})[mat]=parts[N][mat]||[]).push(g);return g}
const RB=(w,h,d,r,s)=>new T.RoundedBoxGeometry(w,h,d,s||1,Math.min(r,w/2-1e-4,h/2-1e-4,d/2-1e-4));
const BX=(w,h,d)=>new T.BoxGeometry(w,h,d);
const CY=(rt,rb,h,n,open)=>new T.CylinderGeometry(rt,rb,h,n||16,1,!!open);
const LA=(pts,n)=>new T.LatheGeometry(pts.map(([r,y])=>new T.Vector2(r,y)),n||24);
// a profile in (z, y) pushed across x, w wide, centred; bev chamfers its edges
function side(pts,w,bev,segs){const s=new T.Shape();pts.forEach(([z,y],i)=>i?s.lineTo(z,y):s.moveTo(z,y));
  const b=bev||0,g=new T.ExtrudeGeometry(s,{depth:Math.max(0.002,w-2*b),bevelEnabled:b>0,bevelThickness:b,bevelSize:b,bevelSegments:segs||1,curveSegments:12});
  g.rotateY(-Math.PI/2);g.translate((w-2*b)/2,0,0);return BGU.toCreasedNormals(g,0.6)}
function tube(mat,pts,r,n,rad,closed){const c=new T.CatmullRomCurve3(pts.map(p=>new T.Vector3(...p)),!!closed,'catmullrom',0.1);return put(mat,new T.TubeGeometry(c,n||Math.max(6,pts.length*6),r,rad||6,!!closed))}
// a straight bar from a to b (a box rotated to lie along it)
function bar(mat,a,b,w,d){const A=new T.Vector3(...a),B=new T.Vector3(...b),L=A.distanceTo(B),g=BX(w,L,d||w),dir=B.clone().sub(A).normalize();
  const qq=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),dir);g.applyQuaternion(qq);g.translate((A.x+B.x)/2,(A.y+B.y)/2,(A.z+B.z)/2);return put(mat,g)}
function rod(mat,a,b,r,n){const A=new T.Vector3(...a),B=new T.Vector3(...b),L=A.distanceTo(B),g=CY(r,r,L,n||8),dir=B.clone().sub(A).normalize();
  g.applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),dir));g.translate((A.x+B.x)/2,(A.y+B.y)/2,(A.z+B.z)/2);return put(mat,g)}
const arc=(cz,cy,r,a0,a1,n)=>Array.from({length:n+1},(_,i)=>{const a=a0+(a1-a0)*i/n;return [cz+Math.cos(a)*r,cy+Math.sin(a)*r]});
let sd=7;const rnd=()=>{sd=(sd*16807)%2147483647;return sd/2147483647};
const YEL='paintY',DARK='paint#2b2d30',GALV='metal#aeb2b4',ALU='metal#c3c7ca';

// ================= cone: a 28 in PVC traffic cone on its square recycled-rubber base =================
N='cone';
{const OR='plastic#f0601a',REF='plastic#eceeea',r=y=>0.151-(y-0.075)*(0.119/0.62);
  put('rubber#1d1d1d',RB(0.356,0.032,0.356,0.022),[0,0.016,0]);
  put('rubber#1d1d1d',LA([[0.178,0.032],[0.17,0.044],[0.16,0.046]],20));
  put(OR,LA([[0.16,0.04],[0.163,0.05],[0.151,0.075],[r(0.3),0.3],[r(0.62),0.62],[0.032,0.695],[0.035,0.703],[0.03,0.712],[0.021,0.708],[0.02,0.69]],20));
  // the collars: a 6 in band and a 4 in band of reflective sheeting, a hair proud of the cone
  for(const [y0,y1] of [[0.47,0.622],[0.3,0.402]])put(REF,LA([[r(y0)+0.0016,y0],[r(y1)+0.0016,y1]],20))}

// ================= barrier: a 42 in F-shape concrete Jersey barrier =================
N='barrier';
{const C='lib:concrete',RS='steel#5b4636',L=3.2;
  // the body from 4 in up, and the foot under it in three blocks, leaving the two forklift slots through
  put(C,side([[-0.384,0.1],[0.384,0.1],[0.245,0.33],[0.112,1.045],[0.09,1.07],[-0.09,1.07],[-0.112,1.045],[-0.245,0.33]],L,0.012),[0,0,0]);
  for(const [x0,x1] of [[-1.6,-1.08],[-0.72,0.72],[1.08,1.6]])put(C,side([[-0.39,0],[0.39,0],[0.39,0.075],[0.375,0.112],[-0.375,0.112],[-0.39,0.075]],x1-x0,0.008),[(x0+x1)/2,0,0]);
  // steel connection loops at each end (one high, one low, so the next barrier's interleave) and two lifting loops on top
  for(const s of [-1,1])for(const [y,dz] of [[s>0?0.25:0.42,0.13],[s>0?0.78:0.95,-0.1]]){const g=new T.TorusGeometry(0.055,0.012,4,7,Math.PI);g.rotateX(Math.PI/2);g.rotateY(s>0?Math.PI/2:-Math.PI/2);put(RS,g,[s*1.6,y,dz])}
  for(const x of [-0.8,0.8]){const g=new T.TorusGeometry(0.05,0.011,4,7,Math.PI);put(RS,g,[x,1.065,0])}}

// ================= bale: a three-string straw bale =================
N='bale';
{const W=0.52,H=0.42,L=1.1,STRAW='matte#d2b066',TW='plastic#d35b1f';
  let g=new T.BoxGeometry(W,H,L,4,4,12);g.deleteAttribute('normal');g.deleteAttribute('uv');g=BGU.mergeVertices(g);
  const P=g.attributes.position,v=new T.Vector3(),rr=0.05,hx=W/2-rr,hy=H/2-rr,hz=L/2-rr;
  for(let i=0;i<P.count;i++){v.fromBufferAttribute(P,i);
    // rounded edges, a bulge between the strings, the flakes pressed in along the length, and a ragged face
    const c=new T.Vector3(Math.max(-hx,Math.min(hx,v.x)),Math.max(-hy,Math.min(hy,v.y)),Math.max(-hz,Math.min(hz,v.z))),d=v.clone().sub(c);
    if(d.length()>1e-6)d.setLength(rr);v.copy(c).add(d);
    const k=Math.round((v.z+L/2)/(L/12)),flake=k%2&&Math.abs(v.z)<L/2-0.02?-0.008:0,h=Math.sin(v.x*91+v.y*57+v.z*73)*0.006+Math.sin(v.x*37-v.z*29+v.y*13)*0.005;
    const out=new T.Vector3(Math.abs(v.x)>hx?Math.sign(v.x):0,Math.abs(v.y)>hy?Math.sign(v.y):0,0),groove=[-0.17,0,0.17].some(x=>Math.abs(v.x-x)<0.03)?-0.009:0;
    v.addScaledVector(out,flake+h+groove);if(groove&&Math.abs(v.z)>hz)v.z-=Math.sign(v.z)*0.009;if(Math.abs(v.z)>hz)v.z+=Math.sign(v.z)*h*1.6;P.setXYZ(i,v.x,v.y,v.z)}
  g.computeVertexNormals();put(STRAW,g,[0,H/2,0]);
  // the twine: three loops along the length, sunk a little into the straw
  for(const x of [-0.17,0,0.17]){put(TW,BX(0.011,0.005,L-0.06),[x,H-0.006,0]);for(const s of [-1,1])put(TW,BX(0.011,H-0.07,0.005),[x,H/2,s*(L/2-0.006)])}
  // loose straws poking out of the cut ends and the top
  for(let i=0;i<16;i++){const end=i<10,s=i%2?1:-1,len=0.08+rnd()*0.08;
    const p=end?[(rnd()-0.5)*W*0.8,0.05+rnd()*(H-0.1),s*(L/2-0.01)]:[(rnd()-0.5)*W*0.8,H-0.005,(rnd()-0.5)*L*0.8];
    const r=end?[Math.PI/2+(rnd()-0.5)*0.9,0,(rnd()-0.5)*0.9]:[(rnd()-0.5)*0.5+Math.PI/2*(rnd()>0.5?1:0),rnd()*3,Math.PI/2+(rnd()-0.5)*0.4];
    const st=BX(0.0035,len,0.0035);st.translate(0,len/2,0);put('matte#dcc07a',st,p,r)}}

// ================= tyre: a light-truck mud tyre lying flat, half sunk, the hole full of dirt =================
N='tyre';
{const TY='tire',Y0=0.04,n=32;
  put(TY,LA([[0.335,-0.03],[0.336,0.04],[0.335,0.115],[0.327,0.141],[0.304,0.157],[0.262,0.164],[0.214,0.161],[0.2,0.152],[0.198,0.12]],n));
  // tread lugs: two staggered rows of angled blocks round the band, and shoulder blocks over the top sidewall
  for(let k=0;k<16;k++){const a=k/16*Math.PI*2;for(const [y,o,tw] of [[0.1,0,0.22],[0.0,0.5,-0.22]]){const b=a+o/16*Math.PI*2;
      const g=BX(0.075,0.085,0.022);g.rotateZ(tw);g.translate(0,0,0.341);g.rotateY(b);put(TY,g,[0,y,0])}}
  put('lib:dirt2',LA([[0.2,0.13],[0.19,0.15],[0.12,0.163],[0,0.17]],n))}

// ================= light: a towable LED light tower =================
N='light';
{const WX=0.68,WR=0.3,AZ=-0.2;
  // the chassis: two rails, cross members, the axle on leaf springs, an A-frame tongue to the coupler and its jack
  for(const s of [-1,1]){put(DARK,BX(0.08,0.1,2.2),[s*0.5,0.47,-0.12]);put(DARK,BX(0.06,0.06,0.5),[s*0.5,0.38,AZ]);
    bar(DARK,[s*0.5,0.47,0.95],[s*0.04,0.45,1.32],0.07,0.08)}
  for(const z of [-1.18,0.0,0.95])put(DARK,BX(1.08,0.08,0.08),[0,0.47,z]);
  rod('steel#3a3c3c',[-WX,WR,AZ],[WX,WR,AZ],0.035,10);
  put(DARK,RB(0.1,0.1,0.24,0.02),[0,0.47,1.36]);put('steel#3a3c3c',CY(0.045,0.045,0.06,16),[0,0.44,1.42]);put('steel#3a3c3c',RB(0.08,0.05,0.12,0.015),[0,0.52,1.37]);
  // safety chains hanging from the tongue
  for(const s of [-1,1])tube('steel#55595a',[[s*0.06,0.42,1.25],[s*0.09,0.3,1.33],[s*0.07,0.4,1.42]],0.007,10,4);
  // tongue jack: the tube, its crank and the swivel wheel
  put(DARK,CY(0.032,0.032,0.62,12),[0.36,0.52,1.12]);put(DARK,CY(0.026,0.026,0.32,12),[0.36,0.08,1.12]);put(DARK,BX(0.08,0.05,0.05),[0.32,0.47,1.12]);
  put('tire',CY(0.06,0.06,0.04,14),[0.36,0.06,1.12],[0,0,Math.PI/2]);bar('chrome',[0.36,0.84,1.12],[0.5,0.84,1.12],0.014);bar('chrome',[0.5,0.84,1.12],[0.5,0.92,1.12],0.014);
  // wheels: tyres, rims and hubs; fenders over them
  const tire=LA([[0.18,-0.085],[0.25,-0.09],[0.29,-0.075],[0.3,-0.04],[0.3,0.04],[0.29,0.075],[0.25,0.09],[0.18,0.085]],24);
  for(const s of [-1,1]){const x=s*WX;put('tire',tire,[x,WR,AZ],[0,0,Math.PI/2]);
    for(let k=0;k<20;k++){const a=k/20*Math.PI*2;put('tire',BX(0.07,0.018,0.05),[x,WR+Math.sin(a)*0.302,AZ+Math.cos(a)*0.302],[a,0,0])}
    put('rim',CY(0.19,0.19,0.15,24),[x,WR,AZ],[0,0,Math.PI/2]);put('chrome',CY(0.06,0.07,0.05,16),[x+s*0.08,WR,AZ],[0,0,Math.PI/2]);
    for(let k=0;k<5;k++){const a=k/5*Math.PI*2;put('steel#55595a',CY(0.01,0.01,0.03,6),[x+s*0.08,WR+Math.sin(a)*0.1,AZ+Math.cos(a)*0.1],[0,0,Math.PI/2])}
    put(DARK,side([...arc(0,0,0.37,0.1,Math.PI-0.1,16),...arc(0,0,0.355,Math.PI-0.1,0.1,16)],0.24,0),[x,WR,AZ]);
    put(DARK,BX(0.24,0.012,0.12),[x,0.5,AZ+0.4]);put(DARK,BX(0.24,0.012,0.12),[x,0.5,AZ-0.4]);
    put('redL',BX(0.1,0.06,0.03),[s*0.5,0.47,-1.24]);put('amber',BX(0.03,0.04,0.06),[s*0.55,0.47,0.9])}
  // outrigger jacks at the corners, cranked down onto their pads
  for(const s of [-1,1])for(const z of [-1.08,0.78]){put(DARK,BX(0.12,0.06,0.06),[s*0.58,0.47,z]);put(YEL,BX(0.06,0.5,0.06),[s*0.66,0.3,z]);put(DARK,BX(0.05,0.3,0.05),[s*0.66,0.15,z]);
    put('steel#3a3c3c',BX(0.14,0.014,0.14),[s*0.66,0.007,z]);put(DARK,CY(0.012,0.012,0.08,8),[s*0.66,0.58,z]);bar('chrome',[s*0.66,0.62,z],[s*0.66-s*0.1,0.62,z],0.012)}
  // the generator enclosure: doors, hinges, latches, vent louvres, the control door at the back, exhaust and lifting eye
  const EY=0.52,EH=0.95,EZ=-0.15,EL=1.85,EW=1.3;put(YEL,RB(EW,EH,EL,0.045,1),[0,EY+EH/2,EZ]);
  put(DARK,RB(EW+0.02,0.05,EL+0.02,0.02),[0,EY+0.025,EZ]);
  for(const s of [-1,1]){const fx=s*(EW/2+0.002);
    for(const z of [EZ-0.02])put('black',BX(0.006,EH-0.12,0.012),[fx,EY+EH/2,z]);
    for(const z of [EZ-0.88,EZ+0.84])put('black',BX(0.006,EH-0.12,0.012),[fx,EY+EH/2,z]);
    for(const [z0,z1] of [[EZ-0.84,EZ-0.06],[EZ+0.02,EZ+0.8]]){const zc=(z0+z1)/2;
      // louvres in the lower half of each door, a latch and two hinges
      put('black',BX(0.01,0.32,z1-z0-0.16),[fx,EY+0.3,zc]);
      for(let k=0;k<7;k++)put(YEL,BX(0.03,0.016,z1-z0-0.18),[fx+s*0.008,EY+0.17+k*0.042,zc],[0,0,s*0.5]);
      put('black',BX(0.03,0.09,0.04),[fx+s*0.012,EY+0.62,s>0?z1-0.07:z0+0.07]);
      for(const y of [EY+0.25,EY+0.78])put('steel#55595a',CY(0.012,0.012,0.08,8),[fx+s*0.01,y,s>0?z0+0.04:z1-0.04])}}
  for(const [w,h,px,py] of [[0.9,0.012,0,EY+0.8],[0.9,0.012,0,EY+0.2],[0.012,0.6,-0.45,EY+0.5],[0.012,0.6,0.45,EY+0.5]])put('black',BX(w,h,0.008),[px,py,EZ-EL/2-0.003]);
  put('black',RB(0.42,0.3,0.01,0.01),[-0.15,EY+0.58,EZ-EL/2-0.003]);put('tint',RB(0.34,0.22,0.012,0.01),[-0.15,EY+0.58,EZ-EL/2-0.006]);
  put('black',BX(0.05,0.09,0.03),[0.32,EY+0.5,EZ-EL/2-0.012]);put('redL',CY(0.03,0.03,0.02,12),[0.2,EY+0.32,EZ-EL/2-0.012],[Math.PI/2,0,0]);
  put('steel#3a3c3c',CY(0.035,0.035,0.24,12),[0.42,EY+EH+0.12,EZ-0.6]);put('steel#3a3c3c',CY(0.05,0.04,0.04,12),[0.42,EY+EH+0.25,EZ-0.6],[0.3,0,0]);
  put('black',CY(0.05,0.05,0.03,14),[-0.4,EY+EH+0.012,EZ-0.5]);
  {const g=new T.TorusGeometry(0.06,0.014,6,12);put(DARK,g,[0,EY+EH+0.07,EZ-0.3])}
  // the mast: its pivot bracket and manual winch, four telescoping galvanized sections with dark collars, and the coiled cord
  const MY=EY+EH;for(const s of [-1,1])put(DARK,BX(0.02,0.26,0.3),[s*0.12,MY+0.13,0]);rod(DARK,[-0.15,MY+0.16,0],[0.15,MY+0.16,0],0.025,12);
  put(DARK,CY(0.09,0.09,0.08,16),[0.2,MY+0.6,0.1],[0,0,Math.PI/2]);put(DARK,CY(0.11,0.11,0.01,16),[0.24,MY+0.6,0.1],[0,0,Math.PI/2]);
  bar('chrome',[0.25,MY+0.6,0.1],[0.25,MY+0.75,0.16],0.012);bar('black',[0.25,MY+0.75,0.16],[0.32,MY+0.75,0.16],0.02);
  const secs=[[0.16,MY+0.05,4.05],[0.13,3.85,6.35],[0.105,6.15,8.35],[0.082,8.15,9.02]];
  for(const [w,y0,y1] of secs){put(GALV,RB(w,y1-y0,w,0.012),[0,(y0+y1)/2,0]);put(DARK,BX(w+0.03,0.07,w+0.03),[0,y1-0.035,0])}
  {const pts=[];for(let i=0;i<=144;i++){const t=i/144,a=t*Math.PI*2*18;pts.push([Math.cos(a)*0.05,MY+0.3+t*(8.9-MY-0.3),-0.17+Math.sin(a)*0.05])}tube('black',pts,0.009,120,4)}
  // the lamp bar and four LED heads on yokes, their lit faces where the yard's halos are
  put(GALV,BX(0.16,0.06,0.16),[0,9.04,0]);put(GALV,RB(2.2,0.07,0.07,0.01),[0,9.0,0]);
  for(const x of [-0.8,-0.27,0.27,0.8]){
    put(DARK,BX(0.06,0.04,0.06),[x,9.055,0]);for(const s of [-1,1])put(DARK,BX(0.016,0.34,0.04),[x+s*0.235,9.2,0]);put(DARK,BX(0.49,0.03,0.04),[x,9.05,0]);
    for(const s of [-1,1])put('steel#55595a',CY(0.02,0.02,0.02,10),[x+s*0.225,9.35,0],[0,0,Math.PI/2]);
    put('paint#33363a',RB(0.42,0.42,0.1,0.02),[x,9.35,0.045]);
    for(let k=0;k<6;k++)put('paint#33363a',BX(0.012,0.38,0.06),[x-0.175+k*0.07,9.35,-0.035]);
    put('black',BX(0.38,0.38,0.006),[x,9.35,0.096]);put('glow#fff6d8',BX(0.34,0.34,0.006),[x,9.35,0.1])}}

// ================= fueltank: a diesel tank on saddles, its fittings, the DIESEL sign's frame and the dispenser =================
N='fueltank';
{const TY=1.9,TR=1.05,TL=4.0,TANK='paint#dcdcd6',GREY='paint#8f908b';
  put(TANK,CY(TR,TR,TL,48,true),[0,TY,0],[0,0,Math.PI/2]);
  const head=LA(Array.from({length:7},(_,i)=>{const a=i/6*Math.PI/2;return [Math.cos(a)*TR,Math.sin(a)*0.2]}),48);
  // the dished heads face out at each end
  {const h1=head.clone();h1.rotateZ(-Math.PI/2);put(TANK,h1,[TL/2,TY,0]);const h2=head.clone();h2.rotateZ(Math.PI/2);put(TANK,h2,[-TL/2,TY,0])}
  put(YEL,CY(TR+0.004,TR+0.004,0.4,48,true),[0,TY,0],[0,0,Math.PI/2]);
  for(const x of [-TL/2,-0.7,0.7,TL/2]){const g=new T.TorusGeometry(TR+0.003,0.007,4,40);g.rotateY(Math.PI/2);put(TANK,g,[x,TY,0])}
  // the saddles: a web plate cut to the tank's round, a wear pad, the foot plate and gussets, bolted down
  const cr=arc(0,TY,TR+0.01,-Math.PI/6,-Math.PI*5/6,16);
  for(const x of [-1.4,1.4]){put(GREY,side([[-0.98,0],[0.98,0],[0.98,0.06],[0.94,0.08],...cr,[-0.94,0.08],[-0.98,0.06]],0.025,0.004),[x,0,0]);
    put(GREY,BX(0.3,0.025,1.96),[x,0.0125,0]);
    {const p=new T.CylinderGeometry(TR+0.018,TR+0.018,0.2,32,1,true,Math.PI*1.17,Math.PI*0.66);p.rotateZ(Math.PI/2);put(GREY,p,[x,TY,0])}
    for(const z of [-0.6,0,0.6])put(GREY,side([[-0.12,0.025],[0.12,0.025],[0.0,0.0+0.5-Math.abs(z)*0.2]].map(([a,b])=>[a,b]),0.016),[x,0,z],[0,Math.PI/2,0]);
    for(const z of [-0.85,0.85])for(const dx of [-0.1,0.1])put('steel#55595a',CY(0.014,0.014,0.04,6),[x+dx,0.03,z])}
  // on top: the manway with its bolts, fill neck with a locking cap, the vent with its mushroom cap, the emergency vent and the clock gauge
  const TOP=TY+TR;
  put(TANK,CY(0.28,0.28,0.07,32),[-1.25,TOP+0.02,0]);put(TANK,CY(0.3,0.3,0.03,32),[-1.25,TOP+0.07,0]);
  for(let k=0;k<10;k++){const a=k/10*Math.PI*2;put('steel#55595a',CY(0.014,0.014,0.03,6),[-1.25+Math.cos(a)*0.27,TOP+0.09,Math.sin(a)*0.27])}
  put('steel#3a3c3c',CY(0.05,0.05,0.24,14),[0.95,TOP+0.1,0.35]);put('paint#2b2d30',CY(0.07,0.07,0.06,14),[0.95,TOP+0.24,0.35]);put('steel#55595a',BX(0.03,0.05,0.02),[1.03,TOP+0.22,0.35]);
  put(GALV,CY(0.04,0.04,0.55,12),[1.55,TOP+0.25,-0.2]);put(GALV,LA([[0.05,0],[0.1,0.02],[0.11,0.05],[0.09,0.1],[0,0.13]],14),[1.55,TOP+0.5,-0.2]);
  put('steel#3a3c3c',CY(0.11,0.11,0.12,16),[-0.55,TOP+0.04,-0.35]);put('steel#3a3c3c',CY(0.13,0.13,0.03,16),[-0.55,TOP+0.11,-0.35]);
  put('steel#55595a',CY(0.03,0.03,0.12,10),[0.3,TOP+0.03,-0.35]);put('chrome',CY(0.075,0.075,0.05,20),[0.3,TOP+0.11,-0.35]);put('paint#f2f2ee',CY(0.062,0.062,0.006,20),[0.3,TOP+0.137,-0.35]);
  // a hazard diamond and a no-smoking placard on the east head
  {const hx=TL/2+0.205,dg=(c,dy,dz)=>put(c,BX(0.004,0.13,0.13),[hx,TY+0.35+dy,0.55+dz],[Math.PI/4,0,0]);
    put('paint#f2f2ee',BX(0.004,0.4,0.4),[hx-0.002,TY+0.35,0.55],[Math.PI/4,0,0]);dg('paint#c0392b',0.095,0);dg('paint#1d5fa8',0,-0.095);dg('paint#f2b705',0,0.095);dg('paint#f2f2ee',-0.095,0);
    put('paint#f2f2ee',BX(0.004,0.3,0.45),[hx,TY-0.1,0.55]);put('paint#c0392b',BX(0.004,0.06,0.41),[hx+0.001,TY+0.02,0.55])}
  // the sign's frame (the board itself is the game's, a plane at z 0) on two posts
  for(const x of [-0.55,0.55])put(DARK,CY(0.022,0.022,0.12,10),[x,TOP+0.03,0]);
  put(DARK,BX(1.68,0.03,0.035),[0,3.0,0]);put(DARK,BX(1.68,0.03,0.035),[0,3.49,0]);for(const s of [-1,1])put(DARK,BX(0.03,0.52,0.035),[s*0.825,3.245,0]);
  // a ladder up the west head, its handholds over the top
  for(const s of [-1,1]){bar(GALV,[-2.55,0,s*0.22],[-2.02,3.0,s*0.22],0.04,0.025);tube(GALV,[[-2.02,3.0,s*0.22],[-1.9,3.2,s*0.22],[-1.72,3.08,s*0.22],[-1.7,TOP-0.01,s*0.22]],0.018,12,6)}
  for(let k=1;k<10;k++){const t=k/10;rod(GALV,[-2.55+0.53*t,3.0*t,-0.22],[-2.55+0.53*t,3.0*t,0.22],0.014,6)}
  // the supply line from the outlet under the east end, its ball valve, filter and the line to the dispenser
  const PX=2.8,PZ=1.0;
  tube('steel#3a3c3c',[[1.75,TY-TR+0.05,0.15],[1.75,0.5,0.15],[1.85,0.3,0.25],[2.4,0.24,0.6],[2.6,0.22,PZ-0.05]],0.026,24,8);
  put('paint#c0392b',RB(0.09,0.09,0.09,0.02),[1.75,0.62,0.15]);bar('paint#c0392b',[1.75,0.68,0.15],[1.75,0.7,0.35],0.03,0.015);
  // the dispenser: base, cabinet, dark top, the meter and display, the nozzle in its holster, hose reel, hose and the guard post
  put('lib:concrete_old',RB(0.9,0.12,0.7,0.02),[PX,0.06,PZ]);
  put('paint#c0392b',RB(0.6,1.25,0.4,0.03,2),[PX,0.12+0.625,PZ]);put('black',RB(0.64,0.08,0.44,0.02),[PX,1.41,PZ]);
  put('black',RB(0.46,0.3,0.01,0.02),[PX,1.08,PZ+0.205]);put('tint',RB(0.4,0.16,0.012,0.01),[PX,1.12,PZ+0.21]);
  for(let k=0;k<3;k++)put('paint#f2f2ee',BX(0.1,0.03,0.004),[PX-0.12+k*0.12,1.02,PZ+0.212]);
  put('steel#55595a',RB(0.5,0.4,0.01,0.02),[PX,0.5,PZ+0.205]);for(let k=0;k<5;k++)put('black',BX(0.44,0.012,0.008),[PX,0.36+k*0.07,PZ+0.211]);
  put('black',RB(0.1,0.22,0.12,0.02),[PX+0.34,0.98,PZ+0.05]);
  put('black',CY(0.024,0.024,0.18,10),[PX+0.36,1.0,PZ+0.08],[0.4,0,0]);put(ALU,RB(0.05,0.08,0.18,0.015),[PX+0.36,1.12,PZ+0.04],[-0.3,0,0]);
  put('steel#3a3c3c',CY(0.012,0.012,0.16,8),[PX+0.36,1.05,PZ+0.15],[1.2,0,0]);
  // the spring reel on the cabinet's back, and the hose from it round to the nozzle
  put(DARK,CY(0.24,0.24,0.02,24),[PX,0.75,PZ-0.23],[Math.PI/2,0,0]);put(DARK,CY(0.24,0.24,0.02,24),[PX,0.75,PZ-0.43],[Math.PI/2,0,0]);
  put('rubber#161616',CY(0.17,0.17,0.18,24),[PX,0.75,PZ-0.33],[Math.PI/2,0,0]);put(DARK,CY(0.04,0.04,0.24,12),[PX,0.75,PZ-0.33],[Math.PI/2,0,0]);
  tube('rubber#161616',[[PX+0.12,0.6,PZ-0.33],[PX+0.36,0.45,PZ-0.25],[PX+0.5,0.25,PZ+0.05],[PX+0.48,0.3,PZ+0.3],[PX+0.42,0.6,PZ+0.28],[PX+0.37,0.88,PZ+0.18]],0.016,40,6);
  put(YEL,CY(0.07,0.07,1.0,16),[PX-0.55,0.5,PZ+0.55]);put('black',CY(0.071,0.071,0.12,16),[PX-0.55,0.8,PZ+0.55])}

// ================= office: a mobile office trailer on block piers =================
N='office';
{const L=12,D=3.4,Y0=0.6,Y1=3.4,FZ=D/2,WALL='paint#ecebe6',TRIM='paint#c3c3be',FR=ALU,GL='win#3c4a52';
  // block piers under the two main beams, the beams, tie-down straps
  for(const x of [-5,-1.7,1.7,5])for(const z of [-1.05,1.05]){put('lib:concrete_old',BX(0.46,0.05,0.46),[x,0.025,z]);
    for(const dx of [-0.1,0.1])put('lib:cmu',BX(0.2,0.2,0.4),[x+dx,0.15,z]);
    put('lib:plywood',BX(0.42,0.06,0.16),[x,0.28,z]);put('lib:plywood',BX(0.16,0.06,0.42),[x,0.34,z])}
  for(const z of [-1.05,1.05]){put('steel#3a3c3c',BX(L-0.4,0.012,0.13),[0,0.376,z]);put('steel#3a3c3c',BX(L-0.4,0.2,0.012),[0,0.48,z]);put('steel#3a3c3c',BX(L-0.4,0.012,0.13),[0,0.585,z])}
  for(const x of [-5.6,5.6])for(const z of [-1,1]){bar('steel#7a7e80',[x,0.5,z*1.05],[x+(x>0?0.6:-0.6),0.0,z*1.45],0.05,0.004);put('steel#55595a',CY(0.03,0.03,0.12,8),[x+(x>0?0.6:-0.6),0.04,z*1.45])}
  // the box: walls, bottom band, corner trims, and a crowned membrane roof inside its fascia
  put(WALL,RB(L,Y1-Y0,D,0.03),[0,(Y0+Y1)/2,0]);
  put('paint#6f7478',BX(L+0.045,0.16,D+0.045),[0,Y0+0.08,0]);
  for(const sx of [-1,1])for(const sz of [-1,1])put(TRIM,BX(0.07,Y1-Y0,0.07),[sx*(L/2-0.025),(Y0+Y1)/2,sz*(D/2-0.025)]);
  put('paint#e6e6e2',side([[-D/2,0],[D/2,0],[0,0.07]],L,0),[0,Y1,0]);
  for(const s of [-1,1]){put(TRIM,BX(L+0.1,0.15,0.03),[0,Y1+0.04,s*(D/2+0.035)]);put(TRIM,BX(0.03,0.15,D+0.1),[s*(L/2+0.035),Y1+0.04,0])}
  for(const x of [-3.2,2.6])put('steel#8a8e90',RB(0.4,0.12,0.4,0.03),[x,Y1+0.1,0]);
  // ribbed siding: battens every 16 in, skipping the windows and the door
  const front=[[-4.2,1.48],[-1.6,1.48],[3.6,1.48],[1.2,1.15]],back=[[-3.6,1.48],[1.6,1.48],[4.2,1.48]];
  const clear=(list,x)=>list.some(([c,w])=>Math.abs(x-c)<w/2+0.03);
  for(let x=-L/2+0.25;x<L/2-0.1;x+=0.406){
    for(const [list,z] of [[front,FZ+0.004],[back,-FZ-0.004]]){
      if(!clear(list,x)){put(WALL,BX(0.05,Y1-Y0-0.18,0.02),[x,(Y0+Y1)/2+0.03,z]);continue}
      const door=list===front&&Math.abs(x-1.2)<0.62;if(!door)put(WALL,BX(0.05,1.08,0.02),[x,1.25,z]);put(WALL,BX(0.05,0.52,0.02),[x,3.07,z])}}
  for(let z=-D/2+0.25;z<D/2-0.1;z+=0.406)for(const s of [-1,1])if(!(s>0&&Math.abs(z-0.3)<0.6)&&!(s<0&&Math.abs(z+0.6)<0.6))put(WALL,BX(0.02,Y1-Y0-0.18,0.05),[s*(L/2+0.004),(Y0+Y1)/2+0.03,z]);
  // windows: aluminium frame, sill, slider mullion and the glass; three on each side, one at the east end
  const win=(x,z,ry)=>{const W=1.4,H=0.9,Y=2.3;
    const add=(mat,g,p)=>{g.translate(...p);g.rotateY(ry);g.translate(x,0,z);put(mat,g)};
    add(GL,BX(W-0.06,H-0.06,0.01),[0,Y,0.008]);add(FR,BX(W+0.08,0.05,0.05),[0,Y+H/2+0.01,0.02]);add(FR,BX(W+0.08,0.05,0.05),[0,Y-H/2-0.01,0.02]);
    for(const s of [-1,1])add(FR,BX(0.05,H+0.06,0.05),[s*(W/2+0.015),Y,0.02]);add(FR,BX(0.035,H-0.04,0.04),[0.08,Y,0.02]);
    add(TRIM,BX(W+0.16,0.035,0.08),[0,Y-H/2-0.05,0.035])};
  for(const x of [-4.2,-1.6,3.6])win(x,FZ,0);for(const x of [-3.6,1.6,4.2])win(x,-FZ,Math.PI);win(L/2,0.3,Math.PI/2);
  // the door: frame, steel slab with a kick plate, lever and deadbolt, the hood over it and a wall light
  const DX=1.2;put(FR,BX(1.09,2.1,0.05),[DX,1.68,FZ+0.012]);put('paint#8a9198',RB(0.95,2.0,0.04,0.008),[DX,1.66,FZ+0.03]);
  put('steel#55595a',BX(0.9,0.25,0.006),[DX,0.8,FZ+0.052]);put('chrome',CY(0.022,0.022,0.04,10),[DX-0.38,1.66,FZ+0.07],[Math.PI/2,0,0]);
  put('chrome',RB(0.13,0.02,0.025,0.008),[DX-0.33,1.66,FZ+0.09]);put('chrome',CY(0.025,0.025,0.03,10),[DX-0.38,1.85,FZ+0.065],[Math.PI/2,0,0]);
  put(TRIM,BX(1.4,0.05,0.55),[DX,2.88,FZ+0.27]);for(const s of [-1,1])bar(TRIM,[DX+s*0.62,2.86,FZ+0.52],[DX+s*0.62,2.5,FZ+0.01],0.03,0.03);
  put('paint#3a3c3e',RB(0.22,0.16,0.12,0.02),[DX+0.75,2.7,FZ+0.07]);put('glow#fff1c8',BX(0.16,0.006,0.08),[DX+0.75,2.618,FZ+0.08]);
  // the steps: a diamond-plate landing at the sill and three treads down to the yard on aluminium stringers, with rails
  const SX0=DX-0.56,SX1=DX+0.56,LZ0=FZ+0.02,LZ1=FZ+0.72,TOPY=0.65,rise=TOPY/4,run=0.28;
  put('lib:diamond',BX(SX1-SX0,0.04,LZ1-LZ0),[DX,TOPY-0.02,(LZ0+LZ1)/2]);
  for(let i=1;i<=3;i++){const z=LZ1+run*(i-0.5);put('lib:diamond',BX(1.0,0.035,run-0.02),[DX,TOPY-rise*i-0.018,z])}
  for(const x of [DX-0.52,DX+0.52])put(ALU,side([[LZ0,TOPY-0.12],[LZ1,TOPY-0.12],[LZ1+3*run,0],[LZ1+3*run+0.02,0],[LZ1+3*run+0.02,0.1],[LZ1,TOPY+0.02],[LZ0,TOPY+0.02]],0.03),[x,0,0]);
  for(const x of [SX0,SX1])for(const z of [LZ0+0.04,LZ1-0.04]){put(ALU,BX(0.05,TOPY-0.04,0.05),[x,(TOPY-0.04)/2,z]);put('lib:concrete_old',BX(0.2,0.04,0.2),[x,0.02,z])}
  for(const x of [DX-0.54,DX+0.54]){const zb=LZ1+3*run-0.05;
    tube(ALU,[[x,TOPY+0.9,LZ0+0.03],[x,TOPY+0.9,LZ1-0.02],[x,0.95,zb]],0.02,12,8);
    rod(ALU,[x,TOPY,LZ0+0.03],[x,TOPY+0.9,LZ0+0.03],0.02,8);rod(ALU,[x,TOPY,LZ1-0.02],[x,TOPY+0.9,LZ1-0.02],0.02,8);rod(ALU,[x,0.08,zb],[x,0.95,zb],0.02,8);
    tube(ALU,[[x,TOPY+0.45,LZ0+0.03],[x,TOPY+0.45,LZ1-0.02],[x,0.5,zb]],0.012,12,6)}
  // the towing hitch left on the east end: A-frame, coupler, its jack wound down onto a block, the safety chains
  for(const z of [-1.05,1.05])bar('steel#3a3c3c',[L/2-0.2,0.48,z],[L/2+1.25,0.46,0],0.1,0.14);
  put('steel#3a3c3c',RB(0.3,0.12,0.16,0.03),[L/2+1.35,0.46,0]);put('steel#3a3c3c',CY(0.05,0.05,0.07,14),[L/2+1.45,0.43,0]);
  put('steel#3a3c3c',CY(0.035,0.035,0.4,12),[L/2+0.95,0.35,0.3]);put('steel#3a3c3c',CY(0.045,0.045,0.42,12),[L/2+0.95,0.68,0.3]);put('lib:plywood',BX(0.3,0.08,0.3),[L/2+0.95,0.04,0.3]);
  bar('chrome',[L/2+0.95,0.88,0.3],[L/2+0.95,0.88,0.48],0.016);
  for(const s of [-1,1])tube('steel#55595a',[[L/2+1.2,0.44,s*0.06],[L/2+1.3,0.3,s*0.09],[L/2+1.42,0.4,s*0.05]],0.007,10,4);
  // the air conditioner on the west end, its louvres; the power meter and conduit on the east end
  put('paint#d6d2c4',RB(0.42,1.6,0.95,0.03),[-L/2-0.21,2.05,-0.6]);
  for(let k=0;k<12;k++)put('paint#b9b4a4',BX(0.02,0.03,0.85),[-L/2-0.425,1.4+k*0.07,-0.6],[0,0,0.5]);
  put('paint#b9b4a4',RB(0.03,0.42,0.85,0.01),[-L/2-0.425,2.55,-0.6]);
  put('steel#8a8e90',RB(0.12,0.4,0.28,0.02),[L/2+0.06,1.55,-1.0]);put('glass#c8d4dc',CY(0.07,0.07,0.06,16),[L/2+0.14,1.6,-1.0],[0,0,Math.PI/2]);
  rod('steel#8a8e90',[L/2+0.04,1.33,-1.0],[L/2+0.04,0.1,-1.0],0.022,8)}

// ---------- merge: one mesh per material in each node ----------
const root=new T.Group();root.name='site';
for(const [part,mats] of Object.entries(parts)){const g=new T.Group();g.name=part;root.add(g);
  for(const [mat,list] of Object.entries(mats)){let m=BGU.mergeBufferGeometries(list);m=BGU.mergeVertices(m,1e-4);
    const mesh=new T.Mesh(m,new T.MeshStandardMaterial({name:mat}));mesh.name=part+'_'+mat.replace(/[^a-zA-Z0-9]/g,'');g.add(mesh)}}
return root}
