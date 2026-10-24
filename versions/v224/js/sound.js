// Corley's Island: sound. Every sound is a real recording: CC0 field recordings from Freesound, cut into seamless loops,
// one-shots and sprites of hits by tools/sounds.py (sounds/*.mp3, credits in sounds/CREDITS.md). Each machine's engine is
// an idle and a working recording, cross-faded and gently re-pitched with its revs, the throttle opening a filter; around
// them: hydraulic pump whine and the relief valve, track clatter, the bucket biting and scraping, pouring dirt, tyres on
// dirt, air brakes, the tailgate, the backup alarm, the boats' outboards, hull knocks and wash, the tug's diesel and horn,
// and thunder. Each machine is panned and faded by distance from the camera, with an echo off the cliffs; from the cab
// view your own machine is heard through the cab. Nature (wind, birds, crickets, frogs, the lake, rain, footsteps) is in
// ambience.js. The files are fetched once the page has loaded and decoded on the first tap or key.
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.
const SND_DEF={on:true,master:70,eng:80,alarm:60,fx:70,amb:60};
const sndCfg=Object.assign({},SND_DEF);
try{const s=JSON.parse(localStorage.getItem('bhd_sndcfg')||'null');if(s)Object.assign(sndCfg,s);else if(localStorage.getItem('bhd_snd')==='0')sndCfg.on=false}catch(e){}
// what the frame loop tells the mixer each frame
const sndIn={hyd:0,relief:false,track:0,pour:0,dump:0,skHyd:0,skDig:0,skPour:0};
let actx=null,snd=null;
const sndVol=v=>(v/100)*(v/100);// sliders are perceptual: half way is a quarter of the power

// ---------- the recordings ----------
// SND_FILES start (written by tools/sounds.py: a loop's length and the pad either side of it, the alarm's period, a sprite's hits as [start, length])
const SND_FILES={"x_idle":{"loop":4.0,"pad":0.25},"x_work":{"loop":5.0,"pad":0.25},"t_idle":{"loop":4.0,"pad":0.25},"t_work":{"loop":4.0,"pad":0.25},"h_idle":{"loop":4.0,"pad":0.25},"s_run":{"loop":4.0,"pad":0.25},"m_idle":{"loop":3.0,"pad":0.25},"m_run":{"loop":4.0,"pad":0.25},"b_idle":{"loop":3.0,"pad":0.25},"b_run":{"loop":3.0,"pad":0.25},"o_idle":{"loop":4.0,"pad":0.25},"o_run":{"loop":4.0,"pad":0.25},"f_run":{"loop":5.0,"pad":0.25},"g_run":{"loop":5.0,"pad":0.25},"p_idle":{"loop":4.0,"pad":0.25},"p_run":{"loop":3.5,"pad":0.25},"a_idle":{"loop":3.0,"pad":0.25},"a_run":{"loop":1.5,"pad":0.25},"tracks":{"loop":5.0,"pad":0.25},"hyd":{"loop":1.39998,"pad":0.25},"pour":{"loop":5.0,"pad":0.25},"scrape":{"loop":1.5,"pad":0.25},"tire":{"loop":4.0,"pad":0.25},"wash":{"loop":5.0,"pad":0.25},"splash":{"loop":6.0,"pad":0.25},"trickle":{"loop":6.0,"pad":0.25},"alarm":{"period":1.19},"brake":{},"horn":{},"gate":{},"rocks":{},"cavein":{},"thud":{"hits":[[0.0,0.73],[0.81,0.73],[1.62,0.73],[2.4299,0.73],[3.2399,0.73]]},"dig":{"hits":[[0.0,0.63],[0.71,0.63],[1.42,0.63],[2.13,0.63],[2.84,0.63],[3.55,0.63],[4.26,0.63],[4.97,0.63]]},"slap":{"hits":[[0.0,0.63],[0.71,0.63],[1.42,0.63],[2.13,0.63],[2.84,0.63],[3.55,0.63]]},"step_g":{"hits":[[0.0,0.35],[0.43,0.35],[0.86,0.35],[1.29,0.35],[1.72,0.35],[2.15,0.35],[2.58,0.35],[3.01,0.35],[3.44,0.35],[3.87,0.35]]},"step_s":{"hits":[[0.0,0.35],[0.43,0.35],[0.86,0.35],[1.29,0.35],[1.72,0.35],[2.15,0.35],[2.58,0.35],[3.01,0.35],[3.44,0.35],[3.87,0.35]]},"gull":{"hits":[[0.0,1.13],[1.21,1.13],[2.42,1.13]]},"thun_n":{},"thun_f":{},"thun_r":{},"rain":{"loop":10.0,"pad":0.25},"rain_h":{"loop":8.0,"pad":0.25},"wind":{"loop":10.0,"pad":0.25},"birds":{"loop":15.0,"pad":0.25},"crickets":{"loop":10.0,"pad":0.25},"frogs":{"loop":15.0,"pad":0.25},"lap":{"loop":12.0,"pad":0.25}};
// SND_FILES end
const SND_RAW={};
function sndFetch(){for(const n in SND_FILES)if(!SND_RAW[n])SND_RAW[n]=fetch('sounds/'+n+'.mp3').then(r=>{if(!r.ok)throw new Error(r.status);return r.arrayBuffer()})}
addEventListener('load',()=>setTimeout(sndFetch,1500));
function sndDecode(n){return SND_RAW[n].then(a=>new Promise((ok,no)=>actx.decodeAudioData(a,ok,no))).catch(()=>null)}
function sndRng(seed){let a=seed>>>0;return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296}}
function noiseBuf(sr,sec,seed){const r=sndRng(seed),b=new Float32Array(Math.round(sr*sec));for(let i=0;i<b.length;i++)b[i]=r()*2-1;return b}
function toBuf(c,a){const b=c.createBuffer(1,a.length,c.sampleRate);b.getChannelData(0).set(a);return b}
// outdoor space: a few early reflections off the cliffs, then a soft tail
function renderSpace(c){const sr=c.sampleRate,n=Math.round(sr*1.4),ir=c.createBuffer(2,n,sr),r=sndRng(5);
  for(let ch=0;ch<2;ch++){const d=ir.getChannelData(ch);
    for(const [t,a] of [[0.031,0.45],[0.058,0.32],[0.093,0.28],[0.15,0.2],[0.21,0.14],[0.33,0.08]]){const k=Math.round((t+ch*0.004*(r()-0.3))*sr);if(k<n)d[k]+=a*(r()<0.5?-1:1)}
    let lp=0;for(let i=0;i<n;i++){lp+=((r()*2-1)-lp)*0.35;d[i]+=lp*0.1*Math.exp(-i/sr/0.38)*Math.min(1,i/sr/0.05)}}
  return ir}

// ---------- live graph ----------
function sndGain(v,dest){const g=actx.createGain();g.gain.value=v;if(dest)g.connect(dest);return g}
function sndFilter(type,f,q,dest){const b=actx.createBiquadFilter();b.type=type;b.frequency.value=f;b.Q.value=q;if(dest)b.connect(dest);return b}
// a looping recording: its seamless stretch, from a random point in it so two machines on one recording don't phase
function sndLoopSrc(n,dest,rate){const s=actx.createBufferSource(),b=snd.buf[n],f=SND_FILES[n]||{};s.buffer=b||snd.none;s.loop=true;
  if(b&&f.loop){s.loopStart=f.pad;s.loopEnd=f.pad+f.loop}s.playbackRate.value=rate||1;s.connect(dest);s.start(0,b&&f.loop?f.pad+Math.random()*f.loop:0);return s}
// a recording played once (a sprite plays one of its hits at random)
function sndShot(n,dest,t,rate,gain){const b=snd&&snd.buf[n];if(!b)return null;const f=SND_FILES[n],s=actx.createBufferSource();s.buffer=b;s.playbackRate.value=rate||1;
  const g=sndGain(gain==null?1:gain,dest);s.connect(g);if(f.hits){const h=f.hits[Math.random()*f.hits.length|0];s.start(t,h[0],h[1])}else s.start(t);
  s.onended=()=>g.disconnect();return s}
// a machine's output stage: distance gain, air absorption, stereo position, and a send to the shared space
function sndVoice(){const pan=actx.createStereoPanner?actx.createStereoPanner():null,air=sndFilter('lowpass',18000,0.5),g=sndGain(0);
  g.connect(air);if(pan){air.connect(pan);pan.connect(snd.dry);pan.connect(snd.send)}else{air.connect(snd.dry);air.connect(snd.send)}
  return {g,air,pan,eng:sndGain(0,g),fx:sndGain(0,g),alarm:sndGain(0,g)}}
// an engine: an idle and a working recording (hi null: one recording round rNom), a load filter, into a bus
function sndEngine(lo,hi,rLo,rHi,dest,rNom){const load=sndFilter('lowpass',4000,0.5,dest),lg=sndGain(0,load),hg=sndGain(0,load);
  return {a:sndLoopSrc(lo,lg),b:hi?sndLoopSrc(hi,hg):null,lg,hg,load,rLo,rHi,rNom:rNom||rLo,rpm:rLo}}
function sndStart(){
  if(actx){if(actx.state==='suspended'&&sndCfg.on&&!document.hidden)actx.resume();return}
  const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
  try{actx=new AC()}catch(e){actx=null;return}
  // the context has to start inside the tap; the files decode in the background and the mixer is built when they are in
  sndFetch();sndBuild();
}
async function sndBuild(){
  const c=actx,names=Object.keys(SND_FILES),bufs=await Promise.all(names.map(sndDecode));
  snd={buf:{},none:c.createBuffer(1,1,c.sampleRate)};names.forEach((n,i)=>{if(bufs[i])snd.buf[n]=bufs[i]});
  snd.comp=c.createDynamicsCompressor();snd.comp.threshold.value=-14;snd.comp.knee.value=8;snd.comp.ratio.value=4;snd.comp.attack.value=0.004;snd.comp.release.value=0.25;snd.comp.connect(c.destination);
  snd.master=sndGain(0,snd.comp);
  snd.dry=sndGain(1,snd.master);snd.send=sndGain(0.14);const cv=c.createConvolver();cv.buffer=renderSpace(c);snd.send.connect(cv);cv.connect(snd.master);
  // nature has its own slider; it is not placed on a machine (ambience.js pans its beds itself)
  snd.amb=sndGain(0,snd.dry);snd.ambSend=sndGain(0,snd.send);
  // the user buses sit inside each machine's voice, so a machine's engine, alarm and effects pan together
  const T=snd.T=sndVoice(),X=snd.X=sndVoice(),Mw=snd.M=sndVoice(),Sk=snd.S=sndVoice(),Bk=snd.B=sndVoice(),Ob=snd.O=sndVoice(),Fb=snd.F=sndVoice(),Tg=snd.G=sndVoice(),Hv=snd.H=sndVoice();
  snd.voices=[T,X,Mw,Sk,Bk,Ob,Fb,Tg,Hv];
  snd.engT=sndEngine('t_idle','t_work',700,1700,T.eng);snd.engX=sndEngine('x_idle','x_work',850,1800,X.eng);
  snd.engM=sndEngine('m_idle','m_run',880,1150,Mw.eng);snd.engS=sndEngine('s_run',null,950,1750,Sk.eng,1300);
  snd.engH=sndEngine('h_idle','t_work',750,1650,Hv.eng);snd.engP=sndEngine('p_idle','p_run',700,2600,Hv.eng);snd.engA=sndEngine('a_idle','a_run',1300,4500,Hv.eng);
  snd.hvTireG=sndGain(0,Hv.fx);snd.hvTire=sndLoopSrc('tire',sndFilter('lowpass',6000,0.6,snd.hvTireG));snd.engB=sndEngine('b_idle','b_run',1000,2000,Bk.eng);
  snd.engO=sndEngine('o_idle','o_run',800,2400,Ob.eng);snd.engF=sndEngine('f_run',null,900,2000,Fb.eng,1500);snd.engG=sndEngine('g_run',null,700,1200,Tg.eng,950);
  snd.engO.rpm=snd.engF.rpm=800;snd.engG.rpm=750;
  const noise=toBuf(c,noiseBuf(c.sampleRate,2,21));snd.noise=noise;
  const noiseSrc=(dest,rate)=>{const s=c.createBufferSource();s.buffer=noise;s.loop=true;s.playbackRate.value=rate||1;s.connect(dest);s.start(0,Math.random()*2);return s};
  // the boat you drive: water rushing along the hull, and knocks as it meets the swells
  snd.washG=sndGain(0,Ob.fx);snd.washF=sndFilter('lowpass',1500,0.6,snd.washG);snd.wash=sndLoopSrc('wash',snd.washF);snd.slapT=0;
  // truck: turbo whoosh, tyre roar on the road, crunch on dirt, the bed pump
  snd.whooshG=sndGain(0,T.eng);noiseSrc(sndFilter('bandpass',2600,1.1,snd.whooshG));
  snd.roarG=sndGain(0,T.fx);snd.roarF=sndFilter('lowpass',300,0.7,snd.roarG);noiseSrc(snd.roarF,0.5);
  snd.gravG=sndGain(0,T.fx);snd.grav=sndLoopSrc('tire',sndFilter('lowpass',6000,0.6,snd.gravG));
  snd.ptoG=sndGain(0,T.fx);snd.pto=sndLoopSrc('hyd',snd.ptoG);
  // excavator: pump whine, the relief valve, track clatter, the bucket in the ground, pouring dirt
  snd.pumpG=sndGain(0,X.fx);snd.pump=sndLoopSrc('hyd',snd.pumpG);
  snd.reliefG=sndGain(0,X.fx);snd.relief=sndLoopSrc('hyd',sndFilter('bandpass',2900,3,snd.reliefG),1.4);noiseSrc(sndFilter('bandpass',2950,14,snd.reliefG),1.1);
  snd.trackG=sndGain(0,X.fx);snd.tracks=sndLoopSrc('tracks',snd.trackG);
  snd.scrapeG=sndGain(0,X.fx);snd.scrapeF=sndFilter('lowpass',1200,0.6,snd.scrapeG);snd.scrape=sndLoopSrc('scrape',snd.scrapeF,0.8);snd.digT=0;
  snd.pourG=sndGain(0,X.fx);sndLoopSrc('pour',sndFilter('lowpass',5000,0.6,snd.pourG),0.9);
  snd.dumpG=sndGain(0,T.fx);sndLoopSrc('pour',sndFilter('lowpass',2500,0.6,snd.dumpG),0.7);snd.dumpOn=0;
  // skid steer: its pump and the bucket emptying
  snd.skPumpG=sndGain(0,Sk.fx);snd.skPump=sndLoopSrc('hyd',snd.skPumpG,1.1);
  snd.skPourG=sndGain(0,Sk.fx);sndLoopSrc('pour',sndFilter('lowpass',4000,0.6,snd.skPourG),1);
  // splashing through puddles
  snd.splashG=sndGain(0,snd.dry);sndLoopSrc('splash',snd.splashG);
  snd.beepT=0;snd.boost=0;snd.gear=0;snd.gearT=0;snd.moved=0;snd.bedMax=0;
  snd.ready=true;sndApply();if(!sndCfg.on)c.suspend();
}
// thunder from a strike d metres away: it arrives at the speed of sound, quieter and duller the farther it came
function sndThunder(d){if(!snd||!snd.ready||!sndCfg.on)return;const near=d<800,t=actx.currentTime+d/343,f=sndFilter('lowpass',near?8000:Math.max(350,2600-d*0.7),0.5,snd.amb);
  sndShot(near?'thun_n':Math.random()<0.5?'thun_f':'thun_r',f,t,0.9+Math.random()*0.15,Math.min(1,700/d)*1.3);setTimeout(()=>f.disconnect(),(d/343+16)*1000)}
for(const ev of ['pointerdown','keydown','touchend'])addEventListener(ev,sndStart,{capture:true,passive:true});
document.addEventListener('visibilitychange',()=>{if(!actx)return;if(document.hidden)actx.suspend();else if(sndCfg.on)actx.resume()});

// ---------- settings ----------
const SND_SLIDERS=['master','eng','alarm','fx','amb'];
function sndSave(){try{localStorage.setItem('bhd_sndcfg',JSON.stringify(sndCfg))}catch(e){}}
function sndApply(){
  $('#soundBtn').textContent=sndCfg.on?'Sound':'Sound: off';
  const tg=$('#sndOn');if(tg){tg.textContent=sndCfg.on?'Sound on':'Sound off';tg.setAttribute('aria-pressed',sndCfg.on)}
  for(const k of SND_SLIDERS){const el=$('#snd_'+k);if(el){el.value=sndCfg[k];$('#snd_'+k+'_v').textContent=sndCfg[k]+'%'}}
  if(!snd||!snd.ready)return;const t=actx.currentTime;
  snd.master.gain.setTargetAtTime(sndCfg.on?sndVol(sndCfg.master)*2.4:0,t,0.03);
  snd.amb.gain.setTargetAtTime(sndVol(sndCfg.amb),t,0.03);snd.ambSend.gain.setTargetAtTime(sndVol(sndCfg.amb)*0.5,t,0.03);
  for(const v of snd.voices){v.eng.gain.setTargetAtTime(sndVol(sndCfg.eng),t,0.03);v.fx.gain.setTargetAtTime(sndVol(sndCfg.fx),t,0.03);v.alarm.gain.setTargetAtTime(sndVol(sndCfg.alarm),t,0.03)}
}
function setSound(on){sndCfg.on=on;sndSave();if(!actx){if(on)sndStart();sndApply();return}
  sndApply();if(on)actx.resume();else setTimeout(()=>{if(!sndCfg.on)actx.suspend()},150)}
const sndBox=$('#sndBox');
function showSound(on){sndBox.hidden=!on;if(on)sndApply()}
$('#sndOn').onclick=()=>setSound(!sndCfg.on);
$('#sndDone').onclick=()=>showSound(false);
$('#sndReset').onclick=()=>{Object.assign(sndCfg,SND_DEF);sndSave();sndApply();if(actx&&sndCfg.on)actx.resume()};
for(const k of SND_SLIDERS)$('#snd_'+k).addEventListener('input',e=>{sndCfg[k]=+e.target.value;sndSave();sndApply()});
sndBox.addEventListener('pointerdown',e=>{if(e.target===sndBox)showSound(false)});
addEventListener('keydown',e=>{if(e.code==='Escape')showSound(false)});
sndApply();

// ---------- per frame ----------
const sndR=new THREE.Vector3();
// distance gain, air absorption and stereo position of a point, from the camera; the machine you ride in the cab view is
// heard through the cab: close, centred and muffled
function sndPlace(v,x,y,z,t,cab){
  if(cab){v.g.gain.setTargetAtTime(1.15,t,0.08);v.air.frequency.setTargetAtTime(1400,t,0.08);if(v.pan)v.pan.pan.setTargetAtTime(0,t,0.08);return}
  sndR.setFromMatrixColumn(camera.matrixWorld,0);
  const dx=x-camera.position.x,dy=y-camera.position.y,dz=z-camera.position.z,d=Math.hypot(dx,dy,dz)||1;
  v.g.gain.setTargetAtTime(1/(1+(d/22)*(d/22)),t,0.05);
  v.air.frequency.setTargetAtTime(Math.max(1800,18000/(1+d/18)),t,0.08);
  if(v.pan)v.pan.pan.setTargetAtTime(clamp((dx*sndR.x+dy*sndR.y+dz*sndR.z)/d*0.8,-0.8,0.8),t,0.05)}
// the idle and working recordings cross-faded by rpm and re-pitched toward it (to the 0.7 power: a recording pushed far
// off its own pitch stops sounding real); load opens the filter. w overrides the cross-fade (the mower's blades)
function sndEngineTo(e,rpm,load,lvl,t,w){
  if(!e.b){e.a.playbackRate.setTargetAtTime(Math.pow(rpm/e.rNom,0.7),t,0.05);e.lg.gain.setTargetAtTime(lvl,t,0.05)}
  else{if(w==null)w=ss(e.rLo,e.rHi,rpm);
    e.a.playbackRate.setTargetAtTime(Math.pow(rpm/e.rLo,0.7),t,0.05);e.b.playbackRate.setTargetAtTime(Math.pow(rpm/e.rHi,0.7),t,0.05);
    e.lg.gain.setTargetAtTime(Math.cos(w*Math.PI/2)*lvl,t,0.06);e.hg.gain.setTargetAtTime(Math.sin(w*Math.PI/2)*lvl,t,0.06)}
  e.load.frequency.setTargetAtTime(3200+9000*load+rpm*1.2,t,0.06)}
function updateSound(dt){
  if(!snd||!snd.ready||actx.state!=='running')return;
  const t=actx.currentTime,quiet=bench.on?0:1,cab=camMode==='cab'?mode:'';
  sndPlace(snd.T,tr.x,tr.y+1.6,tr.z,t,cab==='truck');sndPlace(snd.X,st.x,st.y+1.4,st.z,t,cab==='dig'||cab==='drive');sndPlace(snd.M,mw.x,mw.y+0.6,mw.z,t);
  sndPlace(snd.S,sk.x,sk.y+1.2,sk.z,t,cab==='skid');sndPlace(snd.B,bk.x,bk.y+0.6,bk.z,t);
  // truck: automatic box, five gears forward; revs climb through each and drop on the upshift
  const sp=Math.abs(tr.v),drive=tr.drive||0,pto=tr.bedIn>0?1:0;let gi=0,frac;
  if(tr.gear<0)frac=Math.min(1,sp/2.7);else{gi=Math.min(4,Math.floor(sp/1.8));frac=Math.min(1,(sp-gi*1.8)/1.8)}
  if(gi!==snd.gear){snd.gearT=gi>snd.gear?0.3:0;snd.gear=gi}snd.gearT-=dt;
  let rT=sp<0.25?700+drive*420:(gi===0?820:1150)+frac*(gi===0?1100:780);
  if(pto)rT=Math.max(rT,1250);if(snd.gearT>0)rT*=0.78;
  const e=snd.engT;e.rpm+=(rT-e.rpm)*Math.min(1,dt*(rT>e.rpm?4:7));
  const tl=Math.max(snd.gearT>0?0.15:drive,pto*0.6);
  sndEngineTo(e,e.rpm,tl,quiet*(0.6+0.4*tl),t);
  snd.boost+=((e.rpm-700)/1300*tl-snd.boost)*Math.min(1,dt*(tl>0.2?0.9:2.5));// turbo spools slowly, drops fast
  const bo=clamp(snd.boost,0,1);snd.whooshG.gain.setTargetAtTime(quiet*0.07*bo,t,0.08);
  const ground=tr.soft?1.2:tr.road?0.6:1;
  snd.roarF.frequency.setTargetAtTime(200+sp*55,t,0.1);snd.roarG.gain.setTargetAtTime(quiet*Math.min(1,sp/9)*(tr.road?0.45:0.25),t,0.1);
  snd.grav.playbackRate.setTargetAtTime(0.6+sp*0.08,t,0.1);snd.gravG.gain.setTargetAtTime(quiet*Math.min(1,sp/5)*0.7*ground,t,0.1);
  snd.pto.playbackRate.setTargetAtTime(e.rpm/1500,t,0.05);snd.ptoG.gain.setTargetAtTime(quiet*pto*0.3,t,0.05);
  // air brakes let go with a psst once the truck rolls to a stop
  if(sp>2)snd.moved=1;if(snd.moved&&sp<0.05&&tr.brakeOn){snd.moved=0;sndShot('brake',snd.T.fx,t+0.25,0.95+0.1*Math.random(),0.7*quiet)}
  // tailgate bangs shut when the bed comes back down
  snd.bedMax=Math.max(snd.bedMax,tr.bed);if(tr.bed<0.015&&snd.bedMax>0.25){sndShot('gate',snd.T.fx,t,0.85+0.1*Math.random(),0.9*quiet);snd.bedMax=0}
  if(tr.bed<0.015)snd.bedMax=0;
  // a load sliding out of the bed: the first rush of rock, then the pour
  const dm=Math.min(1,sndIn.dump*0.8);if(dm>0.15&&!snd.dumpOn){snd.dumpOn=1;sndShot('rocks',snd.T.fx,t,0.75+0.1*Math.random(),0.6*quiet)}else if(dm<0.05)snd.dumpOn=0;
  snd.dumpG.gain.setTargetAtTime(quiet*dm*0.9,t,0.06);
  snd.splashG.gain.setTargetAtTime(quiet*sndVol(sndCfg.fx)*splashLvl*0.6,t,0.08);
  // backup alarm, scheduled on the audio clock at the recorded beeper's own pace, as long as it is in reverse
  const rev=tr.gear<0&&tr.shiftT<=0&&!bench.on,per=(SND_FILES.alarm||{}).period||1;
  if(rev){if(snd.beepT<t)snd.beepT=t+0.05;while(snd.beepT<t+0.15){sndShot('alarm',snd.T.alarm,snd.beepT,1,0.8);snd.beepT+=per}}
  // excavator: demand pulls it off idle; hard soil and a relief valve blowing lug it down
  const hyd=Math.min(1,sndIn.hyd),dig=st.below?1:0,lug=dig?1-st.res:0,rel=sndIn.relief?1:0;
  const xT=850+1000*Math.min(1,hyd*1.4+dig*0.3)-220*lug-120*rel;
  const x=snd.engX;x.rpm+=(xT-x.rpm)*Math.min(1,dt*2.5);
  const xl=Math.min(1,hyd*0.7+lug*0.5+rel*0.6);
  sndEngineTo(x,x.rpm,xl,quiet*0.9*(0.65+0.35*xl),t);
  // the pump turns with the engine; demand and the relief valve load it and its whine comes up
  snd.pump.playbackRate.setTargetAtTime(x.rpm/1500,t,0.05);snd.pumpG.gain.setTargetAtTime(quiet*(0.04+0.3*hyd+0.2*rel),t,0.05);
  snd.relief.playbackRate.setTargetAtTime(x.rpm/1100,t,0.05);snd.reliefG.gain.setTargetAtTime(quiet*0.35*rel,t,0.03);
  // tracks: the clatter of the shoes round the sprocket and idler, faster and louder with speed
  const tk=bench.on?0:Math.min(1,sndIn.track);snd.tracks.playbackRate.setTargetAtTime(0.8+0.35*tk,t,0.1);snd.trackG.gain.setTargetAtTime(quiet*0.8*ss(0.03,0.6,tk),t,0.08);
  // the bucket in the ground: a bite of soil now and then, and the teeth scraping (bright and loud on rock)
  const rock=st.soil===3?1:0,bite=dig*Math.min(1,hyd*1.5);
  snd.scrapeF.frequency.setTargetAtTime(rock?9000:1300,t,0.05);snd.scrape.playbackRate.setTargetAtTime(rock?1:0.75,t,0.05);
  snd.scrapeG.gain.setTargetAtTime(quiet*bite*(0.3+0.5*rock),t,0.04);
  if(bite>0.1&&!bench.on){snd.digT-=dt*(0.8+bite*1.5);if(snd.digT<=0){snd.digT=0.4+Math.random()*0.6;sndShot('dig',snd.X.fx,t+0.01,(rock?1.1:0.8)+0.2*Math.random(),(0.35+0.4*bite)*(0.6+0.4*Math.random()))}}
  snd.pourG.gain.setTargetAtTime(quiet*Math.min(1,sndIn.pour*1.6)*0.9,t,0.05);
  // mower: runs while it is the machine in hand, held at the governor; driving and cutting bring in the mowing recording,
  // and tall grass in the blades drags the revs down
  const mb=mw.blades,mm=snd.engM,mT=900+200*mb-90*mw.load;mm.rpm+=(mT-mm.rpm)*Math.min(1,dt*3);
  sndEngineTo(mm,mm.rpm,Math.min(1,0.3+0.7*mw.load),quiet*0.8*mb,t,Math.min(1,Math.abs(mw.v)/2+Math.abs(mw.w)*0.3+mw.load));
  // skid steer: runs while you drive it; driving, the loader and the bucket biting the ground pull the revs up
  const sr=sk.run,ss_=snd.engS,sT=950+800*Math.min(1,Math.abs(sk.v)/TU.skSpd*0.6+sndIn.skHyd*0.6+sndIn.skDig*0.5);ss_.rpm+=(sT-ss_.rpm)*Math.min(1,dt*3);
  sndEngineTo(ss_,ss_.rpm,Math.min(1,sndIn.skHyd*0.6+sndIn.skDig),quiet*0.75*sr,t);
  snd.skPump.playbackRate.setTargetAtTime(ss_.rpm/1400,t,0.05);snd.skPumpG.gain.setTargetAtTime(quiet*sr*(0.03+0.25*Math.min(1,sndIn.skHyd)),t,0.05);
  snd.skPourG.gain.setTargetAtTime(quiet*Math.min(1,sndIn.skPour*1.6)*0.8,t,0.05);sndIn.skDig=Math.max(0,sndIn.skDig-dt*3);
  // dirt bike: idles while you sit on it; the gas (and the back wheel spinning free in the air) sends the revs up
  const be=snd.engB,bT=1000+1000*Math.min(1,Math.max(0,bk.thr)*(bk.air?1:0.45)+Math.abs(bk.v)/TU.bkSpd*0.6);be.rpm+=(bT-be.rpm)*Math.min(1,dt*(bT>be.rpm?6:3));
  sndEngineTo(be,be.rpm,Math.max(0,bk.thr),quiet*0.65*bk.run,t);
  // Dexter's machine you are in (heavy.js): idles while you sit in it; driving and the hydraulics pull the revs up. The
  // pickup shifts through four gears as it gathers speed; the four-wheeler's belt drive holds the revs up with the gas
  {const R=WK_RIDES[wk.inside],h=R&&R.m==='heavy'?R.o:null,car=h&&h.K.car;if(h)sndPlace(snd.H,h.x,h.y+1.2,h.z,t,cab==='heavy'&&!h.K.rider);
    const he=snd.engH,hT=750+900*(h&&!car?Math.min(1,Math.abs(h.v)/h.top*0.7+h.hyd*0.5+Math.abs(h.thr)*0.2):0);he.rpm+=(hT-he.rpm)*Math.min(1,dt*3);
    sndEngineTo(he,he.rpm,h&&!car?Math.min(1,Math.abs(h.thr)*0.7+h.hyd*0.6):0,quiet*0.8*(h&&!car?h.run:0),t);
    const sp=h?Math.abs(h.v):0,th=h?Math.max(0,h.thr*Math.sign(h.v||h.thr)):0;
    const pe=snd.engP,pg=Math.min(3,Math.floor(sp/7)),pT=car==='pk'?(sp<0.3?700+th*500:1100+1300*Math.min(1,(sp-pg*7)/7)*(0.6+0.4*th)+th*300):700;pe.rpm+=(pT-pe.rpm)*Math.min(1,dt*(pT>pe.rpm?4:6));
    sndEngineTo(pe,pe.rpm,th,quiet*0.8*(car==='pk'?h.run:0),t);
    const ae=snd.engA,aT=car==='at'?1300+3200*Math.min(1,th*0.55+sp/Math.max(1,h.top)*0.6):1300;ae.rpm+=(aT-ae.rpm)*Math.min(1,dt*(aT>ae.rpm?6:4));
    sndEngineTo(ae,ae.rpm,th,quiet*0.7*(car==='at'?h.run:0),t);
    // tyres on dirt and gravel, and the scrub of a slide
    snd.hvTire.playbackRate.setTargetAtTime(0.6+sp*0.06,t,0.1);snd.hvTireG.gain.setTargetAtTime(quiet*(car?Math.min(1,sp/6)*0.6+Math.min(1,(h.slide||0)*3)*Math.min(1,sp/4)*0.6:0),t,0.1)}
  // the boat you are in: idles while you are aboard, the throttle and speed send the revs up; water along the hull and
  // a knock now and then as it meets the swells (often, and harder, the faster it goes; a gentle lap at rest)
  {const R=WK_RIDES[wk.inside],ob=R&&R.m==='boat'?R.o:null,oe=snd.engO;
    if(ob){const sy=Math.sin(ob.yaw),cy=Math.cos(ob.yaw);sndPlace(snd.O,ob.x-sy*2.6,ob.y+0.6,ob.z-cy*2.6,t)}
    const sp=ob?Math.abs(ob.v):0,th=ob?Math.abs(ob.thr||0):0,oT=800+1600*Math.min(1,Math.max(th,sp/TU.btSpeed));oe.rpm+=(oT-oe.rpm)*Math.min(1,dt*(oT>oe.rpm?3:2));
    sndEngineTo(oe,oe.rpm,th,quiet*(ob?0.75:0),t);
    snd.wash.playbackRate.setTargetAtTime(0.7+0.05*sp,t,0.2);snd.washF.frequency.setTargetAtTime(700+250*sp,t,0.1);snd.washG.gain.setTargetAtTime(quiet*(ob?0.08+0.6*ss(0.3,9,sp):0),t,0.15);
    if(ob&&!bench.on){snd.slapT-=dt*(0.4+sp*0.35+Math.abs(ob.rkv||0)*3);if(snd.slapT<=0){snd.slapT=0.4+Math.random()*1.4;
      sndShot('slap',snd.O.fx,t+0.01,0.8+0.3*Math.random(),(0.3+0.5*ss(0,8,sp))*(0.6+0.4*Math.random()))}}}
  // the boats out on the lake: the nearest fishing boat's outboard, and the tug's diesel and horn
  {let nf=null,nd=1e9;for(const b of lakeBoats){if(b.eng!==1)continue;const d=Math.hypot(b.x-camera.position.x,b.z-camera.position.z);if(d<nd){nd=d;nf=b}}
    const fe=snd.engF;if(nf){sndPlace(snd.F,nf.x,nf.y+0.5,nf.z,t);const fT=900+1100*Math.min(1,nf.v/6);fe.rpm+=(fT-fe.rpm)*Math.min(1,dt*2)}
    sndEngineTo(fe,fe.rpm,0.4,quiet*(nf?0.55:0),t);
    const tg=lakeBoats.find(b=>b.kind==='tug'),ge=snd.engG;if(tg){sndPlace(snd.G,tg.x,tg.y+2,tg.z,t);const gT=700+500*Math.min(1,tg.v/2.4);ge.rpm+=(gT-ge.rpm)*Math.min(1,dt*1.5)}
    sndEngineTo(ge,ge.rpm,0.5,quiet*(tg?0.9:0),t);
    // a horn carries across the water: it fades with distance far more gently than the engines
    if(tg&&tg.hornQ){tg.hornQ=false;const d=Math.hypot(tg.x-camera.position.x,tg.z-camera.position.z);sndShot('horn',snd.dry,t+0.05+d/343,0.85,quiet*sndVol(sndCfg.fx)*1.4*Math.min(1,50/(d+10)))}}
  ambTick(dt,t,quiet);
}
