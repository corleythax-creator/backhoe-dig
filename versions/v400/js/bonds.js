// Corley's Island: how the townsfolk get on with each other. Every pair of grown-ups (by tfWho) has a bond, -1..1: where
// they start (bdBase: family under one roof, lives.js LIFE_HOMES; working the same counter; likes in common; prickly
// natures rubbing, Human Forge's traits; and a seeded lean of its own, so some just don't take to each other) plus what has
// happened between them (BD.l, saved as bhd_bonds on this device, fading back by a few percent a game day): each time
// they talk (bdChat, from talk.js talkShow) it warms a little, more for things in common, less when one is out of sorts;
// two who don't get on can fall out over it (a spat, said aloud near you, WORDS 'Town: bonds', and remembered by Human
// Forge's runtime as rude, so it comes up in what they say). What it changes: who they talk to (talk.js talkNearest:
// friends first, never someone they can't stand), who they go off to see (talkErrMate, needs.js's lonely, bdFriend),
// friends greeting each other in passing and rivals snubbing each other (bdTick), and a model hears it (bdScene).
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.

const BD={l:{},t:0,dirty:false,met:new Map(),day:null,base:new Map()};
try{const v=JSON.parse(localStorage.getItem('bhd_bonds')||'null');if(v&&v.l){BD.l=v.l;BD.day=v.day}}catch(e){}
function bdSave(){if(!BD.dirty||window.syncHold)return;BD.dirty=false;try{localStorage.setItem('bhd_bonds',JSON.stringify({v:1,l:BD.l,day:BD.day}))}catch(e){}}
const bdKey=(a,b)=>a<b?a+'|'+b:b+'|'+a;
const BD_EDGE=['grumpy','sarcastic','proud'],BD_SOFT=['warm','kind','cheerful'];
// where a pair starts, by who they are (worked out once a pair)
function bdBase(p,q){const a=tfWho(p),b=tfWho(q),k=bdKey(a,b);if(BD.base.has(k))return BD.base.get(k);const ca=talkCard(p),cb=talkCard(q);if(!ca||!cb)return 0;let v=(puH(k+'bond')-0.5)*0.55;
  if(typeof LIFE_HOMES!=='undefined'&&!p.tw&&!q.tw&&LIFE_HOMES.some(g=>g.includes(p.body)&&g.includes(q.body)))v+=0.6;
  const la=typeof lifeOf==='function'&&lifeOf(p.body),lb=typeof lifeOf==='function'&&lifeOf(q.body);if(la&&lb&&la.room&&la.room===lb.room)v+=0.25;
  if(ca&&cb){v+=(ca.likes||[]).filter(l=>(cb.likes||[]).includes(l)).length*0.08;
    const ea=(ca.traits||[]).some(t=>BD_EDGE.includes(t)),eb=(cb.traits||[]).some(t=>BD_EDGE.includes(t)),sa=(ca.traits||[]).some(t=>BD_SOFT.includes(t)),sb=(cb.traits||[]).some(t=>BD_SOFT.includes(t));
    v+=ea&&eb?-0.15:ea||eb?-0.05:0;if(sa&&sb)v+=0.08}
  BD.base.set(k,v);return v}
// how p and q get on now
function bdOf(p,q){if(!p||!q||p===q||typeof q!=='object')return 0;const L=BD.l[bdKey(tfWho(p),tfWho(q))];return Math.max(-1,Math.min(1,bdBase(p,q)+(L?L[0]:0)))}
const bdAdd=(p,q,d)=>{const k=bdKey(tfWho(p),tfWho(q)),L=BD.l[k]||(BD.l[k]=[0,0]);L[0]=Math.max(-1,Math.min(1,L[0]+d));L[1]++;BD.dirty=true};
// near you, talk on: a line over their head
function bdSay(p,id,v){if(TALK.mode==='off'||!TALK.here.includes(p)||Math.hypot(p.x-wk.x,p.z-wk.z)>TU.talkSeeR)return;talkShow(p,{say:say(id,v)},null,null)}
// p said something to q (talk.js talkShow)
function bdChat(p,q,a){if(!q||typeof q!=='object'||q===p||!tf.people.includes(q)||talkKid(p)||talkKid(q))return;
  const ca=talkCard(p),cb=talkCard(q);if(!ca||!cb)return;const same=(ca.likes||[]).filter(l=>(cb.likes||[]).includes(l)).length,cross=a&&/annoy|angry|sad/.test(a.mood||'');
  bdAdd(p,q,0.02+same*0.01-(cross?0.05:0));if(typeof ndChat==='function'){ndChat(p);ndChat(q)}
  const b=bdOf(p,q),k=bdKey(tfWho(p),tfWho(q)),now=performance.now()/1000;
  if(b<-0.25&&Math.random()<0.12&&now-(BD.met.get(k+'spat')||-1e9)>300){BD.met.set(k+'spat',now);bdAdd(p,q,-0.12);
    if(TALK.M)TALK.M.remember(p,q,'rude');bdSay(p,'bd_spat',{name:talkName(q)});if(typeof dyNote==='function'){dyNote(p,'spat',`fell out with ${talkName(q)}`,-0.6);dyNote(q,'spat',`had words with ${talkName(p)}`,-0.6)}
    for(const [r,s] of [[p,q],[q,p]])if(!r.room){r.wait=Math.max(r.wait||0,1.5);r.look=Math.atan2(r.x-s.x,r.z-s.z)}}
  else{if(b>0.5&&Math.random()<0.04&&TALK.M)TALK.M.remember(p,q,'kind');
    if(b>0.4&&typeof dyPlan==='function'){const day=fuelDayNo(),gk=k+'talk';if(BD.met.get(gk)!==day){BD.met.set(gk,day);dyNote(p,'talk',`had a good talk with ${talkName(q)}`,0.4)}dyPlan(p,q)}}}
// the best friend about within r of p (someone free to be found), or null
function bdFriend(p,r){let b=null,bv=0.3;for(const q of tf.people){if(q===p||talkKid(q)||!talkCard(q)||q.drv||q.inside||q.dead||q.hurt)continue;
    const d=Math.hypot(q.x-p.x,q.z-p.z);if(d>r)continue;const v=bdOf(p,q)-d/400;if(v>bv){bv=v;b=q}}return b}
// for a model (talk.js talkScene): who they are fond of and who they can't stand, of those about
function bdScene(p,n){const f=[],r=[];for(const q of tf.people){if(q===p||talkKid(q)||!talkCard(q)||Math.hypot(q.x-p.x,q.z-p.z)>120)continue;const v=bdOf(p,q);
    if(v>0.45)f.push([v,talkName(q)]);else if(v<-0.3)r.push([v,talkName(q)])}
  f.sort((a,b)=>b[0]-a[0]);r.sort((a,b)=>a[0]-b[0]);let t='';
  if(f.length)t+=`${n} is close with ${f.slice(0,3).map(x=>x[1]).join(', ')}, who ${f.length>1?'are':'is'} about town now.`;
  if(r.length)t+=`${t?' ':''}${n} doesn't get on with ${r.slice(0,2).map(x=>x[1]).join(' or ')}.`;return t}
// once a second: friends passing greet each other, rivals snub each other (those near you only); a game day's fading
function bdTick(dt){if(!tf.on||!TALK.lib)return;if((BD.t+=dt)<1)return;BD.t=0;const now=performance.now()/1000,H=TALK.here;
  for(let i=0;i<H.length;i++)for(let j=i+1;j<H.length;j++){const p=H[i],q=H[j];if(p.room||q.room||p.drv||q.drv||talkKid(p)||talkKid(q))continue;
    const d=Math.hypot(p.x-q.x,p.z-q.z);if(d>4.5||d<1)continue;const k=bdKey(tfWho(p),tfWho(q));if(now-(BD.met.get(k)||-1e9)<240)continue;const v=bdOf(p,q);
    if(v>0.45){BD.met.set(k,now);const [a,b]=Math.random()<0.5?[p,q]:[q,p];talkFace(a,2.5,b.x,b.z);talkFace(b,2.5,a.x,a.z);bdSay(a,'bd_hi',{name:talkName(b).split(' ')[0]});bdAdd(p,q,0.01)}
    else if(v<-0.35){BD.met.set(k,now);const [a,b]=Math.random()<0.5?[p,q]:[q,p];if(Math.random()<0.6)bdSay(a,'bd_snub',{name:talkName(b).split(' ')[0]})}}
  const day=fuelDayNo();if(BD.day==null)BD.day=day;if(day>BD.day){const f=Math.pow(0.97,Math.min(30,day-BD.day));for(const k in BD.l)BD.l[k][0]*=f;BD.day=day;BD.dirty=true}
  if((BD.saveT=(BD.saveT||0)+1)>=10){BD.saveT=0;bdSave()}}
addEventListener('pagehide',bdSave);
