// Corley's Island: the detailed town things that stand in many places (family.js, jessica.js, mainland.js; their spots in
// MDL_SPOTS), built from shapes and written out as models/town.glb by tools/build_model.js (three.js r147 in headless
// Chromium). With Machine models on Detailed the game draws each kind as instanced meshes at its spots in place of the
// kit-built ones (js/models.js mdlSpotsOn), and bench and picnic also stand in for the map editor's things of those
// names (js/props.js).
// The contract with the game, so a model made in Blender or bought can replace these: one node per kind, each in its
// own frame: origin on the ground under its middle, x across, y up, z its front; metres. The wood (lib:planks) carries
// its own texture coordinates, a board's grain along its length inside one plank of the library tile.
// - lamp: Main Street's post-top lantern lamp, 5.4 m tall, on a fluted cast-iron post; its lit lantern centred 4.77 m up
//   (the sidewalk lifts it 0.16 m, so the night halo at 4.93 over the ground lines up); paint#262a2d, glow#fff1c8 (the
//   lantern glass, lit as the kits' lamps).
// - lampArm: the bridges' street lamp, a galvanized pole with a davit arm reaching 1.36 m toward +z (the road) to a
//   cobra head; its lens 5.93 m up at z 1.36 (on the deck 0.02 m down, the halo at 5.91 lines up); steel#7f8487,
//   paint#45484a, metal#9a9ea1 (bolts), glow#fff1c8.
// - bench: a park bench 1.8 m long (x) and 0.6 m deep, its seat 0.45 m up, sitting facing +z; cast end frames paint#3d4144,
//   slats lib:planks, bolt heads metal#8f9396.
// - picnic: a 6 ft timber picnic table, 1.8 m long (x) and 1.53 m across its benches, the top 0.76 m up and the seats
//   0.45 m; lib:planks and metal#8f9396 (carriage bolts). picnic8: the same table 8 ft (2.44 m) long, for the pavilion.
// - roundbale: a net-wrapped round hay bale 6 ft across and 5 ft wide, its axis along x, slumped a little on the ground,
//   a spiral of layers on each face and a few loose wisps; matte#c4a85e (the wrapped side), matte#b0924f (the faces),
//   matte#cdb575 (loose hay).
// Classic script, no modules.
function buildTown(){
const T=THREE,BGU=T.BufferGeometryUtils,parts={};
const mtx=new T.Matrix4(),q=new T.Quaternion(),e=new T.Euler();
// a shape into a node's material list, placed (p), turned (r, Euler XYZ) and scaled (s); wood keeps its texture coordinates
function put(part,mat,g,p,r,s){const uv=!!g.attributes.uv&&mat.startsWith('lib:');g=g.index?g.toNonIndexed():g.clone();
  e.set(...(r||[0,0,0]));q.setFromEuler(e);mtx.compose(new T.Vector3(...(p||[0,0,0])),q,new T.Vector3(...(s||[1,1,1])));g.applyMatrix4(mtx);
  for(const k of Object.keys(g.attributes))if(k!=='position'&&k!=='normal'&&!(uv&&k==='uv'))g.deleteAttribute(k);
  ((parts[part]=parts[part]||{})[mat]=parts[part][mat]||[]).push(g);return g}
const RB=(w,h,d,r,n)=>new T.RoundedBoxGeometry(w,h,d,n||1,Math.min(r,w/2-1e-4,h/2-1e-4,d/2-1e-4));
const CY=(rt,rb,h,n,open)=>new T.CylinderGeometry(rt,rb,h,n||16,1,!!open);
const LA=(pts,n)=>new T.LatheGeometry(pts.map(([r,y])=>new T.Vector2(r,y)),n||16);
// a profile in the z-y plane (with any holes) extruded w across x, centred, its edges rounded by bev
function prof(pts,holes,w,bev,segs){const sh=new T.Shape();pts.forEach(([z,y],i)=>i?sh.lineTo(z,y):sh.moveTo(z,y));
  for(const h of holes||[]){const p=new T.Path();h.forEach(([z,y],i)=>i?p.lineTo(z,y):p.moveTo(z,y));sh.holes.push(p)}
  const b=bev||0,g=new T.ExtrudeGeometry(sh,{depth:Math.max(0.002,w-2*b),bevelEnabled:b>0,bevelThickness:b,bevelSize:b,bevelSegments:segs||2,curveSegments:8});
  g.rotateY(-Math.PI/2);g.translate((w-2*b)/2,0,0);return BGU.toCreasedNormals(g,0.6)}
function tube(part,mat,pts,r,n,rad){const c=new T.CatmullRomCurve3(pts.map(p=>new T.Vector3(...p)),false,'catmullrom',0.2);put(part,mat,new T.TubeGeometry(c,n||24,r,rad||10,false))}
// ---------- wood: a board L long (x), Tk thick (y), W wide (z), its grain along x inside one plank of the planks tile ----------
const PL=[[10,90],[112,190],[214,291],[315,392],[416,495]].map(([a,b])=>[1-b/512,1-a/512]);
let seed=11;const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647};
function board(L,Tk,W,r){const g=RB(L,Tk,W,r||0.006),P=g.attributes.position,N=g.attributes.normal,uv=new Float32Array(P.count*2);
  const [va,vb]=PL[(rnd()*5)|0],u0=rnd()*4;
  for(let i=0;i<P.count;i++){const x=P.getX(i),y=P.getY(i),z=P.getZ(i),ax=Math.abs(N.getX(i)),ay=Math.abs(N.getY(i)),az=Math.abs(N.getZ(i));
    let u=u0+x,t;if(ax>ay&&ax>az){u=u0+L/2+z;t=y/Tk+0.5}else if(ay>=az)t=z/W+0.5;else t=y/Tk+0.5;
    uv[i*2]=u;uv[i*2+1]=va+(vb-va)*Math.min(1,Math.max(0,t))}
  g.setAttribute('uv',new T.BufferAttribute(uv,2));return g}
const WOOD='lib:planks',BOLT='metal#8f9396';
const dome=(part,x,y,z,r,ax)=>put(part,BOLT,CY(r*0.75,r,r*0.5,8),[x,y,z],ax==='x'?[0,0,Math.sign(x)*-Math.PI/2]:ax==='z'?[Math.PI/2,0,0]:[0,0,0]);

// ---------- lamp: a post-top lantern on a fluted cast-iron post ----------
{const N='lamp',P='paint#262a2d',G='glow#fff1c8',LC=4.77;
  // the base: a moulded skirt over a square-ish plinth, rising to the post
  put(N,P,LA([[0,0],[0.215,0],[0.215,0.035],[0.2,0.05],[0.2,0.07],[0.172,0.095],[0.158,0.26],[0.175,0.28],[0.175,0.31],[0.135,0.345],[0.122,0.58],
    [0.138,0.6],[0.138,0.63],[0.104,0.665],[0.092,0.98],[0.108,1.0],[0.108,1.03],[0.082,1.06],[0,1.06]],18));
  // the shaft: eight flutes, tapering from 0.078 to 0.06 m
  {const sh=new T.Shape(),F=8,n=F*6;for(let i=0;i<=n;i++){const a=i/n*Math.PI*2,k=(i%6)/6,r=0.078-0.008*Math.sin(k*Math.PI);
      i?sh.lineTo(Math.cos(a)*r,Math.sin(a)*r):sh.moveTo(Math.cos(a)*r,Math.sin(a)*r)}
    const g=new T.ExtrudeGeometry(sh,{depth:3.4,bevelEnabled:false,curveSegments:1});g.rotateX(-Math.PI/2);
    const p=g.attributes.position;for(let i=0;i<p.count;i++){const y=p.getY(i),s=1-0.23*(y/3.4);p.setX(i,p.getX(i)*s);p.setZ(i,p.getZ(i)*s)}
    put(N,P,BGU.toCreasedNormals(g,0.5),[0,1.04,0])}
  // the collar, the cradle the lantern sits in, and its bowl
  put(N,P,LA([[0,4.42],[0.07,4.42],[0.095,4.44],[0.095,4.47],[0.078,4.49],[0.078,4.52],[0.11,4.545],[0.11,4.565],[0,4.565]],16));
  for(let k=0;k<4;k++){const a=k*Math.PI/2+Math.PI/4;tube(N,P,[[Math.cos(a)*0.07,4.5,Math.sin(a)*0.07],[Math.cos(a)*0.15,4.56,Math.sin(a)*0.15],[Math.cos(a)*0.18,4.64,Math.sin(a)*0.18],[Math.cos(a)*0.15,4.6,Math.sin(a)*0.15]],0.011,10,5)}
  put(N,P,LA([[0,4.55],[0.09,4.56],[0.15,4.6],[0.17,4.63],[0.165,4.645],[0,4.645]],16));
  // the lantern: four panes of glass widening upward, a frame round them, a hipped roof with a flared brim and a finial
  const y0=LC-0.2,y1=LC+0.2,h0=0.13,h1=0.19,rt=h1*Math.SQRT2,rb=h0*Math.SQRT2;
  put(N,G,CY(rt,rb,y1-y0,4),[0,LC,0],[0,Math.PI/4,0]);
  put(N,P,RB(2*h0+0.05,0.04,2*h0+0.05,0.008),[0,y0-0.005,0]);put(N,P,RB(2*h1+0.05,0.035,2*h1+0.05,0.008),[0,y1+0.01,0]);
  for(const sx of [-1,1])for(const sz of [-1,1]){const lean=(h1-h0)/(y1-y0);put(N,P,new T.BoxGeometry(0.026,y1-y0+0.03,0.026),[sx*(h0+h1)/2,LC,sz*(h0+h1)/2],[sz*Math.atan(lean),0,-sx*Math.atan(lean)])}
  for(const [sx,sz] of [[1,0],[-1,0],[0,1],[0,-1]])put(N,P,new T.BoxGeometry(sx?0.012:h0+h1,0.02,sz?0.012:h0+h1),[sx*(h0+h1)/2,LC+0.02,sz*(h0+h1)/2]);
  put(N,P,CY(0.04,(h1+0.07)*Math.SQRT2,0.2,4),[0,y1+0.125,0],[0,Math.PI/4,0]);put(N,P,RB(2*h1+0.12,0.025,2*h1+0.12,0.008),[0,y1+0.04,0]);
  put(N,P,LA([[0,y1+0.22],[0.035,y1+0.22],[0.045,y1+0.25],[0.03,y1+0.28],[0.016,y1+0.29],[0.016,y1+0.31],[0.032,y1+0.34],[0.024,y1+0.37],[0.005,y1+0.42],[0,y1+0.43]],10))}

// ---------- lampArm: a galvanized pole, a davit arm and a cobra head over the road (+z) ----------
{const N='lampArm',S='steel#7f8487',H='paint#45484a',G='glow#fff1c8',Z=1.36,LY=5.93;
  put(N,S,RB(0.36,0.03,0.36,0.01),[0,0.015,0]);
  for(const sx of [-1,1])for(const sz of [-1,1]){put(N,'metal#9a9ea1',CY(0.018,0.018,0.05,8),[sx*0.13,0.05,sz*0.13]);put(N,'metal#9a9ea1',CY(0.03,0.03,0.026,6),[sx*0.13,0.04,sz*0.13])}
  put(N,S,LA([[0,0.03],[0.15,0.03],[0.15,0.08],[0.13,0.1],[0.125,0.5],[0.105,0.53],[0,0.53]],18));
  put(N,S,CY(0.068,0.098,5.2,18,true),[0,0.53+2.6,0]);
  put(N,S,LA([[0,5.73],[0.075,5.73],[0.082,5.75],[0.082,5.8],[0.06,5.83],[0,5.85]],14));
  for(const y of [1.2,3.5])put(N,'metal#9a9ea1',RB(0.04,0.12,0.02,0.006),[0,y,0.095]);
  // the davit: out of the pole's cap, up and over to the head
  tube(N,S,[[0,5.7,0],[0,5.98,0.05],[0,6.13,0.32],[0,6.14,0.7],[0,6.1,0.98],[0,6.06,1.1]],0.045,28,10);
  // the cobra head: a rounded hood, its flat lens underneath, a photocell on top
  put(N,H,prof([[1.06,6.02],[1.08,6.08],[1.16,6.125],[1.4,6.135],[1.58,6.11],[1.68,6.05],[1.69,5.99],[1.66,5.955],[1.06,5.955]],null,0.32,0.03,3));
  put(N,H,RB(0.26,0.035,0.5,0.012),[0,5.958,Z]);
  put(N,G,RB(0.22,0.016,0.42,0.006),[0,LY,Z]);
  put(N,'black',CY(0.032,0.034,0.04,12),[0,6.16,1.24]);put(N,'black',CY(0.012,0.032,0.03,12),[0,6.195,1.24])}

// ---------- bench: slats on two cast end frames ----------
{const N='bench',F='paint#3d4144',FX=0.8,k=0.95;
  const pz=pts=>pts.map(([z,y])=>[z*k,y]);
  const frame=prof(pz([[0.29,0],[0.29,0.025],[0.265,0.045],[0.268,0.6],[0.305,0.625],[0.318,0.655],[0.302,0.683],[0.2,0.69],[-0.19,0.702],
      [-0.252,0.88],[-0.27,0.9],[-0.31,0.89],[-0.236,0.43],[-0.268,0.04],[-0.3,0.025],[-0.3,0],[-0.205,0],[-0.188,0.345],[0.212,0.345],[0.224,0.045],[0.2,0]]),
    [pz([[0.232,0.44],[0.232,0.628],[0.2,0.645],[-0.188,0.656],[-0.176,0.44]])],0.046,0.008,2);
  for(const s of [-1,1])put(N,F,frame,[s*FX,0,0]);
  // seat: three slats, the front one with its edge rolled
  for(const [z,w] of [[0.168,0.12],[0.034,0.12],[-0.1,0.12]]){put(N,WOOD,board(1.8,0.034,w,0.012),[0,0.433,z*k]);
    for(const s of [-1,1])dome(N,s*FX,0.451,z*k,0.009)}
  // back: three slats leaning back with the frames
  for(const y of [0.53,0.665,0.8]){const zf=(-0.175-(y-0.43)*0.19)*k+0.022;put(N,WOOD,board(1.8,0.1,0.034,0.01),[0,y,zf],[-0.19,0,0]);
    for(const s of [-1,1])dome(N,s*FX,y,zf+0.019,0.009,'z')}
  // a tie rod under the seat between the frames
  put(N,F,CY(0.012,0.012,2*FX,8),[0,0.2,-0.02],[0,0,Math.PI/2])}

// ---------- picnic tables: A-frame timber tables, 6 ft (picnic) and 8 ft (picnic8) ----------
function picnic(N,L){const fx=L/2-0.32,TY=0.76,SY=0.45,TH=0.038;
  // the top: five boards with gaps, and the two seats of two boards each
  for(let i=0;i<5;i++)put(N,WOOD,board(L,TH,0.14,0.007),[0,TY-TH/2,(i-2)*0.148]);
  for(const s of [-1,1])for(const dz of [0.546,0.694])put(N,WOOD,board(L,TH,0.14,0.007),[0,SY-TH/2,s*dz]);
  for(const sx of [-1,1]){const x=sx*fx;
    // the cleat under the top and the seat support under the seats, both across the table
    put(N,WOOD,board(0.7,0.089,0.038,0.005),[x,TY-TH-0.0445,0],[0,Math.PI/2,0]);
    put(N,WOOD,board(1.52,0.14,0.038,0.006),[x,SY-TH-0.07,0],[0,Math.PI/2,0]);
    // the legs: one each side, from the foot out under the seat to the cleat, bolted on the outside
    for(const sz of [-1,1]){const zb=0.4,zt=0.12,len=Math.hypot(zb-zt,TY-TH),a=Math.atan2(zb-zt,TY-TH),lx=x+sx*0.038;
      put(N,WOOD,board(len,0.038,0.14,0.006),[lx,(TY-TH)/2-0.012,sz*(zb+zt)/2],[-sz*a,0,Math.PI/2]);
      for(const y of [TY-TH-0.045,SY-TH-0.07]){const zz=zt+(zb-zt)*(1-y/(TY-TH));dome(N,lx+sx*0.021,y,sz*zz,0.012,'x')}}
    // a brace from the seat support up to the middle of the top
    const bx0=x-sx*0.03,bx1=sx*0.15,by0=SY-TH-0.11,by1=TY-TH-0.03,bl=Math.hypot(bx1-bx0,by1-by0);
    put(N,WOOD,board(bl,0.089,0.038,0.005),[(bx0+bx1)/2,(by0+by1)/2,0],[0,0,Math.atan2(by1-by0,bx1-bx0)])}}
picnic('picnic',1.8);picnic('picnic8',2.44);

// ---------- roundbale: 6 ft across, 5 ft wide, its axis along x ----------
{const N='roundbale',NA=20,RF=0.86,HW=0.76,CYc=0.88;
  // the wrapped side: a lathe round the axis, bulging a touch, rolled over the shoulders
  const side=LA([[RF,-HW],[0.895,-0.745],[0.918,-0.71],[0.928,-0.6],[0.934,-0.3],[0.936,0],[0.934,0.3],[0.928,0.6],[0.918,0.71],[0.895,0.745],[RF,HW]],NA);
  side.rotateZ(-Math.PI/2);
  // each face: a spiral of layers (lines half a turn apart, ridge and hollow by turns), domed a little
  function face(sx){const c=0.13,J=Math.ceil(2*RF/c)+2,pos=[],idx=[];
    for(let j=-2;j<=J;j++)for(let i=0;i<=NA;i++){const th=i/NA*Math.PI*2,r=Math.min(RF,Math.max(0,c*(j/2+th/(Math.PI*2)))),
        A=0.022*Math.min(1,r/0.12)*Math.min(1,(RF-r)/0.07),h=A*(j%2?-1:1)+0.025*(1-(r/RF)**2);
      pos.push(sx*(HW+h),Math.sin(th)*r,Math.cos(th)*r)}
    const W=NA+1;for(let j=0;j<J+2;j++)for(let i=0;i<NA;i++){const a=j*W+i,b=a+1,cc=a+W,d=cc+1;sx>0?idx.push(a,b,cc,b,d,cc):idx.push(a,cc,b,b,cc,d)}
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();return g}
  // slumped: the bottom flattens where it bears on the ground
  const slump=g=>{g=g.index?g.toNonIndexed():g;const p=g.attributes.position;for(let i=0;i<p.count;i++){const y=p.getY(i)+CYc;p.setY(i,Math.max(0.005,y))}return g};
  put(N,'matte#c4a85e',slump(side));for(const s of [-1,1])put(N,'matte#b0924f',slump(face(s)));
  // a few loose wisps on the ground at the faces and caught on the wrap
  for(let i=0;i<10;i++){const s=i%2?1:-1,a=rnd()*Math.PI*2;
    put(N,'matte#cdb575',new T.BoxGeometry(0.22+rnd()*0.12,0.004,0.012),i<6?[s*(HW+0.06+rnd()*0.12),0.006,(rnd()-0.5)*1.2]:[s*(HW-0.02),CYc+Math.sin(a)*0.9,Math.cos(a)*0.9],
      i<6?[0,rnd()*3,0]:[a,0.4*s,0.3])}}

// ---------- merge: one mesh per material in each node ----------
const root=new T.Group();root.name='town';
for(const [part,mats] of Object.entries(parts)){const g=new T.Group();g.name=part;root.add(g);
  for(const [mat,list] of Object.entries(mats)){let m=BGU.mergeBufferGeometries(list);m=BGU.mergeVertices(m,1e-4);
    const mesh=new T.Mesh(m,new T.MeshStandardMaterial({name:mat}));mesh.name=part+'_'+mat.replace(/[^a-zA-Z0-9]/g,'');g.add(mesh)}}
return root}
