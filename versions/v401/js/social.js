// Corley's Island: the townsfolk in company. Two who are close (bonds.js: family under one roof, partners, good
// friends, over TU.soClose) go places together: when one sets off on an errand (talk.js talkErrands) and the other is
// about and free, they come along for a few minutes (g.max), walking beside them (p.tg {lead}: roam.js to a spot at the lead's side, re-aimed a few
// times a second, a little quicker to catch up), wait with them while they look in the windows or sit on the green, go in
// at the same door, and go back to their own day after (soTick). And people join their friends: someone at a loose end
// near two or more standing talking, one of them a friend, walks over and stands with them a while (soJoin), so groups
// form and grow by themselves. Nothing here is about you: they talk to you when you talk to them.
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.

const SO={t:0,joinT:0,seen:new WeakMap()};
// the closest about within r of p who is free to come along, or null
function soMate(p,r){let b=null,bv=TU.soClose;for(const q of TALK.here){if(q===p||q.tg||!talkErrFree(q)||talkKid(q))continue;const d=Math.hypot(q.x-p.x,q.z-p.z);if(d>r)continue;
    const v=bdOf(p,q)-d/200;if(v>bv){bv=v;b=q}}return b}
// q goes along with p
function soWith(q,p){q.tg={lead:p,t:0,max:90+Math.random()*150};q.goal=null;q.wait=0;if(typeof ordLog==='function'&&TALK.here.includes(p))ordLog(`${talkName(q)} went along with ${talkName(p)}`)}
// the spot at the lead's side, a little behind
function soSide(q,p){const a=p.yaw,sx=Math.cos(a),sz=-Math.sin(a),fx=Math.sin(a),fz=Math.cos(a),s=(q.tgS||(q.tgS=Math.random()<0.5?1:-1));
  return [p.x+sx*0.75*s-fx*0.3,p.z+sz*0.75*s-fz*0.3]}
// walking beside, waiting with, in at the same door; done when the lead's errand is
function soStep(q){const g=q.tg,p=g.lead;
  if(!tf.people.includes(p)||p.dead||p.hurt||p.drv||p.room||p.flee>0||q.ord||q.dead||q.hurt||q.flee>0||q.room){q.tg=null;if(q.off)roBack(q);return}
  if(p.inside>0){if(!(q.inside>0)){q.inside=p.inside+1+Math.random()*3;q.x=p.x;q.z=p.z}return}
  // an outing of a few minutes (g.max), ending once the lead is between errands: then back to their own day
  if((g.t+=0.25)>g.max&&!p.goal&&!p.pu){q.tg=null;if(q.off)roBack(q);return}
  const [x,z]=soSide(q,p),d=Math.hypot(x-q.x,z-q.z),moving=p.spd>0.2;
  if(!moving&&d<1.6){if(q.off){q.off.pts.length=0;q.off.i=0}q.look=Math.atan2(p.x-q.x,p.z-q.z);q.wait=Math.max(q.wait||0,0.5);return}
  const o=q.off;if(o&&o.tag==='so'&&!o.pending&&Math.hypot(o.x-x,o.z-z)<0.6&&o.i<o.pts.length)return;
  if(roGo(q,x,z,{near:0.25,tag:'so',v:Math.max(0.6,(p.spd||p.vt)*(d>2.5?1.35:1)),max:30}))q.off.at=performance.now()/1000}
// someone at a loose end near a group with a friend in it: over to stand with them
function soJoin(p){const H=TALK.here;let best=null,bv=0.25;
  for(const q of H){if(q===p||talkKid(q)||q.spd>0.15||!(q.wait>0)&&!q.room)continue;if(Math.hypot(q.x-p.x,q.z-p.z)>22)continue;
    const g=H.filter(r=>r!==p&&!talkKid(r)&&r.spd<0.15&&Math.hypot(r.x-q.x,r.z-q.z)<3.2);if(g.length<1)continue;const v=bdOf(p,q);if(v>bv){bv=v;best=[q,g]}}
  if(!best)return false;const [q,g]=best,cx=(q.x+g.reduce((t,r)=>t+r.x,0))/(g.length+1),cz=(q.z+g.reduce((t,r)=>t+r.z,0))/(g.length+1),a=Math.atan2(p.x-cx,p.z-cz),r=1.1+0.15*g.length;
  return roGo(p,cx+Math.sin(a)*r,cz+Math.cos(a)*r,{near:0.35,tag:'join',max:60,then:s=>{s.look=Math.atan2(cx-s.x,cz-s.z);s.wait=30+Math.random()*50;if(typeof ndChat==='function')ndChat(s)}})}
// a few times a second: those walking together; now and then a new pair setting off, or someone joining a group
function soTick(dt){if(!tf.on||!TALK.lib)return;if((SO.t+=dt)<0.25)return;SO.t=0;const now=performance.now()/1000;
  for(const q of tf.people)if(q.tg)soStep(q);
  // someone just set off on an errand of their own: someone close comes along
  for(const p of TALK.here){const g=p.goal;if(!g||g.k==='company'||g.k==='order'||SO.seen.get(p)===g||p.tg||talkKid(p))continue;SO.seen.set(p,g);
    if(Math.random()<TU.soAlong){const q=soMate(p,25);if(q)soWith(q,p)}}
  if(now-SO.joinT<3)return;SO.joinT=now;
  const free=TALK.here.filter(p=>talkErrFree(p)&&!talkKid(p)&&talkCard(p));if(!free.length)return;const p=free[(Math.random()*free.length)|0];
  if(Math.random()<TU.soJoin)soJoin(p)}
