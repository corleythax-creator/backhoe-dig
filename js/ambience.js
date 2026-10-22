// Corley's Island: the sound of the place, on sound.js's mixer and the Nature slider: wind (stronger up high and in a
// storm, in slow gusts), birds by day, crickets by night and frogs near the water, waves lapping whichever shore is near
// (from the side it is on), gulls over the lake, rain in two strengths (muffled on the roof from the cab view), and
// footsteps on foot by surface: gravel and dirt, grass, mud (a squelch), bridge decks (a hollow knock), or wading. All recordings (sounds/, tools/sounds.py).
// Each bed plays its loop twice from different points, panned apart, so it is wide rather than one point in the middle.
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.
let ambNight=0,amb=null;
// daynight.js tells it how far into the night it is (0 day to 1 night), every frame
function dnSndTick(dt,k){ambNight=k}
function ambBed(n,lp){const g=sndGain(0,snd.amb),f=sndFilter('lowpass',lp||16000,0.5,g);
  for(const p of [-0.55,0.55]){const pn=actx.createStereoPanner?actx.createStereoPanner():null;if(pn){pn.pan.value=p;pn.connect(f);sndLoopSrc(n,pn)}else sndLoopSrc(n,f)}
  return {g,f}}
function ambBuild(){
  amb={wind:ambBed('wind',2500),birds:ambBed('birds'),crickets:ambBed('crickets'),frogs:ambBed('frogs'),rain:ambBed('rain'),rainH:ambBed('rain_h'),gust:0.5,gustV:0,
    lapG:sndGain(0,snd.amb),lake:0,lakePan:0,lakeT:0,gullT:8,phase:0,landT:0};
  amb.lapP=actx.createStereoPanner?actx.createStereoPanner():null;amb.lapF=sndFilter('lowpass',9000,0.5,amb.lapG);
  if(amb.lapP){amb.lapP.connect(amb.lapF);sndLoopSrc('lap',amb.lapP)}else sndLoopSrc('lap',amb.lapF);
  amb.lapG.connect(snd.ambSend);
  amb.stepG=sndGain(1,snd.dry);
}
// how near the lake is (0 to 1) and which side it is on, from the ground round the camera: a few rings of samples
const AMB_RING=[[8,1],[20,0.65],[40,0.35],[70,0.15]];
function ambLake(){const cx=camera.position.x,cz=camera.position.z;let near=hAt(cx,cz)<WATER?1:0,px=0,pz=0;
  for(const [r,w] of AMB_RING)for(let k=0;k<8;k++){const a=k*Math.PI/4,x=cx+Math.cos(a)*r,z=cz+Math.sin(a)*r;
    if(hAt(x,z)<WATER-0.2){near=Math.max(near,w);px+=Math.cos(a)*w;pz+=Math.sin(a)*w}}
  sndR.setFromMatrixColumn(camera.matrixWorld,0);const l=Math.hypot(px,pz);
  amb.lake=near;amb.lakePan=l>0.01&&near<1?clamp((px*sndR.x+pz*sndR.z)/l*0.7,-0.7,0.7):0}
// one footstep at the walker's feet, by what is under them
function ambStep(t,k){const x=wk.x,z=wk.z,g=hAt(x,z),fx=sndVol(sndCfg.fx);
  if(lakeY(x,z)>wk.y+0.08){sndShot('slap',amb.stepG,t,1.1+0.3*Math.random(),0.5*k*fx);return}
  // on a bridge deck, a dock or the covered footbridge: a hollow knock off the boards
  if(Math.abs(wk.y-deckAt(x,z))<0.15){ambKnock(t,k,fx);return}
  const hard=wk.y>g+0.3;// on a block
  // in mud (the soil water, water.js and mud.js, not the paint): a squelch, the boot sucking out after it
  if(!hard&&mudAt(x,z)>TU.stepMud){ambSquelch(t,k,fx);return}
  const m=paintAt(x,z),id=m?MAT_LIST[m-1].id:'',soft=!m&&Math.abs(g-h0At(x,z))<0.04&&roadAmt(x,z)<0.5||/grass|sod|lawn|moss|clover|meadow/.test(id);
  sndShot(soft&&!hard?'step_s':'step_g',amb.stepG,t,(hard?0.85:1)*(0.92+0.16*Math.random()),(soft?0.55:0.45)*k*fx)}
// a short burst of the shared noise through a filter, with a quick attack and a decay (from f0 to f1 Hz if f1 is given)
function ambNoise(t,type,f0,f1,q,len,gain){const s=actx.createBufferSource(),b=sndFilter(type,f0,q),g=sndGain(0,amb.stepG);s.buffer=snd.noise;s.connect(b);b.connect(g);
  if(f1)b.frequency.exponentialRampToValueAtTime(f1,t+len);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(gain,t+0.006);g.gain.exponentialRampToValueAtTime(0.001,t+len);
  s.start(t,Math.random()*1.5,len+0.02);s.onended=()=>{b.disconnect();g.disconnect()}}
// a boot on a deck: the thump of the boards (a falling low tone), their hollow ring and the scuff of the sole
function ambKnock(t,k,fx){const o=actx.createOscillator(),g=sndGain(0,amb.stepG),f=88+30*Math.random();o.type='sine';
  o.frequency.setValueAtTime(f*1.7,t);o.frequency.exponentialRampToValueAtTime(f,t+0.05);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(0.55*k*fx,t+0.004);
  g.gain.exponentialRampToValueAtTime(0.001,t+0.24);o.connect(g);o.start(t);o.stop(t+0.26);o.onended=()=>g.disconnect();
  ambNoise(t,'bandpass',330+90*Math.random(),0,7,0.16,0.5*k*fx);sndShot('step_g',amb.stepG,t,0.8+0.1*Math.random(),0.16*k*fx)}
// a boot in mud: a wet slap going down, then the suck as it pulls free
function ambSquelch(t,k,fx){sndShot('slap',amb.stepG,t,0.55+0.15*Math.random(),0.42*k*fx);
  ambNoise(t,'lowpass',700,0,0.7,0.09,0.3*k*fx);ambNoise(t+0.07+0.05*Math.random(),'bandpass',1900+400*Math.random(),380,4,0.16,0.35*k*fx)}
function ambTick(dt,t,quiet){
  if(!amb){if(!snd.buf.wind)return;ambBuild()}
  const r=weather.r,dry=1-ss(0.05,0.4,r),cab=camMode==='cab'&&mode!=='walk',inside=cab?0.45:1;
  const day=ss(-4,8,dn.el)*(edOn?0.6:1),lift=ss(-5,25,camera.position.y);
  if((amb.lakeT-=dt)<=0){amb.lakeT=0.5;ambLake()}
  // wind: a slow random walk of gusts, stronger up on the mesa and in a storm
  amb.gustV+=((Math.random()-0.5)*1.2-amb.gustV*0.6)*dt;amb.gust=clamp(amb.gust+amb.gustV*dt,0,1);
  const wv=(0.25+0.35*lift+0.5*ss(0.2,1,r))*(0.6+0.6*amb.gust);
  amb.wind.g.gain.setTargetAtTime(quiet*inside*wv*0.55,t,0.4);amb.wind.f.frequency.setTargetAtTime(cab?900:1200+2400*amb.gust,t,0.4);
  amb.birds.g.gain.setTargetAtTime(quiet*inside*day*dry*(1-0.5*amb.lake)*0.45,t,0.8);
  amb.crickets.g.gain.setTargetAtTime(quiet*inside*ambNight*dry*0.35,t,0.8);
  amb.frogs.g.gain.setTargetAtTime(quiet*inside*ambNight*dry*(0.12+0.5*amb.lake),t,0.8);
  // the lake lapping the shore nearest you, from its side; livelier when the wind is up
  amb.lapG.gain.setTargetAtTime(quiet*inside*amb.lake*(0.5+0.3*ss(0.2,1,r))*0.8,t,0.6);if(amb.lapP)amb.lapP.pan.setTargetAtTime(amb.lakePan,t,0.6);
  // rain: light rain comes in first, the heavy layer with the downpour; on the cab roof it is duller and closer
  amb.rain.g.gain.setTargetAtTime(quiet*ss(0,0.5,r)*0.6*(cab?0.8:1),t,0.5);amb.rainH.g.gain.setTargetAtTime(quiet*ss(0.35,1,r)*0.75*(cab?1.2:1),t,0.5);
  amb.rain.f.frequency.setTargetAtTime(cab?1600:16000,t,0.2);amb.rainH.f.frequency.setTargetAtTime(cab?1100:16000,t,0.2);
  // a gull now and then over the lake by day
  if((amb.gullT-=dt)<=0){amb.gullT=7+Math.random()*18;if(amb.lake>0.25&&day>0.5&&dry>0.5&&quiet){const pn=actx.createStereoPanner?actx.createStereoPanner():null,d=0.25+0.75*Math.random();
    let o=snd.amb;if(pn){pn.pan.value=Math.random()*1.6-0.8;pn.connect(snd.amb);o=pn;setTimeout(()=>pn.disconnect(),4000)}sndShot('gull',o,t+0.02,0.9+0.2*Math.random(),0.35*d*amb.lake)}}
  // footsteps: one each time a foot comes down, louder running; a heavier one landing a jump; strokes swimming
  const walking=mode==='walk'&&!wk.inside&&!bench.on,ph=Math.floor(wk.phase/Math.PI);
  if(walking&&ph!==amb.phase){const k=wk.swim?0.5:Math.min(1,0.45+wk.spd/8);if(wk.swim)sndShot('slap',amb.stepG,t,0.9+0.2*Math.random(),0.35*sndVol(sndCfg.fx));else if(wk.ground&&wk.spd>0.25)ambStep(t,k)}
  amb.phase=ph;if(walking&&wk.landT>0.15&&amb.landT<=0.15){ambStep(t,1);ambStep(t+0.05,0.8)}amb.landT=wk.landT;
}
