// Corley's Island: walk mode: a site worker on foot who walks, jogs, sprints, jumps, climbs onto blocks, sets blocks by hand
// and climbs into and out of the excavator, dump truck and mower (WK_RIDES; save.js keeps which one he is in).
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.
// ---------- worker ----------
// about 5 ft 10 in: hard hat, hi-vis vest over a grey shirt, jeans and work boots. Arms and legs swing from the
// shoulders and hips; knees bend on the back swing and tuck in the air
const WK_H=1.78,WK_R=0.28,WK_STEP=0.2,WK_JUMP=6.2,WK_RUN=2.8,WK_SPRINT=5.6,WK_REACH=2.3;
const WK_SKIN=M(0xc68a62),WK_VEST=M(0xd8f02a,{emissive:0x1d2400}),WK_SHIRT=M(0x6d7378),WK_JEAN=M(0x34507a),WK_BOOT=M(0x4a3020),WK_HAT=M(0xf5c518,{shininess:40}),WK_STRIPE=M(0xd8dcd6,{emissive:0x2a2a2a});
const walker=new THREE.Group();scene.add(walker);
const wkBody=new THREE.Group();walker.add(wkBody);
box(0.36,0.5,0.22,WK_SHIRT,0,1.17,0,wkBody);box(0.38,0.42,0.24,WK_VEST,0,1.2,0,wkBody);
for(const y of [1.08,1.24])box(0.385,0.035,0.245,WK_STRIPE,0,y,0,wkBody);
box(0.36,0.14,0.21,WK_JEAN,0,0.88,0,wkBody);box(0.37,0.035,0.22,WK_BOOT,0,0.94,0,wkBody);
box(0.1,0.08,0.1,WK_SKIN,0,1.46,0,wkBody);
const wkHead=new THREE.Group();wkHead.position.y=1.5;wkBody.add(wkHead);
box(0.2,0.22,0.21,WK_SKIN,0,0.11,0,wkHead);box(0.21,0.05,0.12,M(0x3b2a1e),0,0.2,-0.05,wkHead);
for(const x of [-0.05,0.05])box(0.03,0.03,0.01,M(0x1c1c1c),x,0.13,0.106,wkHead);
const hat=new THREE.Mesh(new THREE.SphereGeometry(0.14,10,5,0,Math.PI*2,0,Math.PI/2),WK_HAT);hat.scale.set(1,0.85,1.1);hat.position.y=0.2;hat.castShadow=true;wkHead.add(hat);
box(0.3,0.02,0.34,WK_HAT,0,0.205,0.02,wkHead);
mergeStatic(wkHead,[]);
// a limb: upper part from the joint, a lower part that bends at the knee or elbow, and a boot or hand
function wkLimb(x,y,w,l1,l2,m1,m2,endM,endS,parent){const top=new THREE.Group();top.position.set(x,y,0);parent.add(top);
  box(w,l1,w,m1,0,-l1/2,0,top);const low=new THREE.Group();low.position.y=-l1;top.add(low);
  box(w*0.92,l2,w*0.92,m2,0,-l2/2,0,low);box(endS[0],endS[1],endS[2],endM,0,-l2-endS[1]/2+0.01,endS[2]/2-w/2,low);
  mergeStatic(top,[low]);mergeStatic(low,[]);return {top,low}}
const wkLegs=[-0.09,0.09].map(x=>wkLimb(x,0.86,0.15,0.42,0.38,WK_JEAN,WK_JEAN,WK_BOOT,[0.15,0.08,0.27],walker));
const wkArms=[-0.23,0.23].map(x=>wkLimb(x,1.4,0.1,0.3,0.27,WK_VEST,WK_SHIRT,WK_SKIN,[0.09,0.1,0.09],wkBody));
mergeStatic(wkBody,[wkHead,...wkArms.map(a=>a.top)]);
walker.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true}});
// a jump clears about 6 ft: onto a 3 ft block with room to spare, or two blocks up a stack
// starts beside the excavator, facing the trench
const WK_START={x:2.7,z:1.6,yaw:Math.PI};
const wk={x:0,z:0,y:0,vy:0,yaw:0,view:0,ground:true,phase:0,spd:0,airT:0,jumpQ:0,landT:0,inside:null,sprint:false,stillT:0};
function walkReset(){Object.assign(wk,WK_START,{vy:0,ground:true,phase:0,spd:0,airT:0,jumpQ:0,landT:0,view:WK_START.yaw,inside:null});wk.y=wkFloor(wk.x,wk.z,0,1e9)}
// the highest ground or block top under the feet that is no higher than a step above y: a 5 point foot
function wkFloor(x,z,y,lim){let f=-1e9;const r=WK_R*0.7;
  for(const [dx,dz] of [[0,0],[r,0],[-r,0],[0,r],[0,-r]]){const px=x+dx,pz=z+dz;let h=hAt(px,pz);
    for(const b of blocks){const s=b.s/2;if(Math.abs(px-b.x)<=s&&Math.abs(pz-b.z)<=s){const t=b.y+b.s;if(t<=lim&&t>h)h=t}}
    if(h>f)f=h}
  return f}
// blocks are walls from a step above the feet to the top of the head; push the body out of them
function wkPushBlocks(){let bump=false;
  for(const s of SOLIDS){const dx=wk.x-s.x,dz=wk.z-s.z,nx=dx-clamp(dx,-s.hx,s.hx),nz=dz-clamp(dz,-s.hz,s.hz),d=Math.hypot(nx,nz);
    if(d>=WK_R)continue;if(d>1e-4){wk.x+=nx/d*(WK_R-d);wk.z+=nz/d*(WK_R-d)}else if(s.hx-Math.abs(dx)<s.hz-Math.abs(dz))wk.x=s.x+Math.sign(dx||1)*(s.hx+WK_R);else wk.z=s.z+Math.sign(dz||1)*(s.hz+WK_R)}
  for(const b of blocks){if(b.y+b.s<=wk.y+WK_STEP||b.y>=wk.y+WK_H)continue;const h=b.s/2,dx=wk.x-b.x,dz=wk.z-b.z;
    const nx=dx-clamp(dx,-h,h),nz=dz-clamp(dz,-h,h),d=Math.hypot(nx,nz);
    if(d>=WK_R)continue;bump=true;
    if(d>1e-4){wk.x+=nx/d*(WK_R-d);wk.z+=nz/d*(WK_R-d)}
    else{const px=h+WK_R-Math.abs(dx),pz=h+WK_R-Math.abs(dz);if(px<pz)wk.x+=Math.sign(dx||1)*px;else wk.z+=Math.sign(dz||1)*pz}}
  return bump}
// the machines are solid too (a row of circles each, as for blocks)
function wkPushRound(o,lzs,r){for(const lz of lzs){const cx=o.x+Math.sin(o.yaw)*lz,cz=o.z+Math.cos(o.yaw)*lz,dx=wk.x-cx,dz=wk.z-cz,d=Math.hypot(dx,dz),m=r+WK_R;
  if(d<m&&d>1e-4){wk.x+=dx/d*(m-d);wk.z+=dz/d*(m-d)}}}
// mx, mz: move input (stick right, stick up); lookX, lookY: right stick. Sprint (Shift, controller left stick click) doubles
// the jog to about 12 mph
function updateWalker(dt,mx,mz,lookX,lookY){
  // in a cab he rides along out of sight
  if(wk.inside){walker.visible=false;return}
  const on=mode==='walk'&&!bench.on;
  if(on){wk.view-=lookX*2.2*dt;orbitPitch=clamp(orbitPitch-lookY*1.2*dt,0.08,1.3)}
  // moves relative to where the camera looks; the worker turns to face the way he walks
  let vx=0,vz=0;
  if(on){const cyaw=camMode==='cab'?wk.view:wk.view+orbitYaw,fx=Math.sin(cyaw),fz=Math.cos(cyaw),m=Math.min(1,Math.hypot(mx,mz));
    const top=held('sprint')||PA.sprint||wk.sprint?WK_SPRINT:WK_RUN;
    // the touch Sprint button stays on while you keep moving and switches itself off once you stop
    wk.stillT=m>0.02?0:wk.stillT+dt;if(wk.sprint&&wk.stillT>0.6)setSprint(false);
    if(m>0.02){vx=(fx*mz-fz*mx)*top;vz=(fz*mz+fx*mx)*top;
      if(camMode!=='cab'){let a=Math.atan2(vx,vz)-wk.yaw;a=Math.atan2(Math.sin(a),Math.cos(a));wk.yaw+=a*Math.min(1,dt*12)}}
    if(camMode==='cab')wk.yaw=wk.view}
  const sp=Math.hypot(vx,vz);wk.spd+=(sp-wk.spd)*Math.min(1,dt*10);
  // steep ground (a trench wall) stops you on foot; jump to get up it
  const ox=wk.x,oz=wk.z,g0=hAt(ox,oz);wk.x+=vx*dt;wk.z+=vz*dt;
  {const g1=hAt(wk.x,wk.z),run=Math.hypot(wk.x-ox,wk.z-oz);if(run>1e-5&&g1>wk.y+0.02&&(g1-g0)/run>1.3){wk.x=ox;wk.z=oz}}
  [wk.x,wk.z]=landClamp(wk.x,wk.z,1.2,0.45);
  wkPushBlocks();wkPushRound(st,EX_C,EX_R);wkPushRound(tr,TR_C,TR_R);wkPushRound(mw,MW_C,MW_R);
  // jump, gravity, landing on the ground or a block; bump your head on a block above
  wk.jumpQ-=dt;
  if(wk.jumpQ>0&&wk.ground){wk.vy=WK_JUMP;wk.ground=false;wk.jumpQ=0}
  const floor=wkFloor(wk.x,wk.z,wk.y,wk.y+WK_STEP);
  if(wk.ground){if(floor<wk.y-0.12){wk.ground=false;wk.vy=0}else wk.y+=(floor-wk.y)*Math.min(1,dt*20)}
  if(!wk.ground){wk.vy-=9.8*dt;const ny=wk.y+wk.vy*dt;
    if(wk.vy>0)for(const b of blocks){const h=b.s/2+WK_R*0.6;if(Math.abs(wk.x-b.x)<h&&Math.abs(wk.z-b.z)<h&&b.y>=wk.y+WK_H-0.05&&b.y<ny+WK_H){wk.vy=0;break}}
    wk.y+=wk.vy*dt;wk.airT+=dt;
    const f2=wkFloor(wk.x,wk.z,wk.y,wk.y+WK_STEP);
    if(wk.y<=f2&&wk.vy<=0){if(wk.vy<-8){shake=reduceMotion?0:0.1}wk.y=f2;wk.vy=0;wk.ground=true;wk.landT=0.18;wk.airT=0}}
  wk.landT=Math.max(0,wk.landT-dt);
  // pose: a walk cycle that lengthens into a jog, arms counter-swinging; legs tuck in the air, a dip on landing
  // sprinting quickens the stride, swings the limbs wider and leans him further forward
  const run=Math.min(1,wk.spd/WK_RUN),fast=clamp((wk.spd-WK_RUN)/(WK_SPRINT-WK_RUN),0,1);if(wk.ground)wk.phase+=dt*(4+6*run+4*fast)*Math.min(1,wk.spd*2);
  const sw=Math.sin(wk.phase)*(0.25+0.55*run+0.25*fast)*Math.min(1,wk.spd*1.5);
  for(let s=0;s<2;s++){const a=s?sw:-sw,L=wkLegs[s],A=wkArms[s];
    if(wk.ground){L.top.rotation.x=a;L.low.rotation.x=Math.max(0,-a)*1.3+0.05;A.top.rotation.x=-a*0.9;A.low.rotation.x=-0.25-run*0.6}
    else{const t=Math.min(1,wk.airT*4);L.top.rotation.x=-0.7*t+(s?0.25:-0.1)*t;L.low.rotation.x=1.2*t;A.top.rotation.x=-2.2*t*(s?1:0.85);A.low.rotation.x=-0.3}}
  const bob=wk.ground?Math.abs(Math.cos(wk.phase))*0.04*run-wk.landT*0.5:0;
  wkBody.position.y=bob;wkBody.rotation.x=0.12*run+0.14*fast;wkHead.rotation.x=-0.1*run;
  walker.position.set(wk.x,wk.y,wk.z);walker.rotation.y=wk.yaw;
  walker.visible=!(on&&camMode==='cab')}
function walkJump(){if(mode!=='walk')return;wk.jumpQ=0.15;started()}
$('#jumpBtn').addEventListener('pointerdown',e=>{e.preventDefault();walkJump()});
function setSprint(on){wk.sprint=on;wk.stillT=0;$('#sprintBtn').setAttribute('aria-pressed',on)}
$('#sprintBtn').addEventListener('pointerdown',e=>{e.preventDefault();setSprint(!wk.sprint);started()});
// ---------- getting in and out ----------
// each machine: its state (looked up when used: the excavator's is made in controls.js), the circles that make up its
// body, the mode that drives it and what to call it
const WK_RIDES={ex:{get o(){return st},c:EX_C,r:EX_R,m:'dig',n:'excavator'},truck:{get o(){return tr},c:TR_C,r:TR_R,m:'truck',n:'dump truck'},mow:{get o(){return mw},c:MW_C,r:MW_R,m:'mow',n:'mower'}};
const rideOf=m=>m==='dig'||m==='drive'?'ex':m==='truck'?'truck':m==='mow'?'mow':null;
// the machine within an arm's length of the worker, nearest first
function wkNear(){let best=null,bd=1.3;
  for(const k in WK_RIDES){const R=WK_RIDES[k];
    for(const lz of R.c){const d=Math.hypot(wk.x-R.o.x-Math.sin(R.o.yaw)*lz,wk.z-R.o.z-Math.cos(R.o.yaw)*lz)-R.r-WK_R;if(d<bd){bd=d;best=k}}}
  return best}
// climbing out: the first clear spot beside the machine (driver's side, then the other side, then front and back)
function wkPlaceOut(k){const R=WK_RIDES[k],o=R.o,sy=Math.sin(o.yaw),cy=Math.cos(o.yaw),gap=R.r+WK_R+0.3,len=Math.max(...R.c.map(Math.abs));
  const spots=[[gap,0],[-gap,0],[gap,R.c[0]],[-gap,R.c[0]],[0,len+gap],[0,-len-gap]];
  for(const [sx,sz] of spots){const x=o.x+cy*sx+sy*sz,z=o.z-sy*sx+cy*sz;
    if(!landIn(x,z,1.5,0.45)||SOLIDS.some(s=>Math.abs(x-s.x)<s.hx+WK_R&&Math.abs(z-s.z)<s.hz+WK_R))continue;const f=wkFloor(x,z,0,1e9);
    if(blocks.some(b=>Math.abs(x-b.x)<b.s/2+WK_R&&Math.abs(z-b.z)<b.s/2+WK_R&&b.y<f+WK_H&&b.y+b.s>f+WK_STEP))continue;
    let clear=true;for(const j in WK_RIDES){if(j===k)continue;const Q=WK_RIDES[j];
      for(const lz of Q.c)if(Math.hypot(x-Q.o.x-Math.sin(Q.o.yaw)*lz,z-Q.o.z-Math.cos(Q.o.yaw)*lz)<Q.r+WK_R+0.1)clear=false}
    if(!clear)continue;
    Object.assign(wk,{x,z,y:f,vy:0,ground:true,yaw:o.yaw+(k==='ex'?st.swing:0),airT:0});return true}
  return false}
// F (or Get in / Get out, or controller B): on foot it climbs into the machine at hand; driving, it climbs out
function seatToggle(){
  if(mode==='walk'){const k=wkNear();
    if(!k){toast('Walk up to the excavator, the truck or the mower to get in.');return}
    wk.inside=k;walker.visible=false;setMode(WK_RIDES[k].m);toast(`In the ${WK_RIDES[k].n}. ${kbUsed?keyLabel('enter'):padUsed?'B':'Get out'} to climb out.`,'',2600);return}
  const k=rideOf(mode);if(!k)return;
  if(!wkPlaceOut(k)){toast('No room to climb out here. Move the machine a little.');return}
  wk.inside=null;setMode('walk')}
$('#seatBtn').onclick=seatToggle;
