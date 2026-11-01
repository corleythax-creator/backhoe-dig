// Corley's Island: the string trimmer (idea K01). On foot the worker takes it out (Trimmer, KEY trim) and weed-eats what
// the mower can't reach: along fences, round trees, rocks and the lawn's edges. A two-stroke trimmer: orange engine
// housing with its fuel tank and pull start at the back, an aluminium shaft, a trigger grip and a loop handle, and a
// gearbox, guard and bump head at the end with two lengths of line. He holds it at his hip and swings the head side to
// side just off the ground; the line cuts the tall grass (the mower's lawn cells, mower.js, counted the same in the lawn's
// share and the stats) and the field grass and weeds (fieldCut, scenery.js) wherever it sweeps, throwing clippings.
// The line wears down as it cuts; below TU.trimMin it no longer reaches, and Bump (KEY trimBump) feeds more off the
// spool (up to TU.trimLine, the guard's blade cuts the rest). An empty spool is swapped for a full one when he puts the
// trimmer away. save.js keeps whether it is in hand, the line out and what is left on the spool.
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.
const TRIM_SHAFT=1.32,TRIM_HEAD=0.05,TRIM_HIP=[-0.2,0.95,0.02],TRIM_REACH=1.18;
const trim={on:false,pend:false,line:TU.trimLine,spool:TU.trimSpool,rev:0,sw:0,spin:0,cutK:0,hx:0,hy:0,hz:0,snd:null,worn:false,empty:false};
// ---------- the model ----------
const trimMdl=new THREE.Group(),trimHeadG=new THREE.Group(),trimSpin=new THREE.Group();trimMdl.visible=false;scene.add(trimMdl);
{const orange=mdlStd(0xd2541c,{tex:'paint',rough:0.42}),black=mdlStd(0x1b1b1c,{tex:'rubber',rough:0.85}),plastic=mdlStd(0x2a2a2c,{rough:0.55}),
    alu=mdlStd(0xb8bbbf,{metal:0.9,rough:0.32}),steel=mdlStd(0x45474b,{tex:'steel',metal:0.8,rough:0.5}),tank=mdlStd(0xe3dccb,{rough:0.3}),
    line=mdlStd(0xd9e23a,{rough:0.55});
  const add=(geo,mat,x,y,z,p)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=true;(p||trimMdl).add(m);return m};
  const tube=(r0,r1,len,seg)=>new THREE.CylinderGeometry(r0,r1,len,seg).rotateX(Math.PI/2);
  // shaft from the clutch housing (z 0) to the gearbox (z TRIM_SHAFT)
  add(tube(0.0135,0.0135,TRIM_SHAFT,10),alu,0,0,TRIM_SHAFT/2);
  add(tube(0.034,0.05,0.12,12),black,0,0,0.04);
  // the engine: housing, cylinder fins, spark plug cap, fuel tank under, pull start on the left, muffler guard on the right
  add(new THREE.BoxGeometry(0.15,0.15,0.17),orange,0,0.01,-0.1);
  add(new THREE.SphereGeometry(0.085,12,8,0,Math.PI*2,0,Math.PI/2).scale(1,0.7,1.2),orange,0,0.075,-0.1);
  for(let k=0;k<5;k++)add(new THREE.BoxGeometry(0.11,0.006,0.09),steel,0,0.1+k*0.012,-0.2);
  add(tube(0.012,0.012,0.04,8),black,0,0.16,-0.2);
  add(new THREE.BoxGeometry(0.13,0.07,0.13),tank,0,-0.1,-0.11);add(tube(0.016,0.016,0.03,8),black,0.05,-0.08,-0.19);
  add(new THREE.CylinderGeometry(0.068,0.068,0.035,16).rotateZ(Math.PI/2),black,0.09,0.01,-0.11);
  add(new THREE.BoxGeometry(0.06,0.018,0.018),plastic,0.12,0.0,-0.11);
  add(new THREE.BoxGeometry(0.03,0.08,0.1),steel,-0.09,0.0,-0.13);
  add(new THREE.BoxGeometry(0.1,0.06,0.07),plastic,0,0.05,-0.005);// air filter cover
  // the rear grip with its trigger and the throttle lockout
  add(tube(0.021,0.021,0.2,10),black,0,0.0,0.24);add(new THREE.BoxGeometry(0.014,0.045,0.05),black,0,-0.035,0.22);
  add(new THREE.BoxGeometry(0.012,0.025,0.035),orange,0,0.03,0.21);
  // the loop handle round the shaft
  {const L=add(new THREE.TorusGeometry(0.12,0.012,6,18,Math.PI*1.25),black,0,0.08,0.58);L.rotation.z=-Math.PI*0.125;
    add(new THREE.BoxGeometry(0.05,0.035,0.04),plastic,0,0.01,0.58)}
  // the head, kept level with the ground: gearbox, the guard behind the line (its line-cutting blade on the edge) and the
  // bump head that spins with the line
  trimHeadG.position.z=TRIM_SHAFT;trimMdl.add(trimHeadG);
  add(new THREE.CylinderGeometry(0.026,0.03,0.07,10),steel,0,-0.02,0,trimHeadG);
  add(new THREE.CylinderGeometry(0.19,0.19,0.01,20,1,false,Math.PI*0.5,Math.PI),orange,0,0.0,-0.04,trimHeadG);
  add(new THREE.CylinderGeometry(0.19,0.19,0.035,20,1,true,Math.PI*0.5,Math.PI),orange,0,-0.018,-0.04,trimHeadG);
  add(new THREE.BoxGeometry(0.03,0.004,0.012),steel,0.18,-0.03,-0.04,trimHeadG);
  trimSpin.position.y=-0.075;trimHeadG.add(trimSpin);
  add(new THREE.CylinderGeometry(0.052,0.048,0.045,14),plastic,0,0,0,trimSpin);add(new THREE.CylinderGeometry(0.022,0.026,0.02,10),steel,0,-0.03,0,trimSpin);
  for(const s of [1,-1]){const m=add(new THREE.BoxGeometry(1,0.0024,0.0024),line,0,0,0,trimSpin);m.userData.s=s;m.castShadow=false}
  // the blur of the spinning line
  const bm=new THREE.MeshBasicMaterial({color:0xd9e23a,transparent:true,opacity:0,depthWrite:false});
  trimSpin.userData.blur=add(new THREE.RingGeometry(TRIM_HEAD,1,24,1).rotateX(-Math.PI/2),bm,0,0,0,trimSpin);trimSpin.userData.blur.castShadow=false}
const trimV=new THREE.Vector3(),trimZ=new THREE.Vector3(0,0,1),trimQ=new THREE.Quaternion(),trimQy=new THREE.Quaternion();
// ---------- taking it out, bumping the line ----------
function trimSet(on){trim.pend=false;if(on&&(mode!=='walk'||wk.inside)){toast(say('trimWalk',{}),'',2200);return}
  if(on===trim.on)return;trim.on=on;
  // put away, it gets a full spool and fresh line
  if(!on){trim.spool=TU.trimSpool;trim.line=TU.trimLine;trim.worn=trim.empty=false}
  else{if(gun.eq)gunEquip(false,1);if(!(trim.spool>=0))trim.spool=TU.trimSpool;toast(say('trimOn',{line:trimIn(trim.line)}),'',3600);started()}
  $('#trimBtn').setAttribute('aria-pressed',on);$('#bumpBtn').hidden=!on}
// tap the head on the ground: line comes off the spool, the guard's blade trims it to length
function trimBump(){if(!trim.on||mode!=='walk')return;
  if(trim.spool<=0.005){toast(say('trimEmpty',{}),'bad',2600);return}
  const add=Math.min(TU.trimBump,trim.spool);trim.spool-=add;trim.line=Math.min(TU.trimLine,trim.line+add);trim.worn=false;
  toast(say('trimBumped',{line:trimIn(trim.line),spool:Math.round(trim.spool/0.3048)}),'',1400)}
const trimIn=m=>(m/0.0254).toFixed(1);
// a saved [in hand, line out m, spool m]
// (back in his hands once he is on foot: the page may open in a machine, or on foot a moment later)
function trimLoad(a){if(!Array.isArray(a)||a.length<3||!a.every(isFinite))return;trim.line=clamp(a[1],0,TU.trimLine);trim.spool=clamp(a[2],0,TU.trimSpool);trim.pend=!!a[0]}
// ---------- cutting ----------
// the spinning line, centred on x,z, cuts what stands within r: the lawn's tall grass cells (as mowCut does, without
// laying stripes) and the field grass and weeds. Returns how much tall grass it cut (for the clippings)
function trimCut(x,z,r,yaw){let n0=0,any=0;const R=r+LAWN_GS*0.35;
  const i0=Math.max(0,Math.floor((x-R-LAWN_X0)/LAWN_GS)),i1=Math.min(LAWN_NX-1,Math.floor((x+R-LAWN_X0)/LAWN_GS));
  const j0=Math.max(0,Math.floor((z-R-LAWN_Z0)/LAWN_GS)),j1=Math.min(LAWN_NZ-1,Math.floor((z+R-LAWN_Z0)/LAWN_GS));
  for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){const n=j*LAWN_NX+i;if(lawn.dug[n])continue;
    const dx=LAWN_X0+(i+0.5)*LAWN_GS-x,dz=LAWN_Z0+(j+0.5)*LAWN_GS-z;if(dx*dx+dz*dz>R*R)continue;
    const g=lawnG(n);if(g<=0.03&&!(lawn.gd[n]>0))continue;
    lawn.ct[n]=lawn.t;statCut(n,g);if(g>0.3)n0++;lawn.gd[n]=0;lawnPaint(n);any++}
  n0+=fieldCut(x,z,yaw,r*0.75,r*0.75);
  if(any||n0)lawn.sDirty=true;return any+n0}
// clippings thrown off the line, into the mower's pool (mower.js draws and drops them)
function trimClips(n,x,y,z){for(let q=0;q<n;q++){const c=clips[clipHead];clipHead=(clipHead+1)%CLIP_N;const a=Math.random()*6.283,s=2+Math.random()*3;
    Object.assign(c,{x:x+Math.cos(a)*0.15,y:y+0.03,z:z+Math.sin(a)*0.15,vx:Math.cos(a)*s,vy:0.4+Math.random()*1.3,vz:Math.sin(a)*s,t:0,life:1+Math.random()*1.2,s:0.5+Math.random()*0.6,r:Math.random()*6})}
  clipLive=true}
// ---------- each frame (after updateWalker, before the worker's model takes his pose) ----------
function trimTick(dt){
  if(trim.pend&&mode==='walk'&&!wk.inside){trim.pend=false;trim.on=true;$('#trimBtn').setAttribute('aria-pressed',true);$('#bumpBtn').hidden=false}
  const show=trim.on&&mode==='walk'&&!wk.inside&&!wk.swim&&!bench.on;trimMdl.visible=show;
  trim.rev+=((show?1:0)-trim.rev)*Math.min(1,dt*(show?2.5:1.5));
  if(!show){trim.cutK=0;trimSnd(dt);return}
  // the head swings side to side in front of him, just off the ground (it follows the ground, blocks too)
  trim.sw+=dt*(1.6+0.8*Math.min(1,wk.spd))*trim.rev;const sw=Math.sin(trim.sw)*0.45*trim.rev,sy=Math.sin(wk.yaw),cy=Math.cos(wk.yaw);
  const lx=Math.sin(sw)*TRIM_REACH-0.1,lz=Math.cos(sw)*TRIM_REACH+0.02,wx=wk.x+lx*cy+lz*sy,wz=wk.z-lx*sy+lz*cy;
  const ly=clamp(surfAt(wx,wz)-wk.y+0.09,-0.45,0.5);
  trimV.set(lx-TRIM_HIP[0],ly-TRIM_HIP[1],lz-TRIM_HIP[2]).normalize();trimQ.setFromUnitVectors(trimZ,trimV);
  trimQy.setFromAxisAngle(UPY,wk.yaw);trimMdl.quaternion.copy(trimQy).multiply(trimQ);trimHeadG.quaternion.copy(trimQ).invert();
  const bx=lx-trimV.x*TRIM_SHAFT,by=ly-trimV.y*TRIM_SHAFT,bz=lz-trimV.z*TRIM_SHAFT;
  trimMdl.position.set(wk.x+bx*cy+bz*sy,wk.y+by+wkBody.position.y,wk.z-bx*sy+bz*cy);
  trim.hx=wx;trim.hy=wk.y+ly-0.08;trim.hz=wz;
  // his arms: the right hand on the trigger grip at his hip, the left reaching forward to the loop handle
  wkArms[0].top.rotation.x=-0.42;wkArms[0].low.rotation.x=-0.75;wkArms[1].top.rotation.x=-0.95+sw*0.25;wkArms[1].low.rotation.x=-0.45;
  // the head spins; the line stands out to its length, a blur once it is up to speed
  trim.spin+=dt*trim.rev*70;trimSpin.rotation.y=trim.spin;const L=Math.max(0.002,trim.line),fast=ss(0.4,0.9,trim.rev);
  for(const m of trimSpin.children)if(m.userData.s){m.scale.x=L;m.position.x=m.userData.s*(TRIM_HEAD+L/2);m.visible=fast<0.6}
  const bl=trimSpin.userData.blur;bl.visible=fast>0.05&&L>0.01;bl.material.opacity=0.22*fast;bl.scale.set((TRIM_HEAD+L),1,(TRIM_HEAD+L));
  // cutting: up to speed, line long enough to reach, head down on the ground (not swinging over a block edge)
  let cut=0;
  if(trim.rev>0.8&&trim.line>=TU.trimMin&&ly<0.45){cut=trimCut(wx,wz,TRIM_HEAD+trim.line,wk.yaw+sw);
    if(cut){trim.line=Math.max(0,trim.line-TU.trimWear*dt);if(!lawn.startT)lawn.startT=performance.now();started();if(padUsed)rumbleDig(0.12);
      const n=Math.min(cut,gfxCur.trimClips||0);if(n)trimClips(n,wx,trim.hy+0.08,wz)}}
  trim.cutK+=((cut?1:0)-trim.cutK)*Math.min(1,dt*(cut?10:4));
  if(trim.line<TU.trimMin&&!trim.worn){trim.worn=true;toast(say(trim.spool>0.005?'trimWorn':'trimEmpty',{}),'bad',3000)}
  trimSnd(dt)}
// ---------- the sound: a small two-stroke (the dirt bike's recording, pitched up and thinned), the line's whine and the
// hiss of it cutting; placed at the head like a machine
function trimSnd(dt){if(!snd||!snd.ready||actx.state!=='running')return;
  if(!trim.snd){const v=sndVoice(),c=actx;snd.voices.push(v);v.eng.gain.value=sndVol(sndCfg.eng);v.fx.gain.value=sndVol(sndCfg.fx);
    const hp=sndFilter('highpass',420,0.7,v.eng),e=sndEngine('b_idle','b_run',600,1300,hp);
    const noise=(dest)=>{const s=c.createBufferSource();s.buffer=snd.noise;s.loop=true;s.connect(dest);s.start(0,Math.random()*2);return s};
    const wg=sndGain(0,v.fx),wf=sndFilter('bandpass',900,6,wg),cg=sndGain(0,v.fx),cf=sndFilter('bandpass',3400,1.1,cg);noise(wf);noise(cf);
    trim.snd={v,e,wg,wf,cg,cf}}
  const S=trim.snd,t=actx.currentTime,r=trim.rev,lvl=r>0.02?0.55:0;
  sndPlace(S.v,trim.hx||wk.x,(trim.hy||wk.y)+0.6,trim.hz||wk.z,t);
  // wide open while it runs, bogging a little as the line cuts
  const rpm=650+r*(1950-260*trim.cutK);sndEngineTo(S.e,rpm,0.3+0.5*r,lvl,t);
  S.wg.gain.setTargetAtTime(0.18*r*r*(trim.line>0.01?1:0.4),t,0.08);S.wf.frequency.setTargetAtTime(500+1100*r-150*trim.cutK,t,0.08);
  S.cg.gain.setTargetAtTime(0.42*trim.cutK,t,0.04)}
$('#trimBtn').addEventListener('pointerdown',e=>{e.preventDefault();trimSet(!trim.on)});
$('#bumpBtn').addEventListener('pointerdown',e=>{e.preventDefault();trimBump()});
