// Backhoe Dig: dirt sounds, synthesized like the engines (no sound files): the teeth scraping and biting (a dull drag in
// clay, a hiss in sand, a gritty crackle in rock), the hiss of dirt pouring from the bucket or truck, a thud when a load
// lands, clods rattling down a pile, a rumble when a wall caves in, and a trickle while groundwater seeps.
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.
let dsnd=null,dsRattleT=0;
function dsBuild(){
  const c=actx,nb=c.createBuffer(1,c.sampleRate*2,c.sampleRate),d=nb.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
  const loop=(type,f,q)=>{const n=c.createBufferSource();n.buffer=nb;n.loop=true;n.playbackRate.value=0.7+Math.random()*0.6;
    const fl=c.createBiquadFilter();fl.type=type;fl.frequency.value=f;fl.Q.value=q;const g=c.createGain();g.gain.value=0;
    n.connect(fl);fl.connect(g);g.connect(sndMaster);n.start();return {fl,g}};
  dsnd={nb,scrape:loop('bandpass',700,1.1),grit:loop('highpass',2600,0.7),pour:loop('bandpass',900,0.7),pour2:loop('bandpass',650,0.7),trickle:loop('bandpass',3200,3)};
}
// one-shot: a low thump with a short burst of filtered noise (amt 0..1)
function dirtThud(p,amt){
  if(!actx||actx.state!=='running')return;if(!dsnd)dsBuild();const c=actx,t=c.currentTime,v=Math.min(1,amt)*sndNear(p.x,p.y,p.z);if(v<0.02)return;
  const o=c.createOscillator();o.type='sine';o.frequency.setValueAtTime(75,t);o.frequency.exponentialRampToValueAtTime(38,t+0.3);
  const g=c.createGain();g.gain.setValueAtTime(0.5*v,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.35);o.connect(g);g.connect(sndMaster);o.start(t);o.stop(t+0.4);
  const n=c.createBufferSource();n.buffer=dsnd.nb;const lp=c.createBiquadFilter();lp.type='lowpass';lp.frequency.value=500;
  const ng=c.createGain();ng.gain.setValueAtTime(0.35*v,t);ng.gain.exponentialRampToValueAtTime(0.001,t+0.25);n.connect(lp);lp.connect(ng);ng.connect(sndMaster);n.start(t,Math.random());n.stop(t+0.3);
}
// one-shot: a clod knocking down a pile (rate-limited)
function dirtRattle(p){
  if(!actx||actx.state!=='running'||dsRattleT>0)return;if(!dsnd)dsBuild();dsRattleT=0.06;
  const c=actx,t=c.currentTime,v=sndNear(p.x,p.y,p.z)*(0.08+Math.random()*0.08);if(v<0.01)return;
  const n=c.createBufferSource();n.buffer=dsnd.nb;const bp=c.createBiquadFilter();bp.type='bandpass';bp.frequency.value=1200+Math.random()*1800;bp.Q.value=2;
  const g=c.createGain();g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.05);n.connect(bp);bp.connect(g);g.connect(sndMaster);n.start(t,Math.random());n.stop(t+0.07);
}
// one-shot: a wall letting go
function dirtRumble(p){
  if(!actx||actx.state!=='running')return;if(!dsnd)dsBuild();const c=actx,t=c.currentTime,v=sndNear(p.x,p.y,p.z);
  const n=c.createBufferSource();n.buffer=dsnd.nb;const lp=c.createBiquadFilter();lp.type='lowpass';lp.frequency.value=220;
  const g=c.createGain();g.gain.setValueAtTime(0.001,t);g.gain.linearRampToValueAtTime(0.7*v,t+0.15);g.gain.exponentialRampToValueAtTime(0.001,t+2.4);
  n.connect(lp);lp.connect(g);g.connect(sndMaster);n.start(t);n.stop(t+2.5);dirtThud(p,1);
}
// every frame: the continuous sounds follow what the bucket and truck are doing
const DS_SOIL=[{f:650,q:1.0,grit:0},{f:380,q:0.8,grit:0},{f:2300,q:0.6,grit:0},{f:1400,q:1.4,grit:1},{f:850,q:0.9,grit:0}];
function dirtSndTick(dt,armV,pourA,pourB){
  dsRattleT-=dt;if(!actx||actx.state!=='running')return;if(!dsnd)dsBuild();
  const t=actx.currentTime,quiet=bench.on?0:1;
  const s=st.soil>=0?DS_SOIL[st.soil]:null,biting=s&&armV>0.05?Math.min(1,armV*1.2)*sndNear(tip.x,tip.y,tip.z)*quiet:0;
  if(s){dsnd.scrape.fl.frequency.setTargetAtTime(s.f*(0.85+0.3*Math.min(1,armV)),t,0.05);dsnd.scrape.fl.Q.value=s.q}
  dsnd.scrape.g.gain.setTargetAtTime(0.32*biting*(st.below&&st.load>=CAP-0.002?0.5:1),t,0.06);
  dsnd.grit.g.gain.setTargetAtTime(s&&s.grit?0.12*biting*(0.6+0.4*Math.random()):0,t,0.02);
  dsnd.pour.g.gain.setTargetAtTime(Math.min(0.3,pourA.rate*0.25)*sndNear(pourA.x,pourA.y,pourA.z)*quiet,t,0.08);
  dsnd.pour2.g.gain.setTargetAtTime(Math.min(0.35,pourB.rate*0.2)*sndNear(pourB.x,pourB.y,pourB.z)*quiet,t,0.08);
  dsnd.trickle.g.gain.setTargetAtTime(seeping?Math.min(0.05,seeping*0.0004)*(0.6+0.4*Math.sin(t*3.1))*sndNear(st.x,st.y,st.z)*quiet:0,t,0.2);
}
