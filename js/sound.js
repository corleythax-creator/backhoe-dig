// Backhoe Dig: diesel engines for both machines and the truck's backup alarm, synthesized with Web Audio (no sound files).
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.
// Browsers only start audio after a tap or key press, so the graph is built on the first one.
let actx=null,sndMaster=null,sndOn=true,sndEngT=null,sndEngX=null,sndEngM=null,sndBeep=null,sndGear=0,sndGearT=0;
try{sndOn=localStorage.getItem('bhd_snd')!=='0'}catch(e){}
function sndCurve(k){const c=new Float32Array(256);for(let i=0;i<256;i++){const x=i/127.5-1;c[i]=Math.tanh(k*x)/Math.tanh(k)}return c}
// one diesel: a sawtooth at the firing rate, a detuned half-rate square for the uneven lope, and band-passed
// noise chopped at the firing rate for the injector clatter, through a lowpass that opens with revs and load
function makeEngine(noise){
  const c=actx,out=c.createGain();out.gain.value=0;
  const o1=c.createOscillator();o1.type='sawtooth';
  const o2=c.createOscillator();o2.type='square';o2.detune.value=9;const g2=c.createGain();g2.gain.value=0.3;
  const n=c.createBufferSource();n.buffer=noise;n.loop=true;
  const bp=c.createBiquadFilter();bp.type='bandpass';bp.frequency.value=1500;bp.Q.value=0.9;
  const chop=c.createGain();chop.gain.value=0.5;const depth=c.createGain();depth.gain.value=0.5;
  const clat=c.createGain();clat.gain.value=0.2;
  const lp=c.createBiquadFilter();lp.type='lowpass';lp.Q.value=1.6;
  const sh=c.createWaveShaper();sh.curve=sndCurve(2.2);
  o1.connect(depth);depth.connect(chop.gain);n.connect(bp);bp.connect(chop);chop.connect(clat);
  o1.connect(lp);o2.connect(g2);g2.connect(lp);lp.connect(sh);sh.connect(out);clat.connect(out);out.connect(sndMaster);
  o1.start();o2.start();n.start();
  return {o1,o2,lp,clat,out,rpm:700}
}
function sndStart(){
  if(actx){if(actx.state==='suspended'&&sndOn&&!document.hidden)actx.resume();return}
  const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
  try{actx=new AC()}catch(e){actx=null;return}
  sndMaster=actx.createGain();sndMaster.gain.value=sndOn?0.5:0;sndMaster.connect(actx.destination);
  const nb=actx.createBuffer(1,actx.sampleRate*2,actx.sampleRate),d=nb.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
  sndEngT=makeEngine(nb);sndEngX=makeEngine(nb);sndEngM=makeEngine(nb);
  // backup alarm: a harsh ~1.1 kHz square, half a second on, half off
  const o=actx.createOscillator();o.type='square';o.frequency.value=1120;
  const lp=actx.createBiquadFilter();lp.type='lowpass';lp.frequency.value=3200;
  const g=actx.createGain();g.gain.value=0;o.connect(lp);lp.connect(g);g.connect(sndMaster);o.start();sndBeep=g;
  if(!sndOn)actx.suspend();
}
$('#soundBtn').textContent=sndOn?'Sound: on':'Sound: off';
for(const ev of ['pointerdown','keydown','touchend'])addEventListener(ev,sndStart,{capture:true,passive:true});
document.addEventListener('visibilitychange',()=>{if(!actx)return;if(document.hidden)actx.suspend();else if(sndOn)actx.resume()});
function setSound(on){sndOn=on;try{localStorage.setItem('bhd_snd',on?'1':'0')}catch(e){}
  $('#soundBtn').textContent=on?'Sound: on':'Sound: off';
  if(!actx){if(on)sndStart();return}
  sndMaster.gain.setTargetAtTime(on?0.5:0,actx.currentTime,0.05);if(on)actx.resume();else setTimeout(()=>{if(!sndOn)actx.suspend()},200)}
// louder the closer the camera is; in the cab of a machine it is full volume
function sndNear(x,y,z){const d=Math.hypot(camera.position.x-x,camera.position.y-y,camera.position.z-z);return 1/(1+(d/14)*(d/14))}
function engineTo(e,rpm,load,vol,t){
  const f=rpm/20;// six-cylinder four-stroke: three firings per revolution
  e.o1.frequency.setTargetAtTime(f,t,0.04);e.o2.frequency.setTargetAtTime(f/2,t,0.04);
  e.lp.frequency.setTargetAtTime(220+rpm*0.28+load*700,t,0.05);
  e.clat.gain.setTargetAtTime(0.12+0.25*load,t,0.05);
  e.out.gain.setTargetAtTime(vol*(0.45+0.55*load),t,0.06);
}
function updateSound(dt,hyd){
  if(!actx||actx.state!=='running')return;
  const t=actx.currentTime,quiet=bench.on?0:1;
  // truck: an automatic box, five gears forward; revs climb through each gear and drop back on the upshift
  const sp=Math.abs(tr.v),drive=tr.drive||0;let gi=0,frac;
  if(tr.gear<0)frac=Math.min(1,sp/2.7);
  else{gi=Math.min(4,Math.floor(sp/1.8));frac=Math.min(1,(sp-gi*1.8)/1.8)}
  if(gi!==sndGear){sndGearT=gi>sndGear?0.25:0;sndGear=gi}
  sndGearT-=dt;
  let rT=sp<0.25?700+drive*350:(gi===0?800:1150)+frac*(gi===0?1150:800);
  if(sndGearT>0)rT*=0.8;// the drop while the box shifts
  sndEngT.rpm+=(rT-sndEngT.rpm)*Math.min(1,dt*(rT>sndEngT.rpm?5:8));
  engineTo(sndEngT,sndEngT.rpm,drive*(sndGearT>0?0.3:1),quiet*sndNear(tr.x,tr.y+1.5,tr.z),t);
  const beep=tr.gear<0&&tr.shiftT<=0&&!bench.on&&(t%1)<0.5;
  sndBeep.gain.setTargetAtTime(beep?0.09*sndNear(tr.x,tr.y+1,tr.z):0,t,0.006);
  // excavator: hydraulic demand pulls it up from idle; hard soil lugs it down and makes it work louder
  const work=Math.min(1,hyd*1.4+(st.below?0.3:0)),lug=st.below?1-st.res:0;
  const xT=850+1050*work-260*lug;
  sndEngX.rpm+=(xT-sndEngX.rpm)*Math.min(1,dt*3);
  engineTo(sndEngX,sndEngX.rpm,Math.min(1,work*0.8+lug*0.6),quiet*0.85*sndNear(st.x,st.y+1.2,st.z),t);
  // mower: a small gas V-twin held at the governor; it runs with the blades and dips when they bite tall grass
  // (engineTo's rpm is a diesel's, so 1150 here gives the twin's 57 Hz firing beat)
  const mT=980+170*mw.blades-120*mw.load+40*Math.min(1,Math.abs(mw.v));
  sndEngM.rpm+=(mT-sndEngM.rpm)*Math.min(1,dt*4);
  engineTo(sndEngM,sndEngM.rpm,Math.min(1,0.2+mw.load*0.8),quiet*0.55*mw.blades*sndNear(mw.x,mw.y+0.6,mw.z),t);
}
