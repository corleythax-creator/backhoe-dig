// Corley's Island: sound. Diesel engines are pre-rendered loops built from cylinder firings (combustion pulse, injector
// knock, exhaust pipe and muffler resonances, valve-train tick) at a low and a high rev, cross-faded and re-pitched with
// the revs; load opens a filter. Around them: turbo, tires on gravel, air brakes, bed and pump hydraulics, the relief
// valve, track clank, bucket scrape, pouring dirt and the backup alarm. Each machine is panned and faded by distance
// from the camera, with a short echo off the cliffs. The mower is a small gas V-twin with blade whine and the chop of
// cut grass, and rain. No sound files: everything is rendered on the first tap or key.
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.
const SND_DEF={on:true,master:70,eng:80,alarm:60,fx:70};
const sndCfg=Object.assign({},SND_DEF);
try{const s=JSON.parse(localStorage.getItem('bhd_sndcfg')||'null');if(s)Object.assign(sndCfg,s);else if(localStorage.getItem('bhd_snd')==='0')sndCfg.on=false}catch(e){}
// what the frame loop tells the mixer each frame
const sndIn={hyd:0,relief:false,track:0,pour:0,dump:0,skHyd:0,skDig:0,skPour:0};
let actx=null,snd=null;
const sndVol=v=>(v/100)*(v/100);// sliders are perceptual: half way is a quarter of the power

// ---------- offline DSP for the rendered loops ----------
function sndRng(seed){let a=seed>>>0;return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296}}
function bq(type,f,q,sr){const w=2*Math.PI*f/sr,al=Math.sin(w)/(2*q),c=Math.cos(w),a0=1+al;
  return type==='bp'?[al/a0,0,-al/a0,-2*c/a0,(1-al)/a0]:[(1-c)/2/a0,(1-c)/a0,(1-c)/2/a0,-2*c/a0,(1-al)/a0]}
function bqRun(x,k){const y=new Float32Array(x.length);let x1=0,x2=0,y1=0,y2=0;
  for(let i=0;i<x.length;i++){const v=x[i],o=k[0]*v+k[1]*x1+k[2]*x2-k[3]*y1-k[4]*y2;x2=x1;x1=v;y2=y1;y1=o;y[i]=o}return y}
function hpRun(x,f,sr){const a=Math.exp(-2*Math.PI*f/sr),y=new Float32Array(x.length);let px=0,py=0;for(let i=0;i<x.length;i++){py=a*(py+x[i]-px);px=x[i];y[i]=py}return y}
// a seamless loop: the tail is cross-faded into the head
function sndLoop(s,L,X){const b=new Float32Array(L);for(let i=0;i<L;i++)b[i]=s[i+X];for(let i=0;i<X;i++){const t=i/X;b[i]=s[i+X]*t+s[i+X+L]*(1-t)}return b}
function sndNorm(b,rms){let s=0;for(const v of b)s+=v*v;const k=rms/Math.sqrt(s/b.length||1);let pk=0;for(let i=0;i<b.length;i++){b[i]*=k;pk=Math.max(pk,Math.abs(b[i]))}
  if(pk>0.95)for(let i=0;i<b.length;i++)b[i]*=0.95/pk;return b}
// one engine loop at a fixed rpm: 6 cylinders, 4-stroke, firing every 120° of crank
function renderEngine(sr,rpm,p){
  const rnd=sndRng(p.seed),fire=120/(rpm*6),L=Math.round(p.cycles*6*fire*sr),X=Math.round(0.04*sr),W=Math.round(0.3*sr),n=W+L+X+X;
  const e=new Float32Array(n),cyl=[1,0.9,1.06,0.95,1.1,0.92].map(v=>v*(1+0.08*(rnd()-0.5)));
  const pl=Math.round(0.035*sr),tr=0.0005*sr,td=p.decay*sr,tk=0.0011*sr,tv=0.0004*sr,tc=0.0012*sr;
  for(let k=0;;k++){const t0=Math.round((k*fire+(rnd()-0.5)*fire*p.jit)*sr)+W%Math.round(fire*sr);if(t0>=n)break;if(t0<0)continue;
    // each firing: the low pressure thump, the exhaust valve's ringing crack, and the injector's knock
    const a=cyl[k%6]*(1+p.var*(rnd()-0.5)),kn=p.knock*(0.7+0.6*rnd()),cf=p.crackF*(0.6+0.9*rnd()),ck=p.crack*(0.7+0.6*rnd()),ph=rnd()*6.28;
    for(let i=0;i<pl&&t0+i<n;i++){const thump=Math.exp(-i/td)-Math.exp(-i/tr),knock=(rnd()*2-1)*Math.exp(-i/tk),crack=Math.sin(ph+2*Math.PI*cf*i/sr)*Math.exp(-i/tc);
      e[t0+i]+=a*(thump+ck*crack+kn*knock)}
    // valve train tick a little after each firing
    const tv0=t0+Math.round((0.3+0.2*rnd())*fire*sr);for(let i=0;i<120&&tv0+i<n;i++)e[tv0+i]+=p.mech*(rnd()*2-1)*Math.exp(-i/tv)}
  // exhaust pipe: a damped feedback comb (standing wave in the pipe)
  const D=Math.max(2,Math.round(p.pipe*sr/1000)),y=new Float32Array(n);let lp=0;
  for(let i=0;i<n;i++){const fb=i>=D?y[i-D]:0;lp+=(fb-lp)*0.35;y[i]=e[i]+p.fb*lp}
  // muffler and body resonances, then the stack's top end
  const o=new Float32Array(n);for(let i=0;i<n;i++)o[i]=y[i]*p.dry;
  for(const [f,q,g] of p.res){const r=bqRun(y,bq('bp',f,q,sr));for(let i=0;i<n;i++)o[i]+=g*r[i]}
  // tilt up through the bark and clatter (what a phone speaker can play), roll off the sub-bass
  const lo=hpRun(o,45,sr),hi=hpRun(lo,p.tiltF,sr),hh=hpRun(hi,1200,sr);for(let i=0;i<n;i++)lo[i]+=p.tilt*hi[i]+p.tilt2*hh[i];
  const out=bqRun(lo,bq('lp',p.lp,0.7,sr));
  return sndNorm(sndLoop(out,L,X),0.22)
}
function noiseBuf(sr,sec,seed){const r=sndRng(seed),b=new Float32Array(Math.round(sr*sec));for(let i=0;i<b.length;i++)b[i]=r()*2-1;return b}
// gravel: sparse crunchy clicks of random size, for tires rolling on dirt
function renderGravel(sr){const r=sndRng(7),L=Math.round(sr*2),X=Math.round(0.03*sr),s=new Float32Array(L+X*2);
  for(let k=0;k<1400;k++){const t0=Math.floor(r()*(s.length-400)),a=Math.pow(r(),3),d=8+r()*60;for(let i=0;i<300;i++)s[t0+i]+=a*(r()*2-1)*Math.exp(-i/d)}
  return sndNorm(sndLoop(bqRun(hpRun(s,300,sr),bq('lp',5500,0.7,sr)),L,X),0.2)}
// one metal clank: a few inharmonic modes, as a track shoe or tailgate rings
function renderClank(sr,seed,modes,len){const r=sndRng(seed),n=Math.round(sr*len),b=new Float32Array(n);
  for(const [f,d,a] of modes){const ph=r()*6.28,ff=f*(0.97+0.06*r());for(let i=0;i<n;i++)b[i]+=a*Math.sin(ph+2*Math.PI*ff*i/sr)*Math.exp(-i/(d*sr))}
  for(let i=0;i<Math.min(n,200);i++)b[i]+=0.5*(r()*2-1)*Math.exp(-i/25);return sndNorm(b,0.18)}
// air brake release: a sharp hiss that tails off
function renderHiss(sr){const r=sndRng(11),n=Math.round(sr*0.9),s=new Float32Array(n);
  for(let i=0;i<n;i++){const t=i/sr,env=Math.min(1,t/0.012)*Math.exp(-t/0.22);s[i]=(r()*2-1)*env}
  return sndNorm(bqRun(hpRun(s,1800,sr),bq('lp',9000,0.7,sr)),0.2)}
// backup alarm: a 1.1 kHz beep through a small horn speaker, soft edges
function renderBeep(sr){const n=Math.round(sr*0.48),b=new Float32Array(n),f=1120;
  for(let i=0;i<n;i++){const t=i/sr,env=Math.min(1,t/0.008,(0.48-t)/0.012);
    b[i]=env*(Math.sin(2*Math.PI*f*t)+0.32*Math.sin(4*Math.PI*f*t+0.4)+0.14*Math.sin(6*Math.PI*f*t+1.1))}
  return sndNorm(bqRun(b,bq('bp',1500,0.6,sr)),0.25)}
// outdoor space: a few early reflections off the cliffs, then a short soft tail
function renderSpace(c){const sr=c.sampleRate,n=Math.round(sr*0.9),ir=c.createBuffer(2,n,sr),r=sndRng(5);
  for(let ch=0;ch<2;ch++){const d=ir.getChannelData(ch);
    for(const [t,a] of [[0.031,0.5],[0.058,0.35],[0.093,0.3],[0.15,0.22],[0.21,0.15]]){const k=Math.round((t+ch*0.004*(r()-0.3))*sr);if(k<n)d[k]+=a*(r()<0.5?-1:1)}
    for(let i=0;i<n;i++)d[i]+=(r()*2-1)*0.06*Math.exp(-i/sr/0.28)*Math.min(1,i/sr/0.04)}
  return ir}
function toBuf(c,a){const b=c.createBuffer(1,a.length,c.sampleRate);b.getChannelData(0).set(a);return b}

// ---------- live graph ----------
function sndLoopSrc(buf,dest,rate){const s=actx.createBufferSource();s.buffer=buf;s.loop=true;s.playbackRate.value=rate||1;s.connect(dest);s.start();return s}
function sndGain(v,dest){const g=actx.createGain();g.gain.value=v;if(dest)g.connect(dest);return g}
function sndFilter(type,f,q,dest){const b=actx.createBiquadFilter();b.type=type;b.frequency.value=f;b.Q.value=q;if(dest)b.connect(dest);return b}
// a machine's output stage: distance gain, air absorption, stereo position, and a send to the shared space
function sndVoice(){const pan=actx.createStereoPanner?actx.createStereoPanner():null,air=sndFilter('lowpass',18000,0.5),g=sndGain(0);
  g.connect(air);if(pan){air.connect(pan);pan.connect(snd.dry);pan.connect(snd.send)}else{air.connect(snd.dry);air.connect(snd.send)}
  return {g,air,pan}}
// an engine: two rpm layers, a load filter, into a bus
function sndEngine(lo,hi,rLo,rHi,dest){const load=sndFilter('lowpass',1500,0.6,dest),lg=sndGain(0,load),hg=sndGain(0,load);
  return {a:sndLoopSrc(lo,lg),b:sndLoopSrc(hi,hg),lg,hg,load,rLo,rHi,rpm:rLo}}
function sndStart(){
  if(actx){if(actx.state==='suspended'&&sndCfg.on&&!document.hidden)actx.resume();return}
  const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
  try{actx=new AC()}catch(e){actx=null;return}
  // the context has to start inside the tap; the rendering is spread over a few short tasks so the game doesn't hitch
  const it=sndBuild();(function step(){if(!it.next().done)setTimeout(step,0)})();
}
function* sndBuild(){
  const c=actx,sr=c.sampleRate;snd={};
  snd.comp=c.createDynamicsCompressor();snd.comp.threshold.value=-12;snd.comp.ratio.value=4;snd.comp.attack.value=0.005;snd.comp.release.value=0.2;snd.comp.connect(c.destination);
  snd.master=sndGain(0,snd.comp);
  snd.dry=sndGain(1,snd.master);snd.send=sndGain(0.16);const cv=c.createConvolver();cv.buffer=renderSpace(c);snd.send.connect(cv);cv.connect(snd.master);yield;
  // the three user buses sit inside each machine's voice, so a machine's engine, alarm and effects pan together
  const T=snd.T=sndVoice(),X=snd.X=sndVoice(),Mw=snd.M=sndVoice(),Sk=snd.S=sndVoice();
  for(const v of [T,X,Mw,Sk]){v.eng=sndGain(0,v.g);v.fx=sndGain(0,v.g);v.alarm=sndGain(0,v.g)}
  const tLo=toBuf(c,renderEngine(sr,750,{seed:3,cycles:10,decay:0.0055,jit:0.03,var:0.14,knock:0.8,mech:0.12,crack:0.8,crackF:550,tilt:2,tiltF:250,tilt2:2.5,pipe:6.5,fb:0.5,dry:0.35,
      res:[[68,1.4,1.1],[185,2.6,0.6],[470,3.5,0.32],[1150,3,0.2],[2700,2,0.1]],lp:6200}));yield;
  const tHi=toBuf(c,renderEngine(sr,1650,{seed:4,cycles:20,decay:0.0045,jit:0.02,var:0.08,knock:0.7,mech:0.1,crack:0.8,crackF:550,tilt:2,tiltF:250,tilt2:2.5,pipe:6.5,fb:0.5,dry:0.35,
      res:[[68,1.4,1.0],[185,2.6,0.65],[470,3.5,0.36],[1150,3,0.24],[2700,2,0.12]],lp:7000}));yield;
  const xLo=toBuf(c,renderEngine(sr,850,{seed:8,cycles:10,decay:0.0042,jit:0.035,var:0.12,knock:1.0,mech:0.18,crack:0.7,crackF:650,tilt:2,tiltF:250,tilt2:4,pipe:4,fb:0.38,dry:0.3,
      res:[[92,1.5,1.0],[250,2.8,0.55],[690,3.5,0.32],[1750,3,0.22]],lp:4800}));yield;
  const xHi=toBuf(c,renderEngine(sr,1800,{seed:9,cycles:20,decay:0.0036,jit:0.025,var:0.07,knock:0.9,mech:0.16,crack:0.7,crackF:650,tilt:2,tiltF:250,tilt2:4,pipe:4,fb:0.38,dry:0.3,
      res:[[92,1.5,0.95],[250,2.8,0.6],[690,3.5,0.36],[1750,3,0.26]],lp:5200}));
  yield;
  // mower V-twin: renderEngine's six-cylinder spacing at 1/3 the rpm gives a twin's firing rate (about 57 Hz at 3,400 rpm);
  // big jitter for the uneven 90° V beat, no injector knock, a small high muffler
  const mLo=toBuf(c,renderEngine(sr,880,{seed:13,cycles:12,decay:0.0035,jit:0.22,var:0.3,knock:0.08,mech:0.22,crack:0.9,crackF:900,tilt:2,tiltF:300,tilt2:3,pipe:2.2,fb:0.3,dry:0.4,
      res:[[140,1.6,0.9],[380,2.5,0.6],[1100,3,0.35],[2600,2.5,0.2]],lp:6500}));yield;
  const mHi=toBuf(c,renderEngine(sr,1150,{seed:14,cycles:16,decay:0.003,jit:0.2,var:0.25,knock:0.08,mech:0.2,crack:0.9,crackF:900,tilt:2,tiltF:300,tilt2:3,pipe:2.2,fb:0.3,dry:0.4,
      res:[[140,1.6,0.85],[380,2.5,0.65],[1100,3,0.4],[2600,2.5,0.24]],lp:7000}));yield;
  snd.engT=sndEngine(tLo,tHi,750,1650,T.eng);snd.engX=sndEngine(xLo,xHi,850,1800,X.eng);snd.engM=sndEngine(mLo,mHi,880,1150,Mw.eng);
  // the skid steer: a smaller diesel, the excavator's recording run a little faster
  snd.engS=sndEngine(xLo,xHi,850,1800,Sk.eng);
  const noise=toBuf(c,noiseBuf(sr,2,21)),gravel=toBuf(c,renderGravel(sr));yield;
  // truck: turbo whistle and spool whoosh, tire roar, gravel crunch, bed hydraulics
  snd.turbo=c.createOscillator();snd.turbo.type='sine';snd.turboG=sndGain(0,T.eng);snd.turbo.connect(snd.turboG);snd.turbo.start();
  snd.whooshG=sndGain(0,T.eng);snd.whooshF=sndFilter('bandpass',2600,1.1,snd.whooshG);sndLoopSrc(noise,snd.whooshF);
  snd.roarG=sndGain(0,T.fx);snd.roarF=sndFilter('lowpass',300,0.7,snd.roarG);sndLoopSrc(noise,snd.roarF,0.5);
  snd.gravG=sndGain(0,T.fx);snd.grav=sndLoopSrc(gravel,snd.gravG);
  snd.ptoG=sndGain(0,T.fx);snd.pto=c.createOscillator();snd.pto.type='sawtooth';snd.pto.connect(sndFilter('lowpass',700,1,snd.ptoG));snd.pto.start();
  // excavator: pump whine and oil hiss, the relief valve, bucket scrape, pouring dirt
  snd.pump=c.createOscillator();snd.pump.type='triangle';snd.pump2=c.createOscillator();snd.pump2.type='sine';
  snd.pumpG=sndGain(0,X.fx);snd.pump.connect(snd.pumpG);const p2g=sndGain(0.35,snd.pumpG);snd.pump2.connect(p2g);snd.pump.start();snd.pump2.start();
  snd.hissG=sndGain(0,X.fx);sndLoopSrc(noise,sndFilter('bandpass',1700,0.9,snd.hissG),0.8);
  snd.reliefG=sndGain(0,X.fx);sndLoopSrc(noise,sndFilter('bandpass',2950,14,snd.reliefG),1.1);
  snd.reliefT=c.createOscillator();snd.reliefT.frequency.value=2950;snd.reliefT.connect(sndGain(0.04,snd.reliefG));snd.reliefT.start();
  snd.scrapeG=sndGain(0,X.fx);snd.scrapeF=sndFilter('bandpass',1100,1.2,snd.scrapeG);snd.scrape=sndLoopSrc(gravel,snd.scrapeF,0.6);
  snd.pourG=sndGain(0,X.fx);sndLoopSrc(gravel,sndFilter('lowpass',1400,0.7,snd.pourG),0.45);
  snd.dumpG=sndGain(0,T.fx);sndLoopSrc(gravel,sndFilter('lowpass',1100,0.7,snd.dumpG),0.4);
  // mower: three blades whooshing through the deck, and the chop of tall grass going through them
  snd.bladeG=sndGain(0,Mw.fx);snd.bladeF=sndFilter('bandpass',650,2.2,snd.bladeG);sndLoopSrc(noise,snd.bladeF,0.7);
  snd.chopG=sndGain(0,Mw.fx);sndLoopSrc(gravel,sndFilter('bandpass',2600,0.9,snd.chopG),1.3);
  // rain: a soft hiss all around (not placed on a machine), with a little low patter
  snd.rainG=sndGain(0,snd.dry);sndLoopSrc(noise,sndFilter('highpass',900,0.5,sndFilter('lowpass',6500,0.5,snd.rainG)),0.9);
  snd.rainLoG=sndGain(0,snd.dry);sndLoopSrc(gravel,sndFilter('lowpass',700,0.6,snd.rainLoG),1.6);
  // splashing through puddles: a low slosh with a wet hiss on top
  snd.splashG=sndGain(0,snd.dry);sndLoopSrc(gravel,sndFilter('bandpass',420,0.9,snd.splashG),0.7);sndLoopSrc(noise,sndFilter('bandpass',1800,1.2,snd.splashG),1.1);
  // one-shots
  snd.clank=[toBuf(c,renderClank(sr,31,[[430,0.05,1],[1010,0.035,0.7],[1690,0.025,0.5],[2760,0.018,0.3]],0.16)),
             toBuf(c,renderClank(sr,32,[[380,0.05,1],[920,0.04,0.6],[1820,0.022,0.5],[3100,0.015,0.25]],0.16))];
  snd.gate=toBuf(c,renderClank(sr,33,[[150,0.12,1],[410,0.08,0.7],[880,0.05,0.4],[1600,0.03,0.25]],0.5));
  snd.hiss=toBuf(c,renderHiss(sr));snd.beep=toBuf(c,renderBeep(sr));
  snd.trackT=0;snd.beepT=0;snd.boost=0;snd.gear=0;snd.gearT=0;snd.moved=0;snd.bedMax=0;
  snd.ready=true;sndApply();if(!sndCfg.on)c.suspend();
}
function sndShot(buf,dest,t,rate,gain){const s=actx.createBufferSource();s.buffer=buf;s.playbackRate.value=rate||1;const g=sndGain(gain==null?1:gain,dest);s.connect(g);s.start(t);s.onended=()=>g.disconnect();return s}
for(const ev of ['pointerdown','keydown','touchend'])addEventListener(ev,sndStart,{capture:true,passive:true});
document.addEventListener('visibilitychange',()=>{if(!actx)return;if(document.hidden)actx.suspend();else if(sndCfg.on)actx.resume()});

// ---------- settings ----------
function sndSave(){try{localStorage.setItem('bhd_sndcfg',JSON.stringify(sndCfg))}catch(e){}}
function sndApply(){
  $('#soundBtn').textContent=sndCfg.on?'Sound':'Sound: off';
  const tg=$('#sndOn');if(tg){tg.textContent=sndCfg.on?'Sound on':'Sound off';tg.setAttribute('aria-pressed',sndCfg.on)}
  for(const k of ['master','eng','alarm','fx']){const el=$('#snd_'+k);if(el){el.value=sndCfg[k];$('#snd_'+k+'_v').textContent=sndCfg[k]+'%'}}
  if(!snd||!snd.ready)return;const t=actx.currentTime;
  snd.master.gain.setTargetAtTime(sndCfg.on?sndVol(sndCfg.master)*2.4:0,t,0.03);
  for(const v of [snd.T,snd.X,snd.M]){v.eng.gain.setTargetAtTime(sndVol(sndCfg.eng),t,0.03);v.fx.gain.setTargetAtTime(sndVol(sndCfg.fx),t,0.03);v.alarm.gain.setTargetAtTime(sndVol(sndCfg.alarm),t,0.03)}
}
function setSound(on){sndCfg.on=on;sndSave();if(!actx){if(on)sndStart();sndApply();return}
  sndApply();if(on)actx.resume();else setTimeout(()=>{if(!sndCfg.on)actx.suspend()},150)}
const sndBox=$('#sndBox');
function showSound(on){sndBox.hidden=!on;if(on)sndApply()}
$('#sndOn').onclick=()=>setSound(!sndCfg.on);
$('#sndDone').onclick=()=>showSound(false);
$('#sndReset').onclick=()=>{Object.assign(sndCfg,SND_DEF);sndSave();sndApply();if(actx&&sndCfg.on)actx.resume()};
for(const k of ['master','eng','alarm','fx'])$('#snd_'+k).addEventListener('input',e=>{sndCfg[k]=+e.target.value;sndSave();sndApply()});
sndBox.addEventListener('pointerdown',e=>{if(e.target===sndBox)showSound(false)});
addEventListener('keydown',e=>{if(e.code==='Escape')showSound(false)});
sndApply();

// ---------- per frame ----------
const sndR=new THREE.Vector3();
// distance gain, air absorption and stereo position of a point, from the camera
function sndPlace(v,x,y,z,t){sndR.setFromMatrixColumn(camera.matrixWorld,0);
  const dx=x-camera.position.x,dy=y-camera.position.y,dz=z-camera.position.z,d=Math.hypot(dx,dy,dz)||1;
  v.g.gain.setTargetAtTime(1/(1+(d/22)*(d/22)),t,0.05);
  v.air.frequency.setTargetAtTime(Math.max(1800,18000/(1+d/18)),t,0.08);
  if(v.pan)v.pan.pan.setTargetAtTime(clamp((dx*sndR.x+dy*sndR.y+dz*sndR.z)/d*0.8,-0.8,0.8),t,0.05)}
// two layers cross-faded by rpm, each re-pitched to it; load opens the filter
function sndEngineTo(e,rpm,load,lvl,t){
  const w=clamp((rpm-e.rLo)/(e.rHi-e.rLo),0,1);
  e.a.playbackRate.setTargetAtTime(rpm/e.rLo,t,0.03);e.b.playbackRate.setTargetAtTime(rpm/e.rHi,t,0.03);
  e.lg.gain.setTargetAtTime(Math.cos(w*Math.PI/2)*lvl,t,0.04);e.hg.gain.setTargetAtTime(Math.sin(w*Math.PI/2)*lvl,t,0.04);
  e.load.frequency.setTargetAtTime(900+4200*load+rpm*0.9,t,0.05)}
function updateSound(dt){
  if(!snd||!snd.ready||actx.state!=='running')return;
  const t=actx.currentTime,quiet=bench.on?0:1;
  sndPlace(snd.T,tr.x,tr.y+1.6,tr.z,t);sndPlace(snd.X,st.x,st.y+1.4,st.z,t);sndPlace(snd.M,mw.x,mw.y+0.6,mw.z,t);sndPlace(snd.S,sk.x,sk.y+1.2,sk.z,t);
  // truck: automatic box, five gears forward; revs climb through each and drop on the upshift
  const sp=Math.abs(tr.v),drive=tr.drive||0,pto=tr.bedIn>0?1:0;let gi=0,frac;
  if(tr.gear<0)frac=Math.min(1,sp/2.7);else{gi=Math.min(4,Math.floor(sp/1.8));frac=Math.min(1,(sp-gi*1.8)/1.8)}
  if(gi!==snd.gear){snd.gearT=gi>snd.gear?0.3:0;snd.gear=gi}snd.gearT-=dt;
  let rT=sp<0.25?680+drive*420:(gi===0?820:1150)+frac*(gi===0?1100:780);
  if(pto)rT=Math.max(rT,1250);if(snd.gearT>0)rT*=0.78;
  const e=snd.engT;e.rpm+=(rT-e.rpm)*Math.min(1,dt*(rT>e.rpm?4:7));
  const tl=Math.max(snd.gearT>0?0.15:drive,pto*0.6);
  sndEngineTo(e,e.rpm,tl,quiet*(0.55+0.45*tl),t);
  snd.boost+=((e.rpm-700)/1300*tl-snd.boost)*Math.min(1,dt*(tl>0.2?0.9:2.5));// turbo spools slowly, drops fast
  const bo=clamp(snd.boost,0,1);
  snd.turbo.frequency.setTargetAtTime(1900+4600*bo,t,0.08);snd.turboG.gain.setTargetAtTime(quiet*0.05*bo*bo,t,0.08);
  snd.whooshG.gain.setTargetAtTime(quiet*0.12*bo,t,0.08);
  const ground=tr.soft?1.2:tr.road?0.8:1;
  snd.roarF.frequency.setTargetAtTime(200+sp*55,t,0.1);snd.roarG.gain.setTargetAtTime(quiet*Math.min(1,sp/9)*0.5,t,0.1);
  snd.grav.playbackRate.setTargetAtTime(0.55+sp*0.12,t,0.1);snd.gravG.gain.setTargetAtTime(quiet*Math.min(1,sp/5)*0.55*ground,t,0.1);
  snd.pto.frequency.setTargetAtTime(150+e.rpm*0.06,t,0.05);snd.ptoG.gain.setTargetAtTime(quiet*pto*0.07,t,0.05);
  // air brakes let go with a psst once the truck rolls to a stop
  if(sp>2)snd.moved=1;if(snd.moved&&sp<0.05&&tr.brakeOn){snd.moved=0;sndShot(snd.hiss,snd.T.fx,t+0.25,0.95+0.1*Math.random(),0.8*quiet)}
  // tailgate bangs shut when the bed comes back down
  snd.bedMax=Math.max(snd.bedMax,tr.bed);if(tr.bed<0.015&&snd.bedMax>0.25){sndShot(snd.gate,snd.T.fx,t,0.9+0.1*Math.random(),0.9*quiet);snd.bedMax=0}
  if(tr.bed<0.015)snd.bedMax=0;
  snd.dumpG.gain.setTargetAtTime(quiet*Math.min(1,sndIn.dump*0.8),t,0.06);
  {const r=quiet*sndVol(sndCfg.fx)*ss(0,0.7,weather.r);snd.rainG.gain.setTargetAtTime(r*0.2,t,0.3);snd.rainLoG.gain.setTargetAtTime(r*0.12,t,0.3)}
  snd.splashG.gain.setTargetAtTime(quiet*sndVol(sndCfg.fx)*splashLvl*0.5,t,0.08);
  // backup alarm, scheduled on the audio clock: half a second on, half off, as long as it is in reverse
  const rev=tr.gear<0&&tr.shiftT<=0&&!bench.on;
  if(rev){if(snd.beepT<t)snd.beepT=t+0.05;while(snd.beepT<t+0.15){sndShot(snd.beep,snd.T.alarm,snd.beepT,1,1);snd.beepT+=1}}
  // excavator: demand pulls it off idle; hard soil and a relief valve blowing lug it down
  const hyd=Math.min(1,sndIn.hyd),dig=st.below?1:0,lug=dig?1-st.res:0,rel=sndIn.relief?1:0;
  const xT=850+1000*Math.min(1,hyd*1.4+dig*0.3)-220*lug-120*rel;
  const x=snd.engX;x.rpm+=(xT-x.rpm)*Math.min(1,dt*2.5);
  const xl=Math.min(1,hyd*0.7+lug*0.5+rel*0.6);
  sndEngineTo(x,x.rpm,xl,quiet*0.9*(0.6+0.4*xl),t);
  const pf=x.rpm*9/60;snd.pump.frequency.setTargetAtTime(pf,t,0.04);snd.pump2.frequency.setTargetAtTime(pf*2,t,0.04);
  snd.pumpG.gain.setTargetAtTime(quiet*(0.012+0.05*hyd+0.05*rel),t,0.05);snd.hissG.gain.setTargetAtTime(quiet*(0.03*hyd+0.06*rel),t,0.05);
  snd.reliefG.gain.setTargetAtTime(quiet*0.32*rel,t,0.03);
  const rock=st.soil===3?1:0;snd.scrapeF.frequency.setTargetAtTime(rock?2400:1000,t,0.05);snd.scrape.playbackRate.setTargetAtTime(rock?1:0.6,t,0.05);
  snd.scrapeG.gain.setTargetAtTime(quiet*dig*Math.min(1,hyd*1.5)*(0.35+0.4*rock),t,0.04);
  snd.pourG.gain.setTargetAtTime(quiet*Math.min(1,sndIn.pour*1.6)*0.9,t,0.05);
  // tracks: a clank per shoe passing the sprocket
  if(sndIn.track>0.05&&!bench.on){snd.trackT-=dt*sndIn.track*15;if(snd.trackT<=0){snd.trackT+=1;
    sndShot(snd.clank[Math.random()<0.5?0:1],snd.X.fx,t+0.01,0.88+0.24*Math.random(),0.35+0.25*Math.random())}}else snd.trackT=Math.random()*0.5;
  // mower: runs while it is the machine in hand, held at the governor; tall grass in the blades drags the revs down
  const mb=mw.blades,mm=snd.engM,mT=900+250*mb-90*mw.load;mm.rpm+=(mT-mm.rpm)*Math.min(1,dt*3);
  sndEngineTo(mm,mm.rpm,Math.min(1,0.25+0.75*mw.load),quiet*0.8*mb,t);
  snd.bladeF.frequency.setTargetAtTime(500+250*mb-80*mw.load,t,0.1);snd.bladeG.gain.setTargetAtTime(quiet*0.22*mb*mb,t,0.1);
  snd.chopG.gain.setTargetAtTime(quiet*0.35*mw.load*mb,t,0.05);
  // skid steer: runs while you drive it; driving, the loader and the bucket biting the ground pull the revs up
  const sr=sk.run,ss_=snd.engS,sT=950+800*Math.min(1,Math.abs(sk.v)/SK_SPD*0.6+sndIn.skHyd*0.6+sndIn.skDig*0.5);ss_.rpm+=(sT*1.08-ss_.rpm)*Math.min(1,dt*3);
  sndEngineTo(ss_,ss_.rpm,Math.min(1,sndIn.skHyd*0.6+sndIn.skDig),quiet*0.7*sr,t);sndIn.skDig=Math.max(0,sndIn.skDig-dt*3);
}
