// Corley's Island: dirt sounds added to sound.js's mixer: a thud when a load lands, clods knocking down a pile, a rumble
// when a wall caves in, and a trickle while groundwater seeps. (Bucket scrape, pouring and dumping are in sound.js.)
// They play through the excavator's effects bus (snd.X.fx), so they follow its distance, panning and the Effects slider.
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.
let dsRattleT=0,dsNoise=null,dsTrickle=null;
function dsReady(){return !!(snd&&snd.ready&&actx&&actx.state==='running'&&snd.X&&snd.X.fx)}
function dsBuf(){if(!dsNoise)dsNoise=toBuf(actx,noiseBuf(actx.sampleRate,2,23));return dsNoise}
// a burst of filtered noise through dest, shaped by a quick attack and an exponential tail
function dsBurst(type,f,q,gain,len,t){const n=actx.createBufferSource();n.buffer=dsBuf();
  const fl=sndFilter(type,f,q),g=sndGain(0,snd.X.fx);n.connect(fl);fl.connect(g);
  g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(gain,t+0.01);g.gain.exponentialRampToValueAtTime(0.0001,t+len);
  n.start(t,Math.random());n.stop(t+len+0.05);n.onended=()=>g.disconnect()}
// a load landing (amt 0..1): a low thump with a short gravelly burst
function dirtThud(p,amt){
  if(!dsReady())return;const c=actx,t=c.currentTime,v=Math.min(1,amt);
  const o=c.createOscillator();o.type='sine';o.frequency.setValueAtTime(80,t);o.frequency.exponentialRampToValueAtTime(40,t+0.3);
  const g=sndGain(0,snd.X.fx);g.gain.setValueAtTime(0.6*v,t);g.gain.exponentialRampToValueAtTime(0.0001,t+0.35);o.connect(g);o.start(t);o.stop(t+0.4);o.onended=()=>g.disconnect();
  dsBurst('lowpass',600,0.7,0.4*v,0.25,t);
}
// one clod knocking down a pile (rate-limited)
function dirtRattle(p){if(!dsReady()||dsRattleT>0)return;dsRattleT=0.06;dsBurst('bandpass',1200+Math.random()*1800,2,0.08+Math.random()*0.08,0.05,actx.currentTime)}
// a wall letting go
function dirtRumble(p){if(!dsReady())return;const t=actx.currentTime;dsBurst('lowpass',220,0.7,0.8,2.4,t);dirtThud(p,1)}
// every frame: the groundwater trickle
function dirtSndTick(dt){
  dsRattleT-=dt;if(!dsReady())return;const t=actx.currentTime;
  if(!dsTrickle){const g=sndGain(0,snd.X.fx);sndLoopSrc(dsBuf(),sndFilter('bandpass',3200,3,g),1.1);dsTrickle=g}
  dsTrickle.gain.setTargetAtTime(seeping&&!bench.on?Math.min(0.08,seeping*0.0006)*(0.6+0.4*Math.sin(t*3.1)):0,t,0.2);
}
