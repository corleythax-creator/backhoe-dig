// Corley's Island: the worker's pistol. On foot he has it in his right hand from the start (put away while the
// trimmer is out, swimming or in a machine). Pistol (KEY gun, the Pistol button) takes it out or puts it away; while
// it is out Fire (KEY gunShoot, the Fire button, or a click on the view, pointer taken or not, ahead of blocks) shoots the way he faces (first person: at the crosshair, #gunCross; chase view: at the nearest person close
// to that way, gunAssist): he turns that way and brings the gun up, and the shot is a ray that stops at the first townsperson (townfolk.js), wall or other solid (SOLIDS,
// terrain.js) or the ground, out to TU.gunRange. A head shot or a second body shot drops them (tfFall: over
// backwards; the body stays TU.gunBody, then goes when out of sight); a first body shot and every shot near anyone
// sends the people round about running off (TU.gunFlee) for a while. Nothing here is saved.
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.
const GUN_GRIP=0.004,GUN_MUZZLE=0.18,GUN_HEAD=0.84;
const gun={eq:true,on:false,fp:false,aim:0,cool:0,kick:0,flash:0,told:false,shots:0,downs:0};
// ---------- the model: Poly Haven's photo-scanned service pistol (models/pistol, CC0), turned so the barrel runs along
// +z and the grip down -y, its origin in the palm; its own colour, metal/roughness and normal maps ----------
const gunMdl=new THREE.Group();gunMdl.visible=false;gunMdl.matrixAutoUpdate=false;scene.add(gunMdl);
mdlLoaderReady(()=>new THREE.GLTFLoader().load('models/pistol/pistol.gltf',gl=>{const g=gl.scene;g.rotation.y=-Math.PI/2;g.position.set(0,GUN_GRIP,0.004);
  g.traverse(o=>{if(!o.isMesh)return;o.castShadow=true;o.frustumCulled=false;const m=o.material;m.envMap=skyEnv;m.envMapIntensity=0.8;m.side=THREE.FrontSide});gunMdl.add(g)},undefined,e=>console.warn('pistol:',e)));
// the muzzle flash: two crossed cards and a star, glowing, a frame or two
const gunFlash=new THREE.Group();gunFlash.position.set(0,0.05,GUN_MUZZLE);gunFlash.visible=false;gunMdl.add(gunFlash);
{const m=new THREE.MeshBasicMaterial({color:0xffc870,transparent:true,opacity:0.95,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide});
  for(const r of [0,Math.PI/2]){const c=new THREE.Mesh(new THREE.PlaneGeometry(0.07,0.2),m);c.rotation.set(Math.PI/2,r,0);c.position.z=0.09;gunFlash.add(c)}
  const s=new THREE.Mesh(new THREE.CircleGeometry(0.06,7),m);gunFlash.add(s)}
// ---------- in hand ----------
function gunEquip(on,quiet){if(on&&trim.on)trimSet(false);gun.eq=!!on;$('#gunBtn').setAttribute('aria-pressed',gun.eq);if(!quiet)toast(say(on?'gunOut':'gunAway',{}),'',1800)}
const gunReady=()=>gunHas();
const gunHas=()=>gun.eq&&mode==='walk'&&!wk.inside&&!wk.swim&&!trim.on&&!bench.on;
const gunV=new THREE.Vector3(),gunE=new THREE.Vector3(),gunH=new THREE.Vector3(),gunX=new THREE.Vector3(),gunY=new THREE.Vector3(),gunZ=new THREE.Vector3(),gunD=new THREE.Vector3();
// the way he aims: where the camera looks, level with the view
function gunYaw(){return camMode==='cab'?wk.view:wk.view+orbitYaw}
// after updateWalker: while aiming he faces the shot and holds the gun out at the shoulder (right arm, wkArms[0])
function gunTick(dt){gun.cool=Math.max(0,gun.cool-dt);gun.flash=Math.max(0,gun.flash-dt);gun.kick=Math.max(0,gun.kick-dt*6);
  for(const p of tf.people)if(p.flee>0){p.flee-=dt;if(p.flee<=0){p.flee=0;if(p.vt0){p.vt=p.vt0;p.vt0=0}}}
  const on=gunHas(),fp=on&&camMode==='cab';if(gun.on!==on){gun.on=on;$('#fireBtn').hidden=!on}if(gun.fp!==fp){gun.fp=fp;$('#gunCross').hidden=!fp}
  if(on&&!gun.told&&tf.on){gun.told=true;toast(say('gunTip',{}),'',4200)}
  if(!on){gun.aim=0;return}
  gun.aim=Math.max(0,gun.aim-dt);
  // in first person he always holds it out, a little high, so it sits low and right in the view
  if(gun.aim>0||fp){wk.yaw=gunYaw();const p=fp?fpl.pitch+0.08:-(orbitPitch-0.32)*0.6,A=wkArms[0];
    A.top.rotation.x=-Math.PI/2-p*0.9-gun.kick*0.35;A.low.rotation.x=-0.05-(fp?0.25:0)-gun.kick*0.25}
  else{const A=wkArms[0];A.low.rotation.x=Math.min(A.low.rotation.x,-0.35)}}
// after wkMdlPose (main.js): the gun into his right palm, along the forearm, or along the shot while aiming
const gunQF=new THREE.Quaternion(),GUN_UP=new THREE.Vector3(0,1,0);
function gunPlace(){const show=gunHas()&&walker.visible,J=wkMdl.j,fp=show&&camMode==='cab';gunMdl.visible=show;
  // put away: the hand back to its easy curl (wkRig)
  if(!show&&J&&gun.fist){if(gun.h0){const h=J.arms[0].low.b.children.find(c=>c.isBone&&/hand/.test(c.name));if(h)h.quaternion.copy(gun.h0)}for(const f of J.fingers)if(f.b.name.endsWith(gun.fist))f.b.quaternion.copy(f.q0).multiply(gunQF.setFromAxisAngle(WK_X,0.35));gun.fist=null}
  // in first person he is drawn too (walker.js) and the camera is in his head: the head is shrunk away
  if(J&&J.head&&gun.headOff!==fp){gun.headOff=fp;J.head.b.scale.setScalar(fp?0.001:1)}
  if(!show)return;walker.updateMatrixWorld(true);const low=J&&J.arms[0].low&&J.arms[0].low.b,hand=low&&low.children.find(c=>c.isBone&&/hand/.test(c.name));
  // his fingers close round the grip (the index finger less, along the trigger guard), and the grip sits in the palm:
  // half way from the wrist to the middle finger's knuckle
  // the wrist turned so the palm faces in, thumb up, round an upright grip
  if(hand){if(!gun.h0)gun.h0=hand.quaternion.clone();hand.quaternion.copy(gun.h0).multiply(gunQF.setFromAxisAngle(GUN_UP,TU.gunWrist));walker.updateMatrixWorld(true);
    low.getWorldPosition(gunE);hand.getWorldPosition(gunH);const sf=hand.name.slice(-2),mid=hand.children.find(c=>/^middle_01/.test(c.name));
    if(gun.fist!==sf){gun.fist=sf;for(const f of J.fingers)if(f.b.name.endsWith(sf)){const ix=/^index/.test(f.b.name);f.b.quaternion.copy(f.q0).multiply(gunQF.setFromAxisAngle(WK_X,ix?0.55:1.35))}}
    if(mid){mid.getWorldPosition(gunV);gunH.lerp(gunV,0.55)}}
  else{const A=wkArms[0].low;A.getWorldPosition(gunE);gunH.set(0,-0.31,0.03);A.localToWorld(gunH)}
  gunZ.subVectors(gunH,gunE).normalize();if(gun.aim>0||fp){camera.getWorldDirection(gunD);gunZ.lerp(gunD,fp?0.95:0.8).normalize()}
  const y=wk.yaw;gunX.set(Math.cos(y),0,-Math.sin(y));gunY.crossVectors(gunZ,gunX).normalize();gunX.crossVectors(gunY,gunZ);
  gunMdl.matrix.makeBasis(gunX,gunY,gunZ);gunMdl.matrix.setPosition(gunH);gunMdl.matrixWorldNeedsUpdate=true;
  gunFlash.visible=gun.flash>0;if(gunFlash.visible)gunFlash.rotation.z=Math.random()*6.28}
// ---------- the shot ----------
// distance t along ray (o, unit d) where it first meets solid s (its box on the ground plan, as tall as it needs), or Infinity
function gunSolidT(s,ox,oz,dx,dz){let x=ox-s.x,z=oz-s.z,ux=dx,uz=dz,hx=s.hx,hz=s.hz;
  if(s.sn!==undefined){const a=x*s.cs-z*s.sn;z=x*s.sn+z*s.cs;x=a;const b=ux*s.cs-uz*s.sn;uz=ux*s.sn+uz*s.cs;ux=b;hx=s.lx;hz=s.lz}
  let t0=-Infinity,t1=Infinity;for(const [p,u,h] of [[x,ux,hx],[z,uz,hz]]){if(Math.abs(u)<1e-9){if(Math.abs(p)>h)return Infinity;continue}
    let a=(-h-p)/u,b=(h-p)/u;if(a>b)[a,b]=[b,a];t0=Math.max(t0,a);t1=Math.min(t1,b)}
  return t0<=t1&&t1>0?Math.max(0,t0):Infinity}
function gunFire(){if(!gunHas()){if(mode==='walk'&&trim.on)toast(say('gunTrim',{}),'',1800);return}
  if(gun.cool>0)return;gun.cool=TU.gunRate;gun.aim=1.4;gun.kick=1;gun.flash=0.05;gun.shots++;started();gunBang();
  const R=TU.gunRange,fp=camMode==='cab',d=gunD,o=gunV;
  if(fp){camera.updateMatrixWorld();o.copy(camera.position);camera.getWorldDirection(d)}
  else{const y=gunYaw();o.set(wk.x,wk.y+1.42,wk.z);d.set(Math.sin(y),0,Math.cos(y));const a=gunAssist(o,y,R);if(a)d.set(a[0]-o.x,a[1]-o.y,a[2]-o.z).normalize()}
  const hl=Math.hypot(d.x,d.z),t0=0.2;
  let tw=R;for(const s of SOLIDS){if(s.foot)continue;const t=gunSolidT(s,o.x,o.z,d.x/(hl||1),d.z/(hl||1))/(hl||1);if(t>t0&&t<tw)tw=t}
  // the ground, a metre at a time
  for(let t=t0;t<tw;t+=1){const x=o.x+d.x*t,z=o.z+d.z*t;if(o.y+d.y*t<baseHeight(x,z)){tw=t;break}}
  let hit=null,ht=tw,hy=0;
  if(tf.on)for(const p of tf.people){if(p.inside||p.drv||p.dead)continue;const ox=p.x-o.x,oz=p.z-o.z;if(ox*ox+oz*oz>(R+2)**2)continue;
    // a standing body as an upright cylinder, 11 in round (seated: 4 ft 3 in tall, from 17 in down)
    const lie=p.hurt>0.6,r=lie?0.6:0.28*p.sc,a=d.x*d.x+d.z*d.z;if(a<1e-6)continue;const b=-(ox*d.x+oz*d.z),c=ox*ox+oz*oz-r*r,q=b*b-a*c;if(q<0)continue;
    const t=(-b-Math.sqrt(q))/a,te=(-b+Math.sqrt(q))/a,lo=p.sit?p.y-0.42*p.sc:p.y,hi=lo+(lie?0.35:p.sit?1.3:1.72)*p.sc;
    for(const u of [t,(t+te)/2,te]){if(u<t0||u>=ht)continue;const y=o.y+d.y*u;if(y>=lo&&y<=hi){hit=p;ht=u;hy=(y-lo)/(hi-lo);break}}}
  const ix=o.x+d.x*ht,iy=o.y+d.y*ht,iz=o.z+d.z*ht;
  if(hit){gunHit(hit,hy,ix,iy,iz,d)}else if(ht<R)dustPuff(ix,iy,iz,3,null);
  gunScare(ix,iz,hit)}
// the chase view's aim: whoever is nearest the way he faces (within 6°, or 12° up close) and in the clear, at the chest,
// or the head when he is right on them; [x, y, z] to shoot at, or null
function gunAssist(o,y,R){let best=null,bs=1e9;const fx=Math.sin(y),fz=Math.cos(y);
  if(tf.on)for(const p of tf.people){if(p.inside||p.drv||p.dead)continue;const dx=p.x-o.x,dz=p.z-o.z,f=dx*fx+dz*fz;if(f<0.5||f>R)continue;
    const side=Math.abs(dx*fz-dz*fx),ang=Math.atan2(side,f),lim=f<15?0.21:0.105;if(ang>lim)continue;
    const L=Math.hypot(dx,dz);let clear=true;for(const s of SOLIDS)if(!s.foot&&gunSolidT(s,o.x,o.z,dx/L,dz/L)<L-0.4){clear=false;break}
    if(clear&&ang*f+f*0.01<bs){bs=ang*f+f*0.01;best={p,ang}}}
  if(!best)return null;const p=best.p,lo=p.sit?p.y-0.42*p.sc:p.y,h=(p.sit?1.3:1.72)*p.sc;
  return p.hurt>0.6?[p.x,p.y+0.15,p.z]:[p.x,lo+h*(best.ang<0.025?0.93:0.7),p.z]}
// p shot: a head shot or a second hit and they are down, otherwise they run for it
// p shot at height hy (0 their feet, 1 the top of their head), the shot going along d. Where it hits decides what
// they do (tfHitPose, townfolk.js): the head drops them where they stand; the chest staggers them back and over; the
// gut doubles them up, onto their knees and down on their face; a leg gives way under them and they crawl off,
// hurt; an arm or shoulder spins them round and they run. Seated, they slump where they sit. A second hit on
// anyone already hurt finishes them.
function gunHit(p,hy,x,y,z,d){const head=hy>GUN_HEAD;dustPuff(x,y,z,head?2:1.2,[-0.55,-1.05,-1]);
  const fx=Math.sin(p.yaw),fz=Math.cos(p.yaw),lat=((x-p.x)*-fz+(z-p.z)*fx)/(0.28*p.sc),side=lat>=0?1:-1,fwd=d.x*fx+d.z*fz>0?1:-1,
    k=p.sit?'slump':head?'head':hy<0.48?'leg':Math.abs(lat)>0.62&&hy<0.84?'arm':hy<0.62?'gut':'chest';
  const was=p.hurt||p.hp===1;p.hp=1;
  if(was&&p.hit&&p.hurt){p.hurt=0;Object.assign(p,{dead:1e-3});p.hit.jolt=0.25;gun.downs++;if(p.room)tf.shopKills=(tf.shopKills||0)+1;return}
  if(k==='arm'&&!was){p.hit={k,t:0,side,fwd,ux:d.x,uz:d.z};gunRun(p,12);return}
  p.hit={k:was&&k==='arm'?'chest':k,t:0,side,fwd,ux:d.x,uz:d.z};
  Object.assign(p,{wait:0,spd:0,amp:0,flee:0});if(p.vt0){p.vt=p.vt0;p.vt0=0}
  if(k==='leg'&&!was){p.hurt=1e-3;return}
  p.dead=1e-3;gun.downs++;if(p.room)tf.shopKills=(tf.shopKills||0)+1}
// everyone within earshot near where it went (or near him) runs off for a while
function gunScare(x,z,not){for(const p of tf.people){if(p===not||p.dead||p.hurt||p.inside||p.drv||p.room)continue;
  const d=Math.min(Math.hypot(p.x-x,p.z-z),Math.hypot(p.x-wk.x,p.z-wk.z)*1.6);if(d<30)gunRun(p,6+Math.random()*6)}}
// p runs away from the worker: back along their walk if that is the way away, at TU.gunFlee
function gunRun(p,s){if(p.room||p.drv||p.hurt||p.dead)return;p.wait=0;if(!p.vt0)p.vt0=p.vt;p.vt=TU.gunFlee*(0.85+Math.random()*0.3);p.flee=Math.max(p.flee||0,s);
  if(p.w&&!p.path){const [,,ex,ez]=tfAt(p.w,p.s);p.dir=ex*(p.x-wk.x)+ez*(p.z-wk.z)>=0?1:-1}}
// the bang: a crack of noise, a low thump under it, and the space's echo
function gunBang(){if(!snd||!snd.ready||!sndCfg.on||!actx||actx.state!=='running')return;const c=actx,t=c.currentTime;
  if(!snd.gunBuf){const sr=c.sampleRate,a=noiseBuf(sr,0.6,91);for(let i=0;i<a.length;i++){const s=i/sr;a[i]*=Math.exp(-s*(s<0.012?20:9))*(s<0.002?s/0.002:1)}snd.gunBuf=toBuf(c,a)}
  const v=sndVol(sndCfg.fx)*1.6,g=sndGain(0,snd.dry),e=sndGain(v*0.9,snd.send),hp=sndFilter('highpass',180,0.7),lp=sndFilter('lowpass',7500,0.6);
  const s=c.createBufferSource();s.buffer=snd.gunBuf;s.playbackRate.value=0.92+Math.random()*0.12;s.connect(hp);hp.connect(lp);lp.connect(g);lp.connect(e);
  g.gain.setValueAtTime(v,t);s.start(t);
  const o=c.createOscillator(),og=sndGain(0,snd.dry);o.type='sine';o.frequency.setValueAtTime(120,t);o.frequency.exponentialRampToValueAtTime(42,t+0.16);o.connect(og);
  og.gain.setValueAtTime(v*0.9,t);og.gain.exponentialRampToValueAtTime(0.001,t+0.22);o.start(t);o.stop(t+0.25);
  s.onended=()=>{g.disconnect();e.disconnect();og.disconnect()}}
$('#gunBtn').addEventListener('pointerdown',e=>{e.preventDefault();gunEquip(!gun.eq)});
$('#fireBtn').addEventListener('pointerdown',e=>{e.preventDefault();gunFire()});
