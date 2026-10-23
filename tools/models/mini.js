// Corley's Island: the detailed mini excavator (Dexter's M08, trailer.js kind 'mini'), a 3½ ton machine: rubber tracks,
// a dozer blade, a zero-tail-swing upper under a four-post canopy, and a boom on a swing bracket at the front. Built from
// shapes and written out as models/mini.glb by tools/build_model.js (three.js r147 in headless Chromium). The game
// loads it (js/models.js, MDL_KIT.mini in trailer.js) in place of the kit-built mini when Machine models are Detailed.
// The contract with the game, so a model made in Blender or bought can replace this one:
// - one node per moving part, each in that part's own frame (x across, y up, z forward, metres):
//   body: the undercarriage and blade, origin on the ground under the middle; tracks 0.32 m wide centred at x ±0.68,
//     sprocket (back) and idler (front) at z ∓0.8, 0.25 m up; the swing bearing's top 0.54 m up;
//   house: the upper, origin on the swing centre 0.54 m up; the operator's eye at (0, 1.21, -0.15) stays clear;
//   boom: origin at its foot pin, house (0.42, 0.38, 0.62); the stick pin at (0, 0.58, 1.86);
//   stick: origin at that pin (at rest turned 0.46 rad down from the boom); the bucket pin at (0, -0.24, 1.1), the
//     side links' pin at (0, -0.1204, 0.8804);
//   bucket: origin at its pin (at rest turned 0.27 rad from the stick); its link pin at (0, 0.1581, 0.0867);
//   sideLink: origin at the side links' pin on the stick, 0.26 m along +z to the joint; hLink: origin at the joint,
//     0.26 m along +z to the bucket's link pin (trailer.js mnLink turns both and sets them each frame);
// - rams: empty nodes ram_<id>_a / ram_<id>_b with extras r, lb, lr, bk (as tools/models/loader.js); the bucket ram's
//   rod end is the joint (hLink's origin);
// - materials named for the game's (models.js mdlMatOf): paintY, bucket, steel, steelL, chrome, black, seat, lens,
//   amber, and paint#2b2d30 (the dark undercarriage and canopy), rubber#1d1d1f (the tracks), lib:diamond (the floor).
// Metres. Classic script, no modules.
function buildMini(){
const T=THREE,BGU=T.BufferGeometryUtils,parts={},anchors=[];
const mtx=new T.Matrix4(),q=new T.Quaternion(),e=new T.Euler();
function put(part,mat,g,p,r){g=g.index?g.toNonIndexed():g.clone();
  e.set(...(r||[0,0,0]));q.setFromEuler(e);mtx.compose(new T.Vector3(...(p||[0,0,0])),q,new T.Vector3(1,1,1));g.applyMatrix4(mtx);
  g.deleteAttribute('uv');for(const k of Object.keys(g.attributes))if(k!=='position'&&k!=='normal')g.deleteAttribute(k);
  ((parts[part]=parts[part]||{})[mat]=parts[part][mat]||[]).push(g);return g}
const RB=(w,h,d,r,s)=>new T.RoundedBoxGeometry(w,h,d,s||1,Math.min(r,w/2-1e-4,h/2-1e-4,d/2-1e-4));
const BX=(w,h,d)=>new T.BoxGeometry(w,h,d);
const CY=(rt,rb,h,n)=>new T.CylinderGeometry(rt,rb,h,n||20);
const XR=[0,0,Math.PI/2],ZR=[Math.PI/2,0,0];
// a cylinder along x
const cx=(part,mat,r,len,p,n)=>put(part,mat,CY(r,r,len,n||20),p,XR);
// a profile in (z, y) pushed across x, w wide, centred on x = 0
function side(pts,w,bev){const s=new T.Shape();pts.forEach(([z,y],i)=>i?s.lineTo(z,y):s.moveTo(z,y));
  const b=bev||0,g=new T.ExtrudeGeometry(s,{depth:Math.max(0.002,w-2*b),bevelEnabled:b>0,bevelThickness:b,bevelSize:b,bevelSegments:2,curveSegments:16});
  g.rotateY(-Math.PI/2);g.translate((w-2*b)/2,0,0);return BGU.toCreasedNormals(g,0.6)}
// a plan shape in (x, z) pushed up y by h, from y = 0
function slab(pts,h,bev){const s=new T.Shape();pts.forEach(([x,z],i)=>i?s.lineTo(x,-z):s.moveTo(x,-z));
  const b=bev||0,g=new T.ExtrudeGeometry(s,{depth:Math.max(0.002,h-2*b),bevelEnabled:b>0,bevelThickness:b,bevelSize:b,bevelSegments:2,curveSegments:24});
  g.rotateX(-Math.PI/2);g.translate(0,b,0);return BGU.toCreasedNormals(g,0.6)}
function tube(part,mat,pts,r,n){const c=new T.CatmullRomCurve3(pts.map(p=>new T.Vector3(...p)),false,'catmullrom',0.1);put(part,mat,new T.TubeGeometry(c,n||Math.max(8,pts.length*5),r,6,false))}
const arc=(cx0,cy0,r,a0,a1,n)=>Array.from({length:n+1},(_,i)=>{const a=a0+(a1-a0)*i/n;return [cx0+Math.cos(a)*r,cy0+Math.sin(a)*r]});
const anchor=(part,id,end,p,o)=>anchors.push({part,name:`ram_${id}_${end}`,p,o});
// a straight hydraulic ram drawn in place (the blade's and the boom swing's, which never move): barrel, rod, eyes
function ram(part,a,b,r,lb){const A=new T.Vector3(...a),B=new T.Vector3(...b),d=B.clone().sub(A),L=d.length(),dir=d.clone().normalize();
  const qq=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),dir),ee=new T.Euler().setFromQuaternion(qq);
  const at=t=>A.clone().addScaledVector(dir,t).toArray(),rt=[ee.x,ee.y,ee.z];
  put(part,Y,CY(r,r,lb,18),at(lb/2+0.03),rt);put(part,'steel',CY(r*1.12,r*1.12,0.05,18),at(lb),rt);put(part,'steel',CY(r*1.1,r*1.1,0.05,18),at(0.04),rt);
  put(part,'chrome',CY(r*0.55,r*0.55,L-lb-0.04,14),at(lb+(L-lb-0.04)/2),rt);
  for(const p of [a,b])cx(part,'steel',r*0.9,r*2.2,p,16)}
const B='body',H='house',BM='boom',SK='stick',BK='bucket',Y='paintY',D='paint#2b2d30',TR='rubber#1d1d1f';

// ======================= body: the undercarriage =======================
const TX=0.68,TW=0.32,TZ=0.8,TC=0.25,TP=0.17;
{const lug=side([[-0.026,0],[0.026,0],[0.016,0.03],[-0.016,0.03]],0.135,0);
for(const s of [-1,1]){const X=TX*s;
  // the rubber track: a band round the sprocket and idler, staggered tread blocks outside, steel guide lugs inside
  const Rb=TP+0.0225,Lp=4*TZ+2*Math.PI*Rb,N=Math.round(Lp/0.082),pitch=Lp/N;
  for(let i=0;i<N;i++){let d=i*pitch,z,y,a;
    if(d<2*TZ){z=-TZ+d;y=TC+Rb;a=0}else if((d-=2*TZ)<Math.PI*Rb){a=d/Rb;z=TZ+Math.sin(a)*Rb;y=TC+Math.cos(a)*Rb}
    else if((d-=Math.PI*Rb)<2*TZ){z=TZ-d;y=TC-Rb;a=Math.PI}else{d-=2*TZ;a=Math.PI+d/Rb;z=-TZ+Math.sin(a)*Rb;y=TC+Math.cos(a)*Rb}
    const ny=Math.cos(a),nz=Math.sin(a),o=k=>[X,y+ny*k,z+nz*k];
    put(B,TR,BX(TW,0.045,pitch*1.04),o(0),[a,0,0]);
    put(B,TR,lug,[X+(i%2?0.085:-0.085),y+ny*0.022,z+nz*0.022],[a,0,0]);
    put(B,'steel',BX(0.045,0.028,0.034),o(-0.034),[a,0,0])}
  // track frame: a box beam with a sloped top that sheds mud, the idler yoke, the tension cover and tie-down eyes
  put(B,D,side([[-0.66,0.16],[0.7,0.16],[0.74,0.24],[0.66,0.33],[0.25,0.37],[-0.25,0.37],[-0.62,0.33],[-0.7,0.24]],0.15,0.012),[X,0,0]);
  put(B,D,RB(0.06,0.05,0.4,0.01),[X+0.075*s,0.3,0.32]);put(B,'steel',CY(0.02,0.02,0.02,10),[X+0.11*s,0.3,0.3],XR);
  for(const z of [-0.4,0.4])put(B,D,side([[-0.04,0.24],[0.04,0.24],[0.03,0.3],[-0.03,0.3]],0.04,0),[X+0.095*s,0,z]);
  // sprocket at the back: the drive motor's round housing on the inside, the hub, the toothed ring
  cx(B,'steel',0.12,0.13,[X-0.13*s,TC,-TZ],28);cx(B,D,0.14,0.04,[X-0.075*s,TC,-TZ],28);
  for(let i=0;i<10;i++){const a=i/10*Math.PI*2;cx(B,'steelL',0.012,0.02,[X-0.2*s,TC+Math.sin(a)*0.085,-TZ+Math.cos(a)*0.085],8)}
  cx(B,'steel',0.075,0.06,[X,TC,-TZ],20);
  for(let i=0;i<11;i++){const a=i/11*Math.PI*2;put(B,'steel',BX(0.05,0.045,0.035),[X,TC+Math.sin(a)*0.15,-TZ+Math.cos(a)*0.15],[a,0,0])}
  cx(B,'steel',0.135,0.06,[X,TC,-TZ],28);
  // idler at the front: a grooved wheel on its yoke
  for(const o of [-0.06,0.06])cx(B,'steelL',0.165,0.05,[X+o,TC,TZ],32);cx(B,'steel',0.13,0.08,[X,TC,TZ],28);cx(B,'steelL',0.05,0.2,[X,TC,TZ],14);
  // bottom rollers riding inside the bottom run, double flanged round the guide lugs; one carrier roller on top
  for(const z of [-0.5,-0.17,0.17,0.5]){for(const o of [-0.045,0.045])cx(B,'steelL',0.052,0.04,[X+o,0.132,z],18);cx(B,'steel',0.025,0.16,[X,0.132,z],12)}
  for(const o of [-0.04,0.04])cx(B,'steelL',0.04,0.035,[X+o,0.378,0],16);cx(B,'steel',0.025,0.12,[X,0.378,0],10)}}
// the centre frame: a box between the tracks, legs out to both track frames, the swing bearing and its bolts
put(B,D,RB(0.92,0.2,1.04,0.04),[0,0.33,0]);
for(const s of [-1,1])for(const z of [-0.36,0.36])put(B,D,side([[-0.18,0.22],[0.18,0.22],[0.14,0.41],[-0.14,0.41]],0.42,0.015),[0.4*s,0,z]);
put(B,D,RB(0.5,0.06,0.5,0.02),[0,0.21,0]);
put(B,'steel',CY(0.47,0.47,0.06,48),[0,0.46,0]);put(B,D,CY(0.44,0.47,0.04,48),[0,0.42,0]);
for(let i=0;i<24;i++){const a=i/24*Math.PI*2;put(B,'steelL',CY(0.014,0.014,0.03,6),[Math.cos(a)*0.43,0.49,Math.sin(a)*0.43])}
// the dozer blade: a curved moldboard, its end plates, cutting edge, ribs behind, the two arms and the static ram
{const front=[[1.37,0.03],[1.355,0.08],[1.33,0.16],[1.325,0.24],[1.33,0.32],[1.345,0.39],[1.37,0.43]],back=front.map(([z,y])=>[z-0.025,y]).reverse();
  put(B,Y,side([...front,[1.39,0.445],[1.36,0.45],...back.slice(0,-1),[1.33,0.03]],1.72,0.004));
  put(B,'steelL',side([[1.32,0.0],[1.395,0.0],[1.395,0.05],[1.33,0.06]],1.72,0.004));
  for(const s of [-1,1])put(B,Y,side([[1.24,0.02],[1.4,0.02],[1.4,0.43],[1.3,0.46],[1.24,0.4]],0.022,0.003),[0.86*s,0,0]);
  for(const x of [-0.7,-0.3,0.3,0.7])put(B,Y,side([[1.24,0.06],[1.33,0.06],[1.33,0.42],[1.26,0.4]],0.03,0.003),[x,0,0]);
  put(B,Y,RB(1.66,0.07,0.08,0.02),[0,0.41,1.27]);put(B,Y,RB(1.66,0.06,0.06,0.02),[0,0.1,1.27]);
  for(const s of [-1,1]){put(B,Y,side([[0.48,0.24],[0.62,0.22],[1.26,0.12],[1.26,0.3],[0.62,0.36],[0.48,0.34]],0.09,0.01),[0.38*s,0,0]);
    cx(B,'steel',0.05,0.14,[0.38*s,0.29,0.52],16);cx(B,'steelL',0.022,0.2,[0.38*s,0.29,0.52],10)}
  for(const s of [-1,1])put(B,Y,side([[1.12,0.3],[1.24,0.3],[1.24,0.42],[1.14,0.4]],0.025,0.003),[0.06*s,0,0]);
  for(const s of [-1,1])put(B,D,side([[0.5,0.32],[0.64,0.32],[0.64,0.44],[0.52,0.44]],0.025,0.003),[0.06*s,0,0]);
  ram(B,[0,0.38,0.58],[0,0.37,1.18],0.045,0.36);
  // hoses from the centre frame to the blade ram
  for(const s of [-1,1])tube(B,'black',[[0.05*s,0.42,0.42],[0.08*s,0.45,0.6],[0.07*s,0.43,0.78]],0.012)}

// ======================= house: the upper =======================
// the revolving frame: a thick plate, round at the back
const RC=0.8;const plan=[[-0.74,0.62],[0.3,0.62],[0.76,0.38],[0.78,-0.05],...Array.from({length:21},(_,k)=>{const a=Math.PI*(0.08+0.84*k/20);return [Math.cos(a)*RC,-Math.sin(a)*RC]}),[-0.78,-0.05]];
put(H,D,slab(plan,0.1,0.015),[0,-0.02,0]);
// the counterweight round the back: heavy, rounded, with a lifting eye and a dark lower band
{const cw=[...Array.from({length:25},(_,k)=>{const a=Math.PI*(0.1+0.8*k/24);return [Math.cos(a)*RC,-Math.sin(a)*RC]}),
  ...Array.from({length:13},(_,k)=>{const a=Math.PI*(0.9-0.8*k/12);return [Math.cos(a)*0.6,-Math.sin(a)*0.6-0.08]})];
  put(H,Y,slab(cw,0.42,0.035),[0,0.08,0]);put(H,D,slab(cw.map(([x,z])=>[x*1.005,z*1.005]),0.06,0.008),[0,0.06,0]);
  put(H,'steel',new T.TorusGeometry(0.035,0.012,8,16),[0,0.52,-0.78],[0,0,0]);put(H,'steel',RB(0.08,0.04,0.06,0.01),[0,0.5,-0.78])}
// the engine hood behind the seat, round at the back inside the counterweight: a raised top panel, the radiator's
// louvred outlet on top, the latch, and the exhaust out through it at the back right
{const HR=0.72,a0=Math.acos(0.7/HR),hp=[[-0.7,-0.18],[0.7,-0.18],...Array.from({length:23},(_,k)=>{const a=a0+(Math.PI-2*a0)*k/22;return [Math.cos(a)*HR,-Math.sin(a)*HR]})];
  put(H,Y,slab(hp,0.44,0.04),[0,0.3,0]);put(H,Y,slab(hp.map(([x,z])=>[x*0.9,z*0.9-0.02]),0.03,0.012),[0,0.74,0]);
  put(H,'black',RB(0.74,0.02,0.2,0.01),[0,0.78,-0.5]);for(let i=0;i<7;i++)put(H,D,RB(0.7,0.012,0.016,0.005),[0,0.795,-0.42-i*0.026],[0.5,0,0]);
  put(H,'black',RB(0.16,0.03,0.05,0.01),[0,0.79,-0.26]);
  tube(H,'steel',[[0.45,0.62,-0.45],[0.46,0.78,-0.46],[0.47,0.92,-0.48]],0.028);put(H,'black',CY(0.034,0.03,0.05,14),[0.47,0.92,-0.48])}
// the tank box on the right: fuel and hydraulic oil, filler caps, a sight gauge
put(H,Y,RB(0.48,0.6,0.58,0.04),[0.53,0.37,0.11]);put(H,D,RB(0.49,0.05,0.59,0.01),[0.53,0.09,0.11]);
put(H,'black',CY(0.045,0.045,0.04,20),[0.62,0.69,0.25]);put(H,'black',CY(0.04,0.04,0.035,20),[0.45,0.69,-0.05]);
put(H,'steelL',RB(0.01,0.12,0.03,0.005),[0.775,0.4,0.25]);put(H,'lens',RB(0.006,0.09,0.018,0.004),[0.78,0.4,0.25]);
// the operator's station: diamond plate floor, a rubber mat, the seat on its base, the armrest consoles and joysticks,
// the travel levers and pedals at the front, the left console's lock-out bar
put(H,D,RB(1.02,0.04,0.66,0.01),[-0.27,0.1,0.3]);put(H,'black',RB(0.86,0.012,0.5,0.004),[-0.2,0.125,0.34]);
put(H,'lib:diamond',RB(0.22,0.03,0.4,0.008),[-0.66,0.13,0.36]);
put(H,D,RB(0.5,0.3,0.44,0.03),[-0.1,0.27,0.08]);
put(H,'seat',RB(0.5,0.1,0.48,0.045),[-0.1,0.48,0.12]);put(H,'seat',RB(0.46,0.05,0.42,0.02),[-0.1,0.545,0.12]);
put(H,'seat',RB(0.48,0.5,0.1,0.045),[-0.1,0.8,-0.15],[-0.16,0,0]);put(H,'black',RB(0.4,0.42,0.03,0.02),[-0.1,0.79,-0.21],[-0.16,0,0]);
for(const [x,sd] of [[-0.42,-1],[0.22,1]]){put(H,'black',RB(0.14,0.28,0.36,0.03),[x,0.5,0.2]);put(H,'seat',RB(0.13,0.04,0.26,0.02),[x,0.66,0.12]);
  put(H,'black',RB(0.12,0.06,0.14,0.02),[x,0.665,0.31]);put(H,'black',CY(0.03,0.04,0.04,14),[x,0.71,0.31]);
  put(H,'black',CY(0.012,0.012,0.12,8),[x,0.76,0.31],[-0.15,0,0]);put(H,'black',new T.SphereGeometry(0.032,14,10),[x,0.835,0.32]);
  put(H,'trim',RB(0.012,0.01,0.03,0.004),[x+sd*0.02,0.86,0.33]);void sd}
put(H,'black',CY(0.012,0.012,0.36,8),[-0.5,0.62,0.12],[0,0,0.3]);put(H,'black',RB(0.04,0.04,0.22,0.015),[-0.56,0.79,0.12]);
for(const x of [-0.26,-0.05]){put(H,'black',CY(0.012,0.014,0.6,8),[x,0.42,0.52],[-0.35,0,0]);put(H,'black',RB(0.05,0.11,0.03,0.012),[x,0.74,0.42],[-0.35,0,0]);
  put(H,'black',RB(0.1,0.02,0.16,0.008),[x,0.16,0.48],[0.35,0,0])}
put(H,'black',RB(0.12,0.02,0.14,0.006),[-0.55,0.15,0.45],[0.3,0,0]);
// the canopy: four square posts with gussets, a moulded roof with a drip edge, a work light and a beacon, a mirror,
// a grab handle
const PX=[-0.62,0.42],RY=1.7,POSTS=[[-0.62,0.52,0.12],[0.42,0.33,0.67],[-0.56,-0.42,0.75],[0.42,-0.42,0.77]];
for(const [x,z,y0] of POSTS){put(H,D,RB(0.07,RY-y0,0.07,0.012),[x,(RY+y0)/2,z]);
  put(H,D,RB(0.1,0.02,0.1,0.006),[x,y0+0.01,z]);
  put(H,D,side([[0,0],[0.12,0],[0,-0.12]],0.012,0),[x,RY-0.03,z+(z>0?-0.04:0.04)],[0,z>0?Math.PI:0,0])}
put(H,D,RB(0.07,0.06,1.01,0.012),[-0.59,RY+0.02,0.05],[0,-0.06,0]);put(H,D,RB(0.07,0.06,0.82,0.012),[PX[1],RY+0.02,-0.045]);
put(H,D,RB(1.05,0.06,0.07,0.012),[-0.07,RY+0.02,-0.42]);
put(H,D,RB(1.24,0.05,1.3,0.03),[-0.1,RY+0.06,-0.02]);put(H,D,RB(1.12,0.03,1.18,0.03),[-0.1,RY+0.1,-0.02]);
put(H,'black',RB(1.0,0.012,1.06,0.02),[-0.1,RY+0.03,-0.02]);
put(H,'black',RB(0.24,0.08,0.07,0.02),[-0.1,RY-0.02,0.6]);put(H,'lens',RB(0.2,0.055,0.01,0.012),[-0.1,RY-0.02,0.636]);
put(H,'black',CY(0.07,0.075,0.03,20),[0.3,RY+0.13,-0.42]);put(H,'amber',CY(0.055,0.065,0.1,20),[0.3,RY+0.195,-0.42]);put(H,'amber',new T.SphereGeometry(0.055,16,8,0,Math.PI*2,0,Math.PI/2),[0.3,RY+0.245,-0.42]);
tube(H,'black',[[-0.66,1.25,0.52],[-0.75,1.32,0.56],[-0.8,1.36,0.6]],0.012);put(H,'black',RB(0.03,0.16,0.12,0.02),[-0.81,1.36,0.62]);put(H,'mirror',RB(0.006,0.14,0.1,0.015),[-0.796,1.36,0.62]);
tube(H,'black',[[-0.66,0.8,0.52],[-0.7,0.82,0.52],[-0.7,1.2,0.52],[-0.66,1.22,0.52]],0.014);
// the boom swing bracket at the front right: the house's knuckles, the bracket casting with the boom foot's cheeks,
// the boom ram's lower lug, the king pin, and the swing ram along the right side
{const X=0.42;
  for(const y of [0.0,0.42])put(H,D,slab([[X-0.17,0.36],[X+0.17,0.36],[X+0.13,0.52],[X-0.13,0.52]],0.08,0.01),[0,y,0]);
  put(H,'steelL',CY(0.055,0.055,0.56,20),[X,0.24,0.47]);for(const y of [-0.01,0.51])put(H,'steel',CY(0.07,0.07,0.03,20),[X,y,0.47]);
  put(H,Y,side([[0.4,-0.04],[0.7,-0.04],[0.88,0.02],[0.88,0.1],[0.7,0.12],[0.5,0.14],[0.47,0.5],[0.4,0.48]],0.24,0.02),[X,0,0]);
  for(const s of [-1,1]){put(H,Y,side([[0.46,0.1],[0.74,0.1],[0.74,0.44],[0.64,0.5],[0.46,0.46]],0.025,0.004),[X+s*0.14,0,0]);
    cx(H,'steel',0.075,0.025,[X+s*0.155,0.38,0.62],22)}
  cx(H,'steelL',0.032,0.36,[X,0.38,0.62],14);for(const s of [-1,1])cx(H,'steel',0.04,0.02,[X+s*0.18,0.38,0.62],14);
  for(const s of [-1,1])put(H,Y,side([[0.72,-0.02],[0.86,0.0],[0.86,0.12],[0.74,0.1]],0.025,0.004),[X+s*0.07,0,0]);cx(H,'steel',0.045,0.16,[X,0.06,0.8],16)}
// hoses from the house's valve block to the boom foot
for(const x of [-0.12,-0.1,0.1,0.12])tube(H,'black',[[0.42+x*1.2,0.6,0.36],[0.42+x*1.1,0.58,0.48],[0.42+x,0.5,0.6],[0.42+x,0.47,0.66]],0.011);
anchor(H,'boom','a',[0.42,0.06,0.8],{r:0.055,lb:0.66,lr:0.62,bk:0.04});

// ======================= boom: origin at the foot pin =======================
{const W=0.17;
  const up=[[-0.08,0.08],[0.08,0.22],[0.36,0.47],[0.72,0.84],[0.95,0.99],[1.12,1.01],[1.4,0.92],[1.7,0.77]],lo=[[1.7,0.49],[1.42,0.6],[1.15,0.7],[0.98,0.7],[0.66,0.42],[0.32,0.09],[0.12,-0.08],[-0.04,-0.06]];
  put(BM,Y,side([...up,...lo],W,0.012));
  // reinforcing plates along the top and the knee, the foot boss and its bushings
  put(BM,Y,side([[0.36,0.47],[0.72,0.84],[0.95,0.99],[1.12,1.01],[1.4,0.92],[1.4,0.95],[1.12,1.04],[0.95,1.02],[0.72,0.87],[0.36,0.5]],W+0.012,0.004));
  cx(BM,Y,0.08,W+0.02,[0,0,0],24);for(const s of [-1,1])cx(BM,'steel',0.06,0.02,[s*0.1,0,0],22);cx(BM,'steelL',0.032,0.28,[0,0,0],14);
  // the clevis at the tip, straddling the stick
  for(const s of [-1,1]){put(BM,Y,side([[1.6,0.46],[1.78,0.44],[1.92,0.5],[1.96,0.6],[1.92,0.69],[1.78,0.74],[1.6,0.78]],0.028,0.005),[s*0.092,0,0]);
    cx(BM,'steel',0.075,0.02,[s*0.115,0.58,1.86],22)}
  cx(BM,'steelL',0.033,0.28,[0,0.58,1.86],14);for(const s of [-1,1])cx(BM,'steel',0.038,0.02,[s*0.135,0.58,1.86],12);
  // the boom ram's lug underneath and the arm ram's lug on top
  for(const s of [-1,1])put(BM,Y,side([[0.58,0.4],[0.84,0.62],[0.8,0.3],[0.7,0.24],[0.62,0.27]],0.025,0.004),[s*0.07,0,0]);cx(BM,'steel',0.05,0.17,[0,0.31,0.71],18);
  for(const s of [-1,1])put(BM,Y,side([[0.78,0.86],[1.06,1.0],[1.0,1.12],[0.88,1.12]],0.025,0.004),[s*0.068,0,0]);cx(BM,'steel',0.045,0.165,[0,1.07,0.93],18);
  // hydraulic lines along both sides: steel tubes on clamps, rubber hoses at each end
  const topY=z=>{for(let i=1;i<up.length;i++)if(z<=up[i][0]){const [z0,y0]=up[i-1],[z1,y1]=up[i];return y0+(y1-y0)*(z-z0)/(z1-z0)}return up[up.length-1][1]};
  for(const s of [-1,1])for(const dy of [0.06,0.1]){const x=s*(W/2+0.012),pts=[0.14,0.3,0.55,0.8,0.98,1.15,1.35].map(z=>[x,topY(z)-dy,z]);
    tube(BM,'steelL',pts,0.009,24);tube(BM,'black',[pts[pts.length-1],[x*1.15,topY(1.5)-dy-0.02,1.52],[x*1.3,0.62,1.7]],0.012);
    tube(BM,'black',[[x*0.9,0.04,0.05],[x,0.12,0.1],pts[0]],0.012)}
  for(const s of [-1,1])for(const z of [0.3,0.62,0.98,1.25])put(BM,'steel',RB(0.02,0.08,0.03,0.006),[s*(W/2+0.012),topY(z)-0.08,z]);
  // a work light on the boom's left side
  put(BM,'black',RB(0.06,0.08,0.05,0.012),[-0.12,0.86,0.86]);put(BM,'lens',RB(0.05,0.06,0.006,0.01),[-0.12,0.86,0.885])}
anchor(BM,'boom','b',[0,0.31,0.71],{r:0.055,lb:0.66,lr:0.62,bk:0.04});
anchor(BM,'arm','a',[0,1.07,0.93],{r:0.05,lb:0.7,lr:0.64,bk:0.04});

// ======================= stick: origin at the boom pin =======================
{const W=0.14;
  put(SK,Y,side([[-0.24,0.3],[-0.1,0.22],[0.05,0.15],[0.3,0.07],[0.86,-0.06],[1.1,-0.13],[1.17,-0.2],[1.15,-0.3],[1.08,-0.32],[0.86,-0.28],[0.4,-0.18],[0.08,-0.11],[-0.14,-0.08],[-0.23,0.04],[-0.28,0.18]],W,0.012));
  cx(SK,Y,0.075,W+0.02,[0,0,0],24);cx(SK,'steel',0.05,0.27,[0,0,0],18);
  // the tail lug for the arm ram's rod, the bucket ram's base lug, the side links' pin boss, the nose boss
  for(const s of [-1,1])put(SK,Y,side([[-0.24,0.28],[-0.08,0.23],[-0.1,0.3],[-0.18,0.32]],0.025,0.004),[s*0.05,0,0]);cx(SK,'steel',0.048,0.13,[0,0.238,-0.153],18);
  for(const s of [-1,1])put(SK,Y,side([[0.06,0.13],[0.24,0.09],[0.2,0.18],[0.12,0.2]],0.022,0.004),[s*0.045,0,0]);cx(SK,'steel',0.042,0.12,[0,0.1405,0.1535],18);
  cx(SK,Y,0.055,W+0.02,[0,-0.1204,0.8804],20);cx(SK,'steelL',0.026,0.25,[0,-0.1204,0.8804],12);
  cx(SK,Y,0.07,W+0.02,[0,-0.24,1.1],22);cx(SK,'steelL',0.03,0.22,[0,-0.24,1.1],12);for(const s of [-1,1])cx(SK,'steel',0.034,0.02,[s*0.11,-0.24,1.1],12);
  // a wear strip underneath, the lines to the bucket ram and the auxiliary lines to the nose with their couplers
  put(SK,'steel',side([[0.1,-0.115],[0.86,-0.285],[0.86,-0.3],[0.1,-0.13]],0.1,0.003));
  for(const x of [-0.03,0.03])tube(SK,'black',[[x,0.3,-0.2],[x*1.2,0.26,0.0],[x,0.2,0.1]],0.011);
  for(const x of [-0.05,0.05]){tube(SK,'steelL',[[x+0.02,0.17,0.2],[x,0.08,0.4],[x,-0.03,0.85],[x,-0.06,0.95]],0.008,30);put(SK,'chrome',CY(0.014,0.014,0.05,12),[x,-0.075,0.98],[1.35,0,0]);
    put(SK,'black',CY(0.016,0.016,0.012,12),[x,-0.06,0.95],[1.35,0,0])}
  for(const z of [0.35,0.65])put(SK,'steel',RB(0.13,0.02,0.025,0.006),[0,0.06-(z-0.3)*0.21+0.035,z])}
anchor(SK,'arm','b',[0,0.238,-0.1528],{r:0.05,lb:0.7,lr:0.64,bk:0.04});
anchor(SK,'bkt','a',[0,0.1405,0.1535],{r:0.045,lb:0.72,lr:0.6,bk:0.04});

// ======================= side links and the H-link =======================
for(const s of [-1,1]){put('sideLink',D,side([[-0.045,-0.03],[0.13,-0.022],[0.305,-0.03],[0.305,0.03],[0.13,0.022],[-0.045,0.03]],0.02,0.004),[s*0.1,0,0]);
  for(const z of [0,0.26])cx('sideLink',D,0.042,0.02,[s*0.1,0,z],18)}
cx('sideLink','steel',0.022,0.24,[0,0,0],10);
for(const s of [-1,1]){put('hLink',D,side([[-0.05,-0.035],[0.13,-0.025],[0.31,-0.04],[0.31,0.04],[0.13,0.025],[-0.05,0.035]],0.022,0.004),[s*0.062,0,0]);
  for(const z of [0,0.26])cx('hLink',D,0.045,0.022,[s*0.062,0,z],18)}
put('hLink',D,RB(0.1,0.045,0.07,0.012),[0,0,0.13]);cx('hLink','steelL',0.024,0.26,[0,0,0],10);cx('hLink','steelL',0.024,0.22,[0,0,0.26],10);
anchor('hLink','bkt','b',[0,0,0],{r:0.045,lb:0.72,lr:0.6,bk:0.04});

// ======================= bucket: drawn as it hangs at rest, relative to its pin, then turned into its own frame ======
{const W=0.46,hw=W/2;
  // the shell's outer line from the top lip, over the back and round the bottom to the cutting edge (z, y)
  const shell=[[-0.13,-0.05],[-0.02,-0.03],[0.1,-0.04],[0.2,-0.1],[0.255,-0.2],[0.255,-0.3],[0.21,-0.39],[0.12,-0.455],[0.0,-0.48],[-0.1,-0.47]];
  const N=shell.length,inner=shell.map(([z,y],i)=>{const a=shell[Math.max(0,i-1)],b=shell[Math.min(N-1,i+1)],tz=b[0]-a[0],ty=b[1]-a[1],l=Math.hypot(tz,ty);return [z-ty/l*0.014,y+tz/l*0.014]});
  put(BK,'bucket',side([...shell,...inner.reverse()],W-0.03,0.003));
  // side cheeks: the profile filled between the shell and the opening, with side cutters at the front
  for(const s of [-1,1]){put(BK,'bucket',side([...shell,[-0.12,-0.3],[-0.14,-0.12]],0.016,0.003),[s*(hw-0.008),0,0]);
    put(BK,'steelL',side([[-0.1,-0.47],[-0.03,-0.48],[-0.12,-0.34],[-0.15,-0.36]],0.02,0.003),[s*(hw+0.004),0,0])}
  // the cutting edge, four teeth on their adapters, wear strips on the bottom, the top plate's lip
  put(BK,'steelL',side([[-0.13,-0.462],[0.0,-0.474],[0.0,-0.49],[-0.14,-0.476]],W,0.003));
  for(let i=0;i<4;i++){const x=-0.165+i*0.11;put(BK,'steel',side([[-0.09,-0.455],[0.0,-0.47],[0.0,-0.495],[-0.1,-0.49]],0.05,0.004),[x,0,0]);
    put(BK,'steel',side([[-0.2,-0.5],[-0.11,-0.46],[-0.08,-0.465],[-0.08,-0.495],[-0.11,-0.5]],0.04,0.005),[x,0,0])}
  for(const x of [-0.12,0.12])put(BK,'steel',side([[0.0,-0.493],[0.12,-0.467],[0.12,-0.452],[0.0,-0.478]],0.04,0.002),[x,0,0]);
  put(BK,'bucket',RB(W,0.02,0.04,0.006),[0,-0.052,-0.12]);
  // the ears up to the pins, a coupler frame across them, the pin bosses
  for(const s of [-1,1]){put(BK,'bucket',side([[-0.07,-0.04],[0.22,-0.06],[0.24,0.05],[0.17,0.11],[0.0,0.065],[-0.06,0.03]],0.025,0.004),[s*0.095,0,0]);
    cx(BK,'steel',0.055,0.03,[s*0.095,0,0],20);cx(BK,'steel',0.05,0.03,[s*0.095,0.06,0.17],20)}
  cx(BK,'steelL',0.03,0.25,[0,0,0],12);cx(BK,'steelL',0.028,0.25,[0,0.06,0.17],12)}

// ---------- merge: one mesh per material, a node per part, the rams' anchors; the bucket turned into its frame ----------
const BK_REST=0.46+0.27,toBk=new T.Matrix4().makeRotationX(-BK_REST);
for(const list of Object.values(parts[BK]))for(const g of list)g.applyMatrix4(toBk);
const root=new T.Group();root.name='mini';const groups={};
for(const [part,mats] of Object.entries(parts)){const g=new T.Group();g.name=part;root.add(g);groups[part]=g;
  for(const [mat,list] of Object.entries(mats)){let m=BGU.mergeBufferGeometries(list);m=BGU.mergeVertices(m,1e-4);
    const mesh=new T.Mesh(m,new T.MeshStandardMaterial({name:mat}));mesh.name=part+'_'+mat.replace(/[^a-zA-Z0-9]/g,'');g.add(mesh)}}
for(const a of anchors){const o=new T.Object3D();o.name=a.name;o.position.set(...a.p);o.userData=Object.assign({},a.o);groups[a.part].add(o)}
return root}
