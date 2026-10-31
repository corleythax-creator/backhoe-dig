// Corley's Island: the worker's guns. On foot he has one in his hands from the start, the pistol (put away while the
// trimmer is out, swimming or in a machine); Lakeside Guns on Main Street (GUN_SHOPS, interiors.js) has a pump shotgun,
// a bolt-action rifle and a carbine to take, and ammunition (its counter: [carry]). Pistol (KEY gun, the gun button)
// takes it out or puts it away, Next gun (KEY gunNext, a tap on the ammo count) switches, Reload (KEY gunReload, the
// Reload button) loads from the rounds carried. While one is out Fire (KEY gunShoot, the Fire button, or a click on the
// view, pointer taken or not, ahead of blocks; the carbine fires while held) shoots the way he faces (first person: at
// the crosshair, #gunCross; chase view: at the nearest person close to that way, gunAssist): he turns that way and
// brings the gun up, and each shot (the shotgun's: nine pellets) is a ray that stops at the first townsperson
// (townfolk.js), wall or other solid (SOLIDS, terrain.js) or the ground, out to TU.gunRange times the gun's reach.
// Townsfolk have TU.gunHp each, give or take; a shot takes the gun's damage (Tuning: Pistol) times where it hits (the
// head TU.gunHeadX): dropped to nothing they fall (tfHitPose: over by where they were hit; the body stays TU.gunBody,
// then goes when out of sight) and bleed into a pool; a leg or a bad gut wound drops them crawling, anything else
// spins them round and they run off bleeding; every shot near anyone sends the people round about running off
// (TU.gunFlee). Hits throw blood that spatters the ground and the wall behind; misses leave holes and dust. He holds a
// long gun with both hands and the pistol two-handed when aiming (gunIK: both arms reach the grips). The guns he owns
// and their rounds are saved with the rigs (gunSave, save.js); blood and holes are not.
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.
const GUN_GRIP=0.004,GUN_HEAD=0.84;
// the guns: name, short name, rounds a load and carried at most, the Tuning id of its damage, seconds between shots (the
// pistol's is TU.gunRate), spread (rad) and how much each quick shot adds, pellets, reach (times TU.gunRange), reload
// seconds (shell: a shell at a time), auto: fires while held, long: two hands to the shoulder; in its own frame (x his
// left, y up, z along the barrel, the origin in his right palm on the grip) the muzzle, where the left hand holds it and
// the magazine; the bang (filters, pitch, the low thump, loudness, echo, how fast it dies); the kick it gives the view
// (rad: rc, the part of it that stays: rk) and the shake; where the empty case leaves it (ej, out to his right) and which
// case (cs), and when (after the pump or the bolt: ejT)
const GUNS={
  pistol:{n:'Service pistol',s:'Pistol',mag:15,max:150,dm:'gunDmgP',rt:0,spr:0.004,bl:0.012,pel:1,rng:1,rl:1.7,muz:[0,0.05,0.18],fore:[0.032,-0.03,0.004],mg:[0,-0.07,-0.012],
    bang:{lp:7500,hp:180,r:1,th:120,v:1.6,e:0.9,dk:9},rc:0.04,rk:0.012,sh:0.35,ej:[-0.012,0.045,0.06],cs:'p',ejT:0,d:'15 rounds a magazine. Quick and handy'},
  shotgun:{n:'Pump shotgun',s:'Shotgun',mag:6,max:60,dm:'gunDmgS',rt:0.95,spr:0.05,bl:0,pel:9,rng:0.45,rl:0.55,shell:1,long:1,muz:[0,0.06,0.77],fore:[0,0.008,0.36],mg:[0,0.0,0.14],
    bang:{lp:4800,hp:90,r:0.72,th:75,v:2.1,e:1.2,dk:6},rc:0.1,rk:0.03,sh:1,ej:[-0.025,0.05,0.13],cs:'s',ejT:0.42,d:'6 shells of 9 pellets. Brutal up close'},
  rifle:{n:'Bolt-action rifle',s:'Rifle',mag:5,max:60,dm:'gunDmgR',rt:1.3,spr:0.0012,bl:0,pel:1,rng:3.5,rl:2.6,long:1,muz:[0,0.05,0.97],fore:[0,0.0,0.3],mg:[0,-0.03,0.17],
    bang:{lp:9500,hp:140,r:0.82,th:95,v:2.3,e:1.5,dk:5},rc:0.08,rk:0.02,sh:0.75,ej:[-0.02,0.05,0.12],cs:'r',ejT:0.55,d:'5 rounds and a scope. One shot, a long way off'},
  carbine:{n:'Carbine',s:'Carbine',mag:30,max:300,dm:'gunDmgC',rt:0.095,spr:0.006,bl:0.007,pel:1,rng:2.2,rl:2.2,auto:1,long:1,muz:[0,0.06,0.69],fore:[0,0.032,0.29],mg:[0,-0.07,0.13],
    bang:{lp:8200,hp:200,r:1.08,th:105,v:1.7,e:1.1,dk:10},rc:0.022,rk:0.009,sh:0.28,ej:[-0.02,0.07,0.07],cs:'c',ejT:0,d:'30 rounds. Hold to fire'}};
const GUN_K=Object.keys(GUNS);
const gun={eq:true,on:false,fp:false,aim:0,cool:0,kick:0,flash:0,told:false,shots:0,downs:0,k:'pistol',own:{pistol:1},am:{},rl:0,rlT:0,rlC:0,bl:0,trig:false,shop:null,racked:0};
for(const k of GUN_K)gun.am[k]=[GUNS[k].mag,GUNS[k].mag*3];
const gunW=()=>GUNS[gun.k];
// ---------- the models: Poly Haven's photo-scanned service pistol and bolt-action rifle (models/pistol, models/rifle,
// CC0, their own colour, metal/roughness and normal maps), the shotgun and carbine built here from steel, wood and
// polymer; each turned so the barrel runs along +z, its origin in the palm ----------
const gunMdl=new THREE.Group();gunMdl.visible=false;gunMdl.matrixAutoUpdate=false;scene.add(gunMdl);
const gunM={};for(const k of GUN_K){const g=new THREE.Group();g.visible=k===gun.k;gunMdl.add(g);gunM[k]=g}
const gunEnvMat=m=>{m.envMap=skyEnv;m.envMapIntensity=0.8;m.side=THREE.FrontSide};
function gunGltf(k,url,fit){mdlLoaderReady(()=>new THREE.GLTFLoader().load(url,gl=>{const g=gl.scene;fit(g);
  g.traverse(o=>{if(!o.isMesh)return;if(/bullet/.test(o.name)){o.visible=false;return}o.castShadow=true;o.frustumCulled=false;gunEnvMat(o.material)});gunM[k].add(g);gunM[k].ready=1},undefined,e=>console.warn(k+':',e)))}
gunGltf('pistol','models/pistol/pistol.gltf',g=>{g.rotation.y=-Math.PI/2;g.position.set(0,GUN_GRIP,0.004)});
gunGltf('rifle','models/rifle/rifle.gltf',g=>{g.rotation.y=-Math.PI/2;g.position.set(0,0.02,0.37)});
// a part: a box (w, h, l) or a round bar along z (r, l, sides), at x, y, z, tipped about x by rx
function gunPart(g,geo,m,x,y,z,rx){const o=new THREE.Mesh(geo,m);o.position.set(x,y,z);if(rx)o.rotation.x=rx;o.castShadow=true;o.frustumCulled=false;g.add(o);return o}
const gunBx=(w,h,l)=>new THREE.BoxGeometry(w,h,l),gunBar=(r,l,n)=>new THREE.CylinderGeometry(r,r,l,n||16).rotateX(Math.PI/2);
mdlLoaderReady(()=>{const M=(c,me,ro)=>{const m=new THREE.MeshStandardMaterial({color:c,metalness:me,roughness:ro});gunEnvMat(m);return m};
  const blue=M(0x24272a,0.9,0.34),anod=M(0x2c2d2e,0.55,0.48),poly=M(0x1b1c1d,0.05,0.62),wood=M(0x5a331c,0,0.48),pad=M(0x141414,0,0.85),glass=M(0x203040,0.2,0.08);
  {const g=gunM.shotgun,P=(a,m,x,y,z,r)=>gunPart(g,a,m,x,y,z,r);
    P(gunBx(0.044,0.07,0.21),blue,0,0.045,0.13);P(gunBar(0.0115,0.53),blue,0,0.062,0.5);P(gunBx(0.008,0.004,0.5),blue,0,0.076,0.5);
    P(new THREE.SphereGeometry(0.003,8,6),M(0xd8d0b0,0.6,0.3),0,0.08,0.755);P(gunBar(0.0105,0.43),blue,0,0.032,0.45);P(gunBar(0.012,0.02),blue,0,0.032,0.665);
    P(gunBar(0.021,0.17,14),wood,0,0.03,0.42);for(let i=0;i<6;i++)P(gunBar(0.0215,0.006,14),M(0x3a2414,0,0.6),0,0.03,0.36+i*0.024);
    P(gunBx(0.012,0.004,0.065),blue,0,0.004,0.055);P(gunBx(0.012,0.02,0.004),blue,0,0.012,0.088);P(gunBx(0.005,0.02,0.005),blue,0,0.016,0.058);
    P(gunBx(0.036,0.05,0.12),wood,0,0.0,-0.02,0.3);P(gunBx(0.04,0.105,0.25),wood,0,-0.03,-0.2,-0.08);P(gunBx(0.044,0.125,0.02),pad,0,-0.042,-0.33,-0.08)}
  {const g=gunM.carbine,P=(a,m,x,y,z,r)=>gunPart(g,a,m,x,y,z,r);
    P(gunBx(0.03,0.055,0.19),anod,0,0.02,0.08);P(gunBx(0.032,0.045,0.2),anod,0,0.067,0.08);P(gunBx(0.022,0.008,0.22),anod,0,0.093,0.08);
    P(gunBar(0.016,0.07),anod,0,0.118,0.08);P(gunBar(0.013,0.004),glass,0,0.118,0.117);P(gunBx(0.014,0.016,0.03),anod,0,0.101,0.08);
    P(gunBar(0.022,0.3,8),poly,0,0.06,0.33);P(gunBar(0.0075,0.16),blue,0,0.06,0.56);P(gunBar(0.0105,0.045,8),blue,0,0.06,0.665);
    P(gunBx(0.006,0.035,0.01),anod,0,0.09,0.47);P(gunBx(0.024,0.17,0.062),poly,0,-0.07,0.13,-0.15);P(gunBx(0.028,0.085,0.035),poly,0,-0.025,-0.005,0.35);
    P(gunBx(0.006,0.004,0.05),anod,0,-0.012,0.04);P(gunBx(0.004,0.016,0.004),blue,0,0.0,0.035);P(gunBar(0.015,0.17),anod,0,0.055,-0.1);
    P(gunBx(0.04,0.085,0.12),poly,0,0.035,-0.2);P(gunBx(0.042,0.092,0.012),pad,0,0.035,-0.265);P(gunBx(0.01,0.012,0.02),anod,-0.018,0.075,0.0)}
  gunM.shotgun.ready=gunM.carbine.ready=1});
// the muzzle flash: two crossed cards and a star, glowing, a frame or two; it moves to the muzzle of the gun in hand
const gunFlash=new THREE.Group();gunFlash.visible=false;gunMdl.add(gunFlash);
{const m=new THREE.MeshBasicMaterial({color:0xffc870,transparent:true,opacity:0.95,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide});
  for(const r of [0,Math.PI/2]){const c=new THREE.Mesh(new THREE.PlaneGeometry(0.07,0.2),m);c.rotation.set(Math.PI/2,r,0);c.position.z=0.09;gunFlash.add(c)}
  const s=new THREE.Mesh(new THREE.CircleGeometry(0.06,7),m);gunFlash.add(s)}
// the guns for sale: clones of the models on each gun shop's wall and in its glass case, once they have loaded
function gunRackFill(){if(gun.racked>=GUN_SHOPS.length||!GUN_K.every(k=>gunM[k].ready))return;
  for(;gun.racked<GUN_SHOPS.length;gun.racked++){const S=GUN_SHOPS[gun.racked];
    S.rack.forEach(([x,y,z,yw],i)=>{const o=gunM[['rifle','shotgun','carbine'][i%3]].clone(true);o.visible=true;o.position.set(x,y,z);o.rotation.set(0,yw,0);scene.add(o)});
    S.case.forEach(([x,y,z,yw])=>{const o=gunM.pistol.clone(true);o.visible=true;o.position.set(x,y,z);o.rotation.set(0,yw,Math.PI/2,'YXZ');scene.add(o)})}}
// ---------- in hand ----------
function gunEquip(on,quiet){if(on&&trim.on)trimSet(false);gun.eq=!!on;gun.rl=0;$('#gunBtn').setAttribute('aria-pressed',gun.eq);gunHudDraw();if(!quiet)toast(say(on?'gunOut':'gunAway',{gun:gunW().s}),'',1800)}
const gunReady=()=>gunHas();
const gunHas=()=>gun.eq&&mode==='walk'&&!wk.inside&&!wk.swim&&!trim.on&&!bench.on;
// the next gun he owns
function gunNext(){const own=GUN_K.filter(k=>gun.own[k]);if(own.length<2){toast(say('gunOne',{}),'',2600);return}
  gunTake(own[(own.indexOf(gun.k)+1)%own.length])}
function gunTake(k){gun.k=k;gun.rl=0;gun.cool=Math.max(gun.cool,0.45);gun.bl=0;if(!gun.eq)gunEquip(true,true);gunHudDraw();gunClick('rack');toast(say('gunOut',{gun:GUNS[k].s}),'',1600)}
function gunHudDraw(){const W=gunW(),A=gun.am[gun.k];$('#gunBtn').textContent=W.s;$('#gunHudN').textContent=W.s.toUpperCase();
  $('#gunHudA').textContent=gun.rl>0?'RELOADING':A[0]+' / '+A[1];$('#gunHud').classList.toggle('low',A[0]<=Math.ceil(W.mag/4))}
const gunV=new THREE.Vector3(),gunE=new THREE.Vector3(),gunH=new THREE.Vector3(),gunX=new THREE.Vector3(),gunY=new THREE.Vector3(),gunZ=new THREE.Vector3(),gunD=new THREE.Vector3();
// the way he aims: where the camera looks, level with the view
function gunYaw(){return camMode==='cab'?wk.view:wk.view+orbitYaw}
// after updateWalker: while aiming he faces the shot and holds the gun out at the shoulder (right arm, wkArms[0])
function gunTick(dt){gun.cool=Math.max(0,gun.cool-dt);gun.flash=Math.max(0,gun.flash-dt);gun.kick=Math.max(0,gun.kick-dt*6);gun.bl=Math.max(0,gun.bl-dt*0.08);
  for(const p of tf.people)if(p.flee>0){p.flee-=dt;if(p.flee<=0){p.flee=0;if(p.vt0){p.vt=p.vt0;p.vt0=0}}}
  gunFxTick(dt);gunCsTick(dt);gunLightTick(dt);if(gun.racked<GUN_SHOPS.length)gunRackFill();
  if(gun.shop&&(mode!=='walk'||Math.hypot(wk.x-gun.shop.x,wk.z-gun.shop.z)>3))gunShopClose();
  const on=gunHas(),fp=on&&camMode==='cab';if(gun.on!==on){gun.on=on;$('#fireBtn').hidden=!on;$('#reloadBtn').hidden=!on;$('#gunHud').hidden=!on;if(on)gunHudDraw()}if(gun.fp!==fp){gun.fp=fp;$('#gunCross').hidden=!fp}
  if(on&&!gun.told&&tf.on){gun.told=true;toast(say('gunTip',{}),'',4200)}
  if(!on){gun.aim=0;gun.rl=0;gun.trig=false;return}
  const W=gunW();if(W.auto&&(gun.trig||held('gunShoot'))&&gun.cool<=0)gunFire();
  if(gun.rl>0)gunReloadStep(dt);
  gun.aim=Math.max(0,gun.aim-dt);
  // in first person he always holds it out, a little high, so it sits low and right in the view
  if(gun.aim>0||fp){wk.yaw=gunYaw();const p=fp?fpl.pitch+0.08:-(orbitPitch-0.32)*0.6,A=wkArms[0];
    A.top.rotation.x=-Math.PI/2-p*0.9-gun.kick*0.35;A.low.rotation.x=-0.05-(fp?0.25:0)-gun.kick*0.25}
  else{const A=wkArms[0];A.low.rotation.x=Math.min(A.low.rotation.x,-0.35)}}
// ---------- both hands on the gun (the rigged worker, wkMdl) ----------
// each arm: its bones, the hand's own frame at rest (fingers F, palm N: out of the palm) and the palm's middle from the wrist
const gunQ=new THREE.Quaternion(),gunQ2=new THREE.Quaternion(),gunQF=new THREE.Quaternion(),GUN_UP=new THREE.Vector3(0,1,0),gunMx=new THREE.Matrix4(),gunMx2=new THREE.Matrix4();
const gunS=new THREE.Vector3(),gunEl=new THREE.Vector3(),gunWr=new THREE.Vector3(),gunT=new THREE.Vector3(),gunP=new THREE.Vector3(),gunA=new THREE.Vector3(),gunB=new THREE.Vector3(),gunR=new THREE.Vector3(),gunU=new THREE.Vector3();
function gunArm(J,s){const a=J.arms[s];if(!a||!a.top||!a.low)return null;if(a.g)return a.g;const low=a.low.b,hand=low.children.find(c=>c.isBone&&/hand/.test(c.name));if(!hand)return null;
  const ch=n=>hand.children.find(c=>new RegExp('^'+n).test(c.name)),mid=ch('middle_01'),ix=ch('index_01'),pk=ch('pinky_01');if(!mid||!ix||!pk)return null;
  const right=/_r$/.test(hand.name),F=mid.position.clone().normalize(),Ac=ix.position.clone().sub(pk.position),N=F.clone().cross(Ac).normalize().multiplyScalar(right?-1:1);
  N.sub(F.clone().multiplyScalar(N.dot(F))).normalize();
  a.g={top:a.top.b,low,hand,right,F,N,U:F.clone().cross(N),palm:mid.position.clone().multiplyScalar(0.5),h0:hand.quaternion.clone(),sf:hand.name.slice(-2)};return a.g}
// turn bone b by the world turn q
function gunTurnW(b,q){b.parent.getWorldQuaternion(gunQ2);b.getWorldQuaternion(gunQF);b.quaternion.copy(gunQ2.invert().multiply(q).multiply(gunQF));b.updateMatrixWorld(true)}
// hand frame wanted in the world: fingers along f, palm facing n (both unit, n square to f)
function gunHandQ(A,f,n,out){gunMx.makeBasis(A.F,A.N,A.U);gunHU.crossVectors(f,n);gunMx2.makeBasis(f,n,gunHU);gunMx2.multiply(gunMx.transpose());return out.setFromRotationMatrix(gunMx2)}
// arm A reaches its palm to world point p with the hand turned to f, n (fingers curled round), the elbow toward pole
const gunHq=new THREE.Quaternion(),gunHsc=new THREE.Vector3(),gunI1=new THREE.Vector3(),gunI2=new THREE.Vector3(),gunHU=new THREE.Vector3();
function gunIK(A,p,f,n,pole,r){gunHandQ(A,f,n,gunHq);A.hand.getWorldScale(gunHsc);
  gunT.copy(A.palm).multiplyScalar(gunHsc.x).applyQuaternion(gunHq);gunT.negate().add(p).addScaledVector(n,-(r||0.022));
  A.top.getWorldPosition(gunS);A.low.getWorldPosition(gunEl);A.hand.getWorldPosition(gunWr);
  const a=gunS.distanceTo(gunEl),b=gunEl.distanceTo(gunWr);gunA.subVectors(gunT,gunS);let d=gunA.length();if(d<1e-4)return;gunA.divideScalar(d);d=Math.min(d,(a+b)*0.998);
  const x=(a*a-b*b+d*d)/(2*d),h=Math.sqrt(Math.max(0,a*a-x*x));gunB.copy(pole).addScaledVector(gunA,-pole.dot(gunA)).normalize();
  gunP.copy(gunS).addScaledVector(gunA,x).addScaledVector(gunB,h);
  gunQ.setFromUnitVectors(gunI1.subVectors(gunEl,gunS).normalize(),gunI2.subVectors(gunP,gunS).normalize());gunTurnW(A.top,gunQ);
  A.low.getWorldPosition(gunEl);A.hand.getWorldPosition(gunWr);gunT.copy(gunS).addScaledVector(gunA,d);
  gunQ.setFromUnitVectors(gunI1.subVectors(gunWr,gunEl).normalize(),gunI2.subVectors(gunT,gunEl).normalize());gunTurnW(A.low,gunQ);
  A.hand.parent.getWorldQuaternion(gunQ2);A.hand.quaternion.copy(gunQ2.invert().multiply(gunHq));A.hand.updateMatrixWorld(true)}
// fingers of hand A curled by c (the index finger by ci, along the trigger guard)
function gunCurl(J,A,c,ci){const key=A.sf+c+','+ci;if(A.curl===key)return;A.curl=key;
  for(const f of J.fingers)if(f.b.name.endsWith(A.sf)){const ix=/^index/.test(f.b.name);f.b.quaternion.copy(f.q0).multiply(gunQF.setFromAxisAngle(WK_X,ix?ci:c))}}
// a vector in the gun's frame (x left, y up, z along it) into the world
const gunL=(v,x,y,z)=>v.set(0,0,0).addScaledVector(gunX,x).addScaledVector(gunY,y).addScaledVector(gunZ,z);
// after wkMdlPose (main.js): the gun into his hands. Down by his side the pistol rides in his right palm along the
// forearm; aimed, reloading, or a long gun at any time, the gun is set where it should be (at the shoulder along the
// shot, or across his body at the ready) and both arms reach for it
const gunF=new THREE.Vector3(),gunN=new THREE.Vector3(),gunPole=new THREE.Vector3(),gunO=new THREE.Vector3();
function gunPlace(){const show=gunHas()&&walker.visible,J=wkMdl.j,fp=show&&camMode==='cab',W=gunW();gunMdl.visible=show;
  for(const k of GUN_K)gunM[k].visible=k===gun.k;
  // put away: the hands back to their easy curl (wkRig)
  if(!show&&J&&gun.fist){for(const s of [0,1]){const A=gunArm(J,s);if(!A)continue;A.hand.quaternion.copy(A.h0);A.curl=null;
    for(const f of J.fingers)if(f.b.name.endsWith(A.sf))f.b.quaternion.copy(f.q0).multiply(gunQF.setFromAxisAngle(WK_X,0.35))}gun.fist=null}
  // in first person he is drawn too (walker.js) and the camera is in his head: the head is shrunk away
  if(J&&J.head&&gun.headOff!==fp){gun.headOff=fp;J.head.b.scale.setScalar(fp?0.001:1)}
  if(!show)return;walker.updateMatrixWorld(true);gunFlash.position.fromArray(W.muz);
  gunFlash.visible=gun.flash>0;if(gunFlash.visible)gunFlash.rotation.z=Math.random()*6.28;
  const R=J&&gunArm(J,0),L=J&&gunArm(J,1),aim=gun.aim>0||fp,posed=R&&L&&(W.long||aim||gun.rl>0);
  if(!posed){// one hand: the grip in the palm, half way from the wrist to the middle finger's knuckle, the wrist turned so
    // the palm faces in, thumb up, round an upright grip
    const low=R&&R.low,hand=R&&R.hand;
    if(hand){if(L&&L.curl){L.hand.quaternion.copy(L.h0);gunCurl(J,L,0.35,0.35)}hand.quaternion.copy(R.h0).multiply(gunQF.setFromAxisAngle(GUN_UP,TU.gunWrist));walker.updateMatrixWorld(true);
      low.getWorldPosition(gunE);hand.getWorldPosition(gunH);const mid=hand.children.find(c=>/^middle_01/.test(c.name));gun.fist=1;gunCurl(J,R,1.35,0.55);
      if(mid){mid.getWorldPosition(gunV);gunH.lerp(gunV,0.55)}}
    else{const A=wkArms[0].low;A.getWorldPosition(gunE);gunH.set(0,-0.31,0.03);A.localToWorld(gunH)}
    gunZ.subVectors(gunH,gunE).normalize();if(aim){camera.getWorldDirection(gunD);gunZ.lerp(gunD,fp?0.95:0.8).normalize()}
    const y=wk.yaw;gunX.set(Math.cos(y),0,-Math.sin(y));gunY.crossVectors(gunZ,gunX).normalize();gunX.crossVectors(gunY,gunZ);
    gunMdl.matrix.makeBasis(gunX,gunY,gunZ);gunMdl.matrix.setPosition(gunH);gunMdl.matrixWorldNeedsUpdate=true;return}
  // where it points (D) from where his eye is
  const y=wk.yaw,ru=gun.rl>0?Math.sin(Math.PI*Math.min(1,(1-gun.rl/gun.rlT)*1.15)):0;
  if(fp){camera.updateMatrixWorld();camera.getWorldDirection(gunD);gunO.copy(camera.position)}
  else{const p=aim?-(orbitPitch-0.32)*0.6:-0.55;gunD.set(Math.sin(y)*Math.cos(p),Math.sin(p),Math.cos(y)*Math.cos(p));
    if(J.head)J.head.b.getWorldPosition(gunO);else gunO.set(wk.x,wk.y+1.62,wk.z);gunO.y+=0.04;gunO.addScaledVector(gunD,0.06)}
  if(!aim&&W.long){const a=0.45;gunD.set(Math.sin(y+a)*0.82,-0.57,Math.cos(y+a)*0.82).normalize()}// across him, muzzle down and to his left
  gunR.crossVectors(gunD,GUN_UP).normalize();gunU.crossVectors(gunR,gunD);
  if(!aim&&W.long){gunH.copy(gunO).addScaledVector(GUN_UP,-0.42).addScaledVector(gunR,0.1);gunH.x+=Math.sin(y)*0.22;gunH.z+=Math.cos(y)*0.22}
  else if(W.long)gunH.copy(gunO).addScaledVector(gunD,fp?0.23:0.13).addScaledVector(gunR,fp?0.1:0.1).addScaledVector(gunU,fp?-0.13:-0.16);
  else gunH.copy(gunO).addScaledVector(gunD,fp?0.35:0.38).addScaledVector(gunR,fp?0.07:0.03).addScaledVector(gunU,fp?-0.13:-0.15);
  // reloading: the gun comes down and turns on its side; the kick: back into him and the muzzle up
  if(ru){gunH.addScaledVector(gunU,-0.09*ru).addScaledVector(gunD,-0.05*ru);gunD.addScaledVector(gunU,-0.45*ru).normalize()}
  if(gun.kick>0){gunH.addScaledVector(gunD,-(W.long?0.05:0.035)*gun.kick);gunD.addScaledVector(gunU,(W.long?0.1:0.16)*gun.kick).normalize()}
  gunZ.copy(gunD);gunX.crossVectors(GUN_UP,gunZ).normalize();if(ru)gunX.applyAxisAngle(gunZ,0.5*ru);gunY.crossVectors(gunZ,gunX);
  gunMdl.matrix.makeBasis(gunX,gunY,gunZ);gunMdl.matrix.setPosition(gunH);gunMdl.matrixWorldNeedsUpdate=true;
  // a long gun to the shoulder: he turns his shoulders to the right, bringing the left one forward to reach the fore-end
  // (the head turned back to the front)
  if(W.long&&aim&&J.sp[0]){gunQ.setFromAxisAngle(GUN_UP,-0.5/3);for(const s of J.sp)if(s)gunTurnW(s.b,gunQ);if(J.neck)gunTurnW(J.neck.b,gunQ.setFromAxisAngle(GUN_UP,0.5))}
  // the right hand on the grip, palm in, fingers round it; the elbow down and out
  gun.fist=1;gunL(gunF,0.3,0.12,1).normalize();gunL(gunN,1,0,0);gunN.addScaledVector(gunF,-gunN.dot(gunF)).normalize();
  gunPole.copy(gunR).multiplyScalar(W.long&&aim?0.9:0.6).addScaledVector(GUN_UP,W.long&&aim?-0.4:-1);gunIK(R,gunH,gunF,gunN,gunPole,0.02);gunCurl(J,R,1.35,0.55);
  // the left: under the fore-end (the pistol: round the right hand), down to the magazine while reloading
  const fo=W.fore,mg=W.mg,u=gun.rl>0?1-gun.rl/gun.rlT:0;let lx=fo[0],ly=fo[1],lz=fo[2];
  if(gun.rl>0){const k=W.shell?Math.sin(Math.PI*u):u<0.25?u/0.25:u<0.75?1:(1-u)/0.25,dn=W.shell?0.08*Math.sin(Math.PI*u):u>0.3&&u<0.62?0.22*Math.sin(Math.PI*(u-0.3)/0.32):0;
    lx+=(mg[0]-lx)*k;ly+=(mg[1]-ly)*k-dn;lz+=(mg[2]-lz)*k}
  gunL(gunT,lx,ly,lz).add(gunH);gunP.copy(gunT);
  if(W.long){gunL(gunF,-0.5,0.15,1).normalize();gunL(gunN,-0.35,1,0)}else{gunL(gunF,-0.25,-0.15,1).normalize();gunL(gunN,-1,0.2,0)}
  gunN.addScaledVector(gunF,-gunN.dot(gunF)).normalize();gunPole.copy(gunR).multiplyScalar(-0.7).addScaledVector(GUN_UP,-1);
  gunIK(L,gunP,gunF,gunN,gunPole,W.long?0.024:0.03);gunCurl(J,L,W.long?1.0:1.2,W.long?0.85:1.1)}
// ---------- the shot ----------
// distance t along ray (o, unit d) where it first meets solid s (its box on the ground plan, as tall as it needs), or
// Infinity; the side it meets faces gunSN ([x, z])
const gunSN=[0,0];
function gunSolidT(s,ox,oz,dx,dz){let x=ox-s.x,z=oz-s.z,ux=dx,uz=dz,hx=s.hx,hz=s.hz;const r=s.sn!==undefined;
  if(r){const a=x*s.cs-z*s.sn;z=x*s.sn+z*s.cs;x=a;const b=ux*s.cs-uz*s.sn;uz=ux*s.sn+uz*s.cs;ux=b;hx=s.lx;hz=s.lz}
  let t0=-Infinity,t1=Infinity,ax=0,sg=1;const P=[[x,ux,hx],[z,uz,hz]];for(let i=0;i<2;i++){const [p,u,h]=P[i];if(Math.abs(u)<1e-9){if(Math.abs(p)>h)return Infinity;continue}
    let a=(-h-p)/u,b=(h-p)/u;if(a>b)[a,b]=[b,a];if(a>t0){t0=a;ax=i;sg=u>0?-1:1}t1=Math.min(t1,b)}
  if(!(t0<=t1&&t1>0))return Infinity;let nx=ax===0?sg:0,nz=ax===1?sg:0;if(r){const a=nx*s.cs+nz*s.sn;nz=-nx*s.sn+nz*s.cs;nx=a}gunSN[0]=nx;gunSN[1]=nz;return Math.max(0,t0)}
// a ray from o along unit d, out to R: what it meets first. {t, k: 'p' (a person p, at height hy of them), 'wall'
// (facing n), 'ground', or '' (nothing), and tw: how far it would have gone past a person}
const gunHitR={t:0,k:'',p:null,hy:0,n:[0,1,0],tw:0};
function gunRay(o,d,R){const hl=Math.hypot(d.x,d.z),t0=0.2,H=gunHitR;let tw=R,k='',nx=0,nz=0;
  for(const s of SOLIDS){if(s.foot)continue;const t=gunSolidT(s,o.x,o.z,d.x/(hl||1),d.z/(hl||1))/(hl||1);if(t>t0&&t<tw){tw=t;k='wall';nx=gunSN[0];nz=gunSN[1]}}
  // the ground, half a metre at a time, then found to an inch
  for(let t=t0;t<tw;t+=0.5){const x=o.x+d.x*t,z=o.z+d.z*t;if(o.y+d.y*t<surfAt(x,z)){let a=Math.max(t0,t-0.5),b=t;for(let i=0;i<5;i++){const m=(a+b)/2;if(o.y+d.y*m<surfAt(o.x+d.x*m,o.z+d.z*m))b=m;else a=m}tw=b;k='ground';break}}
  H.n[0]=nx;H.n[1]=0;H.n[2]=nz;H.k=k;H.p=null;H.tw=tw;let ht=tw;
  if(tf.on)for(const p of tf.people){if(p.inside||p.drv||p.dead)continue;const ox=p.x-o.x,oz=p.z-o.z;if(ox*ox+oz*oz>(R+2)**2)continue;
    // a standing body as an upright cylinder, 11 in round (seated: 4 ft 3 in tall, from 17 in down)
    const lie=p.hurt>0.6,r=lie?0.6:0.28*p.sc,a=d.x*d.x+d.z*d.z;if(a<1e-6)continue;const b=-(ox*d.x+oz*d.z),c=ox*ox+oz*oz-r*r,q=b*b-a*c;if(q<0)continue;
    const t=(-b-Math.sqrt(q))/a,te=(-b+Math.sqrt(q))/a,lo=p.sit?p.y-0.42*p.sc:p.y,hi=lo+(lie?0.35:p.sit?1.3:1.72)*p.sc;
    for(let i=0;i<5;i++){const u=t+(te-t)*i/4;if(u<t0||u>=ht)continue;const y=o.y+d.y*u;if(y>=lo&&y<=hi){H.p=p;H.k='p';ht=u;H.hy=(y-lo)/(hi-lo);break}}}
  H.t=ht;if(!H.k)H.t=R;return H}
// a shot's way: d0 thrown off by up to sp (rad), into out
function gunSpread(d0,sp,out){out.copy(d0);if(sp<=0)return out;gunR.crossVectors(d0,GUN_UP).normalize();gunU.crossVectors(gunR,d0);const r=sp*Math.sqrt(Math.random()),a=Math.random()*6.283;
  return out.addScaledVector(gunR,r*Math.cos(a)).addScaledVector(gunU,r*Math.sin(a)).normalize()}
const gunDS=new THREE.Vector3(),gunHits=new Map();
function gunFire(){if(!gunHas()){if(mode==='walk'&&trim.on)toast(say('gunTrim',{}),'',1800);return}
  const W=gunW(),Am=gun.am[gun.k];if(gun.cool>0)return;
  if(gun.rl>0){if(!(W.shell&&Am[0]>0))return;gun.rl=0;gunHudDraw()}
  if(Am[0]<=0){gun.cool=0.3;gun.trig=false;gunClick('dry');if(Am[1]>0)gunReload();else toast(say('gunNoAmmo',{gun:W.s}),'',2600);return}
  Am[0]--;gun.cool=W.rt||TU.gunRate;gun.aim=1.4;gun.kick=1;gun.flash=0.05;gun.shots++;started();gunBang(W);gunHudDraw();gunRecoil(W);gun.ejQ.push([W.ejT,gun.k])
  if(W.shell)gunClick('pump',0.32);else if(gun.k==='rifle')gunClick('bolt',0.4);
  const R=TU.gunRange*W.rng,fp=camMode==='cab',d=gunD,o=gunV;
  if(fp){camera.updateMatrixWorld();o.copy(camera.position);camera.getWorldDirection(d)}
  else{const y=gunYaw();o.set(wk.x,wk.y+1.42,wk.z);d.set(Math.sin(y),0,Math.cos(y));const a=gunAssist(o,y,R);if(a)d.set(a[0]-o.x,a[1]-o.y,a[2]-o.z).normalize()}
  const sp=W.spr+gun.bl;gun.bl=Math.min(0.05,gun.bl+W.bl);gunHits.clear();let snds=0,lx=0,lz=0;
  for(let i=0;i<W.pel;i++){const dd=gunSpread(d,sp,gunDS),H=gunRay(o,dd,R),x=o.x+dd.x*H.t,y=o.y+dd.y*H.t,z=o.z+dd.z*H.t;lx=x;lz=z;
    if(H.k==='p'){const p=H.p,k=gunZone(p,H.hy,x,z),dm=TU[W.dm]*(H.t<R*0.5?1:1-(H.t-R*0.5)/R)*GUN_ZX[k](),e=gunHits.get(p);
      if(!e)gunHits.set(p,{dm,k,top:dm,hy:H.hy,x,y,z,ux:dd.x,uz:dd.z});else{e.dm+=dm;if(dm>e.top){e.top=dm;e.k=k;e.hy=H.hy}}
      gunBleed(x,y,z,dd,dm,p.y);
      // through and onto what is behind them
      if(H.tw-H.t<2.6&&H.tw<R){const t=H.tw,wx=o.x+dd.x*t,wy=o.y+dd.y*t,wz=o.z+dd.z*t;
        const n=gunHitR.n;if(n[0]||n[2])gunMark('splat',wx,wy,wz,n[0],0,n[2],0.25+Math.min(0.35,dm/200))}}
    else if(H.k==='wall'){gunMark('hole',x,y,z,H.n[0],0,H.n[2],W.pel>1?0.05:0.07);dustPuff(x+H.n[0]*0.05,y,z+H.n[2]*0.05,W.pel>1?0.4:1,[-0.15,-0.2,-0.25]);if(snds++<3)gunSnd('hard',x,y,z)}
    else if(H.k==='ground'){gunGroundN(x,z);gunMark('hole',x,y,z,gunGN[0],gunGN[1],gunGN[2],W.pel>1?0.06:0.09);dustPuff(x,y,z,W.pel>1?0.6:1.5,null);if(snds++<3)gunSnd('dirt',x,y,z)}}
  for(const [p,e] of gunHits){gunHit(p,e);gunSnd('flesh',e.x,e.y,e.z)}
  gunScare(lx,lz,null)}
// the ground's tilt at x, z into gunGN
const gunGN=[0,1,0];
function gunGroundN(x,z){const a=surfAt(x-0.2,z)-surfAt(x+0.2,z),b=surfAt(x,z-0.2)-surfAt(x,z+0.2),l=Math.hypot(a,0.4,b);gunGN[0]=a/l;gunGN[1]=0.4/l;gunGN[2]=b/l}
// the chase view's aim: whoever is nearest the way he faces (within 6°, or 12° up close) and in the clear, at the chest,
// or the head when he is right on them; [x, y, z] to shoot at, or null
function gunAssist(o,y,R){let best=null,bs=1e9;const fx=Math.sin(y),fz=Math.cos(y);
  if(tf.on)for(const p of tf.people){if(p.inside||p.drv||p.dead)continue;const dx=p.x-o.x,dz=p.z-o.z,f=dx*fx+dz*fz;if(f<0.5||f>R)continue;
    const side=Math.abs(dx*fz-dz*fx),ang=Math.atan2(side,f),lim=f<15?0.21:0.105;if(ang>lim)continue;
    const L=Math.hypot(dx,dz);let clear=true;for(const s of SOLIDS)if(!s.foot&&gunSolidT(s,o.x,o.z,dx/L,dz/L)<L-0.4){clear=false;break}
    if(clear&&ang*f+f*0.01<bs){bs=ang*f+f*0.01;best={p,ang}}}
  if(!best)return null;const p=best.p,lo=p.sit?p.y-0.42*p.sc:p.y,h=(p.sit?1.3:1.72)*p.sc;
  return p.hurt>0.6?[p.x,p.y+0.15,p.z]:[p.x,lo+h*(best.ang<0.025?0.93:0.7),p.z]}
// where on p a shot at height hy (0 their feet, 1 the top of their head) and x, z lands: head, chest, gut, leg, arm, or
// slump (seated); and what each counts for
function gunZone(p,hy,x,z){const fx=Math.sin(p.yaw),fz=Math.cos(p.yaw),lat=((x-p.x)*-fz+(z-p.z)*fx)/(0.28*p.sc);
  return p.sit?'slump':hy>GUN_HEAD?'head':hy<0.48?'leg':Math.abs(lat)>0.62&&hy<0.84?'arm':hy<0.62?'gut':'chest'}
const GUN_ZX={head:()=>TU.gunHeadX,chest:()=>1.15,gut:()=>1,arm:()=>0.55,leg:()=>0.6,slump:()=>1.1};
// p shot (e: the damage dm, where k, at x, y, z, the shot going along ux, uz). Where it hits decides what they do
// (tfHitPose, townfolk.js): the head drops them where they stand; the chest staggers them back and over; the gut
// doubles them up, onto their knees and down on their face; a leg gives way under them and they crawl off, hurt; an
// arm or shoulder spins them round and they run. Seated, they slump where they sit. Each person has about TU.gunHp:
// shot down to nothing they fall by where it hit; short of that a leg or a bad gut wound puts them down crawling, any
// other spins them round and they run, bleeding; anyone already down and hit again is finished
function gunHit(p,e){const {k,x,z}=e;if(!p.hpMax){p.hpMax=TU.gunHp*(0.85+Math.random()*0.3);p.hp=p.hpMax}p.hp-=e.dm;
  const fx=Math.sin(p.yaw),fz=Math.cos(p.yaw),lat=((x-p.x)*-fz+(z-p.z)*fx)/(0.28*p.sc),side=lat>=0?1:-1,fwd=e.ux*fx+e.uz*fz>0?1:-1,H={t:0,side,fwd,ux:e.ux,uz:e.uz};
  const down=()=>{p.dead=1e-3;gun.downs++;if(p.room)tf.shopKills=(tf.shopKills||0)+1;p.bleed=0;gunPoolAt(p);gunSnd('fall',p.x,p.y+0.2,p.z,k==='head'?0.5:k==='gut'?1.4:0.8)};
  if(p.hurt){if(p.hit)p.hit.jolt=0.25;if(p.hp<=0){p.hurt=0;down()}return}
  if(p.hp<=0){p.hit=Object.assign(H,{k:k==='arm'?'chest':k});Object.assign(p,{wait:0,spd:0,amp:0,flee:0});if(p.vt0){p.vt=p.vt0;p.vt0=0};down();return}
  p.bleed=30;
  if(k==='leg'||k==='slump'||k==='gut'&&p.hp<p.hpMax*0.5){p.hit=Object.assign(H,{k:k==='slump'?'slump':'leg'});Object.assign(p,{wait:0,spd:0,amp:0,flee:0});if(p.vt0){p.vt=p.vt0;p.vt0=0}p.hurt=1e-3;return}
  p.hit=Object.assign(H,{k:'arm'});gunRun(p,14)}
// everyone within earshot near where it went (or near him) runs off for a while
function gunScare(x,z,not){for(const p of tf.people){if(p===not||p.dead||p.hurt||p.inside||p.drv||p.room)continue;
  const d=Math.min(Math.hypot(p.x-x,p.z-z),Math.hypot(p.x-wk.x,p.z-wk.z)*1.6);if(d<30)gunRun(p,6+Math.random()*6)}}
// p runs away from the worker: back along their walk if that is the way away, at TU.gunFlee
function gunRun(p,s){if(p.room||p.drv||p.hurt||p.dead)return;p.wait=0;if(!p.vt0)p.vt0=p.vt;p.vt=TU.gunFlee*(0.85+Math.random()*0.3);p.flee=Math.max(p.flee||0,s);
  if(p.w&&!p.path){const [,,ex,ez]=tfAt(p.w,p.s);p.dir=ex*(p.x-wk.x)+ez*(p.z-wk.z)>=0?1:-1}}
// ---------- the kick: the view, the light, the smoke, the empty cases ----------
// a shot kicks the view up (most of it springs back, rk stays and climbs while the carbine runs; first person only, a
// nudge in the chase view) and shakes it (TU.gunKick, TU.gunShake); the muzzle lights up round him and leaves a wisp
Object.assign(gun,{cp:0,cy:0,sh:0,ejQ:[],ft:0});
function gunRecoil(W){const fp=camMode==='cab',k=TU.gunKick;gun.cp+=W.rc*k*(fp?1:0.35);gun.cy+=(Math.random()-0.5)*W.rc*0.5*k*(fp?1:0.35);
  if(fp)fpl.pitch=Math.min(1.3,fpl.pitch+W.rk*k);gun.sh=Math.min(1.5,gun.sh+W.sh*TU.gunShake);gun.ft=0;
  gunL(gunV,...W.muz).add(gunH);gunFlashL.position.copy(gunV);if(gunFlashL.parent)gunFlashL.intensity=W.long?16:11;
  gunFlash.scale.setScalar(W.long?1.3+Math.random()*0.5:0.9+Math.random()*0.4);dustPuff(gunV.x,gunV.y,gunV.z,W.pel>1?0.8:0.4,[0.25,0.25,0.25])}
// after the camera is set (main.js): the kick and shake on top of it, dying away
function gunCamFx(dt){if(gun.cp<1e-4&&gun.sh<1e-3&&Math.abs(gun.cy)<1e-4)return;const e=Math.exp(-dt*14);gun.cp*=e;gun.cy*=e;gun.sh*=Math.exp(-dt*11);
  const t=performance.now()/1000,s=gun.sh*(camMode==='cab'?1:0.6);camera.rotateY(gun.cy+Math.sin(t*71)*0.004*s);camera.rotateX(gun.cp+Math.sin(t*93+1)*0.005*s);camera.rotateZ(Math.sin(t*57+2)*0.006*s);
  camera.position.y+=Math.sin(t*83)*0.006*s;camera.updateMatrixWorld()}
// the flash's light: a warm point light at the muzzle for a frame or two, on High and Ultra graphics (a light more for
// every material to shade, so not on Low and Medium; it joins and leaves the scene when the setting changes)
const gunFlashL=new THREE.PointLight(0xffb060,0,9,2);gunFlashL.castShadow=false;
function gunLightTick(dt){const want=!!(gfxCur&&gfxCur.pbr);if(want!==!!gunFlashL.parent){if(want)scene.add(gunFlashL);else scene.remove(gunFlashL)}
  gun.ft+=dt;if(gunFlashL.parent)gunFlashL.intensity=gunFlashL.intensity>0.05&&gun.ft<0.08?gunFlashL.intensity*Math.exp(-dt*45):0}
// the empty cases: brass (pistol, rifle, carbine) and the shotgun's red hulls with brass heads, thrown out to his right
// as each shot goes (the shotgun's at the pump, the rifle's at the bolt), tumbling, bouncing with a tink and lying where
// they stop; the oldest picked up again (instanced, GUN_CS cases at most; not saved)
const GUN_CS=160,GUN_CSK={p:[0.0045,0.019],c:[0.0048,0.045],r:[0.0056,0.054],s:[0.0105,0.065]};
const gunCs=[],gunCsM={};
{const M=(c,me,ro)=>{const m=new THREE.MeshStandardMaterial({color:c,metalness:me,roughness:ro});m.envMap=skyEnv;m.envMapIntensity=1;return m};
  const mk=(id,m,cap)=>{const g=new THREE.CylinderGeometry(1,1,1,10);if(cap)g.scale(1.04,cap,1.04).translate(0,-0.5+cap/2,0);const im=new THREE.InstancedMesh(g,m,GUN_CS);im.count=0;im.frustumCulled=false;im.castShadow=true;scene.add(im);gunCsM[id]=im};
  mk('brass',M(0xc8963c,0.95,0.3));mk('hull',M(0x9a1c18,0.05,0.45));mk('head',M(0xc8963c,0.95,0.3),0.25)}
let gunCsH=0;
function gunEject(k){if(!gunHas()||gun.k!==k)return;const W=GUNS[k],C=GUN_CSK[W.cs];gunL(gunP,...W.ej).add(gunH);
  const o=gunCs[gunCsH]||(gunCs[gunCsH]={p:new THREE.Vector3(),v:new THREE.Vector3(),q:new THREE.Quaternion(),w:new THREE.Vector3()});o.i=gunCsH;gunCsH=(gunCsH+1)%GUN_CS;
  o.p.copy(gunP);o.v.copy(gunX).multiplyScalar(-(1.6+Math.random()*1.2)).addScaledVector(gunY,1.2+Math.random()*1.2).addScaledVector(gunZ,-0.3-Math.random()*0.4);
  o.q.setFromUnitVectors(GUN_UP,gunZ);o.w.set((Math.random()-0.5)*30,(Math.random()-0.5)*10,(Math.random()-0.5)*30);o.r=C[0];o.l=C[1];o.s=W.cs==='s';o.live=1;o.b=0;
  for(const id of ['brass','hull','head'])gunCsM[id].count=Math.max(gunCsM[id].count,Math.min(GUN_CS,gunCs.length))}
const gunCsQ=new THREE.Quaternion(),gunCsS=new THREE.Vector3(),gunCsZ=new THREE.Matrix4().makeScale(0,0,0);
function gunCsTick(dt){for(let j=gun.ejQ.length-1;j>=0;j--){const e=gun.ejQ[j];e[0]-=dt;if(e[0]<=0){gun.ejQ.splice(j,1);gunEject(e[1])}}
  let ch=false;for(const o of gunCs){if(!o||!o.live)continue;ch=true;o.v.y-=9.8*dt;o.p.addScaledVector(o.v,dt);
    const wl=o.w.length();if(wl>1e-3)o.q.multiply(gunCsQ.setFromAxisAngle(gunCsS.copy(o.w).divideScalar(wl),wl*dt));
    const g=surfAt(o.p.x,o.p.z)+o.r;if(o.p.y<g){o.p.y=g;if(o.v.y<-0.6&&o.b<3){o.b++;gunTink(o.p,o.s,-o.v.y)}o.v.y=-o.v.y*0.32;o.v.x*=0.55;o.v.z*=0.55;o.w.multiplyScalar(0.5);
      if(Math.abs(o.v.y)<0.35){o.live=0;o.q.setFromAxisAngle(GUN_UP,Math.random()*6.283).multiply(gunCsQ.setFromAxisAngle(WK_X,Math.PI/2))}}
    gunCsSet(o)}
  if(ch)for(const id of ['brass','hull','head'])gunCsM[id].instanceMatrix.needsUpdate=true}
function gunCsSet(o){gunMM.compose(o.p,o.q,gunCsS.set(o.r,o.l,o.r));gunCsM.brass.setMatrixAt(o.i,o.s?gunCsZ:gunMM);gunCsM.hull.setMatrixAt(o.i,o.s?gunMM:gunCsZ);gunCsM.head.setMatrixAt(o.i,o.s?gunMM:gunCsZ)}
// a case landing: a bright tink off brass, a dull tap off a plastic hull
function gunTink(p,hull,v){if(!gunSndOk())return;const c=actx,d=p.distanceTo(camera.position),g=sndVol(sndCfg.fx)*Math.min(1,v/3)*0.35/(1+(d/8)**2);if(g<0.002)return;
  const t=c.currentTime+Math.random()*0.01,out=sndGain(1,snd.dry);if(hull)gunNz(out,t,'bandpass',900,2,0.05,g);else{gunTone(out,t,5200+Math.random()*1800,4800,0.09,g*0.5);gunNz(out,t,'bandpass',6500,4,0.03,g*0.6)}
  setTimeout(()=>out.disconnect(),400)}
// ---------- reloading ----------
function gunReload(){const W=gunW(),A=gun.am[gun.k];if(!gunHas()||gun.rl>0)return;if(A[0]>=W.mag){toast(say('gunFull',{gun:W.s}),'',1400);return}
  if(A[1]<=0){toast(say('gunNoAmmo',{gun:W.s}),'',2600);return}gun.rl=gun.rlT=W.rl;gun.rlC=0;gun.trig=false;gunHudDraw()}
// a step of it, with its sounds: a magazine out, a fresh one in and the slide or bolt sent home; the shotgun a shell at
// a time, the rifle its five rounds pressed in behind the open bolt
const GUN_RLS={pistol:[[0.12,'magOut'],[0.68,'magIn'],[0.9,'rack']],carbine:[[0.12,'magOut'],[0.64,'magIn'],[0.88,'rack']],shotgun:[[0.75,'shell']],
  rifle:[[0.08,'bolt'],[0.35,'shell'],[0.48,'shell'],[0.61,'shell'],[0.9,'bolt']]};
function gunReloadStep(dt){const W=gunW(),A=gun.am[gun.k],cue=GUN_RLS[gun.k];gun.rl-=dt;const u=1-gun.rl/gun.rlT;
  while(gun.rlC<cue.length&&u>=cue[gun.rlC][0])gunClick(cue[gun.rlC++][1]);
  if(gun.rl>0)return;gun.rl=0;
  if(W.shell){A[0]++;A[1]--;if(A[0]<W.mag&&A[1]>0){gun.rl=gun.rlT=W.rl;gun.rlC=0}}else{const n=Math.min(W.mag-A[0],A[1]);A[0]+=n;A[1]-=n}
  gunHudDraw()}
// ---------- blood and bullet holes (nothing here is saved) ----------
// drops and mist: points flung from the wound (out the far side, a little back toward him), falling, and where a drop
// lands it leaves a spot; mist swells and fades in a moment
const GB_N=360,gbP=new Float32Array(GB_N*3),gbV=new Float32Array(GB_N*3),gbS=new Float32Array(GB_N),gbA=new Float32Array(GB_N),gbM=new Float32Array(GB_N),gbAge=new Float32Array(GB_N),gbLife=new Float32Array(GB_N),gbF=new Float32Array(GB_N);let gbH=0,gbLive=0;
const gbGeo=new THREE.BufferGeometry();gbGeo.setAttribute('position',new THREE.BufferAttribute(new Float32Array(GB_N*3),3).setUsage(THREE.DynamicDrawUsage));
gbGeo.setAttribute('aS',new THREE.BufferAttribute(new Float32Array(GB_N),1).setUsage(THREE.DynamicDrawUsage));gbGeo.setAttribute('aA',new THREE.BufferAttribute(new Float32Array(GB_N),1).setUsage(THREE.DynamicDrawUsage));
gbGeo.setAttribute('aM',new THREE.BufferAttribute(new Float32Array(GB_N),1).setUsage(THREE.DynamicDrawUsage));
const gbMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{uH:{value:600},uL:{value:1}},
  vertexShader:'attribute float aS;attribute float aA;attribute float aM;varying float vA;varying float vM;uniform float uH;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mv;gl_PointSize=max(1.5,aS*projectionMatrix[1][1]*uH*0.5/max(0.05,-mv.z));vA=aA;vM=aM;}',
  fragmentShader:'varying float vA;varying float vM;uniform float uL;void main(){vec2 c=gl_PointCoord*2.-1.;float r=dot(c,c);if(r>1.)discard;float a=vA*(vM>0.5?(1.-r)*0.5:smoothstep(1.,0.55,r));vec3 col=(vM>0.5?vec3(0.36,0.035,0.03):vec3(0.24,0.012,0.01))*uL;gl_FragColor=vec4(col,a);}'});
const gbPts=new THREE.Points(gbGeo,gbMat);gbPts.frustumCulled=false;gbPts.renderOrder=3;scene.add(gbPts);
function gbAdd(x,y,z,vx,vy,vz,s,m,life,floor){const i=gbH;gbH=(gbH+1)%GB_N;gbP[i*3]=x;gbP[i*3+1]=y;gbP[i*3+2]=z;gbV[i*3]=vx;gbV[i*3+1]=vy;gbV[i*3+2]=vz;gbS[i]=s;gbM[i]=m;gbAge[i]=0;gbLife[i]=life;gbF[i]=floor;gbLive=1}
// a wound at x, y, z from a shot along d doing dm: the spray, and the floor (fy) the drops land on
function gunBleed(x,y,z,d,dm,fy){const n=Math.min(36,8+dm*0.25|0),l=Math.hypot(d.x,d.z)||1,ux=d.x/l,uz=d.z/l;
  for(let i=0;i<n;i++){const back=i%5===0?-0.45:1,sp=(1.2+Math.random()*3.4)*back,a=(Math.random()-0.5)*1.1,b=(Math.random()-0.3)*0.9,ca=Math.cos(a),sa=Math.sin(a);
    gbAdd(x,y,z,(ux*ca-uz*sa)*sp,b*Math.abs(sp)+0.4,(uz*ca+ux*sa)*sp,0.008+Math.random()*0.02,0,3,fy)}
  for(let i=0;i<3;i++){const s=i?0.6:-0.25;gbAdd(x,y,z,ux*s,0.05,uz*s,0.12+dm*0.0015,1,0.32+Math.random()*0.15,-1e9)}}
// marks: bullet holes (a dark hole in a sooty ring), blood spatter and pools, each kind one instanced mesh of quads laid
// on the surface (the oldest re-used); blood darkens from wet red to brown as it dries
function gunTex(f,n){const C=document.createElement('canvas');C.width=C.height=n;const g=C.getContext('2d');f(g,n);const t=new THREE.CanvasTexture(C);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t}
function gunBlob(g,x,y,r,k,rnd){g.beginPath();for(let i=0;i<=k;i++){const a=i/k*6.283,q=r*(0.8+rnd()*0.35);g[i?'lineTo':'moveTo'](x+Math.cos(a)*q,y+Math.sin(a)*q)}g.closePath();g.fill()}
const GUN_MK={};
{let rs=5;const rnd=()=>{rs=(rs*16807)%2147483647;return rs/2147483647};
  const hole=gunTex((g,n)=>{const c=n/2,r=g.createRadialGradient(c,c,0,c,c,c);r.addColorStop(0,'rgba(8,7,6,1)');r.addColorStop(0.16,'rgba(12,10,9,1)');r.addColorStop(0.22,'rgba(60,52,44,0.85)');
    r.addColorStop(0.45,'rgba(40,36,32,0.35)');r.addColorStop(1,'rgba(40,36,32,0)');g.fillStyle=r;g.fillRect(0,0,n,n);g.strokeStyle='rgba(20,18,16,0.6)';g.lineWidth=1;
    for(let i=0;i<6;i++){const a=rnd()*6.28;g.beginPath();g.moveTo(c+Math.cos(a)*n*0.1,c+Math.sin(a)*n*0.1);g.lineTo(c+Math.cos(a+0.2)*n*(0.25+rnd()*0.2),c+Math.sin(a+0.2)*n*(0.25+rnd()*0.2));g.stroke()}},64);
  const splat=gunTex((g,n)=>{const c=n/2;g.fillStyle='rgba(120,12,10,0.92)';gunBlob(g,c,c,n*0.2,18,rnd);
    for(let i=0;i<26;i++){const a=rnd()*6.28,q=n*(0.18+rnd()*0.3),r=n*(0.008+rnd()*0.035);g.globalAlpha=0.7+rnd()*0.3;gunBlob(g,c+Math.cos(a)*q,c+Math.sin(a)*q,r,8,rnd)}
    g.globalAlpha=0.6;for(let i=0;i<5;i++){const a=rnd()*6.28;g.lineWidth=n*0.012;g.strokeStyle='rgba(110,10,8,0.8)';g.beginPath();g.moveTo(c+Math.cos(a)*n*0.15,c+Math.sin(a)*n*0.15);g.lineTo(c+Math.cos(a)*n*0.44,c+Math.sin(a)*n*0.44);g.stroke()}},128);
  const pool=gunTex((g,n)=>{const c=n/2,r=g.createRadialGradient(c,c,0,c,c,c*0.48);r.addColorStop(0,'rgba(92,6,6,0.97)');r.addColorStop(0.85,'rgba(80,5,5,0.95)');r.addColorStop(1,'rgba(60,4,4,0.9)');
    g.fillStyle=r;gunBlob(g,c,c,n*0.4,28,rnd);for(let i=0;i<6;i++){const a=rnd()*6.28;gunBlob(g,c+Math.cos(a)*n*0.33,c+Math.sin(a)*n*0.33,n*(0.05+rnd()*0.06),12,rnd)}},128);
  const mk=(id,tex,max,rough,blood)=>{const m=new THREE.MeshStandardMaterial({map:tex,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-4,roughness:rough,metalness:0});
    if(blood){m.envMap=skyEnv;m.envMapIntensity=0.6}
    const im=new THREE.InstancedMesh(new THREE.PlaneGeometry(1,1),m,max);im.count=0;im.frustumCulled=false;im.renderOrder=2;im.receiveShadow=true;
    im.instanceColor=new THREE.InstancedBufferAttribute(new Float32Array(max*3).fill(1),3);scene.add(im);GUN_MK[id]={im,max,h:0,t:new Float32Array(max),blood,mx:[]}};
  mk('hole',hole,220,0.95,0);mk('splat',splat,300,0.3,1);mk('pool',pool,24,0.12,1)}
const gunMq=new THREE.Quaternion(),gunMq2=new THREE.Quaternion(),gunMp=new THREE.Vector3(),gunMs=new THREE.Vector3(),gunMn=new THREE.Vector3(),GUN_Z=new THREE.Vector3(0,0,1),gunMM=new THREE.Matrix4();
// a mark of kind id at x, y, z on a surface facing n, size s across; its slot
function gunMark(id,x,y,z,nx,ny,nz,s){const K=GUN_MK[id],i=K.h;K.h=(K.h+1)%K.max;if(K.im.count<K.max)K.im.count++;
  gunMn.set(nx,ny,nz).normalize();gunMq.setFromUnitVectors(GUN_Z,gunMn);gunMq.multiply(gunMq2.setFromAxisAngle(GUN_Z,Math.random()*6.283));
  gunMp.set(x,y,z).addScaledVector(gunMn,id==='pool'?0.02:0.012);gunMM.compose(gunMp,gunMq,gunMs.set(s,s,s));K.im.setMatrixAt(i,gunMM);K.im.instanceMatrix.needsUpdate=true;
  K.t[i]=0;K.im.instanceColor.setXYZ(i,1,1,1);K.im.instanceColor.needsUpdate=true;return i}
// a pool spreading from under someone who has fallen, where their body lies (by how they went over, tfHitPose)
const gunPools=[];
function gunPoolAt(p){if(gunPools.length>=GUN_MK.pool.max)gunPools.shift();gunPools.push({p,t:0,i:-1,r:0.55+Math.random()*0.35})}
function gunPoolStep(o,dt){o.t+=dt;const p=o.p;if(o.t<0.9)return;
  if(o.i<0){const H=tfHitPose(p),fx=Math.sin(H.yaw),fz=Math.cos(H.yaw),st=Math.sin(H.tilt),sr=Math.sin(H.roll);let dx=fx*st+(-fz)*sr,dz=fz*st+fx*sr;const l=Math.hypot(dx,dz)||1;
    o.x=p.x+dx/l*0.75*p.sc;o.z=p.z+dz/l*0.75*p.sc;o.y=p.room?p.y:Math.max(p.y,surfAt(o.x,o.z));o.i=gunMark('pool',o.x,o.y,o.z,0,1,0,0.05);o.a=Math.random()*6.283}
  const K=GUN_MK.pool,s=o.r*2*(1-Math.exp(-(o.t-0.9)/9));gunMq.setFromUnitVectors(GUN_Z,GUN_UP).multiply(gunMq2.setFromAxisAngle(GUN_Z,o.a));
  gunMM.compose(gunMp.set(o.x,o.y+0.02,o.z),gunMq,gunMs.set(s,s,s));K.im.setMatrixAt(o.i,gunMM);K.im.instanceMatrix.needsUpdate=true}
// every frame (gunTick): the drops fly and land, the pools spread, the wounded leave a trail, the blood dries
let gunDryT=0;
function gunFxTick(dt){if(gbLive){gbLive=0;const P=gbGeo.attributes.position.array,S=gbGeo.attributes.aS.array,A=gbGeo.attributes.aA.array,M=gbGeo.attributes.aM.array;let n=0;
  for(let i=0;i<GB_N;i++){if(gbAge[i]>=gbLife[i])continue;gbAge[i]+=dt;const u=gbAge[i]/gbLife[i];if(u>=1)continue;gbLive=1;const j=i*3;
    if(gbM[i]>0.5){gbP[j]+=gbV[j]*dt;gbP[j+1]+=gbV[j+1]*dt;gbP[j+2]+=gbV[j+2]*dt}
    else{gbV[j+1]-=9.8*dt;gbP[j]+=gbV[j]*dt;gbP[j+1]+=gbV[j+1]*dt;gbP[j+2]+=gbV[j+2]*dt;
      if(gbP[j+1]<gbF[i]+0.01){gbAge[i]=gbLife[i];if(Math.random()<0.45)gunMark('splat',gbP[j],gbF[i],gbP[j+2],0,1,0,0.04+gbS[i]*5);continue}}
    P[n*3]=gbP[j];P[n*3+1]=gbP[j+1];P[n*3+2]=gbP[j+2];S[n]=gbM[i]>0.5?gbS[i]*(1+u*2.5):gbS[i];A[n]=gbM[i]>0.5?0.55*(1-u):0.95;M[n]=gbM[i];n++}
  gbGeo.setDrawRange(0,n);for(const k of ['position','aS','aA','aM'])gbGeo.attributes[k].needsUpdate=true;gbMat.uniforms.uH.value=renderer.domElement.height;
  gbMat.uniforms.uL.value=typeof sun==='object'&&sun.intensity!==undefined?clamp(0.35+sun.intensity*0.4,0.35,1.2):1}
  for(const o of gunPools)if(o.t<40)gunPoolStep(o,dt);
  // the wounded drip as they go, the ones crawling smear a trail
  for(const p of tf.people){if(!(p.bleed>0||p.hurt&&!p.dead))continue;if(p.bleed>0)p.bleed-=dt;const d=Math.hypot(p.x-(p.bx??p.x),p.z-(p.bz??p.z));
    if(p.bx===undefined||d>(p.hurt?0.3:0.8)){if(p.bx!==undefined)gunMark('splat',p.x+(Math.random()-0.5)*0.2,p.y,p.z+(Math.random()-0.5)*0.2,0,1,0,p.hurt?0.3:0.12+Math.random()*0.1);p.bx=p.x;p.bz=p.z}}
  if((gunDryT+=dt)<1)return;const st=gunDryT;gunDryT=0;
  for(const id of ['splat','pool']){const K=GUN_MK[id],C=K.im.instanceColor;for(let i=0;i<K.im.count;i++){K.t[i]+=st;const u=Math.min(1,K.t[i]/120);C.setXYZ(i,1-u*0.5,1-u*0.62,1-u*0.6)}C.needsUpdate=true}}
// ---------- sounds ----------
// the bang: a crack of noise, a low thump under it, and the space's echo, each gun its own
function gunBang(W){if(!snd||!snd.ready||!sndCfg.on||!actx||actx.state!=='running')return;const c=actx,t=c.currentTime,B=W.bang,id='gunBuf'+B.dk;
  if(!snd[id]){const sr=c.sampleRate,a=noiseBuf(sr,0.9,91);for(let i=0;i<a.length;i++){const s=i/sr;a[i]*=Math.exp(-s*(s<0.012?20:B.dk))*(s<0.002?s/0.002:1)}snd[id]=toBuf(c,a)}
  const v=sndVol(sndCfg.fx)*B.v,g=sndGain(0,snd.dry),e=sndGain(v*B.e,snd.send),hp=sndFilter('highpass',B.hp,0.7),lp=sndFilter('lowpass',B.lp,0.6);
  const s=c.createBufferSource();s.buffer=snd[id];s.playbackRate.value=B.r*(0.94+Math.random()*0.1);s.connect(hp);hp.connect(lp);lp.connect(g);lp.connect(e);
  g.gain.setValueAtTime(v,t);s.start(t);
  const o=c.createOscillator(),og=sndGain(0,snd.dry);o.type='sine';o.frequency.setValueAtTime(B.th,t);o.frequency.exponentialRampToValueAtTime(B.th*0.35,t+0.16);o.connect(og);
  og.gain.setValueAtTime(v*0.9,t);og.gain.exponentialRampToValueAtTime(0.001,t+0.22);o.start(t);o.stop(t+0.25);
  s.onended=()=>{g.disconnect();e.disconnect();og.disconnect()}}
// noise through a filter, dying away over len, and a falling tone: the pieces the other sounds are made of
function gunNz(out,t,type,f,q,len,g,r){const c=actx;if(!snd.gunNz)snd.gunNz=toBuf(c,noiseBuf(c.sampleRate,1,77));const s=c.createBufferSource();s.buffer=snd.gunNz;s.playbackRate.value=r||1;
  const fl=sndFilter(type,f,q),gg=sndGain(0);s.connect(fl);fl.connect(gg);gg.connect(out);gg.gain.setValueAtTime(g,t);gg.gain.exponentialRampToValueAtTime(0.001,t+len);s.start(t,Math.random()*0.5,len+0.05)}
function gunTone(out,t,f0,f1,len,g,type){const o=actx.createOscillator(),gg=sndGain(0);o.type=type||'sine';o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(f1,t+len);
  o.connect(gg);gg.connect(out);gg.gain.setValueAtTime(g,t);gg.gain.exponentialRampToValueAtTime(0.001,t+len);o.start(t);o.stop(t+len+0.02)}
const gunSndOk=()=>snd&&snd.ready&&sndCfg.on&&actx&&actx.state==='running';
// where a shot lands, heard from the camera (late by the distance, quieter and duller further off, to one side): flesh,
// dirt, something hard (now and then a ricochet whining off it), a body going down
function gunSnd(kind,x,y,z,delay){if(!gunSndOk())return;const c=actx,d=Math.hypot(x-camera.position.x,y-camera.position.y,z-camera.position.z),v=sndVol(sndCfg.fx)*1.2/(1+(d/14)*(d/14));if(v<0.003)return;
  const t=c.currentTime+(delay||0)+d/343,air=sndFilter('lowpass',Math.max(1500,16000/(1+d/20)),0.5,snd.dry),out=sndGain(1);
  if(c.createStereoPanner){sndR.setFromMatrixColumn(camera.matrixWorld,0);const pn=c.createStereoPanner();pn.pan.value=clamp(((x-camera.position.x)*sndR.x+(y-camera.position.y)*sndR.y+(z-camera.position.z)*sndR.z)/(d||1)*0.8,-0.8,0.8);out.connect(pn);pn.connect(air)}else out.connect(air);
  if(kind==='flesh'){gunNz(out,t,'lowpass',900,0.7,0.09,v);gunNz(out,t,'bandpass',2100,1.6,0.05,v*0.7);gunTone(out,t,95,45,0.08,v*0.6)}
  else if(kind==='dirt'){gunNz(out,t,'lowpass',650,0.6,0.13,v*0.9);gunNz(out,t+0.01,'highpass',4200,0.5,0.28,v*0.12)}
  else if(kind==='hard'){gunNz(out,t,'highpass',2600,0.8,0.03,v);gunNz(out,t,'bandpass',1200,2,0.07,v*0.5);
    if(Math.random()<0.3){const f=3000+Math.random()*1500,o=c.createOscillator(),lf=c.createOscillator(),lg=sndGain(60),gg=sndGain(0);o.frequency.setValueAtTime(f,t);o.frequency.exponentialRampToValueAtTime(f*0.3,t+0.5);
      lf.frequency.value=24;lf.connect(lg);lg.connect(o.frequency);o.connect(gg);gg.connect(out);gg.gain.setValueAtTime(0.0001,t);gg.gain.linearRampToValueAtTime(v*0.18,t+0.03);gg.gain.exponentialRampToValueAtTime(0.001,t+0.5);o.start(t);lf.start(t);o.stop(t+0.52);lf.stop(t+0.52)}}
  else if(kind==='fall'){gunNz(out,t,'lowpass',260,0.7,0.26,v*1.1);gunTone(out,t,72,38,0.18,v*0.8);gunNz(out,t+0.12,'lowpass',400,0.6,0.15,v*0.4)}
  setTimeout(()=>{out.disconnect();air.disconnect()},(delay||0)*1000+d/343*1000+1500)}
// the gun's own works, close by: the dry click on an empty chamber, a magazine out and in, a slide or charging handle,
// the shotgun's pump and a shell pushed in, the rifle's bolt
function gunClick(kind,delay){if(!gunSndOk())return;const c=actx,t=c.currentTime+(delay||0),v=sndVol(sndCfg.fx)*0.55,out=sndGain(1,snd.dry);
  const k=(dt,f,len,g,q)=>gunNz(out,t+dt,'bandpass',f,q||3,len,v*g);
  if(kind==='dry')k(0,3200,0.02,0.8);
  else if(kind==='magOut'){k(0,2400,0.02,0.7);k(0.03,900,0.1,0.35,1)}
  else if(kind==='magIn'){k(0,1500,0.04,1,2);k(0.04,2800,0.02,0.6)}
  else if(kind==='rack'){k(0,1900,0.05,0.7,2);k(0.11,2600,0.03,0.9)}
  else if(kind==='pump'){k(0,1100,0.06,0.8,2);k(0.16,1500,0.05,1,2)}
  else if(kind==='shell'){k(0,2100,0.03,0.7);k(0.03,800,0.05,0.4,1)}
  else if(kind==='bolt'){k(0,2600,0.03,0.7);k(0.09,1300,0.07,0.6,2);k(0.2,2200,0.03,0.8)}
  setTimeout(()=>out.disconnect(),((delay||0)+0.6)*1000)}
// ---------- Lakeside Guns: the counter (GUN_SHOPS, interiors.js) ----------
// the shop counter he is standing at, or null
function gunShopNear(){for(const S of GUN_SHOPS)if(Math.hypot(wk.x-S.x,wk.z-S.z)<1.8&&Math.abs(wk.y-S.y)<1.6)return S;return null}
function gunShopOpen(){const S=gunShopNear();if(!S)return;gun.shop=S;if(document.pointerLockElement)document.exitPointerLock();gunShopDraw();$('#gunShop').hidden=false}
function gunShopClose(){gun.shop=null;$('#gunShop').hidden=true}
function gunShopDraw(){$('#gsList').innerHTML=GUN_K.map(k=>{const W=GUNS[k],A=gun.am[k],own=gun.own[k],full=A[1]>=W.max;
  return `<div class="gsRow"><div class="gsTxt"><b>${W.n}</b><small>${W.d} · ${own?A[0]+' / '+A[1]:'damage '+Math.round(TU[W.dm]*W.pel)}</small></div>`+
    `<button data-k="${k}" data-a="take"${own&&gun.k===k&&gun.eq?' disabled':''}>${own?(gun.k===k&&gun.eq?'In hand':'Hold'):'Take'}</button>`+
    `<button data-k="${k}" data-a="ammo"${!own||full?' disabled':''}>${full?'Ammo full':'Ammo'}</button></div>`}).join('')}
$('#gsList').addEventListener('click',e=>{const b=e.target.closest('button');if(!b||b.disabled)return;const k=b.dataset.k,W=GUNS[k];
  if(b.dataset.a==='take'){const fresh=!gun.own[k];gun.own[k]=1;gunTake(k);if(fresh)toast(say('gunGot',{gun:W.n}),'good',3600)}
  else{const A=gun.am[k],n=W.max-A[1];A[1]=W.max;gunClick('shell');gunHudDraw();toast(say('gunAmmoGot',{gun:W.s,n}),'',2400)}
  gunShopDraw()});
$('#gsClose').addEventListener('click',gunShopClose);
// ---------- saved with the rigs (save.js) ----------
function gunSave(){return {k:gun.k,e:gun.eq?1:0,o:GUN_K.filter(k=>gun.own[k]),a:GUN_K.map(k=>gun.am[k].slice())}}
function gunLoad(d){if(!d||typeof d!=='object')return;if(Array.isArray(d.o))for(const k of d.o)if(GUNS[k])gun.own[k]=1;gun.own.pistol=1;
  if(Array.isArray(d.a))GUN_K.forEach((k,i)=>{const a=d.a[i];if(Array.isArray(a)&&a.length===2&&a.every(isFinite))gun.am[k]=[clamp(a[0]|0,0,GUNS[k].mag),clamp(a[1]|0,0,GUNS[k].max)]});
  if(GUNS[d.k]&&gun.own[d.k])gun.k=d.k;if(d.e===0)gun.eq=false;$('#gunBtn').setAttribute('aria-pressed',gun.eq);gunHudDraw()}
$('#gunBtn').addEventListener('pointerdown',e=>{e.preventDefault();gunEquip(!gun.eq)});
$('#fireBtn').addEventListener('pointerdown',e=>{e.preventDefault();gun.trig=true;gunFire()});
for(const ev of ['pointerup','pointercancel','pointerleave'])$('#fireBtn').addEventListener(ev,()=>{gun.trig=false});
$('#reloadBtn').addEventListener('pointerdown',e=>{e.preventDefault();gunReload()});
$('#gunHud').addEventListener('pointerdown',e=>{e.preventDefault();gunNext()});
