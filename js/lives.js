// Corley's Island: the townsfolk's lives, and what the town knows of you.
// Daily lives (LIFE): each grown-up character (a look, models/peds; one person each, with the mind Human Forge gave
// them) has a home on one of the neighbourhood streets (LIFE_ST names them, LIFE_HOMES keeps families together) and the
// job their personality names, placed where the game has it (LIFE_JOBS: a shop counter by its sign, or away from the
// streets: the marina, the mainland); the regulars (TOWN_REGS, town.js) are the people behind their counters, with
// their names. lifeNow says where each is by the hour (at work, on the way, at lunch, off work, at home, asleep), and
// townfolk.js's tfLook (lifeScore) draws them there: the one who works a counter behind it in their hours, residents in
// their houses in the mornings and evenings, the people out and about on the streets; nobody is turned away when the
// town needs more. Talk knows it too: the card says where they live and work (lifeItem, talk.js's talkCard), and a
// model hears where they are in their day (lifeScene).
// The town's memory of you (REP, saved as bhd_rep and synced with the townsfolk's memories, sync.js): what you do is
// a deed (REP_K: shooting, someone shot, police after you, nearly running someone down; friendly talk, buying in town,
// a day's work) that those who saw it know at once and the rest hear as they talk among themselves (repGossip: said
// aloud when it happens near you, repSpread now and then anywhere in town). Each person's opinion of you is the deeds
// they know, fading by half every few game days (REP_HALF). It changes how they meet you (repMeet: glad, wary, or
// scared off), prices at their counter (townOff, town.js) and what a model hears (repScene).
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.

// ---------- daily lives ----------
// the neighbourhood streets' names, by SUB_STREETS index (suburbs.js)
const LIFE_ST=['Magnolia Lane','Magnolia Lane','Cypress Street','Cypress Street','Live Oak Drive','Gull Street','Pelican Avenue','Heron Street','Pine Court',
  'Bayou Lane','Shrimp Boat Road','Marsh Drive','Egret Court'];
// who lives together (by look); everyone else grown has a house of their own; children are not placed
const LIFE_HOMES=[['cal_f','cal_m'],['f80_jacket','m60_cap'],['f45_mom']];
// where each one works, by look: a counter (si: the shop's sign, MAIN_SHOPS), away from the streets (away), or about the
// town (out); h: their hours [from, to] (past 24 runs into the next morning; a counter's own hours when left out);
// wk: weekdays only. The regulars' come from TOWN_REGS. Anyone not here has no job to go to.
const LIFE_JOBS={cal_f:{si:19},cal_m:{si:14},f25_capri:{away:'the seafood shack by the marina',h:[11,21]},f25_pink:{si:15},
  f30_jog:{away:'the clinic over on the mainland',h:[8,17],wk:1},f50_scrubs:{away:'the hospital in Pascagoula',h:[19,31]},
  m25_hoodie:{away:'the ferry dock',h:[6,14]},m30_run:{away:'the high school on the mainland',h:[7,16],wk:1},m30_tee:{away:'the charter boats at the marina',h:[5,13]},
  m35_office:{si:8,wk:1},m35_vest:{away:'the north marsh',h:[6,15]},m40_yard:{out:'mowing the town\'s lawns',h:[7,15],wk:1}};
const LIFE={ok:false,who:{},items:{}};
// a number 0..1 from a string, the same every time
function lifeH(s){let h=2166136261;for(const c of String(s))h=Math.imul(h^c.charCodeAt(0),16777619);return (h>>>0)/4294967296}
// once the town is built and the characters are known: homes and jobs
function lifeInit(){if(LIFE.ok||typeof tf!=='object'||!tf.chars||!tf.chars.length)return false;
  const homes=TF_ROOMS.filter(R=>R.home).sort((a,b)=>a.x-b.x||a.z-b.z);if(!homes.length)return false;
  const adults=tf.chars.filter(c=>c.body!=='k').map(c=>c.id),used=new Set(),house={};
  const groups=LIFE_HOMES.map(g=>g.filter(id=>adults.includes(id))).filter(g=>g.length);
  for(const id of adults)if(!groups.some(g=>g.includes(id)))groups.push([id]);
  for(const g of groups){let i=Math.floor(lifeH(g[0]+'home')*homes.length);for(let t=0;t<homes.length&&used.has(i);t++)i=(i+1)%homes.length;used.add(i);for(const id of g)house[id]=homes[i%homes.length]}
  for(const id of adults){const R=house[id],G=TOWN_REGS.find(G=>G.look===id);let J=LIFE_JOBS[id]||null;
    if(G)J=G.si!=null?{si:G.si,reg:G}:{out:'out on their rounds',h:G.walk,reg:G};
    const room=J&&J.si!=null?TF_ROOMS.find(r=>r.si===J.si)||null:null;if(J&&J.si!=null)J.at=MAIN_SHOPS[J.si][0];
    // a counter's hours, a long day cut to an early or a late shift
    let h=J&&(J.h||room&&townHrs(room))||null;if(h&&!J.h&&!J.reg&&h[1]-h[0]>9)h=lifeH(id+'shift')<0.5?[h[0],h[0]+8]:[h[1]-8,h[1]];
    let st='',bd=1e9;if(R)SUB_STREETS.forEach((s,i)=>{const [ax,az,bx,bz]=s,dx=bx-ax,dz=bz-az,t=Math.max(0,Math.min(1,((R.x-ax)*dx+(R.z-az)*dz)/(dx*dx+dz*dz||1))),d=Math.hypot(ax+dx*t-R.x,az+dz*t-R.z);if(d<bd){bd=d;st=LIFE_ST[i]||''}});
    LIFE.who[id]={home:R,st,job:J,room,shift:h}}
  LIFE.ok=true;return true}
function lifeOf(id){if(!LIFE.ok&&!lifeInit())return null;return LIFE.who[id]||null}
// where they are in their day by the game clock: { s: work | away | out | home, w: in words }
function lifeNow(id){const L=lifeOf(id);if(!L)return {s:'out',w:'out and about'};const h=townHour(),J=L.job;
  const R=L.room,rest=lifeH(id+fuelDayNo()),on=J&&L.shift&&!(J.wk&&townWeekend())&&!(R&&R.kind==='office'&&R.si!==7&&R.si!==23&&townWeekend())&&rest>0.08;
  if(on){const [a,b]=L.shift,inn=x=>b>24?x>=a||x<b-24:x>=a&&x<b,at=J.away||J.at||J.out;
    if(inn(h)){if(J.out)return {s:'out',w:J.out};if(h>=12&&h<12.75&&b-a>=7&&!J.reg)return {s:'out',w:'on their lunch break from '+at};return {s:J.away?'away':'work',w:'at work at '+at}}
    if(inn((h+0.6)%24))return {s:'out',w:'on the way to work at '+at}}
  if(h<6||h>=23.5)return {s:'home',w:'at home asleep'};
  if(h<8&&rest<0.6||h>=20&&rest<0.55||h>=17.5&&h<19&&rest<0.3)return {s:'home',w:'at home'};
  return {s:'out',w:J?(on?'off work':'having a day off'):'out and about'}}
// tfLook's lean (townfolk.js): lower draws them. A counter's staff spot: whoever works it in their hours; a house: its
// people while they are home; the streets, a car, a customer: those out and about. Never a hard no.
function lifeScore(id,o){const L=lifeOf(id);if(!L||!o)return 0;const n=lifeNow(id).s,R=o.room;
  if(R&&!R.home&&o.spot&&o.spot.staff)return L.room===R&&n==='work'?-100:n==='out'?0:60;
  if(R&&R.home)return L.home===R&&n==='home'?-100:n==='out'?20:60;
  return n==='out'?0:60}
// the library's person with their life in it, for HumanForgeMind.card: a regular's own name and counter, where they
// live, where and when they work
function lifeItem(it,id){if(LIFE.items[id])return LIFE.items[id];const L=lifeOf(id);if(!L||!it||!it.mind)return it;
  const m=Object.assign({},it.mind),J=L.job,G=J&&J.reg,hr=L.shift?` (${townAmPm(L.shift[0]%24)} to ${townAmPm(L.shift[1]%24)})`:'';
  if(G){m.name=G.n;if(J.at)m.job='runs '+J.at}
  m.about=((m.about||'')+` Lives on ${L.st||'the island'}.`+(J?(J.out?` Works ${J.out.replace(/^(out )?/,'')}${hr}.`:` Works at ${J.away||J.at}${hr}${J.wk?', weekdays':''}.`):'')).trim().slice(0,300);
  return LIFE.items[id]=Object.assign({},it,{mind:m})}
// for a model: where they are in their day, as it really is (behind their counter, at home, or out)
function lifeScene(p,name){const L=lifeOf(p.body);if(!L)return '';const N=lifeNow(p.body);
  const w=p.room&&p.room===L.room?'at work':p.room&&p.room===L.home?'at home':p.room?'in a shop as a customer':N.s==='out'?N.w:'out on an errand';
  return `${name} lives on ${L.st} and is ${w} right now.`}

// ---------- what the town knows of you ----------
// the deeds: how much each counts (w, -100..100 for an opinion) and how it is told (s, of him)
const REP_K={shot:{w:-30,s:'he shot somebody in town'},cop:{w:-50,s:'he shot a police officer'},shots:{w:-6,s:'he was firing a gun in town'},
  cops:{w:-10,s:'the police were after him'},near:{w:-4,s:'he nearly ran somebody down in one of his machines'},
  kind:{w:1.5,s:'he stops to talk and he is friendly'},buy:{w:1,s:'he spends his money in town'},work:{w:3,s:'he works hard on the island'}};
const REP_HALF=4;   // game days for a deed to count half as much
const REP={d:[],kn:{},n:0,dirty:false,saveT:0,spreadT:0,day:-1};
try{const o=JSON.parse(localStorage.getItem('bhd_rep')||'null');if(o&&Array.isArray(o.d)){REP.d=o.d.filter(d=>d&&REP_K[d.k]).slice(-40);REP.n=+o.n||REP.d.length;
  if(o.kn&&typeof o.kn==='object')for(const b in o.kn)if(Array.isArray(o.kn[b]))REP.kn[b]=o.kn[b].filter(i=>REP.d.some(d=>d.i===i))}}catch(e){}
const repNow=()=>fuelDayNo()+townHour()/24;
function repKnows(b,i){return (REP.kn[b]||[]).includes(i)}
function repLearn(b,i){if(!b)return;const k=REP.kn[b]||(REP.kn[b]=[]);if(!k.includes(i)){k.push(i);REP.dirty=true}}
// something he did, seen by these (bodies) and anyone talking about town near him; the same kind again soon is the same deed
function repDeed(k,seen){if(!REP_K[k])return;const now=repNow(),day=Math.floor(now),daily=REP_K[k].w>0;
  let d=REP.d.find(d=>d.k===k&&(daily?Math.floor(d.t)===day:now-d.t<0.08));
  if(!d){d={i:++REP.n,k,t:now};REP.d.push(d);if(REP.d.length>40){const o=REP.d.shift();for(const b in REP.kn)REP.kn[b]=REP.kn[b].filter(i=>i!==o.i)}}
  else d.t=now;
  const who=new Set(seen||[]);if(typeof TALK==='object')for(const p of TALK.here)if(Math.hypot(p.x-wk.x,p.z-wk.z)<40)who.add(p.body);
  for(const b of who)repLearn(b,d.i);REP.dirty=true;return d}
// how much a deed counts now, fading
function repW(d){return REP_K[d.k].w*Math.pow(0.5,Math.max(0,repNow()-d.t)/REP_HALF)}
// what this person thinks of him, -100..100
function repOpinion(b){let v=0;for(const d of REP.d)if(repKnows(b,d.i))v+=repW(d);return Math.max(-100,Math.min(100,v))}
// what they know, in words, the weightiest first, with how long ago
function repHeard(b){const now=repNow();return REP.d.filter(d=>repKnows(b,d.i)&&Math.abs(repW(d))>=1).sort((a,c)=>Math.abs(repW(c))-Math.abs(repW(a))).slice(0,3)
  .map(d=>{const a=now-d.t;return REP_K[d.k].s+(a<0.04?' (just now)':a<1?' (today)':a<2?' (yesterday)':` (${Math.round(a)} days ago)`)})}
// for a model: what they have heard of him and how they feel
function repScene(p,name){const b=p.body,H=repHeard(b);if(!H.length)return '';const v=repOpinion(b);
  return `What ${name} has heard of him: ${H.join('; ')}. ${name} ${v<-45?'is afraid of him':v<-15?'is wary of him':v>25?'thinks well of him':v>8?'likes him':'has no strong feeling about him'}.`}
// someone tells someone else a deed the other has not heard (said aloud when near him: two talking among themselves)
function repGossip(p,q){if(!p||!q||typeof q!=='object'||REP.tell)return;
  const d=REP.d.filter(d=>repKnows(p.body,d.i)&&!repKnows(q.body,d.i)&&Math.abs(repW(d))>=2).sort((a,c)=>Math.abs(repW(c))-Math.abs(repW(a)))[0];if(!d)return;
  repLearn(q.body,d.i);const s=REP_K[d.k].s;REP.tell=true;
  setTimeout(()=>{REP.tell=false;if(!tf.people.includes(p)||p.dead||TALK.mode==='off')return;
    REP.tell=true;try{talkShow(p,{say:repSay(repW(d)<0?'rpGossipBad':'rpGossipGood',{deed:s})},q,null)}finally{REP.tell=false}},2600+Math.random()*1500)}
// now and then anywhere in town, out of earshot: one who knows tells one who does not (the bigger the deed, the faster)
function repSpread(){const ids=tf.chars?tf.chars.filter(c=>c.body!=='k').map(c=>c.id):[];if(ids.length<2)return;
  for(const d of REP.d){const w=Math.abs(repW(d));if(w<1)continue;const knew=ids.filter(b=>repKnows(b,d.i)),not=ids.filter(b=>!repKnows(b,d.i));
    if(knew.length&&not.length&&Math.random()<Math.min(0.6,w/25))repLearn(not[(Math.random()*not.length)|0],d.i)}}
// one of a line's ways of putting it (WORDS ids id1, id2, ...)
const REP_N={rpGossipBad:3,rpGossipGood:2,rpScared:2,rpWary:3,rpGlad:3};
function repSay(id,v){return say(id+(1+Math.floor(Math.random()*REP_N[id])),v)}
// walking up to someone: glad to see him, wary (a step back), or scared off (gun out and a bad name); false: as usual
function repMeet(p){const v=repOpinion(p.body);
  if(v<-15)TALK.shunT=performance.now()/1000;
  if(v<-45&&gunHas()){talkRun(p,wk.x,wk.z,5,TU.gunFlee);talkShow(p,{say:repSay('rpScared')},'you',null);return true}
  if(v<-25){talkRun(p,wk.x,wk.z,0.7,1.6);talkShow(p,{say:repSay('rpWary')},'you',null);return true}
  if(v>25&&Math.random()<0.5){talkFace(p,4);talkShow(p,{say:repSay('rpGlad')},'you',null);return true}
  return false}
// a counter's price: a friend's 5% off, 15% more from someone who fears or distrusts him (townOff, town.js)
function repPrice(p){if(!p)return 0;const v=repOpinion(p.body);return v>40?0.05:v<-40?-0.15:0}
// each frame: the day's work counts once a day, gossip spreads, the memory is saved now and then
function repTick(dt){const day=fuelDayNo();
  if(REP.day!==day){REP.day=day;REP.workDone=false}
  if(!REP.workDone&&typeof stats==='object'&&((stats.dDug||0)>4||(stats.dHaul||0)>4||(stats.dMow||0)>200)){REP.workDone=true;
    const ids=tf.chars?tf.chars.filter(c=>c.body!=='k').map(c=>c.id):[];repDeed('work',ids.filter(()=>Math.random()<0.25))}
  if((REP.spreadT+=dt)>45){REP.spreadT=0;if(REP.d.length)repSpread()}
  if(REP.dirty&&(REP.saveT+=dt)>5){REP.saveT=0;REP.dirty=false;try{localStorage.setItem('bhd_rep',JSON.stringify({d:REP.d,kn:REP.kn,n:REP.n}))}catch(e){}}}
