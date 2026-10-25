// Corley's Island: walk mode: a site worker on foot who walks, jogs, sprints, jumps, climbs onto blocks, sets blocks by hand
// and climbs into and out of the excavator, dump truck and mower (WK_RIDES; save.js keeps which one he is in).
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.
// ---------- worker ----------
// about 5 ft 10 in: hard hat, hi-vis vest over a grey shirt, jeans and work boots, in simple shapes whose joints carry
// every pose (the detailed model below follows them). Arms and legs swing from the shoulders and hips; knees bend on the
// back swing and tuck in the air
const WK_H=1.78,WK_R=0.28,WK_STEP=0.2;
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
// the detailed worker (models/worker.glb, made by tools/build_worker.py from MakeHuman's CC0 assets): a skinned man in a
// weathered skin with stubble, a T-shirt, jeans and work boots, a hi-vis vest and a hard hat. It loads once at start and
// takes the place of the shapes above, which stay hidden underneath as the fallback. Its bones follow the shapes' joints
// every frame (wkMdlPose), so every pose the game sets (walking, running, jumping, swimming, riding) moves it the same way.
// Each joint turns about the body's own axes from where it stands in the file, after the arms are brought down from the
// file's A pose to hang at his sides
const wkMdl={g:null,loading:false,j:null};
function wkMdlLoad(){if(wkMdl.g||wkMdl.loading)return;wkMdl.loading=true;
  mdlLoaderReady(()=>new THREE.GLTFLoader().load('models/worker.glb',gl=>{wkMdl.loading=false;wkMdlSetup(gl.scene)},undefined,()=>{wkMdl.loading=false}))}
function wkMdlSetup(g){g.updateMatrixWorld(true);const bones={},inv=new THREE.Matrix4().copy(g.matrixWorld).invert(),q=new THREE.Quaternion(),s=new THREE.Vector3(),p=new THREE.Vector3();
  g.traverse(o=>{if(o.isBone)bones[o.name]=o;
    if(o.isMesh){o.castShadow=o.receiveShadow=true;o.frustumCulled=false;const m=o.material;m.envMap=skyEnv;
      if(/high-poly/.test(m.name)){m.roughness=0.08;m.userData.noWet=true}
      else if(/body/.test(m.name))m.roughness=0.62;
      else if(m.name==='vest'){m.roughness=0.8;m.emissiveMap=m.map;m.emissive.setRGB(0.1,0.1,0.1)}
      else if(m.name==='hat'){m.roughness=0.3;m.metalness=0}
      else m.roughness=Math.max(m.roughness,0.75);
      if(m.alphaTest)m.alphaToCoverage=true;wetPatch(m)}});
  // each bone's parent's turn in the body's frame at rest, to carry a turn about the body's axes into the bone's own frame
  const rest=b=>{inv.clone().multiply(b.matrixWorld).decompose(p,q,s);return q.clone()};
  const X=new THREE.Vector3(1,0,0),j=(n,droop,pre)=>{const b=bones[n];if(!b)return null;return {b,q0:b.quaternion.clone(),pq:rest(b.parent),droop:droop||null,pre:pre||null}};
  // the arms hang about 8° out from his sides
  const drop=(n,c,side)=>{const a=inv.clone().multiply(bones[n].matrixWorld),b=inv.clone().multiply(bones[c].matrixWorld),d=new THREE.Vector3().setFromMatrixPosition(b).sub(new THREE.Vector3().setFromMatrixPosition(a)).normalize();
    return new THREE.Quaternion().setFromUnitVectors(d,new THREE.Vector3(side*0.14,-1,0.02).normalize())};
  const dl=drop('upperarm_l','lowerarm_l',Math.sign(new THREE.Vector3().setFromMatrixPosition(bones.upperarm_l.matrixWorld).x)),dr=drop('upperarm_r','lowerarm_r',Math.sign(new THREE.Vector3().setFromMatrixPosition(bones.upperarm_r.matrixWorld).x));
  const dl2=drop('lowerarm_l','hand_l',Math.sign(new THREE.Vector3().setFromMatrixPosition(bones.upperarm_l.matrixWorld).x)),dr2=drop('lowerarm_r','hand_r',Math.sign(new THREE.Vector3().setFromMatrixPosition(bones.upperarm_r.matrixWorld).x));
  // the left side is the one at +x: the shapes' first leg and arm are at -x
  const L=new THREE.Vector3().setFromMatrixPosition(bones.thigh_l.matrixWorld).x>0?1:0;
  wkMdl.j={sp:['spine_01','spine_02','spine_03'].map(n=>j(n)),neck:j('neck_01'),head:j('head'),
    legs:[0,1].map(s=>{const k=(s===L)?'l':'r';return {top:j('thigh_'+k),low:j('calf_'+k)}}),
    arms:[0,1].map(s=>{const k=(s===L)?'l':'r';return {top:j('upperarm_'+k,k==='l'?dl:dr),low:j('lowerarm_'+k,k==='l'?dl2:dr2,(k==='l'?dl:dr).clone().invert())}}),
    fingers:Object.keys(bones).filter(n=>/^(index|middle|ring|pinky)_0[123]_/.test(n)).map(n=>j(n)),X};
  // the hand's curl rests in the file's frame; his fingers curl in a little, as they do when the hand is relaxed
  for(const f of wkMdl.j.fingers)f.b.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(X,0.35));
  wkMdl.g=g;walker.add(g);wkBody.visible=false;for(const l of wkLegs)l.top.visible=false;wkMdlPose()}
// turns joint J by angle a about the body's x axis (forward and back), after its droop; a forearm first undoes its
// upper arm's droop, so the elbow bends about the body's x axis too
const wkMQ=new THREE.Quaternion(),wkMQ2=new THREE.Quaternion();
function wkMdlTurn(J,a){if(!J)return;wkMQ.setFromAxisAngle(wkMdl.j.X,a);if(J.droop)wkMQ.multiply(J.droop);if(J.pre)wkMQ.premultiply(J.pre);
  wkMQ2.copy(J.pq).invert().multiply(wkMQ).multiply(J.pq);J.b.quaternion.copy(wkMQ2).multiply(J.q0)}
function wkMdlPose(){const J=wkMdl.j;if(!J||!walker.visible)return;
  const lean=wkBody.rotation.x;for(const s of J.sp)wkMdlTurn(s,lean/3);
  wkMdl.g.position.y=Math.max(0,wkBody.position.y)*0.5;
  wkMdlTurn(J.neck,wkHead.rotation.x*0.4);wkMdlTurn(J.head,wkHead.rotation.x*0.6);
  for(let s=0;s<2;s++){wkMdlTurn(J.legs[s].top,wkLegs[s].top.rotation.x);wkMdlTurn(J.legs[s].low,wkLegs[s].low.rotation.x);
    wkMdlTurn(J.arms[s].top,wkArms[s].top.rotation.x);wkMdlTurn(J.arms[s].low,wkArms[s].low.rotation.x)}}
wkMdlLoad();
// a jump clears about 6 ft: onto a 3 ft block with room to spare, or two blocks up a stack
// starts beside the excavator, facing the trench
const WK_START={x:2.7,z:1.6,yaw:Math.PI};
const wk={x:0,z:0,y:0,vy:0,yaw:0,view:0,ground:true,phase:0,spd:0,airT:0,jumpQ:0,landT:0,inside:null,sprint:false,stillT:0,swim:false};
function walkReset(){Object.assign(wk,WK_START,{vy:0,ground:true,swim:false,phase:0,spd:0,airT:0,jumpQ:0,landT:0,view:WK_START.yaw,inside:null});wk.y=wkFloor(wk.x,wk.z,0,1e9)}
// the ground at x,z, or the ground under a bridge deck that is more than lim up (swimming under it, or falling past its edge)
function wkGround(x,z,lim){const h=hAt(x,z);if(h<=lim)return h;const d=deckAt(x,z);return d>=h-1e-4?(farGround?farGround(x,z):baseHeight(x,z)):h}
// the highest ground or block top under the feet that is no higher than a step above y: a 5 point foot
function wkFloor(x,z,y,lim){let f=-1e9;const r=WK_R*0.7;
  for(const [dx,dz] of [[0,0],[r,0],[-r,0],[0,r],[0,-r]]){const px=x+dx,pz=z+dz;let h=wkGround(px,pz,lim);
    for(const b of blocks)if(Math.abs(px-b.x)<=b.w/2&&Math.abs(pz-b.z)<=b.d/2){const t=b.y+b.h;if(t<=lim&&t>h)h=t}
    if(h>f)f=h}
  return f}
// blocks are walls from a step above the feet to the top of the head; push the body out of them
function wkPushBlocks(){let bump=false;
  for(const s of SOLIDS){const p=solidOut(s,wk.x,wk.z,WK_R);if(p){wk.x+=p[0];wk.z+=p[1]}}
  for(const b of blocks){if(b.y+b.h<=wk.y+WK_STEP||b.y>=wk.y+WK_H)continue;const hx=b.w/2,hz=b.d/2,dx=wk.x-b.x,dz=wk.z-b.z;
    const nx=dx-clamp(dx,-hx,hx),nz=dz-clamp(dz,-hz,hz),d=Math.hypot(nx,nz);
    if(d>=WK_R)continue;bump=true;
    if(d>1e-4){wk.x+=nx/d*(WK_R-d);wk.z+=nz/d*(WK_R-d)}
    else{const px=hx+WK_R-Math.abs(dx),pz=hz+WK_R-Math.abs(dz);if(px<pz)wk.x+=Math.sign(dx||1)*px;else wk.z+=Math.sign(dz||1)*pz}}
  return bump}
// the machines are solid too (a row of circles each, as for blocks)
// on foot he goes anywhere in the drawn world: the beaches, down into the lake, out along the mainland shores
const WK_BOUND={x:428,z0:-553,z1:763};
// the lake's surface at x,z: the swells the water shader moves it by (scenery.js)
function lakeY(x,z){const t=timeU.value;return WATER+Math.sin(x*0.09+t*1.1)*0.16+Math.cos(z*0.11+t*0.8)*0.13+Math.sin((x+z)*0.23+t*1.7)*0.06}
// deeper than WK_FLOAT (about 4.6 ft) he floats, treading water with his head out; shallower he wades, slowed by the water.
// WK_RAIL: how far above a deck the feet must be to clear a bridge railing (a jump does it)
const WK_FLOAT=1.4,WK_RAIL=1.05;
// a splash on the lake: drops thrown up all round (k: how hard) and a ring on the water (mud.js draws both)
function lakeSplash(x,z,k){const y=lakeY(x,z);
  for(let n=Math.round(spN*0.1*k);n>0;n--){const a=Math.random()*6.283,o=(0.5+Math.random()*1.5)*(0.5+0.5*k);spDrop(x+Math.cos(a)*0.2,y+0.03,z+Math.sin(a)*0.2,Math.cos(a)*o,(1+Math.random()*2.5)*(0.5+0.6*k),Math.sin(a)*o,0.03+Math.random()*0.05)}
  spRing(x,y,z,0.6+0.8*k)}
let wkSwimTold=false;
function wkPushRound(o,lzs,r){for(const lz of lzs){const cx=o.x+Math.sin(o.yaw)*lz,cz=o.z+Math.cos(o.yaw)*lz,dx=wk.x-cx,dz=wk.z-cz,d=Math.hypot(dx,dz),m=r+WK_R;
  if(d<m&&d>1e-4){wk.x+=dx/d*(m-d);wk.z+=dz/d*(m-d)}}}
// mx, mz: move input (stick right, stick up); lookX, lookY: right stick. Sprint (Shift, controller left stick click) doubles
// the jog to about 12 mph
function updateWalker(dt,mx,mz,lookX,lookY){
  // in a cab he rides along out of sight
  if(wk.inside){walker.visible=false;return}
  const on=mode==='walk'&&!bench.on;
  if(on){const z=camMode==='cab'?1/fpl.zoom:1;wk.view-=lookX*2.2*TU.wkLook*dt*z;if(camMode==='cab'){fpl.pitch=clamp(fpl.pitch+lookY*1.2*TU.wkLook*dt*z,-FP_DOWN,FP_UP);if(lookX||lookY)fpl.home=false}else orbitPitch=clamp(orbitPitch-lookY*1.2*TU.wkLook*dt,0.08,1.3)}
  // moves relative to where the camera looks; the worker turns to face the way he walks
  let vx=0,vz=0;
  // wading slows him the deeper it gets; swimming has its own speed (Sprint swims harder)
  const wade=wk.swim?0:clamp((WATER-wk.y)/WK_FLOAT,0,1);
  if(on){const cyaw=camMode==='cab'?wk.view:wk.view+orbitYaw,fx=Math.sin(cyaw),fz=Math.cos(cyaw),m=Math.min(1,Math.hypot(mx,mz));
    const fast=held('sprint')||PA.sprint||wk.sprint,top=wk.swim?TU.wkSwim*(fast?1.6:1):(fast?TU.wkSprint:TU.wkRun)*(1-0.55*wade);
    // the touch Sprint button stays on while you keep moving and switches itself off once you stop
    wk.stillT=m>0.02?0:wk.stillT+dt;if(wk.sprint&&wk.stillT>0.6)setSprint(false);
    if(m>0.02){vx=(fx*mz-fz*mx)*top;vz=(fz*mz+fx*mx)*top;
      if(camMode!=='cab'){let a=Math.atan2(vx,vz)-wk.yaw;a=Math.atan2(Math.sin(a),Math.cos(a));wk.yaw+=a*Math.min(1,dt*12)}}
    if(camMode==='cab')wk.yaw=wk.view}
  const sp=Math.hypot(vx,vz);wk.spd+=(sp-wk.spd)*Math.min(1,dt*10);
  // boots tread the grass down partway (scenery.js); not from up on a block or a deck
  if(wk.ground&&sp>0.3&&wk.y-hAt(wk.x,wk.z)<0.2)grassCrush(wk.x,wk.z,Math.atan2(vx,vz),0.16,0.22,1.2+0.25*sp,0.55,dt);
  // steep ground (a trench wall) stops you on foot; jump to get up it. Off the dig he scrambles up the rocky banks
  const ox=wk.x,oz=wk.z,lim=wk.y+WK_STEP,g0=wkGround(ox,oz,lim);wk.x+=vx*dt;wk.z+=vz*dt;
  // too steep to walk up stops you; the edge of a raised floor (a curb, a slab, a stair: raiseAt) is a step up if it is
  // no higher than a step, and a wall if it is, so the slope is the ground's under it
  {const g1=wkGround(wk.x,wk.z,lim),run=Math.hypot(wk.x-ox,wk.z-oz),st=raiseAt(wk.x,wk.z)-raiseAt(ox,oz);
    if(run>1e-5&&g1>wk.y+0.02&&(st>WK_STEP||(g1-g0-st)/run>(inDig(wk.x,wk.z)?1.3:2.5))){wk.x=ox;wk.z=oz}}
  wk.x=clamp(wk.x,-WK_BOUND.x,WK_BOUND.x);wk.z=clamp(wk.z,WK_BOUND.z0,WK_BOUND.z1);
  // a bridge's railings keep him on the deck unless he jumps over them (the covered footbridge's walls always do)
  for(const b of BRIDGES){if(b.dock)continue;const [t0,u0]=deckLocal(b,ox,oz);if(t0<0||t0>b.len||Math.abs(u0)>b.hw-0.4)continue;
    const dy=b.y+(b.y1-b.y)*t0/b.len;if(wk.y<dy-0.3||(!b.foot&&wk.y>dy+WK_RAIL))continue;
    let [t,u]=deckLocal(b,wk.x,wk.z);if(t<0||t>b.len||Math.abs(u)<=b.hw-0.45)continue;
    u=clamp(u,0.45-b.hw,b.hw-0.45);wk.x=b.x0+b.ux*t-b.uz*u;wk.z=b.z0+b.uz*t+b.ux*u}
  // feet splash through puddles
  if(wk.ground&&wk.spd>0.4)splashMud(wk.x,wk.z,Math.atan2(vx,vz),wk.spd,0.12,0.3,dt);
  wkPushBlocks();wkPushRound(st,EX_C,EX_R);wkPushRound(tr,TR_C,TR_R);wkPushRound(mw,MW_C,MW_R);wkPushRound(sk,SK_C,SK_R);hvPush(wk,[0],WK_R);
  // jump, gravity, landing on the ground or a block; bump your head on a block above
  wk.jumpQ-=dt;
  if(wk.jumpQ>0&&wk.ground){wk.vy=Math.sqrt(2*9.8*TU.wkGrav*TU.wkJump);wk.ground=false;wk.jumpQ=0}
  const floor=wkFloor(wk.x,wk.z,wk.y,wk.y+WK_STEP),dep=WATER-floor;
  // into water deeper than he stands in, he floats: a spring holds him at the swells, so a dive off a bridge plunges in and
  // bobs back up; once his feet find the bottom again (a beach, a causeway) he wades out
  if(wk.swim&&dep<WK_FLOAT-0.05){wk.swim=false;wk.ground=true;wk.vy=0}
  if(!wk.swim&&dep>WK_FLOAT+0.05&&wk.y<=lakeY(wk.x,wk.z)-WK_FLOAT+0.05&&(wk.ground||wk.vy<=0)){
    if(wk.vy<-2)lakeSplash(wk.x,wk.z,Math.min(1.5,-wk.vy/7));
    wk.swim=true;wk.ground=false;wk.airT=0;
    if(!wkSwimTold&&mode==='walk'){wkSwimTold=true;toast(say('swimming'),'',3200)}}
  if(wk.swim){const fy=lakeY(wk.x,wk.z)-WK_FLOAT-0.15;wk.vy+=((fy-wk.y)*14-wk.vy*6)*dt;wk.y=Math.max(floor,wk.y+wk.vy*dt);
    if(wk.spd>0.3&&Math.random()<dt*2.5*wk.spd)spRing(wk.x+Math.sin(wk.yaw)*0.3,lakeY(wk.x,wk.z),wk.z+Math.cos(wk.yaw)*0.3,0.5+0.3*wk.spd)}
  else if(wk.ground){if(floor<wk.y-0.12){wk.ground=false;wk.vy=0}else wk.y+=(floor-wk.y)*Math.min(1,dt*20)}
  if(!wk.swim&&!wk.ground){wk.vy-=9.8*TU.wkGrav*dt;const ny=wk.y+wk.vy*dt;
    if(wk.vy>0)for(const b of blocks){if(Math.abs(wk.x-b.x)<b.w/2+WK_R*0.6&&Math.abs(wk.z-b.z)<b.d/2+WK_R*0.6&&b.y>=wk.y+WK_H-0.05&&b.y<ny+WK_H){wk.vy=0;break}}
    wk.y+=wk.vy*dt;wk.airT+=dt;
    const f2=wkFloor(wk.x,wk.z,wk.y,wk.y+WK_STEP);
    if(wk.y<=f2&&wk.vy<=0){if(wk.vy<-8){shake=reduceMotion?0:0.1}wk.y=f2;wk.vy=0;wk.ground=true;wk.landT=0.18;wk.airT=0;splashBurst(wk.x,wk.y,wk.z,1)}}
  wk.landT=Math.max(0,wk.landT-dt);
  // pose: a walk cycle that lengthens into a jog, arms counter-swinging; legs tuck in the air, a dip on landing
  // sprinting quickens the stride, swings the limbs wider and leans him further forward
  // swimming: treading water, legs kicking and arms sweeping, leaning into the stroke as he moves
  if(wk.swim){const mv=Math.min(1,wk.spd/TU.wkSwim);wk.phase+=dt*(3.5+3*mv);const p=wk.phase;
    for(let s=0;s<2;s++){const L=wkLegs[s],A=wkArms[s],k=s?Math.PI:0;L.top.rotation.x=-0.25+Math.sin(p*2+k)*(0.3+0.2*mv);L.low.rotation.x=0.45+Math.sin(p*2+k+1)*0.25;
      A.top.rotation.x=-1.1-mv*0.5+Math.sin(p)*0.6;A.low.rotation.x=-0.5+Math.cos(p)*0.4}
    wkBody.position.y=Math.sin(p*2)*0.02;wkBody.rotation.x=0.15+0.45*mv;wkHead.rotation.x=-0.2-0.4*mv;
    walker.position.set(wk.x,wk.y,wk.z);walker.rotation.y=wk.yaw;walker.visible=!(on&&camMode==='cab');return}
  const run=Math.min(1,wk.spd/TU.wkRun),fast=clamp((wk.spd-TU.wkRun)/(TU.wkSprint-TU.wkRun),0,1);if(wk.ground)wk.phase+=dt*(4+6*run+4*fast)*Math.min(1,wk.spd*2);
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
const WK_RIDES={ex:{get o(){return st},c:EX_C,r:EX_R,m:'dig',n:'excavator'},truck:{get o(){return tr},c:TR_C,r:TR_R,m:'truck',n:'dump truck'},skid:{get o(){return sk},c:SK_C,r:SK_R,m:'skid',n:'skid steer'},mow:{get o(){return mw},c:MW_C,r:MW_R,m:'mow',n:'mower'}};
const rideOf=m=>m==='dig'||m==='drive'?'ex':m==='truck'?'truck':m==='mow'?'mow':m==='skid'?'skid':m==='boat'?'boat'+btI:m==='bike'?'bike':m==='heavy'?'hv'+hvI:null;
// the machine within an arm's length of the worker, nearest first (reach: a boat can be stepped into from the middle of its dock)
function wkNear(){let best=null,bd=1.3;
  for(const k in WK_RIDES){const R=WK_RIDES[k];
    for(const lz of R.c){const d=Math.hypot(wk.x-R.o.x-Math.sin(R.o.yaw)*lz,wk.z-R.o.z-Math.cos(R.o.yaw)*lz)-R.r-WK_R-(R.reach||0);if(d<bd){bd=d;best=k}}}
  return best}
// climbing out: the first clear spot beside the machine (driver's side, then the other side, then front and back)
function wkPlaceOut(k){const R=WK_RIDES[k];if(R.out)return R.out();const o=R.o,sy=Math.sin(o.yaw),cy=Math.cos(o.yaw),gap=R.r+WK_R+0.3,len=Math.max(...R.c.map(Math.abs));
  const spots=[[gap,0],[-gap,0],[gap,R.c[0]],[-gap,R.c[0]],[0,len+gap],[0,-len-gap]];
  for(const [sx,sz] of spots){const x=o.x+cy*sx+sy*sz,z=o.z-sy*sx+cy*sz;
    if(!landIn(x,z,1.5,0.45,true)||SOLIDS.some(s=>Math.abs(x-s.x)<s.hx+WK_R&&Math.abs(z-s.z)<s.hz+WK_R))continue;const f=wkFloor(x,z,0,1e9);
    if(blocks.some(b=>Math.abs(x-b.x)<b.w/2+WK_R&&Math.abs(z-b.z)<b.d/2+WK_R&&b.y<f+WK_H&&b.y+b.h>f+WK_STEP))continue;
    let clear=true;for(const j in WK_RIDES){if(j===k)continue;const Q=WK_RIDES[j];
      for(const lz of Q.c)if(Math.hypot(x-Q.o.x-Math.sin(Q.o.yaw)*lz,z-Q.o.z-Math.cos(Q.o.yaw)*lz)<Q.r+WK_R+0.1)clear=false}
    if(!clear)continue;
    Object.assign(wk,{x,z,y:f,vy:0,ground:true,yaw:o.yaw+(k==='ex'?st.swing:0),airT:0});return true}
  return false}
// F (or Get in / Get out, or controller B): on foot it climbs into the machine at hand (or sits down at a game table on
// the Family Island's pavilion, family.js); driving, it climbs out
function seatToggle(){
  if(mode==='walk'){const k=wkNear();
    if(!k){const g=famGameNear();if(g){if(g.pet)jesPet();else famPlay(g);return}
      toast(say('getInFar'));return}
    wk.inside=k;walker.visible=false;if(WK_RIDES[k].pick)WK_RIDES[k].pick();setMode(WK_RIDES[k].m);toast(say('inMachine',{machine:WK_RIDES[k].n,key:kbUsed?keyLabel('enter'):padUsed?'B':'Get out'}),'tip',2600);return}
  const k=rideOf(mode);if(!k)return;
  if(!wkPlaceOut(k)){toast(say('noRoomOut'));return}
  wk.inside=null;setMode('walk')}
$('#seatBtn').onclick=seatToggle;
