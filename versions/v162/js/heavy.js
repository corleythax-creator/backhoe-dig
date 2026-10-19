// Corley's Island: Dexter's heavy machines, parked in his yard (dexter.js): the dozer, the wheel loader and the red semi
// with its lowboy trailer. Walk up to one and Get in to drive it (Heavy mode; hvI is the one you are in). The left stick
// drives and steers each of them. The dozer turns on its tracks like the skid steer; the right stick up and down lowers
// and raises the blade, and with the blade down on the dig site it shaves the ground and shoves what it cuts along in a
// heap in front of it, left where you lift the blade. The wheel loader steers on its middle hinge; the right stick
// lowers and raises the arms and curls and dumps the bucket, which scoops on the dig site and dumps in a pile, over the
// cliff or into the dump truck's bed. The dozer's ripper, at the back, goes down and up on the right stick left and right:
// dragged through the ground it breaks up hard clay and rock (ripD, terrain.js), so the blade and the excavator then dig
// it like loose fill. The semi steers like a truck and its lowboy follows on the fifth wheel; the right
// stick looks round.
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
    eye:[0.5,2.9,1.7,0,-0.25,10],lamp:[0,1.2,4.4,0,-1.2,16],cam:1.5,col:'#b3262c',len:7.0,wid:2.5,trail:true}};
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
function hvMake(k){const K=HV_KINDS[k],g=new THREE.Group();scene.add(g);
  const h={k,K,g,x:K.x,z:K.z,y:0,yaw:K.yaw,pitch:0,roll:0,v:0,w:0,steer:0,ty:K.yaw,a:0,c:0.1,rip:0,drag:1,load:0,loadC:[0.5,0.34,0.21],loadMix:[0,0,0,1],loadWet:0,run:0,thr:0,hyd:0,top:1,circ:[]};
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
  hvs.push(h);return h}
for(const k of ['dozer','loader','semi'])hvMake(k);
const hvV=new THREE.Vector3(),hvTip=new THREE.Vector3(),hvTipL=new THREE.Vector3(),hvTipR=new THREE.Vector3(),hvLip=new THREE.Vector3();
function hvPose(h){h.g.position.set(h.x,h.y,h.z);h.g.rotation.set(h.pitch,h.yaw,h.roll,'YXZ');
  if(h.blade)h.blade.rotation.x=-h.a;
  if(h.ripG)h.ripG.position.y=HV_RIP0-HV_RIPY-h.rip*(HV_RIP0+TU.hvRipD);
  if(h.arm){const e=HV_LA0-h.a;h.arm.rotation.x=e;h.bkt.rotation.x=-e-h.c}
  h.g.updateMatrixWorld(true);
  const sy=Math.sin(h.yaw),cy=Math.cos(h.yaw);h.circ.length=0;for(const lz of h.K.C)h.circ.push([h.x+sy*lz,h.z+cy*lz,h.K.R]);
  if(h.trailer){h.g.localToWorld(hvV.set(0,1.3,-HV_KP));const ts=Math.sin(h.ty),tc=Math.cos(h.ty),yA=surfAt(hvV.x-ts*HV_LT,hvV.z-tc*HV_LT),yK=hvV.y-1.3;
    h.trailer.position.set(hvV.x,yK,hvV.z);h.trailer.rotation.set(-Math.atan2(yK-yA,HV_LT),h.ty,0,'YXZ');
    for(const lz of HV_TC)h.circ.push([hvV.x+ts*lz,hvV.z+tc*lz,1.45])}}
function hvReset(h){const K=h.K;Object.assign(h,{x:K.x,z:K.z,yaw:K.yaw,ty:K.yaw,v:0,w:0,steer:0,a:0,c:0.1,rip:0,drag:1,load:0,loadWet:0,run:0});hvGround(h,1);hvPose(h)}
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
function hvTick(dt,drive,turn,arm,curl){
  for(let i=0;i<hvs.length;i++){const h=hvs[i],on=mode==='heavy'&&hvI===i&&wk.inside==='hv'+i&&!bench.on;
    if(on)hvDrive(h,dt,drive,turn,arm,curl,true);else hvDrive(h,dt,0,0,0,0,false)}}
function hvDrive(h,dt,drive,turn,arm,curl,on){const K=h.K;
  h.run+=((on?1:0)-h.run)*Math.min(1,dt*(on?2:0.7));h.thr=drive;h.hyd=Math.min(1,Math.abs(arm)+Math.abs(curl));
  const mudN=mudAt(h.x,h.z),k=Math.max(0,1-0.45*mudN*TU.mudDrag);
  const ox=h.x,oz=h.z,oyaw=h.yaw,oty=h.ty,bad0=wallCount(h.x,h.z,h.yaw,K.P)+(K.trail?hvTrailOut(h):0);
  if(K.track){h.top=TU.hvDzSpd;h.v+=(drive*h.top*k*h.drag-h.v)*Math.min(1,dt*(drive?2:4));h.w+=(-turn*TU.hvDzTurn*k-h.w)*Math.min(1,dt*5);h.yaw+=h.w*dt}
  else{// the gas pulls it up to speed (the semi slowly), the brakes stop it harder; the wheel locks less the faster it goes
    h.top=K.trail?TU.hvSmSpd:TU.hvLdSpd;const tgt=drive*h.top*k,acc=K.trail?0.35:1.2,up=Math.abs(tgt)>Math.abs(h.v)&&tgt*h.v>=0;
    h.v+=(tgt-h.v)*Math.min(1,dt*(up?acc:acc*3));
    const lock=(K.trail?TU.hvSmLock:TU.hvLdLock)/(1+Math.abs(h.v)*0.06);h.steer+=(turn*lock-h.steer)*Math.min(1,dt*4);
    h.w=-h.v*Math.tan(h.steer)/K.wb;h.yaw+=h.w*dt}
  if(!on){if(Math.abs(h.v)<0.05)h.v=0;if(Math.abs(h.w)<0.01)h.w=0}
  const sy=Math.sin(h.yaw),cy=Math.cos(h.yaw);h.x+=sy*h.v*dt;h.z+=cy*h.v*dt;
  // the lowboy swings in behind the fifth wheel, never folding past about 75 degrees
  if(K.trail){h.ty+=h.v/HV_LT*Math.sin(h.yaw-h.ty)*dt;const d=Math.atan2(Math.sin(h.yaw-h.ty),Math.cos(h.yaw-h.ty));if(Math.abs(d)>1.3)h.ty=h.yaw-Math.sign(d)*1.3}
  // on the islands and decks, off steep ground, out of buildings, blocks and the other machines
  if(h.v||h.w){for(const lz of [K.P[0][1],K.P[2][1]]){const px=h.x+sy*lz,pz=h.z+cy*lz,q=landClamp(px,pz,1.0,1.4);if(q[0]!==px||q[1]!==pz){h.x+=q[0]-px;h.z+=q[1]-pz;h.v*=0.5}}
    if(wallCount(h.x,h.z,h.yaw,K.P)+(K.trail?hvTrailOut(h):0)>bad0){h.x=ox;h.z=oz;h.yaw=oyaw;h.ty=oty;h.v=0;h.w=0}
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
  if(K.track)hvBlade(h,dt,arm,curl,on);else if(h.arm)hvBucket(h,dt,arm,curl,on);else hvPose(h)}
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
// the ripper: its tooth under the ground on the dig site, moving, loosens the ground round it down to the tooth (ripD)
// and lifts it a little as it breaks (loose ground bulks up); it throws clods, and hard ground drags on it. Returns the drag
function hvRipper(h,dt){h.g.localToWorld(hvV.set(0,HV_RIP0-h.rip*(HV_RIP0+TU.hvRipD),HV_RIPZ));
  if(Math.abs(h.v)<0.1||!inDig(hvV.x,hvV.z,1))return 1;
  const ti=Math.round(gI(hvV.x)),tj=Math.round(gJ(hvV.z));if(ti<0||tj<0||ti>N||tj>N||hvV.y>H[tj*V+ti]-0.03)return 1;
  const res=soilRes(tj*V+ti,hvV.y),r=0.45,i0=Math.max(0,Math.floor(gI(hvV.x-r))),i1=Math.min(N,Math.ceil(gI(hvV.x+r))),j0=Math.max(0,Math.floor(gJ(hvV.z-r))),j1=Math.min(N,Math.ceil(gJ(hvV.z+r)));
  let any=false;
  for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){const k=j*V+i,d=Math.hypot(gX(i)-hvV.x,gZ(j)-hvV.z);if(d>r||digKeep[k])continue;
    const depth=(H0[k]-hvV.y)*(1-0.4*d/r),fresh=depth-Math.max(ripD[k],H0[k]-H[k]);if(fresh<=0.01)continue;
    const sw=Math.min(0.05,fresh*0.08)*(1-d/r),m=matAt(k,H0[k]-depth);H[k]+=sw;mixSpoil(k,matColor(k,m),sw);comp[k]=0;ripD[k]=Math.max(ripD[k],depth);any=true}
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
function hvDigger(){const R=WK_RIDES[wk.inside];return R&&R.m==='heavy'&&!R.o.K.trail?R.o:null}
// the walker climbs in beside them (walker.js): they join WK_RIDES as hv0, hv1, hv2
hvs.forEach((h,i)=>{WK_RIDES['hv'+i]={o:h,c:h.K.C,r:h.K.R,m:'heavy',n:h.K.n,pick(){hvI=i}};hvReset(h)});
