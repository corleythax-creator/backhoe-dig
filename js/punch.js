// Corley's Island: the worker's fists. On foot, Punch (KEY punch: 1, the Punch button, controller LB) puts his fists
// up (the gun goes away; Gun, 2, takes it out again and drops them) and throws a punch, left and right in turn; while
// they are up a click on the view punches too. A punch lands on the nearest townsperson within TU.punchReach in front
// of him and takes TU.punchDmg off what they have (TU.gunHp, pistol.js gunHit): the first knocks them down, where
// they lie hurt and try to crawl off, and more finish them. People round about run, and the police hear of it, as
// with the guns. His fists drop by themselves after a while without a punch.
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.
const fist={on:false,t:-1,hand:0,cool:0,idle:0,hit:false,told:false,n:0};
// a punch: seconds from the start to the arm back at the guard, and when in it the fist lands
const PUNCH_T=0.32,PUNCH_AT=0.12;
const fistUp=()=>fist.on&&!gun.eq&&mode==='walk'&&!wk.inside&&!wk.swim&&!trim.on&&!bench.on;
function punch(){if(mode!=='walk'||wk.inside||wk.swim||bench.on)return;
  if(trim.on)trimSet(false);if(gun.eq)gunEquip(false,true);
  if(!fist.on){fist.on=true;if(!fist.told){fist.told=true;toast(say('fistsUp'),'',3600)}}
  fist.idle=0;if(fist.cool>0)return;fist.cool=TU.punchRate;fist.t=0;fist.hit=false;fist.hand^=1;started()}
// the fist arrives: whoever is nearest within reach, in front of him (about 55 degrees either side) and on his level
function punchLand(){const y=wk.yaw,fx=Math.sin(y),fz=Math.cos(y),R=TU.punchReach;let best=null,bs=1e9;
  if(tf.on)for(const p of tf.people){if(p.dead||p.inside||p.drv)continue;const dx=p.x-wk.x,dz=p.z-wk.z,d=Math.hypot(dx,dz);
    if(d>R||Math.abs(p.y-wk.y)>1.2||d>0.35&&dx*fx+dz*fz<d*0.55)continue;if(d<bs){bs=d;best=p}}
  if(!best)return null;
  const p=best,d=bs||1,ux=bs?(p.x-wk.x)/d:fx,uz=bs?(p.z-wk.z)/d:fz,hx=p.x-ux*0.2,hz=p.z-uz*0.2,hy=p.y+(p.hurt?0.3:1.45*(p.sc||1));
  // down they go (gunHit's leg: off their feet and onto the ground, hurt; seated, they slump), dead once they have nothing left
  gunHit(p,{k:p.sit?'slump':'leg',x:hx,z:hz,dm:TU.punchDmg,ux,uz});if(!p.dead)p.bleed=0;
  gunSnd('flesh',hx,hy,hz);gunScare(p.x,p.z,p);gunHeat(p.cop?4:p.dead?2:1,p.x,p.z);gun.sh=Math.min(1.5,gun.sh+0.3);fist.n++;return p}
// after gunTick (main.js): the guard, both fists up in front of him, and the punch out of it
function punchTick(dt){fist.cool=Math.max(0,fist.cool-dt);
  if(!fistUp()){fist.t=-1;if(fist.on&&(gun.eq||mode!=='walk'||wk.inside||trim.on))fist.on=false;return}
  fist.idle+=dt;if(fist.idle>TU.punchHold&&fist.t<0){fist.on=false;return}
  const fp=camMode==='cab',pt=fp?fpl.pitch:0;if(fp||fist.t>=0)wk.yaw=gunYaw();
  let u=-1;if(fist.t>=0){fist.t+=dt;if(!fist.hit&&fist.t>=PUNCH_AT){fist.hit=true;punchLand()}if(fist.t>=PUNCH_T)fist.t=-1;else u=fist.t/PUNCH_T}
  for(let s=0;s<2;s++){const A=wkArms[s];let top=-0.95-pt*0.6,low=-1.8;
    if(u>=0&&s===fist.hand){const k=Math.sin(Math.PI*Math.min(1,u*1.2));top+=(-1.52-pt*0.9-top)*k;low+=(-0.08-low)*k}
    A.top.rotation.x=top;A.low.rotation.x=low}}
