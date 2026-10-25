// Corley's Island: Dexter's heavy machines, parked in his yard (dexter.js): the dozer, the wheel loader and the red semi
// with its lowboy trailer. Walk up to one and Get in to drive it (Heavy mode; hvI is the one you are in). The left stick
// drives and steers each of them. The dozer turns on its tracks like the skid steer; the right stick up and down lowers
// and raises the blade, and with the blade down on the dig site it shaves the ground and shoves what it cuts along in a
// heap in front of it, left where you lift the blade. The wheel loader steers on its middle hinge; the right stick
// lowers and raises the arms and curls and dumps the bucket, which scoops on the dig site and dumps in a pile, over the
// cliff or into the dump truck's bed. The dozer's ripper, at the back, goes down and up on the right stick left and right:
// dragged through the ground it breaks up hard clay and rock (ripD, terrain.js), so the blade and the excavator then dig
// it like loose fill. The semi steers like a truck and its lowboy follows on the fifth wheel; the right
// stick looks round. His pickup and four-wheeler (car: their Tuning prefix) drive like cars: the engine pulls hard from
// a stop and fades toward top speed, the brakes bite before it backs up, the wheel turns less the faster you go, and
// past what the tyres grip in a turn they slide, the way they travel lagging the way they point. The right stick looks
// round; on the four-wheeler you sit on it, in the open.
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.
// ---------- the machines ----------
// each kind: where it starts, its circles along it (C, R: for getting in and bumping into things), its corners (P: for
// walls), where its wheels or tracks touch the ground (hw out from the middle, af and ab ahead and behind), the cab's
// eye, the work light, the chase camera's distance and the colour on the map
const HV_KINDS={
  dozer:{n:'dozer',x:-212,z:247,yaw:0,C:[1.0,-0.9],R:1.6,P:[[-1.55,2.25],[1.55,2.25],[-1.35,-1.95],[1.35,-1.95]],hw:1.05,af:1.45,ab:-1.45,
    eye:[0,2.35,-0.6,0,-0.7,4.5],lamp:[0,1.6,1.3,0,-1,10],cam:0.9,col:'#f2b705',len:4.4,wid:3.1,track:true},
  loader:{n:'wheel loader',x:-198,z:246,yaw:0,C:[2.4,0.4,-1.8],R:1.4,P:[[-1.4,3.9],[1.4,3.9],[-1.2,-2.75],[1.2,-2.75]],hw:1.15,af:1.4,ab:-1.3,wb:2.7,
    eye:[0,2.75,-0.15,0,-0.8,5],lamp:[0,2.2,0.6,0,-1,12],cam:1.0,col:'#f2b705',len:6.6,wid:2.7},
  semi:{n:'semi',x:-178,z:268,yaw:Math.PI/2,C:[3.0,1.0,-1.0],R:1.35,P:[[-1.2,4.5],[1.2,4.5],[-1.2,-2.6],[1.2,-2.6]],hw:1.05,af:3.4,ab:-1.75,wb:5.15,
    eye:[0.5,2.9,1.7,0,-0.25,10],lamp:[0,1.2,4.4,0,-1.2,16],cam:1.5,col:'#b3262c',len:7.0,wid:2.5,trail:true},
  // a full-size crew-cab pickup: 19 ft 4 in long, a 12 ft 2 in wheelbase, 32 in tyres
  pickup:{n:'pickup',x:-186,z:236,yaw:Math.PI/2,C:[1.7,0,-1.7],R:1.05,P:[[-1.0,2.95],[1.0,2.95],[-1.0,-2.95],[1.0,-2.95]],hw:0.86,af:1.85,ab:-1.85,wb:3.7,
    eye:[0.4,1.62,0.25,0,-0.12,10],lamp:[0,0.95,2.95,0,-1,16],cam:0.95,col:'#1d3557',len:5.9,wid:2.0,car:'pk',acc:4.2,brake:7.5},
  // a utility four-wheeler: 7 ft long, a 50 in wheelbase, 25 in tyres
  atv:{n:'four-wheeler',x:-190,z:256,yaw:0,C:[0.5,-0.5],R:0.66,P:[[-0.6,1.05],[0.6,1.05],[-0.6,-1.05],[0.6,-1.05]],hw:0.47,af:0.64,ab:-0.64,wb:1.28,
    eye:[0,1.68,-0.12,0,-0.3,10],lamp:[0,0.95,1.0,0,-1,10],cam:0.55,col:'#c0392b',len:2.1,wid:1.2,car:'at',acc:5.5,brake:8,rider:true}};
// the lowboy hangs on the fifth wheel HV_KP behind the semi's middle; its axles are HV_LT behind that
const HV_KP=1.8,HV_LT=13.2,HV_TC=[-1.2,-4.4,-7.6,-10.8,-13.4];
// the dozer's blade swings on its push arms; the loader's arms pivot high on the front frame, HV_LA0 down at rest
const HV_BLIM=[-0.14,0.5],HV_ALIM=[-0.12,1.2],HV_CLIM=[-0.95,0.6],HV_LA0=0.42,HV_ARM=2.7;
// the ripper tooth's tip: HV_RIP0 above the ground fully up, HV_RIPY below its beam's frame, HV_RIPZ along the dozer
const HV_RIP0=0.3,HV_RIPZ=-1.91,HV_RIPY=-0.45;
const hvs=[];let hvI=0;
const hvCur=()=>hvs[hvI];
// a kit of boxes and cylinders in the machine's own frame, merged into one mesh (famKit, family.js)
function hvKit(){const K=famKit();return {K,
  box:(w,h,d,col,x,y,z,rx)=>K.box(w,h,d,col,x,y,z,0,rx||0),
  cyl:(r0,r1,h,seg,col,x,y,z,rx,rz)=>K.cyl(r0,r1,h,seg,col,x,y,z,0,rx||0,rz||0),
  wheel:(r,w,x,y,z,rim)=>{K.cyl(r,r,w,12,0x1d1d1f,x,y,z,0,0,Math.PI/2);K.cyl(r*0.55,r*0.55,w+0.04,8,rim||0xd9a404,x,y,z,0,0,Math.PI/2)}}}
function hvMesh(k,parent){const m=new THREE.Mesh(famMerge(k.K.solid),famMat);m.castShadow=true;m.receiveShadow=true;m.layers.enable(RAIN_LAYER);parent.add(m);return m}
// the dirt heaped in front of the blade or in the bucket
function hvHeap(parent,x,y,z){const m=new THREE.Mesh(new THREE.IcosahedronGeometry(0.5,1),M(0x7a5232,{map:null}));m.position.set(x,y,z);m.visible=false;parent.add(m);return m}
function hvMake(k,home){const K=HV_KINDS[k],g=new THREE.Group();scene.add(g);home=home||{x:K.x,z:K.z,yaw:K.yaw};
  const h={k,K,g,home,x:home.x,z:home.z,y:0,yaw:home.yaw,pitch:0,roll:0,v:0,w:0,steer:0,ty:home.yaw,a:0,c:0.1,rip:0,drag:1,load:0,loadC:[0.5,0.34,0.21],loadMix:[0,0,0,1],loadWet:0,run:0,thr:0,hyd:0,top:1,circ:[]};
  const Y=DEX_Y,D=DEX_D,GL=DEX_GLASS,STEEL=0x8a8a86;
  if(k==='dozer'){const b=hvKit();
    for(const sx of [-1.05,1.05]){b.box(0.55,0.75,3.0,D,sx,0.4,0);for(const sz of [-1.45,1.45])b.cyl(0.38,0.38,0.56,10,0x3a3c40,sx,0.4,sz,0,Math.PI/2)}
    b.box(1.55,0.9,2.6,Y,0,1.2,-0.15);b.box(1.3,0.55,1.2,Y,0,1.85,0.6);b.cyl(0.07,0.07,0.8,6,D,0.4,2.4,0.8);
    b.box(1.3,1.15,1.3,GL,0,2.25,-0.65);b.box(1.5,0.12,1.5,Y,0,2.9,-0.65);for(const sx of [-0.68,0.68])for(const sz of [-1.3,0])b.box(0.08,1.2,0.08,Y,sx,2.25,sz);
    for(const sx of [-0.5,0.5])b.box(0.2,0.5,0.3,D,sx,0.85,-1.8);hvMesh(b,g);
    // the ripper: a beam on two links carrying one shank and its tooth, lowered and raised on its rams (h.rip: 0 up, 1 down)
    const rp=new THREE.Group();rp.position.set(0,0,-2.05);g.add(rp);h.ripG=rp;
    const r=hvKit();for(const sx of [-0.5,0.5])r.box(0.12,0.14,0.55,D,sx,0.75,0.2,0.35);r.box(1.25,0.24,0.3,Y,0,0.62,0);
    r.box(0.12,1.0,0.24,D,0,0.25,-0.02);r.box(0.1,0.32,0.14,D,0,-0.28,0.05,-0.35);r.box(0.09,0.08,0.24,STEEL,0,-0.4,0.14,-0.6);hvMesh(r,rp);
    // the push arms, blade and cutting edge, swung from the track frames
    const bl=new THREE.Group();bl.position.set(0,0.6,0.45);g.add(bl);h.blade=bl;
    const p=hvKit();for(const sx of [-1.25,1.25])p.box(0.18,0.22,1.6,Y,sx,0,0.8,-0.1);
    p.box(3.1,1.05,0.22,Y,0,0.02,1.65,-0.15);p.box(3.12,0.08,0.12,STEEL,0,-0.5,1.75);hvMesh(p,bl);
    h.heap=hvHeap(bl,0,-0.2,2.3)}
  if(k==='loader'){const b=hvKit();
    for(const sx of [-1.15,1.15])for(const sz of [-1.3,1.4])b.wheel(0.8,0.62,sx,0.8,sz);
    b.box(1.8,1.0,2.6,Y,0,1.35,-1.0);b.box(1.6,0.9,1.5,Y,0,2.2,-1.65);b.box(2.0,0.8,0.45,D,0,1.35,-2.5);b.cyl(0.08,0.08,0.9,6,D,-0.45,2.95,-1.7);
    b.box(1.3,1.45,1.3,GL,0,2.6,-0.15);b.box(1.55,0.12,1.55,Y,0,3.38,-0.15);for(const sx of [-0.66,0.66])for(const sz of [-0.8,0.5])b.box(0.08,1.5,0.08,Y,sx,2.6,sz);
    b.box(1.2,0.8,1.6,Y,0,1.25,1.0);for(const sx of [-0.62,0.62])b.box(0.14,1.2,0.3,Y,sx,1.65,0.8);hvMesh(b,g);
    // the lift arms and the bucket on their ends, kept level as the arms rise
    const ar=new THREE.Group();ar.position.set(0,2.1,0.8);g.add(ar);h.arm=ar;
    const a=hvKit();for(const sx of [-0.72,0.72])a.box(0.22,0.32,HV_ARM,Y,sx,0,HV_ARM/2);a.box(1.66,0.2,0.2,Y,0,-0.05,1.9);a.cyl(0.07,0.07,1.4,6,STEEL,0,-0.35,1.0,Math.PI/2-0.25);hvMesh(a,ar);
    const bk=new THREE.Group();bk.position.set(0,0,HV_ARM);ar.add(bk);h.bkt=bk;
    const u=hvKit();u.box(2.7,0.95,0.08,Y,0,-0.42,0);u.box(2.7,0.08,1.0,Y,0,-0.88,0.48);u.box(2.7,0.07,0.35,Y,0,0.03,0.17);
    for(const sx of [-1.35,1.35])u.box(0.07,0.95,1.0,Y,sx,-0.42,0.48);u.box(2.74,0.06,0.14,STEEL,0,-0.9,1.0);hvMesh(u,bk);
    h.heap=hvHeap(bk,0,-0.62,0.5)}
  if(k==='semi'){const RED=0xb3262c,CHROME=0xc8ccd0,b=hvKit();
    b.box(1.0,0.4,7.0,D,0,1.0,0.3);b.box(2.4,2.5,2.0,RED,0,2.45,1.5);b.box(2.2,0.9,0.06,GL,0,3.0,2.52);
    b.box(2.1,1.2,1.8,RED,0,1.85,3.4);b.box(1.5,1.0,0.1,CHROME,0,1.85,4.32);b.box(2.3,0.25,0.3,CHROME,0,0.75,4.4);
    for(const sx of [-1.1,1.1]){b.cyl(0.09,0.09,2.4,8,CHROME,sx*1.08,3.1,0.4);b.cyl(0.32,0.32,1.0,10,CHROME,sx*1.15,0.95,2.0,Math.PI/2)}
    for(const sx of [-1.05,1.05]){b.wheel(0.55,0.32,sx,0.55,3.4,CHROME);for(const sz of [-1.1,-2.4])b.wheel(0.55,0.5,sx,0.55,sz,CHROME)}
    b.box(1.6,0.12,1.4,D,0,1.3,-HV_KP);hvMesh(b,g);
    // the lowboy, its own group swung from the kingpin (its frame's origin, on the ground under the fifth wheel)
    const t=new THREE.Group();scene.add(t);h.trailer=t;const o=HV_KP,q=hvKit();
    q.box(2.6,0.4,2.6,D,0,1.6,-2.2+o);q.box(2.6,0.35,1.6,D,0,1.05,-3.95+o,0.62);
    q.box(2.8,0.35,8.5,D,0,0.62,-8.9+o);q.box(2.7,0.05,8.4,0x7a5434,0,0.82,-8.9+o);q.box(2.8,0.45,3.4,D,0,1.1,-14.8+o);
    for(const sx of [-1.1,1.1])for(const sz of [-13.8,-15.0,-16.2])q.wheel(0.5,0.45,sx,0.5,sz+o,0x9a9ea2);hvMesh(q,t)}
  if(k==='pickup'){const BODY=0x1d3557,TRIM=0x1b1c1e,CHROME=0xc8ccd0,b=hvKit();
    for(const sx of [-0.86,0.86])for(const sz of [1.85,-1.85])b.wheel(0.41,0.3,sx,0.41,sz,0xb8bcc0);
    b.box(1.0,0.22,5.4,TRIM,0,0.5,0);b.box(1.98,0.42,5.7,BODY,0,0.84,0.05);
    // hood and nose: grille, bumper, headlamps
    b.box(1.94,0.3,1.6,BODY,0,1.2,2.05,0.04);b.box(1.6,0.42,0.08,CHROME,0,1.0,2.9);b.box(1.5,0.3,0.1,TRIM,0,1.0,2.92);
    b.box(2.02,0.22,0.24,CHROME,0,0.62,2.92);for(const sx of [-0.72,0.72])b.box(0.34,0.14,0.06,0xfff6d8,sx,1.12,2.92);
    // the crew cab: doors, glass all round, the roof, mirrors
    b.box(1.96,0.5,2.4,BODY,0,1.25,0.1);b.box(1.8,0.56,2.1,DEX_GLASS,0,1.78,0.0);b.box(1.84,0.08,2.0,BODY,0,2.08,-0.02);
    b.box(1.8,0.62,0.06,DEX_GLASS,0,1.76,1.12,-0.5);for(const sx of [-0.92,0.92]){b.box(0.07,0.62,0.07,BODY,sx,1.76,1.1,-0.5);b.box(0.07,0.6,0.08,BODY,sx,1.78,-0.02);b.box(0.12,0.16,0.22,TRIM,sx*1.12,1.6,1.02)}
    // the bed: floor, sides, the front wall and the tailgate, with the tail lamps
    b.box(1.84,0.06,2.0,TRIM,0,1.04,-1.85);for(const sx of [-0.95,0.95])b.box(0.08,0.5,2.05,BODY,sx,1.3,-1.85);
    b.box(1.9,0.5,0.08,BODY,0,1.3,-0.82);b.box(1.9,0.52,0.08,BODY,0,1.29,-2.87);for(const sx of [-0.9,0.9])b.box(0.14,0.36,0.06,0xb3262c,sx,1.3,-2.92);
    b.box(2.0,0.2,0.22,CHROME,0,0.64,-2.92);for(const sx of [-0.99,0.99])for(const sz of [1.85,-1.85])b.box(0.06,0.14,1.05,TRIM,sx,1.04,sz);hvMesh(b,g)}
  if(k==='atv'){const RED=0xc0392b,TRIM=0x1b1c1e,STEEL=0x55595a,b=hvKit();
    for(const sx of [-0.47,0.47])for(const sz of [0.64,-0.64])b.wheel(0.31,0.26,sx,0.31,sz,0x8a8e92);
    b.box(0.5,0.22,1.5,TRIM,0,0.45,0);b.box(0.44,0.36,0.55,0x3a3c40,0,0.56,0.02);
    // the plastics: front and back fenders over the wheels, the nose, the tank
    b.box(1.18,0.1,0.78,RED,0,0.74,0.62);b.box(0.66,0.26,0.42,RED,0,0.78,0.98,0.35);b.box(1.18,0.1,0.72,RED,0,0.76,-0.62);
    for(const sx of [-0.5,0.5]){b.box(0.18,0.2,0.7,RED,sx,0.66,0.62);b.box(0.18,0.2,0.66,RED,sx,0.68,-0.62);b.box(0.24,0.04,0.42,TRIM,sx*0.82,0.52,0)}
    b.box(0.36,0.2,0.38,RED,0,0.9,0.3);b.box(0.34,0.14,0.78,0x1a1a1a,0,0.92,-0.2);
    // steel racks front and back, the bars and the lamps
    b.box(0.92,0.04,0.46,STEEL,0,0.88,0.76);b.box(0.92,0.04,0.52,STEEL,0,0.9,-0.76);
    b.cyl(0.025,0.025,0.4,6,TRIM,0,0.98,0.5,-0.45);b.box(0.78,0.04,0.04,TRIM,0,1.16,0.42);for(const sx of [-0.37,0.37])b.box(0.12,0.05,0.05,0x111111,sx,1.16,0.42);
    for(const sx of [-0.16,0.16])b.box(0.12,0.08,0.05,0xfff6d8,sx,0.84,1.18);hvMesh(b,g)}
  hvs.push(h);return h}
for(const k of ['dozer','loader','semi','pickup','atv'])hvMake(k);
// and a set of Corley's own, parked in a row on the mesa's east lawn facing the dig, the semi behind them
const HV_CORLEY=[['dozer',46,-38,-Math.PI/2],['loader',46,-28,-Math.PI/2],['pickup',46,-18,-Math.PI/2],['atv',46,-11,-Math.PI/2],['semi',60,-30,0]];
for(const [k,x,z,yaw] of HV_CORLEY)hvMake(k,{x,z,yaw,island:'corley'});
const hvV=new THREE.Vector3(),hvTip=new THREE.Vector3(),hvTipL=new THREE.Vector3(),hvTipR=new THREE.Vector3(),hvLip=new THREE.Vector3();
function hvPose(h){h.g.position.set(h.x,h.y,h.z);h.g.rotation.set(h.pitch,h.yaw,h.roll,'YXZ');
  if(h.blade)h.blade.rotation.x=-h.a;
  if(h.ripG)h.ripG.position.y=HV_RIP0-HV_RIPY-h.rip*(HV_RIP0+TU.hvRipD);
  if(h.K.hoe)bhParts(h);
  if(h.arm){const e=HV_LA0-h.a;h.arm.rotation.x=e;h.bkt.rotation.x=-e-h.c}
  h.g.updateMatrixWorld(true);if(h.rams&&h.rams.length&&h.rams[0].ga.visible)mdlRamPose(h);
  const sy=Math.sin(h.yaw),cy=Math.cos(h.yaw);h.circ.length=0;for(const lz of h.K.C)h.circ.push([h.x+sy*lz,h.z+cy*lz,h.K.R]);if(h.tag)h.circ.push(...h.tag.circ);
  if(h.trailer){h.g.localToWorld(hvV.set(0,1.3,-HV_KP));const ts=Math.sin(h.ty),tc=Math.cos(h.ty),yA=surfAt(hvV.x-ts*HV_LT,hvV.z-tc*HV_LT),yK=hvV.y-1.3;
    h.trailer.position.set(hvV.x,yK,hvV.z);h.trailer.rotation.set(-Math.atan2(yK-yA,HV_LT),h.ty,0,'YXZ');
    for(const lz of HV_TC)h.circ.push([hvV.x+ts*lz,hvV.z+tc*lz,1.45])}}
function hvReset(h){const H=h.home;if(h.K.hoe)bhReset(h);Object.assign(h,{x:H.x,z:H.z,yaw:H.yaw,ty:H.yaw,mv:H.yaw,v:0,w:0,steer:0,a:0,c:0.1,rip:0,drag:1,load:0,loadWet:0,run:0});hvGround(h,1);hvPose(h)}
// sits it on the ground under its wheels or tracks (k: how far toward it this frame)
function hvGround(h,k){const K=h.K,sy=Math.sin(h.yaw),cy=Math.cos(h.yaw),S=(lx,lz)=>surfAt(h.x+lx*cy+lz*sy,h.z-lx*sy+lz*cy);
  const fl=S(-K.hw,K.af),fr=S(K.hw,K.af),bl=S(-K.hw,K.ab),br=S(K.hw,K.ab),hf=(fl+fr)/2,hb=(bl+br)/2,L=K.af-K.ab,y=hb+(hf-hb)*(-K.ab/L);
  h.y+=(y-h.y)*k;h.pitch+=(-Math.atan2(hf-hb,L)-h.pitch)*k;h.roll+=(Math.atan2((fr+br)-(fl+bl),4*K.hw)-h.roll)*k}
// pushes o (its circles at lzs along it, radius r) out of every heavy machine but skip; true if it touched one
function hvPush(o,lzs,r,skip){let hit=false;const sy=Math.sin(o.yaw||0),cy=Math.cos(o.yaw||0);
  for(const h of hvs){if(h===skip)continue;
    for(const lz of lzs)for(const [qx,qz,qr] of h.circ){const dx=o.x+sy*lz-qx,dz=o.z+cy*lz-qz,d=Math.hypot(dx,dz),m=r+qr;
      if(d<m&&d>1e-3){o.x+=dx/d*(m-d);o.z+=dz/d*(m-d);hit=true}}}
  return hit}
// the trailer's corners in a wall or off the land
function hvTrailOut(h){h.g.localToWorld(hvV.set(0,0,-HV_KP));const ts=Math.sin(h.ty),tc=Math.cos(h.ty);let n=0;
  for(const lz of [-4,-9,-15])for(const lx of [-1.3,1.3]){const x=hvV.x+tc*lx+ts*lz,z=hvV.z-ts*lx+tc*lz;if(wallAt(x,z)||!landIn(x,z,0.5,1.4))n++}
  return n}
// what the dozer cut or the loader scooped mixes into its load (the colour, the soil kinds and how wet it is)
function hvTake(h,got,p){const f=got/(h.load+got);for(let q=0;q<3;q++)h.loadC[q]+=(digC[q]-h.loadC[q])*f;for(let q=0;q<4;q++)h.loadMix[q]+=(digMix[q]-h.loadMix[q])*f;
  h.loadWet+=(mudAt(p.x,p.z)-h.loadWet)*f;h.load+=got;st.dirty=true;st.slumpT=2.5}
// every frame: drive (+ forward), turn (+ right), arm (+ raise the blade or arms) and curl (+ curl back); 0 when parked
// a machine nobody is in that has sat still for HV_IDLE updates (every number of its state the same, to a hair, after
// each one) is looked at again only every HV_IDLE_N frames, taking turns, or at once if it is moved (teleport, editor):
// the ground going down or up under it shows within a quarter second, and it runs every frame again until it settles
const HV_IDLE=30,HV_IDLE_N=12,hvIdle=[];let hvRR=0;
function hvSum(h){let s=0,n=1;for(const k in h){const v=h[k];if(typeof v==='number')s+=v*(n++ +0.37);
  else if(v&&typeof v==='object'&&!v.isObject3D&&!Array.isArray(v)&&k!=='K'&&k!=='home')for(const q in v)if(typeof v[q]==='number')s+=v[q]*(n++ +0.37)}return s}
function hvTick(dt,drive,turn,arm,curl){hvRR=(hvRR+1)%HV_IDLE_N;
  for(let i=0;i<hvs.length;i++){const h=hvs[i],on=mode==='heavy'&&hvI===i&&wk.inside==='hv'+i&&(!bench.on||bench.kind==='load'),I=hvIdle[i]||(hvIdle[i]={still:0,dt:0,x:NaN,z:0,yaw:0});
    if(on){I.still=0;I.dt=0;if(h.K.hoe)bhTick(h,dt,drive,turn,arm,curl);else hvDrive(h,dt,drive,turn,arm,curl,true);continue}
    I.dt=Math.min(0.1,I.dt+dt);const same=h.x===I.x&&h.z===I.z&&h.yaw===I.yaw;
    if(I.still>=HV_IDLE&&i%HV_IDLE_N!==hvRR&&same)continue;
    const a=hvSum(h);hvDrive(h,I.dt,0,0,0,0,false);I.dt=0;
    I.still=same&&Math.abs(hvSum(h)-a)<1e-5?I.still+1:0;I.x=h.x;I.z=h.z;I.yaw=h.yaw}}
function hvDrive(h,dt,drive,turn,arm,curl,on){const K=h.K;
  h.run+=((on?1:0)-h.run)*Math.min(1,dt*(on?2:0.7));h.thr=drive;h.hyd=Math.min(1,Math.abs(arm)+Math.abs(curl));
  const mudN=mudAt(h.x,h.z),k=Math.max(0,1-0.45*mudN*TU.mudDrag);
  const ox=h.x,oz=h.z,oyaw=h.yaw,oty=h.ty,omv=h.mv,bad0=wallCount(h.x,h.z,h.yaw,K.P)+(K.trail?hvTrailOut(h):0);
  if(K.car)hvCar(h,dt,drive,turn,k,on);
  else if(K.track){h.top=K.mini?TU.mnSpd:TU.hvDzSpd;h.v+=(drive*h.top*k*h.drag-h.v)*Math.min(1,dt*(drive?2:4));h.w+=(-turn*(K.mini?TU.mnTurn:TU.hvDzTurn)*k-h.w)*Math.min(1,dt*5);h.yaw+=h.w*dt}
  else{// the gas pulls it up to speed (the semi slowly), the brakes stop it harder; the wheel locks less the faster it goes
    h.top=K.trail?TU.hvSmSpd:K.hoe?TU.bhSpd:TU.hvLdSpd;const tgt=drive*h.top*k,acc=K.trail?0.35:1.2,up=Math.abs(tgt)>Math.abs(h.v)&&tgt*h.v>=0;
    h.v+=(tgt-h.v)*Math.min(1,dt*(up?acc:acc*3));
    const lock=(K.trail?TU.hvSmLock:K.hoe?TU.bhLock:TU.hvLdLock)/(1+Math.abs(h.v)*0.06);h.steer+=(turn*lock-h.steer)*Math.min(1,dt*4);
    h.w=-h.v*Math.tan(h.steer)/K.wb;h.yaw+=h.w*dt}
  if(!on){if(Math.abs(h.v)<0.05)h.v=0;if(Math.abs(h.w)<0.01)h.w=0}
  const sy=Math.sin(h.yaw),cy=Math.cos(h.yaw),mvd=K.car?h.mv:h.yaw;h.x+=Math.sin(mvd)*h.v*dt;h.z+=Math.cos(mvd)*h.v*dt;
  // the lowboy swings in behind the fifth wheel, never folding past about 75 degrees
  // Dexter's pickup tows its equipment trailer (trailer.js)
  if(h.tag)tgTick(h,dt);
  if(K.trail){h.ty+=h.v/HV_LT*Math.sin(h.yaw-h.ty)*dt;const d=Math.atan2(Math.sin(h.yaw-h.ty),Math.cos(h.yaw-h.ty));if(Math.abs(d)>1.3)h.ty=h.yaw-Math.sign(d)*1.3}
  // on the islands and decks, off steep ground, out of buildings, blocks and the other machines
  if(h.v||h.w){for(const lz of [K.P[0][1],K.P[2][1]]){const px=h.x+sy*lz,pz=h.z+cy*lz,q=landClamp(px,pz,1.0,1.4);if(q[0]!==px||q[1]!==pz){h.x+=q[0]-px;h.z+=q[1]-pz;h.v*=0.5}}
    if(wallCount(h.x,h.z,h.yaw,K.P)+(K.trail?hvTrailOut(h):0)>bad0){h.x=ox;h.z=oz;h.yaw=oyaw;h.ty=oty;h.mv=omv;h.v=0;h.w=0}
    if(blkPush(h,K.C,K.R))h.v*=0.5;
    for(const lz of K.C){const cx=h.x+sy*lz,cz=h.z+cy*lz;
      for(const [o,cs,r] of [[st,EX_C,EX_R],[tr,TR_C,TR_R],[mw,MW_C,MW_R],[sk,SK_C,SK_R],[bk,BK_C,BK_R]])for(const q of cs){const dx=cx-o.x-Math.sin(o.yaw)*q,dz=cz-o.z-Math.cos(o.yaw)*q,d=Math.hypot(dx,dz),m=K.R+r;
        if(d<m&&d>1e-3){h.x+=dx/d*(m-d);h.z+=dz/d*(m-d);h.v*=0.6}}}
    if(hvPush(h,K.C,K.R,h))h.v*=0.6}
  // tracks and tyres rut soft ground and splash through puddles (mud.js)
  if(Math.abs(h.v)+Math.abs(h.w)>0.05)for(const sd of [-1,1]){const rx=h.x+sd*K.hw*cy,rz=h.z-sd*K.hw*sy,tv=h.v-sd*h.w*K.hw;
    if(K.track){stampRut(rx,rz,h.yaw,0.28,1.5,dt);splashMud(rx+sy*1.5*Math.sign(tv||1),rz+cy*1.5*Math.sign(tv||1),h.yaw,tv,0.3,0.8,dt)}
    else for(const lz of [K.af,K.ab]){stampRut(rx+sy*lz,rz+cy*lz,h.yaw,0.3,0.45,dt);splashMud(rx+sy*lz,rz+cy*lz,h.yaw,tv,0.3,0.6,dt)}}
  hvGround(h,Math.min(1,dt*10));
  if(K.mini)mnWork(h,dt,arm,curl,on);else if(K.track)hvBlade(h,dt,arm,curl,on);else if(h.arm)hvBucket(h,dt,arm,curl,on);else if(K.hoe)bhWork(h,dt,arm,curl,on);else hvPose(h);
  if(K.rider&&wk.inside==='hv'+hvs.indexOf(h))hvRider(h)}
// the pickup and the four-wheeler (K.car: their Tuning keys start with it). The gas pulls with K.acc m/s² from a stop,
// fading to nothing at top speed; against the way it rolls, the pedal is the brake (K.brake m/s²) until it stops, then
// it backs up; off the pedals it coasts down. The wheel locks less the faster it goes (at full lock, never past about
// 1.4 g of turn). h.mv is the way it travels: it
// follows the way it points only as fast as the tyres can hold (about 0.8 g at 100% grip), so a hard turn at speed
// slides, and a sliding tyre scrubs speed off
function hvCar(h,dt,drive,turn,k,on){const K=h.K,P=K.car,top=TU[P+'Spd']*k,rev=TU[P+'Rev']*k,v=h.v;h.top=TU[P+'Spd'];if(h.mv===undefined)h.mv=h.yaw;
  if(drive*v<0&&Math.abs(v)>0.2){const b=K.brake*TU[P+'Brake']*Math.abs(drive)*dt;h.v=Math.abs(v)<=b?0:v-Math.sign(v)*b}
  else if(drive){const lim=drive>0?top:rev,f=Math.max(0,1-Math.abs(v)/Math.max(0.1,lim*Math.abs(drive)));h.v+=Math.sign(drive)*K.acc*TU[P+'Acc']*f*dt;
    if(Math.abs(h.v)>lim)h.v+=(Math.sign(h.v)*lim-h.v)*Math.min(1,dt*2)}
  else{const c=(0.35+0.004*v*v)*dt;h.v=Math.abs(v)<=c?0:v-Math.sign(v)*c}
  const lock=Math.min(TU[P+'Lock']/(1+Math.abs(h.v)*0.03),Math.atan(K.wb*14/Math.max(1,h.v*h.v)));h.steer+=(turn*lock-h.steer)*Math.min(1,dt*5);
  h.w=-h.v*Math.tan(h.steer)/K.wb;h.yaw+=h.w*dt;
  const d=Math.atan2(Math.sin(h.yaw-h.mv),Math.cos(h.yaw-h.mv)),hold=7.8*TU[P+'Grip']/Math.max(1,Math.abs(h.v))*dt;
  h.mv+=clamp(d,-hold,hold);h.slide=Math.abs(Math.sin(d));if(h.slide>0.05)h.v*=1-Math.min(0.5,1.2*h.slide*dt)}
// the rider on the four-wheeler: on the seat, boots on the footrests, hands on the bars, leaning a little into the turns.
// The golf cart and go-karts (carts.js) seat him at K.seat with his legs at K.legs [hip, knee] and his back at K.lean
const hvRV=new THREE.Vector3();
function hvRider(h){const K=h.K,S=K.seat||[0,0.13,-0.22],L=K.legs||[-1.15,1.25];h.g.localToWorld(hvRV.set(S[0],S[1],S[2]));Object.assign(wk,{x:h.x,z:h.z,y:h.y,yaw:h.yaw});walker.position.copy(hvRV);
  walker.rotation.set(-h.pitch,h.yaw,h.roll-clamp(h.steer*h.v*0.04,-0.25,0.25),'YXZ');walker.visible=!(mode==='heavy'&&camMode==='cab');
  wkBody.position.y=0;wkBody.rotation.x=K.lean??0.22;wkHead.rotation.x=-0.1;
  for(let s=0;s<2;s++){wkLegs[s].top.rotation.x=L[0];wkLegs[s].low.rotation.x=L[1];wkArms[s].top.rotation.x=-0.95;wkArms[s].low.rotation.x=-0.55}}
// the dozer's blade: down on the dig site it shaves the ground as it goes forward; what it cuts rolls up in front of it
// and spills ahead (the blade, still down, picks it up again, so the heap goes along with it); lifted, it is left there
// It bites hard ground slowly (soilRes, terrain.js) and lugs the dozer down doing it, unless the ripper broke it up first
function hvBlade(h,dt,arm,curl,on){const cap=TU.hvDzCap;h.a=clamp(h.a+arm*TU.hvDzBlade*dt,...HV_BLIM);h.rip=clamp(h.rip-curl*0.8*dt,0,1);hvPose(h);
  let drag=1;if(on)drag*=hvRipper(h,dt);
  const B=h.blade;B.localToWorld(hvTip.set(0,-0.54,1.78));
  if(on&&h.v>0.15&&h.load<cap-0.002&&inDig(hvTip.x,hvTip.z,1.5)&&hvTip.y<hAt(hvTip.x,hvTip.z)-0.02){
    const res=soilRes(Math.round(gJ(hvTip.z))*V+Math.round(gI(hvTip.x)),hvTip.y),rate=Math.min(cap-h.load,(0.4+h.v*0.8)*res*dt*3);drag*=0.4+0.6*res;
    if(res<0.25&&!h.seenRock){h.seenRock=true;toast(say('dozerRock'),'',4200)}
    for(const lx of [-1.0,0,1.0]){B.localToWorld(hvTipL.set(lx,-0.54,1.78));const got=dig(hvTipL,rate/3);if(got>0)hvTake(h,got,hvTipL)}}
  h.drag+=(drag-h.drag)*Math.min(1,dt*4);
  if(h.load>0.001){const keep=h.a<0.12&&h.v>0.1,out=Math.min(h.load,h.load*dt*(keep?0.6:3)+(h.load>cap?h.load-cap:0));
    for(const lx of [-0.8,0.8]){B.localToWorld(hvLip.set(lx,-0.3,2.5));if(inDig(hvLip.x,hvLip.z,1)){deposit(hvLip.x,hvLip.z,out/2,h.loadC,h.loadMix,1.4,h.loadWet);st.dirty=true;st.slumpT=2.5}}
    h.load-=out;if(h.load<0.001)h.load=0}
  h.heap.visible=h.load>0.03;if(h.heap.visible){const s=0.4+0.8*Math.sqrt(h.load/cap);h.heap.scale.set(2.8*s,0.9*s,1.1*s);tintLoad(h.heap.material,h.loadC)}}
// the ripper: its tooth under the ground on the dig site, moving, loosens the ground beside it down to the tooth (ripD).
// Each point is broken once, as the tooth goes by: it leaves a furrow down the middle, about 3 in deep and 4 in wide,
// with the broken ground heaved up in lumps along both sides of it (loose ground bulks up), in the colour of what it
// tore up. It throws clods, and hard ground drags on it. Returns the drag
function hvRipper(h,dt){h.g.localToWorld(hvV.set(0,HV_RIP0-h.rip*(HV_RIP0+TU.hvRipD),HV_RIPZ));
  if(Math.abs(h.v)<0.1||!inDig(hvV.x,hvV.z,1))return 1;
  const ti=Math.round(gI(hvV.x)),tj=Math.round(gJ(hvV.z));if(ti<0||tj<0||ti>N||tj>N||hvV.y>H[tj*V+ti]-0.03)return 1;
  const res=soilRes(tj*V+ti,hvV.y),r=0.45,i0=Math.max(0,Math.floor(gI(hvV.x-r))),i1=Math.min(N,Math.ceil(gI(hvV.x+r))),j0=Math.max(0,Math.floor(gJ(hvV.z-r))),j1=Math.min(N,Math.ceil(gJ(hvV.z+r)));
  const fx=Math.sin(h.yaw),fz=Math.cos(h.yaw),sg=Math.sign(h.v);let any=false;
  for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){const k=j*V+i;if(digKeep[k])continue;
    // a: how far the point is behind the tooth as it goes, u: how far out to the side
    const dx=gX(i)-hvV.x,dz=gZ(j)-hvV.z,a=-(dx*fx+dz*fz)*sg,u=Math.abs(dx*fz-dz*fx);if(a<-0.08||a>0.3||u>r)continue;
    const depth=(H0[k]-hvV.y)*(1-0.5*u/r),fresh=depth-Math.max(ripD[k],H0[k]-H[k]);if(fresh<=0.02)continue;
    const f=Math.min(1,fresh/0.25),m=matAt(k,H0[k]-depth),dh=u<0.12?-0.07*f:(0.035+0.03*hash(i*1.7,j*2.3))*f*(1-(u-0.12)/(r-0.12));
    H[k]+=dh;if(dh>0)mixSpoil(k,matColor(k,m),dh);comp[k]=0;ripD[k]=Math.max(ripD[k],depth);any=true}
  if(any){touch(i0,i1,j0,j1);st.dirty=true;if(Math.random()<dt*10)spawn(hvV,0.5)}
  return 0.45+0.55*res}
// the loader's arms and bucket: it scoops with the cutting edge under the ground on the dig site and the bucket near
// level, and pours off the lip once it is tipped past about 20 degrees, into the truck bed, onto the ground or over the cliff
function hvBucket(h,dt,arm,curl,on){const cap=TU.hvLdCap,full=1-0.15*h.load/cap;
  h.a=clamp(h.a+arm*TU.hvLdArm*dt*full,...HV_ALIM);h.c=clamp(h.c+curl*TU.hvLdCurl*dt,...HV_CLIM);hvPose(h);
  const B=h.bkt;B.localToWorld(hvTip.set(0,-0.92,1.02));B.localToWorld(hvTipL.set(-0.9,-0.92,0.9));B.localToWorld(hvTipR.set(0.9,-0.92,0.9));B.localToWorld(hvLip.set(0,-0.75,1.1));
  hvLip.x+=Math.sin(h.yaw)*0.5;hvLip.z+=Math.cos(h.yaw)*0.5;
  if(on&&h.c>-0.3&&h.load<cap-0.002&&hvTip.y<hAt(hvTip.x,hvTip.z)-0.03&&inDig(hvTip.x,hvTip.z,1)){
    let got=dig(hvTipL,(cap-h.load)/2);got+=dig(hvTipR,cap-h.load-got);
    if(got>0){hvTake(h,got,hvTip);if(h.load>=cap-0.003)toast(say('loaderFull'),'',2400)}}
  const f=clamp((-0.35-h.c)/0.45,0,1);
  if(f>0&&h.load>0.0005){const out=Math.min(h.load,f*(0.4+h.load*1.5)*dt);h.load-=out;
    if(inBed(hvLip)&&tr.load<TU.trCap){const take=Math.min(out,TU.trCap-tr.load),ff=take/(tr.load+take||1);
      for(let q=0;q<3;q++)tr.loadC[q]+=(h.loadC[q]-tr.loadC[q])*ff;for(let q=0;q<4;q++)tr.loadMix[q]+=(h.loadMix[q]-tr.loadMix[q])*ff;tr.loadWet+=(h.loadWet-tr.loadWet)*ff;tr.load+=take}
    else if(inDig(hvLip.x,hvLip.z,1)){const gy=hAt(hvLip.x,hvLip.z);deposit(hvLip.x,hvLip.z,out,h.loadC,h.loadMix,dropSpread(hvLip.y-gy),h.loadWet);st.dirty=true;st.slumpT=2.5}
    for(let n=0;n<Math.ceil(out*50);n++)spawn(hvLip,0.9)}
  h.heap.visible=h.load>0.01;if(h.heap.visible){const s=0.35+0.65*Math.sqrt(h.load/cap);h.heap.scale.set(2.3*s,0.7*s,0.9+0.3*s);tintLoad(h.heap.material,h.loadC)}}
// the one the worker is in, when it can dig (the dig grid follows it, digtiles.js)
function hvDigger(){const R=WK_RIDES[wk.inside];return R&&R.m==='heavy'&&!R.o.K.trail&&!R.o.K.car&&!R.o.K.mini?R.o:null}
// the walker climbs in beside them (walker.js): they join WK_RIDES as hv0 to hv4 (Dexter's) and hv5 to hv9 (Corley's);
// Corley's backhoe (backhoe.js) joins as hv10, the mini excavator (trailer.js) next, then the golf cart and go-karts (carts.js)
hvs.forEach((h,i)=>{WK_RIDES['hv'+i]={o:h,c:h.K.C,r:h.K.R,m:'heavy',n:h.K.n,pick(){hvI=i}};hvReset(h)});
