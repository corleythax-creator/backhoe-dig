// Corley's Island: Corley's backhoe loader, a 420-class machine parked on the mesa's east lawn at the end of his row of
// heavy machines, facing the dig. It is one of the heavy machines (heavy.js, kind 'backhoe', Heavy mode: getting in and
// out, the engine, bumping into things, the map), with its own work here. In the driver's seat the left stick drives on
// four wheels (the fronts steer) and the right stick runs the loader up front: up and down lower and raise the arms,
// left and right curl and dump the bucket, which stays level as the arms rise and scoops and dumps as the wheel
// loader's does. Drive / Dig (Enter) swivels the seat round to the hoe: the outriggers come down and lift and level the
// back of the machine on their pads (the outrigger key raises or lowers them by hand), and the sticks run the hoe as the
// excavator's arm: left swings it and reaches the stick out and in, right lowers and raises the boom and curls and
// dumps the bucket. It digs into the dig grid like the excavator (dig, terrain.js), and the grid follows the machine
// (hvDigger, digtiles.js). It will not drive with the outriggers down. Its numbers are in the Tuning tab's Backhoe group.
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.
// ---------- the machine ----------
// the machine's frame: x right, y up, z forward, metres (tools/models/backhoe.js builds the detailed model to the same
// numbers). Loader arms: pivots BH_LP (y, z), 3.0 m to the bucket hinge, BH_LA0 down at rest
const BH_LP=[2.05,0.3],BH_AL=3.0,BH_LA0=Math.atan2(1.6,2.55),BH_ALIM=[-0.08,1.05],BH_CLIM=[-0.95,0.6];
// the hoe: the kingpost BH_SW (y, z), the boom's foot pin BH_BP in the swing casting, the stick pin BH_BT in the boom,
// the stick BH_SL long; the bucket's teeth and the middle of its load in the bucket's frame
const BH_SW=[1.05,-2.45],BH_BP=[0.15,-0.35],BH_BT=[0.5,-3.05],BH_SL=2.05,BH_TIP=[0,-0.8,0.4],BH_MID=[0,-0.42,0.02];
const BH_LIM={sw:[-1.45,1.45],hb:[-0.95,1.15],hs:[-2.1,1.0],hk:[-0.75,1.9]};
// parked: boom up, stick tucked in, bucket curled
const BH_PARK={sw:0,hb:1.1,hs:-1.75,hk:1.6};
// outriggers: pivots at x ±BH_LEG[0], 1.55 m legs, folded up at BH_UP from straight down; wheels: [x, radius, z]
const BH_LEG=[0.75,1.2,-2.2],BH_LL=1.55,BH_UP=2.75,BH_WF=[0.92,0.48,1.1],BH_WR=[0.98,0.68,-1.1];
// 7 ft 9 in wide over the loader bucket, 24 ft long parked; its circles, corners and where it turns its head
HV_KINDS.backhoe={n:'backhoe',x:46,z:-2,yaw:-Math.PI/2,C:[2.3,0.8,-0.8,-2.5],R:1.2,P:[[-1.2,3.5],[1.2,3.5],[-1.2,-3.0],[1.2,-3.0]],hw:0.95,af:1.1,ab:-1.1,wb:2.2,
  eye:[0,2.5,-0.62,0,-0.6,5],lamp:[0,3.1,0.2,0,-1,12],cam:1.0,col:'#f2b705',len:7.3,wid:2.35,hoe:true};
function bhG(par,x,y,z){const g=new THREE.Group();g.position.set(x,y,z);par.add(g);return g}
// the kit-built machine (Machine models: Simple): a part group for each moving part, as the model's nodes
function bhBuild(h){const g=h.g,Y=DEX_Y,D=DEX_D,GL=DEX_GLASS,ST=0x8a8a86,P=h.parts={body:g};
  const b=hvKit();
  // frame, nose, hood, loader tower, cab, fenders, the hoe's mount
  b.box(0.95,0.3,4.5,D,0,0.75,-0.2);b.box(0.98,0.55,0.35,Y,0,0.85,2.15);b.box(0.92,0.85,1.85,Y,0,1.28,1.22);b.box(0.7,0.4,0.04,D,0,1.25,2.18);
  for(const sx of [-0.56,0.56])b.box(0.08,1.3,0.55,Y,sx,1.5,0.33);
  b.box(1.5,0.4,1.8,Y,0,1.1,-0.75);b.box(1.42,1.75,1.72,GL,0,2.2,-0.75);b.box(1.64,0.1,1.98,Y,0,3.2,-0.75);
  for(const sx of [-0.71,0.71])for(const sz of [-1.61,0.11])b.box(0.08,1.8,0.08,Y,sx,2.2,sz);
  for(const sx of [-0.98,0.98])b.box(0.5,0.08,1.5,Y,sx,1.46,-1.1);
  b.box(1.62,0.55,0.4,Y,0,1.2,-2.18);b.box(1.1,0.5,0.55,Y,0,1.2,-1.75);b.box(0.6,0.12,0.6,D,0,0.62,-2.3);b.box(0.6,0.12,0.6,D,0,1.48,-2.3);
  b.cyl(0.055,0.055,1.3,6,D,0.3,2.3,0.35);hvMesh(b,g);
  for(const [n,x,r,z,w] of [['wFL',-BH_WF[0],BH_WF[1],BH_WF[2],0.3],['wFR',BH_WF[0],BH_WF[1],BH_WF[2],0.3],['wRL',-BH_WR[0],BH_WR[1],BH_WR[2],0.44],['wRR',BH_WR[0],BH_WR[1],BH_WR[2],0.44]]){
    const wg=bhG(g,x,r,z);wg.rotation.order='YXZ';const k=hvKit();k.wheel(r,w,0,0,0,0xd9a404);for(let i=0;i<3;i++)k.box(w+0.02,0.05,r*1.9,0x1d1d1f,0,0,0,i*Math.PI/3);hvMesh(k,wg);P[n]=wg}
  // the loader: arms on the tower and the bucket on their ends
  P.arm=bhG(g,0,BH_LP[0],BH_LP[1]);{const k=hvKit();for(const sx of [-0.62,0.62])k.box(0.12,0.26,BH_AL,Y,sx,0.05,BH_AL/2);k.cyl(0.09,0.09,1.24,8,Y,0,0.45,2.0,0,Math.PI/2);hvMesh(k,P.arm)}
  P.bucket=bhG(P.arm,0,0,BH_AL);{const k=hvKit();k.box(2.3,0.7,0.07,Y,0,-0.08,-0.1);k.box(2.3,0.07,0.9,Y,0,-0.43,0.38);k.box(2.3,0.06,0.38,Y,0,0.29,0.17);
    for(const sx of [-1.15,1.15])k.box(0.05,0.75,0.95,Y,sx,-0.08,0.38);k.box(2.32,0.04,0.14,ST,0,-0.45,0.86);hvMesh(k,P.bucket)}
  h.heap=hvHeap(P.bucket,0,-0.25,0.38);
  // the swivel seat
  P.seat=bhG(g,0,1.3,-0.75);{const k=hvKit();k.box(0.5,0.12,0.48,0x2b2d30,0,0.4,0.02);k.box(0.48,0.56,0.12,0x2b2d30,0,0.72,-0.22);hvMesh(k,P.seat)}
  // the hoe: swing casting, boom (two straight lengths), stick, bucket
  P.swing=bhG(g,0,BH_SW[0],BH_SW[1]);{const k=hvKit();k.box(0.5,0.9,0.55,Y,0,0,-0.18);hvMesh(k,P.swing)}
  P.boom=bhG(P.swing,0,BH_BP[0],BH_BP[1]);{const k=hvKit(),seg=(z0,y0,z1,y1)=>{const L=Math.hypot(z1-z0,y1-y0);k.box(0.28,0.34,L,Y,0,(y0+y1)/2,(z0+z1)/2,Math.atan2(-(y1-y0),z1-z0))};
    seg(0.1,0,-1.75,0.77);seg(-1.75,0.77,-3.15,0.5);hvMesh(k,P.boom)}
  P.stick=bhG(P.boom,0,BH_BT[0],BH_BT[1]);{const k=hvKit();k.box(0.22,2.6,0.26,Y,0,-0.75,-0.02);hvMesh(k,P.stick)}
  P.hoe=bhG(P.stick,0,-BH_SL,0);{const k=hvKit();k.box(0.6,0.5,0.06,Y,0,-0.25,-0.26,0.35);k.box(0.6,0.06,0.5,Y,0,-0.78,0.1,-0.25);for(const sx of [-0.3,0.3])k.box(0.03,0.8,0.55,Y,sx,-0.4,0.02);
    k.box(0.6,0.04,0.12,ST,0,-0.82,0.42);hvMesh(k,P.hoe)}
  h.hheap=hvHeap(P.hoe,0,-0.42,0.02);
  // the outriggers and their pads
  for(const s of [-1,1]){const n=s<0?'L':'R',lg=bhG(g,s*BH_LEG[0],BH_LEG[1],BH_LEG[2]),k=hvKit();k.box(0.2,1.5,0.2,Y,0,-0.72,0);hvMesh(k,lg);
    const pd=bhG(lg,0,-BH_LL,0),q=hvKit();q.box(0.4,0.08,0.46,ST,0,-0.12,0);hvMesh(q,pd);P['leg'+n]=lg;P['pad'+n]=pd}}
// back to how it is parked: the hoe tucked, outriggers up, at the wheel, both buckets empty
function bhReset(h){Object.assign(h,BH_PARK,{a:0,c:0.1,out:0,outT:0,seat:0,hoe:false,spin:0,hin:null,hres:1,camO:0,camF:1});
  h.hl={load:0,loadC:[0.5,0.34,0.21],loadMix:[0,0,0,1],loadWet:0};h.eye=h.K.eye.slice()}
const bhLoc=new THREE.Vector3(),bhT=new THREE.Vector3(),bhM=new THREE.Vector3(),bhL=new THREE.Vector3(),bhR=new THREE.Vector3(),bhQ=new THREE.Quaternion();
// (clamp is controls.js's, later in the load order: bhParts runs once at load, so it keeps its own)
const bhSS=t=>t*t*(3-2*t),bhC=(v,a,b)=>Math.max(a,Math.min(b,v));
// the parts from the state (hvPose calls it, before the matrices update): arms, buckets, seat, wheels, the hoe, and the
// outriggers: down, they reach the ground under each pad and lift the back of the machine level on them
function bhParts(h){const P=h.parts;if(!P)return;const g=h.g;
  const e=BH_LA0-h.a;P.arm.rotation.x=e;P.bucket.rotation.x=-e-h.c;P.seat.rotation.y=Math.PI*h.seat;
  P.swing.rotation.y=h.sw;P.boom.rotation.x=h.hb;P.stick.rotation.x=h.hs;P.hoe.rotation.x=-h.hk;
  for(const n of ['wFL','wFR'])P[n].rotation.set(h.spin/BH_WF[1],-h.steer,0);for(const n of ['wRL','wRR'])P[n].rotation.x=h.spin/BH_WR[1];
  const lev=bhSS(bhC((h.out-0.55)/0.45,0,1)),rise=0.14*lev;
  g.position.y+=rise/2;g.rotation.x+=rise/2.2;g.rotation.z*=1-lev;
  const rx=g.rotation.x,rz=g.rotation.z,sy=Math.sin(h.yaw),cy=Math.cos(h.yaw),down=bhSS(bhC(h.out/0.55,0,1));
  for(const s of [-1,1]){const n=s<0?'L':'R',lx=s*(BH_LEG[0]+0.65),lz=BH_LEG[2];
    const py=g.position.y+BH_LEG[1]*Math.cos(rx)-lz*Math.sin(rx)+s*BH_LEG[0]*Math.sin(rz),gy=surfAt(h.x+lx*cy+lz*sy,h.z-lx*sy+lz*cy);
    const td=Math.acos(bhC((py-gy-0.15)/BH_LL,-1,1)),t=BH_UP+(td-BH_UP)*down;
    P['leg'+n].rotation.z=s*t;P['pad'+n].rotation.z=-s*t}}
// a load object (the machine itself for the loader bucket, h.hl for the hoe's) takes what was dug at p
function bhTake(L,got,p){const f=got/(L.load+got);for(let q=0;q<3;q++)L.loadC[q]+=(digC[q]-L.loadC[q])*f;for(let q=0;q<4;q++)L.loadMix[q]+=(digMix[q]-L.loadMix[q])*f;
  L.loadWet+=(mudAt(p.x,p.z)-L.loadWet)*f;L.load+=got;st.dirty=true;st.slumpT=2.5}
// what pours off a bucket at p goes into the truck bed under it (what does not fit spills) or onto the dig site
function bhDrop(L,p,out){if(inBed(p)&&tr.load<TU.trCap){const take=Math.min(out,TU.trCap-tr.load),ff=take/(tr.load+take||1);
    for(let q=0;q<3;q++)tr.loadC[q]+=(L.loadC[q]-tr.loadC[q])*ff;for(let q=0;q<4;q++)tr.loadMix[q]+=(L.loadMix[q]-tr.loadMix[q])*ff;tr.loadWet+=(L.loadWet-tr.loadWet)*ff;tr.load+=take;out-=take;
    if(!tr.loadedOnce){tr.loadedOnce=true;toast(say('truckFirst'),'good')}}
  if(out>0&&inDig(p.x,p.z,1)){deposit(p.x,p.z,out,L.loadC,L.loadMix,dropSpread(p.y-hAt(p.x,p.z)),L.loadWet);st.dirty=true;st.slumpT=2.5}}
// every frame for the backhoe you are in: at the hoe the sticks are its (swing, stick, boom, curl) and it stays put;
// at the wheel it drives, unless the outriggers are down or the seat is still turning
function bhTick(h,dt,drive,turn,arm,curl){
  if(h.hoe){h.hin=[turn,drive,arm,curl];hvDrive(h,dt,0,0,0,0,true);return}
  h.hin=null;if(drive&&(h.out>0.02||h.seat>0.02)){const t=performance.now();if(h.out>0.02&&t-(h.told||0)>4000){h.told=t;toast(say('bhOutDown'),'',3000)}drive=0}
  hvDrive(h,dt,drive,turn,arm,curl,true)}
// the work (hvDrive calls it once the machine sits on its wheels): seat, outriggers, loader, hoe, digging and dumping
function bhWork(h,dt,arm,curl,on){const P=h.parts,mv=(v,t,s)=>v<t?Math.min(t,v+s):Math.max(t,v-s);
  h.seat=mv(h.seat,h.hoe?1:0,dt/TU.bhSeatT);const o0=h.out;h.out=mv(h.out,h.outT,dt/TU.bhOutT);h.spin+=h.v*dt;
  const la=h.hoe?0:arm,lc=h.hoe?0:curl,cap=TU.bhLdCap,full=1-0.15*h.load/cap;
  h.a=clamp(h.a+la*TU.bhLdArm*dt*full,...BH_ALIM);h.c=clamp(h.c+lc*TU.bhLdCurl*dt,...BH_CLIM);
  const I=h.hin&&h.seat>0.97?h.hin:[0,0,0,0],r=h.hres;
  h.sw=clamp(h.sw-I[0]*TU.bhSwing*dt*r,...BH_LIM.sw);h.hs=clamp(h.hs+I[1]*TU.bhStick*dt*r,...BH_LIM.hs);
  h.hb=clamp(h.hb+I[2]*TU.bhBoom*dt*r,...BH_LIM.hb);h.hk=clamp(h.hk+I[3]*TU.bhBucket*dt*r,...BH_LIM.hk);
  h.hyd=Math.min(1,Math.abs(la)+Math.abs(lc)+Math.abs(I[0])+Math.abs(I[1])+Math.abs(I[2])+Math.abs(I[3])+(h.out!==o0?0.5:0));
  // the views: at the hoe the chase camera comes round to the front and looks back over the cab, and in the cab you
  // look back and down at the bucket
  h.camO=Math.PI*h.seat;h.camF=1-4*h.seat;{const a=Math.PI*h.seat,E=h.K.eye;
    h.eye[0]=0.13*Math.sin(a);h.eye[1]=E[1];h.eye[2]=-0.75+0.13*Math.cos(a);h.eye[3]=5*Math.sin(a);h.eye[4]=-0.6-0.5*h.seat;h.eye[5]=5*Math.cos(a)}
  hvPose(h);
  // the loader: it scoops with the cutting edge under the ground on the dig site and the bucket near level, and pours
  // off the lip once it is tipped past about 20 degrees
  const B=P.bucket;B.localToWorld(bhT.set(0,-0.43,0.86));B.localToWorld(bhL.set(-0.8,-0.43,0.8));B.localToWorld(bhR.set(0.8,-0.43,0.8));B.localToWorld(bhM.set(0,-0.3,0.95));
  bhM.x+=Math.sin(h.yaw)*0.4;bhM.z+=Math.cos(h.yaw)*0.4;
  if(on&&!h.hoe&&h.c>-0.3&&h.load<cap-0.002&&bhT.y<hAt(bhT.x,bhT.z)-0.03&&inDig(bhT.x,bhT.z,1)){
    let got=dig(bhL,(cap-h.load)/2);got+=dig(bhR,cap-h.load-got);
    if(got>0){bhTake(h,got,bhT);if(h.load>=cap-0.003)toast(say('loaderFull'),'',2400)}}
  {const f=clamp((-0.35-h.c)/0.45,0,1);if(f>0&&h.load>0.0005){const out=Math.min(h.load,f*(0.4+h.load*1.5)*dt);h.load-=out;bhDrop(h,bhM,out);for(let n=0;n<Math.ceil(out*50);n++)spawn(bhM,0.8)}}
  h.heap.visible=h.load>0.01;if(h.heap.visible){const s=0.35+0.65*Math.sqrt(h.load/cap);h.heap.scale.set(2.0*s,0.6*s,0.8+0.25*s);tintLoad(h.heap.material,h.loadC)}
  // the hoe: its teeth under the ground on the dig site bite as the excavator's do (hard ground slows the hydraulics),
  // and it pours once its mouth turns down
  const L=h.hl,hc=TU.bhCap,K=P.hoe;K.localToWorld(bhT.set(...BH_TIP));K.localToWorld(bhM.set(...BH_MID));K.getWorldQuaternion(bhQ);
  const up=bhLoc.set(0,0.26,0.97).applyQuaternion(bhQ).y,below=bhT.y<hAt(bhT.x,bhT.z)&&!blkHit(bhT.x,bhT.y,bhT.z)&&inDig(bhT.x,bhT.z,0.5);h.hres=1;
  if(below){const k=Math.round(gJ(bhT.z))*V+Math.round(gI(bhT.x));h.hres=soilRes(k,bhT.y)*(L.load>=hc-0.002?0.5:1);
    if(on&&h.hoe&&L.load<hc-0.002&&up>-0.3){const got=dig(bhT,hc-L.load);if(got>0){bhTake(L,got,bhT);statDug(got);if(Math.random()<0.5)spawn(bhT,1.0);
      if(L.load>=hc-0.003)toast(say('bhFull'),'',2600)}}}
  {const f=clamp((0.1-up)/0.45,0,1);if(f>0&&L.load>0.0005){const out=Math.min(L.load,f*(0.35+L.load*1.6)*TU.exPour*dt);L.load-=out;bhDrop(L,bhM,out);
    for(let n=0;n<Math.ceil(out*80);n++)spawn(bhM,0.6)}}
  h.hheap.visible=L.load>0.005;if(h.hheap.visible){const s=0.35+0.65*Math.sqrt(L.load/hc);h.hheap.scale.set(0.55*s,0.45*s,0.6*s);tintLoad(h.hheap.material,L.loadC)}}
// Drive / Dig (Enter, or the switch over the right stick): swivel the seat to the hoe (the outriggers come down) or
// back to the wheel (they come up)
function bhSwap(){const h=hvCur();if(!h||!h.K.hoe)return;h.hoe=!h.hoe;h.outT=h.hoe?1:0;toast(say(h.hoe?'bhHoe':'bhRoad'),'',3600);bhSwitch();setCaps()}
function bhOut(){const h=hvCur();if(mode!=='heavy'||!h||!h.K.hoe)return;h.outT=h.outT?0:1;toast(say(h.outT?'bhOutDn':'bhOutUp'),'',1800)}
function bhSwitch(){const h=hvCur();if(!h||!h.K.hoe)return;$('#exDrive').setAttribute('aria-pressed',!h.hoe);$('#exDig').setAttribute('aria-pressed',h.hoe)}
// saved with the rigs (save.js): the hoe, outriggers, seat, loader and both loads
const bhR4=v=>+(+v).toFixed(4);
function bhSave(){return hvs.filter(h=>h.K.hoe).map(h=>({p:[h.sw,h.hb,h.hs,h.hk,h.outT,h.hoe?1:0,h.a,h.c].map(bhR4),l:[h.load,h.hl.load].map(bhR4),
  c:[h.loadC,h.hl.loadC].map(c=>c.map(bhR4)),m:[h.loadMix,h.hl.loadMix].map(c=>c.map(bhR4)),w:[h.loadWet,h.hl.loadWet].map(bhR4)}))}
function bhLoad(d){if(!Array.isArray(d))return;hvs.filter(h=>h.K.hoe).forEach((h,i)=>{const s=d[i];if(!s||!Array.isArray(s.p)||s.p.length<8||!s.p.every(isFinite))return;const p=s.p;
  Object.assign(h,{sw:clamp(p[0],...BH_LIM.sw),hb:clamp(p[1],...BH_LIM.hb),hs:clamp(p[2],...BH_LIM.hs),hk:clamp(p[3],...BH_LIM.hk),outT:p[4]?1:0,out:p[4]?1:0,hoe:!!p[5],seat:p[5]?1:0,a:clamp(p[6],...BH_ALIM),c:clamp(p[7],...BH_CLIM)});
  const ok=(a,n)=>Array.isArray(a)&&a.length===n&&a.every(isFinite);
  [h,h.hl].forEach((L,j)=>{if(s.l&&isFinite(s.l[j]))L.load=Math.max(0,s.l[j]);if(s.c&&ok(s.c[j],3))L.loadC=s.c[j].slice();if(s.m&&ok(s.m[j],4))L.loadMix=s.m[j].slice();if(s.w&&isFinite(s.w[j]))L.loadWet=s.w[j]});
  hvGround(h,1);hvPose(h)})}
function bhSig(){return hvs.reduce((a,h)=>h.K.hoe?a+h.sw+h.hb*3+h.hs*5+h.hk*7+h.outT*11+(h.hoe?13:0)+h.hl.load*17+h.load*19:a,0)}
// Corley's, at the end of his row on the east lawn; the walker climbs in as he does the others (walker.js WK_RIDES)
{const h=hvMake('backhoe',{x:46,z:-2,yaw:-Math.PI/2,island:'corley'}),i=hvs.indexOf(h);bhBuild(h);bhReset(h);
  WK_RIDES['hv'+i]={o:h,c:h.K.C,r:h.K.R,m:'heavy',n:h.K.n,pick(){hvI=i}};hvReset(h)}
