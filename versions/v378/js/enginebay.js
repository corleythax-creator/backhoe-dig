// Engine Bay engines drive the machines (https://engine-bay-zeta.vercel.app; index.html loads its runtime,
// runtime/engine-bay.js, as window.EngineBay): the machine you are in runs a real engine simulation in the audio thread
// (its combustion, stroke by stroke), and what that engine makes is what pulls it along, through an automatic gearbox
// and clutch worked out here. The pickup has the 350 V8, the four-wheeler and the dirt bike the 450 single, the backhoe
// and the wheel loader the 4.5 turbo diesel (its governor, boost lag and smoke). Until the engine has started (its
// starter, after the first tap or key that starts sound), offline, or with Tuning's "Real engines" at 0, a machine
// drives on its own numbers as before. You hear the engine itself, from the machine (its sound bus), in place of the
// recordings.
//   The engine's speed is kept here, the simulation is held at it (pedal: true, so the gas asks for torque, drive by
//   wire) and says what it makes there (voice.engineTorque); only that torque comes a frame late, and it changes slowly.
//   The clutch is in when it can pass what the engine makes (the engine's inertia then turns with the wheels); it slips
//   while engaging, after a shift over a quarter second, and near idle by the revs (a centrifugal clutch, so it never
//   stalls standing); no harder than to bring the engine to the wheels' speed over half a second (and its flywheel's
//   push no more than half what the engine makes).
// Gears are the overall ratios (gearbox and final drive: engine turns per wheel turn); r the tyre's rolling radius (m);
// m the machine's mass with its driver (kg). top: the Tuning key of its top speed, which still governs it. amax (m/s²):
// the most the ground takes before the front lifts or the tyre spins (a 450 out-pulls what a bike can put down).
const EB_RIGS={
  pk:{bay:'v8_350',m:2600,r:0.41,gears:[11.41,6.08,3.73,2.61],rev:8.54,top:'pkSpd',topR:'pkRev',pull:'pkAcc'},
  at:{bay:'single450',m:380,r:0.32,gears:[17,12.5,9.5,7.5],rev:17,top:'atSpd',topR:'atRev',pull:'atAcc',amax:6},
  bike:{bay:'single450',m:190,r:0.33,gears:[16.0,13.2,11.1,9.36,8.15],rev:0,top:'bkSpd',pull:'bkPull',amax:7},
  backhoe:{bay:'diesel_45t',m:8000,r:0.62,gears:[92,55,26,14],rev:92,top:'bhSpd'},
  loader:{bay:'diesel_45t',m:11000,r:0.75,gears:[110,62,30],rev:110,top:'hvLdSpd'}};
const EB_ETA=0.88;
// the one engine running (the machine you are in): {key, v (the runtime's voice), st (gearbox and clutch), out (bus)}
let ebCur=null,ebGen=0;
let ebAsked=false;
const ebReady=()=>{if(window.EngineBay&&!ebAsked){ebAsked=true;EngineBay.ready().catch(()=>{})}   // its engines.json, once
  return !!(window.EngineBay&&EngineBay.has&&actx&&actx.audioWorklet&&snd&&snd.ready&&actx.state==='running'&&TU.ebOn>0.5)};
function ebDef(rig){return window.EngineBay&&EngineBay.get?EngineBay.get(rig.bay):null}
// each frame: the rig the player is in (or null) and the sound bus its engine should come out of
function ebUse(key,out){
  if(!key||!EB_RIGS[key]||!ebReady()||!EngineBay.has(EB_RIGS[key].bay)){ebStop();return}
  if(ebCur&&ebCur.key===key&&ebCur.out===out)return;
  ebStop();const my=++ebGen,rig=EB_RIGS[key];
  ebCur={key,rig,out,v:null,st:{we:0,on:false,locked:false,cr:1,gear:1,dir:1,shiftT:0,thr:0}};
  EngineBay.voice(rig.bay,{ctx:actx,out,volume:0.9}).then((v)=>{if(my!==ebGen||!ebCur){v.stop();return}ebCur.v=v}).catch((e)=>{console.warn('Engine Bay:',e.message);if(my===ebGen)ebCur=null})}
function ebStop(){ebGen++;if(ebCur&&ebCur.v)ebCur.v.stop();ebCur=null}
// the live engine of this rig, once it runs on its own (its starter done)
function ebLive(key){const c=ebCur;return c&&c.key===key&&c.v&&c.v.live?c:null}
// a stall (it can't, standing, but lugging up a bank in a high gear can) turns the key again; then hold the simulation
// at the engine's speed with the gas
function ebAfter(){const c=ebCur;if(!c||!c.v)return;const v=c.v,s=c.st;
  if(v.start&&!v.starting&&v.rpm<50){v.start();s.on=false;return}
  if(s.on)v.drive({rpm:s.we*30/Math.PI,throttle:s.thr,clutch:1,pedal:true});else v.drive({throttle:0})}   // (on its starter, then idling on its own)
// The engine's pull on the machine this frame (m/s², along +v when dir is 1): v its speed (m/s, + forward), pedal 0..1,
// dir +1 forward or -1 reverse (the gear it is in), k the ground's drag factor (mud), free: its driven wheel off the
// ground (the bike in the air: nothing holds the engine back). Engine braking comes out of it below 0.
function ebPull(c,dt,pedal,dir,v,k,free){
  const rig=c.rig,s=c.st,V=c.v,def=ebDef(rig),Ie=V.inertia||0.5;
  const idle=(def&&def.idle||800)*Math.PI/30,red=(def&&(def.fuel==='diesel'?def.limiter:def.redline)||6000)*Math.PI/30;
  if(!s.on){s.on=true;s.we=V.rpm*Math.PI/30;s.locked=false;s.cr=1;s.gear=1}
  // the gearbox: reverse when backing; up through the gears by the road speed, sooner on a light foot; down as it slows
  if(dir!==s.dir){s.dir=dir;s.gear=1;s.shiftT=0.35;s.locked=false}
  const G=rig.gears,ov=(g)=>dir<0?(rig.rev||G[0]):G[g-1],wsOf=(g)=>Math.max(0,v*dir*ov(g)/rig.r);
  const top=(dir>0?TU[rig.top]:TU[rig.topR]||TU[rig.top])*k,pull=rig.pull?TU[rig.pull]:1;
  if(s.shiftT>0)s.shiftT-=dt;
  else if(dir>0){const nx=s.gear<G.length?wsOf(s.gear+1):0,ok=nx>idle*1.25;
    // up at 35% of the redline on a light foot to 90% flat out, or once the governor holds it at its top speed
    if(ok&&(wsOf(s.gear)>red*(0.35+0.55*pedal)||Math.abs(v)>top*0.97&&nx>red*0.3)){s.gear++;s.shiftT=0.25;s.locked=false}
    else if(s.gear>1&&wsOf(s.gear)<red*(0.16+0.2*pedal)&&wsOf(s.gear-1)<red*0.8){s.gear--;s.shiftT=0.2;s.locked=false}}
  const OV=ov(s.gear),M=rig.m;
  // the governor at the machine's top speed (Tuning), and through mud a little less
  const gov=clamp(1-(Math.abs(v)-top)/Math.max(0.5,top*0.08),0,1);
  s.thr=pedal*(s.shiftT>0?0.15:1);
  const n=Math.max(1,Math.ceil(dt/0.004)),h=dt/n;let vv=v;
  for(let i=0;i<n;i++){
    const ws=free?s.we:Math.max(0,vv*dir*OV/rig.r);
    s.cr=s.shiftT>0?0:Math.min(1,s.cr+h*4);
    const w0=idle*1.1,w1=Math.max(idle*1.4,idle+(0.5*red-idle)*pedal);
    const cl=free?0:s.cr*Math.max(clamp((s.we-w0)/(w1-w0),0,1),ws>idle*1.25?1:0);
    let Tn=V.engineTorque*pull;if(Tn>0)Tn*=gov;
    const cap=(V.clutchCap||400)*cl;
    if(s.locked&&(cl<=0||Math.abs(Tn)>cap))s.locked=false;
    if(!s.locked){const Tsl=Math.min(cap,Math.abs(Tn)+Math.min(Math.max(0.5*Math.abs(Tn),0.05*cap),Ie*Math.abs(s.we-ws)/0.45)),band=Math.max(2,2*Tsl*h/Ie),Tc=Tsl*clamp((s.we-ws)/band,-1,1);
      s.we=Math.max(0,s.we+h*(Tn-Tc)/Ie);s.we+=(V.rpm*Math.PI/30-s.we)*Math.min(1,h*4);   // (and toward the simulation's own: one running slow)
      if(cl>0&&cap>=Math.abs(Tn)&&Math.abs(s.we-ws)<band)s.locked=true;
      vv+=dir*Tc*OV*EB_ETA/rig.r/M*h}
    if(s.locked){s.we=ws;vv+=dir*Tn*OV*EB_ETA/rig.r/(M+Ie*OV*OV/(rig.r*rig.r))*h}}
  const a=(vv-v)/dt;return rig.amax&&a>rig.amax?rig.amax:a}
// the rig of the machine you are in, and the bus its engine sounds from
function ebKeyOf(){const R=WK_RIDES[wk.inside];
  if(wk.inside==='bike')return ['bike',snd&&snd.B&&snd.B.eng];
  const h=R&&R.m==='heavy'?R.o:null;if(!h)return [null];
  const k=h.K.car==='pk'?'pk':h.K.car==='at'?'at':h.K.hoe?'backhoe':h.k==='loader'?'loader':null;
  return [k,snd&&snd.H&&snd.H.eng]}
// once a frame, after the machines moved (updateSound): start or stop the engine, then hold it at its speed
function ebFrame(){const [k,out]=ebKeyOf();ebUse(out?k:null,out);ebAfter()}
// what the tach and the HUD read while the engine drives
const ebRpm=(c)=>c.st.we*30/Math.PI;
