// Corley's Island: dirt sounds added to sound.js's mixer, from the recordings: a load landing (a shovelful of dirt
// hitting the ground, with falling rock under a big one), clods knocking down a pile, a wall caving in, and a trickle
// while groundwater seeps. (Bucket bites, scrape, pouring and dumping are in sound.js.)
// They play through the excavator's effects bus (snd.X.fx), so they follow its distance, panning and the Effects slider.
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.
let dsRattleT=0,dsTrickle=null;
function dsReady(){return !!(snd&&snd.ready&&actx&&actx.state==='running'&&snd.X&&snd.X.fx)}
// a load landing (amt 0..1): the thud of dirt, pitched down for a bigger load, and rock pouring off a big one
function dirtThud(p,amt){
  if(!dsReady())return;const t=actx.currentTime,v=Math.min(1,amt);
  sndShot('thud',snd.X.fx,t,1.05-0.3*v+0.1*Math.random(),0.5+0.5*v);
  if(v>0.5)sndShot('rocks',snd.X.fx,t+0.03,0.7+0.15*Math.random(),0.5*(v-0.3));
}
// one clod knocking down a pile (rate-limited)
function dirtRattle(p){if(!dsReady()||dsRattleT>0)return;dsRattleT=0.08;sndShot('dig',snd.X.fx,actx.currentTime,1.3+0.4*Math.random(),0.06+0.08*Math.random())}
// a wall letting go
function dirtRumble(p){if(!dsReady())return;const t=actx.currentTime;sndShot('cavein',snd.X.fx,t,0.75+0.1*Math.random(),1);dirtThud(p,1)}
// every frame: the groundwater trickle
function dirtSndTick(dt){
  dsRattleT-=dt;if(!dsReady())return;const t=actx.currentTime;
  if(!dsTrickle){dsTrickle=sndGain(0,snd.X.fx);sndLoopSrc('trickle',dsTrickle)}
  dsTrickle.gain.setTargetAtTime(seeping&&!bench.on?Math.min(0.5,seeping*0.004)*(0.7+0.3*Math.sin(t*1.3)):0,t,0.3);
}
