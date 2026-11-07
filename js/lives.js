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
// Who has seen you in the shops (FMEM, below, saved with REP): those in a shop with you remember it and what you bought.
// Game scripts share one global scope and load in index.html order; see CLAUDE.md.

// ---------- daily lives ----------
// the neighbourhood streets' names, by SUB_STREETS index (suburbs.js)
const LIFE_ST=['Magnolia Lane','Magnolia Lane','Cypress Street','Cypress Street','Live Oak Drive','Gull Street','Pelican Avenue','Heron Street','Pine Court',
  'Bayou Lane','Shrimp Boat Road','Marsh Drive','Egret Court'];
// who lives together (by look; the teens with their families, library.json's minds); everyone else grown has a house
// of their own; children are not placed
const LIFE_HOMES=[['cal_f','cal_m'],['f80_jacket','m60_cap'],['f45_mom','m17_hoops','f15_pack','m14_pack'],['m40_yard','m15_skate'],['f50_scrubs','f16_teen']];
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
  kind:{w:1.5,s:'he stops to talk and he is friendly'},buy:{w:1,s:'he spends his money in town'},seen:{w:0.5,s:'he is often about the shops in town'},work:{w:3,s:'he works hard on the island'}};
const REP_HALF=4;   // game days for a deed to count half as much
const REP={d:[],kn:{},n:0,dirty:false,saveT:0,spreadT:0,day:-1};
// who has seen you in the shops (below): by look, { n: times in a shop together (fading), t: the last time, s: [[game day,
// the shop, what you bought or '', said yet 0/1], ... the last FMEM_N], k: 1 once they have told you their name }
const FMEM={w:{},R:null,cur:new Set(),T:0,famT:{},talkT:0,talkK:null},FMEM_N=3,FMEM_EP=0.1;
try{const o=JSON.parse(localStorage.getItem('bhd_rep')||'null');if(o&&Array.isArray(o.d)){REP.d=o.d.filter(d=>d&&REP_K[d.k]).slice(-40);REP.n=+o.n||REP.d.length;
  if(o.kn&&typeof o.kn==='object')for(const b in o.kn)if(Array.isArray(o.kn[b]))REP.kn[b]=o.kn[b].filter(i=>REP.d.some(d=>d.i===i))}
  if(o&&o.fm&&typeof o.fm==='object')for(const b in o.fm){const w=o.fm[b];if(!w||typeof w!=='object'||!/^\w{1,24}$/.test(b))continue;
    FMEM.w[b]={n:Math.min(99,Math.max(0,+w.n||0)),t:isFinite(w.t)?+w.t:0,k:w.k?1:0,
      s:(Array.isArray(w.s)?w.s:[]).filter(e=>Array.isArray(e)&&isFinite(e[0])&&typeof e[1]==='string').slice(-FMEM_N).map(e=>[+e[0],e[1].slice(0,40),String(e[2]||'').slice(0,40),e[3]?1:0])}}}catch(e){}
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
  if((FMEM.T+=dt)>0.3){fmTick();FMEM.T=0}
  if(REP.dirty&&(REP.saveT+=dt)>5){REP.saveT=0;REP.dirty=false;fmPrune();try{localStorage.setItem('bhd_rep',JSON.stringify({d:REP.d,kn:REP.kn,n:REP.n,fm:FMEM.w}))}catch(e){}}}


// ---------- who has seen you in the shops ----------
// Whoever is in a shop's room while the worker is in it (staff and customers, those walking in or out too) remembers it:
// which shop, when, and what he bought there if he did (townPay, town.js). Kept per look in FMEM (saved in bhd_rep, so it
// syncs with the town's memory), the last FMEM_N times each, a visit within FMEM_EP game days of the last at the same shop
// being the same one; forgotten after TU.memDays game days. It comes up when they meet him again (fmLine: now and then,
// by how long ago and what he bought; a clerk back at their own counter; a familiar face once they have been in the
// shops together TU.memFamiliar times, fading like REP), a model hears it (fmScene), and it is a small friendly deed
// (REP_K.seen). Their name: strangers stay Passerby, Kid or Clerk until they have told it on a first talk (fmKnown).
function fmTick(){const R=mode==='walk'&&typeof walker==='object'&&walker.visible&&typeof town==='object'?town.wel:null;
  if(R!==FMEM.R){FMEM.R=R;FMEM.cur.clear()}if(!R||!tf.on||Math.hypot(wk.x-R.x,wk.z-R.z)>R.r)return;const seen=[];
  for(const p of tf.people){if(p.dead||p.drv||p.cop||FMEM.cur.has(p)||!(p.room===R||p.go&&p.go.R===R&&Math.hypot(p.x-R.x,p.z-R.z)<R.r))continue;
    FMEM.cur.add(p);if(fmSee(p.body,townShopName(R),''))seen.push(p.body)}
  if(seen.length)repDeed('seen',seen)}
// b saw him at this shop now (item: what he bought); true when it is a new time together
function fmSee(b,shop,item){if(!b)return false;const now=repNow(),w=FMEM.w[b]||(FMEM.w[b]={n:0,t:now,s:[],k:0});
  let e=w.s.find(e=>e[1]===shop&&now-e[0]<FMEM_EP),fresh=!e;
  if(fresh){w.n=w.n*Math.pow(0.5,Math.max(0,now-w.t)/(REP_HALF*2))+1;e=[0,shop,'',0];w.s.push(e);if(w.s.length>FMEM_N)w.s.shift()}
  e[0]=Math.round(now*1000)/1000;if(item){e[2]=String(item).slice(0,40);e[3]=0}w.t=e[0];REP.dirty=true;return fresh}
// he paid for something (townPay): everyone in the room with him sees it, and the one who served him
function fmBuy(item){const S=typeof town==='object'?town.shop:null;let R=town.wel||S&&S.R;
  if(!R)for(const Q of TF_ROOMS)if(!Q.home&&Math.hypot(wk.x-Q.x,wk.z-Q.z)<Q.r&&Math.abs(wk.y-(Q.y??wk.y))<1.6){R=Q;break}
  if(!R)return;const shop=townShopName(R),who=new Set();if(S&&S.p&&!S.p.dead)who.add(S.p.body);
  for(const p of tf.people)if(!p.dead&&!p.drv&&!p.cop&&p.room===R)who.add(p.body);
  for(const b of who)fmSee(b,shop,item)}
// forget what is past TU.memDays, and anyone with nothing left to remember
function fmPrune(){const now=repNow(),D=TU.memDays??7;
  for(const b in FMEM.w){const w=FMEM.w[b];w.s=w.s.filter(e=>now-e[0]<D);w.n=Math.round(w.n*Math.pow(0.5,Math.max(0,now-w.t)/(REP_HALF*2))*100)/100;w.t=Math.round(now*1000)/1000;
    if(!w.s.length&&w.n<0.3&&!w.k)delete FMEM.w[b]}}
// a line's ways of putting it: id1, id2, ... as many as WORDS has
function fmSay(id,v){let n=0;while(WORDS_BY[id+(n+1)])n++;return say(id+(1+Math.floor(Math.random()*Math.max(1,n))),v)}
// what he bought was something to eat or drink (a menu's pick-me-up)
function fmEat(item){for(const k in TOWN_MENU)for(const m of TOWN_MENU[k])if(m[0]===item)return m[2]==='p';return TOWN_BREW.some(m=>m[0]===item&&m[2]==='p')||/coffee|latte|beer|lager|soda|pie|roll|sandwich|burger|water/i.test(item)}
// what he bought, as said in a line ('the {item}'): 'Kayak, an hour' a kayak, 'Mail a letter' the letter
function fmItem(t){t=String(t||'').replace(/,.*$/,'').replace(/^(mail|ship|wash|dry|borrow) an? /i,'').replace(/^a night's stay$/i,'room');return t.charAt(0).toLowerCase()+t.slice(1)}
// when it was, in words
function fmWhen(t){const now=repNow(),d0=Math.floor(now),d=Math.floor(t),h=(t-d)*24;
  return d===d0?(now-t<0.08?'just now':h<12?'this morning':h<17?'this afternoon':'this evening'):d===d0-1?(h<17?'yesterday':'last night'):'the other day'}
// what p says about it when they meet him (null: nothing to say). R: the room they are in now (a clerk at their own
// counter says it as a welcome back). Each time is brought up once; a familiar face now and then after that.
function fmLine(p,R){const b=p&&p.body,w=b&&FMEM.w[b];if(!w)return null;const now=repNow(),kid=typeof talkKid==='function'&&talkKid(p);
  const e=w.s.filter(e=>!e[3]&&now-e[0]<(TU.memDays??7)&&now-e[0]>0.02).pop();
  if(e){e[3]=1;REP.dirty=true;const when=fmWhen(e[0]),old=Math.floor(e[0])<Math.floor(now),item=fmItem(e[2]),v={shop:e[1],when,item};
    if(kid)return fmSay(item?'fmKidBuy':'fmKid',v);
    if(R&&e[1]===townShopName(R)&&p.spot&&p.spot.staff)return fmSay(item?'fmBackBuy':'fmBack',v);
    return fmSay((item?fmEat(e[2])?'fmEat':'fmGot':'fmSaw')+(old?'Old':'Now'),v)}
  const t=performance.now()/1000;
  if(w.n*Math.pow(0.5,Math.max(0,now-w.t)/(REP_HALF*2))>=(TU.memFamiliar??3)&&t-(FMEM.famT[b]||-1e9)>120){FMEM.famT[b]=t;return fmSay(kid?'fmKidFam':'fmFamiliar',{})}
  return null}
// they have told him their name: a first talk (townTalk, the talk box), a regular he has met, or a past conversation
// kept by the talk runtime (bhd_talk_on-talk: name|age|sex)
function fmKnown(p){if(!p||typeof p!=='object')return false;if(p.reg)return !!town.met[p.reg.id];const w=FMEM.w[p.body];if(w&&w.k)return true;
  const n=fmName(p);if(!n)return false;const t=performance.now()/1000;
  if(!FMEM.talkK||t-FMEM.talkT>10){FMEM.talkT=t;try{FMEM.talkK=Object.keys(JSON.parse(localStorage.getItem('bhd_talk_on-talk')||'{}')||{})}catch(e){FMEM.talkK=[]}}
  return FMEM.talkK.some(k=>k.startsWith(n+'|'))}
function fmIntro(b){const w=FMEM.w[b]||(FMEM.w[b]={n:0,t:repNow(),s:[],k:0});if(!w.k){w.k=1;REP.dirty=true}}
// their own name (the library's mind, a regular's own), '' if the library is not in yet
function fmName(p){if(p.reg)return townFirst(p.reg);if(typeof talkLib==='function')talkLib();const k=typeof talkKid==='function'&&talkKid(p);if(k)return k.name;
  const it=TALK.lib&&TALK.lib['island_'+p.body];return it&&it.mind?(typeof lifeItem==='function'?lifeItem(it,p.body):it).mind.name||'':''}
// what to call them on screen: their name once they have told it, else the stranger's word (Passerby, Kid, Clerk)
function fmWho(p,other){return fmKnown(p)&&fmName(p)||other}
// for a model: where they have seen him lately and what he bought, and whether they know his face
function fmScene(p,name){const w=p&&FMEM.w[p.body];if(!w)return '';const now=repNow(),D=TU.memDays??7;
  const S=w.s.filter(e=>now-e[0]<D&&now-e[0]>0.01).slice(-2).map(e=>`at ${e[1]} ${fmWhen(e[0])}`+(e[2]?` (he got the ${fmItem(e[2])} there)`:''));
  const n=w.n*Math.pow(0.5,Math.max(0,now-w.t)/(REP_HALF*2)),fam=n>=(TU.memFamiliar??3);
  if(!S.length&&!fam)return '';return `${name} ${S.length?'saw him '+S.join(' and '):''}${S.length&&fam?'; ':''}${fam?'has been in the shops with him often enough to know his face':''}.`}
// walking up to someone who has seen him in the shops: now and then (TU.memSay) they bring it up; true if they did
function fmGreet(p){if(Math.random()>=(TU.memSay??0.4))return false;const l=fmLine(p,p.room);if(!l)return false;talkFace(p,4);talkShow(p,{say:l},'you',null);return true}
